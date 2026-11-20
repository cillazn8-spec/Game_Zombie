import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Car,
  Crosshair,
  Footprints,
  PackagePlus,
  RotateCw,
  Target,
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
  onAimStickMove: (x: number, y: number) => void;
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
  isAiming,
  inVehicle,
  nearbyVehicleName,
  dashCooldownRatio,
  isAmmoLow,
  ammoRefillCooldownRatio,
  onJoystickMove,
  onAimStickMove,
  onLookDrag,
  onShootChange,
  onReload,
  onRunChange,
  onToggleCrouch,
  onJump,
  onDash,
  onAmmoRefill,
  onToggleAim,
  onToggleVehicle,
}) => {
  // Independent pointer tracking so left analog, right shoot analog, camera swipe,
  // and all action buttons work 100% simultaneously without blocking each other.
  const moveBaseRef = useRef<HTMLDivElement | null>(null);
  const movePointerIdRef = useRef<number | null>(null);
  const [moveKnob, setMoveKnob] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [moveActive, setMoveActive] = useState(false);

  const fireBaseRef = useRef<HTMLDivElement | null>(null);
  const firePointerIdRef = useRef<number | null>(null);
  const lastFirePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [fireKnob, setFireKnob] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [fireActive, setFireActive] = useState(false);

  const lookPointerIdRef = useRef<number | null>(null);
  const lastLookPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [runToggled, setRunToggled] = useState(false);

  const moveMaxR = 44;
  const fireMaxR = 44;

  // Clean up active inputs if TouchControls unmounts (e.g. puzzle / pause / RPG menu opens)
  useEffect(() => {
    return () => {
      onJoystickMove(0, 0);
      onAimStickMove(0, 0);
      onShootChange(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Left Movement Analog (Pointer Capture) ----
  const updateMoveStick = (clientX: number, clientY: number) => {
    const base = moveBaseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > moveMaxR) {
      dx = (dx / dist) * moveMaxR;
      dy = (dy / dist) * moveMaxR;
    }
    setMoveKnob({ x: dx, y: dy });
    onJoystickMove(dx / moveMaxR, dy / moveMaxR);
  };

  const handleMoveDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (movePointerIdRef.current !== null) return;
    movePointerIdRef.current = e.pointerId;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture unavailable
    }
    setMoveActive(true);
    updateMoveStick(e.clientX, e.clientY);
  };

  const handleMoveMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerId !== movePointerIdRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    updateMoveStick(e.clientX, e.clientY);
  };

  const handleMoveUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerId !== movePointerIdRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    movePointerIdRef.current = null;
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore
    }
    setMoveActive(false);
    setMoveKnob({ x: 0, y: 0 });
    onJoystickMove(0, 0);
  };

  // ---- Right Shoot & Aim Analog (Analog Tembakan — Camera Follows Stick Direction!) ----
  const updateFireStick = (clientX: number, clientY: number, applyDeltaLook: boolean) => {
    const base = fireBaseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > fireMaxR) {
      dx = (dx / dist) * fireMaxR;
      dy = (dy / dist) * fireMaxR;
    }

    if (applyDeltaLook) {
      const stepDx = clientX - lastFirePosRef.current.x;
      const stepDy = clientY - lastFirePosRef.current.y;
      if (Math.abs(stepDx) > 0.25 || Math.abs(stepDy) > 0.25) {
        onLookDrag(stepDx * 0.55, stepDy * 0.55);
      }
    }
    lastFirePosRef.current = { x: clientX, y: clientY };

    setFireKnob({ x: dx, y: dy });
    onAimStickMove(dx / fireMaxR, dy / fireMaxR);
  };

  const handleFireDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (firePointerIdRef.current !== null) return;
    firePointerIdRef.current = e.pointerId;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
    lastFirePosRef.current = { x: e.clientX, y: e.clientY };
    setFireActive(true);
    onShootChange(true);
    updateFireStick(e.clientX, e.clientY, false);
  };

  const handleFireMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerId !== firePointerIdRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    updateFireStick(e.clientX, e.clientY, true);
  };

  const handleFireUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerId !== firePointerIdRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    firePointerIdRef.current = null;
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore
    }
    setFireActive(false);
    setFireKnob({ x: 0, y: 0 });
    onAimStickMove(0, 0);
    onShootChange(false);
  };

  // ---- Background Open-Screen Camera Swipe Zone (Sits BELOW HUD & Action Buttons!) ----
  const handleLookDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (lookPointerIdRef.current !== null) return;
    if (e.pointerId === movePointerIdRef.current || e.pointerId === firePointerIdRef.current) return;
    lookPointerIdRef.current = e.pointerId;
    lastLookPosRef.current = { x: e.clientX, y: e.clientY };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
  };

  const handleLookMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerId !== lookPointerIdRef.current) return;
    const dx = e.clientX - lastLookPosRef.current.x;
    const dy = e.clientY - lastLookPosRef.current.y;
    lastLookPosRef.current = { x: e.clientX, y: e.clientY };
    onLookDrag(dx, dy);
  };

  const handleLookUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerId !== lookPointerIdRef.current) return;
    lookPointerIdRef.current = null;
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore
    }
  };

  // Instant multi-touch button helper (fires onPointerDown even while analogs are held!)
  const instantTap = (action: () => void) => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  const toggleRun = () => {
    const next = !runToggled;
    setRunToggled(next);
    onRunChange(next);
  };

  const dashReady = dashCooldownRatio <= 0.02;
  const refillReady = ammoRefillCooldownRatio <= 0.02;
  const fireAngleDeg =
    Math.hypot(fireKnob.x, fireKnob.y) > 6
      ? (Math.atan2(fireKnob.y, fireKnob.x) * 180) / Math.PI
      : null;

  return (
    <>
      {/* Background Open-Screen Swipe Look Zone (z-[8] — strictly BELOW GameHUD z-20 & Controls z-30) */}
      <div
        className="absolute inset-0 z-[8] pointer-events-auto touch-none"
        onPointerDown={handleLookDown}
        onPointerMove={handleLookMove}
        onPointerUp={handleLookUp}
        onPointerCancel={handleLookUp}
        aria-label="Area Geser Kamera"
      />

      {/* Foreground Mobile Dual-Analog & Action Pad Layer (z-30 — never blocks open screen) */}
      <div className="absolute inset-0 z-30 pointer-events-none select-none">
        {/* BOTTOM-LEFT: Analog Gerak + Lari + Vehicle Quick Button */}
        <div className="absolute bottom-4 left-4 sm:bottom-5 sm:left-6 flex flex-col items-start gap-2.5">
          {/* Quick Vehicle & Sprint Row right above Left Analog */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              type="button"
              onPointerDown={instantTap(toggleRun)}
              className={`touch-none w-12 h-12 rounded-full border-2 flex flex-col items-center justify-center gap-0.5 font-display font-bold text-[9px] tracking-wider cursor-pointer active:scale-95 transition-transform ${
                runToggled && !isCrouching
                  ? 'bg-cyan-500 text-slate-950 border-cyan-200 shadow-lg shadow-cyan-500/30'
                  : 'bg-[#090d16]/85 text-slate-100 border-white/25'
              }`}
            >
              <Footprints className="w-3.5 h-3.5" />
              <span>{inVehicle ? 'TURBO' : 'LARI'}</span>
            </button>

            {(inVehicle || nearbyVehicleName) && (
              <button
                type="button"
                onPointerDown={instantTap(onToggleVehicle)}
                className={`touch-none px-3 h-11 rounded-full border-2 flex items-center justify-center gap-1.5 font-display font-bold text-[10px] tracking-wider cursor-pointer active:scale-95 transition-transform whitespace-nowrap shadow-lg ${
                  inVehicle
                    ? 'bg-amber-500 text-slate-950 border-amber-200'
                    : 'bg-cyan-500 text-slate-950 border-cyan-200'
                }`}
              >
                <Car className="w-4 h-4 shrink-0" />
                <span>{inVehicle ? 'TURUN' : 'NAIK MOBIL'}</span>
              </button>
            )}
          </div>

          {/* Left Movement Analog Pad */}
          <div
            ref={moveBaseRef}
            onPointerDown={handleMoveDown}
            onPointerMove={handleMoveMove}
            onPointerUp={handleMoveUp}
            onPointerCancel={handleMoveUp}
            className={`relative w-[116px] h-[116px] sm:w-[128px] sm:h-[128px] rounded-full border-2 flex items-center justify-center pointer-events-auto touch-none transition-colors ${
              moveActive
                ? 'bg-[#090d16]/80 border-cyan-400/80 shadow-[0_0_24px_rgba(34,211,238,0.22)]'
                : 'bg-[#090d16]/65 border-white/22'
            }`}
            aria-label="Analog Gerak"
          >
            {/* Subtle directional ticks */}
            <span className="absolute top-2 text-[9px] text-cyan-300/60 pointer-events-none">▲</span>
            <span className="absolute bottom-2 text-[9px] text-cyan-300/60 pointer-events-none">▼</span>
            <span className="absolute left-2.5 text-[9px] text-cyan-300/60 pointer-events-none">◀</span>
            <span className="absolute right-2.5 text-[9px] text-cyan-300/60 pointer-events-none">▶</span>
            <div className="w-16 h-16 rounded-full border border-white/10 pointer-events-none" />

            {/* Thumb Knob */}
            <div
              className={`absolute w-12 h-12 rounded-full border-2 flex items-center justify-center pointer-events-none ${
                moveActive
                  ? 'bg-cyan-400/95 border-white shadow-[0_0_16px_rgba(34,211,238,0.75)]'
                  : 'bg-cyan-500/75 border-cyan-200/80'
              }`}
              style={{
                transform: `translate3d(${moveKnob.x}px, ${moveKnob.y}px, 0)`,
              }}
            >
              <span className="w-3 h-3 rounded-full bg-white/80" />
            </div>
          </div>
        </div>

        {/* BOTTOM-RIGHT: Ergonomic Action Arc + Analog Tembakan (Fire + Camera Aim Stick) */}
        <div className="absolute bottom-4 right-4 sm:bottom-5 sm:right-6 flex items-end gap-2.5">
          {/* Action Column beside the Fire Analog (Jongkok, Dash, Reload, Refill) */}
          <div className="flex flex-col items-end gap-2 pointer-events-auto mb-1">
            <div className="flex items-center gap-2">
              {isAmmoLow && (
                <button
                  type="button"
                  disabled={!refillReady}
                  onPointerDown={instantTap(() => {
                    if (refillReady) onAmmoRefill();
                  })}
                  className={`touch-none relative overflow-hidden w-12 h-12 rounded-full border-2 flex flex-col items-center justify-center gap-0.5 font-display font-bold text-[8px] tracking-wider active:scale-95 transition-transform ${
                    refillReady
                      ? 'bg-emerald-500 text-slate-950 border-emerald-200 cursor-pointer shadow-lg shadow-emerald-500/30'
                      : 'bg-[#090d16]/80 text-slate-400 border-amber-400/30 cursor-not-allowed'
                  }`}
                >
                  <PackagePlus className="w-3.5 h-3.5 relative z-10" />
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
                onPointerDown={instantTap(onReload)}
                className="touch-none w-12 h-12 rounded-full bg-[#090d16]/85 active:bg-amber-500 active:text-slate-950 border-2 border-white/25 text-slate-100 flex flex-col items-center justify-center gap-0.5 font-display font-bold text-[8px] tracking-wider cursor-pointer active:scale-95 transition-transform"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>RELOAD</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!dashReady}
                onPointerDown={instantTap(() => {
                  if (dashReady) onDash();
                })}
                className={`touch-none relative overflow-hidden w-12 h-12 rounded-full border-2 flex flex-col items-center justify-center gap-0.5 font-display font-bold text-[9px] tracking-wider active:scale-95 transition-transform ${
                  dashReady
                    ? 'bg-cyan-500/25 active:bg-cyan-400 active:text-slate-950 text-cyan-300 border-cyan-400/75 cursor-pointer'
                    : 'bg-[#090d16]/75 text-slate-500 border-white/15 cursor-not-allowed'
                }`}
              >
                <Wind className="w-3.5 h-3.5 relative z-10" />
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
                onPointerDown={instantTap(() => {
                  if (!isCrouching && runToggled) {
                    setRunToggled(false);
                    onRunChange(false);
                  }
                  onToggleCrouch();
                })}
                className={`touch-none w-12 h-12 rounded-full border-2 flex flex-col items-center justify-center gap-0.5 font-display font-bold text-[8px] tracking-wider cursor-pointer active:scale-95 transition-transform ${
                  isCrouching
                    ? 'bg-emerald-500 text-slate-950 border-emerald-200'
                    : 'bg-[#090d16]/85 text-slate-100 border-white/25'
                }`}
              >
                <ArrowDown className="w-3.5 h-3.5" />
                <span>JONGKOK</span>
              </button>
            </div>
          </div>

          {/* Right Primary Column: BIDIK + LOMPAT above Analog Tembakan */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                type="button"
                onPointerDown={instantTap(onToggleAim)}
                className={`touch-none w-12 h-12 rounded-full border-2 flex flex-col items-center justify-center gap-0.5 font-display font-bold text-[8px] tracking-wider cursor-pointer active:scale-95 transition-transform ${
                  isAiming
                    ? 'bg-amber-500 text-slate-950 border-amber-200 shadow-lg shadow-amber-500/35'
                    : 'bg-[#090d16]/85 text-slate-100 border-white/25'
                }`}
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>BIDIK</span>
              </button>

              <button
                type="button"
                onPointerDown={instantTap(onJump)}
                className="touch-none w-12 h-12 rounded-full bg-[#090d16]/85 active:bg-amber-500 active:text-slate-950 border-2 border-white/25 text-slate-100 flex flex-col items-center justify-center gap-0.5 font-display font-bold text-[8px] tracking-wider cursor-pointer active:scale-95 transition-transform"
              >
                <ArrowUp className="w-3.5 h-3.5" />
                <span>LOMPAT</span>
              </button>
            </div>

            {/* Analog Tembakan — Hold & Drag to Aim Camera + Shoot Continuously */}
            <div
              ref={fireBaseRef}
              onPointerDown={handleFireDown}
              onPointerMove={handleFireMove}
              onPointerUp={handleFireUp}
              onPointerCancel={handleFireUp}
              className={`relative w-[116px] h-[116px] sm:w-[128px] sm:h-[128px] rounded-full border-2 flex items-center justify-center pointer-events-auto touch-none transition-colors ${
                fireActive
                  ? 'bg-red-950/65 border-amber-400 shadow-[0_0_28px_rgba(245,158,11,0.45)]'
                  : 'bg-[#090d16]/72 border-amber-400/50'
              }`}
              aria-label="Analog Tembakan & Arah Kamera"
            >
              {/* Inner Reticle Ring */}
              <div className="w-16 h-16 rounded-full border border-amber-400/25 pointer-events-none" />

              {/* Aim Direction Indicator Arrow on Rim */}
              {fireAngleDeg !== null && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ transform: `rotate(${fireAngleDeg}deg)` }}
                >
                  <span className="absolute right-1 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-amber-300 shadow-[0_0_8px_#fbbf24]" />
                </div>
              )}

              {/* Subtle Label */}
              <span className="absolute bottom-1.5 text-[8px] font-display font-bold tracking-widest text-amber-300/80 pointer-events-none">
                ARAH &amp; TEMBAK
              </span>

              {/* Fire Stick Center Knob */}
              <div
                className={`absolute w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center pointer-events-none ${
                  fireActive
                    ? 'bg-gradient-to-br from-amber-400 to-red-500 border-white text-slate-950 shadow-[0_0_18px_rgba(245,158,11,0.85)]'
                    : 'bg-amber-500/90 border-amber-200 text-slate-950'
                }`}
                style={{
                  transform: `translate3d(${fireKnob.x}px, ${fireKnob.y}px, 0)`,
                }}
              >
                <Target className="w-5 h-5" />
                <span className="font-display font-extrabold text-[8px] leading-none mt-0.5">
                  TEMBAK
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
