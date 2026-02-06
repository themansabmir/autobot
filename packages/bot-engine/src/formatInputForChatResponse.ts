import { InputBlockType } from "@typebot.io/blocks-inputs/constants";
import type { InputBlock } from "@typebot.io/blocks-inputs/schema";
import type {
  ContinueChatResponse,
  RuntimeOptions,
} from "@typebot.io/chat-api/schemas";
import type { SessionStore } from "@typebot.io/runtime-session-store";
import { deepParseVariables } from "@typebot.io/variables/deepParseVariables";
import type { Variable } from "@typebot.io/variables/schemas";
import { injectVariableValuesInCardsBlock } from "./blocks/cards/injectVariableValuesInCardsBlock";
import { injectVariableValuesInButtonsInputBlock } from "./blocks/inputs/buttons/injectVariableValuesInButtonsInputBlock";
import { parseDateInput } from "./blocks/inputs/date/parseDateInput";
import { computePaymentInputRuntimeOptions } from "./blocks/inputs/payment/computePaymentInputRuntimeOptions";
import { injectVariableValuesInPictureChoiceBlock } from "./blocks/inputs/pictureChoice/injectVariableValuesInPictureChoiceBlock";
import { normalizeLanguageCode } from "@typebot.io/i18n";
import { getPrefilledInputValue } from "./getPrefilledValue";

export const formatInputForChatResponse = async (
  block: InputBlock,
  {
    variables,
    sessionStore,
    isPreview,
    workspaceId,
    typebot,
  }: {
    variables: Variable[];
    sessionStore: SessionStore;
    isPreview: boolean;
    workspaceId: string;
    typebot: any;
  },
): Promise<ContinueChatResponse["input"]> => {
  switch (block.type) {
    case InputBlockType.CHOICE: {
      return injectVariableValuesInButtonsInputBlock(block, {
        variables,
        sessionStore,
      });
    }
    case InputBlockType.PICTURE_CHOICE: {
      return injectVariableValuesInPictureChoiceBlock(block, {
        variables,
        sessionStore,
      });
    }
    case InputBlockType.NUMBER: {
      return deepParseVariables(
        {
          ...block,
          prefilledValue: getPrefilledInputValue(variables)(block),
        },
        {
          variables,
          sessionStore,
        },
      );
    }
    case InputBlockType.DATE: {
      return parseDateInput(block, {
        variables,
        sessionStore,
      });
    }
    case InputBlockType.RATING: {
      return deepParseVariables(
        {
          ...block,
          prefilledValue: getPrefilledInputValue(variables)(block),
        },
        {
          variables,
          sessionStore,
        },
      );
    }
    case InputBlockType.CARDS: {
      return injectVariableValuesInCardsBlock(block, {
        variables,
        sessionStore,
      });
    }
    case InputBlockType.LANGUAGE: {
      console.log("🔍 [LANGUAGE Block] Formatting input:", {
        hasTypebot: !!typebot,
        hasSettings: !!typebot?.settings,
        hasLocalization: !!typebot?.settings?.localization,
        languages: typebot?.settings?.localization?.languages,
        blockOptions: block.options,
      });
      
      const languages = typebot?.settings?.localization?.languages ?? [];
      const items = languages.map((language: string) => ({
        id: normalizeLanguageCode(language),
        content: language,
      }));
      
      console.log("🔍 [LANGUAGE Block] Generated items:", items);
      
      return {
        ...block,
        options: block.options,
        items,
      } as any;
    }
    default: {
      return deepParseVariables(
        {
          ...block,
          runtimeOptions: await computeRuntimeOptions(block, {
            sessionStore,
            variables,
            isPreview,
            workspaceId,
          }),
          prefilledValue: getPrefilledInputValue(variables)(block),
        },
        {
          variables,
          sessionStore,
        },
      );
    }
  }
};

const computeRuntimeOptions = (
  block: InputBlock,
  {
    sessionStore,
    variables,
    isPreview,
    workspaceId,
  }: {
    sessionStore: SessionStore;
    variables: Variable[];
    isPreview: boolean;
    workspaceId: string;
  },
): Promise<RuntimeOptions> | undefined => {
  switch (block.type) {
    case InputBlockType.PAYMENT: {
      return computePaymentInputRuntimeOptions(block.options, {
        sessionStore,
        variables,
        isPreview,
        workspaceId,
      });
    }
  }
};
