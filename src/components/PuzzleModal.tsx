import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Gift,
  GraduationCap,
  HelpCircle,
  Lightbulb,
  ShieldCheck,
  Skull,
} from 'lucide-react';
import { ActiveMissionPuzzle } from '../types/game';

interface PuzzleModalProps {
  activePuzzle: ActiveMissionPuzzle;
  onAnswer: (optionIndex: number) => void;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

export const PuzzleModal: React.FC<PuzzleModalProps> = ({ activePuzzle, onAnswer }) => {
  const [showHint, setShowHint] = useState(false);
  const { puzzle } = activePuzzle;
  const isSma = puzzle.level === 'SMA';
  const isBossReward = activePuzzle.source === 'boss' || Boolean(activePuzzle.bossName);

  useEffect(() => {
    setShowHint(false);
  }, [puzzle.id]);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-[#04060b]/88 pointer-events-auto">
      <div
        className={`w-full max-w-xl max-h-[92vh] overflow-y-auto bg-[#0b101b] border rounded-xl p-5 sm:p-7 text-slate-100 shadow-2xl ${
          isBossReward ? 'border-amber-400/55' : 'border-cyan-400/40'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/10">
          <div className="min-w-0">
            <div
              className={`flex items-center gap-2 text-[11px] font-display font-bold tracking-[0.16em] uppercase mb-1 ${
                isBossReward ? 'text-amber-400' : 'text-cyan-400'
              }`}
            >
              {isBossReward ? (
                <Skull className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <GraduationCap className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>
                {isBossReward
                  ? `BOS DIKALAHKAN · TEKA-TEKI ${puzzle.level} KLAIM HADIAH`
                  : `TEKA-TEKI ${puzzle.level} · VERIFIKASI MISI`}
              </span>
            </div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-white leading-snug">
              {activePuzzle.missionTitle}
            </h2>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span
              className={`px-2.5 py-0.5 rounded-md border text-[11px] font-display font-bold tracking-wider uppercase whitespace-nowrap ${
                isSma
                  ? 'bg-violet-500/20 border-violet-400/45 text-violet-200'
                  : 'bg-emerald-500/20 border-emerald-400/45 text-emerald-200'
              }`}
            >
              TINGKAT {puzzle.level}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-400/35 text-[11px] font-display font-bold tracking-wider text-amber-300 uppercase whitespace-nowrap">
              <BookOpen className="w-3 h-3 shrink-0" />
              {puzzle.subject}
            </span>
          </div>
        </div>

        {/* Boss Reward Preview Banner */}
        {activePuzzle.rewardPreview && (
          <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-amber-500/12 border border-amber-400/40 px-3.5 py-2.5">
            <Gift className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <div className="font-display font-bold tracking-wider text-amber-300 uppercase">
                HADIAH PETI BOS ({activePuzzle.bossName ?? 'ZOMBIE BOS'})
              </div>
              <p className="text-amber-100 mt-0.5">{activePuzzle.rewardPreview}</p>
            </div>
          </div>
        )}

        {/* Safe pause notice */}
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-900/90 border border-white/10 px-3 py-2 text-xs text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            {isBossReward
              ? `Pertempuran dijeda sementara. Jawab soal ${puzzle.level} (${puzzle.subject}) ini dengan benar untuk membuka peti senjata & item hadiah bos!`
              : `Pertempuran dijeda sementara. Jawab soal ${puzzle.level} (${puzzle.subject}) ini dengan benar untuk menyelesaikan misi!`}
          </span>
        </div>

        {/* Question Box */}
        <div className="mt-4 rounded-xl bg-[#070b13] border border-white/15 p-4 sm:p-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>
              Soal {puzzle.level} · {puzzle.subject}
            </span>
          </div>
          <p className="text-sm sm:text-base font-semibold text-white leading-relaxed">
            {puzzle.question}
          </p>
        </div>

        {/* Optional Hint Drawer */}
        <div className="mt-3 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setShowHint((prev) => !prev)}
            className="self-start flex items-center gap-1.5 text-xs font-semibold text-amber-300 hover:text-amber-200 cursor-pointer"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>{showHint ? 'Sembunyikan Petunjuk' : 'Butuh Petunjuk?'}</span>
          </button>
          {(showHint || activePuzzle.wrongAttempts >= 2) && (
            <div className="rounded-lg bg-amber-500/10 border border-amber-400/30 px-3.5 py-2 text-xs text-amber-200 leading-relaxed">
              <strong className="text-amber-300">Petunjuk:</strong> {puzzle.hint}
            </div>
          )}
        </div>

        {/* Wrong Attempt Feedback */}
        {activePuzzle.feedback && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-500/15 border border-red-400/40 px-3.5 py-2 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>
              {activePuzzle.feedback} (Percobaan salah: {activePuzzle.wrongAttempts})
            </span>
          </div>
        )}

        {/* 4 Answer Options */}
        <div className="mt-4 grid grid-cols-1 gap-2.5">
          {puzzle.options.map((opt, idx) => (
            <button
              key={`${puzzle.id}-${idx}`}
              type="button"
              onClick={() => onAnswer(idx)}
              className={`group flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg bg-slate-900/95 border border-white/15 transition-colors cursor-pointer ${
                isBossReward
                  ? 'hover:bg-amber-500 hover:text-slate-950 hover:border-amber-300'
                  : 'hover:bg-cyan-500 hover:text-slate-950 hover:border-cyan-300'
              }`}
            >
              <span
                className={`w-7 h-7 rounded-md bg-slate-800 group-hover:bg-slate-950 font-display font-bold text-xs flex items-center justify-center shrink-0 ${
                  isBossReward
                    ? 'text-amber-300 group-hover:text-amber-300'
                    : 'text-cyan-300 group-hover:text-cyan-300'
                }`}
              >
                {OPTION_LETTERS[idx] ?? idx + 1}
              </span>
              <span className="text-sm font-medium leading-snug">{opt}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
