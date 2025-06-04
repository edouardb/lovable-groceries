
import { db } from '../db';
import { groceryItemsTable, groceryListsTable } from '../db/schema';
import { type CreateGroceryItemInput, type GroceryItem } from '../schema';
import { eq, desc, max } from 'drizzle-orm';

export const createGroceryItem = async (input: CreateGroceryItemInput, userId: number): Promise<GroceryItem> => {
  try {
    // Verify the grocery list exists and belongs to the user
    const groceryListCheck = await db.select()
      .from(groceryListsTable)
      .where(eq(groceryListsTable.id, input.grocery_list_id))
      .execute();

    if (groceryListCheck.length === 0) {
      throw new Error('Grocery list not found');
    }

    if (groceryListCheck[0].user_id !== userId) {
      throw new Error('Access denied: grocery list belongs to another user');
    }

    // Get the highest sort_order for this grocery list to place new item at the end
    const maxSortOrderResult = await db.select({
      max_sort_order: max(groceryItemsTable.sort_order)
    })
      .from(groceryItemsTable)
      .where(eq(groceryItemsTable.grocery_list_id, input.grocery_list_id))
      .execute();

    const nextSortOrder = maxSortOrderResult.length > 0 && maxSortOrderResult[0].max_sort_order !== null
      ? maxSortOrderResult[0].max_sort_order + 1
      : 0;

    // Insert grocery item record
    const result = await db.insert(groceryItemsTable)
      .values({
        grocery_list_id: input.grocery_list_id,
        category_id: input.category_id || null,
        name: input.name,
        quantity: input.quantity || null,
        notes: input.notes || null,
        is_favorite: input.is_favorite || false,
        sort_order: nextSortOrder
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Grocery item creation failed:', error);
    throw error;
  }
};
