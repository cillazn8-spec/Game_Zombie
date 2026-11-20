import React, { useState } from 'react';
import { Copy, Play, Users, X } from 'lucide-react';
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
  LobbyState,
  MAP_ORDER,
  MAPS,
  MapId,
  resolveSkinForCharacter,
} from '../types/game';

interface MultiplayerModalProps {
  lobby: LobbyState;
  defaultDifficulty: DifficultyId;
  defaultMap: MapId;
  defaultAutoRotate: boolean;
  selectedCharacter: CharacterId;
  selectedSkin: CharacterSkinId;
  onSelectCharacter: (characterId: CharacterId) => void;
  onSelectSkin: (skinId: CharacterSkinId) => void;
  onChangeLobbyCharacter: (characterId: CharacterId, skinId: CharacterSkinId) => void;
  onCreateRoom: (
    name: string,
    mapId: MapId,
    autoRotate: boolean,
    characterId: CharacterId,
    skinId: CharacterSkinId,
    difficulty: DifficultyId,
  ) => void;
  onJoinRoom: (
    code: string,
    name: string,
    characterId: CharacterId,
    skinId: CharacterSkinId,
  ) => void;
  onUpdateConfig: (mapId: MapId, autoRotate: boolean, difficulty: DifficultyId) => void;
  onStartMatch: () => void;
  onLeaveRoom: () => void;
  onClose: () => void;
}

