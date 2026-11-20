import React, { useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Car,
  Crosshair,
  Eye,
  Footprints,
  PackagePlus,
  RotateCw,
  Wind,
} from 'lucide-react';
import { CameraViewMode } from '../types/game';

interface TouchControlsProps {
  isCrouching: boolean;
  cameraMode: CameraViewMode;
  isAiming: boolean;
  inVehicle: boolean;
  nearbyVehicleName: string | null;
  dashCooldownRatio: number;
  isAmmoLow: boolean;
  ammoRefillCooldownRatio: number;
  onJoystickMove: (x: number, y: number) => void;
  onLookDrag: (dx: number, dy: number) => void;
  onShootChange: (active: boolean) => void;
  onReload: () => void;
  onRunChange: (active: boolean) => void;
  onToggleCrouch: () => void;
  onJump: () => void;
  onDash: () => void;
  onAmmoRefill: () => void;
  onToggleCamera: () => void;
  onToggleAim: () => void;
  onToggleVehicle: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  isCrouching,
  cameraMode,
  isAiming,
  inVehicle,
  nearbyVehicleName,
  dashCooldownRatio,
  isAmmoLow,
  ammoRefillCooldownRatio,
  onJoystickMove,
  onLookDrag,
  onShootChange,
  onReload,
  onRunChange,
  onToggleCrouch,
  onJump,
  onDash,
  onAmmoRefill,
  onToggleCamera,
  onToggleAim,
  onToggleVehicle,
}) => {
  const joyBaseRef = useRef<HTMLDivElement | null>(null);
  const joyTouchIdRef = useRef<number | null>(null);
  const lookTouchIdRef = useRef<number | null>(null);
  const lastLookPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [knobOffset, setKnobOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [runToggled, setRunToggled] = useState(false);

  const maxRadius = 42;

  const updateJoystick = (clientX: number, clientY: number) => {
    const base = joyBaseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }
    setKnobOffset({ x: dx, y: dy });
    onJoystickMove(dx / maxRadius, dy / maxRadius);
  };

  const handleJoyTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (joyTouchIdRef.current !== null) return;
    const t = e.changedTouches[0];
    joyTouchIdRef.current = t.identifier;
    updateJoystick(t.clientX, t.clientY);
  };

  const handleJoyTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === joyTouchIdRef.current) {
        updateJoystick(t.clientX, t.clientY);
      }
    }
  };

  const handleJoyTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joyTouchIdRef.current) {
        joyTouchIdRef.current = null;
        setKnobOffset({ x: 0, y: 0 });
        onJoystickMove(0, 0);
      }
    }
  };

  const handleLookTouchStart = (e: React.TouchEvent) => {
    if (lookTouchIdRef.current !== null) return;
    const t = e.changedTouches[0];
    lookTouchIdRef.current = t.identifier;
    lastLookPosRef.current = { x: t.clientX, y: t.clientY };
  };

  const handleLookTouchMove = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === lookTouchIdRef.current) {
        const dx = t.clientX - lastLookPosRef.current.x;
        const dy = t.clientY - lastLookPosRef.current.y;
        lastLookPosRef.current = { x: t.clientX, y: t.clientY };
        onLookDrag(dx, dy);
      }
    }
  };

  const handleLookTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === lookTouchIdRef.current) {
        lookTouchIdRef.current = null;
      }
    }
  };

  const toggleRun = () => {
    const next = !runToggled;
    setRunToggled(next);
    onRunChange(next);
  };

  const dashReady = dashCooldownRatio <= 0.02;
  const refillReady = ammoRefillCooldownRatio <= 0.02;

  return (
    <div className="absolute inset-0 z-15 pointer-events-none">
      {/* Right-side invisible touch-drag camera look zone */}
      <div
        className="absolute top-16 right-0 bottom-0 left-[38%] pointer-events-auto"
        onTouchStart={handleLookTouchStart}
        onTouchMove={handleLookTouchMove}
        onTouchEnd={handleLookTouchEnd}
        onTouchCancel={handleLookTouchEnd}
      />

      {/* Bottom-Left: Virtual Analog Joystick */}
      <div
        ref={joyBaseRef}
        onTouchStart={handleJoyTouchStart}
        onTouchMove={handleJoyTouchMove}
        onTouchEnd={handleJoyTouchEnd}
        onTouchCancel={handleJoyTouchEnd}
        className="absolute bottom-6 left-6 w-28 h-28 rounded-full bg-[#090d16]/75 border-2 border-white/20 flex items-center justify-center pointer-events-auto touch-none"
        aria-label="Joystick Gerak"
      >
        <div
          className="w-12 h-12 rounded-full bg-cyan-400/80 border border-white/60 transition-transform duration-75"
          style={{
            transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)`,
          }}
        />
      </div>

      {/* Bottom-Right: Circular LARI, JONGKOK, LOMPAT, DASH, RELOAD, REFILL, SHOOT */}
      <div className="absolute bottom-5 right-4 flex items-end gap-2.5 pointer-events-auto">
        {/* Column 1: Circular KAMERA, LARI & JONGKOK */}
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onToggleCamera}
            className={`w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center gap-0.5 font-display font-bold text-[9px] tracking-wider cursor-pointer whitespace-nowrap transition-colors ${
              cameraMode === 'fps'
                ? 'bg-cyan-500 text-slate-950 border-cyan-200'
                : 'bg-[#090d16]/88 text-slate-100 border-white/25'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>{cameraMode === 'fps' ? '1ST CAM' : '3RD CAM'}</span>
          </button>

          <button
            type="button"
            onClick={toggleRun}
            className={`w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center gap-0.5 font-display font-bold text-[10px] tracking-wider cursor-pointer whitespace-nowrap transition-colors ${
              runToggled && !isCrouching
                ? 'bg-cyan-500 text-slate-950 border-cyan-200'
                : 'bg-[#090d16]/88 text-slate-100 border-white/25'
            }`}
          >
            <Footprints className="w-4 h-4" />
            <span>{inVehicle ? 'TURBO' : 'LARI'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!isCrouching && runToggled) {
                setRunToggled(false);
                onRunChange(false);
              }
              onToggleCrouch();
            }}
            className={`w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center gap-0.5 font-display font-bold text-[9px] tracking-wider cursor-pointer whitespace-nowrap transition-colors ${
              isCrouching
                ? 'bg-emerald-500 text-slate-950 border-emerald-200'
                : 'bg-[#090d16]/88 text-slate-100 border-white/25'
            }`}
          >
            <ArrowDown className="w-4 h-4" />
            <span>JONGKOK</span>
          </button>
        </div>

        {/* Column 2: Circular LOMPAT, DASH, RELOAD */}
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onJump}
            className="w-14 h-14 rounded-full bg-[#090d16]/88 active:bg-amber-500 active:text-slate-950 border-2 border-white/25 text-slate-100 flex flex-col items-center justify-center gap-0.5 font-display font-bold text-[9px] tracking-wider cursor-pointer whitespace-nowrap"
          >
            <ArrowUp className="w-4 h-4" />
            <span>LOMPAT</span>
          </button>

          <button
            type="button"
            onClick={onDash}
            disabled={!dashReady}
            className={`relative overflow-hidden w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center gap-0.5 font-display font-bold text-[10px] tracking-wider whitespace-nowrap ${
              dashReady
                ? 'bg-cyan-500/25 active:bg-cyan-400 active:text-slate-950 text-cyan-300 border-cyan-400/70 cursor-pointer'
                : 'bg-[#090d16]/75 text-slate-500 border-white/15 cursor-not-allowed'
            }`}
          >
            <Wind className="w-4 h-4 relative z-10" />
            <span className="relative z-10">DASH</span>
            {!dashReady && (
              <span
                className="absolute bottom-0 left-0 right-0 bg-cyan-400/30"
                style={{ height: `${Math.round((1 - dashCooldownRatio) * 100)}%` }}
              />
            )}
          </button>

          <button
            type="button"
            onClick={onReload}
            className="w-14 h-14 rounded-full bg-[#090d16]/88 active:bg-amber-500 active:text-slate-950 border-2 border-white/25 text-slate-100 flex flex-col items-center justify-center gap-0.5 font-display font-bold text-[9px] tracking-wider cursor-pointer whitespace-nowrap"
          >
            <RotateCw className="w-4 h-4" />
            <span>RELOAD</span>
          </button>
        </div>

        {/* Column 3: Conditional Vehicle NAIK/TURUN, Low-Ammo REFILL, BIDIK & Primary SHOOT */}
        <div className="flex flex-col items-center gap-2.5">
          {(inVehicle || nearbyVehicleName) && (
            <button
              type="button"
              onClick={onToggleVehicle}
              className={`w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center gap-0.5 font-display font-bold text-[9px] tracking-wider cursor-pointer whitespace-nowrap transition-colors ${
                inVehicle
                  ? 'bg-amber-500 text-slate-950 border-amber-200'
                  : 'bg-cyan-500 text-slate-950 border-cyan-200'
              }`}
            >
              <Car className="w-4 h-4" />
              <span>{inVehicle ? 'TURUN' : 'NAIK'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onToggleAim}
            className={`w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center gap-0.5 font-display font-bold text-[9px] tracking-wider cursor-pointer whitespace-nowrap transition-colors ${
              isAiming
                ? 'bg-amber-500 text-slate-950 border-amber-200'
                : 'bg-[#090d16]/88 text-slate-100 border-white/25'
            }`}
          >
            <Crosshair className="w-4 h-4" />
            <span>BIDIK</span>
          </button>

          {isAmmoLow && (
            <button
              type="button"
              onClick={onAmmoRefill}
              disabled={!refillReady}
              className={`relative overflow-hidden w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center gap-0.5 font-display font-bold text-[9px] tracking-wider whitespace-nowrap ${
                refillReady
                  ? 'bg-emerald-500 active:bg-emerald-400 text-slate-950 border-emerald-200 cursor-pointer'
                  : 'bg-[#090d16]/85 text-slate-400 border-amber-400/30 cursor-not-allowed'
              }`}
            >
              <PackagePlus className="w-4 h-4 relative z-10" />
              <span className="relative z-10">REFILL</span>
              {!refillReady && (
                <span
                  className="absolute bottom-0 left-0 right-0 bg-emerald-400/35"
                  style={{ height: `${Math.round((1 - ammoRefillCooldownRatio) * 100)}%` }}
                />
              )}
            </button>
          )}

          <button
            type="button"
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onShootChange(true);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onShootChange(false);
            }}
            onTouchCancel={() => onShootChange(false)}
            onMouseDown={() => onShootChange(true)}
            onMouseUp={() => onShootChange(false)}
            onMouseLeave={() => onShootChange(false)}
            className="w-20 h-20 rounded-full bg-amber-500 active:bg-amber-400 border-2 border-amber-200/75 text-slate-950 font-display font-bold text-sm tracking-wider flex items-center justify-center cursor-pointer shrink-0"
          >
            SHOOT
          </button>
        </div>
      </div>
    </div>
  );
};
