import { InputBlockType } from "@typebot.io/blocks-inputs/constants";
import { defaultFileInputOptions } from "@typebot.io/blocks-inputs/file/constants";
import type { InputBlock } from "@typebot.io/blocks-inputs/schema";
import type { InputMessage } from "@typebot.io/chat-api/schemas";
import { env } from "@typebot.io/env";
import { normalizeLanguageCode } from "@typebot.io/i18n";
import { parseAllowedFileTypesMetadata } from "@typebot.io/lib/extensionFromMimeType";
import { isURL } from "@typebot.io/lib/isURL";
import type { SessionStore } from "@typebot.io/runtime-session-store";
import type { Variable } from "@typebot.io/variables/schemas";
import { parseCardsReply } from "./blocks/cards/parseCardsReply";
import { injectVariableValuesInButtonsInputBlock } from "./blocks/inputs/buttons/injectVariableValuesInButtonsInputBlock";
import { parseMultipleChoiceReply } from "./blocks/inputs/buttons/parseMultipleChoiceReply";
import { parseSingleChoiceReply } from "./blocks/inputs/buttons/parseSingleChoiceReply";
import { parseDateReply } from "./blocks/inputs/date/parseDateReply";
import { formatEmail } from "./blocks/inputs/email/formatEmail";
import { parseNumber } from "./blocks/inputs/number/parseNumber";
import { formatPhoneNumber } from "./blocks/inputs/phone/formatPhoneNumber";
import { injectVariableValuesInPictureChoiceBlock } from "./blocks/inputs/pictureChoice/injectVariableValuesInPictureChoiceBlock";
import { validateRatingReply } from "./blocks/inputs/rating/validateRatingReply";
import { parseTime } from "./blocks/inputs/time/parseTime";
import type { ParsedReply } from "./types";

