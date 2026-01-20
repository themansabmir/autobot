export const config = {
  rabbitmq: {
    url: process.env.RABBITMQ_URL || "amqp://localhost:5672",
    queues: {
      campaign: "campaign.execute",
      whatsapp: "whatsapp.send",
    },
    exchanges: {
      campaign: "campaign.exchange",
    },
  },
  scheduler: {
    pollIntervalMs: parseInt(
      process.env.SCHEDULER_POLL_INTERVAL_MS || "5000",
      10,
    ),
  },
  worker: {
    batchSize: parseInt(process.env.WORKER_BATCH_SIZE || "100", 10),
    maxRetries: parseInt(process.env.WORKER_MAX_RETRIES || "3", 10),
    prefetchCount: parseInt(process.env.WORKER_PREFETCH_COUNT || "10", 10),
  },
  completionChecker: {
    pollIntervalMs: parseInt(
      process.env.COMPLETION_CHECKER_POLL_INTERVAL_MS || "10000",
      10,
    ),
  },
};
