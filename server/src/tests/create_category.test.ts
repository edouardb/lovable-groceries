
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type CreateCategoryInput } from '../schema';
import { createCategory } from '../handlers/create_category';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInput: CreateCategoryInput = {
  name: 'Produce',
  color: '#4CAF50',
  icon: 'apple',
  sort_order: 1
};

// Test input with minimal fields
const minimalInput: CreateCategoryInput = {
  name: 'Dairy',
  color: '#2196F3'
};

describe('createCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a category with all fields', async () => {
    const result = await createCategory(testInput);

    // Basic field validation
    expect(result.name).toEqual('Produce');
    expect(result.color).toEqual('#4CAF50');
    expect(result.icon).toEqual('apple');
    expect(result.sort_order).toEqual(1);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a category with minimal fields', async () => {
    const result = await createCategory(minimalInput);

    // Basic field validation
    expect(result.name).toEqual('Dairy');
    expect(result.color).toEqual('#2196F3');
    expect(result.icon).toBeNull();
    expect(result.sort_order).toEqual(0); // Should use default value
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save category to database', async () => {
    const result = await createCategory(testInput);

    // Query using proper drizzle syntax
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, result.id))
      .execute();

    expect(categories).toHaveLength(1);
    expect(categories[0].name).toEqual('Produce');
    expect(categories[0].color).toEqual('#4CAF50');
    expect(categories[0].icon).toEqual('apple');
    expect(categories[0].sort_order).toEqual(1);
    expect(categories[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle null icon field correctly', async () => {
    const result = await createCategory(minimalInput);

    // Query database to verify null handling
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, result.id))
      .execute();

    expect(categories).toHaveLength(1);
    expect(categories[0].icon).toBeNull();
  });

  it('should create multiple categories with different sort orders', async () => {
    // Create first category
    const category1 = await createCategory({
      name: 'Fruits',
      color: '#FF5722',
      sort_order: 5
    });

    // Create second category
    const category2 = await createCategory({
      name: 'Vegetables',
      color: '#4CAF50',
      sort_order: 3
    });

    // Verify both categories exist with correct sort orders
    expect(category1.sort_order).toEqual(5);
    expect(category2.sort_order).toEqual(3);
    expect(category1.id).not.toEqual(category2.id);
  });
});
