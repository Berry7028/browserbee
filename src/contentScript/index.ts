declare global {
  interface Window {
    __browserbeeBridgeInjected__?: boolean;
  }
}

if (!window.__browserbeeBridgeInjected__) {
  window.__browserbeeBridgeInjected__ = true;

  const MAX_DOM_RETURN_CHARS = 20000;
  const MAX_SCREENSHOT_CHARS = 500000;

  interface ElementState {
    found: boolean;
    visible: boolean;
    disabled: boolean;
    description?: string;
    matches?: number;
  }

  const isElementVisible = (element: Element): boolean => {
    const style = window.getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) {
      return false;
    }
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  };

  const buildElementDescription = (element: Element): string => {
    const parts = [element.tagName.toLowerCase()];
    if (element.id) parts.push(`#${element.id}`);
    if (element.classList.length) parts.push(`.${Array.from(element.classList).join('.')}`);
    return parts.join('');
  };

  function inspectSelector(selector: string): ElementState {
    const element = document.querySelector<HTMLElement>(selector);
    if (!element) {
      return { found: false, visible: false, disabled: false };
    }
    const disabled = element.matches(':disabled');
    return {
      found: true,
      visible: isElementVisible(element),
      disabled,
      description: buildElementDescription(element),
    };
  }

  function inspectByText(text: string, exact?: boolean): ElementState {
    const needle = text.trim();
    if (!needle) {
      return { found: false, visible: false, disabled: false };
    }
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let matches = 0;
    let firstMatch: HTMLElement | null = null;
    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      const content = node.textContent?.trim();
      if (!content) continue;
      const match = exact ? content === needle : content.includes(needle);
      if (!match) continue;
      matches += 1;
      if (!firstMatch && node.parentElement instanceof HTMLElement) {
        firstMatch = node.parentElement;
      }
    }
    if (!firstMatch) {
      return { found: false, visible: false, disabled: false, matches: 0 };
    }
    const disabled = firstMatch.matches(':disabled');
    return {
      found: true,
      visible: isElementVisible(firstMatch),
      disabled,
      description: buildElementDescription(firstMatch),
      matches,
    };
  }

interface BridgeRequest {
  id: string;
  method: string;
  params?: any;
}

interface BridgeResponse {
  id: string;
  result?: unknown;
  error?: string;
}

type Handler = (params?: any) => Promise<unknown> | unknown;

type DialogAction = "accept" | "dismiss";

interface DialogState {
  type: string;
  message?: string;
  defaultValue?: string;
}

let lastDialog: DialogState | null = null;
let nextDialogDirective: { action: DialogAction; promptText?: string } | null = null;

function installDialogOverrides() {
  const originalAlert = window.alert.bind(window);
  const originalConfirm = window.confirm.bind(window);
  const originalPrompt = window.prompt.bind(window);

  window.alert = (message?: any) => {
    lastDialog = { type: "alert", message: String(message ?? "") };
    const directive = nextDialogDirective;
    nextDialogDirective = null;

    if (directive) {
      // Automatically "accept" alert by no-op to avoid blocking dialog
      return;
    }

    originalAlert(message);
  };

  window.confirm = (message?: string | undefined): boolean => {
    lastDialog = { type: "confirm", message: String(message ?? "") };
    const directive = nextDialogDirective;
    nextDialogDirective = null;

    if (directive) {
      return directive.action === "accept";
    }

    return originalConfirm(message);
  };

  window.prompt = (message?: string | undefined, _default?: string | undefined): string | null => {
    lastDialog = {
      type: "prompt",
      message: String(message ?? ""),
      defaultValue: _default,
    };
    const directive = nextDialogDirective;
    nextDialogDirective = null;

    if (directive) {
      if (directive.action === "accept") {
        return directive.promptText ?? _default ?? "";
      }
      return null;
    }

    return originalPrompt(message, _default);
  };
}

