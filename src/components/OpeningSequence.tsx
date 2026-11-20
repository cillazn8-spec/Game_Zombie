import React, { useState } from 'react';
import { ArrowRight, FastForward, ShieldAlert, Volume2 } from 'lucide-react';
import { MAPS, MapId } from '../types/game';

interface OpeningSequenceProps {
  progress: number;
  selectedMap: MapId;
  onUnlockAudio: () => void;
  onSkip: () => void;
}

export const OpeningSequence: React.FC<OpeningSequenceProps> = ({
  progress,
  selectedMap,
  onUnlockAudio,
  onSkip,
}) => {
  const [audioStarted, setAudioStarted] = useState(false);

  const clamped = Math.max(0, Math.min(1, progress));
  const beat = clamped < 0.34 ? 1 : clamped < 0.67 ? 2 : 3;
  const introDone = clamped >= 0.99;

  const barHeightClass = introDone ? 'h-10 sm:h-12' : 'h-12 sm:h-16';

  const handleStageTap = () => {
    if (!audioStarted) {
      setAudioStarted(true);
      onUnlockAudio();
    }
  };

  return (
    <div
      onClick={handleStageTap}
      className="absolute inset-0 z-30 flex flex-col justify-between pointer-events-auto select-none overflow-hidden"
    >
      {/* Subtle atmospheric vignette over WebGL */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at center, transparent 36%, rgba(3, 5, 10, 0.76) 100%)',
        }}
      />

      {/* Top Cinematic Letterbox Bar */}
      <div
        className={`relative z-10 w-full ${barHeightClass} bg-[#03050a] border-b border-white/10 px-5 sm:px-8 flex items-center justify-between transition-all duration-300 overflow-hidden`}
      >
        <div className="flex items-center gap-2.5 text-[11px] font-mono-tabular tracking-widest text-amber-400/90 uppercase">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            PROTOKOL WABAH // SEKTOR {MAPS[selectedMap].subtitle.toUpperCase()}
          </span>
        </div>

        {!audioStarted && (
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400">
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Ketuk layar untuk aktifkan efek suara</span>
          </div>
        )}
      </div>

      {/* Center Sequenced Opening Titles & Interactive Menu Gate */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 text-center">
        {beat === 1 && (
          <div key="beat-1" className="intro-fade-up max-w-xl pointer-events-none">
            <p className="font-mono-tabular text-[11px] sm:text-xs tracking-[0.3em] uppercase text-red-400 mb-2">
              TRANSMISI DARURAT · KARANTINA TOTAL
            </p>
            <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-wider text-white uppercase">
              KOTA TELAH JATUH KE TANGAN MAYAT HIDUP
            </h2>
            <div className="intro-line-grow h-[2px] w-36 bg-amber-500 mx-auto mt-4" />
          </div>
        )}

        {beat === 2 && (
          <div key="beat-2" className="intro-fade-up max-w-2xl pointer-events-none">
            <p className="font-mono-tabular text-[11px] sm:text-xs tracking-[0.28em] uppercase text-cyan-400 mb-2">
              PANEN KARYA SMK RPL · WEBGL 3D ENGINE
            </p>
            <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-wide text-white uppercase leading-tight">
              TIGA BOS MUTAN BANGKIT DI TENGAH KABUT
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-2.5">
              Tidak ada evakuasi. Kumpulkan senjata, bergerak cepat, dan bertahanlah bersama tim.
            </p>
          </div>
        )}

        {beat === 3 && (
          <div key="beat-3" className="max-w-3xl flex flex-col items-center">
            <p className="intro-fade-up font-mono-tabular text-[11px] sm:text-xs tracking-[0.34em] uppercase text-amber-400 mb-2 pointer-events-none">
              3D THIRD-PERSON ACTION SURVIVAL
            </p>
            <h1 className="intro-title-slam font-display text-4xl sm:text-6xl md:text-7xl font-bold text-white leading-none tracking-tight pointer-events-none">
              ZOMBIE SURVIVAL
            </h1>
            <div className="intro-line-grow h-[2px] w-48 sm:w-64 bg-gradient-to-r from-transparent via-cyan-400 to-transparent mx-auto my-3 pointer-events-none" />
            <p className="intro-fade-up font-display text-xl sm:text-3xl font-bold tracking-[0.28em] text-cyan-400 mb-6 pointer-events-none">
              LAST STAND
            </p>

            {introDone && (
              <div className="intro-fade-up flex flex-col items-center gap-2.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnlockAudio();
                    onSkip();
                  }}
                  className="flex items-center gap-3 px-8 py-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-display font-bold text-base sm:text-lg tracking-wider border-2 border-amber-200/80 transition-all cursor-pointer whitespace-nowrap"
                >
                  <span>MASUK KE MENU GAME</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <span className="text-[11px] font-mono-tabular text-slate-300 tracking-wider uppercase">
                  Tekan Enter / Spasi atau Klik Tombol Untuk Pilih Level &amp; Karakter
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Cinematic Letterbox Bar + Progress & Skip */}
      <div
        className={`relative z-10 w-full ${barHeightClass} bg-[#03050a] border-t border-white/10 px-5 sm:px-8 flex items-center justify-between gap-4 transition-all duration-300 overflow-hidden`}
      >
        <div className="flex items-center gap-3 min-w-[140px] sm:min-w-[220px]">
          <span className="font-mono-tabular text-[10px] tracking-widest text-slate-400 uppercase whitespace-nowrap">
            {introDone ? 'SIAP MASUK MENU' : `OPENING ${Math.round(clamped * 100)}%`}
          </span>
          <div className="flex-1 h-1 bg-slate-800 rounded-sm overflow-hidden">
            <div
              className="h-full bg-amber-400 transition-[width] duration-75"
              style={{ width: `${Math.round(clamped * 100)}%` }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onUnlockAudio();
            onSkip();
          }}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-white/10 hover:bg-amber-500 hover:text-slate-950 border border-white/15 text-xs font-display font-bold tracking-wider text-slate-100 transition-colors cursor-pointer whitespace-nowrap"
        >
          <span>{introDone ? 'BUKA MENU' : 'LEWATI KE MENU'}</span>
          <FastForward className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
