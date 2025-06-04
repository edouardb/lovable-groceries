
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, groceryListsTable, groceryItemsTable } from '../db/schema';
import { type UpdateGroceryItemInput } from '../schema';
import { updateGroceryItem } from '../handlers/update_grocery_item';
import { eq } from 'drizzle-orm';

describe('updateGroceryItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let otherUserId: number;
  let testCategoryId: number;
  let testListId: number;
  let testItemId: number;

  beforeEach(async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'test@example.com',
          password_hash: 'hash123',
          first_name: 'Test',
          last_name: 'User'
        },
        {
          email: 'other@example.com',
          password_hash: 'hash456',
          first_name: 'Other',
          last_name: 'User'
        }
      ])
      .returning()
      .execute();
    
    testUserId = users[0].id;
    otherUserId = users[1].id;

    // Create test category
    const categories = await db.insert(categoriesTable)
      .values({
        name: 'Produce',
        color: '#00FF00',
        sort_order: 1
      })
      .returning()
      .execute();
    
    testCategoryId = categories[0].id;

    // Create test grocery list
    const lists = await db.insert(groceryListsTable)
      .values({
        user_id: testUserId,
        name: 'Weekly Shopping',
        description: 'My weekly grocery list'
      })
      .returning()
      .execute();
    
    testListId = lists[0].id;

    // Create test grocery item
    const items = await db.insert(groceryItemsTable)
      .values({
        grocery_list_id: testListId,
        category_id: testCategoryId,
        name: 'Apples',
        quantity: '2 lbs',
        notes: 'Red apples preferred',
        is_purchased: false,
        is_favorite: false,
        sort_order: 1
      })
      .returning()
      .execute();
    
    testItemId = items[0].id;
  });

  it('should update grocery item with all fields', async () => {
    const input: UpdateGroceryItemInput = {
      id: testItemId,
      category_id: null,
      name: 'Green Apples',
      quantity: '3 lbs',
      notes: 'Granny Smith variety',
      is_purchased: true,
      is_favorite: true,
      sort_order: 2
    };

    const result = await updateGroceryItem(input, testUserId);

    expect(result.id).toEqual(testItemId);
    expect(result.category_id).toBeNull();
    expect(result.name).toEqual('Green Apples');
    expect(result.quantity).toEqual('3 lbs');
    expect(result.notes).toEqual('Granny Smith variety');
    expect(result.is_purchased).toBe(true);
    expect(result.is_favorite).toBe(true);
    expect(result.sort_order).toEqual(2);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update grocery item with partial fields', async () => {
    const input: UpdateGroceryItemInput = {
      id: testItemId,
      name: 'Organic Apples',
      is_purchased: true
    };

    const result = await updateGroceryItem(input, testUserId);

    expect(result.id).toEqual(testItemId);
    expect(result.name).toEqual('Organic Apples');
    expect(result.is_purchased).toBe(true);
    // Other fields should remain unchanged
    expect(result.category_id).toEqual(testCategoryId);
    expect(result.quantity).toEqual('2 lbs');
    expect(result.notes).toEqual('Red apples preferred');
    expect(result.is_favorite).toBe(false);
    expect(result.sort_order).toEqual(1);
  });

  it('should persist changes to database', async () => {
    const input: UpdateGroceryItemInput = {
      id: testItemId,
      name: 'Updated Apples',
      is_purchased: true
    };

    await updateGroceryItem(input, testUserId);

    const items = await db.select()
      .from(groceryItemsTable)
      .where(eq(groceryItemsTable.id, testItemId))
      .execute();

    expect(items).toHaveLength(1);
    expect(items[0].name).toEqual('Updated Apples');
    expect(items[0].is_purchased).toBe(true);
    expect(items[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when item does not exist', async () => {
    const input: UpdateGroceryItemInput = {
      id: 99999,
      name: 'Non-existent Item'
    };

    expect(updateGroceryItem(input, testUserId)).rejects.toThrow(/not found or access denied/i);
  });

  it('should throw error when user does not own the grocery list', async () => {
    const input: UpdateGroceryItemInput = {
      id: testItemId,
      name: 'Unauthorized Update'
    };

    expect(updateGroceryItem(input, otherUserId)).rejects.toThrow(/not found or access denied/i);
  });

  it('should handle nullable fields correctly', async () => {
    const input: UpdateGroceryItemInput = {
      id: testItemId,
      category_id: null,
      quantity: null,
      notes: null
    };

    const result = await updateGroceryItem(input, testUserId);

    expect(result.category_id).toBeNull();
    expect(result.quantity).toBeNull();
    expect(result.notes).toBeNull();
  });
});
