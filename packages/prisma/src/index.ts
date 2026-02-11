import { PrismaClient } from "@prisma/client";

declare const global: { prisma: PrismaClient };

if (!global.prisma) {
  global.prisma = new PrismaClient();
}

export * from "@prisma/client";
export default global.prisma;
