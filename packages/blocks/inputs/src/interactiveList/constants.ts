import type { InteractiveListInputBlock } from "./schema";

export const defaultInteractiveListOptions: InteractiveListInputBlock["options"] =
  {
    buttonText: "Click to select",
    body: "Please select an option",
    sections: [
      {
        id: "section-1",
        rows: [
          {
            id: "row-1",
            title: "Option 1",
          },
        ],
      },
    ],
  };
