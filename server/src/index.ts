
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

import {
  signUpInputSchema,
  signInInputSchema,
  createCategoryInputSchema,
  createGroceryListInputSchema,
  updateGroceryListInputSchema,
  createGroceryItemInputSchema,
  updateGroceryItemInputSchema
} from './schema';

import { signUp } from './handlers/sign_up';
import { signIn } from './handlers/sign_in';
import { getCategories } from './handlers/get_categories';
import { createCategory } from './handlers/create_category';
import { createGroceryList } from './handlers/create_grocery_list';
import { getGroceryLists } from './handlers/get_grocery_lists';
import { getGroceryListWithItems } from './handlers/get_grocery_list_with_items';
import { updateGroceryList } from './handlers/update_grocery_list';
import { deleteGroceryList } from './handlers/delete_grocery_list';
import { createGroceryItem } from './handlers/create_grocery_item';
import { updateGroceryItem } from './handlers/update_grocery_item';
import { deleteGroceryItem } from './handlers/delete_grocery_item';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Authentication
  signUp: publicProcedure
    .input(signUpInputSchema)
    .mutation(({ input }) => signUp(input)),

  signIn: publicProcedure
    .input(signInInputSchema)
    .mutation(({ input }) => signIn(input)),

  // Categories
  getCategories: publicProcedure
    .query(() => getCategories()),

  createCategory: publicProcedure
    .input(createCategoryInputSchema)
    .mutation(({ input }) => createCategory(input)),

  // Grocery Lists
  createGroceryList: publicProcedure
    .input(createGroceryListInputSchema)
    .mutation(({ input }) => createGroceryList(input)),

  getGroceryLists: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getGroceryLists(input.userId)),

  getGroceryListWithItems: publicProcedure
    .input(z.object({ listId: z.number(), userId: z.number() }))
    .query(({ input }) => getGroceryListWithItems(input.listId, input.userId)),

  updateGroceryList: publicProcedure
    .input(updateGroceryListInputSchema.extend({ userId: z.number() }))
    .mutation(({ input }) => {
      const { userId, ...updateData } = input;
      return updateGroceryList(updateData, userId);
    }),

  deleteGroceryList: publicProcedure
    .input(z.object({ listId: z.number(), userId: z.number() }))
    .mutation(({ input }) => deleteGroceryList(input.listId, input.userId)),

  // Grocery Items
  createGroceryItem: publicProcedure
    .input(createGroceryItemInputSchema.extend({ userId: z.number() }))
    .mutation(({ input }) => {
      const { userId, ...itemData } = input;
      return createGroceryItem(itemData, userId);
    }),

  updateGroceryItem: publicProcedure
    .input(updateGroceryItemInputSchema.extend({ userId: z.number() }))
    .mutation(({ input }) => {
      const { userId, ...updateData } = input;
      return updateGroceryItem(updateData, userId);
    }),

  deleteGroceryItem: publicProcedure
    .input(z.object({ itemId: z.number(), userId: z.number() }))
    .mutation(({ input }) => deleteGroceryItem(input.itemId, input.userId)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
