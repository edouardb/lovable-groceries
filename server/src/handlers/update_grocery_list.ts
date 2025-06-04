
import { type UpdateGroceryListInput, type GroceryList } from '../schema';

export declare function updateGroceryList(input: UpdateGroceryListInput, userId: number): Promise<GroceryList>;
