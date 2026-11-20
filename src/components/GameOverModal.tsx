import React from 'react';
import { Compass, Home, RotateCcw, Skull, Trophy } from 'lucide-react';

interface GameOverModalProps {
  score: number;
  highScore: number;
  kills: number;
  wave: number;
  level: number;
  missionsCompleted: number;
  isVictory?: boolean;
  isMultiplayer?: boolean;
  isHost?: boolean;
  onContinueFreeRoam?: () => void;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  highScore,
  kills,
  wave,
  level,
  missionsCompleted,
  isVictory = false,
  isMultiplayer = false,
  isHost = true,
  onContinueFreeRoam,
  onPlayAgain,
  onMainMenu,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-[#070305]/86 pointer-events-auto">
      <div
        className={`w-full max-w-md bg-[#0d1018] border rounded-xl p-6 sm:p-8 text-center ${
          isVictory ? 'border-emerald-400/45' : 'border-red-500/35'
        }`}
      >
        <div
          className={`inline-flex items-center justify-center w-12 h-12 rounded-lg border mb-4 ${
            isVictory
              ? 'bg-emerald-500/15 border-emerald-400/35 text-emerald-400'
              : 'bg-red-500/15 border-red-500/30 text-red-400'
          }`}
        >
          {isVictory ? <Trophy className="w-6 h-6" /> : <Skull className="w-6 h-6" />}
        </div>

        <h2
          className={`font-display text-3xl sm:text-4xl font-bold tracking-wider mb-1 ${
            isVictory ? 'text-emerald-400' : 'text-red-400'
          }`}
        >
          {isVictory ? 'EVAKUASI BERHASIL!' : 'GAME OVER'}
        </h2>
        <p className="text-sm text-slate-300 mb-6">
          {isVictory
            ? `Semua ${missionsCompleted} misi Open World berhasil diselesaikan di Level ${level}. Kota berhasil diamankan!`
            : `Kamu gugur di gelombang ke-${wave} pada Level ${level}. Terus tingkatkan akurasi tembakanmu!`}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-y border-white/10 mb-6">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400">
              Skor Akhir
            </div>
            <div className="font-mono-tabular text-lg font-bold text-amber-400 mt-1">
              {score.toLocaleString('id-ID')}
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400">
              Zombie Kalah
            </div>
            <div className="font-mono-tabular text-lg font-bold text-white mt-1">
              {kills}
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400">
              Level / Misi
            </div>
            <div className="font-mono-tabular text-lg font-bold text-emerald-400 mt-1">
              L{level} · {missionsCompleted}
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400">
              Skor Terbaik
            </div>
            <div className="font-mono-tabular text-lg font-bold text-cyan-400 mt-1">
              {highScore.toLocaleString('id-ID')}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          {isVictory && onContinueFreeRoam && (!isMultiplayer || isHost) && (
            <button
              type="button"
              onClick={onContinueFreeRoam}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-sm tracking-wider cursor-pointer whitespace-nowrap"
            >
              <Compass className="w-4 h-4" />
              LANJUT FREE-ROAM DI KOTA
            </button>
          )}
          {isVictory && isMultiplayer && !isHost && (
            <p className="text-xs text-cyan-300 py-1">
              Menunggu Host melanjutkan mode Free-Roam atau bermain ulang...
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onPlayAgain}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 px-5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-sm tracking-wider cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4" />
              PLAY AGAIN
            </button>

            <button
              type="button"
              onClick={onMainMenu}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 px-5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/15 text-slate-100 font-display font-semibold text-sm tracking-wider cursor-pointer whitespace-nowrap"
            >
              <Home className="w-4 h-4" />
              MAIN MENU
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
