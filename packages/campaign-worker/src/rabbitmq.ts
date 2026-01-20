import amqp from "amqplib";
import { config } from "./config";

type AmqpConnection = Awaited<ReturnType<typeof amqp.connect>>;
type AmqpChannel = Awaited<ReturnType<AmqpConnection["createChannel"]>>;

let connection: AmqpConnection | null = null;
let channel: AmqpChannel | null = null;

export const connectRabbitMQ = async (): Promise<AmqpChannel> => {
  if (channel) return channel;

  console.log("🐰 Connecting to RabbitMQ...");
  connection = await amqp.connect(config.rabbitmq.url);
  channel = await connection.createChannel();

  await channel.assertExchange(config.rabbitmq.exchanges.campaign, "direct", {
    durable: true,
  });

  await channel.assertQueue(config.rabbitmq.queues.campaign, {
    durable: true,
    arguments: {
      "x-dead-letter-exchange": "",
      "x-dead-letter-routing-key": `${config.rabbitmq.queues.campaign}.dlq`,
    },
  });

  await channel.assertQueue(config.rabbitmq.queues.whatsapp, {
    durable: true,
    arguments: {
      "x-dead-letter-exchange": "",
      "x-dead-letter-routing-key": `${config.rabbitmq.queues.whatsapp}.dlq`,
    },
  });

  await channel.assertQueue(`${config.rabbitmq.queues.campaign}.dlq`, {
    durable: true,
  });
  await channel.assertQueue(`${config.rabbitmq.queues.whatsapp}.dlq`, {
    durable: true,
  });

  await channel.bindQueue(
    config.rabbitmq.queues.campaign,
    config.rabbitmq.exchanges.campaign,
    "campaign",
  );

  console.log("✅ RabbitMQ connected and queues initialized");
  return channel;
};

export const getChannel = (): AmqpChannel => {
  if (!channel) {
    throw new Error(
      "RabbitMQ channel not initialized. Call connectRabbitMQ first.",
    );
  }
  return channel;
};

export const closeRabbitMQ = async (): Promise<void> => {
  if (channel) {
    await channel.close();
    channel = null;
  }
  if (connection) {
    await connection.close();
    connection = null;
  }
  console.log("🐰 RabbitMQ connection closed");
};

export interface CampaignJob {
  campaignId: string;
  workspaceId: string;
}

export interface RecipientJob {
  recipientId: string;
  campaignId: string;
  phoneNumber: string;
  variables?: Record<string, unknown>;
}

export const publishCampaignJob = async (job: CampaignJob): Promise<void> => {
  const ch = getChannel();
  ch.publish(
    config.rabbitmq.exchanges.campaign,
    "campaign",
    Buffer.from(JSON.stringify(job)),
    { persistent: true },
  );
  console.log(`📤 Published campaign job: ${job.campaignId}`);
};

export const publishRecipientJob = async (job: RecipientJob): Promise<void> => {
  const ch = getChannel();
  ch.sendToQueue(
    config.rabbitmq.queues.whatsapp,
    Buffer.from(JSON.stringify(job)),
    { persistent: true },
  );
};

export const publishRecipientJobsBatch = async (
  jobs: RecipientJob[],
): Promise<void> => {
  const ch = getChannel();
  for (const job of jobs) {
    ch.sendToQueue(
      config.rabbitmq.queues.whatsapp,
      Buffer.from(JSON.stringify(job)),
      { persistent: true },
    );
  }
  console.log(`📤 Published ${jobs.length} recipient jobs to WhatsApp queue`);
};
