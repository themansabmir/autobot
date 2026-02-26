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
      const emailBlock = block as Extract<InputBlock, { type: InputBlockType.EMAIL }>;
      if (!message || message.type !== "text") return { status: "fail" };
      const formattedEmail = formatEmail(message.text);
      if (!formattedEmail) return { status: "fail" };
      return { status: "success", content: formattedEmail };
    }
    case InputBlockType.PHONE: {
      const phoneBlock = block as Extract<InputBlock, { type: InputBlockType.PHONE }>;
      if (!message || message.type !== "text") return { status: "fail" };
      const formattedPhone = formatPhoneNumber(
        message.text,
        phoneBlock.options?.defaultCountryCode,
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
      const choiceBlock = block as Extract<InputBlock, { type: InputBlockType.CHOICE }>;
      if (!message || message.type !== "text") return { status: "fail" };
      const displayedItems = injectVariableValuesInButtonsInputBlock(choiceBlock, {
        variables,
        sessionStore,
      }).items;
      if (choiceBlock.options?.isMultipleChoice)
        return parseMultipleChoiceReply(message.text, {
          items: displayedItems,
        });
      return parseSingleChoiceReply(message.text, {
        replyId: message.metadata?.replyId,
        items: displayedItems,
      });
    }
    case InputBlockType.NUMBER: {
      const numberBlock = block as Extract<InputBlock, { type: InputBlockType.NUMBER }>;
      if (!message || message.type !== "text") return { status: "fail" };
      return parseNumber(message.text, {
        options: numberBlock.options,
        variables,
        sessionStore,
      });
    }
    case InputBlockType.DATE: {
      const dateBlock = block as Extract<InputBlock, { type: InputBlockType.DATE }>;
      if (!message || message.type !== "text") return { status: "fail" };
      return parseDateReply(message.text, dateBlock);
    }
    case InputBlockType.TIME: {
      const timeBlock = block as Extract<InputBlock, { type: InputBlockType.TIME }>;
      if (!message || message.type !== "text") return { status: "fail" };
      return parseTime(message.text, timeBlock.options);
    }
    case InputBlockType.FILE: {
      const fileBlock = block as Extract<InputBlock, { type: InputBlockType.FILE }>;
      if (!message)
        return (fileBlock.options?.isRequired ?? defaultFileInputOptions.isRequired)
          ? { status: "fail" }
          : { status: "skip" };

      const replyValue = message.type === "audio" ? message.url : message.text;
      const urls = replyValue.split(", ");
      const hasValidUrls = urls.some((url) =>
        isURL(url, { require_tld: env.S3_ENDPOINT !== "localhost" }),
      );

      const allowedFileTypesMetadata =
        fileBlock.options?.allowedFileTypes?.types &&
        fileBlock.options?.allowedFileTypes?.types?.length > 0 &&
        fileBlock.options?.allowedFileTypes?.isEnabled
          ? parseAllowedFileTypesMetadata(fileBlock.options.allowedFileTypes.types)
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
      if (!fileBlock.options?.isMultipleAllowed && urls.length > 1)
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
      const pictureChoiceBlock = block as Extract<InputBlock, { type: InputBlockType.PICTURE_CHOICE }>;
      if (!message || message.type !== "text") return { status: "fail" };
      const displayedItems = injectVariableValuesInPictureChoiceBlock(pictureChoiceBlock, {
        variables,
        sessionStore,
      }).items;
      if (pictureChoiceBlock.options?.isMultipleChoice)
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
        content: message.type === "text" ? message.text : message.url,
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
      const cardsBlock = block as Extract<InputBlock, { type: InputBlockType.CARDS }>;
      if (!message || message.type !== "text") return { status: "fail" };
      console.log("🎴 [Cards] Validating reply:", { text: message.text });
      const response = parseCardsReply(message.text, {
        block: cardsBlock,
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
    case InputBlockType.WHATSAPP_LIST:
    case InputBlockType.WHATSAPP_CAROUSEL: {
      const whatsappBlock = block as Extract<InputBlock, { type: InputBlockType.WHATSAPP_LIST | InputBlockType.WHATSAPP_CAROUSEL }>;
      if (!message || message.type !== "text") return { status: "fail" };
      console.log("🎡 [WhatsApp Interactive] Validating reply:", {
        type: whatsappBlock.type,
        text: message.text,
        replyId: message.metadata?.replyId,
      });
      const displayedBlock = injectVariableValuesInButtonsInputBlock(
        whatsappBlock as any,
        {
          variables,
          sessionStore,
        },
      );
      
      let itemsToValidate = (displayedBlock as any).items;
      
      // Special handling for Carousel cards which have nested buttons
      if (whatsappBlock.type === InputBlockType.WHATSAPP_CAROUSEL) {
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

      if (response.status === "success") {
        console.log("🎡 [WhatsApp Interactive] Validation success:", {
          content: response.content,
          outgoingEdgeId: response.outgoingEdgeId,
        });
        return response;
      }

      if (response.status === "skip") return response;

      console.log("🎡 [WhatsApp Interactive] Validation failed, falling back to success");
      return {
        status: "success",
        content: message.text,
      };
    }
    case InputBlockType.NPS: {
      if (!message || message.type !== "text") return { status: "fail" };
      const score = Number(message.text);
      if (isNaN(score) || score < 0 || score > 10 || !Number.isInteger(score))
        return { status: "fail" };
      return { status: "success", content: message.text };
    }
  }
  // console.log("❌ [validateAndParseInputMessage] No case matched for block type:", (block as any).type);
  return { status: "fail" };
};
