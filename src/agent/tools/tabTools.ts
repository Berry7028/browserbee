import { DynamicTool } from "langchain/tools";
import type { TabBridge } from "../../bridge";
import { setCurrentBridge } from "../PageContextManager";
import { ToolFactory } from "./types";
import { getCurrentTabId, withActiveBridge, MAX_SCREENSHOT_CHARS } from "./utils";
import { getTabState } from "../../background/tabManager";

const DEFAULT_VIEWPORT_WIDTH = 800;
const FULL_PAGE_WIDTH = 1000;
const DEFAULT_IMAGE_QUALITY = 40;

export const browserTabList: ToolFactory = (_bridge: TabBridge) =>
  new DynamicTool({
    name: "browser_tab_list",
    description: "Return a list of open tabs with their indexes and URLs.",
    func: async () => {
      try {
        const tabs = await chrome.tabs.query({ currentWindow: true });
        const list = tabs
          .map((tab, index) => `${index}: ${tab.url ?? "<blank>"}`)
          .join("\n");
        return list || "No tabs.";
      } catch (err) {
        return `Error listing tabs: ${err instanceof Error ? err.message : String(err)}`;
      }
    },
  });

export const browserTabNew: ToolFactory = (bridge: TabBridge) =>
  new DynamicTool({
    name: "browser_tab_new",
    description:
      "Open a new tab. Optional input = URL to navigate to (otherwise blank tab). Note: This does NOT automatically switch to the new tab. Use browser_tab_select after creating a new tab if you want to interact with it.",
    func: async (input: string) => {
      try {
        const url = input.trim();
        const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const activeTab = activeTabs[0];
        const windowId = activeTab?.windowId ?? chrome.windows.WINDOW_ID_CURRENT;

        const created = await chrome.tabs.create({
          windowId,
          url: url || undefined,
          active: false,
        });

        const tabs = await chrome.tabs.query({ windowId });
        const newIndex = tabs.findIndex((tab) => tab.id === created.id);

        if (created.id) {
          chrome.runtime.sendMessage({
            action: "targetCreated",
            tabId: created.id,
            targetInfo: {
              title: created.title ?? "New Tab",
              url: created.url ?? "about:blank",
            },
          });
          console.log(`Sent targetCreated message for new tab ${created.id}`);
        }

        return `Opened new tab (#${newIndex >= 0 ? newIndex : "unknown"}) in window ${windowId}. To interact with this tab, use browser_tab_select.`;
      } catch (err) {
        return `Error opening new tab: ${err instanceof Error ? err.message : String(err)}`;
      }
    },
  });

export const browserScreenshotTab: ToolFactory = (_bridge: TabBridge) =>
  new DynamicTool({
    name: "browser_screenshot_tab",
    description: "Take a screenshot of a specific tab by index. Input format: 'tabIndex[,flags]' (e.g., '1,full')",
    func: async (input: string) => {
      try {
        const parts = input.split(",");
        const tabIndexStr = parts[0].trim();
        const flags = parts.slice(1).map((f) => f.trim().toLowerCase());

        const index = Number(tabIndexStr);
        if (Number.isNaN(index)) {
          return "Error: First parameter must be a tab index number";
        }

        const tabs = await chrome.tabs.query({ currentWindow: true });
        if (index < 0 || index >= tabs.length) {
          return `Error: Tab index ${index} out of range (0-${tabs.length - 1})`;
        }

        const target = tabs[index];
        if (!target.id) {
          return "Error: Target tab is missing an ID.";
        }

        const fullPage = flags.includes("full");
        const tabState = getTabState(target.id);

        if (tabState?.bridge) {
          try {
            return await captureScreenshotWithBridge(tabState.bridge, fullPage);
          } catch (error) {
            console.warn("Tab bridge screenshot failed, falling back to visible capture:", error);
          }
        }

        if (!target.active) {
          return "Error: Target tab is not active and no bridge is available. Use browser_tab_select first, then retry.";
        }

        if (fullPage) {
          return "Error: Full-page capture requires an active bridge. Try browser_tab_select and reattach the agent before retrying with the 'full' flag.";
        }

        const windowId = target.windowId ?? chrome.windows.WINDOW_ID_CURRENT;
        const dataUrl = await chrome.tabs.captureVisibleTab(windowId, {
          format: "jpeg",
          quality: 70,
        });

        if (!dataUrl) {
          return "Error: Failed to capture visible tab.";
        }

        const base64 = dataUrl.replace(/^data:image\/(png|jpeg);base64,/i, "");
        return await storeScreenshot(base64, "Screenshot captured (visible area)");
      } catch (error) {
        return `Error taking tab screenshot: ${error instanceof Error ? error.message : String(error)}`;
      }
    },
  });

