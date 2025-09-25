export {};

declare global {
  interface Window {
    aiGirl?: {
      quit?: () => Promise<{ ok: boolean }>;
      onStatus?: (cb: (s: any) => void) => () => void;
      mic?: {
        start: () => Promise<{ ok: boolean }>;
        stop: () => Promise<{ ok: boolean }>;
      };
      sendAudioChunk?: (buf: ArrayBuffer, timestamp: number) => void;
    };
    aiGirlOverlay?: Record<string, unknown>;
  }
}
