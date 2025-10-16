import { DynamicTool } from "langchain/tools";
import type { ElementState, TabBridge } from "../../bridge";
import { ToolFactory } from "./types";
import { withActiveBridge } from "./utils";

const describeElementState = (state: ElementState): string => {
  if (!state.found) return "element not found";
  const parts: string[] = [];
  parts.push(state.visible ? "visible" : "not visible");
  if (state.disabled) parts.push("disabled");
  if (state.matches && state.matches > 1) parts.push(`${state.matches} matches`);
  return `${state.description ?? "element"} (${parts.join(", ") || "state unknown"})`;
};

export const browserClick: ToolFactory = (bridge: TabBridge) =>
  new DynamicTool({
    name: "browser_click",
    description:
      "Click an element. Input may be a CSS selector or literal text to match on the page.",
    func: async (input: string) => {
      try {
        return await withActiveBridge(bridge, async (activeBridge) => {
          const trimmed = input.trim();
          if (!trimmed) {
            return "Error: input is empty. Provide a selector or text.";
          }
          const isSelector = /[#.[\]]/.test(trimmed) || trimmed.startsWith("//");

          if (isSelector) {
            const before = await activeBridge.inspectSelector(trimmed);
            if (!before.found) {
              return `Error: selector '${trimmed}' could not be located.`;
            }
            if (!before.visible) {
              return `Error: selector '${trimmed}' was found but is not visible (${describeElementState(before)}).`;
            }

            await activeBridge.clickSelector(trimmed);
            const after = await activeBridge.inspectSelector(trimmed);
            return `Located ${describeElementState(before)}. Click executed. Post-check: ${describeElementState(after)}.`;
          }

          const beforeText = await activeBridge.inspectByText(trimmed, false);
          if (!beforeText.found) {
            return `Error: no element containing "${trimmed}" was found.`;
          }

          await activeBridge.clickByText(trimmed);
          const afterText = await activeBridge.inspectByText(trimmed, false);
          return `Located text match ${describeElementState(beforeText)}. Click executed. Post-check: ${describeElementState(afterText)}.`;
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
          const trimmedSelector = selector.trim();
          const desired = text;
          const before = await activeBridge.inspectSelector(trimmedSelector);
          if (!before.found) {
            return `Error: selector '${trimmedSelector}' could not be located.`;
          }
          if (before.disabled) {
            return `Error: selector '${trimmedSelector}' is disabled and cannot receive input (${describeElementState(before)}).`;
          }

          await activeBridge.fillSelector(trimmedSelector, desired);
          const actualValue = await activeBridge.getInputValue(trimmedSelector);
          const verification = actualValue === desired
            ? "Verification successful: field value matches input."
            : `Warning: expected '${desired}' but observed '${actualValue ?? ""}'.`;

          const after = await activeBridge.inspectSelector(trimmedSelector);
          return `Located ${describeElementState(before)}. Typed "${desired}". ${verification} Post-check: ${describeElementState(after)}.`;
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
