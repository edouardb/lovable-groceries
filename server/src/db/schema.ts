
import { serial, text, pgTable, timestamp, boolean, integer, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password_hash: text('password_hash').notNull(),
  first_name: varchar('first_name', { length: 100 }).notNull(),
  last_name: varchar('last_name', { length: 100 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const categoriesTable = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  color: varchar('color', { length: 7 }).notNull(), // hex color code
  icon: varchar('icon', { length: 50 }), // nullable
  sort_order: integer('sort_order').notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const groceryListsTable = pgTable('grocery_lists', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'), // nullable
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const groceryItemsTable = pgTable('grocery_items', {
  id: serial('id').primaryKey(),
  grocery_list_id: integer('grocery_list_id').notNull().references(() => groceryListsTable.id, { onDelete: 'cascade' }),
  category_id: integer('category_id').references(() => categoriesTable.id, { onDelete: 'set null' }), // nullable
  name: varchar('name', { length: 200 }).notNull(),
  quantity: varchar('quantity', { length: 50 }), // nullable, e.g., "2 lbs", "1 dozen"
  notes: text('notes'), // nullable
  is_purchased: boolean('is_purchased').notNull().default(false),
  is_favorite: boolean('is_favorite').notNull().default(false),
  sort_order: integer('sort_order').notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  groceryLists: many(groceryListsTable),
}));

export const groceryListsRelations = relations(groceryListsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [groceryListsTable.user_id],
    references: [usersTable.id],
  }),
  items: many(groceryItemsTable),
}));

export const groceryItemsRelations = relations(groceryItemsTable, ({ one }) => ({
  groceryList: one(groceryListsTable, {
    fields: [groceryItemsTable.grocery_list_id],
    references: [groceryListsTable.id],
  }),
  category: one(categoriesTable, {
    fields: [groceryItemsTable.category_id],
    references: [categoriesTable.id],
  }),
}));

export const categoriesRelations = relations(categoriesTable, ({ many }) => ({
  groceryItems: many(groceryItemsTable),
}));

// TypeScript types
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type Category = typeof categoriesTable.$inferSelect;
export type NewCategory = typeof categoriesTable.$inferInsert;
export type GroceryList = typeof groceryListsTable.$inferSelect;
export type NewGroceryList = typeof groceryListsTable.$inferInsert;
export type GroceryItem = typeof groceryItemsTable.$inferSelect;
export type NewGroceryItem = typeof groceryItemsTable.$inferInsert;

// Export all tables for relation queries
export const tables = {
  users: usersTable,
  categories: categoriesTable,
  groceryLists: groceryListsTable,
  groceryItems: groceryItemsTable,
};
