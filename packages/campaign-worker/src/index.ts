export { config } from "./config";
export {
  type CampaignJob,
  closeRabbitMQ,
  connectRabbitMQ,
  getChannel,
  publishCampaignJob,
  publishRecipientJob,
  publishRecipientJobsBatch,
  type RecipientJob,
} from "./rabbitmq";
