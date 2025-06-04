
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, groceryListsTable, groceryItemsTable } from '../db/schema';
import { deleteGroceryList } from '../handlers/delete_grocery_list';
import { eq } from 'drizzle-orm';

describe('deleteGroceryList', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let otherUserId: number;
  let testListId: number;

  beforeEach(async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'test@example.com',
          password_hash: 'hashedpassword',
          first_name: 'Test',
          last_name: 'User'
        },
        {
          email: 'other@example.com',
          password_hash: 'hashedpassword',
          first_name: 'Other',
          last_name: 'User'
        }
      ])
      .returning()
      .execute();

    testUserId = users[0].id;
    otherUserId = users[1].id;

    // Create test grocery list
    const lists = await db.insert(groceryListsTable)
      .values({
        user_id: testUserId,
        name: 'Test Shopping List',
        description: 'A test list'
      })
      .returning()
      .execute();

    testListId = lists[0].id;

    // Create grocery items for the list to test cascade deletion
    await db.insert(groceryItemsTable)
      .values([
        {
          grocery_list_id: testListId,
          name: 'Test Item 1',
          quantity: '2'
        },
        {
          grocery_list_id: testListId,
          name: 'Test Item 2',
          quantity: '1'
        }
      ])
      .execute();
  });

  it('should delete grocery list successfully', async () => {
    // Verify list exists before deletion
    const beforeDelete = await db.select()
      .from(groceryListsTable)
      .where(eq(groceryListsTable.id, testListId))
      .execute();
    expect(beforeDelete).toHaveLength(1);

    // Delete the list
    await deleteGroceryList(testListId, testUserId);

    // Verify list is deleted
    const afterDelete = await db.select()
      .from(groceryListsTable)
      .where(eq(groceryListsTable.id, testListId))
      .execute();
    expect(afterDelete).toHaveLength(0);
  });

  it('should cascade delete grocery items when list is deleted', async () => {
    // Verify items exist before deletion
    const beforeDelete = await db.select()
      .from(groceryItemsTable)
      .where(eq(groceryItemsTable.grocery_list_id, testListId))
      .execute();
    expect(beforeDelete).toHaveLength(2);

    // Delete the list
    await deleteGroceryList(testListId, testUserId);

    // Verify items are cascade deleted
    const afterDelete = await db.select()
      .from(groceryItemsTable)
      .where(eq(groceryItemsTable.grocery_list_id, testListId))
      .execute();
    expect(afterDelete).toHaveLength(0);
  });

  it('should throw error when list does not exist', async () => {
    const nonExistentListId = 99999;

    await expect(deleteGroceryList(nonExistentListId, testUserId))
      .rejects.toThrow(/grocery list not found or access denied/i);
  });

  it('should throw error when user does not own the list', async () => {
    // Try to delete list with wrong user ID
    await expect(deleteGroceryList(testListId, otherUserId))
      .rejects.toThrow(/grocery list not found or access denied/i);

    // Verify list still exists
    const afterAttempt = await db.select()
      .from(groceryListsTable)
      .where(eq(groceryListsTable.id, testListId))
      .execute();
    expect(afterAttempt).toHaveLength(1);
  });

  it('should not affect other users lists', async () => {
    // Create another list for different user
    const otherUserList = await db.insert(groceryListsTable)
      .values({
        user_id: otherUserId,
        name: 'Other User List',
        description: 'Should not be deleted'
      })
      .returning()
      .execute();

    const otherListId = otherUserList[0].id;

    // Delete test user's list
    await deleteGroceryList(testListId, testUserId);

    // Verify other user's list is unaffected
    const otherList = await db.select()
      .from(groceryListsTable)
      .where(eq(groceryListsTable.id, otherListId))
      .execute();
    expect(otherList).toHaveLength(1);
    expect(otherList[0].name).toEqual('Other User List');
  });
});
