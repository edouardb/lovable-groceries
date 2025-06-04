
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { getCategories } from '../handlers/get_categories';

describe('getCategories', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no categories exist', async () => {
    const result = await getCategories();
    expect(result).toEqual([]);
  });

  it('should return all categories', async () => {
    // Create test categories
    await db.insert(categoriesTable).values([
      {
        name: 'Produce',
        color: '#00FF00',
        icon: 'apple',
        sort_order: 1
      },
      {
        name: 'Dairy',
        color: '#FFFFFF',
        icon: 'milk',
        sort_order: 2
      }
    ]).execute();

    const result = await getCategories();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('Produce');
    expect(result[0].color).toEqual('#00FF00');
    expect(result[0].icon).toEqual('apple');
    expect(result[0].sort_order).toEqual(1);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    expect(result[1].name).toEqual('Dairy');
    expect(result[1].color).toEqual('#FFFFFF');
    expect(result[1].icon).toEqual('milk');
    expect(result[1].sort_order).toEqual(2);
  });

  it('should return categories sorted by sort_order then name', async () => {
    // Create categories with different sort orders
    await db.insert(categoriesTable).values([
      {
        name: 'Zebra Category',
        color: '#000000',
        sort_order: 1
      },
      {
        name: 'Apple Category',
        color: '#FF0000',
        sort_order: 3
      },
      {
        name: 'Banana Category',
        color: '#FFFF00',
        sort_order: 1
      }
    ]).execute();

    const result = await getCategories();

    expect(result).toHaveLength(3);
    // First by sort_order (1, 1, 3), then by name within same sort_order
    expect(result[0].name).toEqual('Banana Category'); // sort_order 1, name comes first alphabetically
    expect(result[1].name).toEqual('Zebra Category');  // sort_order 1, name comes second alphabetically
    expect(result[2].name).toEqual('Apple Category');  // sort_order 3
  });

  it('should handle categories with nullable icon field', async () => {
    await db.insert(categoriesTable).values({
      name: 'No Icon Category',
      color: '#123456',
      icon: null,
      sort_order: 0
    }).execute();

    const result = await getCategories();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('No Icon Category');
    expect(result[0].icon).toBeNull();
  });
});
