export type SharedMapId =
  | 'openworld'
  | 'metro'
  | 'industrial'
  | 'military'
  | 'harbor'
  | 'subway'
  | 'hospital'
  | 'forest'
  | 'desert'
  | 'snowbase';

export type SharedDifficultyId = 'easy' | 'normal' | 'hard' | 'nightmare';

export const DIFFICULTY_TUNING: Record<
  SharedDifficultyId,
  {
    hpMult: number;
    damageMult: number;
    speedMult: number;
    scoreMult: number;
    spawnMult: number;
  }
> = {
  easy: { hpMult: 0.72, damageMult: 0.7, speedMult: 0.88, scoreMult: 0.85, spawnMult: 0.85 },
  normal: { hpMult: 1.0, damageMult: 1.0, speedMult: 1.0, scoreMult: 1.0, spawnMult: 1.0 },
  hard: { hpMult: 1.35, damageMult: 1.3, speedMult: 1.12, scoreMult: 1.35, spawnMult: 1.2 },
  nightmare: { hpMult: 1.75, damageMult: 1.65, speedMult: 1.22, scoreMult: 1.8, spawnMult: 1.4 },
};

export interface SharedCollider {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  maxY: number;
}

export interface Point2D {
  x: number;
  z: number;
}

export interface DistrictZone {
  id: string;
  name: string;
  x: number;
  z: number;
  radius: number;
  color: string;
}

export type DoorSide = 'north' | 'south' | 'east' | 'west';

export interface EnterableBuildingDef {
  id: string;
  name: string;
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  doorSide: DoorSide;
  doorWidth: number;
  style: 'office' | 'warehouse' | 'bunker' | 'clinic';
  accentHex: number;
}

export interface InteriorZone {
  id: string;
  name: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  height: number;
}

export type DriveableVehicleKind =
  | 'police_suv'
  | 'industrial_truck'
  | 'military_humvee'
  | 'quarantine_van'
  | 'harbor_jeep';

export interface VehicleSpawnDef {
  id: string;
  name: string;
  kind: DriveableVehicleKind;
  x: number;
  z: number;
  rotY: number;
  colorHex: number;
  maxSpeed: number;
  accel: number;
}

export interface MissionPOIs {
  radioTower: Point2D;
  industrialDepot: Point2D;
  militaryOutpost: Point2D;
  collectibleSpots: Point2D[];
  bossPatrolSpots: Point2D[];
  helipad: Point2D;
}

export interface MapLayoutData {
  id: SharedMapId;
  halfSize: number;
  portalPos: Point2D;
  colliders: SharedCollider[];
  buildings: EnterableBuildingDef[];
  interiors: InteriorZone[];
  vehicles: VehicleSpawnDef[];
  barrels: Point2D[];
  spawnPoints: Point2D[];
  pickupSpots: Point2D[];
  districts: DistrictZone[];
  missionPOIs: MissionPOIs;
}

export const ARENA_HALF_SIZE = 42;
export const OPENWORLD_HALF_SIZE = 130;

const STANDARD_SPAWNS: Point2D[] = [
  { x: 0, z: -37 },
  { x: 0, z: 37 },
  { x: -37, z: 0 },
  { x: 37, z: 0 },
  { x: -34, z: -28 },
  { x: 34, z: -28 },
  { x: -34, z: 28 },
  { x: 34, z: 28 },
];

const STANDARD_PICKUPS: Point2D[] = [
  { x: 0, z: 0 },
  { x: -14, z: -14 },
  { x: 14, z: 14 },
  { x: -14, z: 14 },
  { x: 14, z: -14 },
  { x: 0, z: -24 },
  { x: 0, z: 24 },
];


function boxCollider(x: number, z: number, halfW: number, halfD: number, maxY = 10): SharedCollider {
  return {
    minX: x - halfW,
    maxX: x + halfW,
    minZ: z - halfD,
    maxZ: z + halfD,
    maxY,
  };
}

function buildEnterableBuildingColliders(
  defs: EnterableBuildingDef[],
): { colliders: SharedCollider[]; interiors: InteriorZone[] } {
  const colliders: SharedCollider[] = [];
  const interiors: InteriorZone[] = [];
  const wallT = 0.55;

  for (const b of defs) {
    const hw = b.w / 2;
    const hd = b.d / 2;
    const dw = Math.min(b.doorWidth, (b.doorSide === 'north' || b.doorSide === 'south' ? b.w : b.d) - 2.0);
    const halfDoor = dw / 2;

    // North wall (z = b.z - hd)
    if (b.doorSide === 'north') {
      const segW = Math.max(0.6, hw - halfDoor);
      colliders.push(
        boxCollider(b.x - halfDoor - segW / 2, b.z - hd + wallT / 2, segW / 2, wallT / 2, b.h),
        boxCollider(b.x + halfDoor + segW / 2, b.z - hd + wallT / 2, segW / 2, wallT / 2, b.h),
      );
    } else {
      colliders.push(boxCollider(b.x, b.z - hd + wallT / 2, hw, wallT / 2, b.h));
    }

    // South wall (z = b.z + hd)
    if (b.doorSide === 'south') {
      const segW = Math.max(0.6, hw - halfDoor);
      colliders.push(
        boxCollider(b.x - halfDoor - segW / 2, b.z + hd - wallT / 2, segW / 2, wallT / 2, b.h),
        boxCollider(b.x + halfDoor + segW / 2, b.z + hd - wallT / 2, segW / 2, wallT / 2, b.h),
      );
    } else {
      colliders.push(boxCollider(b.x, b.z + hd - wallT / 2, hw, wallT / 2, b.h));
    }

    // West wall (x = b.x - hw)
    if (b.doorSide === 'west') {
      const segD = Math.max(0.6, hd - halfDoor);
      colliders.push(
        boxCollider(b.x - hw + wallT / 2, b.z - halfDoor - segD / 2, wallT / 2, segD / 2, b.h),
        boxCollider(b.x - hw + wallT / 2, b.z + halfDoor + segD / 2, wallT / 2, segD / 2, b.h),
      );
    } else {
      colliders.push(boxCollider(b.x - hw + wallT / 2, b.z, wallT / 2, hd, b.h));
    }

    // East wall (x = b.x + hw)
    if (b.doorSide === 'east') {
      const segD = Math.max(0.6, hd - halfDoor);
      colliders.push(
        boxCollider(b.x + hw - wallT / 2, b.z - halfDoor - segD / 2, wallT / 2, segD / 2, b.h),
        boxCollider(b.x + hw - wallT / 2, b.z + halfDoor + segD / 2, wallT / 2, segD / 2, b.h),
      );
    } else {
      colliders.push(boxCollider(b.x + hw - wallT / 2, b.z, wallT / 2, hd, b.h));
    }

    interiors.push({
      id: b.id,
      name: b.name,
      minX: b.x - hw + 0.35,
      maxX: b.x + hw - 0.35,
      minZ: b.z - hd + 0.35,
      maxZ: b.z + hd - 0.35,
      height: b.h,
    });
  }

  return { colliders, interiors };
}

