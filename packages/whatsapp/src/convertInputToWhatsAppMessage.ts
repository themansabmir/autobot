import { BubbleBlockType } from "@typebot.io/blocks-bubbles/constants";
import { defaultChoiceInputOptions } from "@typebot.io/blocks-inputs/choice/constants";
import type { ButtonItem } from "@typebot.io/blocks-inputs/choice/schema";
import { InputBlockType } from "@typebot.io/blocks-inputs/constants";
import { defaultPictureChoiceOptions } from "@typebot.io/blocks-inputs/pictureChoice/constants";
import type { ContinueChatResponse } from "@typebot.io/chat-api/schemas";
import { env } from "@typebot.io/env";
import { isDefined, isEmpty } from "@typebot.io/lib/utils";
import { convertRichTextToMarkdown } from "@typebot.io/rich-text/convertRichTextToMarkdown";
import { defaultSystemMessages } from "@typebot.io/settings/constants";
import type { SystemMessages } from "@typebot.io/settings/schemas";
import { getOrUploadMedia, type UploadMediaCache } from "./getOrUploadMedia";
import type { WhatsAppSendingMessage } from "./schemas";

type Props = {
  input: NonNullable<ContinueChatResponse["input"]>;
  lastMessage: ContinueChatResponse["messages"][number] | undefined;
  systemMessages?: Pick<SystemMessages, "whatsAppPictureChoiceSelectLabel">;
  mediaCache?: UploadMediaCache;
};

