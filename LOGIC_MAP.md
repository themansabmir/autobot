# Logic Map: The "To-and-Fro" Engine

This document maps the concepts explained in `CONVERSATION_FLOW.md` to the actual code in the repository.

## 1. The Entry Point: `continueBotFlow`
**File:** `packages/bot-engine/src/continueBotFlow.ts`

This function is the brain of the operation. It receives the user's reply and decides what to do next.

-   **Line 62**: `continueBotFlow` function definition.
-   **Line 72**: Checks if `currentBlockId` exists. If not, it starts a new flow (`startBotFlow`).
-   **Line 97**: Finds the current block using `getBlockById`.
-   **Line 121**: Checks if the current block is an **Input Block** (`isInputBlock`) and if the user sent a valid message.
-   **Line 122**: Calls `validateAndParseInputMessage` to check the user's answer.
-   **Line 199**: Calls `processAndSaveAnswer` to save the answer to the database.
-   **Line 210**: Calls `getReplyOutgoingEdge` to find where to go next.
-   **Line 253**: Calls `walkFlowForward` to resume execution and move to the next blocks.

## 2. The Validator: `validateAndParseInputMessage`
**File:** `packages/bot-engine/src/validateAndParseInputMessage.ts`

This function ensures the user's input matches the expected format (e.g., is it a valid email?).

-   **Line 23**: `validateAndParseInputMessage` function definition.
-   **Line 31**: A big `switch` statement handling different `InputBlockType`s.
    -   **Line 32**: `EMAIL` - Checks format using `formatEmail`.
    -   **Line 38**: `PHONE` - Checks format using `formatPhoneNumber`.
    -   **Line 53**: `CHOICE` - Checks if the text matches one of the buttons (`parseSingleChoiceReply`).
    -   **Line 68**: `NUMBER` - Parses the number string.

## 3. The Walker: `walkFlowForward`
**File:** `packages/bot-engine/src/walkFlowForward.ts`

This function executes the bot's "turn". It runs through blocks until it hits a stopping point (like an Input block).

-   **Line 38**: `walkFlowForward` function definition.
-   **Line 73**: A `do...while` loop that iterates through groups.
-   **Line 170**: `executeGroup` function. This iterates through the blocks *inside* a group.
    -   **Line 194**: Loop through `group.blocks`.
    -   **Line 214**: If it's a **Bubble** (text/image), it adds it to the `messages` array (to be sent to the user).
    -   **Line 245**: If it's an **Input Block**, it stops!
        -   It returns the `messages` collected so far.
        -   It sets `currentBlockId` to this input block's ID (Line 256).
        -   This "pauses" the bot and waits for the user.

## Summary of the Code Flow

1.  **User sends "Hello"** -> API calls `continueBotFlow`.
2.  **`continueBotFlow`**:
    *   Finds the paused Input Block.
    *   Calls `validateAndParseInputMessage` ("Is 'Hello' valid?").
    *   Saves the answer.
    *   Calls `walkFlowForward`.
3.  **`walkFlowForward`**:
    *   Finds the next block/group.
    *   Loops through blocks:
        *   **Bubble?** Add to list.
        *   **Logic?** Execute it.
        *   **Input?** STOP. Return everything to the user.
4.  **Response**: The user receives the Bubbles and the new Input UI.
