import type { ModelMessage, ModelTurn, ToolDef } from "../types.js";

export type AdapterPurpose = "agent" | "kid" | "judge";

export interface CompleteInput {
  system: string;
  messages: ModelMessage[];
  tools: ToolDef[];
  purpose?: AdapterPurpose;
}

export interface ChatAdapter {
  id: "openai" | "gemini" | "anthropic";
  complete(input: CompleteInput): Promise<ModelTurn>;
}

export function normaliseTools(tools: ToolDef[]): ToolDef[] {
  return tools.map((tool) => ({
    ...tool,
    parameters: tool.parameters ?? { type: "object", properties: {} },
  }));
}
