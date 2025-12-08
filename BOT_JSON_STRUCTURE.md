# Typebot JSON Structure

This document outlines the JSON structure required to create a Typebot (v6). This structure corresponds to the `Typebot` model in the database and the `typebotV6Schema` in the codebase.

## High-Level Structure

A Typebot is defined by a JSON object with the following core properties:

```json
{
  "version": "6",
  "id": "unique-bot-id",
  "name": "My Awesome Bot",
  "groups": [],
  "events": [],
  "edges": [],
  "variables": [],
  "theme": {},
  "settings": {}
}
```

## Detailed Breakdown

### 1. Events (`events`)
Events trigger the bot's execution. The most important one is the `start` event.

```json
"events": [
  {
    "id": "event-start",
    "type": "start",
    "graphCoordinates": { "x": 0, "y": 0 },
    "outgoingEdgeId": "edge-1"
  }
]
```

### 2. Groups (`groups`)
Groups are containers for blocks. They represent a node in the flow graph.

```json
"groups": [
  {
    "id": "group-1",
    "title": "Welcome",
    "graphCoordinates": { "x": 100, "y": 0 },
    "blocks": [
      {
        "id": "block-1",
        "type": "bubble",
        "content": {
          "richText": [{ "type": "p", "children": [{ "text": "Hello! What is your name?" }] }]
        }
      },
      {
        "id": "block-2",
        "type": "text",
        "options": {
          "variableId": "var-name",
          "labels": { "placeholder": "Type your name..." }
        }
      }
    ]
  },
  {
    "id": "group-2",
    "title": "Greeting",
    "graphCoordinates": { "x": 100, "y": 300 },
    "blocks": [
      {
        "id": "block-3",
        "type": "bubble",
        "content": {
          "richText": [{ "type": "p", "children": [{ "text": "Nice to meet you, {{Name}}!" }] }]
        }
      }
    ]
  }
]
```

### 3. Edges (`edges`)
Edges connect events to groups, or groups to groups (via blocks).

```json
"edges": [
  {
    "id": "edge-1",
    "from": { "eventId": "event-start" },
    "to": { "groupId": "group-1" }
  },
  {
    "id": "edge-2",
    "from": { "blockId": "block-2" },
    "to": { "groupId": "group-2" }
  }
]
```

### 4. Variables (`variables`)
Variables store user data.

```json
"variables": [
  {
    "id": "var-name",
    "name": "Name"
  }
]
```

### 5. Theme (`theme`)
Defines the visual appearance of the bot.

```json
"theme": {
  "general": {
    "font": {
      "type": "Google",
      "family": "Open Sans"
    },
    "background": {
      "type": "Color",
      "content": "#ffffff"
    }
  },
  "chat": {
    "hostBubbles": {
      "backgroundColor": "#0042DA",
      "color": "#FFFFFF"
    },
    "guestBubbles": {
      "backgroundColor": "#F7F8FF",
      "color": "#000000"
    }
  }
}
```

### 6. Settings (`settings`)
Global settings for the bot.

```json
"settings": {
  "general": {
    "isTypingEmulationEnabled": true
  },
  "typingEmulation": {
    "speed": 300,
    "maxDelay": 1.5
  },
  "metadata": {
    "title": "My Bot",
    "description": "A helpful bot"
  }
}
```

## Complete Example

Here is a complete, valid JSON object for a simple "Hello World" bot:

```json
{
  "version": "6",
  "id": "bot-id-123",
  "name": "Hello World Bot",
  "publicId": "hello-world-bot",
  "customDomain": null,
  "workspaceId": "workspace-id-123",
  "createdAt": "2023-10-27T10:00:00.000Z",
  "updatedAt": "2023-10-27T10:00:00.000Z",
  "icon": "👋",
  "events": [
    {
      "id": "event-start",
      "type": "start",
      "graphCoordinates": { "x": 0, "y": 0 },
      "outgoingEdgeId": "edge-start-to-group1"
    }
  ],
  "groups": [
    {
      "id": "group-1",
      "title": "Start",
      "graphCoordinates": { "x": 200, "y": 0 },
      "blocks": [
        {
          "id": "block-bubble-1",
          "type": "bubble",
          "content": {
            "richText": [
              {
                "type": "p",
                "children": [{ "text": "Hello! Welcome to Typebot." }]
              }
            ]
          }
        }
      ]
    }
  ],
  "edges": [
    {
      "id": "edge-start-to-group1",
      "from": { "eventId": "event-start" },
      "to": { "groupId": "group-1" }
    }
  ],
  "variables": [],
  "theme": {
    "general": {
      "font": { "type": "Google", "family": "Inter" },
      "background": { "type": "Color", "content": "#ffffff" }
    },
    "chat": {
      "hostBubbles": { "backgroundColor": "#0042DA", "color": "#FFFFFF" },
      "guestBubbles": { "backgroundColor": "#F7F8FF", "color": "#000000" }
    }
  },
  "settings": {
    "general": {
      "isTypingEmulationEnabled": true
    },
    "typingEmulation": {
      "speed": 400,
      "maxDelay": 3
    }
  }
}
```
