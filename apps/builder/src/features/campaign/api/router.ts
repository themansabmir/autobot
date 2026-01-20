import { router } from "@/helpers/server/trpc";
import { createCampaign } from "./createCampaign";
import { deleteCampaign } from "./deleteCampaign";
import { getCampaign } from "./getCampaign";
import { listCampaigns } from "./listCampaigns";
import { updateCampaign } from "./updateCampaign";

export const campaignRouter = router({
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  listCampaigns,
});
