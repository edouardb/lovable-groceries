
import { db } from '../db';
import { groceryListsTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export const deleteGroceryList = async (listId: number, userId: number): Promise<void> => {
  try {
    // Delete the grocery list only if it belongs to the specified user
    const result = await db.delete(groceryListsTable)
      .where(and(
        eq(groceryListsTable.id, listId),
        eq(groceryListsTable.user_id, userId)
      ))
      .execute();

    // Check if any rows were affected (list existed and belonged to user)
    if (result.rowCount === 0) {
      throw new Error('Grocery list not found or access denied');
    }
  } catch (error) {
    console.error('Delete grocery list failed:', error);
    throw error;
  }
};
