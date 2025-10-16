import { DynamicTool } from "langchain/tools";
import type { TabBridge } from "../../bridge";
import { ToolFactory } from "./types";
import { withActiveBridge } from "./utils";

export const browserPressKey: ToolFactory = (bridge: TabBridge) =>
  new DynamicTool({
    name: "browser_press_key",
    description:
      "Press a single key. Input is the key name (e.g. `Enter`, `ArrowLeft`, `a`).",
    func: async (key: string) => {
      try {
        return await withActiveBridge(bridge, async (activeBridge) => {
          if (!key.trim()) return "Error: key name required";
          await activeBridge.pressKey(key.trim());
          return `Pressed key: ${key.trim()}`;
        });
      } catch (err) {
        return `Error pressing key '${key}': ${
          err instanceof Error ? err.message : String(err)
        }`;
      }
    },
  });

export const browserKeyboardType: ToolFactory = (bridge: TabBridge) =>
  new DynamicTool({
    name: "browser_keyboard_type",
    description:
      "Type arbitrary text at the current focus location. Input is the literal text to type. Use `\\n` for new lines.",
    func: async (text: string) => {
      try {
        return await withActiveBridge(bridge, async (activeBridge) => {
          await activeBridge.typeText(text);
          return `Typed ${text.length} characters`;
        });
      } catch (err) {
        return `Error typing text: ${
          err instanceof Error ? err.message : String(err)
        }`;
      }
    },
  });
