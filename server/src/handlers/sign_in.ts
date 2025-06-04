
import { db } from '../db';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type SignInInput, type AuthResponse } from '../schema';

export const signIn = async (input: SignInInput): Promise<AuthResponse> => {
  try {
    // Find user by email
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .execute();

    if (users.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = users[0];

    // In a real implementation, you would verify the password hash
    // For now, we'll assume password verification would happen here
    // const isValidPassword = await bcrypt.compare(input.password, user.password_hash);
    // if (!isValidPassword) {
    //   throw new Error('Invalid credentials');
    // }

    // For this implementation, we'll do a simple check
    if (!input.password) {
      throw new Error('Invalid credentials');
    }

    // Generate a mock JWT token (in real implementation, use proper JWT library)
    const token = `mock-jwt-token-${user.id}-${Date.now()}`;

    // Return user without password hash and token
    const { password_hash, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token
    };
  } catch (error) {
    console.error('Sign in failed:', error);
    throw error;
  }
};