const OPENWORLD_BUILDINGS: EnterableBuildingDef[] = [
  // Central Plaza 4 buildings
  { id: 'ow_plaza_nw', name: 'Kantor Polisi Pusat', x: -22, z: -22, w: 11, d: 11, h: 14, doorSide: 'south', doorWidth: 3.2, style: 'office', accentHex: 0x38bdf8 },
  { id: 'ow_plaza_ne', name: 'Gedung Berita Metro', x: 22, z: -22, w: 12, d: 10, h: 16, doorSide: 'south', doorWidth: 3.2, style: 'office', accentHex: 0x22d3ee },
  { id: 'ow_plaza_sw', name: 'Apotek Kota', x: -22, z: 22, w: 10, d: 12, h: 13, doorSide: 'north', doorWidth: 3.2, style: 'clinic', accentHex: 0x10b981 },
  { id: 'ow_plaza_se', name: 'Menara Korporasi', x: 22, z: 22, w: 11, d: 11, h: 18, doorSide: 'north', doorWidth: 3.2, style: 'office', accentHex: 0xf59e0b },
  // 4 Inner-Ring Highway Towers
  { id: 'ow_ring_nw', name: 'Pos Jaga Barat Laut', x: -42, z: -38, w: 8.5, d: 8.5, h: 11, doorSide: 'east', doorWidth: 2.8, style: 'office', accentHex: 0x38bdf8 },
  { id: 'ow_ring_ne', name: 'Pos Jaga Timur Laut', x: 42, z: -38, w: 8.5, d: 8.5, h: 11, doorSide: 'west', doorWidth: 2.8, style: 'office', accentHex: 0x38bdf8 },
  { id: 'ow_ring_sw', name: 'Pos Jaga Barat Daya', x: -42, z: 38, w: 8.5, d: 8.5, h: 11, doorSide: 'east', doorWidth: 2.8, style: 'office', accentHex: 0x38bdf8 },
  { id: 'ow_ring_se', name: 'Pos Jaga Tenggara', x: 42, z: 38, w: 8.5, d: 8.5, h: 11, doorSide: 'west', doorWidth: 2.8, style: 'office', accentHex: 0x38bdf8 },
  // NW Industrial Warehouses
  { id: 'ow_ind_w1', name: 'Hanggar Kilang Utama', x: -88, z: -62, w: 13, d: 9, h: 9.5, doorSide: 'east', doorWidth: 3.4, style: 'warehouse', accentHex: 0x10b981 },
  { id: 'ow_ind_w2', name: 'Gudang Bahan Bakar', x: -56, z: -54, w: 11, d: 8, h: 8.5, doorSide: 'west', doorWidth: 3.2, style: 'warehouse', accentHex: 0xf59e0b },
  // NE Military Bunkers
  { id: 'ow_mil_b1', name: 'Bunker Komando Alpha', x: 56, z: -84, w: 11, d: 9, h: 5.5, doorSide: 'south', doorWidth: 3.2, style: 'bunker', accentHex: 0x60a5fa },
  { id: 'ow_mil_b2', name: 'Gudang Senjata Militer', x: 88, z: -84, w: 11, d: 9, h: 5.5, doorSide: 'south', doorWidth: 3.2, style: 'bunker', accentHex: 0x60a5fa },
  { id: 'ow_mil_b3', name: 'Lab Riset Antivirus', x: 88, z: -56, w: 11, d: 9, h: 5.5, doorSide: 'west', doorWidth: 3.2, style: 'bunker', accentHex: 0x22d3ee },
  // SW Quarantine Clinics
  { id: 'ow_sub_c1', name: 'Klinik Karantina Barat', x: -96, z: 74, w: 9, d: 9, h: 7.5, doorSide: 'east', doorWidth: 3.0, style: 'clinic', accentHex: 0xf43f5e },
  { id: 'ow_sub_c2', name: 'Loket Stasiun Selatan', x: -48, z: 76, w: 8.5, d: 8.5, h: 7.0, doorSide: 'west', doorWidth: 3.0, style: 'clinic', accentHex: 0xf43f5e },
  // SE Harbor Office
  { id: 'ow_harb_hq', name: 'Kantor Otoritas Pelabuhan', x: 96, z: 42, w: 9.5, d: 8.5, h: 6.5, doorSide: 'south', doorWidth: 3.0, style: 'office', accentHex: 0xf59e0b },
];

const METRO_BUILDINGS: EnterableBuildingDef[] = [
  { id: 'mt_nw', name: 'Kantor Polisi Metro', x: -22, z: -22, w: 11, d: 11, h: 14, doorSide: 'south', doorWidth: 3.2, style: 'office', accentHex: 0x38bdf8 },
  { id: 'mt_ne', name: 'Lobi Hotel Pusat', x: 22, z: -22, w: 12, d: 10, h: 16, doorSide: 'south', doorWidth: 3.2, style: 'office', accentHex: 0x22d3ee },
  { id: 'mt_sw', name: 'Klinik Darurat', x: -22, z: 22, w: 10, d: 12, h: 13, doorSide: 'north', doorWidth: 3.2, style: 'clinic', accentHex: 0x10b981 },
  { id: 'mt_se', name: 'Bank Nasional', x: 22, z: 22, w: 11, d: 11, h: 18, doorSide: 'north', doorWidth: 3.2, style: 'office', accentHex: 0xf59e0b },
];

const INDUSTRIAL_BUILDINGS: EnterableBuildingDef[] = [
  { id: 'in_ne', name: 'Hanggar Turbin', x: 22, z: -20, w: 12.5, d: 9, h: 9.5, doorSide: 'west', doorWidth: 3.2, style: 'warehouse', accentHex: 0x10b981 },
  { id: 'in_sw', name: 'Gudang Penyulingan', x: -22, z: 20, w: 12.5, d: 9, h: 9.5, doorSide: 'east', doorWidth: 3.2, style: 'warehouse', accentHex: 0xf59e0b },
];

const MILITARY_BUILDINGS: EnterableBuildingDef[] = [
  { id: 'ml_nw', name: 'Bunker Barat Laut', x: -22, z: -22, w: 11, d: 9, h: 5.5, doorSide: 'south', doorWidth: 3.2, style: 'bunker', accentHex: 0x60a5fa },
  { id: 'ml_ne', name: 'Bunker Timur Laut', x: 22, z: -22, w: 11, d: 9, h: 5.5, doorSide: 'south', doorWidth: 3.2, style: 'bunker', accentHex: 0x60a5fa },
  { id: 'ml_sw', name: 'Barak Barat Daya', x: -22, z: 22, w: 11, d: 9, h: 5.5, doorSide: 'north', doorWidth: 3.2, style: 'bunker', accentHex: 0x60a5fa },
  { id: 'ml_se', name: 'Ruang Senjata Tenggara', x: 22, z: 22, w: 11, d: 9, h: 5.5, doorSide: 'north', doorWidth: 3.2, style: 'bunker', accentHex: 0x60a5fa },
];

const HARBOR_BUILDINGS: EnterableBuildingDef[] = [
  { id: 'hb_customs', name: 'Kantor Bea Cukai', x: -28, z: 2, w: 9.5, d: 8.5, h: 7.0, doorSide: 'east', doorWidth: 3.0, style: 'office', accentHex: 0x06b6d4 },
  { id: 'hb_depot', name: 'Gudang Kontainer', x: 28, z: -2, w: 9.5, d: 8.5, h: 7.5, doorSide: 'west', doorWidth: 3.0, style: 'warehouse', accentHex: 0xf59e0b },
];

const SUBWAY_BUILDINGS: EnterableBuildingDef[] = [
  { id: 'sb_ctrl', name: 'Ruang Kontrol Stasiun', x: -30, z: -12, w: 8.5, d: 8.5, h: 5.5, doorSide: 'east', doorWidth: 3.0, style: 'bunker', accentHex: 0x22d3ee },
  { id: 'sb_sec', name: 'Pos Keamanan Rel', x: 30, z: 12, w: 8.5, d: 8.5, h: 5.5, doorSide: 'west', doorWidth: 3.0, style: 'clinic', accentHex: 0xf43f5e },
];

const HOSPITAL_BUILDINGS: EnterableBuildingDef[] = [
  { id: 'hs_igd', name: 'Gedung IGD Utama', x: -28, z: -26, w: 14, d: 11, h: 12, doorSide: 'south', doorWidth: 3.4, style: 'clinic', accentHex: 0x14b8a6 },
  { id: 'hs_vac', name: 'Klinik Vaksin Utara', x: 28, z: -26, w: 13, d: 10, h: 11, doorSide: 'south', doorWidth: 3.2, style: 'clinic', accentHex: 0x22d3ee },
  { id: 'hs_pharm', name: 'Ruang Farmasi Barat', x: -32, z: 22, w: 11, d: 11, h: 9.5, doorSide: 'east', doorWidth: 3.2, style: 'office', accentHex: 0x10b981 },
  { id: 'hs_viro', name: 'Lab Virologi Timur', x: 32, z: 22, w: 12, d: 11, h: 13, doorSide: 'west', doorWidth: 3.2, style: 'clinic', accentHex: 0x38bdf8 },
  { id: 'hs_amb', name: 'Pos Ambulans Selatan', x: 0, z: 38, w: 12, d: 9, h: 7.5, doorSide: 'north', doorWidth: 3.4, style: 'office', accentHex: 0xf43f5e },
];

const FOREST_BUILDINGS: EnterableBuildingDef[] = [
  { id: 'fr_ranger', name: 'Kabin Penjaga Hutan', x: -24, z: -22, w: 10.5, d: 9, h: 6.5, doorSide: 'south', doorWidth: 3.0, style: 'office', accentHex: 0x22c55e },
  { id: 'fr_obs', name: 'Pos Observasi Utara', x: 26, z: -28, w: 10, d: 9, h: 7.5, doorSide: 'west', doorWidth: 3.0, style: 'bunker', accentHex: 0xf59e0b },
  { id: 'fr_mill', name: 'Gudang Kayu Barat', x: -34, z: 26, w: 13, d: 9.5, h: 8.5, doorSide: 'east', doorWidth: 3.4, style: 'warehouse', accentHex: 0xd97706 },
  { id: 'fr_lab', name: 'Pondok Penelitian Timur', x: 32, z: 24, w: 11, d: 9.5, h: 7.0, doorSide: 'north', doorWidth: 3.0, style: 'clinic', accentHex: 0x34d399 },
];

const DESERT_BUILDINGS: EnterableBuildingDef[] = [
  { id: 'ds_border', name: 'Pos Perbatasan Gurun', x: -28, z: -24, w: 11.5, d: 9.5, h: 6.8, doorSide: 'east', doorWidth: 3.2, style: 'bunker', accentHex: 0xf59e0b },
  { id: 'ds_garage', name: 'Bengkel Konvoi', x: 30, z: -22, w: 13, d: 10, h: 8.5, doorSide: 'south', doorWidth: 3.6, style: 'warehouse', accentHex: 0xea580c },
  { id: 'ds_radio', name: 'Bunker Radio Ngarai', x: -30, z: 28, w: 11, d: 9.5, h: 6.0, doorSide: 'north', doorWidth: 3.2, style: 'bunker', accentHex: 0xfbbf24 },
  { id: 'ds_water', name: 'Gudang Air Bersih', x: 28, z: 30, w: 11, d: 9, h: 7.5, doorSide: 'west', doorWidth: 3.2, style: 'warehouse', accentHex: 0x38bdf8 },
];

const SNOWBASE_BUILDINGS: EnterableBuildingDef[] = [
  { id: 'sn_dome', name: 'Kubah Riset Arktik', x: -28, z: -26, w: 12, d: 12, h: 9.5, doorSide: 'south', doorWidth: 3.4, style: 'clinic', accentHex: 0x38bdf8 },
  { id: 'sn_hangar', name: 'Hanggar Eskavator', x: 30, z: -24, w: 13.5, d: 10, h: 9.0, doorSide: 'west', doorWidth: 3.6, style: 'warehouse', accentHex: 0x22d3ee },
  { id: 'sn_comm', name: 'Pos Komunikasi Es', x: -30, z: 26, w: 10.5, d: 9.5, h: 6.5, doorSide: 'east', doorWidth: 3.2, style: 'bunker', accentHex: 0x60a5fa },
  { id: 'sn_med', name: 'Klinik Hipotermia', x: 28, z: 28, w: 11, d: 9.5, h: 7.5, doorSide: 'north', doorWidth: 3.2, style: 'clinic', accentHex: 0x34d399 },
];

const OW_BUILT = buildEnterableBuildingColliders(OPENWORLD_BUILDINGS);
const MT_BUILT = buildEnterableBuildingColliders(METRO_BUILDINGS);
const IN_BUILT = buildEnterableBuildingColliders(INDUSTRIAL_BUILDINGS);
const ML_BUILT = buildEnterableBuildingColliders(MILITARY_BUILDINGS);
const HB_BUILT = buildEnterableBuildingColliders(HARBOR_BUILDINGS);
const SB_BUILT = buildEnterableBuildingColliders(SUBWAY_BUILDINGS);
const HS_BUILT = buildEnterableBuildingColliders(HOSPITAL_BUILDINGS);
const FR_BUILT = buildEnterableBuildingColliders(FOREST_BUILDINGS);
const DS_BUILT = buildEnterableBuildingColliders(DESERT_BUILDINGS);
const SN_BUILT = buildEnterableBuildingColliders(SNOWBASE_BUILDINGS);

const EXPLORE_SPAWNS_58: Point2D[] = [
  { x: 0, z: -50 },
  { x: 0, z: 50 },
  { x: -50, z: 0 },
  { x: 50, z: 0 },
  { x: -46, z: -42 },
  { x: 46, z: -42 },
  { x: -46, z: 42 },
  { x: 46, z: 42 },
  { x: -20, z: -48 },
  { x: 20, z: 48 },
];

const EXPLORE_PICKUPS_58: Point2D[] = [
  { x: 0, z: 0 },
  { x: -18, z: -18 },
  { x: 18, z: 18 },
  { x: -18, z: 18 },
  { x: 18, z: -18 },
  { x: 0, z: -34 },
  { x: 0, z: 30 },
  { x: -38, z: 0 },
  { x: 38, z: 0 },
];

export const MAP_LAYOUTS: Record<SharedMapId, MapLayoutData> = {
  openworld: {
    id: 'openworld',
    halfSize: OPENWORLD_HALF_SIZE,
    portalPos: { x: -10, z: -10 },
    buildings: OPENWORLD_BUILDINGS,
    interiors: OW_BUILT.interiors,
    vehicles: [
      { id: 'veh_police', name: 'SUV Polisi R.P.D.', kind: 'police_suv', x: 7.5, z: 6.5, rotY: Math.PI, colorHex: 0x1e293b, maxSpeed: 24, accel: 20 },
      { id: 'veh_ind', name: 'Truk Tangki Kilang', kind: 'industrial_truck', x: -45, z: -70, rotY: Math.PI / 2, colorHex: 0x9a3412, maxSpeed: 21, accel: 16 },
      { id: 'veh_mil', name: 'Humvee Taktis', kind: 'military_humvee', x: 45, z: -70, rotY: -Math.PI / 2, colorHex: 0x3f4d3b, maxSpeed: 25, accel: 21 },
      { id: 'veh_sub', name: 'Van Karantina', kind: 'quarantine_van', x: -45, z: 66, rotY: Math.PI / 2, colorHex: 0xe2e8f0, maxSpeed: 22, accel: 18 },
      { id: 'veh_harb', name: 'Jip Pelabuhan', kind: 'harbor_jeep', x: 48, z: 72, rotY: -Math.PI / 2, colorHex: 0xb45309, maxSpeed: 24, accel: 20 },
    ],
    colliders: [
      ...OW_BUILT.colliders,
      // Radio Relay Tower base at (0, -31.5)
      boxCollider(0, -31.5, 2.2, 2.2, 16),
      // Central Avenue wrecked static props (non-driveable obstacles)
      boxCollider(-5.5, 16.5, 1.8, 2.2, 1.6),
      boxCollider(6.0, -14.5, 1.9, 2.2, 1.6),
      boxCollider(-32, -3.8, 2.2, 1.4, 1.6),
      boxCollider(32, 4.0, 2.2, 1.4, 1.6),

      // NW Industrial Silos & Pipe Racks
      boxCollider(-76, -78, 4.2, 4.2, 15),
      boxCollider(-60, -84, 3.5, 3.5, 13),
      boxCollider(-70, -56, 2.4, 4.2, 3),
      boxCollider(-84, -74, 4.0, 2.2, 3),

      // NE Military Radar Tower & Containers
      boxCollider(72, -92, 3.2, 3.2, 20),
      boxCollider(60, -64, 1.8, 4.2, 2.8),
      boxCollider(80, -70, 1.8, 4.2, 2.8),
      boxCollider(48, -52, 2.5, 2.5, 3),

      // SW Subway Train Cars
      boxCollider(-62, 60, 2.2, 9.5, 3.6),
      boxCollider(-62, 86, 2.2, 9.5, 3.6),
      boxCollider(-82, 64, 2.2, 9.5, 3.6),
      boxCollider(-82, 90, 2.2, 9.5, 3.6),

      // SE Dark Harbor Containers & Cranes
      boxCollider(54, 56, 4.5, 2.0, 5.5),
      boxCollider(54, 64, 4.5, 2.0, 3.0),
      boxCollider(96, 56, 2.0, 4.5, 5.5),
      boxCollider(54, 92, 4.5, 2.0, 5.5),
      boxCollider(102, 88, 2.2, 2.2, 18),
      boxCollider(46, 86, 2.2, 2.2, 18),

      // Highway Roadside Wrecked Props
      boxCollider(-5.5, -56, 1.8, 2.2, 1.6),
      boxCollider(5.5, 56, 1.8, 2.2, 1.6),
      boxCollider(-56, 5.5, 2.2, 1.8, 1.6),
      boxCollider(56, -5.5, 2.2, 1.8, 1.6),
    ],
    barrels: [
      { x: -9, z: 0 },
      { x: 9, z: 0 },
      { x: 0, z: -15 },
      { x: 0, z: 16 },
      // NW Industrial Fuel Depot barrels
      { x: -66, z: -68 },
      { x: -74, z: -66 },
      { x: -64, z: -76 },
      { x: -78, z: -70 },
      { x: -69, z: -60 },
      // NE Military barrels
      { x: 68, z: -68 },
      { x: 75, z: -76 },
      // SW Quarantine barrels
      { x: -72, z: 72 },
      { x: -56, z: 70 },
      // SE Harbor barrels
      { x: 62, z: 76 },
      { x: 88, z: 66 },
    ],
    spawnPoints: [
      { x: 0, z: -48 },
      { x: 0, z: 48 },
      { x: -48, z: 0 },
      { x: 48, z: 0 },
      { x: -70, z: -44 },
      { x: -96, z: -88 },
      { x: 70, z: -44 },
      { x: 96, z: -96 },
      { x: -70, z: 44 },
      { x: -102, z: 92 },
      { x: 64, z: 42 },
      { x: 102, z: 68 },
      { x: -108, z: 0 },
      { x: 108, z: 0 },
      { x: 0, z: -108 },
      { x: 0, z: 108 },
    ],
    pickupSpots: [
      { x: -12, z: 0 },
      { x: 12, z: 0 },
      { x: 0, z: -18 },
      { x: -22, z: -22 },
      { x: 22, z: 22 },
      { x: -68, z: -64 },
      { x: -88, z: -62 },
      { x: 70, z: -66 },
      { x: 88, z: -56 },
      { x: -72, z: 72 },
      { x: -96, z: 74 },
      { x: 68, z: 70 },
      { x: 96, z: 42 },
    ],
    districts: [
      { id: 'metro', name: 'Alun-Alun Kota', x: 0, z: 0, radius: 36, color: '#38bdf8' },
      { id: 'industrial', name: 'Kawasan Industri', x: -70, z: -70, radius: 42, color: '#10b981' },
      { id: 'military', name: 'Pangkalan Militer', x: 70, z: -70, radius: 42, color: '#60a5fa' },
      { id: 'subway', name: 'Stasiun Karantina', x: -70, z: 70, radius: 42, color: '#f43f5e' },
      { id: 'harbor', name: 'Pelabuhan Evakuasi', x: 76, z: 76, radius: 44, color: '#f59e0b' },
    ],
    missionPOIs: {
      radioTower: { x: 0, z: -26 },
      industrialDepot: { x: -70, z: -68 },
      militaryOutpost: { x: 70, z: -72 },
      collectibleSpots: [
        { x: 65, z: -74 },
        { x: 88, z: -56 }, // Inside Lab Riset Antivirus!
        { x: 56, z: -84 }, // Inside Bunker Komando Alpha!
      ],
      bossPatrolSpots: [
        { x: -72, z: 72 },
        { x: 24, z: 76 },
      ],
      helipad: { x: 78, z: 78 },
    },
  },

  metro: {
    id: 'metro',
    halfSize: ARENA_HALF_SIZE,
    portalPos: { x: 10, z: -10 },
    buildings: METRO_BUILDINGS,
    interiors: MT_BUILT.interiors,
    vehicles: [
      { id: 'mt_suv', name: 'SUV Patroli', kind: 'police_suv', x: -6.5, z: -6.5, rotY: 0, colorHex: 0x1e293b, maxSpeed: 20, accel: 18 },
    ],
    colliders: [
      ...MT_BUILT.colliders,
      boxCollider(-35, -18, 3.5, 4, 11),
      boxCollider(35, 18, 4, 3.5, 12),
      boxCollider(-18, 35, 4, 3.5, 10),
      boxCollider(18, -35, 3.5, 4, 13),
      boxCollider(-4.2, 13.5, 1.8, 2.2, 1.6),
      boxCollider(5.0, -16.5, 1.9, 2.2, 1.6),
      boxCollider(-15.5, -3.5, 2.2, 1.4, 1.6),
      boxCollider(16.0, 4.2, 2.2, 1.4, 1.6),
      boxCollider(-29.0, 6.0, 1.5, 2.2, 1.6),
      boxCollider(29.0, -6.5, 1.8, 2.2, 1.6),
    ],
    barrels: [
      { x: -8.5, z: 0 },
      { x: 8.5, z: 0 },
      { x: 0, z: -13 },
      { x: 0, z: 14.5 },
      { x: -20, z: -8 },
      { x: 20, z: 8 },
    ],
    spawnPoints: STANDARD_SPAWNS,
    pickupSpots: STANDARD_PICKUPS,
    districts: [{ id: 'metro', name: 'Kota Terbengkalai', x: 0, z: 0, radius: 42, color: '#38bdf8' }],
    missionPOIs: {
      radioTower: { x: 0, z: -24 },
      industrialDepot: { x: -20, z: -8 },
      militaryOutpost: { x: 22, z: -22 },
      collectibleSpots: [
        { x: -22, z: -22 }, // Kantor Polisi Metro
        { x: 22, z: -22 },  // Lobi Hotel Pusat
        { x: 22, z: 22 },   // Bank Nasional
      ],
      bossPatrolSpots: [
        { x: -14, z: 14 },
        { x: 14, z: 14 },
      ],
      helipad: { x: 0, z: 22 },
    },
  },

  industrial: {
    id: 'industrial',
    halfSize: ARENA_HALF_SIZE,
    portalPos: { x: 9, z: -9 },
    buildings: INDUSTRIAL_BUILDINGS,
    interiors: IN_BUILT.interiors,
    vehicles: [
      { id: 'in_truck', name: 'Truk Kilang', kind: 'industrial_truck', x: -7.5, z: -7.5, rotY: 0.6, colorHex: 0x9a3412, maxSpeed: 19, accel: 16 },
    ],
    colliders: [
      ...IN_BUILT.colliders,
      boxCollider(-20, -20, 4.2, 4.2, 14),
      boxCollider(-10, -24, 3.4, 3.4, 12),
      boxCollider(20, 20, 4.2, 4.2, 14),
      boxCollider(10, 24, 3.4, 3.4, 12),
      boxCollider(-14, 0, 2.5, 4.5, 3),
      boxCollider(14, 0, 2.5, 4.5, 3),
      boxCollider(0, -14, 4.0, 2.2, 2.5),
      boxCollider(0, 14, 4.0, 2.2, 2.5),
    ],
    barrels: [
      { x: -6, z: -6 },
      { x: 6, z: 6 },
      { x: -6, z: 6 },
      { x: 6, z: -6 },
      { x: -24, z: 0 },
      { x: 24, z: 0 },
    ],
    spawnPoints: STANDARD_SPAWNS,
    pickupSpots: STANDARD_PICKUPS,
    districts: [{ id: 'industrial', name: 'Kawasan Industri', x: 0, z: 0, radius: 42, color: '#10b981' }],
    missionPOIs: {
      radioTower: { x: 0, z: -26 },
      industrialDepot: { x: -6, z: -6 },
      militaryOutpost: { x: 22, z: -20 },
      collectibleSpots: [
        { x: 22, z: -20 },  // Hanggar Turbin
        { x: -22, z: 20 },  // Gudang Penyulingan
        { x: 0, z: 0 },     // Pelataran Pusat Kilang
      ],
      bossPatrolSpots: [
        { x: -24, z: 0 },
        { x: 24, z: 0 },
      ],
      helipad: { x: 0, z: 26 },
    },
  },

  military: {
    id: 'military',
    halfSize: ARENA_HALF_SIZE,
    portalPos: { x: -10, z: 10 },
    buildings: MILITARY_BUILDINGS,
    interiors: ML_BUILT.interiors,
    vehicles: [
      { id: 'ml_humvee', name: 'Humvee Militer', kind: 'military_humvee', x: 0, z: 26, rotY: Math.PI, colorHex: 0x3f4d3b, maxSpeed: 21, accel: 18 },
    ],
    colliders: [
      ...ML_BUILT.colliders,
      boxCollider(0, -28, 3.2, 3.2, 20),
      boxCollider(-12, -4, 1.8, 4.2, 2.8),
      boxCollider(12, 4, 1.8, 4.2, 2.8),
      boxCollider(0, 15, 4.2, 1.8, 2.8),
      boxCollider(-28, 4, 2.5, 2.5, 3),
      boxCollider(28, -4, 2.5, 2.5, 3),
    ],
    barrels: [
      { x: -7, z: -12 },
      { x: 7, z: 12 },
      { x: -16, z: 12 },
      { x: 16, z: -12 },
      { x: 0, z: -7 },
      { x: 0, z: 7 },
    ],
    spawnPoints: STANDARD_SPAWNS,
    pickupSpots: STANDARD_PICKUPS,
    districts: [{ id: 'military', name: 'Pangkalan Militer', x: 0, z: 0, radius: 42, color: '#60a5fa' }],
    missionPOIs: {
      radioTower: { x: 0, z: -21 },
      industrialDepot: { x: -16, z: 12 },
      militaryOutpost: { x: 22, z: -22 },
      collectibleSpots: [
        { x: -22, z: -22 }, // Bunker Barat Laut
        { x: 22, z: -22 },  // Bunker Timur Laut
        { x: 22, z: 22 },   // Ruang Senjata Tenggara
      ],
      bossPatrolSpots: [
        { x: -14, z: 12 },
        { x: 14, z: 12 },
      ],
      helipad: { x: 0, z: 22 },
    },
  },

  harbor: {
    id: 'harbor',
    halfSize: ARENA_HALF_SIZE,
    portalPos: { x: -10, z: -10 },
    buildings: HARBOR_BUILDINGS,
    interiors: HB_BUILT.interiors,
    vehicles: [
      { id: 'hb_jeep', name: 'Jip Dermaga', kind: 'harbor_jeep', x: 0, z: -24, rotY: 0, colorHex: 0xb45309, maxSpeed: 20, accel: 17 },
    ],
    colliders: [
      ...HB_BUILT.colliders,
      boxCollider(-18, -18, 4.5, 2.0, 5.5),
      boxCollider(-18, -12, 4.5, 2.0, 3.0),
      boxCollider(18, -18, 2.0, 4.5, 5.5),
      boxCollider(-18, 18, 2.0, 4.5, 5.5),
      boxCollider(18, 18, 4.5, 2.0, 5.5),
      boxCollider(18, 12, 4.5, 2.0, 3.0),
      boxCollider(-8, 6, 4.2, 1.8, 2.8),
      boxCollider(8, -6, 4.2, 1.8, 2.8),
      boxCollider(-30, -26, 2.2, 2.2, 18),
      boxCollider(30, 26, 2.2, 2.2, 18),
    ],
    barrels: [
      { x: 0, z: -10 },
      { x: 0, z: 10 },
      { x: -12, z: -2 },
      { x: 12, z: 2 },
      { x: -25, z: 10 },
      { x: 25, z: -10 },
    ],
    spawnPoints: STANDARD_SPAWNS,
    pickupSpots: STANDARD_PICKUPS,
    districts: [{ id: 'harbor', name: 'Pelabuhan Malam', x: 0, z: 0, radius: 42, color: '#06b6d4' }],
    missionPOIs: {
      radioTower: { x: 0, z: -22 },
      industrialDepot: { x: 12, z: 2 },
      militaryOutpost: { x: -28, z: 2 },
      collectibleSpots: [
        { x: -28, z: 2 },  // Kantor Bea Cukai
        { x: 28, z: -2 },  // Gudang Kontainer
        { x: 0, z: 18 },   // Dermaga Selatan
      ],
      bossPatrolSpots: [
        { x: -10, z: 22 },
        { x: 10, z: 22 },
      ],
      helipad: { x: 0, z: 24 },
    },
  },

  subway: {
    id: 'subway',
    halfSize: ARENA_HALF_SIZE,
    portalPos: { x: 0, z: -6 },
    buildings: SUBWAY_BUILDINGS,
    interiors: SB_BUILT.interiors,
    vehicles: [
      { id: 'sb_jeep', name: 'Jip Rel Taktis', kind: 'harbor_jeep', x: 0, z: 22, rotY: Math.PI, colorHex: 0x334155, maxSpeed: 19, accel: 16 },
    ],
    colliders: [
      ...SB_BUILT.colliders,
      boxCollider(-11, -18, 2.2, 9.5, 3.6),
      boxCollider(-11, 16, 2.2, 9.5, 3.6),
      boxCollider(11, -14, 2.2, 9.5, 3.6),
      boxCollider(11, 20, 2.2, 9.5, 3.6),
      boxCollider(-25, -25, 2.2, 2.2, 9),
      boxCollider(25, -25, 2.2, 2.2, 9),
      boxCollider(-25, 0, 2.2, 2.2, 9),
      boxCollider(25, 0, 2.2, 2.2, 9),
      boxCollider(-25, 25, 2.2, 2.2, 9),
      boxCollider(25, 25, 2.2, 2.2, 9),
    ],
    barrels: [
      { x: 0, z: -12 },
      { x: 0, z: 12 },
      { x: -19, z: -12 },
      { x: 19, z: 12 },
      { x: -19, z: 14 },
      { x: 19, z: -14 },
    ],
    spawnPoints: STANDARD_SPAWNS,
    pickupSpots: STANDARD_PICKUPS,
    districts: [{ id: 'subway', name: 'Stasiun Bawah Tanah', x: 0, z: 0, radius: 42, color: '#f43f5e' }],
    missionPOIs: {
      radioTower: { x: 0, z: -24 },
      industrialDepot: { x: 0, z: 12 },
      militaryOutpost: { x: -30, z: -12 },
      collectibleSpots: [
        { x: -30, z: -12 }, // Ruang Kontrol Stasiun
        { x: 30, z: 12 },   // Pos Keamanan Rel
        { x: 0, z: 24 },    // Peron Selatan
      ],
      bossPatrolSpots: [
        { x: -19, z: 0 },
        { x: 19, z: 0 },
      ],
      helipad: { x: 0, z: 25 },
    },
  },

  hospital: {
    id: 'hospital',
    halfSize: 58,
    portalPos: { x: 0, z: -14 },
    buildings: HOSPITAL_BUILDINGS,
    interiors: HS_BUILT.interiors,
    vehicles: [
      { id: 'hs_van', name: 'Ambulans Karantina', kind: 'quarantine_van', x: 10, z: 6, rotY: Math.PI, colorHex: 0xf1f5f9, maxSpeed: 23, accel: 19 },
      { id: 'hs_suv', name: 'SUV Pengawal Medis', kind: 'police_suv', x: -14, z: -6, rotY: Math.PI / 2, colorHex: 0x0f766e, maxSpeed: 24, accel: 20 },
    ],
    colliders: [
      ...HS_BUILT.colliders,
      // Courtyard triage tents & ambulance wrecks
      boxCollider(-14, 10, 2.2, 2.6, 2.2),
      boxCollider(14, -12, 2.2, 2.6, 2.2),
      boxCollider(-44, -6, 3.2, 2.2, 3.0),
      boxCollider(44, 6, 3.2, 2.2, 3.0),
      boxCollider(0, -40, 3.8, 2.2, 3.5),
    ],
    barrels: [
      { x: -10, z: 0 },
      { x: 10, z: -2 },
      { x: 0, z: -26 },
      { x: 0, z: 22 },
      { x: -28, z: 0 },
      { x: 28, z: 0 },
      { x: -18, z: 32 },
      { x: 18, z: -32 },
    ],
    spawnPoints: EXPLORE_SPAWNS_58,
    pickupSpots: EXPLORE_PICKUPS_58,
    districts: [
      { id: 'hs_courtyard', name: 'Halaman Triase Pusat', x: 0, z: 0, radius: 26, color: '#14b8a6' },
      { id: 'hs_igd_zone', name: 'Sayap IGD & Vaksin', x: 0, z: -34, radius: 30, color: '#22d3ee' },
      { id: 'hs_lab_zone', name: 'Kompleks Lab & Farmasi', x: 0, z: 30, radius: 30, color: '#38bdf8' },
    ],
    missionPOIs: {
      radioTower: { x: 0, z: -34 },
      industrialDepot: { x: -32, z: 22 },
      militaryOutpost: { x: 32, z: 22 },
      collectibleSpots: [
        { x: -28, z: -26 },
        { x: 28, z: -26 },
        { x: 32, z: 22 },
      ],
      bossPatrolSpots: [
        { x: -20, z: 32 },
        { x: 20, z: 32 },
      ],
      helipad: { x: 0, z: 0 },
    },
  },

  forest: {
    id: 'forest',
    halfSize: 64,
    portalPos: { x: -12, z: -12 },
    buildings: FOREST_BUILDINGS,
    interiors: FR_BUILT.interiors,
    vehicles: [
      { id: 'fr_jeep', name: 'Jip Penjelajah Hutan', kind: 'harbor_jeep', x: 9, z: 8, rotY: Math.PI, colorHex: 0x3f6212, maxSpeed: 24, accel: 20 },
      { id: 'fr_truck', name: 'Truk Kayu Hutan', kind: 'industrial_truck', x: -16, z: 28, rotY: Math.PI / 2, colorHex: 0x713f12, maxSpeed: 21, accel: 17 },
    ],
    colliders: [
      ...FR_BUILT.colliders,
      // Watchtower base, stacked logs, giant mossy boulders
      boxCollider(0, -34, 3.2, 3.2, 16),
      boxCollider(-16, -4, 3.4, 1.8, 2.2),
      boxCollider(18, 4, 3.4, 1.8, 2.2),
      boxCollider(-44, -38, 4.2, 4.2, 6),
      boxCollider(44, -40, 4.5, 4.5, 6),
      boxCollider(-44, 42, 4.0, 4.0, 6),
      boxCollider(44, 42, 4.2, 4.2, 6),
      boxCollider(0, 36, 3.5, 2.5, 3),
    ],
    barrels: [
      { x: -8, z: -14 },
      { x: 10, z: -12 },
      { x: -18, z: 14 },
      { x: 18, z: 16 },
      { x: 0, z: -26 },
      { x: -34, z: 6 },
      { x: 34, z: -6 },
      { x: 0, z: 26 },
    ],
    spawnPoints: EXPLORE_SPAWNS_58,
    pickupSpots: EXPLORE_PICKUPS_58,
    districts: [
      { id: 'fr_camp', name: 'Perkemahan Tengah Hutan', x: 0, z: 0, radius: 26, color: '#22c55e' },
      { id: 'fr_north', name: 'Menara Pantau Utara', x: 0, z: -38, radius: 32, color: '#84cc16' },
      { id: 'fr_south', name: 'Lembah Pinus Selatan', x: 0, z: 36, radius: 32, color: '#10b981' },
    ],
    missionPOIs: {
      radioTower: { x: 0, z: -30 },
      industrialDepot: { x: -34, z: 26 },
      militaryOutpost: { x: 26, z: -28 },
      collectibleSpots: [
        { x: -24, z: -22 },
        { x: 26, z: -28 },
        { x: 32, z: 24 },
      ],
      bossPatrolSpots: [
        { x: -26, z: 36 },
        { x: 26, z: 36 },
      ],
      helipad: { x: 0, z: 24 },
    },
  },

  desert: {
    id: 'desert',
    halfSize: 64,
    portalPos: { x: 12, z: -12 },
    buildings: DESERT_BUILDINGS,
    interiors: DS_BUILT.interiors,
    vehicles: [
      { id: 'ds_humvee', name: 'Humvee Gurun', kind: 'military_humvee', x: -10, z: 8, rotY: Math.PI, colorHex: 0xa16207, maxSpeed: 26, accel: 21 },
      { id: 'ds_truck', name: 'Truk Konvoi Pasir', kind: 'industrial_truck', x: 18, z: 24, rotY: -Math.PI / 2, colorHex: 0x9a3412, maxSpeed: 22, accel: 17 },
    ],
    colliders: [
      ...DS_BUILT.colliders,
      // Canyon rock spires, comms antenna, solar banks & convoy wrecks
      boxCollider(0, -36, 3.0, 3.0, 18),
      boxCollider(-16, 12, 3.6, 2.4, 3.5),
      boxCollider(16, -10, 3.6, 2.4, 3.5),
      boxCollider(-46, -42, 5.2, 5.2, 12),
      boxCollider(46, -42, 5.2, 5.2, 12),
      boxCollider(-46, 44, 5.0, 5.0, 12),
      boxCollider(46, 44, 5.0, 5.0, 12),
      boxCollider(0, 38, 4.5, 2.4, 2.8),
    ],
    barrels: [
      { x: -10, z: -10 },
      { x: 10, z: 10 },
      { x: -22, z: -6 },
      { x: 22, z: 6 },
      { x: 0, z: -24 },
      { x: 0, z: 24 },
      { x: -34, z: 12 },
      { x: 34, z: -12 },
    ],
    spawnPoints: EXPLORE_SPAWNS_58,
    pickupSpots: EXPLORE_PICKUPS_58,
    districts: [
      { id: 'ds_oasis', name: 'Persimpangan Ngarai', x: 0, z: 0, radius: 26, color: '#f59e0b' },
      { id: 'ds_north', name: 'Pos Konvoi Utara', x: 0, z: -36, radius: 32, color: '#ea580c' },
      { id: 'ds_south', name: 'Lembah Batu Merah', x: 0, z: 36, radius: 32, color: '#d97706' },
    ],
    missionPOIs: {
      radioTower: { x: 0, z: -30 },
      industrialDepot: { x: 30, z: -22 },
      militaryOutpost: { x: -28, z: -24 },
      collectibleSpots: [
        { x: -28, z: -24 },
        { x: 30, z: -22 },
        { x: -30, z: 28 },
      ],
      bossPatrolSpots: [
        { x: -24, z: 38 },
        { x: 24, z: 38 },
      ],
      helipad: { x: 0, z: 22 },
    },
  },

  snowbase: {
    id: 'snowbase',
    halfSize: 64,
    portalPos: { x: 0, z: -14 },
    buildings: SNOWBASE_BUILDINGS,
    interiors: SN_BUILT.interiors,
    vehicles: [
      { id: 'sn_jeep', name: 'Jip Salju Arktik', kind: 'harbor_jeep', x: -10, z: 8, rotY: Math.PI, colorHex: 0xe2e8f0, maxSpeed: 24, accel: 20 },
      { id: 'sn_humvee', name: 'Humvee Kutub', kind: 'military_humvee', x: 14, z: -10, rotY: -Math.PI / 2, colorHex: 0x38bdf8, maxSpeed: 25, accel: 20 },
    ],
    colliders: [
      ...SN_BUILT.colliders,
      // Cryo tanks, satellite radar, ice monoliths
      boxCollider(0, -36, 3.2, 3.2, 18),
      boxCollider(-16, -2, 2.8, 2.8, 7),
      boxCollider(16, 4, 2.8, 2.8, 7),
      boxCollider(-46, -42, 5.0, 5.0, 11),
      boxCollider(46, -42, 5.0, 5.0, 11),
      boxCollider(-46, 44, 5.0, 5.0, 11),
      boxCollider(46, 44, 5.0, 5.0, 11),
      boxCollider(0, 36, 3.8, 2.4, 3.2),
    ],
    barrels: [
      { x: -10, z: -12 },
      { x: 10, z: 12 },
      { x: -20, z: 12 },
      { x: 20, z: -12 },
      { x: 0, z: -26 },
      { x: 0, z: 24 },
      { x: -34, z: -6 },
      { x: 34, z: 6 },
    ],
    spawnPoints: EXPLORE_SPAWNS_58,
    pickupSpots: EXPLORE_PICKUPS_58,
    districts: [
      { id: 'sn_core', name: 'Lapangan Riset Kutub', x: 0, z: 0, radius: 26, color: '#38bdf8' },
      { id: 'sn_north', name: 'Sektor Kubah & Hanggar', x: 0, z: -36, radius: 32, color: '#22d3ee' },
      { id: 'sn_south', name: 'Gletser Selatan', x: 0, z: 36, radius: 32, color: '#60a5fa' },
    ],
    missionPOIs: {
      radioTower: { x: 0, z: -30 },
      industrialDepot: { x: 30, z: -24 },
      militaryOutpost: { x: -28, z: -26 },
      collectibleSpots: [
        { x: -28, z: -26 },
        { x: 30, z: -24 },
        { x: 28, z: 28 },
      ],
      bossPatrolSpots: [
        { x: -24, z: 36 },
        { x: 24, z: 36 },
      ],
      helipad: { x: 0, z: 22 },
    },
  },
};

