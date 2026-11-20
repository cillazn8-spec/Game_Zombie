import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocket, WebSocketServer } from 'ws';
import {
  DIFFICULTY_TUNING,
  findRandomZombieSpawnPos,
  MAP_LAYOUTS,
  pickRandomBossType,
  pickRandomZombieType,
  resolveCircleCollisionsShared,
  type SharedDifficultyId,
  type SharedMapId,
  type SharedZombieAppearance,
  type SharedZombieVariant,
} from './src/shared/mapData.ts';
import {
  getMissionsForMap,
  pickBossPuzzle,
  pickPuzzleForMission,
  WEATHER_ORDER,
  ZOMBIE_APPEARANCE_INFO,
  type ActiveMissionPuzzle,
  type MissionDef,
  type WeatherType,
} from './src/types/game.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type WeaponId = 'pistol' | 'smg' | 'shotgun' | 'rifle';
type ZombieVariant = SharedZombieVariant;
type ZombieAppearance = SharedZombieAppearance;
type ZombieSkillState = 'none' | 'windup' | 'active';
type CharacterId = 'raka' | 'sinta' | 'bima' | 'nadia' | 'arga';
type CharacterSkinId =
  | 'rpd_officer'
  | 'leather_agent'
  | 'stars_alpha'
  | 'ubcs_merc'
  | 'stars_beret'
  | 'red_biker'
  | 'crimson_spy';
type PickupType = 'medkit' | 'ammo' | 'weapon_smg' | 'weapon_shotgun' | 'weapon_rifle';

const ALL_MAP_IDS: SharedMapId[] = [
  'openworld',
  'metro',
  'industrial',
  'military',
  'harbor',
  'subway',
  'hospital',
  'forest',
  'desert',
  'snowbase',
];
const ARENA_ROTATION_SEQUENCE: SharedMapId[] = [
  'metro',
  'industrial',
  'military',
  'harbor',
  'subway',
  'hospital',
  'forest',
  'desert',
  'snowbase',
];
const DIFFICULTY_LIST: SharedDifficultyId[] = ['easy', 'normal', 'hard', 'nightmare'];

const CHARACTER_LIST: CharacterId[] = ['raka', 'sinta', 'bima', 'nadia', 'arga'];
const CHAR_GENDER: Record<CharacterId, 'Male' | 'Female'> = {
  raka: 'Male',
  sinta: 'Female',
  bima: 'Male',
  nadia: 'Female',
  arga: 'Male',
};
const CHAR_DEFAULT_SKIN: Record<CharacterId, CharacterSkinId> = {
  raka: 'rpd_officer',
  sinta: 'red_biker',
  bima: 'ubcs_merc',
  nadia: 'stars_beret',
  arga: 'leather_agent',
};
const SKIN_GENDER: Record<CharacterSkinId, 'Male' | 'Female'> = {
  rpd_officer: 'Male',
  leather_agent: 'Male',
  stars_alpha: 'Male',
  ubcs_merc: 'Male',
  stars_beret: 'Female',
  red_biker: 'Female',
  crimson_spy: 'Female',
};

function resolveServerSkin(characterId: CharacterId, preferredSkin: unknown): CharacterSkinId {
  const gender = CHAR_GENDER[characterId] ?? 'Male';
  if (typeof preferredSkin === 'string' && preferredSkin in SKIN_GENDER) {
    const skinId = preferredSkin as CharacterSkinId;
    if (SKIN_GENDER[skinId] === gender) {
      return skinId;
    }
  }
  return CHAR_DEFAULT_SKIN[characterId] ?? 'rpd_officer';
}

const PLAYER_COLORS = ['#22d3ee', '#fb7185', '#f59e0b', '#10b981', '#a855f7'];


function getRoomMissions(room: GameRoom): MissionDef[] {
  return getMissionsForMap(room.mapId);
}

interface ServerPlayer {
  id: string;
  ws: WebSocket;
  name: string;
  color: string;
  characterId: CharacterId;
  skinId: CharacterSkinId;
  isHost: boolean;
  x: number;
  y: number;
  z: number;
  yaw: number;
  hp: number;
  maxHp: number;
  level: number;
  xp: number;
  xpToNext: number;
  kills: number;
  headshots: number;
  score: number;
  weaponId: WeaponId;
  isMoving: boolean;
  isRunning: boolean;
  isCrouching: boolean;
  isDashing: boolean;
  alive: boolean;
}

interface ServerZombie {
  id: number;
  variant: ZombieVariant;
  appearance: ZombieAppearance;
  x: number;
  z: number;
  yaw: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  scoreValue: number;
  xpValue: number;
  radius: number;
  attackCooldown: number;
  skillCooldown: number;
  skillState: ZombieSkillState;
  skillTimer: number;
  skillDirX: number;
  skillDirZ: number;
  skillHitPlayers: Set<string>;
}

interface ServerBossProjectile {
  id: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vz: number;
  damage: number;
  life: number;
}

interface ServerPickup {
  id: number;
  type: PickupType;
  x: number;
  z: number;
}

interface ServerBarrel {
  id: number;
  position: { x: number; z: number };
  exploded: boolean;
  respawnTimer: number;
}

interface ServerIntelItem {
  id: number;
  x: number;
  z: number;
}

interface ServerVehicle {
  id: string;
  x: number;
  z: number;
  yaw: number;
  speed: number;
  driverId: string | null;
}

interface GameRoom {
  code: string;
  difficulty: SharedDifficultyId;
  mapId: SharedMapId;
  autoRotateMaps: boolean;
  started: boolean;
  gameOver: boolean;
  victory: boolean;
  freeRoamMode: boolean;
  wave: number;
  zombiesToSpawn: number;
  bossesToSpawn: number;
  bossSpawnTimer: number;
  spawnTimer: number;
  waveBreakTimer: number;
  nextEntityId: number;
  totalKills: number;
  bossKills: number;
  players: Map<string, ServerPlayer>;
  zombies: ServerZombie[];
  bossProjectiles: ServerBossProjectile[];
  pickups: ServerPickup[];
  barrels: ServerBarrel[];
  intelItems: ServerIntelItem[];
  vehicles: ServerVehicle[];
  dayCount: number;
  timeOfDay: number;
  weather: WeatherType;
  weatherTimer: number;
  missionIndex: number;
  missionProgressValue: number;
  missionCompletedAll: boolean;
  mapMissionStates: Partial<Record<SharedMapId, { index: number; progress: number; completedAll: boolean }>>;
  pendingPuzzle: ActiveMissionPuzzle | null;
}

const rooms = new Map<string, GameRoom>();
const clientToRoom = new Map<WebSocket, { roomCode: string; playerId: string }>();

function makeRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function sendJson(ws: WebSocket, payload: unknown): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function broadcastRoom(room: GameRoom, payload: unknown, excludeId?: string): void {
  const raw = JSON.stringify(payload);
  for (const p of room.players.values()) {
    if (excludeId && p.id === excludeId) continue;
    if (p.ws.readyState === WebSocket.OPEN) {
      p.ws.send(raw);
    }
  }
}

function buildBarrelsForMap(mapId: SharedMapId): ServerBarrel[] {
  return MAP_LAYOUTS[mapId].barrels.map((b, idx) => ({
    id: idx,
    position: { x: b.x, z: b.z },
    exploded: false,
    respawnTimer: 0,
  }));
}

function buildVehiclesForMap(mapId: SharedMapId): ServerVehicle[] {
  return MAP_LAYOUTS[mapId].vehicles.map((v) => ({
    id: v.id,
    x: v.x,
    z: v.z,
    yaw: v.rotY,
    speed: 0,
    driverId: null,
  }));
}

