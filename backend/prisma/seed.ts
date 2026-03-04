import prisma from "@/lib/prisma";

async function main() {
  console.log("🌱 Starting database seed...");

  // Create a demo user
  let user = await prisma.user.findUnique({
    where: { email: "demo@askmynotes.com" },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        firebaseId: "demo_firebase_id_123",
        email: "demo@askmynotes.com",
        displayName: "Demo User",
        photoUrl: "https://i.pravatar.cc/150?img=12",
      },
    });
    console.log("✅ Created demo user");
  }

  // Create demo subjects
  const physicsSubject = await prisma.subject.upsert({
    where: { userId_name: { userId: user.id, name: "Physics" } },
    update: {},
    create: {
      userId: user.id,
      name: "Physics",
      description: "Classical Physics and Modern Physics",
    },
  });

  const chemistrySubject = await prisma.subject.upsert({
    where: { userId_name: { userId: user.id, name: "Chemistry" } },
    update: {},
    create: {
      userId: user.id,
      name: "Chemistry",
      description: "Organic and Inorganic Chemistry",
    },
  });

  const mathSubject = await prisma.subject.upsert({
    where: { userId_name: { userId: user.id, name: "Mathematics" } },
    update: {},
    create: {
      userId: user.id,
      name: "Mathematics",
      description: "Calculus, Algebra, and Geometry",
    },
  });

  console.log("✅ Created demo subjects");

  // Create a demo chat for Physics
  const chat = await prisma.chat.create({
    data: {
      userId: user.id,
      subjectId: physicsSubject.id,
      title: "First Law of Motion",
    },
  });

  console.log("✅ Created demo chat");

  console.log("🎉 Database seeded successfully!");
  console.log("\nDemo credentials:");
  console.log("Email: demo@askmynotes.com");
  console.log(`Subjects: ${[physicsSubject.name, chemistrySubject.name, mathSubject.name].join(", ")}`);
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
