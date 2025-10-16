import { ContentScriptTabBridge } from '../bridge/contentScriptTabBridge';
import type { TabBridge } from '../bridge';
import { BrowserAgent } from '../agent/AgentCore';
import { TabState, WindowState } from './types';
import { logWithTimestamp } from './utils';

const tabStates = new Map<number, TabState>();
const windowToAgentMap = new Map<number, BrowserAgent>();
const tabToWindowMap = new Map<number, number>();
const attachedTabIds = new Set<number>();
let lastActiveTabId: number | null = null;

let currentTabId: number | null = null;

export function getCurrentTabId(): number | null {
  return currentTabId;
}

export function setCurrentTabId(tabId: number | null): void {
  currentTabId = tabId;
}

export function getTabState(tabId: number): TabState | null {
  return tabStates.get(tabId) || null;
}

export function setTabState(tabId: number, state: TabState): void {
  const previous = tabStates.get(tabId);
  if (previous?.bridge && previous.bridge !== state.bridge) {
    previous.bridge.dispose().catch(() => undefined);
  }
  tabStates.set(tabId, state);
}

export function addAttachedTab(tabId: number): void {
  attachedTabIds.add(tabId);
  logWithTimestamp(`Tab ${tabId} attached`);
}

export function removeAttachedTab(tabId: number): void {
  attachedTabIds.delete(tabId);
  tabStates.delete(tabId);
  tabToWindowMap.delete(tabId);
  logWithTimestamp(`Tab ${tabId} detached`);
}

export function isTabAttached(tabId: number): boolean {
  return attachedTabIds.has(tabId);
}

export function storeWindowForTab(tabId: number, windowId: number): void {
  tabToWindowMap.set(tabId, windowId);
}

export function getWindowForTab(tabId: number): number | undefined {
  return tabToWindowMap.get(tabId);
}

export function getAgentForWindow(windowId: number): BrowserAgent | null {
  return windowToAgentMap.get(windowId) || null;
}

export function setAgentForWindow(windowId: number, agent: BrowserAgent): void {
  windowToAgentMap.set(windowId, agent);
}

export function getAgentForTab(tabId: number): BrowserAgent | null {
  const windowId = getWindowForTab(tabId);
  return windowId !== undefined ? getAgentForWindow(windowId) : null;
}

function isSupportedUrl(url: string | undefined): boolean {
  if (!url) return false;
  if (url.startsWith('chrome://') || url.startsWith('edge://') || url.startsWith('about:')) {
    return false;
  }
  return true;
}

async function injectContentScript(tabId: number): Promise<void> {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['contentScript.js'],
      injectImmediately: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('Cannot access contents of url')) {
      throw error;
    }
    // Ignore errors caused by multiple injections
  }
}

export async function attachToTab(tabId: number, windowId?: number): Promise<boolean | { error: string; reason: string }> {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!isSupportedUrl(tab.url)) {
      return {
        error: 'unsupported_tab',
        reason: 'This page cannot be accessed by extensions for security reasons. Please navigate to a regular web page.',
      };
    }

    const resolvedWindowId = windowId ?? tab.windowId ?? chrome.windows.WINDOW_ID_CURRENT;
    setCurrentTabId(tabId);
    storeWindowForTab(tabId, resolvedWindowId);

    await injectContentScript(tabId);

    const bridge = new ContentScriptTabBridge(tabId, resolvedWindowId);
    const title = tab.title ?? 'Unknown Tab';
    setTabState(tabId, { bridge, windowId: resolvedWindowId, title });
    addAttachedTab(tabId);

    chrome.runtime.sendMessage({
      action: 'tabStatusChanged',
      status: 'attached',
      tabId,
      windowId: resolvedWindowId,
    });

    chrome.runtime.sendMessage({
      action: 'tabTitleChanged',
      tabId,
      title,
    });

    return true;
  } catch (error) {
    logWithTimestamp(`Error attaching to tab ${tabId}: ${error instanceof Error ? error.message : String(error)}`, 'error');
    return false;
  }
}

export function setupTabListeners(): void {
  chrome.tabs.onRemoved.addListener((tabId) => {
    if (!tabStates.has(tabId)) {
      return;
    }
    const state = tabStates.get(tabId);
    state?.bridge?.dispose().catch(() => undefined);
    removeAttachedTab(tabId);
    chrome.runtime.sendMessage({
      action: 'tabStatusChanged',
      status: 'detached',
      tabId,
    });
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    const state = tabStates.get(tabId);
    if (!state) return;

    if (changeInfo.title) {
      state.title = changeInfo.title;
      chrome.runtime.sendMessage({
        action: 'tabTitleChanged',
        tabId,
        title: changeInfo.title,
      });
    }

    if (tab.url && changeInfo.status === 'complete') {
      chrome.runtime.sendMessage({
        action: 'targetChanged',
        tabId,
        url: tab.url,
      });
    }
  });

  chrome.tabs.onActivated.addListener(({ tabId, windowId }) => {
    setCurrentTabId(tabId);
    const previous = lastActiveTabId;
    lastActiveTabId = tabId;
    chrome.runtime.sendMessage({
      action: 'activeTabChanged',
      oldTabId: previous,
      newTabId: tabId,
      title: tabStates.get(tabId)?.title ?? 'Unknown Tab',
      url: undefined,
    });

    if (!tabStates.has(tabId)) {
      attachToTab(tabId, windowId).catch(() => undefined);
    }
  });
}

export async function cleanupOnUnload(): Promise<void> {
  for (const [tabId, state] of tabStates.entries()) {
    state.bridge?.dispose().catch(() => undefined);
    chrome.runtime.sendMessage({
      action: 'tabStatusChanged',
      status: 'detached',
      tabId,
    });
  }
  tabStates.clear();
  tabToWindowMap.clear();
  attachedTabIds.clear();
  windowToAgentMap.clear();
  currentTabId = null;
  lastActiveTabId = null;
}

export async function forceResetPlaywright(): Promise<boolean> {
  await cleanupOnUnload();
  logWithTimestamp('Bridge state reset');
  return true;
}

export function cleanupWindowState(windowId: number): void {
  windowToAgentMap.delete(windowId);
}

export async function isConnectionHealthy(bridge: TabBridge | null | undefined): Promise<boolean> {
  if (!bridge) return false;
  try {
    await bridge.getTitle();
    return true;
  } catch (error) {
    logWithTimestamp(`Connection health check failed: ${error instanceof Error ? error.message : String(error)}`, 'warn');
    return false;
  }
}