function releaseDriverFromVehicles(room: GameRoom, playerId: string): void {
  for (const v of room.vehicles) {
    if (v.driverId === playerId) {
      v.driverId = null;
      v.speed = 0;
    }
  }
}

function buildLobbyPayload(room: GameRoom) {
  return {
    type: 'room:lobby',
    roomCode: room.code,
    difficulty: room.difficulty,
    mapId: room.mapId,
    autoRotateMaps: room.autoRotateMaps,
    started: room.started,
    players: Array.from(room.players.values()).map((p) => ({
      id: p.id,
      name: p.name,
      color: p.color,
      characterId: p.characterId,
      skinId: p.skinId,
      isHost: p.isHost,
      alive: p.alive,
      hp: p.hp,
      maxHp: p.maxHp,
      kills: p.kills,
      score: p.score,
      level: p.level,
      weaponId: p.weaponId,
    })),
  };
}

function getObjectiveForRoom(room: GameRoom, def: MissionDef) {
  const pois = MAP_LAYOUTS[room.mapId].missionPOIs;
  if (def.metric === 'radio_zone') {
    return { x: pois.radioTower.x, z: pois.radioTower.z, radius: 10, label: 'ZONA SINYAL RADIO', color: '#38bdf8' };
  }
  if (def.metric === 'barrels') {
    return { x: pois.industrialDepot.x, z: pois.industrialDepot.z, radius: 14, label: 'TARGET BARREL', color: '#f97316' };
  }
  if (def.metric === 'collect_intel') {
    const first = room.intelItems[0] ?? pois.militaryOutpost;
    return { x: first.x, z: first.z, radius: 12, label: 'KOPER DATA / SAMPEL', color: '#22d3ee' };
  }
  if (def.metric === 'bosses') {
    const activeBoss = room.zombies.find((z) => z.variant === 'boss' && z.hp > 0);
    const pt = activeBoss ?? pois.bossPatrolSpots[0];
    return { x: pt.x, z: pt.z, radius: 18, label: 'SEKTOR BOS MUTAN', color: '#ef4444' };
  }
  if (def.metric === 'hold_helipad') {
    return { x: pois.helipad.x, z: pois.helipad.z, radius: 9.5, label: 'ZONA EVAKUASI', color: '#f59e0b' };
  }
  if (def.metric === 'extract') {
    return { x: pois.helipad.x, z: pois.helipad.z, radius: 7.5, label: 'ZONA EKSTRAKSI', color: '#10b981' };
  }
  return null;
}

function buildMapMissionSummary(room: GameRoom): Partial<Record<SharedMapId, number>> {
  const summary: Partial<Record<SharedMapId, number>> = {};
  for (const [mId, st] of Object.entries(room.mapMissionStates)) {
    if (!st) continue;
    const len = getMissionsForMap(mId as SharedMapId).length;
    summary[mId as SharedMapId] = st.completedAll ? len : st.index;
  }
  const curLen = getRoomMissions(room).length;
  summary[room.mapId] = room.missionCompletedAll ? curLen : room.missionIndex;
  return summary;
}

function buildMissionPayload(room: GameRoom) {
  const list = getRoomMissions(room);
  const def = list[Math.min(room.missionIndex, list.length - 1)];
  const obj = !room.missionCompletedAll ? getObjectiveForRoom(room, def) : null;
  let inZone = false;
  if (obj) {
    for (const p of room.players.values()) {
      if (p.alive && Math.hypot(p.x - obj.x, p.z - obj.z) <= obj.radius) {
        inZone = true;
        break;
      }
    }
  }
  return {
    index: room.missionIndex,
    totalCompleted: room.missionCompletedAll ? list.length : room.missionIndex,
    totalMissions: list.length,
    title: def.title,
    description: def.description,
    current: room.missionCompletedAll
      ? def.target
      : Number(Math.min(def.target, room.missionProgressValue).toFixed(1)),
    target: def.target,
    completedAll: room.missionCompletedAll,
    objectiveX: obj?.x,
    objectiveZ: obj?.z,
    objectiveRadius: obj?.radius,
    objectiveLabel: obj?.label,
    objectiveColor: obj?.color,
    inObjectiveZone: inZone,
  };
}

function spawnRoomZombieAt(
  room: GameRoom,
  x: number,
  z: number,
  variant: ZombieVariant,
  appearance: ZombieAppearance,
): void {
  const diff = DIFFICULTY_TUNING[room.difficulty];
  const waveScale = 1 + (room.wave - 1) * 0.14;
  const isBoss = variant === 'boss';
  const baseHp = isBoss
    ? appearance === 'boss_tyrant'
      ? 950
      : appearance === 'boss_bioweapon'
        ? 850
        : 820
    : appearance === 'mutant'
      ? 380
      : appearance === 'spiked'
        ? 78
        : appearance === 'ribcage'
          ? 84
          : 95;
  const maxHp = Math.round(baseHp * waveScale * diff.hpMult);
  const speed =
    ((appearance === 'boss_tyrant'
      ? 2.55
      : appearance === 'boss_bioweapon'
        ? 3.15
        : appearance === 'boss_lady'
          ? 2.9
          : appearance === 'spiked'
            ? 4.95
            : appearance === 'mutant'
              ? 2.45
              : appearance === 'ribcage'
                ? 3.75
                : 3.2) +
      Math.min(1.4, (room.wave - 1) * 0.12)) *
    diff.speedMult;
  const baseDmg =
    appearance === 'boss_bioweapon'
      ? 34
      : appearance === 'boss_tyrant'
        ? 32
        : appearance === 'boss_lady'
          ? 30
          : appearance === 'mutant'
            ? 24
            : appearance === 'spiked'
              ? 14
              : 13;
  const baseScore =
    appearance === 'boss_tyrant'
      ? 1000
      : appearance === 'boss_bioweapon'
        ? 950
        : appearance === 'boss_lady'
          ? 920
          : appearance === 'mutant'
            ? 360
            : appearance === 'spiked'
              ? 150
              : 100;

  room.zombies.push({
    id: room.nextEntityId++,
    variant,
    appearance,
    x,
    z,
    yaw: Math.random() * Math.PI * 2,
    hp: maxHp,
    maxHp,
    speed,
    damage: Math.round(baseDmg * diff.damageMult),
    scoreValue: Math.round(baseScore * diff.scoreMult),
    xpValue: isBoss
      ? appearance === 'boss_tyrant'
        ? 350
        : appearance === 'boss_bioweapon'
          ? 340
          : 330
      : appearance === 'mutant'
        ? 135
        : appearance === 'spiked'
          ? 52
          : 38,
    radius: isBoss
      ? appearance === 'boss_lady'
        ? 0.68
        : 0.74
      : appearance === 'mutant'
        ? 0.65
        : 0.45,
    attackCooldown: 0,
    skillCooldown: isBoss ? 2.8 + Math.random() * 1.4 : 0,
    skillState: 'none',
    skillTimer: 0,
    skillDirX: 0,
    skillDirZ: 1,
    skillHitPlayers: new Set<string>(),
  });
}

