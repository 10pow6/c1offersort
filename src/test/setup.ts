import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

type MessageListener = (
  message: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
) => void;

const messageListeners = new Set<MessageListener>();

globalThis.chrome = {
  runtime: {
    onMessage: {
      addListener: (listener: MessageListener) => {
        messageListeners.add(listener);
      },
      removeListener: (listener: MessageListener) => {
        messageListeners.delete(listener);
      },
      callListeners: (message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
        messageListeners.forEach(listener => listener(message, sender, sendResponse));
      },
    },
  },
  storage: {
    local: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
    },
  },
  tabs: {
    query: vi.fn(),
  },
  scripting: {
    executeScript: vi.fn(),
  },
} as any;
