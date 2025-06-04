
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type SignInInput } from '../schema';
import { signIn } from '../handlers/sign_in';

// Test input
const testSignInInput: SignInInput = {
  email: 'test@example.com',
  password: 'password123'
};

describe('signIn', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should sign in user with valid credentials', async () => {
    // Create a test user first
    await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: 'Doe'
      })
      .execute();

    const result = await signIn(testSignInInput);

    // Verify response structure
    expect(result.user).toBeDefined();
    expect(result.token).toBeDefined();
    expect(typeof result.token).toBe('string');

    // Verify user data (without password hash)
    expect(result.user.email).toEqual('test@example.com');
    expect(result.user.first_name).toEqual('John');
    expect(result.user.last_name).toEqual('Doe');
    expect(result.user.id).toBeDefined();
    expect(result.user.created_at).toBeInstanceOf(Date);
    expect(result.user.updated_at).toBeInstanceOf(Date);

    // Ensure password hash is not included
    expect((result.user as any).password_hash).toBeUndefined();
  });

  it('should throw error for non-existent user', async () => {
    await expect(signIn(testSignInInput)).rejects.toThrow(/invalid credentials/i);
  });

  it('should throw error for empty password', async () => {
    // Create a test user first
    await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: 'Doe'
      })
      .execute();

    const invalidInput = {
      email: 'test@example.com',
      password: ''
    };

    await expect(signIn(invalidInput)).rejects.toThrow(/invalid credentials/i);
  });

  it('should generate unique tokens for different sign ins', async () => {
    // Create a test user
    await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: 'Doe'
      })
      .execute();

    const result1 = await signIn(testSignInInput);
    
    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const result2 = await signIn(testSignInInput);

    expect(result1.token).not.toEqual(result2.token);
    expect(result1.token).toMatch(/^mock-jwt-token-/);
    expect(result2.token).toMatch(/^mock-jwt-token-/);
  });
});
