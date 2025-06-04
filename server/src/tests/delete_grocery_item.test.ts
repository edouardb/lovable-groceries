
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, groceryListsTable, groceryItemsTable } from '../db/schema';
import { deleteGroceryItem } from '../handlers/delete_grocery_item';
import { eq } from 'drizzle-orm';

describe('deleteGroceryItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a grocery item', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test grocery list
    const listResult = await db.insert(groceryListsTable)
      .values({
        user_id: userId,
        name: 'Test List',
        description: 'A test list'
      })
      .returning()
      .execute();
    const listId = listResult[0].id;

    // Create test grocery item
    const itemResult = await db.insert(groceryItemsTable)
      .values({
        grocery_list_id: listId,
        name: 'Test Item',
        quantity: '2 lbs',
        notes: 'Test notes'
      })
      .returning()
      .execute();
    const itemId = itemResult[0].id;

    // Delete the item
    await deleteGroceryItem(itemId, userId);

    // Verify the item was deleted
    const items = await db.select()
      .from(groceryItemsTable)
      .where(eq(groceryItemsTable.id, itemId))
      .execute();

    expect(items).toHaveLength(0);
  });

  it('should throw error when item does not exist', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    const nonExistentItemId = 99999;

    await expect(deleteGroceryItem(nonExistentItemId, userId))
      .rejects.toThrow(/grocery item not found/i);
  });

  it('should throw error when user tries to delete item from another user\'s list', async () => {
    // Create first user and their list/item
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        password_hash: 'hashed_password',
        first_name: 'User',
        last_name: 'One'
      })
      .returning()
      .execute();
    const user1Id = user1Result[0].id;

    // Create second user
    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashed_password',
        first_name: 'User',
        last_name: 'Two'
      })
      .returning()
      .execute();
    const user2Id = user2Result[0].id;

    // Create grocery list for user1
    const listResult = await db.insert(groceryListsTable)
      .values({
        user_id: user1Id,
        name: 'User1 List',
        description: 'User1\'s list'
      })
      .returning()
      .execute();
    const listId = listResult[0].id;

    // Create grocery item in user1's list
    const itemResult = await db.insert(groceryItemsTable)
      .values({
        grocery_list_id: listId,
        name: 'User1 Item',
        quantity: '1 piece'
      })
      .returning()
      .execute();
    const itemId = itemResult[0].id;

    // Try to delete user1's item as user2
    await expect(deleteGroceryItem(itemId, user2Id))
      .rejects.toThrow(/unauthorized.*cannot delete item/i);

    // Verify the item still exists
    const items = await db.select()
      .from(groceryItemsTable)
      .where(eq(groceryItemsTable.id, itemId))
      .execute();

    expect(items).toHaveLength(1);
    expect(items[0].name).toEqual('User1 Item');
  });

  it('should successfully delete item when user owns the list', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'owner@example.com',
        password_hash: 'hashed_password',
        first_name: 'Owner',
        last_name: 'User'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create grocery list
    const listResult = await db.insert(groceryListsTable)
      .values({
        user_id: userId,
        name: 'Owner List',
        description: 'Owner\'s list'
      })
      .returning()
      .execute();
    const listId = listResult[0].id;

    // Create multiple items
    const item1Result = await db.insert(groceryItemsTable)
      .values({
        grocery_list_id: listId,
        name: 'Item to Delete',
        quantity: '1 kg'
      })
      .returning()
      .execute();
    const itemToDeleteId = item1Result[0].id;

    const item2Result = await db.insert(groceryItemsTable)
      .values({
        grocery_list_id: listId,
        name: 'Item to Keep',
        quantity: '2 lbs'
      })
      .returning()
      .execute();
    const itemToKeepId = item2Result[0].id;

    // Delete one item
    await deleteGroceryItem(itemToDeleteId, userId);

    // Verify only the targeted item was deleted
    const deletedItems = await db.select()
      .from(groceryItemsTable)
      .where(eq(groceryItemsTable.id, itemToDeleteId))
      .execute();

    const remainingItems = await db.select()
      .from(groceryItemsTable)
      .where(eq(groceryItemsTable.id, itemToKeepId))
      .execute();

    expect(deletedItems).toHaveLength(0);
    expect(remainingItems).toHaveLength(1);
    expect(remainingItems[0].name).toEqual('Item to Keep');
  });
});