export const browserTabSelect: ToolFactory = (bridge: TabBridge) =>
  new DynamicTool({
    name: "browser_tab_select",
    description:
      "Switch focus to a tab by index. Input = integer index from browser_tab_list. IMPORTANT: After switching tabs, you must use browser_get_active_tab to confirm the switch was successful and to get information about the new active tab.",
    func: async (input: string) => {
      try {
        const index = Number(input.trim());
        if (Number.isNaN(index)) {
          return "Error: input must be a tab index (integer).";
        }

        const tabs = await chrome.tabs.query({ currentWindow: true });
        if (index < 0 || index >= tabs.length) {
          return `Error: index ${index} out of range (0-${tabs.length - 1}).`;
        }

        const target = tabs[index];
        if (!target.id) {
          return "Error: Target tab is missing an ID.";
        }

        const previousTab = tabs.find((tab) => tab.active);
        await chrome.tabs.update(target.id, { active: true });

        if (target.id) {
          const targetState = getTabState(target.id);
          if (targetState?.bridge) {
            setCurrentBridge(targetState.bridge);
          }
        }

        chrome.runtime.sendMessage({
          action: "activeTabChanged",
          oldTabId: previousTab?.id,
          newTabId: target.id,
          title: target.title ?? "",
          url: target.url ?? "",
        });
        chrome.runtime.sendMessage({
          action: "tabTitleChanged",
          tabId: target.id,
          title: target.title ?? "",
        });

        return `Switched to tab ${index}. Now active: "${target.title ?? "Unknown"}" (${target.url ?? "about:blank"}). Use browser_get_active_tab for more details.`;
      } catch (err) {
        return `Error selecting tab: ${err instanceof Error ? err.message : String(err)}`;
      }
    },
  });

export const browserTabClose: ToolFactory = (bridge: TabBridge) =>
  new DynamicTool({
    name: "browser_tab_close",
    description: "Close a tab. Input = index to close (defaults to current tab if blank).",
    func: async (input: string) => {
      try {
        const tabs = await chrome.tabs.query({ currentWindow: true });
        let index: number;

        if (input.trim() === "") {
          const tabId = await withActiveBridge(bridge, async (activeBridge) => getCurrentTabId(activeBridge));
          index = tabId != null ? tabs.findIndex((tab) => tab.id === tabId) : tabs.findIndex((tab) => tab.active);
        } else {
          index = Number(input.trim());
        }

        if (Number.isNaN(index) || index < 0 || index >= tabs.length) {
          return "Error: invalid tab index.";
        }

        const target = tabs[index];
        if (!target.id) {
          return "Error: Target tab is missing an ID.";
        }

        await chrome.tabs.remove(target.id);

        chrome.runtime.sendMessage({
          action: "targetDestroyed",
          tabId: target.id,
          url: target.url ?? "about:blank",
        });

        return `Closed tab ${index}.`;
      } catch (err) {
        return `Error closing tab: ${err instanceof Error ? err.message : String(err)}`;
      }
    },
  });

async function captureScreenshotWithBridge(bridge: TabBridge, fullPage: boolean): Promise<string> {
  const targetWidth = fullPage ? FULL_PAGE_WIDTH : DEFAULT_VIEWPORT_WIDTH;
  let quality = DEFAULT_IMAGE_QUALITY;

  let { base64, width, height } = await bridge.captureScreenshot({ fullPage, quality });

  if (base64.length > MAX_SCREENSHOT_CHARS) {
    const resized = await bridge.resizeImage({
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
      const recompressed = await bridge.recompressImage({
        base64,
        width,
        height,
        quality,
      });
      base64 = recompressed.base64;
    }
  }

  if (base64.length > MAX_SCREENSHOT_CHARS) {
    throw new Error(`Error: screenshot exceeds ${MAX_SCREENSHOT_CHARS} characters even at minimum quality.`);
  }

  return await storeScreenshot(base64, `Screenshot captured (${fullPage ? "full page" : "visible area"})`);
}

async function storeScreenshot(base64: string, note: string): Promise<string> {
  const { ScreenshotManager } = await import("../../tracking/screenshotManager");
  const screenshotManager = ScreenshotManager.getInstance();

  const screenshotId = screenshotManager.storeScreenshot({
    type: "image",
    source: {
      type: "base64",
      media_type: "image/jpeg",
      data: base64,
    },
  });

  return JSON.stringify({
    type: "screenshotRef",
    id: screenshotId,
    note,
  });
}
