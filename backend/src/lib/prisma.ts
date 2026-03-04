import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  // Use a global variable in development to prevent exhausting connection pool
  let globalWithPrisma = global as typeof globalThis & {
    prisma: PrismaClient;
  };

  if (!globalWithPrisma.prisma) {
    globalWithPrisma.prisma = new PrismaClient({
      log: ["query", "error", "warn"],
    });
  }

  prisma = globalWithPrisma.prisma;
}

export default prisma;

// Graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
