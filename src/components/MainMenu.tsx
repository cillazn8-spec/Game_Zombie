import React from 'react';
import { BookOpen, Film, Flame, MapPin, Play, Settings, ShieldAlert, UserCheck, Users } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import {
  CHARACTER_ORDER,
  CHARACTER_SKINS,
  CHARACTERS,
  CharacterId,
  CharacterSkinId,
  DIFFICULTIES,
  DIFFICULTY_ORDER,
  DifficultyId,
  getSkinsForGender,
  MAP_ORDER,
  MAPS,
  MapId,
} from '../types/game';

interface MainMenuProps {
  highScore: number;
  selectedDifficulty: DifficultyId;
  selectedMap: MapId;
  autoRotateMaps: boolean;
  selectedCharacter: CharacterId;
  selectedSkin: CharacterSkinId;
  onSelectDifficulty: (difficulty: DifficultyId) => void;
  onSelectMap: (mapId: MapId) => void;
  onToggleAutoRotate: (enabled: boolean) => void;
  onSelectCharacter: (characterId: CharacterId) => void;
  onSelectSkin: (skinId: CharacterSkinId) => void;
  onPlaySolo: () => void;
  onOpenMultiplayer: () => void;
  onHowToPlay: () => void;
  onSettings: () => void;
  onReplayIntro: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  highScore,
  selectedDifficulty,
  selectedMap,
  autoRotateMaps,
  selectedCharacter,
  selectedSkin,
  onSelectDifficulty,
  onSelectMap,
  onToggleAutoRotate,
  onSelectCharacter,
  onSelectSkin,
  onPlaySolo,
  onOpenMultiplayer,
  onHowToPlay,
  onSettings,
  onReplayIntro,
}) => {
  const activeDiffSpec = DIFFICULTIES[selectedDifficulty] ?? DIFFICULTIES.normal;
  const activeMapSpec = MAPS[selectedMap];
  const activeCharSpec = CHARACTERS[selectedCharacter];
  const genderSkins = getSkinsForGender(activeCharSpec.gender);
  const activeSkinSpec =
    CHARACTER_SKINS[selectedSkin]?.gender === activeCharSpec.gender
      ? CHARACTER_SKINS[selectedSkin]
      : CHARACTER_SKINS[activeCharSpec.defaultSkin];

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-between p-5 sm:p-8 md:p-10 bg-gradient-to-r from-[#05080e]/94 via-[#070b14]/72 to-transparent overflow-y-auto pointer-events-auto">
      {/* Top Bar */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-xs tracking-wider text-slate-300 font-medium">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="whitespace-nowrap">Panen Karya SMK RPL</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="whitespace-nowrap">Co-op Multiplayer WebGL 3D</span>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <PWAInstallButton />
          <button
            type="button"
            onClick={onReplayIntro}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-900/90 hover:bg-slate-800 border border-white/15 text-[11px] font-display font-semibold tracking-wider text-cyan-300 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Film className="w-3.5 h-3.5" />
            PUTAR INTRO
          </button>
          <div className="text-xs text-slate-300 font-mono-tabular whitespace-nowrap">
            Skor Tertinggi:{' '}
            <span className="text-amber-400 font-bold">
              {highScore.toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </header>

      {/* Main Focal Anchor */}
      <main className="max-w-2xl my-auto py-3">
        <p className="text-xs font-semibold tracking-[0.22em] uppercase text-amber-400 mb-1.5">
          3D Action RPG Open-World · 5 Kelas Hero · 10 Peta · 80 Misi
        </p>
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-[1.02] mb-1.5 [text-wrap:balance]">
          ZOMBIE SURVIVAL
        </h1>
        <p className="font-display text-xl sm:text-2xl font-semibold tracking-[0.18em] text-cyan-400 mb-3">
          LAST STAND 3D RPG
        </p>
        <p className="text-sm text-slate-300 leading-relaxed max-w-lg mb-4">
          Naikkan level, alokasikan atribut STR/VIT/AGI/INT, lepaskan 3 skill 3D, tempa senjata &amp; beli armor dari Gold! Jelajahi 10 peta, kendarai mobil, dan tuntaskan 80 misi teka-teki SMP &amp; SMA.
        </p>

        {/* 5-Character Selector Strip (Male & Female) */}
        <div className="mb-3.5 bg-[#0a0f1a]/88 border border-white/12 rounded-xl p-3 max-w-xl">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Pilih Hero RPG (5 Kelas · Male / Female)</span>
            </div>
            <span className="text-[11px] font-semibold text-cyan-300 whitespace-nowrap">
              {activeCharSpec.name} · {activeCharSpec.rpgClass}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 mb-1.5">
            {CHARACTER_ORDER.map((cId) => {
              const char = CHARACTERS[cId];
              const selected = selectedCharacter === cId;
              return (
                <button
                  key={cId}
                  type="button"
                  onClick={() => onSelectCharacter(cId)}
                  className={`px-2.5 py-2 rounded-lg border text-left transition-colors cursor-pointer ${
                    selected
                      ? 'bg-cyan-500 text-slate-950 border-cyan-300 font-bold'
                      : 'bg-slate-900/90 text-slate-300 border-white/10 hover:border-white/25'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 text-[10px] opacity-85 whitespace-nowrap">
                    <span className="truncate">{char.rpgClass}</span>
                    <span
                      className="w-2.5 h-2.5 rounded-xs shrink-0 border border-black/30"
                      style={{ backgroundColor: char.accentColor }}
                    />
                  </div>
                  <div className="text-xs truncate">{char.name}</div>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-400 mb-3">
            <strong className="text-slate-200">
              {activeCharSpec.rpgClass} ({activeCharSpec.role}):
            </strong>{' '}
            {activeCharSpec.description}{' '}
            <span className="font-mono-tabular text-amber-300">
              [STR {activeCharSpec.baseStats.str} · VIT {activeCharSpec.baseStats.vit} · AGI{' '}
              {activeCharSpec.baseStats.agi} · INT {activeCharSpec.baseStats.int}]
            </span>
          </p>

          {/* Gender-Matched Skin Selector */}
          <div className="pt-2.5 border-t border-white/10">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-200">
                Skin Karakter ({activeCharSpec.gender === 'Male' ? 'Pria' : 'Wanita'})
              </span>
              <span className="text-[11px] font-semibold text-amber-300 whitespace-nowrap">
                {activeSkinSpec.name}
              </span>
            </div>
            <div
              className={`grid gap-2 mb-1.5 ${
                genderSkins.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'
              }`}
            >
              {genderSkins.map((skin) => {
                const isSkinSelected = activeSkinSpec.id === skin.id;
                return (
                  <button
                    key={skin.id}
                    type="button"
                    onClick={() => onSelectSkin(skin.id)}
                    className={`p-1.5 rounded-lg border text-left transition-colors cursor-pointer ${
                      isSkinSelected
                        ? 'bg-amber-500/95 text-slate-950 border-amber-300 font-bold'
                        : 'bg-slate-900/95 text-slate-200 border-white/10 hover:border-white/30'
                    }`}
                  >
                    <img
                      src={skin.imagePath}
                      alt={skin.name}
                      className="w-full h-20 sm:h-24 object-cover object-top rounded-md bg-slate-950 mb-1.5"
                    />
                    <div className="text-[11px] leading-tight truncate">{skin.name}</div>
                    <div
                      className={`text-[10px] truncate ${
                        isSkinSelected ? 'text-slate-900/80' : 'text-slate-400'
                      }`}
                    >
                      {skin.shortTag}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400">
              <strong className="text-slate-200">{activeSkinSpec.name}:</strong>{' '}
              {activeSkinSpec.description}
            </p>
          </div>
        </div>

        {/* 4-Level Difficulty Selector Strip */}
        <div className="mb-3.5 bg-[#0a0f1a]/88 border border-white/12 rounded-xl p-3 max-w-xl">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
              <Flame className="w-3.5 h-3.5 text-red-400" />
              <span>Pilih Level Kesulitan</span>
            </div>
            <span
              className="text-[11px] font-semibold whitespace-nowrap"
              style={{ color: activeDiffSpec.accentColor }}
            >
              {activeDiffSpec.name} · {activeDiffSpec.tagline}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-1.5">
            {DIFFICULTY_ORDER.map((dId) => {
              const spec = DIFFICULTIES[dId];
              const isSelected = selectedDifficulty === dId;
              return (
                <button
                  key={dId}
                  type="button"
                  onClick={() => onSelectDifficulty(dId)}
                  className={`px-2.5 py-2 rounded-lg border text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'text-slate-950 font-bold border-white/60'
                      : 'bg-slate-900/90 text-slate-300 border-white/10 hover:border-white/25'
                  }`}
                  style={isSelected ? { backgroundColor: spec.accentColor } : undefined}
                >
                  <div className="flex items-center justify-between gap-1 text-[10px] opacity-85 whitespace-nowrap">
                    <span>{spec.tagline}</span>
                    <span
                      className="w-2 h-2 rounded-xs shrink-0 border border-black/30"
                      style={{ backgroundColor: spec.accentColor }}
                    />
                  </div>
                  <div className="text-xs truncate">{spec.name}</div>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-400">
            <strong className="text-slate-200">{activeDiffSpec.name}:</strong>{' '}
            {activeDiffSpec.description}
          </p>
        </div>

        {/* 10-Map Selector Strip */}
        <div className="mb-5 bg-[#0a0f1a]/88 border border-white/12 rounded-xl p-3 max-w-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>Pilih Peta Awal (10 Map · Pindah Langsung via [M])</span>
            </div>
            <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRotateMaps}
                onChange={(e) => onToggleAutoRotate(e.target.checked)}
                className="accent-amber-500 cursor-pointer"
              />
              {selectedMap === 'openworld'
                ? 'Rotasi Arena Otomatis (Mode Arena)'
                : 'Ganti Peta Otomatis Tiap 2 Wave'}
            </label>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 mb-1.5">
            {MAP_ORDER.map((mId, i) => (
              <button
                key={mId}
                type="button"
                onClick={() => onSelectMap(mId)}
                className={`px-2 py-1.5 rounded-lg border text-left transition-colors cursor-pointer ${
                  selectedMap === mId
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                    : 'bg-slate-900/90 text-slate-300 border-white/10 hover:border-white/25'
                }`}
              >
                <div className="text-[9px] opacity-75 whitespace-nowrap">
                  {mId === 'openworld' ? '01 · WORLD' : `${String(i + 1).padStart(2, '0')} · ZONA`}
                </div>
                <div className="text-[11px] leading-tight truncate">{MAPS[mId].name}</div>
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-400">
            <strong className="text-slate-200">{activeMapSpec.name}:</strong>{' '}
            {activeMapSpec.description}
          </p>
        </div>

        {/* Action Stack */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onPlaySolo}
            className="flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-lg bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-display font-bold text-base tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <Play className="w-4 h-4 fill-current" />
            MASUK KE GAME
          </button>

          <button
            type="button"
            onClick={onOpenMultiplayer}
            className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-display font-bold text-sm tracking-wider transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Users className="w-4 h-4" />
            MULTIPLAYER CO-OP
          </button>

          <button
            type="button"
            onClick={onHowToPlay}
            className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-lg bg-[#101724]/95 hover:bg-[#192336] border border-white/15 text-slate-100 font-display font-semibold text-sm tracking-wider transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <BookOpen className="w-4 h-4 text-cyan-400" />
            HOW TO PLAY
          </button>

          <button
            type="button"
            onClick={onSettings}
            className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-lg bg-[#101724]/95 hover:bg-[#192336] border border-white/15 text-slate-100 font-display font-semibold text-sm tracking-wider transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Settings className="w-4 h-4 text-slate-300" />
            SETTINGS
          </button>
        </div>
      </main>

      {/* Quiet Footer */}
      <footer className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <span>PC: WASD · B Menu RPG · E/X/T Skill 3D · H Ramuan · Q Dash · M Peta 10 Map · G Mobil · V Kamera</span>
        <span className="font-mono-tabular">WebGL2 + WebSocket Co-op</span>
      </footer>
    </div>
  );
};