export const validateAndParseInputMessage = (
  message: InputMessage | undefined,
  {
    sessionStore,
    variables,
    block,
    typebot,
  }: {
    sessionStore: SessionStore;
    variables: Variable[];
    block: InputBlock;
    typebot: any;
  },
): ParsedReply => {
  switch (block.type) {
    case InputBlockType.EMAIL: {
      if (!message || message.type !== "text") return { status: "fail" };
      const formattedEmail = formatEmail(message.text);
      if (!formattedEmail) return { status: "fail" };
      return { status: "success", content: formattedEmail };
    }
    case InputBlockType.PHONE: {
      if (!message || message.type !== "text") return { status: "fail" };
      const formattedPhone = formatPhoneNumber(
        message.text,
        block.options?.defaultCountryCode,
      );
      if (!formattedPhone) return { status: "fail" };
      return { status: "success", content: formattedPhone };
    }
    case InputBlockType.URL: {
      if (!message || message.type !== "text") return { status: "fail" };
      const isValid = isURL(message.text, { require_protocol: false });
      if (!isValid) return { status: "fail" };
      return { status: "success", content: message.text };
    }
    case InputBlockType.CHOICE: {
      if (!message || message.type !== "text") return { status: "fail" };
      const displayedItems = injectVariableValuesInButtonsInputBlock(block, {
        variables,
        sessionStore,
      }).items;
      if (block.options?.isMultipleChoice)
        return parseMultipleChoiceReply(message.text, {
          items: displayedItems,
        });
      return parseSingleChoiceReply(message.text, {
        replyId: message.metadata?.replyId,
        items: displayedItems,
      });
    }
    case InputBlockType.NUMBER: {
      if (!message || message.type !== "text") return { status: "fail" };
      return parseNumber(message.text, {
        options: block.options,
        variables,
        sessionStore,
      });
    }
    case InputBlockType.DATE: {
      if (!message || message.type !== "text") return { status: "fail" };
      return parseDateReply(message.text, block);
    }
    case InputBlockType.TIME: {
      if (!message || message.type !== "text") return { status: "fail" };
      return parseTime(message.text, block.options);
    }
    case InputBlockType.FILE: {
      if (!message)
        return (block.options?.isRequired ?? defaultFileInputOptions.isRequired)
          ? { status: "fail" }
          : { status: "skip" };

      const replyValue = message.type === "audio" ? message.url : message.text;
      const urls = replyValue.split(", ");
      const hasValidUrls = urls.some((url) =>
        isURL(url, { require_tld: env.S3_ENDPOINT !== "localhost" }),
      );

      const allowedFileTypesMetadata =
        block.options?.allowedFileTypes?.types &&
        block.options?.allowedFileTypes?.types?.length > 0 &&
        block.options?.allowedFileTypes?.isEnabled
          ? parseAllowedFileTypesMetadata(block.options.allowedFileTypes.types)
          : undefined;
      const allFilesAreAllowed = allowedFileTypesMetadata
        ? urls.every((url) => {
            const extension = url.split(".").pop();
            if (!extension) return false;
            return allowedFileTypesMetadata.some(
              (metadata) =>
                metadata.extension.toLowerCase() === extension.toLowerCase(),
            );
          })
        : true;

      const status = hasValidUrls && allFilesAreAllowed ? "success" : "fail";
      if (!block.options?.isMultipleAllowed && urls.length > 1)
        return { status, content: replyValue.split(",")[0] };
      return { status, content: replyValue };
    }
    case InputBlockType.PAYMENT: {
      if (!message || message.type !== "text") return { status: "fail" };
      if (message.text === "fail") return { status: "fail" };
      return { status: "success", content: message.text };
    }
    case InputBlockType.RATING: {
      if (!message || message.type !== "text") return { status: "fail" };
      const isValid = validateRatingReply(message.text, block);
      if (!isValid) return { status: "fail" };
      return { status: "success", content: message.text };
    }
    case InputBlockType.PICTURE_CHOICE: {
      if (!message || message.type !== "text") return { status: "fail" };
      const displayedItems = injectVariableValuesInPictureChoiceBlock(block, {
        variables,
        sessionStore,
      }).items;
      if (block.options?.isMultipleChoice)
        return parseMultipleChoiceReply(message.text, {
          items: displayedItems,
        });
      return parseSingleChoiceReply(message.text, {
        items: displayedItems,
        replyId: message.metadata?.replyId,
      });
    }
    case InputBlockType.TEXT: {
      if (!message) return { status: "fail" };
      return {
        status: "success",
        content: message.type === "audio" ? message.url : message.text,
      };
    }
    case InputBlockType.LANGUAGE: {
      if (!message || message.type !== "text") return { status: "fail" };
      const languages = typebot?.settings?.localization?.languages ?? [];
      const displayedItems = languages.map((language: string) => ({
        id: normalizeLanguageCode(language),
        content: language,
        value: normalizeLanguageCode(language),
      }));
      return parseSingleChoiceReply(message.text, {
        replyId: message.metadata?.replyId,
        items: displayedItems as any,
      });
    }
    case InputBlockType.CARDS: {
      console.log("🎴 [Cards] Validating reply:", { text: message?.text });
      if (!message || message.type !== "text") return { status: "fail" };
      const response = parseCardsReply(message.text, {
        block,
        variables,
        sessionStore,
        replyId: message.metadata?.replyId,
      });
      if (response.status === "fail") {
        console.log("🎴 [Cards] Validation failed, falling back to success for WhatsApp compatibility");
        return { status: "success", content: message.text };
      }
      return response;
    }
    case InputBlockType.CTA_URL: {
      if (!message || message.type !== "text") return { status: "fail" };
      return { status: "success", content: message.text };
    }
    case "whatsapp list":
    case "whatsapp-list":
    case "whatsapp carousel":
    case "whatsapp-carousel": {
      console.log("🎡 [WhatsApp Interactive] Validating reply:", { 
        type: block.type, 
        text: message?.text,
        replyId: message?.metadata?.replyId
      });
      if (!message || message.type !== "text") return { status: "fail" };
      const displayedBlock = injectVariableValuesInButtonsInputBlock(
        block as any,
        {
          variables,
          sessionStore,
        },
      );
      
      let itemsToValidate = (displayedBlock as any).items;
      
      // Special handling for Carousel cards which have nested buttons
      if (block.type === InputBlockType.WHATSAPP_CAROUSEL || block.type === "whatsapp-carousel") {
        itemsToValidate = (displayedBlock as any).items.flatMap((item: any) => 
          (item.quickReplyButtons ?? []).map((btn: any) => ({
            ...btn,
            content: btn.title,
            outgoingEdgeId: item.outgoingEdgeId
          }))
        );
      }

      const response = parseSingleChoiceReply(message.text, {
        replyId: message.metadata?.replyId,
        items: itemsToValidate,
      });

      if (response.status === "fail") {
        console.log("🎡 [WhatsApp Interactive] Validation failed, falling back to success");
        return {
          status: "success",
          content: message.text,
        };
      }

      console.log("🎡 [WhatsApp Interactive] Validation success:", {
        content: response.content,
        outgoingEdgeId: response.outgoingEdgeId,
      });

      return response;
    }
    case InputBlockType.NPS: {
      if (!message || message.type !== "text") return { status: "fail" };
      const score = Number(message.text);
      if (isNaN(score) || score < 0 || score > 10 || !Number.isInteger(score))
        return { status: "fail" };
      return { status: "success", content: message.text };
    }
  }
  console.log("❌ [validateAndParseInputMessage] No case matched for block type:", block.type);
  return { status: "fail" };
};
