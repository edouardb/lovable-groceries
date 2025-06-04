
import { db } from '../db';
import { groceryListsTable } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { type GroceryList } from '../schema';

export const getGroceryLists = async (userId: number): Promise<GroceryList[]> => {
  try {
    const results = await db.select()
      .from(groceryListsTable)
      .where(eq(groceryListsTable.user_id, userId))
      .orderBy(desc(groceryListsTable.updated_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get grocery lists:', error);
    throw error;
  }
};
