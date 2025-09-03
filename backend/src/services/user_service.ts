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
  // Doctor-specific optional inputs
  departmentId?: number;
  title?: string;
  bio?: string;
  room?: string;
  room_phone?: string;
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
      ssn: input.usertype === 'doctor' ? undefined : cleanSsn,
      usertype: input.usertype === 'doctor' ? 'doctor' : 'patient',
    },
    select: { id: true, name: true, email: true, phone: true, ssn: true, usertype: true, created_at: true }
  });
  console.log("[user_service.registerUser] created", { id: user.id });

  // If doctor, create doctor profile
  if ((input.usertype || '').toLowerCase() === 'doctor') {
    const cleanRoomPhone = input.room_phone
      ? input.room_phone.replace(/\D/g, '').slice(0, 20)
      : undefined;
  
    await prisma.doctors.create({
      data: {
        userId: user.id,
        departmentId: input.departmentId ?? null,
        title: input.title || null,
        bio: input.bio || null,
        room: input.room || null,
        room_phone: cleanRoomPhone || null,
        isActive: true,
        // Add these lines:
        updatedAt: new Date(),
        // createdAt: new Date(), // uncomment if your model requires it and has no default(now())
      },
    });
  }

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
