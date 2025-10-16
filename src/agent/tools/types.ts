import { DynamicTool } from "langchain/tools";
import type { TabBridge } from "../../bridge";

export interface BrowserTool {
  name: string;
  description: string;
  func: (input: string, context?: ToolExecutionContext) => Promise<string>;
}

export interface ToolExecutionContext {
  requiresApproval?: boolean; // Set to true if approval was requested and granted
  approvalReason?: string; // Reason why approval was required
}

export type ToolFactory = (bridge: TabBridge) => DynamicTool;