function onMissionEnterServer(room: GameRoom, def: MissionDef): void {
  const layout = MAP_LAYOUTS[room.mapId];
  const pois = layout.missionPOIs;

  if (def.metric === 'barrels') {
    for (const b of room.barrels) {
      b.exploded = false;
      b.respawnTimer = 0;
    }
    for (let i = 0; i < 4; i++) {
      const sp = findRandomZombieSpawnPos(
        Array.from(room.players.values()).map((p) => ({ x: p.x, z: p.z })),
        layout.colliders,
        room.barrels,
        layout.spawnPoints,
        10,
        layout.halfSize,
        pois.industrialDepot,
        24,
      );
      const { appearance, variant } = pickRandomZombieType(room.wave);
      spawnRoomZombieAt(room, sp.x, sp.z, variant, appearance);
    }
  } else if (def.metric === 'collect_intel') {
    const remaining = Math.max(1, def.target - Math.floor(room.missionProgressValue));
    room.intelItems = pois.collectibleSpots.slice(0, remaining).map((pt) => ({
      id: room.nextEntityId++,
      x: pt.x,
      z: pt.z,
    }));
    for (let i = 0; i < 4; i++) {
      const sp = findRandomZombieSpawnPos(
        Array.from(room.players.values()).map((p) => ({ x: p.x, z: p.z })),
        layout.colliders,
        room.barrels,
        layout.spawnPoints,
        10,
        layout.halfSize,
        pois.militaryOutpost,
        26,
      );
      const { appearance, variant } = pickRandomZombieType(room.wave + 1);
      spawnRoomZombieAt(room, sp.x, sp.z, variant, appearance);
    }
  } else if (def.metric === 'bosses') {
    const aliveBossCount = room.zombies.filter((z) => z.variant === 'boss' && z.hp > 0).length;
    const needed = Math.max(0, def.target - Math.floor(room.missionProgressValue) - aliveBossCount);
    for (let i = 0; i < needed; i++) {
      const spot = pois.bossPatrolSpots[i % pois.bossPatrolSpots.length];
      const { appearance, variant } = pickRandomBossType();
      spawnRoomZombieAt(room, spot.x, spot.z, variant, appearance);
      broadcastRoom(room, { type: 'boss:spawned', appearance });
    }
  } else if (def.metric === 'hold_helipad') {
    for (let i = 0; i < 6; i++) {
      const sp = findRandomZombieSpawnPos(
        Array.from(room.players.values()).map((p) => ({ x: p.x, z: p.z })),
        layout.colliders,
        room.barrels,
        layout.spawnPoints,
        16,
        layout.halfSize,
        pois.helipad,
        34,
      );
      const { appearance, variant } = pickRandomZombieType(room.wave + 2);
      spawnRoomZombieAt(room, sp.x, sp.z, variant, appearance);
    }
    const bossSpot = findRandomZombieSpawnPos(
      Array.from(room.players.values()).map((p) => ({ x: p.x, z: p.z })),
      layout.colliders,
      room.barrels,
      layout.spawnPoints,
      18,
      layout.halfSize,
      pois.helipad,
      36,
    );
    const { appearance, variant } = pickRandomBossType();
    spawnRoomZombieAt(room, bossSpot.x, bossSpot.z, variant, appearance);
    broadcastRoom(room, { type: 'boss:spawned', appearance });
  }
}

function startWaveOnServer(room: GameRoom, waveNum: number): void {
  room.wave = waveNum;
  const diff = DIFFICULTY_TUNING[room.difficulty];
  room.zombiesToSpawn = Math.max(
    4,
    Math.round((5 + waveNum * 3 + Math.max(0, room.players.size - 1) * 3) * diff.spawnMult),
  );
  room.bossesToSpawn = room.mapId === 'openworld' ? (waveNum >= 3 ? 1 : 0) : waveNum >= 7 ? 3 : waveNum >= 4 ? 2 : 1;
  room.bossSpawnTimer = 5.5;
  room.spawnTimer = 0.6;
  room.waveBreakTimer = 0;

  if (room.mapId !== 'openworld' && room.autoRotateMaps && waveNum > 1 && (waveNum - 1) % 2 === 0) {
    const idx = ARENA_ROTATION_SEQUENCE.indexOf(room.mapId);
    const nextMap = ARENA_ROTATION_SEQUENCE[(idx + 1) % ARENA_ROTATION_SEQUENCE.length];
    room.mapId = nextMap;
    room.barrels = buildBarrelsForMap(nextMap);
    room.vehicles = buildVehiclesForMap(nextMap);
    let pIdx = 0;
    for (const p of room.players.values()) {
      p.x = (pIdx - (room.players.size - 1) / 2) * 2.2;
      p.y = 0;
      p.z = 4;
      pIdx++;
    }
    broadcastRoom(room, { type: 'map:changed', mapId: nextMap, wave: waveNum });
  }

  const layout = MAP_LAYOUTS[room.mapId];
  if (room.pickups.length < 5) {
    const spot = layout.pickupSpots[waveNum % layout.pickupSpots.length];
    room.pickups.push({
      id: room.nextEntityId++,
      type: waveNum % 2 === 0 ? 'medkit' : 'ammo',
      x: spot.x,
      z: spot.z,
    });
  }

  advanceMission(room, 'wave', waveNum, true);
  broadcastRoom(room, { type: 'wave:started', wave: waveNum });
}

function awardPlayerXp(room: GameRoom, player: ServerPlayer, xpGain: number): void {
  player.xp += xpGain;
  while (player.xp >= player.xpToNext) {
    player.xp -= player.xpToNext;
    player.level += 1;
    player.xpToNext = Math.round(player.xpToNext * 1.35 + 40);
    player.maxHp += 5;
    player.hp = Math.min(player.maxHp, player.hp + 20);
    sendJson(player.ws, {
      type: 'player:levelup',
      level: player.level,
      maxHp: player.maxHp,
      hp: player.hp,
    });
  }
}

function finalizeMissionAfterPuzzle(room: GameRoom): void {
  const list = getRoomMissions(room);
  const def = list[room.missionIndex];
  if (!def) return;

  for (const p of room.players.values()) {
    p.score += def.rewardScore;
    awardPlayerXp(room, p, def.rewardXp);
  }
  broadcastRoom(room, {
    type: 'mission:completed',
    title: def.title,
    rewardXp: def.rewardXp,
    rewardScore: def.rewardScore,
  });
  if (room.missionIndex + 1 < list.length) {
    room.missionIndex += 1;
    room.missionProgressValue = 0;
    room.mapMissionStates[room.mapId] = {
      index: room.missionIndex,
      progress: 0,
      completedAll: false,
    };
    const nextDef = list[room.missionIndex];
    if (nextDef.metric === 'wave') {
      room.missionProgressValue = room.wave;
    }
    onMissionEnterServer(room, nextDef);
  } else {
    room.missionCompletedAll = true;
    room.intelItems = [];
    room.mapMissionStates[room.mapId] = {
      index: list.length,
      progress: def.target,
      completedAll: true,
    };
    if (room.mapId === 'openworld') {
      room.victory = true;
      broadcastRoom(room, { type: 'match:victory' });
    }
  }
}

function advanceMission(
  room: GameRoom,
  metric: MissionDef['metric'],
  amount: number,
  absolute = false,
): void {
  if (room.missionCompletedAll || room.pendingPuzzle) return;
  const list = getRoomMissions(room);
  const def = list[room.missionIndex];
  if (!def || def.metric !== metric) return;

  if (absolute) {
    room.missionProgressValue = Math.max(room.missionProgressValue, amount);
  } else {
    room.missionProgressValue += amount;
  }

  if (room.missionProgressValue >= def.target) {
    room.missionProgressValue = def.target;
    room.pendingPuzzle = {
      missionIndex: room.missionIndex,
      missionTitle: def.title,
      missionMetric: def.metric,
      puzzle: pickPuzzleForMission(room.missionIndex, room.wave + room.totalKills, room.mapId),
      wrongAttempts: 0,
      feedback: null,
    };
  }
}

