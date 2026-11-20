import React, { useState } from 'react';
import { Check, Copy, Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (isInstalled) {
    return null;
  }

  const appUrl =
    typeof window !== 'undefined' ? window.location.origin : '';

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      // Fallback ignored in restricted frames
    }
  };

  const handlePrimaryClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handlePrimaryClick}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-500/95 hover:bg-emerald-400 border border-emerald-300/60 text-[11px] font-display font-bold tracking-wider text-slate-950 transition-colors cursor-pointer whitespace-nowrap"
      >
        <Download className="w-3.5 h-3.5" />
        {isInstallable ? 'INSTALL HP / APP' : isIOS ? 'INSTALL iOS' : 'INSTALL / APK'}
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#04060b]/85 pointer-events-auto">
          <div className="w-full max-w-md bg-[#0b101b] border border-emerald-400/35 rounded-xl p-5 sm:p-6 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <h3 className="font-display text-lg font-bold tracking-wide text-white">
                    {isIOS ? 'Install di iPhone / iPad' : 'Install di HP & Build APK Android'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    PWA Offline + Siap Dibungkus Jadi File .APK
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Tutup panduan install"
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-200 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="py-4 space-y-2.5 text-sm text-slate-300">
                <p>1. Buka game ini langsung di browser <strong className="text-white">Safari</strong>.</p>
                <p>2. Ketuk tombol <strong className="text-emerald-300">Bagikan (Share)</strong> di bar bawah Safari.</p>
                <p>3. Gulir ke bawah lalu pilih <strong className="text-emerald-300">Tambah ke Layar Utama (Add to Home Screen)</strong>.</p>
              </div>
            ) : (
              <div className="py-4 space-y-3 text-xs text-slate-300 leading-relaxed">
                <div className="rounded-lg bg-slate-900/90 border border-white/10 p-3 space-y-1">
                  <div className="font-display font-bold text-emerald-300 text-xs tracking-wider">
                    CARA 1 — INSTALL LANGSUNG DI HP ANDROID (10 DETIK)
                  </div>
                  <p>
                    Buka URL publik game ini di <strong className="text-white">Google Chrome Android</strong>, lalu ketuk menu titik tiga (<strong className="text-white">⋮</strong>) → <strong className="text-emerald-300">Instal aplikasi</strong>. Game akan muncul di Layar Utama layar penuh tanpa address bar.
                  </p>
                </div>

                <div className="rounded-lg bg-slate-900/90 border border-amber-400/25 p-3 space-y-1.5">
                  <div className="font-display font-bold text-amber-300 text-xs tracking-wider">
                    CARA 2 — GENERATE FILE .APK TANPA ANDROID STUDIO
                  </div>
                  <p>
                    1. Klik <strong className="text-white">Share / Deploy</strong> untuk mendapatkan URL publik aplikasi.<br />
                    2. Buka <strong className="text-cyan-300">pwabuilder.com</strong> lalu tempel URL tersebut.<br />
                    3. Klik <strong className="text-amber-300">Package for Stores → Android → Download Package</strong> untuk langsung mendapatkan file <strong className="text-white">.apk</strong> siap pasang!
                  </p>
                  {appUrl && (
                    <div className="flex items-center gap-2 pt-1">
                      <code className="flex-1 truncate rounded bg-slate-950 px-2.5 py-1.5 text-[11px] text-cyan-300 border border-white/10">
                        {appUrl}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopyUrl}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-semibold cursor-pointer shrink-0"
                      >
                        {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedUrl ? 'Disalin' : 'Salin'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="rounded-lg bg-slate-900/90 border border-cyan-400/25 p-3 space-y-1">
                  <div className="font-display font-bold text-cyan-300 text-xs tracking-wider">
                    CARA 3 — APK OFFLINE VIA GITHUB ACTIONS (CAPACITOR)
                  </div>
                  <p>
                    Export proyek ke GitHub — workflow <strong className="text-white">Build Android APK</strong> sudah terpasang otomatis di tab <strong className="text-cyan-300">Actions</strong> untuk mengunduh file <strong className="text-white">ZombieSurvival-LastStand.apk</strong> tanpa perlu instal Android Studio.
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-xs tracking-wider cursor-pointer"
              >
                MENGERTI
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
