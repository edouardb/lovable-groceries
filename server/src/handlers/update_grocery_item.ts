
import { type UpdateGroceryItemInput, type GroceryItem } from '../schema';

export declare function updateGroceryItem(input: UpdateGroceryItemInput, userId: number): Promise<GroceryItem>;
