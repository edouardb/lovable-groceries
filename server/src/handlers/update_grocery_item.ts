
import { db } from '../db';
import { groceryItemsTable, groceryListsTable } from '../db/schema';
import { type UpdateGroceryItemInput, type GroceryItem } from '../schema';
import { eq, and } from 'drizzle-orm';

export const updateGroceryItem = async (input: UpdateGroceryItemInput, userId: number): Promise<GroceryItem> => {
  try {
    // First verify the item exists and user has permission (owns the grocery list)
    const existingItems = await db.select({
      item: groceryItemsTable,
      list: groceryListsTable
    })
    .from(groceryItemsTable)
    .innerJoin(groceryListsTable, eq(groceryItemsTable.grocery_list_id, groceryListsTable.id))
    .where(
      and(
        eq(groceryItemsTable.id, input.id),
        eq(groceryListsTable.user_id, userId)
      )
    )
    .execute();

    if (existingItems.length === 0) {
      throw new Error('Grocery item not found or access denied');
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.category_id !== undefined) {
      updateData.category_id = input.category_id;
    }
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.quantity !== undefined) {
      updateData.quantity = input.quantity;
    }
    if (input.notes !== undefined) {
      updateData.notes = input.notes;
    }
    if (input.is_purchased !== undefined) {
      updateData.is_purchased = input.is_purchased;
    }
    if (input.is_favorite !== undefined) {
      updateData.is_favorite = input.is_favorite;
    }
    if (input.sort_order !== undefined) {
      updateData.sort_order = input.sort_order;
    }

    // Update the grocery item
    const result = await db.update(groceryItemsTable)
      .set(updateData)
      .where(eq(groceryItemsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Grocery item update failed:', error);
    throw error;
  }
};
