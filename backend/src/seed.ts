
import "dotenv/config";
import prisma, { computeEndsAt } from "./utils/prisma";

async function main() {
  // Seed Departments first
  const departmentsData = [
    { name: "Cardiology", code: "CARD", description: "Heart and vascular care", phone: "+90 212 000 0001", location: "B1-201" },
    { name: "Dermatology", code: "DERM", description: "Skin, hair and nail care", phone: "+90 212 000 0002", location: "A2-105" },
    { name: "Neurology", code: "NEUR", description: "Brain and nervous system", phone: "+90 212 000 0003", location: "C3-301" },
  ];

  const departments = [] as { id: number; name: string; code: string | null }[];

  for (const d of departmentsData) {
    const dep = await prisma.departments.upsert({
      where: { name: d.name },
      update: {
        code: d.code,
        description: d.description,
        phone: d.phone,
        location: d.location,
        isActive: true,
      },
      create: {
        name: d.name,
        code: d.code,
        description: d.description,
        phone: d.phone,
        location: d.location,
      },
    });
    departments.push({ id: dep.id, name: dep.name, code: dep.code ?? null });
  }

  // Find or create a few users to be doctors
  // Assumes users table already has some records; otherwise, create sample users here.
  const existingUsers = await prisma.users.findMany({ take: 5, orderBy: { id: "asc" } });
  let usersToUse = existingUsers;

  if (usersToUse.length < 2) {
    // Create minimal demo users (passwords should already be hashed in real usage)
    usersToUse = [
      await prisma.users.upsert({
        where: { email: "dr.house@example.com" },
        update: {},
        create: { name: "Dr House", email: "dr.house@example.com", password: "hashed_demo_password", usertype: "doctor" },
      }),
      await prisma.users.upsert({
        where: { email: "dr.grey@example.com" },
        update: {},
        create: { name: "Dr Grey", email: "dr.grey@example.com", password: "hashed_demo_password", usertype: "doctor" },
      }),
    ];
  }

  // Map users to departments and create doctor profiles
  const departmentCycle = departments.length > 0 ? departments : [];
  for (let i = 0; i < usersToUse.length; i += 1) {
    const user = usersToUse[i];
    const dep = departmentCycle[i % (departmentCycle.length || 1)];

    await prisma.doctors.upsert({
      where: { userId: user.id },
      update: {
        departmentId: dep?.id,
        title: "Dr.",
        isActive: true,
      },
      create: {
        userId: user.id,
        departmentId: dep?.id,
        title: "Dr.",
        isActive: true,
      },
    });
  }

  // Optionally ensure at least one appointment example per doctor (no overlap guaranteed by @@unique)
  const allDoctors = await prisma.doctors.findMany();
  const now = new Date();
  const startOnHalfHour = new Date(now);
  startOnHalfHour.setMinutes(now.getMinutes() < 30 ? 30 : 0, 0, 0);
  if (now.getMinutes() >= 30) {
    startOnHalfHour.setHours(now.getHours() + 1);
  }

  for (const doc of allDoctors) {
    const patient = usersToUse.find((u) => u.id !== doc.userId) || usersToUse[0];
    const startsAt = new Date(startOnHalfHour);
    try {
      await prisma.appointments.create({
        data: {
          doctorId: doc.id,
          patientId: patient.id,
          departmentId: doc.departmentId ?? undefined,
          startsAt,
          endsAt: computeEndsAt(startsAt),
          status: "PENDING",
          reason: "Initial consultation",
          source: "SEED",
        },
      });
    } catch {
      // Ignore duplicates due to @@unique or time collisions in repeated runs
    }
  }

  console.log("Seed completed: departments, doctors, example appointments.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });