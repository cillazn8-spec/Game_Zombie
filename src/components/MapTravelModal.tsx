import React from 'react';
import { Building2, Car, CheckCircle2, Compass, Globe, MapPin, Navigation, Target, X } from 'lucide-react';
import { MAP_LAYOUTS } from '../shared/mapData';
import { getMissionsForMap, MAP_ORDER, MAPS, MapId } from '../types/game';

interface MapTravelModalProps {
  currentMap: MapId;
  visitedMaps: MapId[];
  mapMissionCompleted: Partial<Record<MapId, number>>;
  isMultiplayer: boolean;
  onTravel: (mapId: MapId) => void;
  onClose: () => void;
}

export const MapTravelModal: React.FC<MapTravelModalProps> = ({
  currentMap,
  visitedMaps,
  mapMissionCompleted,
  isMultiplayer,
  onTravel,
  onClose,
}) => {
  const visitedSet = new Set<MapId>(visitedMaps);
  const totalWorldMissions = MAP_ORDER.reduce((sum, id) => sum + getMissionsForMap(id).length, 0);
  const totalCompletedMissions = MAP_ORDER.reduce(
    (sum, id) => sum + Math.min(getMissionsForMap(id).length, mapMissionCompleted[id] ?? 0),
    0,
  );

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-3 sm:p-5 bg-[#04060b]/84 pointer-events-auto">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#0b101b] border border-cyan-400/35 rounded-xl overflow-hidden text-slate-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-5 sm:px-6 py-4 border-b border-white/10 bg-[#080d17]">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0 mt-0.5">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-lg sm:text-2xl font-bold tracking-wide text-white">
                  PETA DUNIA — 10 ZONA JELAJAH
                </h2>
                <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-400/40 text-[11px] font-mono-tabular font-bold text-emerald-300 whitespace-nowrap">
                  DIJELAJAHI {visitedSet.size} / {MAP_ORDER.length}
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-400/40 text-[11px] font-mono-tabular font-bold text-amber-300 whitespace-nowrap">
                  MISI {totalCompletedMissions} / {totalWorldMissions}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Setiap lokasi memiliki 8 misi unik dengan soal teka-teki SMP &amp; SMA. Progres misi, level, senjata, HP, dan skor tersimpan otomatis saat berpindah zona.
                {isMultiplayer ? ' (Mode Co-op: seluruh tim berpindah bersama)' : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup peta dunia"
            className="w-10 h-10 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-white/10 flex items-center justify-center text-slate-200 cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 10-Map Tactical Atlas Grid */}
        <div className="overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MAP_ORDER.map((mapId, index) => {
              const spec = MAPS[mapId];
              const layout = MAP_LAYOUTS[mapId];
              const mapMissions = getMissionsForMap(mapId);
              const doneCount = Math.min(mapMissions.length, mapMissionCompleted[mapId] ?? 0);
              const allDone = doneCount >= mapMissions.length;
              const isCurrent = mapId === currentMap;
              const isVisited = visitedSet.has(mapId);
              const sizeMeters = layout.halfSize * 2;
              const buildingCount = layout.buildings.length;
              const vehicleCount = layout.vehicles.length;
              const zoneNumber = String(index + 1).padStart(2, '0');
              const accentHex = `#${spec.rimColor.toString(16).padStart(6, '0')}`;

              return (
                <button
                  key={mapId}
                  type="button"
                  onClick={() => onTravel(mapId)}
                  className={`group text-left rounded-xl border p-3.5 transition-colors cursor-pointer flex flex-col justify-between gap-2.5 ${
                    isCurrent
                      ? 'bg-amber-500/15 border-amber-400 ring-1 ring-amber-400/40'
                      : 'bg-[#101726] border-white/12 hover:border-cyan-400/60 hover:bg-[#141f33]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-xs shrink-0 border border-white/25"
                          style={{ backgroundColor: accentHex }}
                        />
                        <span className="font-mono-tabular text-[11px] font-bold tracking-wider text-slate-400 whitespace-nowrap">
                          ZONA {zoneNumber}
                          {mapId === 'openworld' ? ' · OPEN WORLD' : ''}
                        </span>
                      </div>

                      {isCurrent ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-display font-bold text-[10px] tracking-wider whitespace-nowrap">
                          <MapPin className="w-3 h-3" />
                          LOKASI SAAT INI
                        </span>
                      ) : isVisited ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-400/35 text-emerald-300 font-display font-bold text-[10px] tracking-wider whitespace-nowrap">
                          <CheckCircle2 className="w-3 h-3" />
                          DIJELAJAHI
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-white/10 text-slate-300 font-display font-semibold text-[10px] tracking-wider whitespace-nowrap">
                          BELUM DIKUNJUNGI
                        </span>
                      )}
                    </div>

                    <div className="font-display text-base font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                      {spec.name}
                    </div>
                    <p className="text-xs text-slate-300 leading-snug mt-0.5 line-clamp-2">
                      {spec.description}
                    </p>
                  </div>

                  {/* Map Specs + Action Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
                    <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-slate-300 font-mono-tabular">
                      <span
                        className={`flex items-center gap-1 whitespace-nowrap font-bold ${
                          allDone ? 'text-emerald-300' : 'text-amber-300'
                        }`}
                      >
                        <Target className="w-3.5 h-3.5 shrink-0" />
                        Misi {doneCount}/{mapMissions.length}
                      </span>
                      <span className="flex items-center gap-1 whitespace-nowrap">
                        <Compass className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        {sizeMeters}m
                      </span>
                      <span className="flex items-center gap-1 whitespace-nowrap">
                        <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        {buildingCount} Gedung
                      </span>
                      <span className="flex items-center gap-1 whitespace-nowrap">
                        <Car className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        {vehicleCount} Mobil
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-display font-bold text-[11px] tracking-wider whitespace-nowrap ${
                        isCurrent
                          ? 'bg-slate-800 text-amber-300'
                          : 'bg-cyan-500 text-slate-950 group-hover:bg-cyan-400'
                      }`}
                    >
                      <Navigation className="w-3 h-3" />
                      {isCurrent ? 'TETAP DI SINI' : 'PINDAH PETA'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-3 border-t border-white/10 bg-[#080d17] text-xs text-slate-400">
          <span>
            Tips: Kamu juga bisa mendekati <strong className="text-cyan-300">Gerbang Lintas Peta</strong> biru di setiap map atau tekan <strong className="text-white">M</strong> kapan saja.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/15 text-slate-100 font-display font-bold text-xs tracking-wider cursor-pointer whitespace-nowrap"
          >
            TUTUP [M / ESC]
          </button>
        </div>
      </div>
    </div>
  );
};
