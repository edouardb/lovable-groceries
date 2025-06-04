
import { type CreateGroceryItemInput, type GroceryItem } from '../schema';

export declare function createGroceryItem(input: CreateGroceryItemInput, userId: number): Promise<GroceryItem>;