export const MultiplayerModal: React.FC<MultiplayerModalProps> = ({
  lobby,
  defaultDifficulty,
  defaultMap,
  defaultAutoRotate,
  selectedCharacter,
  selectedSkin,
  onSelectCharacter,
  onSelectSkin,
  onChangeLobbyCharacter,
  onCreateRoom,
  onJoinRoom,
  onUpdateConfig,
  onStartMatch,
  onLeaveRoom,
  onClose,
}) => {
  const [playerName, setPlayerName] = useState('Survivor');
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!lobby.roomCode) return;
    void navigator.clipboard?.writeText(lobby.roomCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const renderCharacterPicker = (
    activeChar: CharacterId,
    activeSkin: CharacterSkinId,
    onPickChar: (id: CharacterId) => void,
    onPickSkin: (skinId: CharacterSkinId) => void,
  ) => {
    const charSpec = CHARACTERS[activeChar] ?? CHARACTERS.raka;
    const genderSkins = getSkinsForGender(charSpec.gender);
    const resolvedSkin = resolveSkinForCharacter(activeChar, activeSkin);

    return (
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
            Pilih Karakter (5 Karakter Male / Female)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
            {CHARACTER_ORDER.map((cId) => {
              const spec = CHARACTERS[cId];
              const isSelected = activeChar === cId;
              return (
                <button
                  key={cId}
                  type="button"
                  onClick={() => onPickChar(cId)}
                  className={`px-2.5 py-2 rounded-lg border text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 border-cyan-300 font-bold'
                      : 'bg-slate-900 text-slate-300 border-white/10 hover:border-white/25'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] opacity-80">
                    <span>{spec.gender}</span>
                    <span
                      className="w-2.5 h-2.5 rounded-xs border border-black/30"
                      style={{ backgroundColor: spec.accentColor }}
                    />
                  </div>
                  <div className="text-xs truncate">{spec.name}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
              Skin {charSpec.name} ({charSpec.gender === 'Male' ? 'Pria' : 'Wanita'})
            </span>
            <span className="text-[11px] font-semibold text-amber-300">
              {CHARACTER_SKINS[resolvedSkin]?.name}
            </span>
          </div>
          <div
            className={`grid gap-2 ${
              genderSkins.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'
            }`}
          >
            {genderSkins.map((skin) => {
              const isSkinSelected = resolvedSkin === skin.id;
              return (
                <button
                  key={skin.id}
                  type="button"
                  onClick={() => onPickSkin(skin.id)}
                  className={`p-1.5 rounded-lg border text-left transition-colors cursor-pointer ${
                    isSkinSelected
                      ? 'bg-amber-500 text-slate-950 border-amber-300 font-bold'
                      : 'bg-slate-900 text-slate-300 border-white/10 hover:border-white/25'
                  }`}
                >
                  <img
                    src={skin.imagePath}
                    alt={skin.name}
                    className="w-full h-16 object-cover object-top rounded bg-slate-950 mb-1"
                  />
                  <div className="text-[11px] truncate">{skin.name}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-[#04060b]/84 pointer-events-auto">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#0b101b] border border-white/15 rounded-xl p-6 sm:p-7 text-slate-100">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="font-display text-2xl font-bold tracking-wide text-white">
                MULTIPLAYER CO-OP
              </h2>
              <p className="text-xs text-slate-400">
                Bermain bersama teman secara real-time dalam satu ruang
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (lobby.roomCode) onLeaveRoom();
              onClose();
            }}
            aria-label="Tutup multiplayer"
            className="w-10 h-10 rounded-lg bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-slate-200 cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {lobby.error && (
          <div className="mt-4 px-4 py-2.5 rounded-lg bg-red-950/70 border border-red-500/40 text-xs text-red-200">
            {lobby.error}
          </div>
        )}

        {!lobby.roomCode ? (
          <div className="space-y-5 py-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Nama Pemain Kamu
              </label>
              <input
                type="text"
                maxLength={16}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Masukkan nama..."
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-white/15 text-sm text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            {renderCharacterPicker(
              selectedCharacter,
              selectedSkin,
              onSelectCharacter,
              onSelectSkin,
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Create Room */}
              <div className="p-4 rounded-lg bg-slate-900/90 border border-white/10 flex flex-col justify-between">
                <div>
                  <h3 className="font-display font-bold text-base text-amber-400 mb-1">
                    Buat Ruang Baru
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">
                    Jadi Host, pilih peta awal, lalu bagikan kode ruang ke temanmu.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onCreateRoom(
                      playerName.trim() || 'Survivor 1',
                      defaultMap,
                      defaultAutoRotate,
                      selectedCharacter,
                      resolveSkinForCharacter(selectedCharacter, selectedSkin),
                      defaultDifficulty,
                    )
                  }
                  className="w-full py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-sm tracking-wider cursor-pointer whitespace-nowrap"
                >
                  BUAT RUANG
                </button>
              </div>

              {/* Join Room */}
              <div className="p-4 rounded-lg bg-slate-900/90 border border-white/10 flex flex-col justify-between">
                <div>
                  <h3 className="font-display font-bold text-base text-cyan-400 mb-1">
                    Gabung Ruang Teman
                  </h3>
                  <p className="text-xs text-slate-400 mb-3">
                    Masukkan kode ruang 5 karakter dari temanmu.
                  </p>
                  <input
                    type="text"
                    maxLength={6}
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Kode (misal: K7M2P)"
                    className="w-full px-3 py-2 rounded-lg bg-[#080c14] border border-white/15 text-sm font-mono-tabular uppercase text-white mb-3 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (joinCode.trim().length >= 3) {
                      onJoinRoom(
                        joinCode.trim(),
                        playerName.trim() || 'Survivor',
                        selectedCharacter,
                        resolveSkinForCharacter(selectedCharacter, selectedSkin),
                      );
                    }
                  }}
                  className="w-full py-2.5 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-display font-bold text-sm tracking-wider cursor-pointer whitespace-nowrap"
                >
                  GABUNG RUANG
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5 py-5">
            {/* Room Code Banner */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg bg-slate-900 border border-cyan-500/35">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-slate-400">
                  Kode Ruang Co-op
                </div>
                <div className="font-mono-tabular text-2xl font-bold tracking-[0.2em] text-cyan-400">
                  {lobby.roomCode}
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/15 text-xs font-semibold text-white cursor-pointer whitespace-nowrap"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? 'Tersalin!' : 'Salin Kode'}
              </button>
            </div>

            {/* Character & Skin Switcher Inside Lobby */}
            {renderCharacterPicker(
              selectedCharacter,
              selectedSkin,
              (id) => {
                const nextSkin = resolveSkinForCharacter(id, selectedSkin);
                onSelectCharacter(id);
                onChangeLobbyCharacter(id, nextSkin);
              },
              (skinId) => {
                const nextSkin = resolveSkinForCharacter(selectedCharacter, skinId);
                onSelectSkin(nextSkin);
                onChangeLobbyCharacter(selectedCharacter, nextSkin);
              },
            )}

            {/* Difficulty Config */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Level Kesulitan ({DIFFICULTIES[lobby.difficulty]?.name ?? 'Normal'})
                </span>
                <span className="text-[11px] text-slate-400">
                  {DIFFICULTIES[lobby.difficulty]?.tagline}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DIFFICULTY_ORDER.map((dId) => {
                  const spec = DIFFICULTIES[dId];
                  const isSel = lobby.difficulty === dId;
                  return (
                    <button
                      key={dId}
                      type="button"
                      disabled={!lobby.isHost}
                      onClick={() => onUpdateConfig(lobby.mapId, lobby.autoRotateMaps, dId)}
                      className={`px-2.5 py-2 rounded-lg border text-left transition-colors ${
                        isSel
                          ? 'text-slate-950 font-bold border-white/60'
                          : 'bg-slate-900 text-slate-300 border-white/10 hover:border-white/25'
                      } ${!lobby.isHost ? 'opacity-75 cursor-default' : 'cursor-pointer'}`}
                      style={isSel ? { backgroundColor: spec.accentColor } : undefined}
                    >
                      <div className="text-[10px] opacity-80">{spec.tagline}</div>
                      <div className="text-xs truncate">{spec.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Map Config (Host Editable, Guest Viewable) */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Pilih Peta Awal — 10 Map ({MAPS[lobby.mapId].name})
                </span>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lobby.autoRotateMaps}
                    disabled={!lobby.isHost}
                    onChange={(e) => onUpdateConfig(lobby.mapId, e.target.checked, lobby.difficulty)}
                    className="accent-amber-500"
                  />
                  Ganti Peta Otomatis Tiap 2 Wave
                </label>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                {MAP_ORDER.map((mId, idx) => (
                  <button
                    key={mId}
                    type="button"
                    disabled={!lobby.isHost}
                    onClick={() => onUpdateConfig(mId, lobby.autoRotateMaps, lobby.difficulty)}
                    className={`px-2 py-1.5 rounded-lg border text-left transition-colors ${
                      lobby.mapId === mId
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                        : 'bg-slate-900 text-slate-300 border-white/10 hover:border-white/25'
                    } ${!lobby.isHost ? 'opacity-75 cursor-default' : 'cursor-pointer'}`}
                  >
                    <div className="text-[9px] opacity-75 whitespace-nowrap">
                      {mId === 'openworld' ? '01 · WORLD' : `${String(idx + 1).padStart(2, '0')} · ZONA`}
                    </div>
                    <div className="text-[11px] leading-tight truncate">{MAPS[mId].name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Connected Players List */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Pemain di Ruang ({lobby.players.length} / 5)
              </div>
              <div className="space-y-1.5">
                {lobby.players.map((p) => {
                  const charSpec = CHARACTERS[p.characterId] ?? CHARACTERS.raka;
                  const skinSpec = CHARACTER_SKINS[p.skinId];
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between px-3.5 py-2 rounded-lg bg-slate-900/90 border border-white/10 text-sm"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-3 h-3 rounded-sm shrink-0"
                          style={{ backgroundColor: skinSpec?.accentColor ?? charSpec.accentColor }}
                        />
                        <span className="font-semibold text-white truncate">{p.name}</span>
                        <span className="text-xs text-slate-400 whitespace-nowrap truncate">
                          · {charSpec.name} ({skinSpec?.name ?? charSpec.gender})
                        </span>
                        {p.id === lobby.playerId && (
                          <span className="text-xs text-cyan-400 whitespace-nowrap">(Kamu)</span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 shrink-0">
                        {p.isHost ? 'Host' : 'Siap'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={onLeaveRoom}
                className="px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/15 text-xs font-semibold text-slate-300 cursor-pointer whitespace-nowrap"
              >
                Keluar Ruang
              </button>

              {lobby.isHost ? (
                <button
                  type="button"
                  onClick={onStartMatch}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-sm tracking-wider cursor-pointer whitespace-nowrap"
                >
                  <Play className="w-4 h-4 fill-current" />
                  MULAI PERTANDINGAN CO-OP
                </button>
              ) : (
                <span className="text-xs text-slate-300">
                  Menunggu Host memulai permainan...
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
