import { PrismaClient } from "@prisma/client";

// Ensure a single PrismaClient instance across hot reloads in dev
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
	globalForPrisma.prisma || new PrismaClient();

// Fixed appointment slot length in minutes
export const APPOINTMENT_SLOT_MINUTES = 30;

// Helper function to compute endsAt from startsAt
export function computeEndsAt(startsAt: Date | string): Date {
	const start = new Date(startsAt);
	return new Date(start.getTime() + APPOINTMENT_SLOT_MINUTES * 60 * 1000);
}

if (process.env.NODE_ENV !== "production") {
	globalForPrisma.prisma = prisma;
}

export default prisma;


