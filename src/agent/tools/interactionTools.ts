import { DynamicTool } from "langchain/tools";
import type { TabBridge } from "../../bridge";
import { ToolFactory } from "./types";
import { withActiveBridge } from "./utils";

export const browserClick: ToolFactory = (bridge: TabBridge) =>
  new DynamicTool({
    name: "browser_click",
    description:
      "Click an element. Input may be a CSS selector or literal text to match on the page.",
    func: async (input: string) => {
      try {
        return await withActiveBridge(bridge, async (activeBridge) => {
          if (/[#.[]/.test(input)) {
            await activeBridge.clickSelector(input);
            return `Clicked selector: ${input}`;
          }
          await activeBridge.clickByText(input);
          return `Clicked element containing text: ${input}`;
        });
      } catch (error) {
        return `Error clicking '${input}': ${
          error instanceof Error ? error.message : String(error)
        }`;
      }
    },
  });

export const browserType: ToolFactory = (bridge: TabBridge) =>
  new DynamicTool({
    name: "browser_type",
    description:
      "Type text. Format: selector|text (e.g. input[name=\"q\"]|hello)",
    func: async (input: string) => {
      try {
        return await withActiveBridge(bridge, async (activeBridge) => {
          const [selector, text] = input.split("|");
          if (!selector || !text) {
            return "Error: expected 'selector|text'";
          }
          await activeBridge.fillSelector(selector, text);
          return `Typed "${text}" into ${selector}`;
        });
      } catch (error) {
        return `Error typing into '${input}': ${
          error instanceof Error ? error.message : String(error)
        }`;
      }
    },
  });

export const browserHandleDialog: ToolFactory = (bridge: TabBridge) => {
  return new DynamicTool({
    name: "browser_handle_dialog",
    description:
      "Accept or dismiss the most recent alert/confirm/prompt dialog.\n" +
      "Input `accept` or `dismiss`. For prompt dialogs you may append `|text` to supply response text.",
    func: async (input: string) => {
      try {
        return await withActiveBridge(bridge, async (activeBridge) => {
          const lastDialog = await activeBridge.getLastDialog();
          if (!lastDialog) {
            return "Error: no dialog is currently open or was detected.";
          }
          const [rawAction, rawText] = input.split("|");
          const action = (rawAction || "").trim().toLowerCase();
          const text = rawText ? rawText.trim() : undefined;
          if (action !== "accept" && action !== "dismiss") {
            return "Error: first part must be `accept` or `dismiss`.";
          }
          const dialogAction = action === "accept" ? "accept" : "dismiss";
          const result = await activeBridge.handleDialog(
            dialogAction,
            dialogAction === "accept" ? text : undefined
          );
          return result.message;
        });
      } catch (err) {
        return `Error handling dialog: ${
          err instanceof Error ? err.message : String(err)
        }`;
      }
    },
  });
};