export function getDistrictNameAt(mapId: SharedMapId, x: number, z: number): string {
  const layout = MAP_LAYOUTS[mapId];
  let bestName = layout.districts[0]?.name ?? 'Zona Terbuka';
  let bestDist = Infinity;
  for (const d of layout.districts) {
    const dist = Math.hypot(x - d.x, z - d.z);
    if (dist <= d.radius) return d.name;
    if (dist < bestDist) {
      bestDist = dist;
      bestName = d.name;
    }
  }
  return mapId === 'openworld' && bestDist > 48 ? 'Jalan Raya Lintas Sektor' : bestName;
}

export function getBuildingInteriorAt(mapId: SharedMapId, x: number, z: number): InteriorZone | null {
  const layout = MAP_LAYOUTS[mapId];
  for (const zone of layout.interiors) {
    if (x >= zone.minX && x <= zone.maxX && z >= zone.minZ && z <= zone.maxZ) {
      return zone;
    }
  }
  return null;
}

export function resolveCircleCollisionsShared(
  pos: { x: number; z: number },
  radius: number,
  colliders: SharedCollider[],
  barrels: Array<{ position: { x: number; z: number }; exploded: boolean }>,
  halfSize = ARENA_HALF_SIZE,
): void {
  const bound = halfSize - radius - 0.5;
  pos.x = Math.max(-bound, Math.min(bound, pos.x));
  pos.z = Math.max(-bound, Math.min(bound, pos.z));

  for (const c of colliders) {
    const closestX = Math.max(c.minX, Math.min(c.maxX, pos.x));
    const closestZ = Math.max(c.minZ, Math.min(c.maxZ, pos.z));
    const dx = pos.x - closestX;
    const dz = pos.z - closestZ;
    const distSq = dx * dx + dz * dz;

    if (distSq < radius * radius) {
      const dist = Math.sqrt(distSq);
      if (dist > 0.0001) {
        const overlap = radius - dist;
        pos.x += (dx / dist) * overlap;
        pos.z += (dz / dist) * overlap;
      } else {
        const penLeft = Math.abs(pos.x - c.minX);
        const penRight = Math.abs(c.maxX - pos.x);
        const penTop = Math.abs(pos.z - c.minZ);
        const penBottom = Math.abs(c.maxZ - pos.z);
        const m = Math.min(penLeft, penRight, penTop, penBottom);
        if (m === penLeft) pos.x = c.minX - radius;
        else if (m === penRight) pos.x = c.maxX + radius;
        else if (m === penTop) pos.z = c.minZ - radius;
        else pos.z = c.maxZ + radius;
      }
    }
  }

  for (const b of barrels) {
    if (b.exploded) continue;
    const dx = pos.x - b.position.x;
    const dz = pos.z - b.position.z;
    const minD = radius + 0.5;
    const dSq = dx * dx + dz * dz;
    if (dSq < minD * minD && dSq > 0.0001) {
      const d = Math.sqrt(dSq);
      const overlap = minD - d;
      pos.x += (dx / d) * overlap;
      pos.z += (dz / d) * overlap;
    }
  }
}

