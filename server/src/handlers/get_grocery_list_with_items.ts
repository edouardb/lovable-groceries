
import { db } from '../db';
import { groceryListsTable, groceryItemsTable } from '../db/schema';
import { type GroceryListWithItems } from '../schema';
import { eq, and } from 'drizzle-orm';

export const getGroceryListWithItems = async (listId: number, userId: number): Promise<GroceryListWithItems> => {
  try {
    // First get the grocery list and verify ownership
    const lists = await db.select()
      .from(groceryListsTable)
      .where(and(
        eq(groceryListsTable.id, listId),
        eq(groceryListsTable.user_id, userId)
      ))
      .execute();

    if (lists.length === 0) {
      throw new Error('Grocery list not found or access denied');
    }

    const list = lists[0];

    // Get all items for this grocery list
    const items = await db.select()
      .from(groceryItemsTable)
      .where(eq(groceryItemsTable.grocery_list_id, listId))
      .execute();

    // Return the grocery list with its items
    return {
      ...list,
      items
    };
  } catch (error) {
    console.error('Failed to get grocery list with items:', error);
    throw error;
  }
};
