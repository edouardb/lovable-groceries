
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, groceryListsTable } from '../db/schema';
import { type UpdateGroceryListInput } from '../schema';
import { updateGroceryList } from '../handlers/update_grocery_list';
import { eq, and } from 'drizzle-orm';

describe('updateGroceryList', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testListId: number;
  let otherUserId: number;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create another user for security testing
    const otherUserResult = await db.insert(usersTable)
      .values({
        email: 'other@example.com',
        password_hash: 'hashedpassword',
        first_name: 'Other',
        last_name: 'User'
      })
      .returning()
      .execute();
    otherUserId = otherUserResult[0].id;

    // Create test grocery list
    const listResult = await db.insert(groceryListsTable)
      .values({
        user_id: testUserId,
        name: 'Original List',
        description: 'Original description',
        is_active: true
      })
      .returning()
      .execute();
    testListId = listResult[0].id;
  });

  it('should update grocery list name', async () => {
    const input: UpdateGroceryListInput = {
      id: testListId,
      name: 'Updated List Name'
    };

    const result = await updateGroceryList(input, testUserId);

    expect(result.id).toEqual(testListId);
    expect(result.name).toEqual('Updated List Name');
    expect(result.description).toEqual('Original description'); // unchanged
    expect(result.is_active).toEqual(true); // unchanged
    expect(result.user_id).toEqual(testUserId);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update grocery list description', async () => {
    const input: UpdateGroceryListInput = {
      id: testListId,
      description: 'Updated description'
    };

    const result = await updateGroceryList(input, testUserId);

    expect(result.id).toEqual(testListId);
    expect(result.name).toEqual('Original List'); // unchanged
    expect(result.description).toEqual('Updated description');
    expect(result.is_active).toEqual(true); // unchanged
  });

  it('should update grocery list active status', async () => {
    const input: UpdateGroceryListInput = {
      id: testListId,
      is_active: false
    };

    const result = await updateGroceryList(input, testUserId);

    expect(result.id).toEqual(testListId);
    expect(result.name).toEqual('Original List'); // unchanged
    expect(result.description).toEqual('Original description'); // unchanged
    expect(result.is_active).toEqual(false);
  });

  it('should update multiple fields at once', async () => {
    const input: UpdateGroceryListInput = {
      id: testListId,
      name: 'Multi Update',
      description: 'Multiple fields updated',
      is_active: false
    };

    const result = await updateGroceryList(input, testUserId);

    expect(result.id).toEqual(testListId);
    expect(result.name).toEqual('Multi Update');
    expect(result.description).toEqual('Multiple fields updated');
    expect(result.is_active).toEqual(false);
    expect(result.user_id).toEqual(testUserId);
  });

  it('should set description to null', async () => {
    const input: UpdateGroceryListInput = {
      id: testListId,
      description: null
    };

    const result = await updateGroceryList(input, testUserId);

    expect(result.description).toBeNull();
  });

  it('should save updates to database', async () => {
    const input: UpdateGroceryListInput = {
      id: testListId,
      name: 'Database Test'
    };

    await updateGroceryList(input, testUserId);

    const lists = await db.select()
      .from(groceryListsTable)
      .where(eq(groceryListsTable.id, testListId))
      .execute();

    expect(lists).toHaveLength(1);
    expect(lists[0].name).toEqual('Database Test');
    expect(lists[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when list not found', async () => {
    const input: UpdateGroceryListInput = {
      id: 99999,
      name: 'Non-existent'
    };

    await expect(updateGroceryList(input, testUserId))
      .rejects.toThrow(/not found or access denied/i);
  });

  it('should throw error when accessing another users list', async () => {
    const input: UpdateGroceryListInput = {
      id: testListId,
      name: 'Unauthorized Update'
    };

    await expect(updateGroceryList(input, otherUserId))
      .rejects.toThrow(/not found or access denied/i);
  });

  it('should update timestamp on every update', async () => {
    // Get original timestamp
    const originalList = await db.select()
      .from(groceryListsTable)
      .where(eq(groceryListsTable.id, testListId))
      .execute();
    const originalTimestamp = originalList[0].updated_at;

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const input: UpdateGroceryListInput = {
      id: testListId,
      name: 'Timestamp Test'
    };

    const result = await updateGroceryList(input, testUserId);

    expect(result.updated_at.getTime()).toBeGreaterThan(originalTimestamp.getTime());
  });
});