export type SharedZombieVariant = 'walker' | 'runner' | 'brute' | 'boss';
export type SharedZombieAppearance =
  | 'officer'
  | 'ribcage'
  | 'spiked'
  | 'mutant'
  | 'boss_tyrant'
  | 'boss_bioweapon'
  | 'boss_lady';

export const SHARED_BOSS_APPEARANCES: SharedZombieAppearance[] = [
  'boss_tyrant',
  'boss_bioweapon',
  'boss_lady',
];

const APPEARANCE_TO_VARIANT: Record<SharedZombieAppearance, SharedZombieVariant> = {
  officer: 'walker',
  ribcage: 'walker',
  spiked: 'runner',
  mutant: 'brute',
  boss_tyrant: 'boss',
  boss_bioweapon: 'boss',
  boss_lady: 'boss',
};

export function isBossAppearance(appearance: SharedZombieAppearance): boolean {
  return (
    appearance === 'boss_tyrant' ||
    appearance === 'boss_bioweapon' ||
    appearance === 'boss_lady'
  );
}

export function pickRandomBossType(): {
  appearance: SharedZombieAppearance;
  variant: SharedZombieVariant;
} {
  const appearance =
    SHARED_BOSS_APPEARANCES[Math.floor(Math.random() * SHARED_BOSS_APPEARANCES.length)];
  return {
    appearance,
    variant: 'boss',
  };
}

