import { DynamicTool } from "langchain/tools";
import type { TabBridge } from "../../bridge";
import { NavigationStrategy } from "../../bridge";
import { ToolFactory } from "./types";
import { withActiveBridge, getCurrentTabId } from "./utils";

export const browserNavigate: ToolFactory = (bridge: TabBridge) =>
  new DynamicTool({
    name: "browser_navigate",
    description:
      "Navigate the browser to a specific URL. Input must be a full URL, e.g. https://example.com",
    func: async (url: string) => {
      try {
        return await withActiveBridge(bridge, async (activeBridge) => {
          // Navigate to the URL
          await activeBridge.navigate(url);
          
          // Get the tab ID and title after navigation
          try {
            const tabId = await getCurrentTabId(activeBridge);
            const newTitle = await activeBridge.getTitle();
            
            // Send a message to update the UI with the new tab title
            if (tabId) {
              chrome.runtime.sendMessage({
                action: 'tabTitleChanged',
                tabId: tabId,
                title: newTitle
              });
              console.log(`Sent tabTitleChanged message for tab ${tabId} with title "${newTitle}" after navigation to ${url}`);
              
              // Also send a targetChanged message
              chrome.runtime.sendMessage({
                action: 'targetChanged',
                tabId: tabId,
                url: url
              });
            }
          } catch (titleError) {
            console.error("Error updating UI after navigation:", titleError);
          }
          
          return `Successfully navigated to ${url}`;
        });
      } catch (error) {
        return `Error navigating to ${url}: ${
          error instanceof Error ? error.message : String(error)
        }`;
      }
    },
  });

export const browserWaitForNavigation: ToolFactory = (bridge: TabBridge) =>
  new DynamicTool({
    name: "browser_wait_for_navigation",
    description: 
      "Wait for navigation to complete using specified strategy. Input options (default: all):\n" +
      "  • load - wait for the 'load' event (DOM and resources loaded)\n" +
      "  • domcontentloaded - wait for the 'DOMContentLoaded' event (DOM loaded, faster than 'load')\n" +
      "  • networkidle - wait until network is idle for 500ms (may timeout on sites with continuous activity)\n" +
      "  • all - try multiple strategies in sequence with shorter timeouts (recommended)",
    func: async (strategy: string = "all") => {
      try {
        return await withActiveBridge(bridge, async (activeBridge) => {
          const requested = (strategy || "all").toLowerCase();
          const normalized: NavigationStrategy =
            requested === "load" ||
            requested === "domcontentloaded" ||
            requested === "networkidle"
              ? (requested as NavigationStrategy)
              : "all";
          await activeBridge.waitForNavigation(normalized);
          switch (normalized) {
            case "load":
              return "Navigation complete (DOM loaded).";
            case "domcontentloaded":
              return "Navigation complete (DOM content loaded).";
            case "networkidle":
              return "Navigation complete (network idle).";
            case "all":
            default:
              return "Navigation complete.";
          }
        });
      } catch (error) {
        return `Error waiting for navigation: ${
          error instanceof Error ? error.message : String(error)
        }`;
      }
    },
  });

export const browserNavigateBack: ToolFactory = (bridge: TabBridge) =>
  new DynamicTool({
    name: "browser_navigate_back",
    description: "Go back to the previous page (history.back()). No input.",
    func: async () => {
      try {
        return await withActiveBridge(bridge, async (activeBridge) => {
          await activeBridge.goBack();
          return "Navigated back.";
        });
      } catch (err) {
        return `Error going back: ${
          err instanceof Error ? err.message : String(err)
        }`;
      }
    },
  });

export const browserNavigateForward: ToolFactory = (bridge: TabBridge) =>
  new DynamicTool({
    name: "browser_navigate_forward",
    description: "Go forward to the next page (history.forward()). No input.",
    func: async () => {
      try {
        return await withActiveBridge(bridge, async (activeBridge) => {
          await activeBridge.goForward();
          return "Navigated forward.";
        });
      } catch (err) {
        return `Error going forward: ${
          err instanceof Error ? err.message : String(err)
        }`;
      }
    },
  });