function handlePuzzleAnswer(room: GameRoom, optionIndex: number): void {
  if (!room.pendingPuzzle) return;
  if (optionIndex === room.pendingPuzzle.puzzle.correctIndex) {
    const solved = room.pendingPuzzle;
    room.pendingPuzzle = null;

    if (solved.source === 'boss') {
      for (const p of room.players.values()) {
        if (!p.alive) continue;
        p.hp = Math.min(p.maxHp, p.hp + 45);
        p.score += 300;
        awardPlayerXp(room, p, 180);
      }
    } else {
      finalizeMissionAfterPuzzle(room);
      if (solved.bossName) {
        for (const p of room.players.values()) {
          if (!p.alive) continue;
          p.hp = Math.min(p.maxHp, p.hp + 45);
          p.score += 300;
          awardPlayerXp(room, p, 180);
        }
      }
    }
  } else {
    room.pendingPuzzle.wrongAttempts += 1;
    room.pendingPuzzle.feedback = 'Jawaban salah! Periksa petunjuk dan coba lagi.';
    broadcastRoom(room, {
      type: 'puzzle:wrong',
      feedback: room.pendingPuzzle.feedback,
      wrongAttempts: room.pendingPuzzle.wrongAttempts,
    });
  }
}

function startMatchInRoom(room: GameRoom): void {
  room.started = true;
  room.gameOver = false;
  room.victory = false;
  room.freeRoamMode = false;
  room.totalKills = 0;
  room.bossKills = 0;
  room.zombies = [];
  room.bossProjectiles = [];
  room.pickups = [];
  room.intelItems = [];
  room.barrels = buildBarrelsForMap(room.mapId);
  room.vehicles = buildVehiclesForMap(room.mapId);
  room.dayCount = 1;
  room.timeOfDay = 0.34;
  room.weather = 'clear';
  room.weatherTimer = 42;
  room.missionIndex = 0;
  room.missionProgressValue = 0;
  room.missionCompletedAll = false;
  room.mapMissionStates = {};
  room.pendingPuzzle = null;

  let idx = 0;
  for (const p of room.players.values()) {
    p.x = (idx - (room.players.size - 1) / 2) * 2.4;
    p.y = 0;
    p.z = 4;
    p.yaw = Math.PI;
    p.hp = 100;
    p.maxHp = 100;
    p.level = 1;
    p.xp = 0;
    p.xpToNext = 100;
    p.kills = 0;
    p.headshots = 0;
    p.score = 0;
    p.weaponId = 'pistol';
    p.alive = true;
    idx++;
  }

  room.pickups.push(
    { id: room.nextEntityId++, type: 'medkit', x: -12, z: 0 },
    { id: room.nextEntityId++, type: 'ammo', x: 12, z: 0 },
  );

  broadcastRoom(room, {
    type: 'match:started',
    difficulty: room.difficulty,
    mapId: room.mapId,
    autoRotateMaps: room.autoRotateMaps,
  });
  startWaveOnServer(room, 1);
}

function chooseDropFromKill(room: GameRoom, attacker: ServerPlayer, variant: ZombieVariant): PickupType | null {
  if (room.pickups.length >= 10) return null;

  if (variant === 'boss') {
    return attacker.hp < 75 ? 'medkit' : 'weapon_rifle';
  }

  // Guaranteed progression drops + random weapon drops
  if (room.totalKills === 2) return 'weapon_smg';
  if (room.totalKills === 6) return 'weapon_shotgun';
  if (room.totalKills === 11) return 'weapon_rifle';

  const roll = Math.random();
  if (roll < 0.32) {
    if (variant === 'brute') return 'weapon_rifle';
    const r = Math.random();
    if (r < 0.36) return 'weapon_smg';
    if (r < 0.72) return 'weapon_shotgun';
    return 'weapon_rifle';
  }
  if (roll < 0.52) {
    return attacker.hp < 65 && Math.random() < 0.65 ? 'medkit' : 'ammo';
  }
  return null;
}

function damageZombieInRoom(
  room: GameRoom,
  zombie: ServerZombie,
  damage: number,
  attacker: ServerPlayer,
  isHeadshot: boolean,
): void {
  if (zombie.hp <= 0) return;
  zombie.hp = Math.max(0, zombie.hp - damage);

  if (zombie.hp <= 0) {
    room.totalKills += 1;
    attacker.kills += 1;
    if (isHeadshot) attacker.headshots += 1;
    attacker.score += zombie.scoreValue + (isHeadshot ? 50 : 0);
    awardPlayerXp(room, attacker, zombie.xpValue + (isHeadshot ? 15 : 0));

    advanceMission(room, 'kills', 1);
    if (isHeadshot) advanceMission(room, 'headshots', 1);
    if (zombie.variant === 'brute' || zombie.variant === 'boss') advanceMission(room, 'brutes', 1);

    if (zombie.variant === 'boss') {
      room.bossKills += 1;
      advanceMission(room, 'bosses', 1);

      // Guaranteed 2 useful drops (high-tier weapon + medkit/ammo)
      const bossWeaponDrop: PickupType =
        room.bossKills === 1 ? 'weapon_smg' : room.bossKills === 2 ? 'weapon_shotgun' : 'weapon_rifle';
      const bossSupplyDrop: PickupType = attacker.hp < attacker.maxHp * 0.8 ? 'medkit' : 'ammo';
      room.pickups.push(
        { id: room.nextEntityId++, type: bossWeaponDrop, x: zombie.x - 1.0, z: zombie.z + 0.35 },
        { id: room.nextEntityId++, type: bossSupplyDrop, x: zombie.x + 1.0, z: zombie.z - 0.35 },
      );

      const bossName = ZOMBIE_APPEARANCE_INFO[zombie.appearance]?.name ?? 'Zombie Bos';
      const rewardPreview =
        'Senjata / Armor / Relik / Tempa Gratis + Ramuan HP & MP + 180 XP & Bonus Gold Tim';
      if (room.pendingPuzzle) {
        room.pendingPuzzle = {
          ...room.pendingPuzzle,
          bossName,
          rewardPreview,
        };
      } else {
        room.pendingPuzzle = {
          source: 'boss',
          bossName,
          rewardPreview,
          missionIndex: room.missionIndex,
          missionTitle: `Teka-Teki Hadiah Bos: ${bossName}`,
          missionMetric: 'bosses',
          puzzle: pickBossPuzzle(room.bossKills, room.wave + room.totalKills, room.mapId),
          wrongAttempts: 0,
          feedback: null,
        };
      }
    } else {
      const drop = chooseDropFromKill(room, attacker, zombie.variant);
      if (drop) {
        room.pickups.push({
          id: room.nextEntityId++,
          type: drop,
          x: zombie.x,
          z: zombie.z,
        });
      }
    }

    broadcastRoom(room, {
      type: 'zombie:killed',
      zombieId: zombie.id,
      x: zombie.x,
      z: zombie.z,
      attackerId: attacker.id,
      isHeadshot,
    });
  }
}

