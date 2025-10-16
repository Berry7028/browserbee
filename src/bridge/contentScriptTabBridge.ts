import {
  TabBridge,
  DomSnapshotOptions,
  NavigationStrategy,
  Point,
  ScreenshotOptions,
  ScreenshotResult,
  ResizeImageOptions,
  ResizeImageResult,
  RecompressImageOptions,
  RecompressImageResult,
  DialogInfo,
  DialogAction,
  DialogHandleResult,
  ElementState,
} from "./TabBridge";

const NAVIGATION_TIMEOUT_MS = 15000;

interface BridgeMessage {
  target: "content-script-bridge";
  id: string;
  method: string;
  params?: any;
}

interface BridgeReply {
  id: string;
  result?: any;
  error?: string;
}

let requestCounter = 0;

export class ContentScriptTabBridge implements TabBridge {
  constructor(private readonly tabId: number, private readonly windowId?: number) {}

  private async ensureContentScript(): Promise<void> {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: this.tabId },
        files: ["contentScript.js"],
        injectImmediately: false,
      });
    } catch (error) {
      // Ignore errors caused by already injected scripts or restricted pages
      if (error instanceof Error && error.message.includes("Cannot access a chrome")) {
        throw error;
      }
      if (error instanceof Error && error.message.includes("Invocation of form")) {
        // Happens when script already injected
        return;
      }
    }
  }

  private async sendRequest<T = unknown>(method: string, params?: unknown): Promise<T> {
    const id = `${Date.now()}-${++requestCounter}`;
    const message: BridgeMessage = {
      target: "content-script-bridge",
      id,
      method,
      params,
    };

    await this.ensureContentScript();

    return new Promise<T>((resolve, reject) => {
      chrome.tabs.sendMessage(this.tabId, message, (response: BridgeReply | undefined) => {
        const lastError = chrome.runtime.lastError;
        if (lastError) {
          reject(new Error(lastError.message));
          return;
        }
        if (!response) {
          reject(new Error("No response from content script"));
          return;
        }
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.result as T);
        }
      });
    });
  }

  getTabId(): Promise<number | null> {
    return Promise.resolve(this.tabId);
  }

  async getUrl(): Promise<string> {
    const tab = await chrome.tabs.get(this.tabId);
    return tab.url ?? (await this.sendRequest<string>("getUrl"));
  }

  async getTitle(): Promise<string> {
    const tab = await chrome.tabs.get(this.tabId);
    if (tab.title && tab.title.trim()) {
      return tab.title;
    }
    return this.sendRequest<string>("getTitle");
  }

  async navigate(url: string): Promise<void> {
    await chrome.tabs.update(this.tabId, { url });
  }

  async waitForNavigation(strategy: NavigationStrategy): Promise<void> {
    const lower = (strategy || "all").toLowerCase();
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        chrome.tabs.onUpdated.removeListener(listener);
        reject(new Error("Navigation timeout"));
      }, NAVIGATION_TIMEOUT_MS);

      const listener = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
        if (tabId !== this.tabId) return;
        if (lower === "networkidle" && changeInfo.status === "complete") {
          clearTimeout(timer);
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        } else if ((lower === "domcontentloaded" || lower === "all") && changeInfo.status === "complete") {
          clearTimeout(timer);
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        } else if (lower === "load" && changeInfo.status === "complete") {
          clearTimeout(timer);
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      };

      chrome.tabs.onUpdated.addListener(listener);
    });
  }

  async goBack(): Promise<void> {
    try {
      await chrome.tabs.goBack(this.tabId);
    } catch {
      await chrome.tabs.update(this.tabId, { url: "about:blank" });
    }
  }

  async goForward(): Promise<void> {
    try {
      await chrome.tabs.goForward(this.tabId);
    } catch {
      // ignore
    }
  }

  clickSelector(selector: string): Promise<void> {
    return this.sendRequest("clickSelector", { selector });
  }

  clickByText(text: string, options?: { exact?: boolean | undefined }): Promise<void> {
    return this.sendRequest("clickByText", { text, exact: options?.exact ?? false });
  }

  fillSelector(selector: string, text: string): Promise<void> {
    return this.sendRequest("fillSelector", { selector, text });
  }

  typeText(text: string): Promise<void> {
    return this.sendRequest("typeText", { text });
  }

  pressKey(key: string): Promise<void> {
    return this.sendRequest("pressKey", { key });
  }

  moveMouse(point: Point): Promise<void> {
    return this.sendRequest("moveMouse", point);
  }

  clickMouse(point: Point): Promise<void> {
    return this.sendRequest("clickMouse", point);
  }

  dragMouse(from: Point, to: Point): Promise<void> {
    return this.sendRequest("dragMouse", { from, to });
  }

  getDomSnapshot(options: DomSnapshotOptions): Promise<string> {
    return this.sendRequest("getDomSnapshot", options);
  }

  querySelectorOuterHTML(selector: string, limit: number): Promise<string[]> {
    return this.sendRequest("querySelectorOuterHTML", { selector, limit });
  }

  getAccessibleTree(options?: { interestingOnly?: boolean | undefined }): Promise<unknown> {
    return this.sendRequest("getAccessibleTree", { interestingOnly: options?.interestingOnly });
  }

  getVisibleText(): Promise<string> {
    return this.sendRequest("getVisibleText");
  }

  async captureScreenshot(options?: ScreenshotOptions): Promise<ScreenshotResult> {
    const format = options?.format ?? "jpeg";
    const quality = options?.quality ?? 40;
    const fullPage = options?.fullPage ?? false;

    if (!this.windowId && fullPage) {
      throw new Error("Full page screenshots require a known window context.");
    }

    const windowId = this.windowId ?? chrome.windows.WINDOW_ID_CURRENT;
    const dataUrl = await chrome.tabs.captureVisibleTab(windowId, {
      format,
      quality,
    });

    if (!dataUrl) {
      throw new Error("Failed to capture screenshot");
    }

    const base64 = dataUrl.replace(/^data:image\/(png|jpeg);base64,/i, "");
    const viewport = await this.getViewport();

    let width = viewport.width;
    let height = viewport.height;
    if (fullPage) {
      width = viewport.scrollWidth ?? width;
      height = viewport.scrollHeight ?? height;
    }

    return {
      base64,
      width,
      height,
      format,
      fullPage,
    };
  }

  resizeImage(options: ResizeImageOptions): Promise<ResizeImageResult> {
    return this.sendRequest("resizeImage", options);
  }

  recompressImage(options: RecompressImageOptions): Promise<RecompressImageResult> {
    return this.sendRequest("recompressImage", options);
  }

  getViewport(): Promise<{ width: number; height: number; scrollWidth?: number; scrollHeight?: number }> {
    return this.sendRequest("getViewport");
  }

  async getLastDialog(): Promise<DialogInfo | null> {
    return this.sendRequest("getLastDialog");
  }

  async handleDialog(action: DialogAction, promptText?: string): Promise<DialogHandleResult> {
    return this.sendRequest<DialogHandleResult>("handleDialog", { action, promptText });
  }

  async dispose(): Promise<void> {
    try {
      await this.sendRequest("resetDialog");
    } catch {
      // ignore
    }
  }

  inspectSelector(selector: string): Promise<ElementState> {
    return this.sendRequest("inspectSelector", { selector });
  }

  inspectByText(text: string, exact?: boolean): Promise<ElementState> {
    return this.sendRequest("inspectByText", { text, exact });
  }

  getInputValue(selector: string): Promise<string | null> {
    return this.sendRequest("getInputValue", { selector });
  }
}
