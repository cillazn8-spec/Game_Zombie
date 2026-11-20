import React from 'react';
import {
  ArrowDown,
  ArrowUp,
  Car,
  CheckCircle2,
  CloudFog,
  CloudLightning,
  CloudRain,
  Coins,
  Compass,
  Crosshair,
  Eye,
  Flame,
  FlaskConical,
  Footprints,
  Globe,
  HeartPulse,
  Home,
  Lock,
  Moon,
  PackagePlus,
  Pause,
  Shield,
  Skull,
  Sparkles,
  Sun,
  Target,
  Wind,
  Zap,
} from 'lucide-react';
import {
  CHARACTER_SKINS,
  CHARACTERS,
  DIFFICULTIES,
  HudState,
  MAPS,
  RPG_SKILLS,
  RpgSkillId,
  WEAPONS,
  WeaponId,
} from '../types/game';

interface GameHUDProps {
  hud: HudState;
  isTouchVisible: boolean;
  onPause: () => void;
  onLockPointer: () => void;
  onSelectWeapon: (id: WeaponId) => void;
  onToggleRun: () => void;
  onJump: () => void;
  onToggleCrouch: () => void;
  onDash: () => void;
  onAmmoRefill: () => void;
  onToggleCamera: () => void;
  onToggleAim: () => void;
  onToggleVehicle: () => void;
  onOpenMapTravel: () => void;
  onOpenRpgMenu: () => void;
  onCastSkill: (id: RpgSkillId) => void;
  onUseHpPotion: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  hud,
  isTouchVisible,
  onPause,
  onLockPointer,
  onSelectWeapon,
  onToggleRun,
  onJump,
  onToggleCrouch,
  onDash,
  onAmmoRefill,
  onToggleCamera,
  onToggleAim,
  onToggleVehicle,
  onOpenMapTravel,
  onOpenRpgMenu,
  onCastSkill,
  onUseHpPotion,
}) => {
  const hpPercent = Math.max(0, Math.min(100, (hud.hp / hud.maxHp) * 100));
  const hpBarColor =
    hpPercent > 55 ? 'bg-emerald-500' : hpPercent > 28 ? 'bg-amber-500' : 'bg-red-500';
  const mpPercent = Math.max(0, Math.min(100, (hud.mp / Math.max(1, hud.maxMp)) * 100));
  const xpPercent = Math.max(0, Math.min(100, (hud.xp / Math.max(1, hud.xpToNext)) * 100));
  const missionPct = Math.max(
    0,
    Math.min(100, (hud.mission.current / Math.max(1, hud.mission.target)) * 100),
  );
  const activeWeaponSpec = WEAPONS[hud.currentWeapon];
  const activeForgeTier = hud.weaponForageLevels[hud.currentWeapon] ?? 0;
  const charSpec = CHARACTERS[hud.selectedCharacter] ?? CHARACTERS.raka;
  const skinSpec = CHARACTER_SKINS[hud.selectedSkin] ?? CHARACTER_SKINS[charSpec.defaultSkin];
  const dashReady = hud.dashCooldownRatio <= 0.02;

  const radarRange = hud.worldHalfSize > 60 ? 75 : 42;
  const radarRadiusPx = 52;
  const sinYaw = Math.sin(hud.playerYaw);
  const cosYaw = Math.cos(hud.playerYaw);

  const projectBlip = (wx: number, wz: number) => {
    const dx = wx - hud.playerX;
    const dz = wz - hud.playerZ;
    // Camera forward = (-sinYaw, -cosYaw), right = (cosYaw, -sinYaw)
    const fwd = dx * -sinYaw + dz * -cosYaw;
    const right = dx * cosYaw + dz * -sinYaw;
    const dist = Math.hypot(fwd, right);
    const scale = dist > radarRange ? radarRadiusPx / dist : radarRadiusPx / radarRange;
    return {
      sx: 64 + right * scale,
      sy: 64 - fwd * scale,
      clamped: dist > radarRange,
    };
  };

  return (
    <div className="absolute inset-0 z-10 pointer-events-none">
      {/* Projected 3D Floating RPG Combat Numbers */}
      {hud.combatTexts.map((ct) => {
        const colorClass =
          ct.kind === 'crit'
            ? 'text-amber-300 text-sm sm:text-base font-extrabold'
            : ct.kind === 'skill'
              ? 'text-cyan-300 text-sm font-bold'
              : ct.kind === 'heal'
                ? 'text-emerald-300 text-sm font-bold'
                : ct.kind === 'gold'
                  ? 'text-yellow-300 text-xs font-bold'
                  : 'text-white text-xs sm:text-sm font-bold';
        return (
          <div
            key={ct.id}
            className={`absolute pointer-events-none select-none font-mono-tabular tracking-tight whitespace-nowrap -translate-x-1/2 -translate-y-1/2 ${colorClass}`}
            style={{
              left: `${ct.xPct}%`,
              top: `${ct.yPct}%`,
              opacity: ct.alpha,
              textShadow: '0 2px 6px rgba(0,0,0,0.95)',
            }}
          >
            {ct.text}
          </div>
        );
      })}

      {/* Damage Red Screen Vignette */}
      {hud.damageFlashTick > 0 && (
        <div
          key={hud.damageFlashTick}
          className="absolute inset-0 damage-vignette-active pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at center, transparent 42%, rgba(220, 38, 38, 0.62) 100%)',
          }}
        />
      )}

      {/* Top Row HUD */}
      <div className="flex items-start justify-between gap-3 p-3 sm:p-5">
        {/* Top-Left: Hero RPG Class, HP, MP, XP, Gold/DEF, Stamina/Dash & Active Mission */}
        <div className="flex flex-col gap-2 max-w-[255px] sm:max-w-[295px]">
          <div className="bg-[#090d16]/88 border border-white/15 rounded-lg px-3.5 py-2.5">
            <div className="flex items-center justify-between text-xs mb-1 gap-2">
              <span className="font-display font-bold tracking-wider text-cyan-400 truncate">
                LVL {hud.level} · {charSpec.name} · {charSpec.rpgClass}
              </span>
              <span className="font-mono-tabular font-bold text-white shrink-0">
                {hud.hp}/{hud.maxHp}
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-sm overflow-hidden mb-1">
              <div
                className={`h-full ${hpBarColor} transition-all duration-150`}
                style={{ width: `${hpPercent}%` }}
              />
            </div>

            {/* MP (Mana) Bar */}
            <div className="flex items-center justify-between text-[10px] text-sky-300 mb-0.5">
              <span>MP · {skinSpec.name}</span>
              <span className="font-mono-tabular font-semibold">
                {hud.mp}/{hud.maxMp} MP
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-sm overflow-hidden mb-1.5">
              <div
                className="h-full bg-sky-500 transition-all duration-150"
                style={{ width: `${mpPercent}%` }}
              />
            </div>

            {/* XP Bar */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
              <span>
                XP (+{hud.damageBonusPct}% Dmg · {hud.critChancePct}% Crit)
              </span>
              <span className="font-mono-tabular">
                {hud.xp}/{hud.xpToNext}
              </span>
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-sm overflow-hidden mb-1.5">
              <div
                className="h-full bg-amber-400 transition-all duration-150"
                style={{ width: `${xpPercent}%` }}
              />
            </div>

            {/* RPG Gold, DEF & Overdrive Row */}
            <div className="flex items-center justify-between gap-2 text-[10px] font-mono-tabular mb-1.5 pt-1 border-t border-white/10">
              <span className="flex items-center gap-1 text-amber-300 font-bold">
                <Coins className="w-3 h-3 shrink-0" />
                {hud.gold.toLocaleString('id-ID')} G
              </span>
              <span className="flex items-center gap-1 text-emerald-300 font-semibold">
                <Shield className="w-3 h-3 shrink-0" />
                DEF {hud.defense}
              </span>
              {hud.overdriveRemaining > 0 ? (
                <span className="text-amber-400 font-bold">
                  ULTI {hud.overdriveRemaining.toFixed(1)}s
                </span>
              ) : (
                <span className="text-slate-400">
                  HP POT x{hud.hpPotions}
                </span>
              )}
            </div>

            {/* Stamina + Dash Ready */}
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <div className="text-[9px] text-slate-400 mb-0.5">STAMINA</div>
                <div className="w-full h-1 bg-slate-800 rounded-sm overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-100"
                    style={{ width: `${hud.stamina}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="text-[9px] text-slate-400 mb-0.5">
                  {dashReady ? 'DASH [Q] SIAP' : 'COOLDOWN'}
                </div>
                <div className="w-full h-1 bg-slate-800 rounded-sm overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-75"
                    style={{ width: `${Math.round((1 - hud.dashCooldownRatio) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Active Mission Card */}
          <div className="bg-[#090d16]/88 border border-white/15 rounded-lg px-3.5 py-2">
            <div className="flex items-center justify-between gap-2 text-[10px] font-mono-tabular text-slate-400 mb-0.5">
              <span>
                MISI {Math.min(hud.mission.index + 1, hud.mission.totalMissions)}/{hud.mission.totalMissions}
              </span>
              <span
                className={
                  hud.mission.completedAll
                    ? 'text-emerald-400 font-bold'
                    : hud.mission.index < 4
                      ? 'text-emerald-300 font-semibold'
                      : 'text-violet-300 font-semibold'
                }
              >
                {hud.mission.completedAll
                  ? 'ZONA TUNTAS'
                  : hud.mission.index < 4
                    ? 'TEKA-TEKI SMP'
                    : 'TEKA-TEKI SMA'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 text-[11px] font-display font-bold text-amber-400 mb-0.5">
              <span className="flex items-center gap-1.5 truncate">
                {hud.mission.completedAll ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <Target className="w-3.5 h-3.5 shrink-0" />
                )}
                {hud.mission.completedAll ? 'SEMUA MISI ZONA SELESAI' : hud.mission.title}
              </span>
              <span className="font-mono-tabular text-white shrink-0">
                {hud.mission.current}/{hud.mission.target}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug mb-1.5">
              {hud.mission.description}
            </p>
            <div className="w-full h-1 bg-slate-800 rounded-sm overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-all duration-150"
                style={{ width: `${missionPct}%` }}
              />
            </div>
            {(!hud.mission.completedAll &&
              (typeof hud.mission.distanceMeters === 'number' || hud.mission.objectiveLabel)) ||
            hud.freeRoamMode ? (
              <div className="flex items-center justify-between gap-2 mt-1.5 text-[10px]">
                <span className="truncate text-cyan-300 font-semibold">
                  {hud.freeRoamMode
                    ? 'FREE-ROAM AKTIF'
                    : hud.mission.inObjectiveZone
                      ? 'DI ZONA TARGET'
                      : (hud.mission.objectiveLabel ?? 'IKUTI SUAR TARGET')}
                </span>
                {!hud.mission.completedAll && typeof hud.mission.distanceMeters === 'number' && (
                  <span
                    className={`font-mono-tabular font-bold shrink-0 ${
                      hud.mission.inObjectiveZone ? 'text-emerald-400' : 'text-amber-300'
                    }`}
                  >
                    {hud.mission.distanceMeters} m
                  </span>
                )}
              </div>
            ) : null}
          </div>

          {/* Teammates Status in Multiplayer */}
          {hud.isMultiplayer && hud.teammates.length > 0 && (
            <div className="bg-[#090d16]/85 border border-white/12 rounded-lg px-3 py-2 space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">
                Rekan Tim · Ruang {hud.roomCode}
              </div>
              {hud.teammates.map((tm) => {
                const tmChar = CHARACTERS[tm.characterId] ?? CHARACTERS.raka;
                return (
                  <div key={tm.id} className="flex items-center justify-between gap-2 text-xs">
                    <span className="flex items-center gap-1.5 truncate text-slate-200">
                      <span
                        className="w-2 h-2 rounded-xs shrink-0"
                        style={{ backgroundColor: tmChar.accentColor }}
                      />
                      <span className="truncate">
                        {tm.name} ({tmChar.name})
                      </span>
                    </span>
                    <span className="font-mono-tabular text-[11px] text-slate-300 shrink-0">
                      {tm.alive ? `${tm.hp} HP` : 'Gugur'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top-Center: Wave, Map, Remaining Zombies & Active Boss HP */}
        <div className="flex flex-col items-center gap-2">
          <div className="bg-[#090d16]/88 border border-white/15 rounded-lg px-4 py-2 text-center">
            <div className="font-display text-xs sm:text-sm font-bold tracking-wider text-amber-400 whitespace-nowrap">
              GELOMBANG {hud.wave} · {MAPS[hud.currentMap].name.toUpperCase()}
            </div>
            <div className="text-[11px] sm:text-xs text-slate-300 font-mono-tabular whitespace-nowrap">
              Zombie Tersisa: <span className="text-white font-bold">{hud.zombiesRemaining}</span>
              <span className="mx-1.5 text-slate-600">·</span>
              <span
                className="font-semibold"
                style={{ color: DIFFICULTIES[hud.difficulty]?.accentColor ?? '#38bdf8' }}
              >
                {DIFFICULTIES[hud.difficulty]?.name ?? 'Normal'}
              </span>
            </div>
            <div className="mt-0.5 flex items-center justify-center gap-1.5 text-[10px] font-display tracking-wider text-cyan-300 whitespace-nowrap">
              <Compass className="w-3 h-3 shrink-0" />
              <span>SEKTOR: {hud.currentDistrict.toUpperCase()}</span>
              {hud.freeRoamMode && (
                <span className="text-emerald-400 font-bold">· FREE-ROAM</span>
              )}
            </div>
            <div className="mt-1 pt-1 border-t border-white/10 flex items-center justify-center gap-2 text-[10px] text-slate-200 font-mono-tabular whitespace-nowrap">
              <span className="flex items-center gap-1 text-amber-300 font-semibold">
                {hud.timeOfDay >= 0.24 && hud.timeOfDay < 0.76 ? (
                  <Sun className="w-3 h-3 text-amber-400 shrink-0" />
                ) : (
                  <Moon className="w-3 h-3 text-sky-300 shrink-0" />
                )}
                HARI {hud.dayCount} · {hud.timeString} ({hud.dayPhaseLabel})
              </span>
              <span className="text-slate-600">·</span>
              <span className="flex items-center gap-1 text-sky-200 font-semibold">
                {hud.weather === 'storm' ? (
                  <CloudLightning className="w-3 h-3 text-amber-300 shrink-0" />
                ) : hud.weather === 'rain' ? (
                  <CloudRain className="w-3 h-3 text-sky-300 shrink-0" />
                ) : hud.weather === 'foggy' ? (
                  <CloudFog className="w-3 h-3 text-slate-300 shrink-0" />
                ) : (
                  <Sun className="w-3 h-3 text-amber-300 shrink-0" />
                )}
                {hud.weatherLabel}
              </span>
            </div>
          </div>

          {hud.currentInterior && (
            <div className="flex items-center gap-1.5 bg-[#090d16]/90 border border-emerald-400/40 rounded-md px-3 py-1 text-[11px] font-display font-bold tracking-wider text-emerald-300 whitespace-nowrap">
              <Home className="w-3.5 h-3.5 shrink-0" />
              <span>DALAM GEDUNG: {hud.currentInterior.toUpperCase()}</span>
            </div>
          )}

          {hud.activeBoss && (
            <div
              className={`bg-[#090d16]/94 border rounded-lg px-3.5 py-2 min-w-[235px] sm:min-w-[300px] ${
                hud.activeBoss.skillWarning ? 'border-amber-400' : 'border-red-500/45'
              }`}
            >
              <div className="flex items-center justify-between gap-3 text-[11px] mb-1">
                <span className="flex items-center gap-1.5 font-display font-bold tracking-wider text-red-400 truncate">
                  <Skull className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  {hud.activeBoss.name.toUpperCase()}
                </span>
                <span className="font-mono-tabular font-bold text-white shrink-0">
                  {hud.activeBoss.hp} / {hud.activeBoss.maxHp} HP
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-sm overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-100"
                  style={{
                    width: `${Math.max(0, Math.min(100, (hud.activeBoss.hp / Math.max(1, hud.activeBoss.maxHp)) * 100))}%`,
                  }}
                />
              </div>
              {hud.activeBoss.skillWarning && (
                <div className="mt-1 text-[10px] font-display font-bold tracking-wider text-amber-300 uppercase">
                  SKILL BOS: {hud.activeBoss.skillWarning}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Top-Right: Camera Toggle, Score, Pause & Tactical Radar */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-start gap-2">
            <button
              type="button"
              onClick={onOpenRpgMenu}
              title="Buka Menu RPG: Atribut, Perlengkapan, Tempa Senjata & Ramuan (Tombol B)"
              className={`pointer-events-auto flex items-center gap-1.5 h-11 px-3 rounded-lg border font-display font-bold text-xs tracking-wider transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                hud.rpgMenuOpen || hud.statPoints > 0
                  ? 'bg-amber-500 text-slate-950 border-amber-300'
                  : 'bg-[#090d16]/90 hover:bg-[#141d2e] text-amber-300 border-amber-400/40'
              }`}
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>RPG</span>
              {hud.statPoints > 0 ? (
                <span className="font-mono-tabular">+{hud.statPoints}</span>
              ) : (
                <span className="hidden sm:inline">[B]</span>
              )}
            </button>

            <button
              type="button"
              onClick={onOpenMapTravel}
              title="Buka Peta Dunia — Pindah ke 10 Map Langsung (Tombol M)"
              className={`pointer-events-auto flex items-center gap-1.5 h-11 px-3 rounded-lg border font-display font-bold text-xs tracking-wider transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                hud.mapTravelOpen || hud.nearPortalGate
                  ? 'bg-cyan-500 text-slate-950 border-cyan-300'
                  : 'bg-[#090d16]/90 hover:bg-[#141d2e] text-cyan-300 border-cyan-400/40'
              }`}
            >
              <Globe className="w-4 h-4 shrink-0" />
              <span>PETA</span>
              <span className="hidden sm:inline">[M]</span>
            </button>

            <button
              type="button"
              onClick={onToggleCamera}
              title="Ganti Kamera 1st Person / 3rd Person (V atau Scroll Mouse)"
              className={`pointer-events-auto flex items-center gap-1.5 h-11 px-3 rounded-lg border font-display font-bold text-xs tracking-wider transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                hud.cameraMode === 'fps'
                  ? 'bg-cyan-500 text-slate-950 border-cyan-300'
                  : 'bg-[#090d16]/90 hover:bg-[#141d2e] text-slate-100 border-white/15'
              }`}
            >
              <Eye className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">
                {hud.cameraMode === 'fps' ? '1ST PERSON [V]' : '3RD PERSON [V]'}
              </span>
            </button>

            <div className="bg-[#090d16]/88 border border-white/15 rounded-lg px-3.5 py-2 text-right">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider">Skor</div>
              <div className="font-mono-tabular text-base sm:text-lg font-bold text-amber-400 leading-tight">
                {hud.score.toLocaleString('id-ID')}
              </div>
              <div className="text-[11px] text-slate-300 font-mono-tabular">
                Eliminasi: <span className="font-bold text-white">{hud.kills}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onPause}
              aria-label="Jeda Permainan"
              className="pointer-events-auto flex items-center justify-center w-11 h-11 rounded-lg bg-[#090d16]/90 hover:bg-[#141d2e] border border-white/15 text-slate-100 transition-colors cursor-pointer shrink-0"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>

          {/* Tactical Minimap / Radar */}
          <div className="bg-[#090d16]/88 border border-white/15 rounded-xl p-1.5 flex flex-col items-center">
            <svg
              viewBox="0 0 128 128"
              className="w-24 h-24 sm:w-28 sm:h-28 overflow-visible"
              aria-label="Radar Taktis"
            >
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="#070b14"
                stroke="rgba(148, 163, 184, 0.25)"
                strokeWidth="1.5"
              />
              <circle
                cx="64"
                cy="64"
                r="30"
                fill="none"
                stroke="rgba(148, 163, 184, 0.14)"
                strokeWidth="1"
              />
              <line x1="64" y1="8" x2="64" y2="120" stroke="rgba(148, 163, 184, 0.12)" strokeWidth="1" />
              <line x1="8" y1="64" x2="120" y2="64" stroke="rgba(148, 163, 184, 0.12)" strokeWidth="1" />
              {/* Camera FOV Cone */}
              <path
                d="M 64 64 L 40 22 A 48 48 0 0 1 88 22 Z"
                fill="rgba(34, 211, 238, 0.1)"
              />

              {/* Radar Blips */}
              {hud.minimapBlips.map((blip, idx) => {
                const pos = projectBlip(blip.x, blip.z);
                if (blip.kind === 'objective') {
                  return (
                    <g key={`obj-${idx}`} transform={`translate(${pos.sx}, ${pos.sy})`}>
                      <polygon
                        points="0,-6 6,0 0,6 -6,0"
                        fill={hud.mission.objectiveColor ?? '#f59e0b'}
                        stroke="#ffffff"
                        strokeWidth="1.2"
                      />
                    </g>
                  );
                }
                if (blip.kind === 'collectible') {
                  return (
                    <rect
                      key={`col-${idx}`}
                      x={pos.sx - 3}
                      y={pos.sy - 3}
                      width="6"
                      height="6"
                      rx="1"
                      fill="#22d3ee"
                      stroke="#ffffff"
                      strokeWidth="0.8"
                    />
                  );
                }
                if (blip.kind === 'boss') {
                  return (
                    <polygon
                      key={`boss-${idx}`}
                      points={`${pos.sx},${pos.sy - 4.5} ${pos.sx + 4.5},${pos.sy} ${pos.sx},${pos.sy + 4.5} ${pos.sx - 4.5},${pos.sy}`}
                      fill="#ef4444"
                      stroke="#fbbf24"
                      strokeWidth="1"
                    />
                  );
                }
                if (blip.kind === 'teammate') {
                  return (
                    <circle
                      key={`tm-${idx}`}
                      cx={pos.sx}
                      cy={pos.sy}
                      r="3"
                      fill="#38bdf8"
                      stroke="#ffffff"
                      strokeWidth="0.8"
                    />
                  );
                }
                if (blip.kind === 'portal') {
                  return (
                    <g key={`ptl-${idx}`} transform={`translate(${pos.sx}, ${pos.sy})`}>
                      <circle
                        cx="0"
                        cy="0"
                        r="4.5"
                        fill="rgba(34, 211, 238, 0.25)"
                        stroke="#22d3ee"
                        strokeWidth="1.4"
                      />
                      <circle cx="0" cy="0" r="1.8" fill="#e0f2fe" />
                    </g>
                  );
                }
                if (blip.kind === 'vehicle') {
                  return (
                    <rect
                      key={`veh-${idx}`}
                      x={pos.sx - 3.2}
                      y={pos.sy - 2.2}
                      width="6.4"
                      height="4.4"
                      rx="1"
                      fill="#facc15"
                      stroke="#0f172a"
                      strokeWidth="0.9"
                    />
                  );
                }
                if (blip.kind === 'pickup') {
                  return (
                    <circle
                      key={`pk-${idx}`}
                      cx={pos.sx}
                      cy={pos.sy}
                      r="2.2"
                      fill="#34d399"
                    />
                  );
                }
                return (
                  <circle
                    key={`zb-${idx}`}
                    cx={pos.sx}
                    cy={pos.sy}
                    r="2"
                    fill="#f87171"
                    opacity={pos.clamped ? 0.45 : 0.9}
                  />
                );
              })}

              {/* Player Center Arrow */}
              <polygon
                points="64,58 69,69 64,66 59,69"
                fill="#ffffff"
                stroke="#0f172a"
                strokeWidth="1"
              />
            </svg>
            <div className="text-[9px] font-mono-tabular text-slate-300 mt-0.5 tracking-wider">
              {!hud.mission.completedAll && typeof hud.mission.distanceMeters === 'number'
                ? `TARGET: ${hud.mission.distanceMeters} m`
                : `RADAR ${radarRange}m`}
            </div>
          </div>
        </div>
      </div>

      {/* Wave Announcement Banner */}
      {hud.waveBannerText && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-[#090d16]/92 border border-amber-500/40 rounded-lg px-6 py-2 text-center">
          <p className="font-display text-sm sm:text-base font-bold tracking-[0.14em] text-amber-400 whitespace-nowrap">
            {hud.waveBannerText}
          </p>
        </div>
      )}

      {/* Level Up / Weapon Unlock / Weapon Drop Banner */}
      {hud.unlockBannerText && (
        <div className="absolute top-36 left-1/2 -translate-x-1/2 bg-[#090d16]/94 border border-cyan-400/50 rounded-lg px-5 py-2 text-center">
          <p className="font-display text-xs sm:text-sm font-bold tracking-wider text-cyan-300 whitespace-nowrap">
            {hud.unlockBannerText}
          </p>
        </div>
      )}

      {/* Pickup Notification */}
      {hud.pickupNotice && (
        <div className="absolute top-48 left-1/2 -translate-x-1/2 bg-[#090d16]/92 border border-emerald-400/40 rounded-md px-4 py-1.5">
          <p className="font-display text-xs sm:text-sm font-bold tracking-wider text-emerald-400 whitespace-nowrap">
            {hud.pickupNotice}
          </p>
        </div>
      )}

      {/* Downed Spectator Notice in Co-op */}
      {hud.isMultiplayer && hud.hp <= 0 && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 bg-[#090d16]/92 border border-red-500/45 rounded-lg px-5 py-3 text-center">
          <p className="font-display text-sm font-bold text-red-400">
            KAMU GUGUR — MENONTON REKAN TIM
          </p>
          <p className="text-xs text-slate-300 mt-0.5">
            Kamu akan hidup kembali saat gelombang berikutnya dimulai
          </p>
        </div>
      )}

      {/* Center Crosshair + Hitmarker (hidden while driving, answering puzzle, choosing map, or in RPG menu) */}
      {!hud.inVehicle && !hud.activePuzzle && !hud.mapTravelOpen && !hud.rpgMenuOpen && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <div
            className={`relative flex items-center justify-center transition-transform duration-150 ${
              hud.isAiming ? 'w-5 h-5 scale-90' : 'w-7 h-7 scale-100'
            }`}
          >
            <span className="absolute top-0 w-[2px] h-2 bg-white/85" />
            <span className="absolute bottom-0 w-[2px] h-2 bg-white/85" />
            <span className="absolute left-0 h-[2px] w-2 bg-white/85" />
            <span className="absolute right-0 h-[2px] w-2 bg-white/85" />
            <span
              className={`w-1 h-1 rounded-full ${
                hud.isAiming ? 'bg-cyan-400' : 'bg-amber-400'
              }`}
            />

            {hud.hitMarkerActive && (
              <div
                className={`absolute inset-0 flex items-center justify-center ${
                  hud.isCriticalHit ? 'text-amber-400' : 'text-red-400'
                }`}
              >
                <span className="absolute w-3.5 h-[2px] bg-current rotate-45 -translate-x-1.5 -translate-y-1.5" />
                <span className="absolute w-3.5 h-[2px] bg-current -rotate-45 translate-x-1.5 -translate-y-1.5" />
                <span className="absolute w-3.5 h-[2px] bg-current -rotate-45 -translate-x-1.5 translate-y-1.5" />
                <span className="absolute w-3.5 h-[2px] bg-current rotate-45 translate-x-1.5 translate-y-1.5" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vehicle Enter Prompt or Active Driving Speedometer */}
      {hud.inVehicle && hud.vehicleName && !hud.activePuzzle && !hud.mapTravelOpen && !hud.rpgMenuOpen && (
        <div
          className={`absolute left-1/2 -translate-x-1/2 pointer-events-auto flex items-center gap-3 bg-[#090d16]/94 border border-amber-400/50 rounded-xl px-4 py-2 ${
            isTouchVisible ? 'bottom-56 sm:bottom-32' : 'bottom-32'
          }`}
        >
          <Car className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="leading-tight">
            <div className="font-display text-xs font-bold text-white tracking-wider whitespace-nowrap">
              {hud.vehicleName.toUpperCase()}
            </div>
            <div className="text-[10px] text-slate-300 whitespace-nowrap">
              W/S Gas · A/D Belok · Shift Turbo · Space Rem/Klakson
            </div>
          </div>
          <div className="pl-2 border-l border-white/15 text-right font-mono-tabular">
            <span className="text-lg font-bold text-amber-400">{hud.vehicleSpeedKmh}</span>
            <span className="text-[10px] text-slate-400 ml-1">km/j</span>
          </div>
          <button
            type="button"
            onClick={onToggleVehicle}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-xs tracking-wider cursor-pointer whitespace-nowrap"
          >
            TURUN [G]
          </button>
        </div>
      )}

      {!hud.inVehicle && hud.nearbyVehicleName && !hud.activePuzzle && !hud.mapTravelOpen && !hud.rpgMenuOpen && (
        <div
          className={`absolute left-1/2 -translate-x-1/2 pointer-events-auto ${
            isTouchVisible ? 'bottom-56 sm:bottom-32' : 'bottom-32'
          }`}
        >
          <button
            type="button"
            onClick={onToggleVehicle}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 border border-amber-200 rounded-lg px-4 py-2 font-display font-bold text-xs sm:text-sm tracking-wider cursor-pointer whitespace-nowrap shadow-lg"
          >
            <Car className="w-4 h-4 shrink-0" />
            <span>TEKAN [G] NAIK: {hud.nearbyVehicleName.toUpperCase()}</span>
          </button>
        </div>
      )}

      {/* Nearby 3D Transit Portal Gate Prompt */}
      {hud.nearPortalGate && !hud.activePuzzle && !hud.mapTravelOpen && !hud.rpgMenuOpen && (
        <div
          className={`absolute left-1/2 -translate-x-1/2 pointer-events-auto ${
            hud.inVehicle || hud.nearbyVehicleName
              ? isTouchVisible
                ? 'bottom-68 sm:bottom-44'
                : 'bottom-44'
              : isTouchVisible
                ? 'bottom-56 sm:bottom-32'
                : 'bottom-32'
          }`}
        >
          <button
            type="button"
            onClick={onOpenMapTravel}
            className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 border border-cyan-200 rounded-lg px-4 py-2 font-display font-bold text-xs sm:text-sm tracking-wider cursor-pointer whitespace-nowrap shadow-lg"
          >
            <Globe className="w-4 h-4 shrink-0" />
            <span>TEKAN [M] GERBANG LINTAS PETA — AKSES 10 MAP</span>
          </button>
        </div>
      )}

      {/* Subtle PC pointer lock hint */}
      {!isTouchVisible && !hud.pointerLocked && !hud.activePuzzle && !hud.mapTravelOpen && !hud.rpgMenuOpen && (
        <div className="absolute bottom-[118px] left-1/2 -translate-x-1/2 pointer-events-auto">
          <button
            type="button"
            onClick={onLockPointer}
            className="bg-[#090d16]/88 hover:bg-[#131b2b] border border-white/15 rounded-lg px-4 py-1.5 text-xs text-slate-200 cursor-pointer whitespace-nowrap"
          >
            Klik area game untuk kunci mouse (B Menu RPG · E/X/T Skill · H Ramuan · M 10 Map · G Mobil)
          </button>
        </div>
      )}

      {/* Bottom-Left: Circular Movement Action Buttons on Desktop */}
      {!isTouchVisible && (
        <div className="absolute bottom-4 left-4 flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={onToggleRun}
            title="Lari (Shift)"
            className={`w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center gap-0.5 font-display font-bold text-[10px] cursor-pointer whitespace-nowrap transition-colors ${
              hud.isRunning
                ? 'bg-cyan-500 text-slate-950 border-cyan-200'
                : 'bg-[#090d16]/88 text-slate-200 border-white/25 hover:border-white/45'
            }`}
          >
            <Footprints className="w-3.5 h-3.5" />
            <span>LARI</span>
          </button>

          <button
            type="button"
            onClick={onJump}
            title="Lompat (Space)"
            className={`w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center gap-0.5 font-display font-bold text-[9px] cursor-pointer whitespace-nowrap transition-colors ${
              hud.isJumping
                ? 'bg-amber-500 text-slate-950 border-amber-200'
                : 'bg-[#090d16]/88 text-slate-200 border-white/25 hover:border-white/45'
            }`}
          >
            <ArrowUp className="w-3.5 h-3.5" />
            <span>LOMPAT</span>
          </button>

          <button
            type="button"
            onClick={onToggleCrouch}
            title="Jongkok (C)"
            className={`w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center gap-0.5 font-display font-bold text-[9px] cursor-pointer whitespace-nowrap transition-colors ${
              hud.isCrouching
                ? 'bg-emerald-500 text-slate-950 border-emerald-200'
                : 'bg-[#090d16]/88 text-slate-200 border-white/25 hover:border-white/45'
            }`}
          >
            <ArrowDown className="w-3.5 h-3.5" />
            <span>JONGKOK</span>
          </button>

          <button
            type="button"
            onClick={onDash}
            disabled={!dashReady}
            title="Dash (Q)"
            className={`relative overflow-hidden w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center gap-0.5 font-display font-bold text-[10px] whitespace-nowrap transition-colors ${
              hud.isDashing
                ? 'bg-cyan-400 text-slate-950 border-cyan-200'
                : dashReady
                  ? 'bg-[#090d16]/88 text-cyan-300 border-cyan-400/55 hover:border-cyan-300 cursor-pointer'
                  : 'bg-[#090d16]/65 text-slate-500 border-white/15 cursor-not-allowed'
            }`}
          >
            <Wind className="w-3.5 h-3.5 relative z-10" />
            <span className="relative z-10">DASH</span>
          </button>

          <button
            type="button"
            onClick={onToggleAim}
            title="Bidik Zoom (Klik Kanan / Z)"
            className={`w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center gap-0.5 font-display font-bold text-[10px] cursor-pointer whitespace-nowrap transition-colors ${
              hud.isAiming
                ? 'bg-amber-500 text-slate-950 border-amber-200'
                : 'bg-[#090d16]/88 text-slate-200 border-white/25 hover:border-white/45'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>BIDIK</span>
          </button>

          {(hud.inVehicle || hud.nearbyVehicleName) && (
            <button
              type="button"
              onClick={onToggleVehicle}
              title="Naik / Turun Kendaraan (G)"
              className={`w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center gap-0.5 font-display font-bold text-[9px] cursor-pointer whitespace-nowrap transition-colors ${
                hud.inVehicle
                  ? 'bg-amber-500 text-slate-950 border-amber-200'
                  : 'bg-cyan-500 text-slate-950 border-cyan-200'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>{hud.inVehicle ? 'TURUN' : 'NAIK'}</span>
            </button>
          )}
        </div>
      )}

      {/* Bottom-Center: Compact RPG Active Skill & Potion Bar + Weapon Arsenal Bar */}
      <div
        className={`absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 pointer-events-auto ${
          isTouchVisible ? 'bottom-36 sm:bottom-4' : 'bottom-4'
        }`}
      >
        {/* 3D RPG Skills (E / X / T) & HP Potion (H) */}
        <div className="flex items-center gap-1.5">
          {hud.skills.map((sk) => {
            const spec = RPG_SKILLS[sk.id];
            const onCd = sk.cooldownRemaining > 0.05;
            const notEnoughMp = hud.mp < spec.mpCost;
            const disabled = onCd || notEnoughMp;
            const SkillIcon =
              sk.id === 'shockwave' ? Zap : sk.id === 'heal' ? HeartPulse : Flame;
            return (
              <button
                key={sk.id}
                type="button"
                disabled={disabled}
                onClick={() => onCastSkill(sk.id)}
                title={`${spec.name} (${spec.mpCost} MP · CD ${spec.cooldown}d)`}
                className={`relative overflow-hidden flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-display font-bold tracking-wider whitespace-nowrap transition-colors ${
                  !disabled
                    ? 'bg-[#090d16]/92 text-white border-white/25 hover:border-amber-400 cursor-pointer'
                    : 'bg-[#090d16]/70 text-slate-500 border-white/10 cursor-not-allowed'
                }`}
              >
                {onCd && (
                  <span
                    className="absolute inset-0 bg-slate-950/70 pointer-events-none"
                    style={{
                      width: `${Math.round((sk.cooldownRemaining / Math.max(1, sk.maxCooldown)) * 100)}%`,
                    }}
                  />
                )}
                <SkillIcon
                  className="w-3.5 h-3.5 shrink-0 relative z-10"
                  style={{ color: disabled ? '#64748b' : spec.accentColor }}
                />
                <span className="relative z-10 font-mono-tabular text-[10px] text-slate-300">
                  [{spec.hotkey}]
                </span>
                <span className="relative z-10">
                  {onCd ? `${Math.ceil(sk.cooldownRemaining)}d` : spec.shortName}
                </span>
                {!onCd && (
                  <span className="relative z-10 font-mono-tabular text-[9px] text-sky-300">
                    {spec.mpCost}MP
                  </span>
                )}
              </button>
            );
          })}

          <button
            type="button"
            disabled={hud.hpPotions <= 0 || hud.hp >= hud.maxHp}
            onClick={onUseHpPotion}
            title="Gunakan Ramuan HP (Tombol H)"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-[11px] font-display font-bold tracking-wider whitespace-nowrap transition-colors ${
              hud.hpPotions > 0 && hud.hp < hud.maxHp
                ? 'bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-300 border-emerald-400/50 cursor-pointer'
                : 'bg-[#090d16]/70 text-slate-500 border-white/10 cursor-not-allowed'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5 shrink-0" />
            <span className="font-mono-tabular text-[10px]">[H]</span>
            <span className="font-mono-tabular">x{hud.hpPotions}</span>
          </button>
        </div>

        {/* Weapon Arsenal Bar (Keys 1-4 / Clickable) */}
        <div className="flex items-center gap-1.5">
          {hud.weapons.map((w, idx) => {
            const active = w.id === hud.currentWeapon;
            const tier = hud.weaponForageLevels[w.id] ?? 0;
            return (
              <button
                key={w.id}
                type="button"
                disabled={!w.unlocked}
                onClick={() => onSelectWeapon(w.id)}
                className={`px-3 py-1.5 rounded-lg border text-left transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                    : w.unlocked
                      ? 'bg-[#090d16]/90 text-slate-200 border-white/15 hover:border-white/35 cursor-pointer'
                      : 'bg-[#090d16]/65 text-slate-500 border-white/10 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-1 text-[10px]">
                  <span className="font-mono-tabular">[{idx + 1}]</span>
                  <span>
                    {w.shortName}
                    {tier > 0 ? ` +${tier}` : ''}
                  </span>
                  {!w.unlocked && <Lock className="w-2.5 h-2.5 inline" />}
                </div>
                <div className="text-[10px] font-mono-tabular opacity-85">
                  {w.unlocked ? `${w.ammoInMag}/${w.reserveAmmo}` : `Drop / ${w.unlockKills} Kill`}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom-Right: Low Ammo Refill Button + Active Weapon & Ammo Panel */}
      <div
        className={`absolute right-3 sm:right-5 flex flex-col items-end gap-2 ${
          isTouchVisible ? 'bottom-48 sm:bottom-5' : 'bottom-5'
        }`}
      >
        {!isTouchVisible && hud.isAmmoLow && (
          <button
            type="button"
            onClick={onAmmoRefill}
            disabled={hud.ammoRefillCooldownRatio > 0.02}
            className={`pointer-events-auto relative overflow-hidden flex items-center gap-2 px-3.5 py-2 rounded-full border-2 font-display font-bold text-xs tracking-wider whitespace-nowrap transition-colors ${
              hud.ammoRefillCooldownRatio <= 0.02
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-200 cursor-pointer'
                : 'bg-[#090d16]/90 text-slate-400 border-amber-400/35 cursor-not-allowed'
            }`}
          >
            <PackagePlus className="w-4 h-4 relative z-10" />
            <span className="relative z-10">
              {hud.ammoRefillCooldownRatio <= 0.02
                ? 'REFILL PELURU [F]'
                : `REFILL (${Math.ceil(hud.ammoRefillCooldownRatio * 10)}s)`}
            </span>
          </button>
        )}

        <div className="bg-[#090d16]/88 border border-white/15 rounded-lg px-4 py-2.5 text-right">
          <div
            className="text-[11px] font-display font-semibold tracking-wider uppercase"
            style={{ color: activeWeaponSpec.accentColor }}
          >
            {activeWeaponSpec.name}
            {activeForgeTier > 0 ? ` +${activeForgeTier}` : ''}
          </div>
          {hud.isReloading ? (
            <div className="mt-1 min-w-[120px]">
              <div className="text-xs font-display font-bold text-amber-400 mb-1">
                MENGISI PELURU...
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-sm overflow-hidden">
                <div
                  className="h-full bg-amber-400"
                  style={{ width: `${Math.round(hud.reloadProgress * 100)}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="font-mono-tabular text-xl sm:text-2xl font-bold text-white leading-tight mt-0.5">
              <span className={hud.ammoInMag <= 4 ? 'text-red-400' : 'text-white'}>
                {hud.ammoInMag}
              </span>
              <span className="text-slate-500 text-base mx-1">/</span>
              <span className="text-slate-300 text-base">{hud.reserveAmmo}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
