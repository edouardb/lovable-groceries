
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type SignUpInput } from '../schema';
import { signUp } from '../handlers/sign_up';
import { eq } from 'drizzle-orm';

const testInput: SignUpInput = {
  email: 'test@example.com',
  password: 'password123',
  first_name: 'John',
  last_name: 'Doe'
};

describe('signUp', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a new user', async () => {
    const result = await signUp(testInput);

    // Verify user fields
    expect(result.user.email).toEqual('test@example.com');
    expect(result.user.first_name).toEqual('John');
    expect(result.user.last_name).toEqual('Doe');
    expect(result.user.id).toBeDefined();
    expect(result.user.created_at).toBeInstanceOf(Date);
    expect(result.user.updated_at).toBeInstanceOf(Date);

    // Verify token is generated
    expect(result.token).toBeDefined();
    expect(typeof result.token).toBe('string');
    expect(result.token.length).toBeGreaterThan(0);

    // Verify password_hash is not included in response
    expect((result.user as any).password_hash).toBeUndefined();
  });

  it('should save user to database', async () => {
    const result = await signUp(testInput);

    // Query database to verify user was saved
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.user.id))
      .execute();

    expect(users).toHaveLength(1);
    const savedUser = users[0];
    expect(savedUser.email).toEqual('test@example.com');
    expect(savedUser.first_name).toEqual('John');
    expect(savedUser.last_name).toEqual('Doe');
    expect(savedUser.password_hash).toEqual('hashed_password123');
    expect(savedUser.created_at).toBeInstanceOf(Date);
    expect(savedUser.updated_at).toBeInstanceOf(Date);
  });

  it('should reject duplicate email addresses', async () => {
    // Create first user
    await signUp(testInput);

    // Try to create second user with same email
    await expect(signUp(testInput)).rejects.toThrow(/already exists/i);
  });

  it('should handle different user data correctly', async () => {
    const differentInput: SignUpInput = {
      email: 'jane@example.com',
      password: 'different123',
      first_name: 'Jane',
      last_name: 'Smith'
    };

    const result = await signUp(differentInput);

    expect(result.user.email).toEqual('jane@example.com');
    expect(result.user.first_name).toEqual('Jane');
    expect(result.user.last_name).toEqual('Smith');

    // Verify in database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, 'jane@example.com'))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].password_hash).toEqual('hashed_different123');
  });
});
