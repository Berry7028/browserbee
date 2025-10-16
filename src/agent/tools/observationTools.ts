import { DynamicTool } from "langchain/tools";
import type { TabBridge } from "../../bridge";
import { ToolFactory } from "./types";
import {
  truncate,
  MAX_RETURN_CHARS,
  MAX_SCREENSHOT_CHARS,
  withActiveBridge,
  getCurrentTabId,
} from "./utils";

const DEFAULT_VIEWPORT_WIDTH = 800;
const FULL_PAGE_WIDTH = 1000;

export const browserGetTitle: ToolFactory = (bridge: TabBridge) =>
  new DynamicTool({
    name: "browser_get_title",
    description: "Return the current page title.",
    func: async () => {
      try {
        return await withActiveBridge(bridge, async (activeBridge) => {
          const title = await activeBridge.getTitle();

          try {
            const tabId = await getCurrentTabId(activeBridge);
            if (tabId) {
              chrome.runtime.sendMessage({
                action: "tabTitleChanged",
                tabId,
                title,
              });
              console.log(
                `Sent tabTitleChanged message for tab ${tabId} with title "${title}" from browser_get_title`,
              );
            }
          } catch (titleError) {
            console.error("Error updating UI with tab title:", titleError);
          }

          return `Current page title: ${title}`;
        });
      } catch (error) {
        return `Error getting title: ${
          error instanceof Error ? error.message : String(error)
        }`;
      }
    },
  });

export const browserSnapshotDom: ToolFactory = (bridge: TabBridge) =>
  new DynamicTool({
    name: "browser_snapshot_dom",
    description:
      "Capture DOM snapshot of the current page. Options (comma-separated):\n" +
      "  • selector=<css_selector> - capture only elements matching this selector\n" +
      "  • clean - remove scripts, styles, and other non-visible elements\n" +
      "  • structure - return only element tags, ids, and classes (no content)\n" +
      "  • limit=<number> - max character length (default 20000)",
    func: async (input: string) => {
      try {
        return await withActiveBridge(bridge, async (activeBridge) => {
          const options = parseSnapshotOptions(input);
          const limit = options.limit ?? MAX_RETURN_CHARS;
          const snapshot = await activeBridge.getDomSnapshot({
            selector: options.selector,
            clean: options.clean,
            structure: options.structure,
            limit,
          });
          return truncate(snapshot, limit);
        });
      } catch (err) {
        return `Error capturing DOM snapshot: ${
          err instanceof Error ? err.message : String(err)
        }`;
      }
    },
  });

export const browserQuery: ToolFactory = (bridge: TabBridge) =>
  new DynamicTool({
    name: "browser_query",
    description:
      "Return up to 10 outerHTML snippets for a CSS selector you provide.",
    func: async (selector: string) => {
      try {
        return await withActiveBridge(bridge, async (activeBridge) => {
          const matches = await activeBridge.querySelectorOuterHTML(
            selector,
            10,
          );
          if (!matches.length) {
            return `No nodes matched ${selector}`;
          }
          return truncate(matches.join("\n\n"));
        });
      } catch (err) {
        return `Error querying '${selector}': ${
          err instanceof Error ? err.message : String(err)
        }`;
      }
    },
  });

export const browserAccessibleTree: ToolFactory = (bridge: TabBridge) =>
  new DynamicTool({
    name: "browser_accessible_tree",
    description:
      "Return the AX accessibility tree JSON (default: interesting‑only). Input 'all' to dump full tree. Note: This tool can be useful when the DOM is too large to process.",
    func: async (input: string) => {
      try {
        return await withActiveBridge(bridge, async (activeBridge) => {
          const interestingOnly = input.trim().toLowerCase() !== "all";
          const tree = await activeBridge.getAccessibleTree({ interestingOnly });
          return truncate(JSON.stringify(tree, null, 2));
        });
      } catch (err) {
        return `Error creating AX snapshot: ${
          err instanceof Error ? err.message : String(err)
        }`;
      }
    },
  });

