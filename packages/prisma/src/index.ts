import { PrismaClient } from "@prisma/client";
import { campaignAnalyticsExtension } from "./campaignAnalyticsExtension";

declare const global: { prisma: PrismaClient };

if (!global.prisma) {
  global.prisma = new PrismaClient().$extends(
    campaignAnalyticsExtension
  ) as unknown as PrismaClient;
}

export * from "@prisma/client";
export default global.prisma;
