import type { Block } from "@typebot.io/blocks-core/schemas/schema";
import { defaultChoiceInputOptions } from "@typebot.io/blocks-inputs/choice/constants";
import { InputBlockType } from "@typebot.io/blocks-inputs/constants";
import { defaultPictureChoiceOptions } from "@typebot.io/blocks-inputs/pictureChoice/constants";
import { matchesBlockType } from "@typebot.io/i18n";
import type { SessionStore } from "@typebot.io/runtime-session-store";
import { parseVariables } from "@typebot.io/variables/parseVariables";
import type { Variable } from "@typebot.io/variables/schemas";
import type { SkipReply, SuccessReply } from "./types";

export const getReplyOutgoingEdge = (
  reply: SuccessReply | SkipReply | undefined,
  {
    block,
    variables,
    sessionStore,
  }: {
    block: Block;
    variables: Variable[];
    sessionStore: SessionStore;
  },
): { id: string; isOffDefaultPath: boolean } | undefined => {
  const successReply =
    reply?.status === "success" ? (reply as SuccessReply) : undefined;

  if (!successReply)
    return block.outgoingEdgeId
      ? { id: block.outgoingEdgeId, isOffDefaultPath: false }
      : undefined;

  if (successReply.outgoingEdgeId)
    return { id: successReply.outgoingEdgeId, isOffDefaultPath: true };

  if (
    block.type === InputBlockType.CHOICE &&
    !(
      block.options?.isMultipleChoice ??
      defaultChoiceInputOptions.isMultipleChoice
    )
  ) {
    const matchedItem = block.items.find(
      (item) =>
        parseVariables(item.content, {
          variables,
          sessionStore,
        }).normalize() === successReply.content.normalize(),
    );
    if (matchedItem?.outgoingEdgeId)
      return { id: matchedItem.outgoingEdgeId, isOffDefaultPath: true };
  }
  if (
    block.type === InputBlockType.PICTURE_CHOICE &&
    !(
      block.options?.isMultipleChoice ??
      defaultPictureChoiceOptions.isMultipleChoice
    )
  ) {
    const matchedItem = block.items.find(
      (item) =>
        parseVariables(item.title, { variables, sessionStore }).normalize() ===
        successReply.content.normalize(),
    );
    if (matchedItem?.outgoingEdgeId)
      return { id: matchedItem.outgoingEdgeId, isOffDefaultPath: true };
  }
  if (
    matchesBlockType(block.type, InputBlockType.WHATSAPP_LIST) ||
    matchesBlockType(block.type, InputBlockType.WHATSAPP_CAROUSEL)
  ) {
    if ("items" in block && Array.isArray(block.items)) {
      const matchedItem = (block.items as any[]).find(
        (item) =>
          parseVariables(item.content || item.title, {
            variables,
            sessionStore,
          }).normalize() === successReply.content.normalize(),
      );
      if (matchedItem?.outgoingEdgeId)
        return { id: matchedItem.outgoingEdgeId, isOffDefaultPath: true };
    }
  }
  return block.outgoingEdgeId
    ? { id: block.outgoingEdgeId, isOffDefaultPath: false }
    : undefined;
};
