import { router } from "@/helpers/server/trpc";
import { getChatSessionDetail } from "./getChatSessionDetail";
import { getChatSessions } from "./getChatSessions";

export const chatHistoryRouter = router({
  getChatSessions,
  getChatSessionDetail,
});
