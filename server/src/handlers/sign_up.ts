
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type SignUpInput, type AuthResponse } from '../schema';
import { eq } from 'drizzle-orm';

export const signUp = async (input: SignUpInput): Promise<AuthResponse> => {
  try {
    // Check if user with this email already exists
    const existingUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .execute();

    if (existingUsers.length > 0) {
      throw new Error('User with this email already exists');
    }

    // Hash the password (simple approach for demo - in production use bcrypt)
    const password_hash = `hashed_${input.password}`;

    // Create the user
    const result = await db.insert(usersTable)
      .values({
        email: input.email,
        password_hash,
        first_name: input.first_name,
        last_name: input.last_name
      })
      .returning()
      .execute();

    const user = result[0];

    // Generate a simple token (in production use JWT)
    const token = `token_${user.id}_${Date.now()}`;

    // Return user without password_hash and include token
    return {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      token
    };
  } catch (error) {
    console.error('Sign up failed:', error);
    throw error;
  }
};
