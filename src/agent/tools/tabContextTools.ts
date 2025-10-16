import { DynamicTool } from "langchain/tools";
import type { TabBridge } from "../../bridge";
import { ToolFactory } from "./types";
import { getCurrentTabId, withActiveBridge } from "./utils";

export const browserGetActiveTab: ToolFactory = (bridge: TabBridge) =>
  new DynamicTool({
    name: "browser_get_active_tab",
    description:
      "Returns information about the currently active tab, including its index, URL, and title.",
    func: async () => {
      try {
        return await withActiveBridge(bridge, async (activeBridge) => {
          const [tabs, tabIdPromise, urlPromise, titlePromise] = await Promise.all([
            chrome.tabs.query({ currentWindow: true }),
            getCurrentTabId(activeBridge),
            activeBridge.getUrl(),
            activeBridge.getTitle(),
          ]);

          const tabId = tabIdPromise ?? null;
          const fallbackUrl = await urlPromise;
          const fallbackTitle = await titlePromise;

          const activeTab = tabId
            ? tabs.find((tab) => tab.id === tabId)
            : tabs.find((tab) => tab.active);
          const activeIndex = activeTab ? tabs.indexOf(activeTab) : -1;
          const url = activeTab?.url ?? fallbackUrl;
          const title = activeTab?.title ?? fallbackTitle;

          if (tabId && title) {
            chrome.runtime.sendMessage({
              action: "tabTitleChanged",
              tabId,
              title,
            });
            console.log(
              `Sent tabTitleChanged message for active tab ${tabId} with title "${title}"`,
            );
          }

          return JSON.stringify(
            {
              activeTabIndex: activeIndex,
              url,
              title,
              totalTabs: tabs.length,
            },
            null,
            2,
          );
        });
      } catch (err) {
        return `Error getting active tab: ${
          err instanceof Error ? err.message : String(err)
        }`;
      }
    },
  });

export const browserNavigateTab: ToolFactory = (bridge: TabBridge) =>
  new DynamicTool({
    name: "browser_navigate_tab",
    description:
      "Navigate a specific tab to a URL. Input format: 'tabIndex|url' (e.g., '1|https://example.com')",
    func: async (input: string) => {
      try {
        const parts = input.split("|");
        if (parts.length !== 2) {
          return "Error: Input must be in the format 'tabIndex|url'";
        }

        const index = Number(parts[0].trim());
        const url = parts[1].trim();

        if (Number.isNaN(index)) {
          return "Error: Tab index must be a number";
        }

        const tabs = await chrome.tabs.query({ currentWindow: true });
        if (index < 0 || index >= tabs.length) {
          return `Error: Tab index ${index} out of range (0-${tabs.length - 1})`;
        }

        const target = tabs[index];
        if (!target.id) {
          return "Error: Target tab is missing an ID.";
        }

        await chrome.tabs.update(target.id, { url });

        try {
          const updated = await chrome.tabs.get(target.id);
          const newTitle = updated.title ?? url;
          chrome.runtime.sendMessage({
            action: "tabTitleChanged",
            tabId: target.id,
            title: newTitle,
          });
          chrome.runtime.sendMessage({
            action: "targetChanged",
            tabId: target.id,
            url,
          });
          console.log(
            `Sent tabTitleChanged and targetChanged messages for tab ${target.id} after navigation to ${url}`,
          );
        } catch (messageError) {
          console.error("Error updating UI after tab navigation:", messageError);
        }

        return `Successfully navigated tab ${index} to ${url}`;
      } catch (error) {
        return `Error: ${error instanceof Error ? error.message : String(error)}`;
      }
    },
  });

export const browserScreenshotTab: ToolFactory = (_bridge: TabBridge) =>
  new DynamicTool({
    name: "browser_screenshot_tab",
    description:
      "Take a screenshot of a specific tab by index. Input format: 'tabIndex[,flags]' (e.g., '1,full')",
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

        if (!target.active) {
          return "Error: Target tab must be active. Use browser_tab_select before taking a screenshot.";
        }

        if (flags.includes("full")) {
          console.warn("browser_screenshot_tab: 'full' flag is not yet supported; capturing visible area only.");
        }

        const windowId = target.windowId ?? chrome.windows.WINDOW_ID_CURRENT;
        const dataUrl = await chrome.tabs.captureVisibleTab(windowId, {
          format: "jpeg",
          quality: 70,
        });

        if (!dataUrl) {
          return "Error: Failed to capture screenshot.";
        }

        const base64 = dataUrl.replace(/^data:image\/(png|jpeg);base64,/i, "");

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
          note: "Screenshot captured (visible area)",
        });
      } catch (error) {
        return `Error taking tab screenshot: ${
          error instanceof Error ? error.message : String(error)
        }`;
      }
    },
  });
