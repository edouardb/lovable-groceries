
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type Category } from '../schema';
import { asc } from 'drizzle-orm';

export const getCategories = async (): Promise<Category[]> => {
  try {
    const results = await db.select()
      .from(categoriesTable)
      .orderBy(asc(categoriesTable.sort_order), asc(categoriesTable.name))
      .execute();

    return results;
  } catch (error) {
    console.error('Get categories failed:', error);
    throw error;
  }
};
