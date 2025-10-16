export type NavigationStrategy = "load" | "domcontentloaded" | "networkidle" | "all";

export interface DomSnapshotOptions {
  selector?: string;
  clean?: boolean;
  structure?: boolean;
  limit?: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface ScreenshotOptions {
  fullPage?: boolean;
  quality?: number;
  format?: "jpeg" | "png";
}

export interface ScreenshotResult {
  base64: string;
  width: number;
  height: number;
  format: "jpeg" | "png";
  fullPage: boolean;
}

export interface ResizeImageOptions {
  base64: string;
  targetWidth: number;
  quality: number;
}

export interface ResizeImageResult {
  base64: string;
  width: number;
  height: number;
}

export interface RecompressImageOptions {
  base64: string;
  width: number;
  height: number;
  quality: number;
}

export interface RecompressImageResult {
  base64: string;
}

export type DialogAction = "accept" | "dismiss";

export interface DialogInfo {
  type: string;
  message?: string;
  defaultValue?: string;
}

export interface DialogHandleResult {
  success: boolean;
  message: string;
}

export interface TabBridge {
  getTabId(): Promise<number | null>;
  getUrl(): Promise<string>;
  getTitle(): Promise<string>;
  navigate(url: string): Promise<void>;
  waitForNavigation(strategy: NavigationStrategy): Promise<void>;
  goBack(): Promise<void>;
  goForward(): Promise<void>;

  clickSelector(selector: string): Promise<void>;
  clickByText(text: string, options?: { exact?: boolean }): Promise<void>;
  fillSelector(selector: string, text: string): Promise<void>;

  typeText(text: string): Promise<void>;
  pressKey(key: string): Promise<void>;

  moveMouse(point: Point): Promise<void>;
  clickMouse(point: Point): Promise<void>;
  dragMouse(from: Point, to: Point): Promise<void>;

  getDomSnapshot(options: DomSnapshotOptions): Promise<string>;
  querySelectorOuterHTML(selector: string, limit: number): Promise<string[]>;
  getAccessibleTree(options?: { interestingOnly?: boolean }): Promise<unknown>;
  getVisibleText(): Promise<string>;

  captureScreenshot(options?: ScreenshotOptions): Promise<ScreenshotResult>;
  resizeImage(options: ResizeImageOptions): Promise<ResizeImageResult>;
  recompressImage(options: RecompressImageOptions): Promise<RecompressImageResult>;
  getViewport(): Promise<{ width: number; height: number; scrollWidth?: number; scrollHeight?: number }>;

  getLastDialog(): Promise<DialogInfo | null>;
  handleDialog(action: DialogAction, promptText?: string): Promise<DialogHandleResult>;

  dispose(): Promise<void>;
}
