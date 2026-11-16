import type { ModelMessage, ModelTurn, ToolDef } from "../types.js";

export interface CompleteInput {
  system: string;
  messages: ModelMessage[];
  tools: ToolDef[];
}

export interface ChatAdapter {
  id: "openai" | "gemini";
  complete(input: CompleteInput): Promise<ModelTurn>;
}

export function normaliseTools(tools: ToolDef[]): ToolDef[] {
  return tools.map((tool) => ({
    ...tool,
    parameters: tool.parameters ?? { type: "object", properties: {} },
  }));
}