export function pickRandomZombieType(wave: number): {
  appearance: SharedZombieAppearance;
  variant: SharedZombieVariant;
} {
  const r = Math.random();
  const mutantChance = Math.min(0.3, 0.18 + (wave - 1) * 0.02);
  const spikedChance = Math.min(0.3, 0.24 + (wave - 1) * 0.015);
  const remaining = 1 - mutantChance - spikedChance;
  const officerChance = remaining * 0.5;

  let appearance: SharedZombieAppearance;
  if (r < officerChance) {
    appearance = 'officer';
  } else if (r < officerChance * 2) {
    appearance = 'ribcage';
  } else if (r < officerChance * 2 + spikedChance) {
    appearance = 'spiked';
  } else {
    appearance = 'mutant';
  }

  return {
    appearance,
    variant: APPEARANCE_TO_VARIANT[appearance],
  };
}

export function findRandomZombieSpawnPos(
  avoidPositions: Point2D[],
  colliders: SharedCollider[],
  barrels: Array<{ position: Point2D; exploded: boolean }>,
  fallbackSpawns: Point2D[],
  minPlayerDist = 12.5,
  halfSize = ARENA_HALF_SIZE,
  focusCenter?: Point2D,
  maxFocusDist = 48,
): Point2D {
  const safeBound = halfSize - 2.5;
  const pad = 1.05;

  for (let attempt = 0; attempt < 32; attempt++) {
    let x: number;
    let z: number;

    if (attempt < 22) {
      if (focusCenter) {
        const ang = Math.random() * Math.PI * 2;
        const r = minPlayerDist + 2 + Math.random() * Math.max(8, maxFocusDist - minPlayerDist - 2);
        x = Math.max(-safeBound, Math.min(safeBound, focusCenter.x + Math.cos(ang) * r));
        z = Math.max(-safeBound, Math.min(safeBound, focusCenter.z + Math.sin(ang) * r));
      } else {
        x = (Math.random() * 2 - 1) * safeBound;
        z = (Math.random() * 2 - 1) * safeBound;
      }
    } else {
      const base = fallbackSpawns[Math.floor(Math.random() * fallbackSpawns.length)];
      x = Math.max(-safeBound, Math.min(safeBound, base.x + (Math.random() - 0.5) * 10));
      z = Math.max(-safeBound, Math.min(safeBound, base.z + (Math.random() - 0.5) * 10));
    }

    let tooClose = false;
    for (const p of avoidPositions) {
      const dx = x - p.x;
      const dz = z - p.z;
      if (dx * dx + dz * dz < minPlayerDist * minPlayerDist) {
        tooClose = true;
        break;
      }
    }
    if (tooClose) continue;

    let blocked = false;
    for (const c of colliders) {
      if (x > c.minX - pad && x < c.maxX + pad && z > c.minZ - pad && z < c.maxZ + pad) {
        blocked = true;
        break;
      }
    }
    if (blocked) continue;

    for (const b of barrels) {
      if (b.exploded) continue;
      const dx = x - b.position.x;
      const dz = z - b.position.z;
      if (dx * dx + dz * dz < 2.2) {
        blocked = true;
        break;
      }
    }
    if (!blocked) {
      return { x, z };
    }
  }

  let best = fallbackSpawns[0] ?? { x: 0, z: -36 };
  let bestDistSq = -1;
  for (const sp of fallbackSpawns) {
    let minD = Infinity;
    for (const p of avoidPositions) {
      const d = (sp.x - p.x) ** 2 + (sp.z - p.z) ** 2;
      if (d < minD) minD = d;
    }
    if (minD > bestDistSq && minD >= minPlayerDist * minPlayerDist) {
      bestDistSq = minD;
      best = sp;
    }
  }
  return {
    x: Math.max(-safeBound, Math.min(safeBound, best.x + (Math.random() - 0.5) * 4)),
    z: Math.max(-safeBound, Math.min(safeBound, best.z + (Math.random() - 0.5) * 4)),
  };
}