installDialogOverrides();

  const handlers: Record<string, Handler> = {
    ping: () => "pong",
    getTitle: () => document.title,
    getUrl: () => window.location.href,
    inspectSelector: ({ selector }: { selector: string }) => inspectSelector(selector),
    inspectByText: ({ text, exact }: { text: string; exact?: boolean }) => inspectByText(text, exact),
    getInputValue: ({ selector }: { selector: string }) => {
      const element = document.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(selector);
      if (!element) return null;
      if (element instanceof HTMLSelectElement) {
        return element.value;
      }
      if ('value' in element) {
        return (element as HTMLInputElement | HTMLTextAreaElement).value;
      }
      if ((element as HTMLElement).isContentEditable) {
        return (element as HTMLElement).innerText;
      }
      return null;
    },
    clickSelector: ({ selector }: { selector: string }) => {
      const element = document.querySelector<HTMLElement>(selector);
      if (!element) throw new Error(`Selector not found: ${selector}`);
      element.click();
      return true;
    },
    clickByText: ({ text, exact }: { text: string; exact?: boolean }) => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const needle = text.trim();
      while (walker.nextNode()) {
        const node = walker.currentNode as Text;
        const content = node.textContent?.trim() || "";
        if (!content) continue;
        const match = exact ? content === needle : content.includes(needle);
        if (match && node.parentElement instanceof HTMLElement) {
          node.parentElement.click();
          return true;
        }
      }
      throw new Error(`Element containing text "${needle}" not found`);
    },
    fillSelector: ({ selector, text }: { selector: string; text: string }) => {
      const element = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);
      if (!element) throw new Error(`Selector not found: ${selector}`);
      element.focus();
      element.value = text;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    },
    typeText: ({ text }: { text: string }) => {
      const active = document.activeElement as HTMLElement | null;
      if (!active) throw new Error("No active element to type into");
      if ('value' in active) {
        const input = active as HTMLInputElement | HTMLTextAreaElement;
        input.value += text;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      active.dispatchEvent(
        new InputEvent('beforeinput', {
          inputType: 'insertText',
          data: text,
          bubbles: true,
        }),
      );
      active.textContent = (active.textContent || '') + text;
      active.dispatchEvent(
        new InputEvent('input', {
          inputType: 'insertText',
          data: text,
          bubbles: true,
        }),
      );
      return true;
    },
    pressKey: ({ key }: { key: string }) => {
      const active = document.activeElement || document.body;
      ['keydown', 'keypress', 'keyup'].forEach((type) => {
        const event = new KeyboardEvent(type, {
          key,
          bubbles: true,
          cancelable: true,
        });
        active.dispatchEvent(event);
      });
      return true;
    },
    moveMouse: ({ x, y }: { x: number; y: number }) => {
      const target = document.elementFromPoint(x, y);
      if (!target) throw new Error('No element at provided coordinates');
      target.dispatchEvent(
        new MouseEvent('mousemove', {
          clientX: x,
          clientY: y,
          bubbles: true,
          cancelable: true,
          buttons: 0,
        }),
      );
      return true;
    },
    clickMouse: ({ x, y }: { x: number; y: number }) => {
      const target = document.elementFromPoint(x, y);
      if (!target) throw new Error('No element at provided coordinates');
      ['mousedown', 'mouseup', 'click'].forEach((type) => {
        target.dispatchEvent(
          new MouseEvent(type, {
            clientX: x,
            clientY: y,
            bubbles: true,
            cancelable: true,
          }),
        );
      });
      return true;
    },
    dragMouse: ({ from, to }: { from: { x: number; y: number }; to: { x: number; y: number } }) => {
      const start = document.elementFromPoint(from.x, from.y);
      if (!start) throw new Error('No element at starting coordinates');
      start.dispatchEvent(
        new PointerEvent('pointerdown', {
          clientX: from.x,
          clientY: from.y,
          bubbles: true,
          cancelable: true,
        }),
      );
      document.dispatchEvent(
        new PointerEvent('pointermove', {
          clientX: to.x,
          clientY: to.y,
          bubbles: true,
          cancelable: true,
        }),
      );
      const end = document.elementFromPoint(to.x, to.y) || document.body;
      end.dispatchEvent(
        new PointerEvent('pointerup', {
          clientX: to.x,
          clientY: to.y,
          bubbles: true,
          cancelable: true,
        }),
      );
      return true;
    },
    getDomSnapshot: (params: any) => {
    const { selector, clean, structure, limit } = params || {};
    const max = typeof limit === "number" ? limit : MAX_DOM_RETURN_CHARS;

    const serialize = (element: Element): string => element.outerHTML;

    const sanitize = (node: Node): string => {
      if (node.nodeType === Node.TEXT_NODE) return node.textContent || "";
      if (node.nodeType !== Node.ELEMENT_NODE) return "";
      const element = node as Element;
      if (["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE", "META", "LINK"].includes(element.tagName)) {
        return "";
      }
      const clone = element.cloneNode(false) as Element;
      Array.from(element.attributes).forEach((attr) => {
        if (!attr.name.startsWith("on") && !attr.name.startsWith("data-")) {
          clone.setAttribute(attr.name, attr.value);
        }
      });
      Array.from(element.childNodes)
        .map((child) => sanitize(child))
        .forEach((childHtml) => {
          if (childHtml) {
            clone.innerHTML += childHtml;
          }
        });
      return clone.outerHTML;
    };

    const describeStructure = (element: Element, depth = 0): string => {
      const tagName = element.tagName.toLowerCase();
      const id = element.id ? `#${element.id}` : "";
      const classes =
        element.className && typeof element.className === "string"
          ? `.${element.className.split(" ").filter(Boolean).join(".")}`
          : "";
      let result = `${"  ".repeat(depth)}<${tagName}${id}${classes}>`;
      if (element.children.length > 0) {
        result +=
          "\n" +
          Array.from(element.children)
            .map((child) => describeStructure(child, depth + 1))
            .join("\n");
        result += `\n${"  ".repeat(depth)}</${tagName}>`;
      } else {
        result += `</${tagName}>`;
      }
      return result;
    };

    let html = "";
    if (selector) {
      const elements = Array.from(document.querySelectorAll(selector));
      if (!elements.length) {
        return `No elements found matching selector: ${selector}`;
      }
      html = elements
        .map((element) => {
          if (structure) return describeStructure(element);
          if (clean) return sanitize(element);
          return serialize(element);
        })
        .join("\n\n");
    } else {
      const root = document.documentElement;
      if (structure) {
        html = describeStructure(root);
      } else if (clean) {
        html = sanitize(root);
      } else {
        html = root.outerHTML;
      }
    }

    return truncate(html, max);
  },
  querySelectorOuterHTML: ({ selector, limit }: { selector: string; limit: number }) => {
    return Array.from(document.querySelectorAll(selector))
      .slice(0, limit)
      .map((node) => node.outerHTML);
  },
  getAccessibleTree: ({ interestingOnly }: { interestingOnly?: boolean }) => {
    const buildTree = (element: Element): any => {
      const children = Array.from(element.children).map((child) => buildTree(child));
      const info: any = {
        role: element.getAttribute("role") || element.tagName.toLowerCase(),
        name: element.getAttribute("aria-label") || element.textContent?.trim().slice(0, 80) || "",
        tag: element.tagName.toLowerCase(),
        children: children.length ? children : undefined,
      };
      return info;
    };

    if (interestingOnly) {
      const interesting: any[] = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, {
        acceptNode: (node) => {
          const element = node as Element;
          const hasRole = element.hasAttribute("role");
          const hasLabel = element.hasAttribute("aria-label");
          const text = element.textContent?.trim() || "";
          if (hasRole || hasLabel || text.length > 0) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_SKIP;
        },
      });
      while (walker.nextNode()) {
        const element = walker.currentNode as Element;
        interesting.push(buildTree(element));
      }
      return interesting;
    }

    return buildTree(document.documentElement);
  },
  getVisibleText: () => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        const parent = (node as Text).parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (getComputedStyle(parent).display === "none" || getComputedStyle(parent).visibility === "hidden") {
          return NodeFilter.FILTER_REJECT;
        }
        const text = node.textContent?.trim();
        if (!text) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    const out: string[] = [];
    while (walker.nextNode()) {
      const text = walker.currentNode.textContent?.trim();
      if (text) out.push(text);
    }
    return truncate(out.join("\n"));
  },
  getViewport: () => ({
    width: window.innerWidth,
    height: window.innerHeight,
    scrollWidth: document.documentElement.scrollWidth,
    scrollHeight: document.documentElement.scrollHeight,
  }),
  getLastDialog: () => lastDialog,
  handleDialog: ({ action, promptText }: { action: string; promptText?: string }) => {
    if (action !== "accept" && action !== "dismiss") {
      return {
        success: false,
        message: `Unsupported dialog action: ${action}`,
      };
    }

    nextDialogDirective = {
      action: action as DialogAction,
      promptText,
    };

    return {
      success: true,
      message:
        action === "accept"
          ? "Next dialog will be accepted automatically."
          : "Next dialog will be dismissed automatically.",
    };
  },
  resizeImage: async ({ base64, targetWidth, quality }: { base64: string; targetWidth: number; quality: number }) => {
    const image = await loadImage(base64);
    if (image.width <= targetWidth) {
      return { base64, width: image.width, height: image.height };
    }

    const canvas = document.createElement("canvas");
    const scale = targetWidth / image.width;
    canvas.width = targetWidth;
    canvas.height = Math.round(image.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get canvas context");
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    const resized = canvas
      .toDataURL("image/jpeg", Math.min(Math.max(quality / 100, 0), 1))
      .replace(/^data:image\/jpeg;base64,/, "");
    return { base64: resized, width: canvas.width, height: canvas.height };
  },
  recompressImage: async ({ base64, width, height, quality }: { base64: string; width: number; height: number; quality: number }) => {
    const image = await loadImage(base64);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get canvas context");
    ctx.drawImage(image, 0, 0, width, height);
    const recompressed = canvas
      .toDataURL("image/jpeg", Math.min(Math.max(quality / 100, 0), 1))
      .replace(/^data:image\/jpeg;base64,/, "");
    return { base64: recompressed };
  },
  resetDialog: () => {
    lastDialog = null;
    return true;
  },
  };

  chrome.runtime.onMessage.addListener((message: any, _sender, sendResponse) => {
  if (!message || message.target !== "content-script-bridge") {
    return false;
  }

  const bridgeMessage = message as BridgeRequest;
  if (!bridgeMessage.id || !bridgeMessage.method) {
    return false;
  }

  const handler = handlers[bridgeMessage.method];
  if (!handler) {
    const response: BridgeResponse = {
      id: bridgeMessage.id,
      error: `Unknown method: ${bridgeMessage.method}`,
    };
    sendResponse(response);
    return false;
  }

  Promise.resolve()
    .then(() => handler(bridgeMessage.params))
    .then((result) => {
      const response: BridgeResponse = { id: bridgeMessage.id, result };
      sendResponse(response);
    })
    .catch((error: any) => {
      const response: BridgeResponse = {
        id: bridgeMessage.id,
        error: error instanceof Error ? error.message : String(error),
      };
      sendResponse(response);
    });

    return true;
  });

  function truncate(str: string, maxLength: number = MAX_DOM_RETURN_CHARS): string {
    if (str.length <= maxLength) return str;
    return `${str.substring(0, maxLength)}\n\n[Truncated ${str.length - maxLength} characters]`;
  }

  function loadImage(base64: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = `data:image/jpeg;base64,${base64}`;
    });
  }
}

export {};