export const convertInputToWhatsAppMessages = async ({
  input,
  lastMessage,
  systemMessages,
  mediaCache,
}: Props): Promise<WhatsAppSendingMessage[]> => {
  // Debug logging for input conversion
  console.log("🔄 [WhatsApp Converter] Converting input block:", {
    inputType: input.type,
    inputId: input.id,
    hasOptions: !!input.options,
    options: JSON.stringify(input.options, null, 2),
  });

  const lastMessageText =
    lastMessage?.type === BubbleBlockType.TEXT &&
    lastMessage.content.type === "richText"
      ? convertRichTextToMarkdown(lastMessage.content.richText ?? [], {
          flavour: "whatsapp",
        })
      : undefined;
  switch (input.type) {
    case InputBlockType.DATE:
    case InputBlockType.TIME:
    case InputBlockType.EMAIL:
    case InputBlockType.FILE:
    case InputBlockType.NUMBER:
    case InputBlockType.PHONE:
    case InputBlockType.URL:
    case InputBlockType.PAYMENT:
    case InputBlockType.RATING:
    case InputBlockType.TEXT:
      return [];
    case InputBlockType.PICTURE_CHOICE: {
      if (
        input.options?.isMultipleChoice ??
        defaultPictureChoiceOptions.isMultipleChoice
      ) {
        const messages = [];
        for (let idx = 0; idx < input.items.length; idx++) {
          const item = input.items[idx];
          let bodyText = "";
          if (item.title) bodyText += `*${item.title}*`;
          if (item.description) {
            if (item.title) bodyText += "\n\n";
            bodyText += item.description;
          }

          if (item.pictureSrc) {
            if (mediaCache) {
              const mediaId = await getOrUploadMedia({
                url: item.pictureSrc,
                cache: mediaCache,
              });

              messages.push({
                type: "image" as const,
                image: mediaId ? { id: mediaId } : { link: item.pictureSrc },
              });
            } else {
              messages.push({
                type: "image" as const,
                image: { link: item.pictureSrc },
              });
            }
          }

          messages.push({
            type: "text" as const,
            text: {
              body: `${idx + 1}. ${bodyText}`,
            },
          });
        }
        return messages;
      }
      const messages = [];
      for (const item of input.items) {
        let bodyText = "";
        if (item.title) bodyText += `*${item.title}*`;
        if (item.description) {
          if (item.title) bodyText += "\n\n";
          bodyText += item.description;
        }

        let header;
        if (item.pictureSrc) {
          if (mediaCache) {
            const mediaId = await getOrUploadMedia({
              url: item.pictureSrc,
              cache: mediaCache,
            });

            header = {
              type: "image" as const,
              image: mediaId ? { id: mediaId } : { link: item.pictureSrc },
            };
          } else {
            header = {
              type: "image" as const,
              image: { link: item.pictureSrc },
            };
          }
        }

        messages.push({
          type: "interactive" as const,
          interactive: {
            type: "button" as const,
            header,
            body: isEmpty(bodyText) ? undefined : { text: bodyText },
            action: {
              buttons: [
                {
                  type: "reply" as const,
                  reply: {
                    id: item.id,
                    title:
                      systemMessages?.whatsAppPictureChoiceSelectLabel ??
                      defaultSystemMessages.whatsAppPictureChoiceSelectLabel,
                  },
                },
              ],
            },
          },
        });
      }
      return messages;
    }
    case InputBlockType.CHOICE: {
      if (
        input.options?.isMultipleChoice ??
        defaultChoiceInputOptions.isMultipleChoice
      )
        return [
          {
            type: "text",
            text: {
              body: lastMessageText
                ? `${lastMessageText}\n\n` +
                  input.items
                    .map((item, idx) => `${idx + 1}. ${item.content}`)
                    .join("\n")
                : input.items
                    .map((item, idx) => `${idx + 1}. ${item.content}`)
                    .join("\n"),
            },
          },
        ];
      const items = groupArrayByArraySize(
        input.items.filter((item) => isDefined(item.content)),
        env.WHATSAPP_INTERACTIVE_GROUP_SIZE,
      ) as ButtonItem[][];
      return items.map((items, idx) => ({
        type: "interactive",
        interactive: {
          type: "button",
          body: {
            text: idx === 0 ? lastMessageText || "―" : "―",
          },
          action: {
            buttons: (() => {
              const nonEmptyItems = items.filter((item) => item.content);
              const buttonTexts = nonEmptyItems.map(
                (item) => item.content as string,
              );
              const uniqueTitles = getUniqueButtonTitles(buttonTexts);

              return nonEmptyItems.map((item, index) => ({
                type: "reply",
                reply: {
                  id: item.id,
                  title: uniqueTitles[index],
                },
              }));
            })(),
          },
        },
      }));
    }
    case InputBlockType.CARDS: {
      const messages = [];
      for (const item of input.items) {
        let bodyText = "";
        if (item.title) bodyText += `*${item.title}*`;
        if (item.description) {
          if (item.title) bodyText += "\n\n";
          bodyText += item.description;
        }

        let header;
        if (item.imageUrl) {
          if (mediaCache) {
            const mediaId = await getOrUploadMedia({
              url: item.imageUrl,
              cache: mediaCache,
            });

            header = {
              type: "image" as const,
              image: mediaId ? { id: mediaId } : { link: item.imageUrl },
            };
          } else {
            header = {
              type: "image" as const,
              image: { link: item.imageUrl },
            };
          }
        }

        messages.push({
          type: "interactive" as const,
          interactive: {
            type: "button" as const,
            header,
            body: isEmpty(bodyText) ? undefined : { text: bodyText },
            action: {
              buttons: (() => {
                const paths = (item.paths ?? []).slice(0, 3);
                const buttonTexts = paths.map((path) => path.text ?? "");
                const uniqueTitles = getUniqueButtonTitles(buttonTexts);

                return paths.map((path, index) => ({
                  type: "reply" as const,
                  reply: {
                    id: path.id,
                    title: uniqueTitles[index],
                  },
                }));
              })(),
            },
          },
        });
      }
      return messages;
    }
    case InputBlockType.CTA_URL: {
      console.log("🔗 [WhatsApp Converter] CTA_URL block detected:", {
        featureFlagEnabled: env.WHATSAPP_ENABLE_CTA_URL_MESSAGES,
        hasUrl: !!input.options?.url,
        hasBodyText: !!input.options?.bodyText,
      });

      if (!env.WHATSAPP_ENABLE_CTA_URL_MESSAGES) {
        console.log("⚠️ [WhatsApp Converter] CTA_URL feature flag is disabled");
        return [];
      }
      const options = input.options;
      if (!options?.url || !options?.bodyText) {
        console.log("⚠️ [WhatsApp Converter] CTA_URL missing required fields (url or bodyText)");
        return [];
      }

      let header;
      if (options.headerType === "text" && options.headerText) {
        header = {
          type: "text" as const,
          text: options.headerText.slice(0, 60),
        };
      } else if (options.headerType === "image" && options.headerImageUrl) {
        if (mediaCache) {
          const mediaId = await getOrUploadMedia({
            url: options.headerImageUrl,
            cache: mediaCache,
          });
          header = {
            type: "image" as const,
            image: mediaId
              ? { id: mediaId }
              : { link: options.headerImageUrl },
          };
        } else {
          header = {
            type: "image" as const,
            image: { link: options.headerImageUrl },
          };
        }
      }

      const ctaUrlMessage = {
        type: "interactive" as const,
        interactive: {
          type: "cta_url" as const,
          header,
          body: {
            text: options.bodyText.slice(0, 1024),
          },
          footer: options.footerText
            ? { text: options.footerText.slice(0, 60) }
            : undefined,
          action: {
            name: "cta_url" as const,
            parameters: {
              display_text: (options.displayText || "Click here").slice(
                0,
                20,
              ),
              url: options.url,
            },
          },
        },
      };

      console.log("✅ [WhatsApp Converter] CTA_URL message converted:", JSON.stringify(ctaUrlMessage, null, 2));
      return [ctaUrlMessage];
    }
    case InputBlockType.WHATSAPP_LIST: {
      if (!env.WHATSAPP_ENABLE_LIST_MESSAGES) return [];

      const options = input.options;
      const items = input.items as any[];

      const rowContents = items
        .filter((item) => isDefined(item.content))
        .map((item) => item.content as string);
      const uniqueTitles = getUniqueButtonTitles(rowContents);

      const sections: any[] = [];
      let currentSection: any = null;
      let totalRows = 0;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.content || totalRows >= 10) continue;

        if (item.sectionTitle || !currentSection) {
          if (sections.length >= 10) break;
          currentSection = {
            title: item.sectionTitle?.slice(0, 24),
            rows: [],
          };
          sections.push(currentSection);
        }

        currentSection.rows.push({
          id: item.id,
          title: uniqueTitles[totalRows],
          description: item.description?.slice(0, 72),
        });
        totalRows++;
      }

      if (sections.length === 0) return [];

      return [
        {
          type: "interactive",
          interactive: {
            type: "list",
            header: options?.listHeader
              ? {
                  type: "text",
                  text: options.listHeader.slice(0, 60),
                }
              : undefined,
            body: {
              text: lastMessageText || "Please select an option",
            },
            footer: options?.listFooter
              ? {
                  text: options.listFooter.slice(0, 60),
                }
              : undefined,
            action: {
              button: (options?.buttonLabel || "Options").slice(0, 20),
              sections,
            },
          },
        },
      ];
    }
  }
};

const trimTextTo20Chars = (
  text: string,
  existingTitles: string[] = [],
): string => {
  const baseTitle = text.length > 20 ? `${text.slice(0, 18)}..` : text;

  if (!existingTitles.includes(baseTitle)) return baseTitle;

  let counter = 1;
  let uniqueTitle = "";

  do {
    const suffix = `(${counter})`;
    const availableChars = 20 - suffix.length - 3; // 3 for ".." and a space
    uniqueTitle = `${text.slice(0, availableChars)} ${suffix}..`;
    counter++;
  } while (existingTitles.includes(uniqueTitle));

  return uniqueTitle;
};

const getUniqueButtonTitles = (texts: string[]): string[] => {
  const uniqueTitles: string[] = [];

  return texts.map((text) => {
    const uniqueTitle = trimTextTo20Chars(text, uniqueTitles);
    uniqueTitles.push(uniqueTitle);
    return uniqueTitle;
  });
};

const groupArrayByArraySize = (arr: any[], n: number) =>
  arr.reduce(
    (r, e, i) => (i % n ? r[r.length - 1].push(e) : r.push([e])) && r,
    [],
  );
