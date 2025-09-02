// Utilities will be used for
// Utilities (hashing + JWT)

import bcrypt from "bcryptjs";

const ROUNDS = 12; // safe default

export async function hashPassword(plain: string) {
  const salt = await bcrypt.genSalt(ROUNDS);
  return bcrypt.hash(plain, salt);
}

export async function comparePassword(plain: string, hashed: string) {
  return bcrypt.compare(plain, hashed);
}
