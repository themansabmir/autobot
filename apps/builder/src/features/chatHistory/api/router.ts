import { router } from "@/helpers/server/trpc";
import { getChatSessions } from "./getChatSessions";
import { getChatSessionDetail } from "./getChatSessionDetail";

export const chatHistoryRouter = router({
  getChatSessions,
  getChatSessionDetail,
});
