
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, groceryListsTable, groceryItemsTable, categoriesTable } from '../db/schema';
import { getGroceryListWithItems } from '../handlers/get_grocery_list_with_items';

describe('getGroceryListWithItems', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get grocery list with items', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();
    const userId = users[0].id;

    // Create test grocery list
    const lists = await db.insert(groceryListsTable)
      .values({
        user_id: userId,
        name: 'Weekly Groceries',
        description: 'My weekly shopping list'
      })
      .returning()
      .execute();
    const listId = lists[0].id;

    // Create test category
    const categories = await db.insert(categoriesTable)
      .values({
        name: 'Produce',
        color: '#00FF00'
      })
      .returning()
      .execute();
    const categoryId = categories[0].id;

    // Create test items
    await db.insert(groceryItemsTable)
      .values([
        {
          grocery_list_id: listId,
          category_id: categoryId,
          name: 'Apples',
          quantity: '2 lbs',
          notes: 'Red apples',
          is_purchased: false,
          is_favorite: true,
          sort_order: 1
        },
        {
          grocery_list_id: listId,
          category_id: null,
          name: 'Milk',
          quantity: '1 gallon',
          notes: null,
          is_purchased: true,
          is_favorite: false,
          sort_order: 2
        }
      ])
      .execute();

    const result = await getGroceryListWithItems(listId, userId);

    // Verify grocery list properties
    expect(result.id).toEqual(listId);
    expect(result.user_id).toEqual(userId);
    expect(result.name).toEqual('Weekly Groceries');
    expect(result.description).toEqual('My weekly shopping list');
    expect(result.is_active).toEqual(true);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify items array
    expect(result.items).toHaveLength(2);

    // Verify first item
    const firstItem = result.items.find(item => item.name === 'Apples');
    expect(firstItem).toBeDefined();
    expect(firstItem!.grocery_list_id).toEqual(listId);
    expect(firstItem!.category_id).toEqual(categoryId);
    expect(firstItem!.quantity).toEqual('2 lbs');
    expect(firstItem!.notes).toEqual('Red apples');
    expect(firstItem!.is_purchased).toEqual(false);
    expect(firstItem!.is_favorite).toEqual(true);
    expect(firstItem!.sort_order).toEqual(1);

    // Verify second item
    const secondItem = result.items.find(item => item.name === 'Milk');
    expect(secondItem).toBeDefined();
    expect(secondItem!.grocery_list_id).toEqual(listId);
    expect(secondItem!.category_id).toBeNull();
    expect(secondItem!.quantity).toEqual('1 gallon');
    expect(secondItem!.notes).toBeNull();
    expect(secondItem!.is_purchased).toEqual(true);
    expect(secondItem!.is_favorite).toEqual(false);
    expect(secondItem!.sort_order).toEqual(2);
  });

  it('should return empty items array for list with no items', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();
    const userId = users[0].id;

    // Create test grocery list without items
    const lists = await db.insert(groceryListsTable)
      .values({
        user_id: userId,
        name: 'Empty List',
        description: null
      })
      .returning()
      .execute();
    const listId = lists[0].id;

    const result = await getGroceryListWithItems(listId, userId);

    expect(result.id).toEqual(listId);
    expect(result.name).toEqual('Empty List');
    expect(result.description).toBeNull();
    expect(result.items).toHaveLength(0);
  });

  it('should throw error when list does not exist', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();
    const userId = users[0].id;

    await expect(getGroceryListWithItems(999, userId)).rejects.toThrow(/not found/i);
  });

  it('should throw error when user tries to access another users list', async () => {
    // Create two test users
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'user1@example.com',
          password_hash: 'hashedpassword',
          first_name: 'User',
          last_name: 'One'
        },
        {
          email: 'user2@example.com',
          password_hash: 'hashedpassword',
          first_name: 'User',
          last_name: 'Two'
        }
      ])
      .returning()
      .execute();
    const user1Id = users[0].id;
    const user2Id = users[1].id;

    // Create grocery list for user 1
    const lists = await db.insert(groceryListsTable)
      .values({
        user_id: user1Id,
        name: 'User 1 List',
        description: null
      })
      .returning()
      .execute();
    const listId = lists[0].id;

    // User 2 tries to access user 1's list
    await expect(getGroceryListWithItems(listId, user2Id)).rejects.toThrow(/not found/i);
  });
});