export const browserReadText: ToolFactory = (bridge: TabBridge) =>
  new DynamicTool({
    name: "browser_read_text",
    description:
      "Return all visible text on the page, concatenated in DOM order.",
    func: async () => {
      try {
        return await withActiveBridge(bridge, async (activeBridge) => {
          const text = await activeBridge.getVisibleText();
          return truncate(text);
        });
      } catch (err) {
        return `Error extracting text: ${
          err instanceof Error ? err.message : String(err)
        }`;
      }
    },
  });

export const browserScreenshot: ToolFactory = (bridge: TabBridge) =>
  new DynamicTool({
    name: "browser_screenshot",
    description:
      "Take a screenshot of the current page.\n\n" +
      "Input flags (comma-separated):\n" +
      "  • (none)  – capture viewport only, downscaled to 800px wide (default)\n" +
      "  • full    – capture the full scrolling page, downscaled to 1000px wide\n\n" +
      "Screenshots are automatically optimized for token limits." +
      "Important: Use `browser_snapshot_dom` or `browser_accessible_tree` for structured info; " +
      "resort to screenshots only when you truly need pixels (e.g. images, charts, maps, or to show the user).",
    func: async (input: string) => {
      try {
        return await withActiveBridge(bridge, async (activeBridge) => {
          const { ScreenshotManager } = await import(
            "../../tracking/screenshotManager"
          );
          const screenshotManager = ScreenshotManager.getInstance();

          const flags = input
            .split(",")
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean);
          const fullPage = flags.includes("full");

          const targetWidth = fullPage ? FULL_PAGE_WIDTH : DEFAULT_VIEWPORT_WIDTH;
          let quality = 40;

          const screenshot = await activeBridge.captureScreenshot({
            fullPage,
            quality,
          });

          let base64 = screenshot.base64;
          let width = screenshot.width;
          let height = screenshot.height;

          if (base64.length > MAX_SCREENSHOT_CHARS) {
            const resized = await activeBridge.resizeImage({
              base64,
              targetWidth,
              quality,
            });
            if (resized.width > 0 && resized.height > 0) {
              base64 = resized.base64;
              width = resized.width;
              height = resized.height;
            }

            while (base64.length > MAX_SCREENSHOT_CHARS && quality > 10) {
              quality -= 5;
              const recompressed = await activeBridge.recompressImage({
                base64,
                width,
                height,
                quality,
              });
              base64 = recompressed.base64;
            }
          }

          if (base64.length > MAX_SCREENSHOT_CHARS) {
            return `Error: screenshot exceeds ${MAX_SCREENSHOT_CHARS} characters even at minimum quality.`;
          }

          const screenshotData = {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: base64,
            },
          };

          const screenshotId = screenshotManager.storeScreenshot(screenshotData);
          console.log(
            `Stored screenshot as ${screenshotId} (saved ${base64.length} characters)`,
          );

          return JSON.stringify({
            type: "screenshotRef",
            id: screenshotId,
            note: `Screenshot captured (${fullPage ? "full page" : "viewport only"})`,
          });
        });
      } catch (err) {
        return `Error taking screenshot: ${
          err instanceof Error ? err.message : String(err)
        }`;
      }
    },
  });

function parseSnapshotOptions(input: string): {
  selector?: string;
  clean?: boolean;
  structure?: boolean;
  limit?: number;
} {
  const options: {
    selector?: string;
    clean?: boolean;
    structure?: boolean;
    limit?: number;
  } = {};

  if (!input || input.trim() === "") {
    return options;
  }

  if (/^\d+$/.test(input.trim())) {
    options.limit = parseInt(input.trim(), 10);
    return options;
  }

  input.split(",").forEach((part) => {
    const trimmed = part.trim();

    if (trimmed === "clean") {
      options.clean = true;
    } else if (trimmed === "structure") {
      options.structure = true;
    } else if (trimmed.startsWith("selector=")) {
      options.selector = trimmed.substring("selector=".length);
    } else if (trimmed.startsWith("limit=")) {
      const limitValue = parseInt(trimmed.substring("limit=".length), 10);
      if (!Number.isNaN(limitValue)) {
        options.limit = limitValue;
      }
    }
  });

  return options;
}
