import { Prisma } from "@prisma/client";

const extractNpsConfig = (typebot: any) => {
  const groups =
    (typebot.publishedTypebot && typebot.publishedTypebot.groups) ||
    typebot.groups ||
    [];

  for (const group of groups) {
    for (const block of group.blocks) {
      if (block.type === "nps input" || block.type === "rating input") {
        return { blockId: block.id };
      }
    }
  }
  return null;
};

const handleCampaignAnalytics = async (
  prisma: any,
  model: string,
  action: string,
  result: any,
  args: any,
) => {
  console.log(`🔎 [Prisma Extension] Intercepted ${model}.${action}`);
  if (process.env.ENABLE_EVENT_DRIVEN_CAMPAIGN_ANALYTICS !== "true") {
    console.log(`🔎 [Prisma Extension] SKIPPED: Flag is ${process.env.ENABLE_EVENT_DRIVEN_CAMPAIGN_ANALYTICS}`);
    return;
  }
  if (!result) return;

  try {
    // Handle Result upsert/update
    if (model === "Result" && (action === "upsert" || action === "update")) {
      const hasStarted = result.hasStarted;
      const isCompleted = result.isCompleted;

      if (!hasStarted && !isCompleted) return;

      const recipient = await prisma.campaignRecipient.findFirst({
        where: { resultId: result.id },
        select: { id: true, startedAt: true, completedAt: true },
      });

      if (!recipient) return;

      const data: any = {};
      if (hasStarted && !recipient.startedAt) {
        data.startedAt = new Date();
      }
      if (isCompleted && !recipient.completedAt) {
        data.completedAt = new Date();
        data.status = "COMPLETED";
      }

      if (Object.keys(data).length > 0) {
        await prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data,
        });
        console.log(
          `📈 Analytics (Event): Recipient ${recipient.id} updated (started: ${!!data.startedAt}, completed: ${!!data.completedAt})`,
        );
      }
    }

    // Handle NPS answers via AnswerV2
    if (model === "AnswerV2" && (action === "create" || action === "createMany")) {
      const answers = action === "createMany" ? args.data : [result];
      if (!Array.isArray(answers)) return;

      for (const ans of answers) {
        const resultId = ans.resultId;
        const blockId = ans.blockId;
        const content = ans.content;

        if (!resultId || !blockId) continue;

        const recipient = await prisma.campaignRecipient.findFirst({
          where: { resultId, npsScore: null },
          select: {
            id: true,
            campaign: {
              select: {
                typebot: {
                  select: {
                    groups: true,
                    publishedTypebot: { select: { groups: true } },
                  },
                },
              },
            },
          },
        });

        if (!recipient) continue;

        const npsConfig = extractNpsConfig(recipient.campaign.typebot);
        if (npsConfig?.blockId === blockId) {
          const score = parseInt(content, 10);
          if (!isNaN(score)) {
            await prisma.campaignRecipient.update({
              where: { id: recipient.id },
              data: {
                npsScore: score,
                npsRespondedAt: ans.createdAt ?? new Date(),
              },
            });
            console.log(
              `📊 Analytics (Event): Recipient ${recipient.id} gave NPS ${score}.`,
            );
          }
        }
      }
    }
  } catch (err) {
    console.error("❌ Campaign analytics extension error:", err);
  }
};

export const campaignAnalyticsExtension = Prisma.defineExtension((client) => {
  return client.$extends({
    query: {
      result: {
        async upsert({ args, query }) {
          const result = await query(args);
          void handleCampaignAnalytics(client, "Result", "upsert", result, args);
          return result;
        },
        async update({ args, query }) {
          const result = await query(args);
          void handleCampaignAnalytics(client, "Result", "update", result, args);
          return result;
        },
      },
      answerV2: {
        async create({ args, query }) {
          const result = await query(args);
          void handleCampaignAnalytics(client, "AnswerV2", "create", result, args);
          return result;
        },
        async createMany({ args, query }) {
          const result = await query(args);
          void handleCampaignAnalytics(client, "AnswerV2", "createMany", result, args);
          return result;
        },
      },
    },
  });
});
