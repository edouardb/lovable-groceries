
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, groceryListsTable } from '../db/schema';
import { type CreateGroceryListInput } from '../schema';
import { createGroceryList } from '../handlers/create_grocery_list';
import { eq } from 'drizzle-orm';

describe('createGroceryList', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;

  beforeEach(async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();
    
    testUserId = userResult[0].id;
  });

  it('should create a grocery list with all fields', async () => {
    const testInput: CreateGroceryListInput = {
      user_id: testUserId,
      name: 'Weekly Shopping',
      description: 'Groceries for the week'
    };

    const result = await createGroceryList(testInput);

    // Basic field validation
    expect(result.user_id).toEqual(testUserId);
    expect(result.name).toEqual('Weekly Shopping');
    expect(result.description).toEqual('Groceries for the week');
    expect(result.is_active).toBe(true); // Default value
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a grocery list with minimal fields', async () => {
    const testInput: CreateGroceryListInput = {
      user_id: testUserId,
      name: 'Quick List',
      description: null
    };

    const result = await createGroceryList(testInput);

    expect(result.user_id).toEqual(testUserId);
    expect(result.name).toEqual('Quick List');
    expect(result.description).toBeNull();
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
  });

  it('should save grocery list to database', async () => {
    const testInput: CreateGroceryListInput = {
      user_id: testUserId,
      name: 'Database Test List',
      description: 'Testing database persistence'
    };

    const result = await createGroceryList(testInput);

    // Query database to verify persistence
    const groceryLists = await db.select()
      .from(groceryListsTable)
      .where(eq(groceryListsTable.id, result.id))
      .execute();

    expect(groceryLists).toHaveLength(1);
    expect(groceryLists[0].name).toEqual('Database Test List');
    expect(groceryLists[0].description).toEqual('Testing database persistence');
    expect(groceryLists[0].user_id).toEqual(testUserId);
    expect(groceryLists[0].is_active).toBe(true);
    expect(groceryLists[0].created_at).toBeInstanceOf(Date);
    expect(groceryLists[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent user', async () => {
    const testInput: CreateGroceryListInput = {
      user_id: 99999, // Non-existent user ID
      name: 'Invalid User List',
      description: null
    };

    await expect(createGroceryList(testInput)).rejects.toThrow(/violates foreign key constraint/i);
  });
});
