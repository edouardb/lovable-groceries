
import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  password_hash: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// User input schemas
export const signUpInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  first_name: z.string().min(1),
  last_name: z.string().min(1)
});

export type SignUpInput = z.infer<typeof signUpInputSchema>;

export const signInInputSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export type SignInInput = z.infer<typeof signInInputSchema>;

// Category schema
export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  color: z.string(),
  icon: z.string().nullable(),
  sort_order: z.number().int(),
  created_at: z.coerce.date()
});

export type Category = z.infer<typeof categorySchema>;

export const createCategoryInputSchema = z.object({
  name: z.string().min(1),
  color: z.string(),
  icon: z.string().nullable().optional(),
  sort_order: z.number().int().optional()
});

export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>;

// Grocery list schema
export const groceryListSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type GroceryList = z.infer<typeof groceryListSchema>;

export const createGroceryListInputSchema = z.object({
  user_id: z.number(),
  name: z.string().min(1),
  description: z.string().nullable().optional()
});

export type CreateGroceryListInput = z.infer<typeof createGroceryListInputSchema>;

export const updateGroceryListInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().optional()
});

export type UpdateGroceryListInput = z.infer<typeof updateGroceryListInputSchema>;

// Grocery item schema
export const groceryItemSchema = z.object({
  id: z.number(),
  grocery_list_id: z.number(),
  category_id: z.number().nullable(),
  name: z.string(),
  quantity: z.string().nullable(),
  notes: z.string().nullable(),
  is_purchased: z.boolean(),
  is_favorite: z.boolean(),
  sort_order: z.number().int(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type GroceryItem = z.infer<typeof groceryItemSchema>;

export const createGroceryItemInputSchema = z.object({
  grocery_list_id: z.number(),
  category_id: z.number().nullable().optional(),
  name: z.string().min(1),
  quantity: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  is_favorite: z.boolean().optional()
});

export type CreateGroceryItemInput = z.infer<typeof createGroceryItemInputSchema>;

export const updateGroceryItemInputSchema = z.object({
  id: z.number(),
  category_id: z.number().nullable().optional(),
  name: z.string().min(1).optional(),
  quantity: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  is_purchased: z.boolean().optional(),
  is_favorite: z.boolean().optional(),
  sort_order: z.number().int().optional()
});

export type UpdateGroceryItemInput = z.infer<typeof updateGroceryItemInputSchema>;

// Authentication response schema
export const authResponseSchema = z.object({
  user: userSchema.omit({ password_hash: true }),
  token: z.string()
});

export type AuthResponse = z.infer<typeof authResponseSchema>;

// List with items schema for detailed view
export const groceryListWithItemsSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  items: z.array(groceryItemSchema)
});

export type GroceryListWithItems = z.infer<typeof groceryListWithItemsSchema>;
