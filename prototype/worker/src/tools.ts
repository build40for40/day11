import type { Tool } from "./realtime";

const FINISH: Tool = {
  name: "finish_session",
  description: "End the chat. Call this after your goodbye, when the speaker says bye, says they are done or wants to stop.",
  parameters: { type: "object", properties: { reason: { type: "string" } } },
};

export const CHAT_TOOLS: Tool[] = [
  FINISH,
  {
    name: "remember",
    description:
      "Add one short line to what you remember about this child for future chats, such as something they like, or an idea they said yes or no to.",
    parameters: {
      type: "object",
      properties: { note: { type: "string", description: "One short sentence." } },
      required: ["note"],
    },
  },
  {
    name: "rewrite_memory",
    description:
      "Replace everything you remember about this child with a tidier, shorter version. Use it when the memory is long, repeats itself or is out of date. One short line per fact.",
    parameters: {
      type: "object",
      properties: { memory: { type: "string", description: "The whole new memory, one short line per fact." } },
      required: ["memory"],
    },
  },
  {
    name: "start_wand_setup",
    description:
      "Call this when the speaker asks to set up, reset or repair this wand or its RFID chip, or to change the child's name. The first call returns a question to ask. Call it again with the number the speaker answered.",
    parameters: {
      type: "object",
      properties: {
        answer: { type: "number", description: "The number the speaker said in reply to the question. Leave it out until they have answered." },
      },
    },
  },
];

export const SETUP_TOOLS: Tool[] = [
  FINISH,
  {
    name: "save_wand",
    description: "Save the child's name and profile to this wand. Call it only after the grown-up has confirmed your read back.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "The child's first name." },
        about: { type: "string", description: "One or two short sentences: age and a few things they like." },
        wipe_memory: { type: "boolean", description: "True to forget everything remembered from earlier chats." },
      },
      required: ["name", "about", "wipe_memory"],
    },
  },
  {
    name: "erase_wand",
    description: "Delete everything stored for this wand: name, profile and memory. Call it only after the grown-up has confirmed.",
    parameters: { type: "object", properties: {} },
  },
];
