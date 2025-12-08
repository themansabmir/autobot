# How the "To-and-Fro" Conversation Works

The "to-and-fro" conversation is driven by a **Cycle of Execution** managed by the `bot-engine`. It's not a continuous script running in the background, but rather a state machine that pauses and resumes based on user input.

## The Core Concept: The "Pause"

The most important thing to understand is that **Input Blocks pause the execution**.

1.  **Bot Runs**: The bot executes blocks (Bubbles, Logic, Integrations) one by one.
2.  **Bot Pauses**: When it hits an **Input Block** (e.g., Text, Email, Choice), it sends the UI for that input to the user and **stops** execution. It saves the `currentBlockId` in the session state.
3.  **User Replies**: The user types something and hits send.
4.  **Bot Resumes**: The backend receives the reply, validates it against the paused block, and then resumes execution from that point.

## Step-by-Step Flow

### 1. The Bot Asks (Execution)
The bot executes a group of blocks.
```json
// Group 1
"blocks": [
  { "type": "bubble", "content": "Hello!" },
  { "type": "text", "id": "block-input-name" } // <--- Execution STOPS here
]
```
*   The bot sends "Hello!".
*   The bot sees the `text` input block.
*   It sends the input UI to the frontend.
*   **State Update**: `currentBlockId` is set to `"block-input-name"`.
*   **Status**: Waiting for user input.

### 2. The User Replies (Input)
The user types "John" and sends it. The frontend sends a request to the backend:
```json
{
  "sessionId": "session-123",
  "message": { "type": "text", "text": "John" }
}
```

### 3. The Engine Processes (Resume)
The `continueBotFlow` function in the backend takes over:

1.  **Identify Block**: It looks up `currentBlockId` ("block-input-name").
2.  **Validate**: It checks if "John" is valid for a `text` input (it is).
    *   *If it was an Email block and you sent "John", it would fail and ask you to retry.*
3.  **Save Data**:
    *   It saves "John" as an **Answer** linked to this session.
    *   If the block has a `variableId` (e.g., `var-name`), it updates that variable: `{{Name}} = "John"`.
4.  **Find Next Step**:
    *   Is there an **Edge** connected to this block? (e.g., logic jumping to another group).
    *   If not, are there more blocks in this **Group**?
    *   If neither, the conversation ends.

### 4. The Loop Continues
If there is a connection (Edge) to "Group 2", the bot follows it.

```json
// Group 2
"blocks": [
  { "type": "bubble", "content": "Nice to meet you, {{Name}}!" }
]
```
*   The bot replaces `{{Name}}` with "John".
*   It sends "Nice to meet you, John!".
*   It continues until it hits the next Input block or the end.

## Visualizing the JSON Connection

Here is how the JSON pieces link together to create this flow:

```json
{
  "groups": [
    {
      "id": "group-1",
      "blocks": [
        {
          "id": "block-1",
          "type": "text",
          "options": { "variableId": "var-name" } // 1. Captures input into 'var-name'
        }
      ]
    },
    {
      "id": "group-2",
      "blocks": [
        {
          "id": "block-2",
          "type": "bubble",
          "content": { "richText": "Hi {{var-name}}" } // 3. Uses the captured value
        }
      ]
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "from": { "blockId": "block-1" }, // 2. Connects the input...
      "to": { "groupId": "group-2" }    // ...to the next group
    }
  ],
  "variables": [
    { "id": "var-name", "name": "Name" } // The storage container
  ]
}
```

## Summary
1.  **Bubbles** = Output (Bot speaks).
2.  **Inputs** = Pause & Collect (Bot listens).
3.  **Edges** = Navigation (What happens next).
4.  **Variables** = Memory (Context for later).
