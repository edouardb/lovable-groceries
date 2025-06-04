
import { db } from '../db';
import { groceryListsTable } from '../db/schema';
import { type CreateGroceryListInput, type GroceryList } from '../schema';

export const createGroceryList = async (input: CreateGroceryListInput): Promise<GroceryList> => {
  try {
    // Insert grocery list record
    const result = await db.insert(groceryListsTable)
      .values({
        user_id: input.user_id,
        name: input.name,
        description: input.description
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Grocery list creation failed:', error);
    throw error;
  }
};
