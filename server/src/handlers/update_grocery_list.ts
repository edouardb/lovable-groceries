
import { db } from '../db';
import { groceryListsTable } from '../db/schema';
import { type UpdateGroceryListInput, type GroceryList } from '../schema';
import { eq, and } from 'drizzle-orm';

export const updateGroceryList = async (input: UpdateGroceryListInput, userId: number): Promise<GroceryList> => {
  try {
    // Build update object with only provided fields
    const updateData: Partial<typeof groceryListsTable.$inferInsert> = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    
    if (input.is_active !== undefined) {
      updateData.is_active = input.is_active;
    }

    // Always update the timestamp
    updateData.updated_at = new Date();

    // Update the grocery list where id matches and user_id matches (for security)
    const result = await db.update(groceryListsTable)
      .set(updateData)
      .where(and(
        eq(groceryListsTable.id, input.id),
        eq(groceryListsTable.user_id, userId)
      ))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Grocery list not found or access denied');
    }

    return result[0];
  } catch (error) {
    console.error('Grocery list update failed:', error);
    throw error;
  }
};
