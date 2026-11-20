import React from 'react';
import { X } from 'lucide-react';
import {
  CameraViewMode,
  CHARACTER_ORDER,
  CHARACTERS,
  ControlMode,
  DIFFICULTIES,
  DIFFICULTY_ORDER,
  GameSettings,
  GraphicsQuality,
  MAP_ORDER,
  MAPS,
  WEATHER_MODE_LABELS,
  WeatherMode,
} from '../types/game';

interface SettingsModalProps {
  settings: GameSettings;
  onChange: (next: GameSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onChange,
  onClose,
}) => {
  const qualities: Array<{ value: GraphicsQuality; label: string }> = [
    { value: 'low', label: 'Ringan' },
    { value: 'medium', label: 'Seimbang' },
    { value: 'high', label: 'HD Ultra (Bloom)' },
  ];

  const controlModes: Array<{ value: ControlMode; label: string }> = [
    { value: 'auto', label: 'Otomatis' },
    { value: 'pc', label: 'PC Mouse' },
    { value: 'touch', label: 'Sentuh HP' },
  ];

  const cameraModes: Array<{ value: CameraViewMode; label: string }> = [
    { value: 'tps', label: 'Orang Ketiga (TPS)' },
    { value: 'fps', label: 'Langsung / FPS' },
  ];

  const weatherModes: WeatherMode[] = ['dynamic', 'clear', 'foggy', 'rain', 'storm'];

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-[#04060b]/82 pointer-events-auto">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#0b101b] border border-white/15 rounded-xl p-6 sm:p-7 text-slate-100">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-wide text-white">
              SETTINGS
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Pengaturan karakter, grafis, peta, audio, dan kontrol perangkat
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pengaturan"
            className="w-10 h-10 rounded-lg bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-slate-200 cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5 py-5">
          {/* Character Selection */}
          <div>
            <label className="block text-xs font-semibold tracking-wider text-slate-300 uppercase mb-2">
              Karakter Survivor (5 Male / Female)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {CHARACTER_ORDER.map((cId) => {
                const char = CHARACTERS[cId];
                const selected = settings.selectedCharacter === cId;
                return (
                  <button
                    key={cId}
                    type="button"
                    onClick={() => onChange({ ...settings, selectedCharacter: cId })}
                    className={`py-2 px-2 rounded-lg text-left border transition-colors cursor-pointer ${
                      selected
                        ? 'bg-cyan-500 text-slate-950 border-cyan-300 font-bold'
                        : 'bg-slate-900 text-slate-300 border-white/10 hover:border-white/25'
                    }`}
                  >
                    <div className="text-[10px] opacity-80">{char.gender}</div>
                    <div className="text-xs truncate">{char.name}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Default Map & Auto-Rotate */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold tracking-wider text-slate-300 uppercase">
                Peta Default
              </label>
              <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoRotateMaps}
                  onChange={(e) =>
                    onChange({ ...settings, autoRotateMaps: e.target.checked })
                  }
                  className="accent-amber-500"
                />
                Rotasi Peta Otomatis
              </label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {MAP_ORDER.map((mId) => (
                <button
                  key={mId}
                  type="button"
                  onClick={() => onChange({ ...settings, selectedMap: mId })}
                  className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer truncate ${
                    settings.selectedMap === mId
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-900 text-slate-300 border-white/10 hover:border-white/25'
                  }`}
                >
                  {MAPS[mId].name}
                </button>
              ))}
            </div>
          </div>

          {/* Default Difficulty */}
          <div>
            <label className="block text-xs font-semibold tracking-wider text-slate-300 uppercase mb-2">
              Level Kesulitan Default
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DIFFICULTY_ORDER.map((dId) => {
                const spec = DIFFICULTIES[dId];
                const isSel = settings.selectedDifficulty === dId;
                return (
                  <button
                    key={dId}
                    type="button"
                    onClick={() => onChange({ ...settings, selectedDifficulty: dId })}
                    className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer truncate ${
                      isSel
                        ? 'text-slate-950 border-white/60 font-bold'
                        : 'bg-slate-900 text-slate-300 border-white/10 hover:border-white/25'
                    }`}
                    style={isSel ? { backgroundColor: spec.accentColor } : undefined}
                  >
                    {spec.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Graphics Quality */}
          <div>
            <label className="block text-xs font-semibold tracking-wider text-slate-300 uppercase mb-2">
              Kualitas Grafis 3D
            </label>
            <div className="grid grid-cols-3 gap-2">
              {qualities.map((q) => (
                <button
                  key={q.value}
                  type="button"
                  onClick={() => onChange({ ...settings, quality: q.value })}
                  className={`py-2.5 px-3 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                    settings.quality === q.value
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-900 text-slate-300 border-white/10 hover:border-white/25'
                  }`}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          {/* Weather Climate Mode */}
          <div>
            <label className="block text-xs font-semibold tracking-wider text-slate-300 uppercase mb-2">
              Iklim Cuaca (Siklus Siang-Malam Aktif Otomatis)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {weatherModes.map((wm) => (
                <button
                  key={wm}
                  type="button"
                  onClick={() => onChange({ ...settings, weatherMode: wm })}
                  className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer truncate ${
                    settings.weatherMode === wm
                      ? 'bg-sky-400 text-slate-950 border-sky-300 font-bold'
                      : 'bg-slate-900 text-slate-300 border-white/10 hover:border-white/25'
                  }`}
                >
                  {WEATHER_MODE_LABELS[wm]}
                </button>
              ))}
            </div>
          </div>

          {/* Camera View Mode */}
          <div>
            <label className="block text-xs font-semibold tracking-wider text-slate-300 uppercase mb-2">
              Sudut Pandang Kamera Default (Tombol V saat Main)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {cameraModes.map((cm) => (
                <button
                  key={cm.value}
                  type="button"
                  onClick={() => onChange({ ...settings, cameraMode: cm.value })}
                  className={`py-2.5 px-3 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                    settings.cameraMode === cm.value
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                      : 'bg-slate-900 text-slate-300 border-white/10 hover:border-white/25'
                  }`}
                >
                  {cm.label}
                </button>
              ))}
            </div>
          </div>

          {/* Control Mode */}
          <div>
            <label className="block text-xs font-semibold tracking-wider text-slate-300 uppercase mb-2">
              Mode Kontrol
            </label>
            <div className="grid grid-cols-3 gap-2">
              {controlModes.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => onChange({ ...settings, controlMode: m.value })}
                  className={`py-2.5 px-3 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                    settings.controlMode === m.value
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                      : 'bg-slate-900 text-slate-300 border-white/10 hover:border-white/25'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* SFX Volume */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-semibold tracking-wider text-slate-300 uppercase">
                Volume Efek Suara
              </span>
              <span className="font-mono-tabular text-amber-400 font-bold">
                {Math.round(settings.sfxVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.sfxVolume}
              onChange={(e) =>
                onChange({ ...settings, sfxVolume: parseFloat(e.target.value) })
              }
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Music Volume */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-semibold tracking-wider text-slate-300 uppercase">
                Volume Musik Horor
              </span>
              <span className="font-mono-tabular text-amber-400 font-bold">
                {Math.round(settings.musicVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.musicVolume}
              onChange={(e) =>
                onChange({ ...settings, musicVolume: parseFloat(e.target.value) })
              }
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Camera Sensitivity */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-semibold tracking-wider text-slate-300 uppercase">
                Sensitivitas Kamera
              </span>
              <span className="font-mono-tabular text-cyan-400 font-bold">
                {settings.sensitivity.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min={0.4}
              max={2.0}
              step={0.1}
              value={settings.sensitivity}
              onChange={(e) =>
                onChange({ ...settings, sensitivity: parseFloat(e.target.value) })
              }
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-sm tracking-wider cursor-pointer whitespace-nowrap"
          >
            SIMPAN & TUTUP
          </button>
        </div>
      </div>
    </div>
  );
};
