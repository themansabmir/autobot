import type { ParsedTemplate, ParsedComponent } from "./parseWhatsAppTemplate";

/**
 * Parses Meta's template structure into a format suitable for the Typebot builder.
 * This is a wrapper/refined version as requested by the user.
 */
export const parseMetaTemplate = (metaTemplate: any): ParsedTemplate => {
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
