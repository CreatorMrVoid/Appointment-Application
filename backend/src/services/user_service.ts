import prisma from "../utils/prisma";
import { hashPassword, comparePassword } from "../utils/password";

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
  usertype?: string;
}) {
  const existing = await prisma.users.findUnique({ where: { email: input.email } });
  if (existing) throw new Error("EMAIL_TAKEN");

  const hashed = await hashPassword(input.password);

  const user = await prisma.users.create({
    data: {
      name: input.name,
      email: input.email,
      password: hashed,
      usertype: input.usertype ?? "user",
    },
    select: { id: true, name: true, email: true, usertype: true, created_at: true }
  });

  return user;
}

export async function validateUser(email: string, password: string) {
  const user = await prisma.users.findUnique({ where: { email } });
  if (!user) return null;

  const ok = await comparePassword(password, user.password);
  if (!ok) return null;

  // don’t return password
  const { password: _, ...safe } = user;
  return safe;
}
