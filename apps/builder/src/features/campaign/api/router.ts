import { router } from "@/helpers/server/trpc";
import { createCampaign } from "./createCampaign";
import { deleteCampaign } from "./deleteCampaign";
import { getCampaign } from "./getCampaign";
import { getCampaignAnalytics } from "./getCampaignAnalytics";
import { listCampaigns } from "./listCampaigns";
import { updateCampaign } from "./updateCampaign";

export const campaignRouter = router({
  getCampaign,
  getCampaignAnalytics,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  listCampaigns,
});
