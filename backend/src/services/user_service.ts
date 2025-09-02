import prisma from "../utils/prisma";
import { hashPassword, comparePassword } from "../utils/password";

console.log("line 3 printed at user_service.ts");

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  ssn?: string;
  usertype?: string;
}) {
  console.log("[user_service.registerUser] input", { email: input.email, usertype: input.usertype });
  const existing = await prisma.users.findUnique({ where: { email: input.email } });
  if (existing) throw new Error("EMAIL_TAKEN");
  
  console.log("[user_service.registerUser] after findUnique (no existing)");
  
  const hashed = await hashPassword(input.password);
  console.log("[user_service.registerUser] after hashPassword");

  // Sanitize to fit DB column sizes
  const cleanPhone = input.phone ? input.phone.replace(/\D/g, '').slice(0, 20) : undefined;
  const cleanSsn = input.ssn ? input.ssn.replace(/\D/g, '').slice(0, 11) : undefined;

  console.log("[user_service.registerUser] about to prisma.users.create");
  const user = await prisma.users.create({
    data: {
      name: input.name,
      email: input.email,
      password: hashed,
      phone: cleanPhone,
      ssn: cleanSsn,
      usertype: input.usertype ?? "user",
    },
    select: { id: true, name: true, email: true, phone: true, ssn: true, usertype: true, created_at: true }
  });
  console.log("[user_service.registerUser] created", { id: user.id });

  return user;
}

export async function validateUser(email: string, password: string) {
  const user = await prisma.users.findUnique({ where: { email } });
  if (!user) return null;

  const ok = await comparePassword(password, user.password);
  if (!ok) return null;

  // don't return password
  const { password: _, ...safe } = user;
  return safe;
}
