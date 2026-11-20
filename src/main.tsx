import React from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Only register Web Service Worker outside native Capacitor Android APK
const isCapacitorNative =
  typeof window !== 'undefined' &&
  typeof (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
    ?.isNativePlatform === 'function' &&
  Boolean(
    (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
      ?.isNativePlatform?.(),
  );

if (!isCapacitorNative && 'serviceWorker' in navigator) {
  try {
    registerSW({ immediate: true });
  } catch {
    // Ignore SW registration failure in restricted WebViews
  }
}

interface ErrorBoundaryState {
  error: Error | null;
}

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="w-screen h-screen flex items-center justify-center bg-[#07090d] text-slate-100 p-6 text-center">
          <div className="max-w-md bg-[#0b101b] border border-red-500/40 rounded-xl p-6 space-y-3">
            <h2 className="font-display text-xl font-bold text-amber-400">
              Gagal Memuat Tampilan 3D Game
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Perangkat atau emulator Android Anda mungkin belum mengaktifkan akselerasi WebGL/OpenGL atau menggunakan Android System WebView versi lama.
            </p>
            <pre className="text-[10px] text-left text-red-300 bg-slate-950 p-2.5 rounded-lg overflow-x-auto max-h-28 border border-white/10">
              {this.state.error.message}
            </pre>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-lg bg-amber-500 text-slate-950 font-display font-bold text-xs tracking-wider cursor-pointer"
            >
              MUAT ULANG GAME
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>,
);
