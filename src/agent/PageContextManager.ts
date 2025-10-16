import type { TabBridge } from "../bridge";

/**
 * PageContextManager is responsible for tracking the currently active page.
 * This ensures that all tools operate on the correct page, even after tab switching.
 */
export class PageContextManager {
  private static instance: PageContextManager;
  private currentBridge: TabBridge | null = null;

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  /**
   * Get the singleton instance of PageContextManager
   */
  public static getInstance(): PageContextManager {
    if (!PageContextManager.instance) {
      PageContextManager.instance = new PageContextManager();
    }
    return PageContextManager.instance;
  }

  /**
   * Set the current active page
   * @param page The page to set as active
   */
  public setCurrentBridge(bridge: TabBridge): void {
    this.currentBridge = bridge;
    console.log("PageContextManager: Active bridge updated");
  }

  /**
   * Get the current active page
   * @param fallbackPage Fallback page to use if no current page is set
   * @returns The current active page or the fallback page
   */
  public getCurrentBridge(fallbackBridge: TabBridge): TabBridge {
    return this.currentBridge || fallbackBridge;
  }

  /**
   * Initialize the PageContextManager with an initial page
   * @param initialPage The initial page to set
   */
  public initialize(initialBridge: TabBridge): void {
    if (!this.currentBridge) {
      this.currentBridge = initialBridge;
      console.log("PageContextManager: Initialized with initial bridge");
    }
  }

  /**
   * Reset the PageContextManager
   */
  public reset(): void {
    this.currentBridge = null;
    console.log("PageContextManager: Reset");
  }
}

/**
 * Helper function to get the current active page
 * @param fallbackPage Fallback page to use if no current page is set
 * @returns The current active page or the fallback page
 */
export function getCurrentBridge(fallbackBridge: TabBridge): TabBridge {
  return PageContextManager.getInstance().getCurrentBridge(fallbackBridge);
}

/**
 * Helper function to set the current active page
 * @param page The page to set as active
 */
export function setCurrentBridge(bridge: TabBridge): void {
  PageContextManager.getInstance().setCurrentBridge(bridge);
}

/**
 * Helper function to initialize the PageContextManager
 * @param initialPage The initial page to set
 */
export function initializePageContext(initialBridge: TabBridge): void {
  PageContextManager.getInstance().initialize(initialBridge);
}

/**
 * Helper function to reset the PageContextManager
 */
export function resetPageContext(): void {
  PageContextManager.getInstance().reset();
}

/**
 * Backwards compatible helper returning the current bridge. Will be removed once all call sites migrate.
 * @deprecated Use getCurrentBridge instead.
 */
export function getCurrentPage(fallbackBridge: TabBridge): TabBridge {
  return getCurrentBridge(fallbackBridge);
}

/**
 * Backwards compatible helper alias for setCurrentBridge.
 * @deprecated Use setCurrentBridge instead.
 */
export function setCurrentPage(bridge: TabBridge): void {
  setCurrentBridge(bridge);
}