function tickRooms(dt: number): void {
  for (const room of rooms.values()) {
    if (!room.started || room.gameOver || room.victory) continue;

    const layout = MAP_LAYOUTS[room.mapId];
    const alivePlayers = Array.from(room.players.values()).filter((p) => p.alive);

    if (alivePlayers.length === 0) {
      room.gameOver = true;
      broadcastRoom(room, { type: 'match:gameover', wave: room.wave });
      continue;
    }

    for (const v of room.vehicles) {
      if (v.driverId) {
        const drv = room.players.get(v.driverId);
        if (!drv || !drv.alive) {
          v.driverId = null;
          v.speed = 0;
        }
      }
    }

    // Advance Day-Night & Weather cycle
    room.timeOfDay += dt / 150;
    if (room.timeOfDay >= 1) {
      room.timeOfDay -= 1;
      room.dayCount += 1;
    }
    room.weatherTimer -= dt;
    if (room.weatherTimer <= 0) {
      room.weatherTimer = 36 + Math.random() * 24;
      const pool = WEATHER_ORDER.filter((w) => w !== room.weather);
      room.weather = pool[Math.floor(Math.random() * pool.length)];
    }

    // Pause hostile simulation while players are solving a mission puzzle gate
    if (!room.pendingPuzzle) {

    // Spatial Mission Ticks across all 10 maps
    if (!room.missionCompletedAll) {
      const list = getRoomMissions(room);
      const activeDef = list[room.missionIndex];
      const pois = layout.missionPOIs;
      if (activeDef) {
        if (activeDef.metric === 'radio_zone') {
          const inZone = alivePlayers.some(
            (p) => Math.hypot(p.x - pois.radioTower.x, p.z - pois.radioTower.z) <= 10.0,
          );
          if (inZone) advanceMission(room, 'radio_zone', dt);
        } else if (activeDef.metric === 'collect_intel') {
          for (let k = room.intelItems.length - 1; k >= 0; k--) {
            const item = room.intelItems[k];
            const collector = alivePlayers.find(
              (p) => Math.hypot(p.x - item.x, p.z - item.z) <= 2.4,
            );
            if (collector) {
              room.intelItems.splice(k, 1);
              advanceMission(room, 'collect_intel', 1);
            }
          }
        } else if (activeDef.metric === 'hold_helipad') {
          const inZone = alivePlayers.some(
            (p) => Math.hypot(p.x - pois.helipad.x, p.z - pois.helipad.z) <= 9.5,
          );
          if (inZone) advanceMission(room, 'hold_helipad', dt);
        } else if (activeDef.metric === 'extract') {
          const extracted = alivePlayers.some(
            (p) => Math.hypot(p.x - pois.helipad.x, p.z - pois.helipad.z) <= 7.5,
          );
          if (extracted) {
            advanceMission(room, 'extract', 1);
            if (room.victory) continue;
          }
        }
      }
    }

    for (const b of room.barrels) {
      if (b.exploded) {
        b.respawnTimer -= dt;
        if (b.respawnTimer <= 0) b.exploded = false;
      }
    }

    const focusPlayer = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];

    if (room.bossesToSpawn > 0) {
      room.bossSpawnTimer -= dt;
      if (room.bossSpawnTimer <= 0 && room.zombies.length < 24) {
        const sp = findRandomZombieSpawnPos(
          alivePlayers.map((p) => ({ x: p.x, z: p.z })),
          layout.colliders,
          room.barrels,
          layout.spawnPoints,
          12.5,
          layout.halfSize,
          room.mapId === 'openworld' ? { x: focusPlayer.x, z: focusPlayer.z } : undefined,
          48,
        );
        const { appearance, variant } = pickRandomBossType();
        spawnRoomZombieAt(room, sp.x, sp.z, variant, appearance);
        room.bossesToSpawn--;
        room.bossSpawnTimer = 8.5;
        broadcastRoom(room, { type: 'boss:spawned', appearance });
      }
    }

    if (room.zombiesToSpawn > 0) {
      room.spawnTimer -= dt;
      if (room.spawnTimer <= 0 && room.zombies.length < 22) {
        const sp = findRandomZombieSpawnPos(
          alivePlayers.map((p) => ({ x: p.x, z: p.z })),
          layout.colliders,
          room.barrels,
          layout.spawnPoints,
          12.5,
          layout.halfSize,
          room.mapId === 'openworld' ? { x: focusPlayer.x, z: focusPlayer.z } : undefined,
          46,
        );
        const { appearance, variant } = pickRandomZombieType(room.wave);
        spawnRoomZombieAt(room, sp.x, sp.z, variant, appearance);
        room.zombiesToSpawn--;
        const baseDelay = Math.max(0.45, 1.45 - room.wave * 0.1);
        room.spawnTimer = baseDelay * (0.7 + Math.random() * 0.6);
      }
    } else if (room.bossesToSpawn <= 0 && room.zombies.length === 0 && room.waveBreakTimer <= 0) {
      room.waveBreakTimer = room.mapId === 'openworld' ? 2.0 : 3.2;
      for (const p of room.players.values()) p.score += room.wave * 150;
      broadcastRoom(room, { type: 'wave:cleared', wave: room.wave });
    }

    if (room.waveBreakTimer > 0) {
      room.waveBreakTimer -= dt;
      if (room.waveBreakTimer <= 0) startWaveOnServer(room, room.wave + 1);
    }

    for (let i = room.bossProjectiles.length - 1; i >= 0; i--) {
      const proj = room.bossProjectiles[i];
      proj.life -= dt;
      proj.x += proj.vx * dt;
      proj.z += proj.vz * dt;
      let removeProj =
        proj.life <= 0 ||
        Math.abs(proj.x) >= layout.halfSize ||
        Math.abs(proj.z) >= layout.halfSize;

      if (!removeProj) {
        for (const coll of layout.colliders) {
          if (
            coll.maxY >= 1.1 &&
            proj.x >= coll.minX - 0.28 &&
            proj.x <= coll.maxX + 0.28 &&
            proj.z >= coll.minZ - 0.28 &&
            proj.z <= coll.maxZ + 0.28
          ) {
            removeProj = true;
            break;
          }
        }
      }

      if (!removeProj) {
        for (const p of alivePlayers) {
          if (p.isDashing || p.y >= 1.45) continue;
          const dSq = (p.x - proj.x) ** 2 + (p.z - proj.z) ** 2;
          if (dSq <= 1.05 * 1.05) {
            p.hp = Math.max(0, p.hp - proj.damage);
            sendJson(p.ws, { type: 'player:hurt', hp: p.hp, damage: proj.damage });
            if (p.hp <= 0) {
              p.alive = false;
              broadcastRoom(room, {
                type: 'player:downed',
                playerId: p.id,
                name: p.name,
              });
            }
            removeProj = true;
            break;
          }
        }
      }

      if (removeProj) {
        room.bossProjectiles.splice(i, 1);
      }
    }

    const diff = DIFFICULTY_TUNING[room.difficulty];

    for (let i = room.zombies.length - 1; i >= 0; i--) {
      const z = room.zombies[i];
      if (z.hp <= 0) {
        room.zombies.splice(i, 1);
        continue;
      }

      if (z.attackCooldown > 0) z.attackCooldown -= dt;
      if (z.skillCooldown > 0 && z.skillState === 'none') z.skillCooldown -= dt;

      let nearest = alivePlayers[0];
      let bestDistSq = Infinity;
      for (const p of alivePlayers) {
        const dSq = (p.x - z.x) ** 2 + (p.z - z.z) ** 2;
        if (dSq < bestDistSq) {
          bestDistSq = dSq;
          nearest = p;
        }
      }

      const dist = Math.sqrt(bestDistSq);
      const dx = nearest.x - z.x;
      const dz = nearest.z - z.z;

      if (z.variant === 'boss' && z.skillState !== 'none') {
        z.skillTimer -= dt;
        if (z.skillState === 'windup') {
          if (dist > 0.01) {
            z.skillDirX = dx / dist;
            z.skillDirZ = dz / dist;
            z.yaw = Math.atan2(dx, dz);
          }
          if (z.skillTimer <= 0) {
            z.skillState = 'active';
            z.skillHitPlayers.clear();
            broadcastRoom(room, {
              type: 'boss:skill',
              zombieId: z.id,
              appearance: z.appearance,
              stage: 'execute',
              x: Number(z.x.toFixed(2)),
              z: Number(z.z.toFixed(2)),
              dirX: Number(z.skillDirX.toFixed(3)),
              dirZ: Number(z.skillDirZ.toFixed(3)),
            });

            if (z.appearance === 'boss_tyrant') {
              z.skillTimer = 0.45;
              const slamDamage = Math.round(38 * diff.damageMult);
              for (const p of alivePlayers) {
                if (p.isDashing || p.y >= 1.1) continue;
                const pd = Math.hypot(p.x - z.x, p.z - z.z);
                if (pd <= 5.6) {
                  p.hp = Math.max(0, p.hp - slamDamage);
                  sendJson(p.ws, { type: 'player:hurt', hp: p.hp, damage: slamDamage });
                  if (p.hp <= 0) {
                    p.alive = false;
                    broadcastRoom(room, {
                      type: 'player:downed',
                      playerId: p.id,
                      name: p.name,
                    });
                  }
                }
              }
            } else if (z.appearance === 'boss_bioweapon') {
              z.skillTimer = 0.55;
            } else {
              // boss_lady: 3 crimson blood-thorn orbs in fan spread
              z.skillTimer = 0.4;
              const baseAngle = Math.atan2(z.skillDirX, z.skillDirZ);
              const orbSpeed = 16.5;
              const orbDamage = Math.round(26 * diff.damageMult);
              for (const offset of [-0.22, 0, 0.22]) {
                const ang = baseAngle + offset;
                room.bossProjectiles.push({
                  id: room.nextEntityId++,
                  x: z.x + Math.sin(ang) * 1.1,
                  y: 1.3,
                  z: z.z + Math.cos(ang) * 1.1,
                  vx: Math.sin(ang) * orbSpeed,
                  vz: Math.cos(ang) * orbSpeed,
                  damage: orbDamage,
                  life: 2.8,
                });
              }
            }
          }
        } else if (z.skillState === 'active') {
          if (z.appearance === 'boss_bioweapon') {
            z.x += z.skillDirX * 13.5 * dt;
            z.z += z.skillDirZ * 13.5 * dt;
            const chargeDamage = Math.round(38 * diff.damageMult);
            for (const p of alivePlayers) {
              if (z.skillHitPlayers.has(p.id) || p.isDashing || p.y >= 1.1) continue;
              const pd = Math.hypot(p.x - z.x, p.z - z.z);
              if (pd <= 2.2) {
                z.skillHitPlayers.add(p.id);
                p.hp = Math.max(0, p.hp - chargeDamage);
                sendJson(p.ws, { type: 'player:hurt', hp: p.hp, damage: chargeDamage });
                if (p.hp <= 0) {
                  p.alive = false;
                  broadcastRoom(room, {
                    type: 'player:downed',
                    playerId: p.id,
                    name: p.name,
                  });
                }
                z.skillTimer = Math.min(z.skillTimer, 0.08);
              }
            }
          }
          if (z.skillTimer <= 0) {
            z.skillState = 'none';
            z.skillCooldown =
              z.appearance === 'boss_tyrant'
                ? 5.8
                : z.appearance === 'boss_bioweapon'
                  ? 5.2
                  : 5.0;
            z.attackCooldown = 0.7;
          }
        }
      } else {
        if (dist > 0.01) z.yaw = Math.atan2(dx, dz);

        let triggeredSkill = false;
        if (z.variant === 'boss' && z.skillCooldown <= 0) {
          const minSkillDist = z.appearance === 'boss_tyrant' ? 0 : 2.8;
          const maxSkillDist =
            z.appearance === 'boss_tyrant'
              ? 6.4
              : z.appearance === 'boss_bioweapon'
                ? 14.5
                : 18.0;
          if (dist >= minSkillDist && dist <= maxSkillDist) {
            triggeredSkill = true;
            z.skillState = 'windup';
            z.skillTimer =
              z.appearance === 'boss_tyrant'
                ? 0.75
                : z.appearance === 'boss_bioweapon'
                  ? 0.65
                  : 0.7;
            z.skillDirX = dist > 0.01 ? dx / dist : 0;
            z.skillDirZ = dist > 0.01 ? dz / dist : 1;
            broadcastRoom(room, {
              type: 'boss:skill',
              zombieId: z.id,
              appearance: z.appearance,
              stage: 'windup',
              x: Number(z.x.toFixed(2)),
              z: Number(z.z.toFixed(2)),
              dirX: Number(z.skillDirX.toFixed(3)),
              dirZ: Number(z.skillDirZ.toFixed(3)),
            });
          }
        }

        if (!triggeredSkill) {
          const attackRange = z.variant === 'boss' ? 2.25 : z.variant === 'brute' ? 1.95 : 1.55;
          if (dist > attackRange) {
            z.x += (dx / dist) * z.speed * dt;
            z.z += (dz / dist) * z.speed * dt;
          } else if (z.attackCooldown <= 0) {
            z.attackCooldown = 1.05;
            broadcastRoom(room, { type: 'zombie:attack', zombieId: z.id });
            if (!nearest.isDashing && nearest.y < 1.1) {
              nearest.hp = Math.max(0, nearest.hp - z.damage);
              sendJson(nearest.ws, { type: 'player:hurt', hp: nearest.hp, damage: z.damage });
              if (nearest.hp <= 0) {
                nearest.alive = false;
                broadcastRoom(room, {
                  type: 'player:downed',
                  playerId: nearest.id,
                  name: nearest.name,
                });
              }
            }
          }
        }
      }

      for (let j = i - 1; j >= 0; j--) {
        const o = room.zombies[j];
        const sx = z.x - o.x;
        const sz = z.z - o.z;
        const minSep = z.radius + o.radius + 0.15;
        const dSq = sx * sx + sz * sz;
        if (dSq < minSep * minSep && dSq > 0.0001) {
          const d = Math.sqrt(dSq);
          const push = (minSep - d) * 0.5;
          z.x += (sx / d) * push;
          z.z += (sz / d) * push;
          o.x -= (sx / d) * push;
          o.z -= (sz / d) * push;
        }
      }

      const zPos = { x: z.x, z: z.z };
      resolveCircleCollisionsShared(zPos, z.radius, layout.colliders, room.barrels, layout.halfSize);
      z.x = zPos.x;
      z.z = zPos.z;
    }
    } // end if (!room.pendingPuzzle)

    broadcastRoom(room, {
      type: 'room:snapshot',
      wave: room.wave,
      zombiesRemaining: room.zombies.length + room.zombiesToSpawn + room.bossesToSpawn,
      difficulty: room.difficulty,
      mapId: room.mapId,
      mission: buildMissionPayload(room),
      intelItems: room.intelItems,
      vehicles: room.vehicles.map((v) => ({
        id: v.id,
        x: Number(v.x.toFixed(2)),
        z: Number(v.z.toFixed(2)),
        yaw: Number(v.yaw.toFixed(3)),
        speed: Number(v.speed.toFixed(2)),
        driverId: v.driverId,
      })),
      dayCount: room.dayCount,
      timeOfDay: Number(room.timeOfDay.toFixed(4)),
      weather: room.weather,
      activePuzzle: room.pendingPuzzle,
      freeRoamMode: room.freeRoamMode,
      mapMissionCompleted: buildMapMissionSummary(room),
      players: Array.from(room.players.values()).map((p) => ({
        id: p.id,
        name: p.name,
        color: p.color,
        characterId: p.characterId,
        skinId: p.skinId,
        x: Number(p.x.toFixed(2)),
        y: Number(p.y.toFixed(2)),
        z: Number(p.z.toFixed(2)),
        yaw: Number(p.yaw.toFixed(3)),
        hp: p.hp,
        maxHp: p.maxHp,
        weaponId: p.weaponId,
        level: p.level,
        kills: p.kills,
        score: p.score,
        xp: p.xp,
        xpToNext: p.xpToNext,
        isMoving: p.isMoving,
        isRunning: p.isRunning,
        isCrouching: p.isCrouching,
        isDashing: p.isDashing,
        alive: p.alive,
      })),
      zombies: room.zombies.map((z) => ({
        id: z.id,
        variant: z.variant,
        appearance: z.appearance,
        x: Number(z.x.toFixed(2)),
        z: Number(z.z.toFixed(2)),
        yaw: Number(z.yaw.toFixed(2)),
        hp: z.hp,
        maxHp: z.maxHp,
        skillState: z.skillState,
        skillDirX: Number(z.skillDirX.toFixed(3)),
        skillDirZ: Number(z.skillDirZ.toFixed(3)),
      })),
      bossProjectiles: room.bossProjectiles.map((pr) => ({
        id: pr.id,
        x: Number(pr.x.toFixed(2)),
        y: Number(pr.y.toFixed(2)),
        z: Number(pr.z.toFixed(2)),
      })),
      pickups: room.pickups,
      barrels: room.barrels.map((b) => ({ id: b.id, exploded: b.exploded })),
    });
  }
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    ws.on('message', (raw) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(String(raw)) as Record<string, unknown>;
      } catch {
        return;
      }

      const type = String(msg.type || '');

      if (type === 'room:create') {
        const code = makeRoomCode();
        const playerId = `p_${Math.random().toString(36).slice(2, 8)}`;
        const name = String(msg.name || 'Survivor 1').slice(0, 16);
        const difficulty = (DIFFICULTY_LIST.includes(msg.difficulty as SharedDifficultyId)
          ? msg.difficulty
          : 'normal') as SharedDifficultyId;
        const mapId = (ALL_MAP_IDS.includes(msg.mapId as SharedMapId)
          ? msg.mapId
          : 'openworld') as SharedMapId;
        const characterId = (CHARACTER_LIST.includes(msg.characterId as CharacterId)
          ? msg.characterId
          : 'raka') as CharacterId;
        const skinId = resolveServerSkin(characterId, msg.skinId);
        const autoRotateMaps = Boolean(msg.autoRotateMaps ?? false);

        const player: ServerPlayer = {
          id: playerId,
          ws,
          name,
          color: PLAYER_COLORS[0],
          characterId,
          skinId,
          isHost: true,
          x: 0,
          y: 0,
          z: 4,
          yaw: Math.PI,
          hp: 100,
          maxHp: 100,
          level: 1,
          xp: 0,
          xpToNext: 100,
          kills: 0,
          headshots: 0,
          score: 0,
          weaponId: 'pistol',
          isMoving: false,
          isRunning: false,
          isCrouching: false,
          isDashing: false,
          alive: true,
        };

        const room: GameRoom = {
          code,
          difficulty,
          mapId,
          autoRotateMaps,
          started: false,
          gameOver: false,
          victory: false,
          freeRoamMode: false,
          wave: 1,
          zombiesToSpawn: 0,
          bossesToSpawn: 0,
          bossSpawnTimer: 0,
          spawnTimer: 0,
          waveBreakTimer: 0,
          nextEntityId: 1,
          totalKills: 0,
          bossKills: 0,
          players: new Map([[playerId, player]]),
          zombies: [],
          bossProjectiles: [],
          pickups: [],
          barrels: buildBarrelsForMap(mapId),
          intelItems: [],
          vehicles: buildVehiclesForMap(mapId),
          dayCount: 1,
          timeOfDay: 0.34,
          weather: 'clear',
          weatherTimer: 42,
          missionIndex: 0,
          missionProgressValue: 0,
          missionCompletedAll: false,
          mapMissionStates: {},
          pendingPuzzle: null,
        };

        rooms.set(code, room);
        clientToRoom.set(ws, { roomCode: code, playerId });
        sendJson(ws, { type: 'room:joined', roomCode: code, playerId, isHost: true });
        broadcastRoom(room, buildLobbyPayload(room));
        return;
      }

      if (type === 'room:join') {
        const code = String(msg.roomCode || '').trim().toUpperCase();
        const room = rooms.get(code);
        if (!room) {
          sendJson(ws, { type: 'room:error', message: `Ruang ${code} tidak ditemukan.` });
          return;
        }
        if (room.players.size >= 5) {
          sendJson(ws, { type: 'room:error', message: 'Ruang sudah penuh (maks 5 pemain).' });
          return;
        }

        const playerId = `p_${Math.random().toString(36).slice(2, 8)}`;
        const name = String(msg.name || `Survivor ${room.players.size + 1}`).slice(0, 16);
        const characterId = (CHARACTER_LIST.includes(msg.characterId as CharacterId)
          ? msg.characterId
          : 'sinta') as CharacterId;
        const skinId = resolveServerSkin(characterId, msg.skinId);
        const color = PLAYER_COLORS[room.players.size % PLAYER_COLORS.length];

        const player: ServerPlayer = {
          id: playerId,
          ws,
          name,
          color,
          characterId,
          skinId,
          isHost: false,
          x: (room.players.size - 1) * 2.2,
          y: 0,
          z: 4,
          yaw: Math.PI,
          hp: 100,
          maxHp: 100,
          level: 1,
          xp: 0,
          xpToNext: 100,
          kills: 0,
          headshots: 0,
          score: 0,
          weaponId: 'pistol',
          isMoving: false,
          isRunning: false,
          isCrouching: false,
          isDashing: false,
          alive: true,
        };

        room.players.set(playerId, player);
        clientToRoom.set(ws, { roomCode: code, playerId });
        sendJson(ws, { type: 'room:joined', roomCode: code, playerId, isHost: false });
        broadcastRoom(room, buildLobbyPayload(room));

        if (room.started && !room.gameOver) {
          sendJson(ws, {
            type: 'match:started',
            difficulty: room.difficulty,
            mapId: room.mapId,
            autoRotateMaps: room.autoRotateMaps,
          });
        }
        return;
      }

      const membership = clientToRoom.get(ws);
      if (!membership) return;
      const room = rooms.get(membership.roomCode);
      if (!room) return;
      const player = room.players.get(membership.playerId);
      if (!player) return;

      if (type === 'room:config' && player.isHost) {
        if (DIFFICULTY_LIST.includes(msg.difficulty as SharedDifficultyId)) {
          room.difficulty = msg.difficulty as SharedDifficultyId;
        }
        if (ALL_MAP_IDS.includes(msg.mapId as SharedMapId)) {
          room.mapId = msg.mapId as SharedMapId;
          room.barrels = buildBarrelsForMap(room.mapId);
          room.vehicles = buildVehiclesForMap(room.mapId);
        }
        if (typeof msg.autoRotateMaps === 'boolean') {
          room.autoRotateMaps = msg.autoRotateMaps;
        }
        broadcastRoom(room, buildLobbyPayload(room));
      } else if (type === 'room:character') {
        if (CHARACTER_LIST.includes(msg.characterId as CharacterId)) {
          player.characterId = msg.characterId as CharacterId;
          player.skinId = resolveServerSkin(player.characterId, msg.skinId ?? player.skinId);
          broadcastRoom(room, buildLobbyPayload(room));
        } else if (typeof msg.skinId === 'string') {
          player.skinId = resolveServerSkin(player.characterId, msg.skinId);
          broadcastRoom(room, buildLobbyPayload(room));
        }
      } else if (type === 'room:start' && player.isHost) {
        startMatchInRoom(room);
      } else if (type === 'room:freeroam' && player.isHost) {
        room.victory = false;
        room.freeRoamMode = true;
        for (const p of room.players.values()) {
          p.alive = true;
          p.hp = Math.max(p.hp, Math.round(p.maxHp * 0.7));
        }
        broadcastRoom(room, { type: 'match:freeroam' });
      } else if (type === 'player:move') {
        player.x = Number(msg.x) || 0;
        player.y = Number(msg.y) || 0;
        player.z = Number(msg.z) || 0;
        player.yaw = Number(msg.yaw) || 0;
        player.isMoving = Boolean(msg.isMoving);
        player.isRunning = Boolean(msg.isRunning);
        player.isCrouching = Boolean(msg.isCrouching);
        player.isDashing = Boolean(msg.isDashing);
        player.weaponId = (['pistol', 'smg', 'shotgun', 'rifle'].includes(String(msg.weaponId))
          ? msg.weaponId
          : player.weaponId) as WeaponId;
      } else if (type === 'player:shot') {
        broadcastRoom(
          room,
          {
            type: 'player:shot',
            playerId: player.id,
            weaponId: player.weaponId,
            start: msg.start,
            end: msg.end,
          },
          player.id,
        );
      } else if (type === 'player:hitZombie') {
        const zId = Number(msg.zombieId);
        const dmg = Math.min(350, Math.max(1, Number(msg.damage) || 35));
        const isHeadshot = Boolean(msg.isHeadshot);
        const z = room.zombies.find((item) => item.id === zId);
        if (z) damageZombieInRoom(room, z, dmg, player, isHeadshot);
      } else if (type === 'player:hitBarrel') {
        const bId = Number(msg.barrelId);
        const startBarrel = room.barrels[bId];
        if (startBarrel && !startBarrel.exploded) {
          startBarrel.exploded = true;
          startBarrel.respawnTimer = 26;
          const queue: ServerBarrel[] = [startBarrel];
          const blastRadius = 10.5;
          const chainRadius = 6.8;
          while (queue.length > 0) {
            const barrel = queue.shift()!;
            advanceMission(room, 'barrels', 1);
            broadcastRoom(room, {
              type: 'barrel:exploded',
              barrelId: barrel.id,
              x: barrel.position.x,
              z: barrel.position.z,
            });
            for (const z of room.zombies) {
              const dist = Math.hypot(z.x - barrel.position.x, z.z - barrel.position.z);
              if (dist <= blastRadius) {
                const falloff = 1 - dist / blastRadius;
                if (dist > 0.01) {
                  const knock = 2.4 * (0.35 + falloff);
                  z.x += ((z.x - barrel.position.x) / dist) * knock;
                  z.z += ((z.z - barrel.position.z) / dist) * knock;
                }
                damageZombieInRoom(room, z, Math.round(155 + 195 * falloff), player, true);
              }
            }
            for (const other of room.barrels) {
              if (!other.exploded) {
                const d = Math.hypot(
                  other.position.x - barrel.position.x,
                  other.position.z - barrel.position.z,
                );
                if (d <= chainRadius) {
                  other.exploded = true;
                  other.respawnTimer = 26;
                  queue.push(other);
                }
              }
            }
          }
        }
      } else if (type === 'player:pickup') {
        const pId = Number(msg.pickupId);
        const idx = room.pickups.findIndex((p) => p.id === pId);
        if (idx !== -1) {
          const item = room.pickups[idx];
          room.pickups.splice(idx, 1);
          if (item.type === 'medkit') {
            player.hp = Math.min(player.maxHp, player.hp + 35);
          }
          advanceMission(room, 'pickups', 1);
          sendJson(ws, {
            type: 'pickup:confirmed',
            pickupType: item.type,
            hp: player.hp,
          });
        }
      } else if (type === 'vehicle:enter') {
        const vid = String(msg.vehicleId || '');
        const veh = room.vehicles.find((v) => v.id === vid);
        if (veh && (!veh.driverId || veh.driverId === player.id) && player.alive) {
          releaseDriverFromVehicles(room, player.id);
          veh.driverId = player.id;
        }
      } else if (type === 'vehicle:exit') {
        releaseDriverFromVehicles(room, player.id);
        if (Number.isFinite(Number(msg.x))) player.x = Number(msg.x);
        if (Number.isFinite(Number(msg.z))) player.z = Number(msg.z);
      } else if (type === 'vehicle:drive') {
        const vid = String(msg.vehicleId || '');
        const veh = room.vehicles.find((v) => v.id === vid && v.driverId === player.id);
        if (veh && player.alive) {
          const half = MAP_LAYOUTS[room.mapId].halfSize - 1.5;
          veh.x = Math.max(-half, Math.min(half, Number(msg.x) || veh.x));
          veh.z = Math.max(-half, Math.min(half, Number(msg.z) || veh.z));
          veh.yaw = Number(msg.yaw) || veh.yaw;
          veh.speed = Number(msg.speed) || 0;
          player.x = veh.x;
          player.z = veh.z;
        }
      } else if (type === 'puzzle:answer') {
        handlePuzzleAnswer(room, Number(msg.optionIndex));
      } else if (type === 'map:travel') {
        const targetMap = msg.mapId as SharedMapId;
        if (room.started && !room.gameOver && ALL_MAP_IDS.includes(targetMap) && targetMap !== room.mapId) {
          room.mapMissionStates[room.mapId] = {
            index: room.missionIndex,
            progress: room.missionProgressValue,
            completedAll: room.missionCompletedAll,
          };
          room.mapId = targetMap;
          room.zombies = [];
          room.bossProjectiles = [];
          room.pickups = [];
          room.intelItems = [];
          room.pendingPuzzle = null;
          room.barrels = buildBarrelsForMap(targetMap);
          room.vehicles = buildVehiclesForMap(targetMap);
          const saved = room.mapMissionStates[targetMap];
          room.missionIndex = saved ? saved.index : 0;
          room.missionProgressValue = saved ? saved.progress : 0;
          room.missionCompletedAll = saved ? saved.completedAll : false;
          if (!room.missionCompletedAll) {
            const destList = getRoomMissions(room);
            const destDef = destList[Math.min(room.missionIndex, destList.length - 1)];
            if (destDef && (destDef.metric === 'collect_intel' || destDef.metric === 'bosses')) {
              onMissionEnterServer(room, destDef);
            }
          }
          let pIdx = 0;
          for (const p of room.players.values()) {
            p.x = (pIdx - (room.players.size - 1) / 2) * 2.2;
            p.y = 0;
            p.z = 4;
            pIdx++;
          }
          const diff = DIFFICULTY_TUNING[room.difficulty];
          room.zombiesToSpawn = Math.max(
            4,
            Math.round((5 + room.wave * 2 + Math.max(0, room.players.size - 1) * 2) * diff.spawnMult),
          );
          room.bossesToSpawn = targetMap === 'openworld' ? 0 : 1;
          room.spawnTimer = 1.0;
          room.bossSpawnTimer = 8.0;
          const layout = MAP_LAYOUTS[targetMap];
          if (layout.pickupSpots.length > 0) {
            room.pickups.push({
              id: room.nextEntityId++,
              type: 'medkit',
              x: layout.pickupSpots[0].x,
              z: layout.pickupSpots[0].z,
            });
          }
          broadcastRoom(room, { type: 'map:changed', mapId: targetMap, wave: room.wave });
          broadcastRoom(room, buildLobbyPayload(room));
        }
      } else if (type === 'room:leave') {
        cleanupClient(ws);
      }
    });

    ws.on('close', () => cleanupClient(ws));
  });

  function cleanupClient(ws: WebSocket) {
    const info = clientToRoom.get(ws);
    if (!info) return;
    clientToRoom.delete(ws);
    const room = rooms.get(info.roomCode);
    if (!room) return;
    releaseDriverFromVehicles(room, info.playerId);
    const leaving = room.players.get(info.playerId);
    room.players.delete(info.playerId);
    if (room.players.size === 0) {
      rooms.delete(room.code);
      return;
    }
    if (leaving?.isHost) {
      const nextHost = room.players.values().next().value;
      if (nextHost) nextHost.isHost = true;
    }
    broadcastRoom(room, buildLobbyPayload(room));
  }

  setInterval(() => tickRooms(0.05), 50);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Zombie Survival: Last Stand server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
