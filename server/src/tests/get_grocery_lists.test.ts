
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, groceryListsTable } from '../db/schema';
import { getGroceryLists } from '../handlers/get_grocery_lists';

describe('getGroceryLists', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return grocery lists for a user', async () => {
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

    const userId = userResult[0].id;

    // Create test grocery lists
    await db.insert(groceryListsTable)
      .values([
        {
          user_id: userId,
          name: 'Weekly Shopping',
          description: 'Regular weekly groceries',
          is_active: true
        },
        {
          user_id: userId,
          name: 'Party Supplies',
          description: 'For weekend party',
          is_active: false
        }
      ])
      .execute();

    const result = await getGroceryLists(userId);

    expect(result).toHaveLength(2);
    expect(result[0].user_id).toEqual(userId);
    expect(result[1].user_id).toEqual(userId);

    // Check that all required fields are present
    result.forEach(list => {
      expect(list.id).toBeDefined();
      expect(list.name).toBeDefined();
      expect(list.is_active).toBeDefined();
      expect(list.created_at).toBeInstanceOf(Date);
      expect(list.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return lists ordered by updated_at descending', async () => {
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

    const userId = userResult[0].id;

    // Create lists with different timestamps
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    await db.insert(groceryListsTable)
      .values([
        {
          user_id: userId,
          name: 'Oldest List',
          updated_at: twoHoursAgo
        },
        {
          user_id: userId,
          name: 'Newest List',
          updated_at: now
        },
        {
          user_id: userId,
          name: 'Middle List',
          updated_at: oneHourAgo
        }
      ])
      .execute();

    const result = await getGroceryLists(userId);

    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('Newest List');
    expect(result[1].name).toEqual('Middle List');
    expect(result[2].name).toEqual('Oldest List');

    // Verify ordering by comparing timestamps
    expect(result[0].updated_at >= result[1].updated_at).toBe(true);
    expect(result[1].updated_at >= result[2].updated_at).toBe(true);
  });

  it('should return empty array for user with no lists', async () => {
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

    const userId = userResult[0].id;

    const result = await getGroceryLists(userId);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should only return lists for the specified user', async () => {
    // Create two test users
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        password_hash: 'hashedpassword',
        first_name: 'User',
        last_name: 'One'
      })
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashedpassword',
        first_name: 'User',
        last_name: 'Two'
      })
      .returning()
      .execute();

    const user1Id = user1Result[0].id;
    const user2Id = user2Result[0].id;

    // Create lists for both users
    await db.insert(groceryListsTable)
      .values([
        {
          user_id: user1Id,
          name: 'User 1 List 1'
        },
        {
          user_id: user1Id,
          name: 'User 1 List 2'
        },
        {
          user_id: user2Id,
          name: 'User 2 List 1'
        }
      ])
      .execute();

    const user1Lists = await getGroceryLists(user1Id);
    const user2Lists = await getGroceryLists(user2Id);

    expect(user1Lists).toHaveLength(2);
    expect(user2Lists).toHaveLength(1);

    // Verify all returned lists belong to the correct user
    user1Lists.forEach(list => {
      expect(list.user_id).toEqual(user1Id);
    });

    user2Lists.forEach(list => {
      expect(list.user_id).toEqual(user2Id);
    });
  });

  it('should handle nullable description field correctly', async () => {
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

    const userId = userResult[0].id;

    // Create lists with and without descriptions
    await db.insert(groceryListsTable)
      .values([
        {
          user_id: userId,
          name: 'List with description',
          description: 'This has a description'
        },
        {
          user_id: userId,
          name: 'List without description'
          // description is null by default
        }
      ])
      .execute();

    const result = await getGroceryLists(userId);

    expect(result).toHaveLength(2);
    
    const listWithDesc = result.find(list => list.name === 'List with description');
    const listWithoutDesc = result.find(list => list.name === 'List without description');

    expect(listWithDesc?.description).toEqual('This has a description');
    expect(listWithoutDesc?.description).toBeNull();
  });
});
