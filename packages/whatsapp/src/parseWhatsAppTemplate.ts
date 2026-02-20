import type {
  WhatsAppExtendedTemplateMessage,
  WhatsAppExtendedTemplateMessage as TemplatePayload,
} from "./extendedSchemas";

export type ParsedTemplate = {
  name: string;
  languageCode: string;
  category: string;
  components: ParsedComponent[];
};

export type ParsedComponent =
  | { type: "HEADER"; format: "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT"; text?: string; variablesCount: number }
  | { type: "BODY"; text: string; variablesCount: number }
  | { type: "BUTTONS"; buttons: ParsedButton[] };

export type ParsedButton =
  | { type: "QUICK_REPLY"; text: string }
  | { type: "URL"; text: string; url: string; hasVariable: boolean }
  | { type: "PHONE_NUMBER"; text: string; phoneNumber: string }
  | { type: "COPY_CODE"; text: string };

/**
 * Parses Meta's template structure into a format suitable for the Typebot builder.
 */
export const parseWhatsAppTemplate = (metaTemplate: any): ParsedTemplate => {
  if (!metaTemplate) return {} as any;
  const components: ParsedComponent[] = (metaTemplate.components || []).map((c: any) => {
    switch (c.type) {
      case "HEADER":
        return {
          type: "HEADER",
          format: c.format,
          text: c.text,
          variablesCount: (c.text?.match(/\{\{\d+\}\}/g) || []).length,
        };
      case "BODY":
        return {
          type: "BODY",
          text: c.text,
          variablesCount: (c.text?.match(/\{\{\d+\}\}/g) || []).length,
        };
      case "BUTTONS":
        return {
          type: "BUTTONS",
          buttons: c.buttons.map((b: any) => {
            switch (b.type) {
              case "QUICK_REPLY":
                return { type: "QUICK_REPLY", text: b.text };
              case "URL":
                return {
                  type: "URL",
                  text: b.text,
                  url: b.url,
                  hasVariable: b.url.includes("{{1}}"),
                };
              case "PHONE_NUMBER":
                return {
                  type: "PHONE_NUMBER",
                  text: b.text,
                  phoneNumber: b.phone_number,
                };
              case "COPY_CODE":
                return { type: "COPY_CODE", text: b.example?.find((e: any) => typeof e === 'string') || "" };
              default:
                return { type: "UNKNOWN", text: b.text } as any;
            }
          }),
        };
      default:
        return { type: c.type } as any;
    }
  });

  return {
    name: metaTemplate.name,
    languageCode: metaTemplate.language,
    category: metaTemplate.category,
    components: components.filter((c) => ["HEADER", "BODY", "BUTTONS"].includes(c.type)),
  };
};

/**
 * Encodes variable mappings into the Meta API parameter format.
 */
export const encodeTemplateParameters = (
  parsedTemplate: ParsedTemplate,
  variableMappings: Record<string, string>
) => {
  const components: any[] = [];

  parsedTemplate.components.forEach((c) => {
    if (c.type === "HEADER") {
      if (c.format === "TEXT" && c.variablesCount > 0) {
        const parameters = Array.from({ length: c.variablesCount }).map((_, i) => ({
          type: "text",
          text: variableMappings[`HEADER_${i + 1}`] || "",
        }));
        components.push({ type: "header", parameters });
      } else if (["IMAGE", "VIDEO", "DOCUMENT"].includes(c.format)) {
        const type = c.format.toLowerCase();
        components.push({
          type: "header",
          parameters: [
            {
              type,
              [type]: { link: variableMappings[`HEADER_MEDIA`] || "" },
            },
          ],
        });
      }
    } else if (c.type === "BODY" && c.variablesCount > 0) {
      const parameters = Array.from({ length: c.variablesCount }).map((_, i) => ({
        type: "text",
        text: variableMappings[`BODY_${i + 1}`] || "",
      }));
      components.push({ type: "body", parameters });
    } else if (c.type === "BUTTONS") {
      c.buttons.forEach((b, index) => {
         if (b.type === "URL" && b.hasVariable) {
          components.push({
            type: "button",
            sub_type: "url",
            index,
            parameters: [
              {
                type: "text",
                text: variableMappings[`BUTTON_${index}_1`] || "",
              },
            ],
          });
        }
      });
    }
  });

  return components;
};
