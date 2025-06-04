
import { db } from '../db';
import { groceryItemsTable, groceryListsTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export const deleteGroceryItem = async (itemId: number, userId: number): Promise<void> => {
  try {
    // Verify the item exists and belongs to a list owned by the user
    const itemWithList = await db
      .select({
        item_id: groceryItemsTable.id,
        list_user_id: groceryListsTable.user_id
      })
      .from(groceryItemsTable)
      .innerJoin(groceryListsTable, eq(groceryItemsTable.grocery_list_id, groceryListsTable.id))
      .where(eq(groceryItemsTable.id, itemId))
      .execute();

    if (itemWithList.length === 0) {
      throw new Error('Grocery item not found');
    }

    if (itemWithList[0].list_user_id !== userId) {
      throw new Error('Unauthorized: Cannot delete item from another user\'s list');
    }

    // Delete the grocery item
    await db
      .delete(groceryItemsTable)
      .where(eq(groceryItemsTable.id, itemId))
      .execute();
  } catch (error) {
    console.error('Grocery item deletion failed:', error);
    throw error;
  }
};
