import ReactDOM from 'react-dom/client';
import App from './App';

import './index.css';

declare global {
  interface Window {
    aiGirl?: {
      onStatus?: (cb: (s: any) => void) => () => void;
      quit?: () => Promise<{ ok: boolean }>;
      mic?: {
        start: () => Promise<{ ok: boolean }>;
        stop: () => Promise<{ ok: boolean }>;
      };
      sendAudioChunk?: (buf: ArrayBuffer, timestamp: number) => void;
    };
  }
}

const unsubs: Array<() => void> = [];
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);

if (window.aiGirl?.onStatus) {
  const off = window.aiGirl.onStatus!(s => {
    // you can pipe status to a toast/indicator later
    console.log('status', s);
  });
  unsubs.push(off);
}

window.addEventListener('unload', () => unsubs.forEach(fn => fn()));
