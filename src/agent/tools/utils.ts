import type { TabBridge } from "../../bridge";
import { getCurrentBridge } from "../PageContextManager";

/**
 * Helper function to get the current tab ID from a page
 * @param page The page to get the tab ID for
 * @returns Promise resolving to the tab ID or undefined if not found
 */
export async function getCurrentTabId(bridge: TabBridge): Promise<number | null> {
  try {
    return await bridge.getTabId();
  } catch (error) {
    console.error("Error getting current tab ID via bridge:", error);
    return null;
  }
}

// Constants for output size limits
export const MAX_RETURN_CHARS = 20000;
export const MAX_SCREENSHOT_CHARS = 500000;

/**
 * Helper function to execute a function with the active page from PageContextManager
 * @param page The original page reference
 * @param fn The function to execute with the active page
 * @returns The result of the function
 */
export async function withActiveBridge<T>(
  bridge: TabBridge,
  fn: (activeBridge: TabBridge) => Promise<T>
): Promise<T> {
  const activeBridge = getCurrentBridge(bridge);
  return await fn(activeBridge);
}

/**
 * Truncate a string to a maximum length
 * @param str The string to truncate
 * @param maxLength The maximum length (default: MAX_RETURN_CHARS)
 * @returns The truncated string
 */
export function truncate(str: string, maxLength: number = MAX_RETURN_CHARS): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + `\n\n[Truncated ${str.length - maxLength} characters]`;
}

// Dialog handling
