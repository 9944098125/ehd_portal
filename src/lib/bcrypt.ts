import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hashes a plain text password.
 * @param password - The plain text password to hash.
 * @returns A promise that resolves to the hashed password string.
 */
export const hashPassword = async (password: string): Promise<string> => {
  if (!password) {
    throw new Error('Password is required');
  }
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
};

/**
 * Compares a plain text password with a hashed password.
 * @param password - The plain text password.
 * @param hash - The stored hashed password.
 * @returns A promise that resolves to true if they match, false otherwise.
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  if (!password || !hash) {
    return false;
  }
  return bcrypt.compare(password, hash);
};
