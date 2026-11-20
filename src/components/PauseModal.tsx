import React from 'react';
import { Home, Play, RotateCcw, Settings } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onSettings: () => void;
  onMainMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onSettings,
  onMainMenu,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-[#04060b]/82 pointer-events-auto">
      <div className="w-full max-w-sm bg-[#0b101b] border border-white/15 rounded-xl p-6 text-center">
        <h2 className="font-display text-2xl font-bold tracking-wider text-white mb-1">
          PERMAINAN DIJEDA
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          Pilih lanjutkan untuk kembali ke pertempuran
        </p>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onResume}
            className="flex items-center justify-center gap-2 py-3 px-5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-sm tracking-wider cursor-pointer whitespace-nowrap"
          >
            <Play className="w-4 h-4 fill-current" />
            LANJUTKAN
          </button>

          <button
            type="button"
            onClick={onSettings}
            className="flex items-center justify-center gap-2 py-3 px-5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/15 text-slate-100 font-display font-semibold text-sm tracking-wider cursor-pointer whitespace-nowrap"
          >
            <Settings className="w-4 h-4 text-cyan-400" />
            SETTINGS
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="flex items-center justify-center gap-2 py-3 px-5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/15 text-slate-100 font-display font-semibold text-sm tracking-wider cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4 text-slate-300" />
            ULANGI GAME
          </button>

          <button
            type="button"
            onClick={onMainMenu}
            className="flex items-center justify-center gap-2 py-3 px-5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/15 text-slate-300 font-display font-semibold text-sm tracking-wider cursor-pointer whitespace-nowrap"
          >
            <Home className="w-4 h-4" />
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
};
