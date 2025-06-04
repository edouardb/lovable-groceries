
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, groceryListsTable, groceryItemsTable } from '../db/schema';
import { type CreateGroceryItemInput } from '../schema';
import { createGroceryItem } from '../handlers/create_grocery_item';
import { eq } from 'drizzle-orm';

// Test data setup helpers
const createTestUser = async () => {
  const result = await db.insert(usersTable)
    .values({
      email: 'test@example.com',
      password_hash: 'hashed_password',
      first_name: 'Test',
      last_name: 'User'
    })
    .returning()
    .execute();
  return result[0];
};

const createTestCategory = async () => {
  const result = await db.insert(categoriesTable)
    .values({
      name: 'Test Category',
      color: '#FF0000',
      icon: 'test-icon',
      sort_order: 0
    })
    .returning()
    .execute();
  return result[0];
};

const createTestGroceryList = async (userId: number) => {
  const result = await db.insert(groceryListsTable)
    .values({
      user_id: userId,
      name: 'Test Grocery List',
      description: 'A test grocery list'
    })
    .returning()
    .execute();
  return result[0];
};

describe('createGroceryItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a grocery item with all fields', async () => {
    const user = await createTestUser();
    const category = await createTestCategory();
    const groceryList = await createTestGroceryList(user.id);

    const testInput: CreateGroceryItemInput = {
      grocery_list_id: groceryList.id,
      category_id: category.id,
      name: 'Test Item',
      quantity: '2 lbs',
      notes: 'Test notes',
      is_favorite: true
    };

    const result = await createGroceryItem(testInput, user.id);

    // Basic field validation
    expect(result.grocery_list_id).toEqual(groceryList.id);
    expect(result.category_id).toEqual(category.id);
    expect(result.name).toEqual('Test Item');
    expect(result.quantity).toEqual('2 lbs');
    expect(result.notes).toEqual('Test notes');
    expect(result.is_purchased).toEqual(false);
    expect(result.is_favorite).toEqual(true);
    expect(result.sort_order).toEqual(0);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a grocery item with minimal fields', async () => {
    const user = await createTestUser();
    const groceryList = await createTestGroceryList(user.id);

    const testInput: CreateGroceryItemInput = {
      grocery_list_id: groceryList.id,
      name: 'Minimal Item'
    };

    const result = await createGroceryItem(testInput, user.id);

    expect(result.grocery_list_id).toEqual(groceryList.id);
    expect(result.category_id).toBeNull();
    expect(result.name).toEqual('Minimal Item');
    expect(result.quantity).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.is_purchased).toEqual(false);
    expect(result.is_favorite).toEqual(false);
    expect(result.sort_order).toEqual(0);
  });

  it('should save grocery item to database', async () => {
    const user = await createTestUser();
    const groceryList = await createTestGroceryList(user.id);

    const testInput: CreateGroceryItemInput = {
      grocery_list_id: groceryList.id,
      name: 'Database Test Item',
      quantity: '1 piece'
    };

    const result = await createGroceryItem(testInput, user.id);

    // Query using proper drizzle syntax
    const groceryItems = await db.select()
      .from(groceryItemsTable)
      .where(eq(groceryItemsTable.id, result.id))
      .execute();

    expect(groceryItems).toHaveLength(1);
    expect(groceryItems[0].name).toEqual('Database Test Item');
    expect(groceryItems[0].quantity).toEqual('1 piece');
    expect(groceryItems[0].grocery_list_id).toEqual(groceryList.id);
    expect(groceryItems[0].created_at).toBeInstanceOf(Date);
  });

  it('should set correct sort_order for multiple items', async () => {
    const user = await createTestUser();
    const groceryList = await createTestGroceryList(user.id);

    // Create first item
    const firstInput: CreateGroceryItemInput = {
      grocery_list_id: groceryList.id,
      name: 'First Item'
    };
    const firstResult = await createGroceryItem(firstInput, user.id);
    expect(firstResult.sort_order).toEqual(0);

    // Create second item
    const secondInput: CreateGroceryItemInput = {
      grocery_list_id: groceryList.id,
      name: 'Second Item'
    };
    const secondResult = await createGroceryItem(secondInput, user.id);
    expect(secondResult.sort_order).toEqual(1);

    // Create third item
    const thirdInput: CreateGroceryItemInput = {
      grocery_list_id: groceryList.id,
      name: 'Third Item'
    };
    const thirdResult = await createGroceryItem(thirdInput, user.id);
    expect(thirdResult.sort_order).toEqual(2);
  });

  it('should throw error when grocery list does not exist', async () => {
    const user = await createTestUser();

    const testInput: CreateGroceryItemInput = {
      grocery_list_id: 999, // Non-existent grocery list
      name: 'Test Item'
    };

    expect(createGroceryItem(testInput, user.id)).rejects.toThrow(/grocery list not found/i);
  });

  it('should throw error when user does not own the grocery list', async () => {
    const user1 = await createTestUser();
    const user2 = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashed_password',
        first_name: 'User',
        last_name: 'Two'
      })
      .returning()
      .execute();

    const groceryList = await createTestGroceryList(user1.id);

    const testInput: CreateGroceryItemInput = {
      grocery_list_id: groceryList.id,
      name: 'Unauthorized Item'
    };

    expect(createGroceryItem(testInput, user2[0].id)).rejects.toThrow(/access denied/i);
  });

  it('should handle invalid category_id with foreign key error', async () => {
    const user = await createTestUser();
    const groceryList = await createTestGroceryList(user.id);

    const testInput: CreateGroceryItemInput = {
      grocery_list_id: groceryList.id,
      category_id: 999, // Non-existent category
      name: 'Item with Invalid Category'
    };

    // This should throw a foreign key constraint error
    expect(createGroceryItem(testInput, user.id)).rejects.toThrow(/violates foreign key constraint/i);
  });

  it('should create item with null category_id when not provided', async () => {
    const user = await createTestUser();
    const groceryList = await createTestGroceryList(user.id);

    const testInput: CreateGroceryItemInput = {
      grocery_list_id: groceryList.id,
      category_id: null,
      name: 'Item without Category'
    };

    const result = await createGroceryItem(testInput, user.id);

    expect(result.category_id).toBeNull();
    expect(result.name).toEqual('Item without Category');
  });
});
