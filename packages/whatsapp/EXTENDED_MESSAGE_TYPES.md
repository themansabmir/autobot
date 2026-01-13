# Extended WhatsApp Message Types

This document describes the extended WhatsApp message types added to support the latest WhatsApp Cloud API features.

## Feature Flags

All new message types are **disabled by default** to ensure backward compatibility. Enable them via environment variables:

| Environment Variable | Description | Default |
|---------------------|-------------|---------|
| `WHATSAPP_ENABLE_LOCATION_MESSAGES` | Enable location message sending | `false` |
| `WHATSAPP_ENABLE_CONTACTS_MESSAGES` | Enable contacts/vCard message sending | `false` |
| `WHATSAPP_ENABLE_STICKER_MESSAGES` | Enable sticker message sending | `false` |
| `WHATSAPP_ENABLE_REACTION_MESSAGES` | Enable message reactions | `false` |
| `WHATSAPP_ENABLE_LIST_MESSAGES` | Enable interactive list messages | `false` |
| `WHATSAPP_ENABLE_CTA_URL_MESSAGES` | Enable CTA URL button messages | `false` |
| `WHATSAPP_ENABLE_EXTENDED_TEMPLATES` | Enable template messages with components | `false` |

## Usage

### Import Converters

```typescript
import {
  createLocationMessage,
  createContactsMessage,
  createStickerMessage,
  createReactionMessage,
  createListMessage,
  createCtaUrlMessage,
  createExtendedTemplateMessage,
  isFeatureEnabled,
} from "@typebot.io/whatsapp/extendedMessageConverters";
```

### Location Messages

Send GPS coordinates with optional name and address:

```typescript
const message = createLocationMessage({
  latitude: 37.7749,
  longitude: -122.4194,
  name: "San Francisco",
  address: "California, USA",
});

if (message) {
  await sendWhatsAppMessage({ to, message, credentials });
}
```

### Contacts Messages

Share contact vCards:

```typescript
const message = createContactsMessage([
  {
    formattedName: "John Doe",
    firstName: "John",
    lastName: "Doe",
    phones: [{ phone: "+1234567890", type: "CELL" }],
    emails: [{ email: "john@example.com", type: "WORK" }],
    company: "Acme Inc",
  },
]);

if (message) {
  await sendWhatsAppMessage({ to, message, credentials });
}
```

### Sticker Messages

Send sticker media (WebP format):

```typescript
const message = createStickerMessage({
  link: "https://example.com/sticker.webp",
  // OR use media ID:
  // id: "media_id_from_upload",
});

if (message) {
  await sendWhatsAppMessage({ to, message, credentials });
}
```

### Reaction Messages

React to a message with an emoji:

```typescript
const message = createReactionMessage({
  messageId: "wamid.xxx", // ID of message to react to
  emoji: "👍",
});

if (message) {
  await sendWhatsAppMessage({ to, message, credentials });
}
```

### Interactive List Messages

Send a list picker with sections:

```typescript
const message = createListMessage({
  headerText: "Choose an option",
  bodyText: "Please select from the menu below",
  footerText: "Powered by Typebot",
  buttonText: "View Menu",
  sections: [
    {
      title: "Category 1",
      rows: [
        { id: "opt1", title: "Option 1", description: "Description 1" },
        { id: "opt2", title: "Option 2", description: "Description 2" },
      ],
    },
    {
      title: "Category 2",
      rows: [
        { id: "opt3", title: "Option 3" },
      ],
    },
  ],
});

if (message) {
  await sendWhatsAppMessage({ to, message, credentials });
}
```

### CTA URL Button Messages

Send a message with a call-to-action URL button:

```typescript
const message = createCtaUrlMessage({
  headerText: "Special Offer",
  bodyText: "Click the button below to learn more about our products.",
  footerText: "Limited time offer",
  displayText: "Shop Now",
  url: "https://example.com/shop",
});

if (message) {
  await sendWhatsAppMessage({ to, message, credentials });
}
```

### Extended Template Messages

Send template messages with dynamic components:

```typescript
const message = createExtendedTemplateMessage({
  name: "order_confirmation",
  languageCode: "en_US",
  components: [
    {
      type: "header",
      parameters: [
        { type: "image", link: "https://example.com/header.jpg" },
      ],
    },
    {
      type: "body",
      parameters: [
        { type: "text", text: "John" },
        { type: "text", text: "ORD-12345" },
        {
          type: "currency",
          fallbackValue: "$99.99",
          code: "USD",
          amount1000: 99990,
        },
      ],
    },
    {
      type: "button",
      subType: "url",
      index: 0,
      parameters: [{ type: "text", text: "track/12345" }],
    },
  ],
});

if (message) {
  await sendWhatsAppMessage({ to, message, credentials });
}
```

## Checking Feature Status

You can check if a feature is enabled before attempting to use it:

```typescript
import { isFeatureEnabled } from "@typebot.io/whatsapp/extendedMessageConverters";

if (isFeatureEnabled("enableLocationMessages")) {
  // Location messages are enabled
}
```

## Schema Types

All schemas are exported for type safety:

```typescript
import type {
  WhatsAppLocationMessage,
  WhatsAppContactsMessage,
  WhatsAppStickerMessage,
  WhatsAppReactionMessage,
  WhatsAppInteractiveListMessage,
  WhatsAppInteractiveCtaUrlMessage,
  WhatsAppExtendedTemplateMessage,
  WhatsAppFeatureFlags,
} from "@typebot.io/whatsapp/extendedSchemas";
```

## API Limits

| Message Type | Constraint |
|-------------|------------|
| List button text | Max 20 characters |
| List sections | Max 10 sections |
| List rows per section | Max 10 rows |
| List row title | Max 24 characters |
| List row description | Max 72 characters |
| Interactive body | Max 1024 characters |
| Interactive header | Max 60 characters |
| Interactive footer | Max 60 characters |
| CTA display text | Max 20 characters |

## References

- [WhatsApp Cloud API Messages Reference](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages)
- [Interactive Messages](https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages#interactive-messages)
- [Template Messages](https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-message-templates)
