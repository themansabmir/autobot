import { getSession } from "@typebot.io/chat-session/queries/getSession";
import {
  WHATSAPP_PREVIEW_SESSION_ID_PREFIX,
  WHATSAPP_SESSION_ID_PREFIX,
} from "./constants";

type Props = {
  phoneNumber: string;
  phoneNumberId?: string;
};

export const getWhatsAppSessionId = async ({
  phoneNumber,
  phoneNumberId,
}: Props): Promise<string> => {
  const previewSessionId = `${WHATSAPP_PREVIEW_SESSION_ID_PREFIX}${phoneNumber}`;
  const productionSessionId = `${WHATSAPP_SESSION_ID_PREFIX}${phoneNumberId}-${phoneNumber}`;

  const previewSession = await getSession(previewSessionId);
  return previewSession?.state ? previewSessionId : productionSessionId;
};
