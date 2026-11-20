export type GamePhase = 'intro' | 'menu' | 'lobby' | 'playing' | 'paused' | 'gameover' | 'victory';

export type GraphicsQuality = 'low' | 'medium' | 'high';

export type ControlMode = 'auto' | 'pc' | 'touch';

export type CameraViewMode = 'tps' | 'fps';

export type WeatherType = 'clear' | 'foggy' | 'rain' | 'storm';
export type WeatherMode = 'dynamic' | WeatherType;

export const WEATHER_ORDER: WeatherType[] = ['clear', 'foggy', 'rain', 'storm'];

export const WEATHER_LABELS: Record<WeatherType, string> = {
  clear: 'Cerah',
  foggy: 'Berkabut',
  rain: 'Hujan Deras',
  storm: 'Badai Petir',
};

export const WEATHER_MODE_LABELS: Record<WeatherMode, string> = {
  dynamic: 'Dinamis (Otomatis)',
  clear: 'Cerah',
  foggy: 'Berkabut',
  rain: 'Hujan Deras',
  storm: 'Badai Petir',
};

export function formatGameTime(timeOfDay: number): { timeString: string; dayPhaseLabel: string } {
  const norm = ((timeOfDay % 1) + 1) % 1;
  const totalMins = Math.floor(norm * 24 * 60);
  const hh = Math.floor(totalMins / 60) % 24;
  const mm = totalMins % 60;
  const timeString = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  let dayPhaseLabel = 'Malam';
  if (hh >= 5 && hh < 7) dayPhaseLabel = 'Fajar';
  else if (hh >= 7 && hh < 11) dayPhaseLabel = 'Pagi';
  else if (hh >= 11 && hh < 15) dayPhaseLabel = 'Siang';
  else if (hh >= 15 && hh < 18) dayPhaseLabel = 'Sore';
  else if (hh >= 18 && hh < 20) dayPhaseLabel = 'Senja';
  return { timeString, dayPhaseLabel };
}

export type DifficultyId = 'easy' | 'normal' | 'hard' | 'nightmare';

export interface DifficultySpec {
  id: DifficultyId;
  name: string;
  tagline: string;
  accentColor: string;
  description: string;
}

export const DIFFICULTY_ORDER: DifficultyId[] = ['easy', 'normal', 'hard', 'nightmare'];

export const DIFFICULTIES: Record<DifficultyId, DifficultySpec> = {
  easy: {
    id: 'easy',
    name: 'Mudah',
    tagline: 'Santai (-28% HP)',
    accentColor: '#34d399',
    description: 'Zombie lebih lambat, HP lebih rendah, dan kerusakan serangan lebih ringan untuk eksplorasi santai.',
  },
  normal: {
    id: 'normal',
    name: 'Normal',
    tagline: 'Standar 1.0x',
    accentColor: '#38bdf8',
    description: 'Keseimbangan tempur standar antara jumlah gelombang, ketahanan zombie, dan perolehan skor.',
  },
  hard: {
    id: 'hard',
    name: 'Sulit',
    tagline: 'Ganas (+35% HP)',
    accentColor: '#f59e0b',
    description: 'Zombie lebih cepat dan agresif dengan gerombolan lebih banyak serta bonus skor +35%.',
  },
  nightmare: {
    id: 'nightmare',
    name: 'Mimpi Buruk',
    tagline: 'Ekstrem (+75% HP)',
    accentColor: '#fb7185',
    description: 'Ujian bertahan hidup tersulit dengan zombie super kuat, spawn padat, dan bonus skor +80%.',
  },
};

export type ZombieVariant = 'walker' | 'runner' | 'brute' | 'boss';

export type ZombieSkillState = 'none' | 'windup' | 'active';

export type ZombieAppearance =
  | 'officer'
  | 'ribcage'
  | 'spiked'
  | 'mutant'
  | 'boss_tyrant'
  | 'boss_bioweapon'
  | 'boss_lady';

export const ZOMBIE_APPEARANCES: ZombieAppearance[] = [
  'officer',
  'ribcage',
  'spiked',
  'mutant',
];

export const ZOMBIE_BOSS_APPEARANCES: ZombieAppearance[] = [
  'boss_tyrant',
  'boss_bioweapon',
  'boss_lady',
];

export const ALL_ZOMBIE_APPEARANCES: ZombieAppearance[] = [
  ...ZOMBIE_APPEARANCES,
  ...ZOMBIE_BOSS_APPEARANCES,
];

export interface ZombieAppearanceInfo {
  id: ZombieAppearance;
  name: string;
  variant: ZombieVariant;
  imagePath: string;
  description: string;
}

export const ZOMBIE_APPEARANCE_INFO: Record<ZombieAppearance, ZombieAppearanceInfo> = {
  officer: {
    id: 'officer',
    name: 'Zombie Polisi',
    variant: 'walker',
    imagePath: '/assets/aistudio/zombie3_b81417a0.jpeg',
    description: 'Mantan aparat berseragam compang-camping dengan topi polisi dan kepala miring.',
  },
  ribcage: {
    id: 'ribcage',
    name: 'Zombie Kerangka',
    variant: 'walker',
    imagePath: '/assets/aistudio/zombie_60452499.jpeg',
    description: 'Zombie berjaket terbuka yang menampakkan tulang rusuk dan mata asimetris.',
  },
  spiked: {
    id: 'spiked',
    name: 'Mutant Berduri',
    variant: 'runner',
    imagePath: '/assets/aistudio/zombie1_bde209ed.jpeg',
    description: 'Mutasi cepat bertubuh gelap penuh duri tajam dan cakar panjang mematikan.',
  },
  mutant: {
    id: 'mutant',
    name: 'Brute Pucat',
    variant: 'brute',
    imagePath: '/assets/aistudio/zombie2_db8ea1c7.jpeg',
    description: 'Raksasa pucat bermata bara oranye dengan HP tebal (380+ HP) dan serangan berat.',
  },
  boss_tyrant: {
    id: 'boss_tyrant',
    name: 'Bos Tyrant Mantel',
    variant: 'boss',
    imagePath: '/assets/aistudio/zombie_bos1_65cc1254.jpeg',
    description: 'Bos raksasa bermantel kulit hitam dengan HP super tebal (950+ HP) dan pukulan penghancur.',
  },
  boss_bioweapon: {
    id: 'boss_bioweapon',
    name: 'Bos Lengan Mutan',
    variant: 'boss',
    imagePath: '/assets/aistudio/zombie_bos_2_e264b743.jpeg',
    description: 'Bos mutasi cepat bermata bara dengan lengan cakar raksasa penuh duri (850+ HP).',
  },
  boss_lady: {
    id: 'boss_lady',
    name: 'Bos Bangsawan Pucat',
    variant: 'boss',
    imagePath: '/assets/aistudio/zombiebos3_0f4a8117.jpeg',
    description: 'Bos bertubuh sangat tinggi bergaun putih dan topi hitam lebar dengan HP tebal (820+ HP).',
  },
};

export type WeaponId = 'pistol' | 'smg' | 'shotgun' | 'rifle';

export type MapId =
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

export type CharacterId = 'raka' | 'sinta' | 'bima' | 'nadia' | 'arga';

export type CharacterSkinId =
  | 'rpd_officer'
  | 'leather_agent'
  | 'stars_alpha'
  | 'ubcs_merc'
  | 'stars_beret'
  | 'red_biker'
  | 'crimson_spy';

export interface CharacterSkinSpec {
  id: CharacterSkinId;
  name: string;
  gender: 'Male' | 'Female';
  imagePath: string;
  accentColor: string;
  shortTag: string;
  description: string;
}

export const CHARACTER_SKIN_ORDER: CharacterSkinId[] = [
  'rpd_officer',
  'leather_agent',
  'stars_alpha',
  'ubcs_merc',
  'stars_beret',
  'red_biker',
  'crimson_spy',
];

export const CHARACTER_SKINS: Record<CharacterSkinId, CharacterSkinSpec> = {
  rpd_officer: {
    id: 'rpd_officer',
    name: 'Opsir R.P.D.',
    gender: 'Male',
    imagePath: '/assets/aistudio/karkter_3de907e9.jpeg',
    accentColor: '#38bdf8',
    shortTag: 'Polisi Taktis',
    description: 'Seragam polisi R.P.D. biru tua dengan rompi anti peluru, pelindung lutut, dan sabuk taktis.',
  },
  leather_agent: {
    id: 'leather_agent',
    name: 'Agen Jaket Kulit',
    gender: 'Male',
    imagePath: '/assets/aistudio/skinkarkter2_e692a642.jpeg',
    accentColor: '#60a5fa',
    shortTag: 'Shearling Ops',
    description: 'Jaket kulit hitam berkerah bulu shearling, kaos navy, sarung paha, dan sepatu boots tinggi.',
  },
  stars_alpha: {
    id: 'stars_alpha',
    name: 'S.T.A.R.S. Alpha',
    gender: 'Male',
    imagePath: '/assets/aistudio/skinkarkter6_228e728e.jpeg',
    accentColor: '#4ade80',
    shortTag: 'Unit Khusus',
    description: 'Kemeja taktis hijau zaitun dengan rompi S.T.A.R.S. multi-saku dan sarung tangan tempur.',
  },
  ubcs_merc: {
    id: 'ubcs_merc',
    name: 'Tentara U.B.C.S.',
    gender: 'Male',
    imagePath: '/assets/aistudio/skinkarkter5_6c2b404b.jpeg',
    accentColor: '#f59e0b',
    shortTag: 'Mercenary',
    description: 'Kaos gelap berdebu, rompi dada zaitun berkapasitas besar, radio pinggang, dan headset taktis.',
  },
  stars_beret: {
    id: 'stars_beret',
    name: 'Operator Baret',
    gender: 'Female',
    imagePath: '/assets/aistudio/skin_karkter3_e78d2d57.jpeg',
    accentColor: '#38bdf8',
    shortTag: 'Baret Biru',
    description: 'Baret biru unit khusus, baju taktis biru muda dengan pelindung bahu, dan celana kargo navy.',
  },
  red_biker: {
    id: 'red_biker',
    name: 'Jaket Kulit Merah',
    gender: 'Female',
    imagePath: '/assets/aistudio/skinkarkter4_22255844.jpeg',
    accentColor: '#fb7185',
    shortTag: 'Biker Crimson',
    description: 'Jaket kulit merah crimson, jeans biru tua sobek lutut, dual holster, dan boots kulit cokelat.',
  },
  crimson_spy: {
    id: 'crimson_spy',
    name: 'Agen Crimson',
    gender: 'Female',
    imagePath: '/assets/aistudio/skin_karkter1_98537754.jpeg',
    accentColor: '#e11d48',
    shortTag: 'Stealth Dress',
    description: 'Gaun sweater rajut turtleneck merah maroon, harness bahu kulit hitam, dan boots setinggi lutut.',
  },
};

export type PickupType =
  | 'medkit'
  | 'ammo'
  | 'weapon_smg'
  | 'weapon_shotgun'
  | 'weapon_rifle';

export type RpgStatKey = 'str' | 'vit' | 'agi' | 'int';

export interface RpgStats {
  str: number;
  vit: number;
  agi: number;
  int: number;
}

export type RpgSkillId = 'shockwave' | 'heal' | 'overdrive';

export interface RpgSkillSpec {
  id: RpgSkillId;
  name: string;
  shortName: string;
  hotkey: string;
  mpCost: number;
  cooldown: number;
  accentColor: string;
  description: string;
}

export const RPG_SKILL_ORDER: RpgSkillId[] = ['shockwave', 'heal', 'overdrive'];

export const RPG_SKILLS: Record<RpgSkillId, RpgSkillSpec> = {
  shockwave: {
    id: 'shockwave',
    name: 'Gelombang Kejut',
    shortName: 'KEJUT',
    hotkey: 'E',
    mpCost: 25,
    cooldown: 7,
    accentColor: '#22d3ee',
    description: 'Ledakan energi 3D radius 9,5m yang menghasilkan kerusakan area besar dan mendorong mundur semua musuh.',
  },
  heal: {
    id: 'heal',
    name: 'Aura Penyembuhan',
    shortName: 'HEAL',
    hotkey: 'X',
    mpCost: 30,
    cooldown: 10,
    accentColor: '#10b981',
    description: 'Memulihkan HP seketika sesuai INT dan memberikan regenerasi HP selama 4 detik.',
  },
  overdrive: {
    id: 'overdrive',
    name: 'Mode Overdrive',
    shortName: 'ULTI',
    hotkey: 'T',
    mpCost: 45,
    cooldown: 18,
    accentColor: '#f59e0b',
    description: 'Mengaktifkan aura tempur selama 8 detik: +60% Damage, +35% Peluang Kritis, +25% Laju Tembak, +20% Kecepatan.',
  },
};

export type ArmorId = 'starter_jacket' | 'iron_vest' | 'steel_command' | 'titan_aegis';
export type RelicId = 'starter_badge' | 'crit_ring' | 'mana_charm' | 'legend_crown';

export interface ArmorSpec {
  id: ArmorId;
  name: string;
  tier: string;
  price: number;
  defense: number;
  bonusHp: number;
  description: string;
}

export interface RelicSpec {
  id: RelicId;
  name: string;
  tier: string;
  price: number;
  bonusCritPct: number;
  bonusDmgPct: number;
  bonusMp: number;
  bonusMpRegen: number;
  bonusGoldPct: number;
  description: string;
}

export const ARMOR_ORDER: ArmorId[] = ['starter_jacket', 'iron_vest', 'steel_command', 'titan_aegis'];
export const RELIC_ORDER: RelicId[] = ['starter_badge', 'crit_ring', 'mana_charm', 'legend_crown'];

export const RPG_ARMORS: Record<ArmorId, ArmorSpec> = {
  starter_jacket: {
    id: 'starter_jacket',
    name: 'Jaket Penyintas',
    tier: 'Tier I',
    price: 0,
    defense: 2,
    bonusHp: 0,
    description: 'Perlengkapan standar penyintas dengan perlindungan dasar.',
  },
  iron_vest: {
    id: 'iron_vest',
    name: 'Rompi Taktis Besi',
    tier: 'Tier II',
    price: 140,
    defense: 10,
    bonusHp: 35,
    description: 'Rompi pelat besi ringan yang meredam cakaran zombie.',
  },
  steel_command: {
    id: 'steel_command',
    name: 'Zirah Komando Baja',
    tier: 'Tier III',
    price: 320,
    defense: 20,
    bonusHp: 80,
    description: 'Armor tempur baja komposit tahan hantaman Brute dan Bos.',
  },
  titan_aegis: {
    id: 'titan_aegis',
    name: 'Aegis Titan Legendaris',
    tier: 'Tier IV · Legendaris',
    price: 620,
    defense: 36,
    bonusHp: 150,
    description: 'Zirah legendaris berpelindung energi tinggi untuk ketahanan maksimal.',
  },
};

export const RPG_RELICS: Record<RelicId, RelicSpec> = {
  starter_badge: {
    id: 'starter_badge',
    name: 'Lencana Pemula',
    tier: 'Tier I',
    price: 0,
    bonusCritPct: 0,
    bonusDmgPct: 0,
    bonusMp: 0,
    bonusMpRegen: 0,
    bonusGoldPct: 0,
    description: 'Tanda pengenal standar regu penyintas.',
  },
  crit_ring: {
    id: 'crit_ring',
    name: 'Cincin Pemburu Kritis',
    tier: 'Tier II',
    price: 160,
    bonusCritPct: 14,
    bonusDmgPct: 12,
    bonusMp: 10,
    bonusMpRegen: 0,
    bonusGoldPct: 0,
    description: 'Meningkatkan akurasi mematikan: +14% Peluang Kritis dan +12% Damage.',
  },
  mana_charm: {
    id: 'mana_charm',
    name: 'Jimat Kristal Mana',
    tier: 'Tier III',
    price: 280,
    bonusCritPct: 5,
    bonusDmgPct: 8,
    bonusMp: 45,
    bonusMpRegen: 3.0,
    bonusGoldPct: 10,
    description: 'Mempercepat pemulihan MP agar lebih sering melancarkan Skill 3D.',
  },
  legend_crown: {
    id: 'legend_crown',
    name: 'Mahkota Sang Legenda',
    tier: 'Tier IV · Legendaris',
    price: 580,
    bonusCritPct: 20,
    bonusDmgPct: 22,
    bonusMp: 40,
    bonusMpRegen: 2.5,
    bonusGoldPct: 25,
    description: 'Relik puncak: +20% Kritis, +22% Damage, +40 MP, dan +25% bonus Gold.',
  },
};

export const RPG_POTION_PRICES = {
  hp: 60,
  mp: 50,
} as const;

export const WEAPON_FORGE_MAX = 5;

export function getWeaponForgeCost(currentTier: number): number {
  return 90 + currentTier * 85;
}

export interface FloatingCombatText {
  id: number;
  xPct: number;
  yPct: number;
  text: string;
  kind: 'damage' | 'crit' | 'heal' | 'gold' | 'skill';
  alpha: number;
}

export interface RpgSkillHudState {
  id: RpgSkillId;
  name: string;
  shortName: string;
  hotkey: string;
  mpCost: number;
  cooldownRemaining: number;
  maxCooldown: number;
  accentColor: string;
}

export interface CharacterSpec {
  id: CharacterId;
  name: string;
  gender: 'Male' | 'Female';
  defaultSkin: CharacterSkinId;
  role: string;
  rpgClass: string;
  baseStats: RpgStats;
  accentColor: string;
  armorHex: number;
  clothHex: number;
  skinHex: number;
  hairHex: number;
  description: string;
}

export const CHARACTER_ORDER: CharacterId[] = [
  'raka',
  'sinta',
  'bima',
  'nadia',
  'arga',
];

export const CHARACTERS: Record<CharacterId, CharacterSpec> = {
  raka: {
    id: 'raka',
    name: 'Raka',
    gender: 'Male',
    defaultSkin: 'rpd_officer',
    role: 'Komandan Taktis',
    rpgClass: 'Vanguard',
    baseStats: { str: 3, vit: 3, agi: 2, int: 2 },
    accentColor: '#22d3ee',
    armorHex: 0x181e27,
    clothHex: 0x263140,
    skinHex: 0xd4a582,
    hairHex: 0x18181b,
    description: 'Kelas Vanguard seimbang dengan kekuatan serangan, ketahanan zirah, dan kendali medan.',
  },
  sinta: {
    id: 'sinta',
    name: 'Sinta',
    gender: 'Female',
    defaultSkin: 'red_biker',
    role: 'Recon Striker',
    rpgClass: 'Ranger',
    baseStats: { str: 2, vit: 2, agi: 5, int: 1 },
    accentColor: '#fb7185',
    armorHex: 0x1e1b29,
    clothHex: 0x3b2234,
    skinHex: 0xdfb190,
    hairHex: 0x1c1917,
    description: 'Kelas Ranger lincah dengan AGI tinggi, kecepatan gerak ekstra, dan peluang kritis tajam.',
  },
  bima: {
    id: 'bima',
    name: 'Bima',
    gender: 'Male',
    defaultSkin: 'ubcs_merc',
    role: 'Heavy Breacher',
    rpgClass: 'Juggernaut',
    baseStats: { str: 4, vit: 5, agi: 1, int: 1 },
    accentColor: '#f59e0b',
    armorHex: 0x2a3326,
    clothHex: 0x3a4332,
    skinHex: 0xc28e6b,
    hairHex: 0x27272a,
    description: 'Kelas Juggernaut bertubuh kekar dengan VIT & HP tebal serta Gelombang Kejut dahsyat.',
  },
  nadia: {
    id: 'nadia',
    name: 'Nadia',
    gender: 'Female',
    defaultSkin: 'stars_beret',
    role: 'Tactical Specialist',
    rpgClass: 'Cleric',
    baseStats: { str: 2, vit: 2, agi: 2, int: 5 },
    accentColor: '#10b981',
    armorHex: 0xdbe3eb,
    clothHex: 0x1f3a37,
    skinHex: 0xe6be9e,
    hairHex: 0x3b2314,
    description: 'Kelas Cleric berintelek tinggi dengan MP besar, regenerasi cepat, dan Aura Penyembuhan kuat.',
  },
  arga: {
    id: 'arga',
    name: 'Arga',
    gender: 'Male',
    defaultSkin: 'leather_agent',
    role: 'Special Agent',
    rpgClass: 'Arcanist',
    baseStats: { str: 3, vit: 1, agi: 3, int: 4 },
    accentColor: '#a855f7',
    armorHex: 0x141320,
    clothHex: 0x26213d,
    skinHex: 0xcca080,
    hairHex: 0x0f172a,
    description: 'Kelas Arcanist mematikan dengan kombinasi STR, AGI, dan INT untuk ledakan damage maksimum.',
  },
};

export function getSkinsForGender(gender: 'Male' | 'Female'): CharacterSkinSpec[] {
  return CHARACTER_SKIN_ORDER.map((id) => CHARACTER_SKINS[id]).filter((s) => s.gender === gender);
}

export function resolveSkinForCharacter(
  characterId: CharacterId,
  preferredSkin?: CharacterSkinId | string,
): CharacterSkinId {
  const charSpec = CHARACTERS[characterId] ?? CHARACTERS.raka;
  if (preferredSkin && preferredSkin in CHARACTER_SKINS) {
    const skinSpec = CHARACTER_SKINS[preferredSkin as CharacterSkinId];
    if (skinSpec.gender === charSpec.gender) {
      return skinSpec.id;
    }
  }
  return charSpec.defaultSkin;
}

export interface WeaponSpec {
  id: WeaponId;
  name: string;
  shortName: string;
  unlockKills: number;
  damage: number;
  headshotDamage: number;
  magSize: number;
  startReserve: number;
  ammoPickupAmount: number;
  fireRate: number;
  reloadDuration: number;
  pellets: number;
  spread: number;
  range: number;
  tracerColor: number;
  accentColor: string;
}

export const WEAPON_ORDER: WeaponId[] = ['pistol', 'smg', 'shotgun', 'rifle'];

export const WEAPONS: Record<WeaponId, WeaponSpec> = {
  pistol: {
    id: 'pistol',
    name: 'Pistol Taktis M9-X',
    shortName: 'PISTOL',
    unlockKills: 0,
    damage: 36,
    headshotDamage: 60,
    magSize: 12,
    startReserve: 72,
    ammoPickupAmount: 24,
    fireRate: 0.18,
    reloadDuration: 1.2,
    pellets: 1,
    spread: 0.008,
    range: 85,
    tracerColor: 0xfef08a,
    accentColor: '#f59e0b',
  },
  smg: {
    id: 'smg',
    name: 'SMG Vector-9',
    shortName: 'SMG',
    unlockKills: 5,
    damage: 25,
    headshotDamage: 42,
    magSize: 28,
    startReserve: 140,
    ammoPickupAmount: 56,
    fireRate: 0.085,
    reloadDuration: 1.45,
    pellets: 1,
    spread: 0.028,
    range: 75,
    tracerColor: 0x38bdf8,
    accentColor: '#38bdf8',
  },
  shotgun: {
    id: 'shotgun',
    name: 'Shotgun Striker-12',
    shortName: 'SHOTGUN',
    unlockKills: 12,
    damage: 24,
    headshotDamage: 38,
    magSize: 8,
    startReserve: 48,
    ammoPickupAmount: 16,
    fireRate: 0.62,
    reloadDuration: 1.75,
    pellets: 6,
    spread: 0.085,
    range: 42,
    tracerColor: 0xf97316,
    accentColor: '#f97316',
  },
  rifle: {
    id: 'rifle',
    name: 'Assault Rifle Pulse-AK',
    shortName: 'RIFLE',
    unlockKills: 22,
    damage: 54,
    headshotDamage: 88,
    magSize: 30,
    startReserve: 150,
    ammoPickupAmount: 60,
    fireRate: 0.115,
    reloadDuration: 1.55,
    pellets: 1,
    spread: 0.014,
    range: 100,
    tracerColor: 0x4ade80,
    accentColor: '#10b981',
  },
};

export interface MapSpec {
  id: MapId;
  name: string;
  subtitle: string;
  description: string;
  fogColor: number;
  fogDensity: number;
  skyTopColor: number;
  skyBottomColor: number;
  moonColor: number;
  rimColor: number;
  accentHex: string;
}

export const MAP_ORDER: MapId[] = [
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

export const MAPS: Record<MapId, MapSpec> = {
  openworld: {
    id: 'openworld',
    name: 'Open World (5 Distrik)',
    subtitle: 'Zona Terbuka',
    description: 'Kota terbuka luas (260m x 260m) menghubungkan 5 distrik: Alun-Alun, Industri, Militer, Stasiun Karantina, dan Pelabuhan Evakuasi.',
    fogColor: 0x070b14,
    fogDensity: 0.0085,
    skyTopColor: 0x4f6d9a,
    skyBottomColor: 0x10141c,
    moonColor: 0xb8d4ff,
    rimColor: 0x38bdf8,
    accentHex: '#22d3ee',
  },
  metro: {
    id: 'metro',
    name: 'Kota Terbengkalai',
    subtitle: 'Metro Ruins',
    description: 'Jalanan kota metropolitan yang hancur dengan gedung pencakar langit, bangunan bisa dimasuki, dan mobil patroli.',
    fogColor: 0x070a10,
    fogDensity: 0.0165,
    skyTopColor: 0x4f6d9a,
    skyBottomColor: 0x10141c,
    moonColor: 0xa5c8ff,
    rimColor: 0x38bdf8,
    accentHex: '#38bdf8',
  },
  industrial: {
    id: 'industrial',
    name: 'Kawasan Industri',
    subtitle: 'Toxic Refinery',
    description: 'Kompleks kilang tua penuh tangki silo raksasa, pipa besi, hanggar penyulingan, dan kabut beracun.',
    fogColor: 0x08100c,
    fogDensity: 0.0175,
    skyTopColor: 0x4b7862,
    skyBottomColor: 0x121814,
    moonColor: 0xa7f3d0,
    rimColor: 0x10b981,
    accentHex: '#10b981',
  },
  military: {
    id: 'military',
    name: 'Pangkalan Militer',
    subtitle: 'Outpost Zero',
    description: 'Markas pertahanan dengan menara radar, 4 bunker beton yang bisa dimasuki, dan Humvee taktis.',
    fogColor: 0x070b14,
    fogDensity: 0.0155,
    skyTopColor: 0x526594,
    skyBottomColor: 0x111521,
    moonColor: 0xbfdbfe,
    rimColor: 0x60a5fa,
    accentHex: '#60a5fa',
  },
  harbor: {
    id: 'harbor',
    name: 'Pelabuhan Malam',
    subtitle: 'Dark Harbor',
    description: 'Dermaga kontainer peti kemas di tepi laut gelap dengan derek pelabuhan, kantor bea cukai, dan jip dermaga.',
    fogColor: 0x050b13,
    fogDensity: 0.016,
    skyTopColor: 0x3c6788,
    skyBottomColor: 0x0b1622,
    moonColor: 0xbae6fd,
    rimColor: 0x06b6d4,
    accentHex: '#06b6d4',
  },
  subway: {
    id: 'subway',
    name: 'Stasiun Bawah Tanah',
    subtitle: 'Subway Wasteland',
    description: 'Jalur kereta bawah tanah gelap dengan gerbong rongsokan, ruang kontrol stasiun, dan lampu darurat merah.',
    fogColor: 0x0b070e,
    fogDensity: 0.018,
    skyTopColor: 0x6b4775,
    skyBottomColor: 0x160f1d,
    moonColor: 0xe9d5ff,
    rimColor: 0xf43f5e,
    accentHex: '#f43f5e',
  },
  hospital: {
    id: 'hospital',
    name: 'Rumah Sakit Karantina',
    subtitle: 'Mercy Quarantine',
    description: 'Kompleks medis luas dengan 5 gedung (IGD, Klinik Vaksin, Farmasi, Lab Virologi) dan ambulans karantina.',
    fogColor: 0x071316,
    fogDensity: 0.0125,
    skyTopColor: 0x3b7a80,
    skyBottomColor: 0x0d1b1e,
    moonColor: 0x99f6e4,
    rimColor: 0x14b8a6,
    accentHex: '#14b8a6',
  },
  forest: {
    id: 'forest',
    name: 'Hutan Pinus Terkutuk',
    subtitle: 'Cursed Pinewood',
    description: 'Kawasan hutan pinus berkabut (128m x 128m) dengan menara pantau, kabin penjaga, gudang kayu, dan jip off-road.',
    fogColor: 0x07120a,
    fogDensity: 0.012,
    skyTopColor: 0x3f6e4c,
    skyBottomColor: 0x0f1a12,
    moonColor: 0xbbf7d0,
    rimColor: 0x22c55e,
    accentHex: '#22c55e',
  },
  desert: {
    id: 'desert',
    name: 'Ngarai Gurun Tandus',
    subtitle: 'Red Canyon Outpost',
    description: 'Lembah gurun bertebing batu merah (128m x 128m) dengan bengkel konvoi, panel surya, bunker radio, dan Humvee gurun.',
    fogColor: 0x191008,
    fogDensity: 0.011,
    skyTopColor: 0x8a643d,
    skyBottomColor: 0x24170c,
    moonColor: 0xfde68a,
    rimColor: 0xf59e0b,
    accentHex: '#f59e0b',
  },
  snowbase: {
    id: 'snowbase',
    name: 'Stasiun Kutub Arktik',
    subtitle: 'Frostbite Base',
    description: 'Pangkalan riset bersalju (128m x 128m) dikelilingi gletser es, tangki krio, kubah riset, dan kendaraan kutub.',
    fogColor: 0x091321,
    fogDensity: 0.0115,
    skyTopColor: 0x5c89b5,
    skyBottomColor: 0x152236,
    moonColor: 0xe0f2fe,
    rimColor: 0x38bdf8,
    accentHex: '#38bdf8',
  },
};

export type MissionMetric =
  | 'kills'
  | 'headshots'
  | 'barrels'
  | 'pickups'
  | 'wave'
  | 'brutes'
  | 'radio_zone'
  | 'collect_intel'
  | 'bosses'
  | 'hold_helipad'
  | 'extract';

export interface MissionDef {
  id: string;
  title: string;
  description: string;
  metric: MissionMetric;
  target: number;
  rewardXp: number;
  rewardScore: number;
}

export const MAP_MISSIONS: Record<MapId, MissionDef[]> = {
  openworld: [
    {
      id: 'ow_m1_clear',
      title: 'Misi 1: Pembersihan Alun-Alun',
      description: 'Amankan pusat kota dari gelombang awal (6 zombie)',
      metric: 'kills',
      target: 6,
      rewardXp: 130,
      rewardScore: 260,
    },
    {
      id: 'ow_m2_radio',
      title: 'Misi 2: Aktifkan Menara Radio',
      description: 'Pergi ke Pos Radio di Utara Alun-Alun & tahan zona sinyal (6 dtk)',
      metric: 'radio_zone',
      target: 6,
      rewardXp: 160,
      rewardScore: 320,
    },
    {
      id: 'ow_m3_sabotage',
      title: 'Misi 3: Sabotase Kilang Industri',
      description: 'Menuju Kawasan Industri (Barat Laut) & ledakkan 3 barrel bahan bakar',
      metric: 'barrels',
      target: 3,
      rewardXp: 210,
      rewardScore: 440,
    },
    {
      id: 'ow_m4_antivirus',
      title: 'Misi 4: Kumpulkan Sampel Antivirus',
      description: 'Menuju Pangkalan Militer (Timur Laut) & ambil 3 koper sampel bercahaya',
      metric: 'collect_intel',
      target: 3,
      rewardXp: 260,
      rewardScore: 550,
    },
    {
      id: 'ow_m5_sniper',
      title: 'Misi 5: Penembak Jitu Distrik',
      description: 'Lakukan 6 tembakan kepala (Headshot Kritis) di jalanan kota',
      metric: 'headshots',
      target: 6,
      rewardXp: 290,
      rewardScore: 620,
    },
    {
      id: 'ow_m6_boss_hunt',
      title: 'Misi 6: Buru Bos Mutan Selatan',
      description: 'Jelajahi Sektor Selatan & kalahkan 2 Zombie Bos penjaga kota',
      metric: 'bosses',
      target: 2,
      rewardXp: 360,
      rewardScore: 800,
    },
    {
      id: 'ow_m7_helipad_hold',
      title: 'Misi 7: Pertahankan Suar Helipad',
      description: 'Menuju Pelabuhan Evakuasi (Tenggara) & bertahan di Helipad selama 18 detik',
      metric: 'hold_helipad',
      target: 18,
      rewardXp: 420,
      rewardScore: 950,
    },
    {
      id: 'ow_m8_extract',
      title: 'Misi 8: Ekstraksi Helikopter',
      description: 'Masuk ke lingkaran hijau Helipad Evakuasi untuk menyelesaikan zona!',
      metric: 'extract',
      target: 1,
      rewardXp: 520,
      rewardScore: 1500,
    },
  ],

  metro: [
    {
      id: 'mt_m1_patrol',
      title: 'Misi 1: Sterilisasi Jalan Raya',
      description: 'Bersihkan 8 zombie yang berkeliaran di persimpangan Metro',
      metric: 'kills',
      target: 8,
      rewardXp: 130,
      rewardScore: 260,
    },
    {
      id: 'mt_m2_radio',
      title: 'Misi 2: Nyalakan Pemancar Polisi',
      description: 'Tahan sinyal di Pos Pemancar Utara selama 6 detik',
      metric: 'radio_zone',
      target: 6,
      rewardXp: 165,
      rewardScore: 340,
    },
    {
      id: 'mt_m3_files',
      title: 'Misi 3: Amankan Berkas Kota',
      description: 'Masuki Kantor Polisi, Lobi Hotel & Bank untuk mengambil 3 koper data',
      metric: 'collect_intel',
      target: 3,
      rewardXp: 210,
      rewardScore: 440,
    },
    {
      id: 'mt_m4_barrels',
      title: 'Misi 4: Hancurkan Barikade Bahan Bakar',
      description: 'Ledakkan 2 barrel merah di persimpangan Metro',
      metric: 'barrels',
      target: 2,
      rewardXp: 230,
      rewardScore: 480,
    },
    {
      id: 'mt_m5_headshots',
      title: 'Misi 5: Sniper Pencakar Langit',
      description: 'Cetak 6 tembakan kepala kritis di jalanan kota',
      metric: 'headshots',
      target: 6,
      rewardXp: 270,
      rewardScore: 580,
    },
    {
      id: 'mt_m6_supplies',
      title: 'Misi 6: Pengumpulan Logistik Darurat',
      description: 'Ambil 3 pasokan Medkit, Amunisi, atau Senjata Drop',
      metric: 'pickups',
      target: 3,
      rewardXp: 300,
      rewardScore: 640,
    },
    {
      id: 'mt_m7_boss',
      title: 'Misi 7: Tumbangkan Bos Metro',
      description: 'Kalahkan 2 Zombie Bos yang meneror pusat kota',
      metric: 'bosses',
      target: 2,
      rewardXp: 380,
      rewardScore: 860,
    },
    {
      id: 'mt_m8_hold',
      title: 'Misi 8: Pertahankan Bundaran Evakuasi',
      description: 'Bertahan di zona suar selatan selama 15 detik untuk menguasai Metro',
      metric: 'hold_helipad',
      target: 15,
      rewardXp: 460,
      rewardScore: 1100,
    },
  ],

  industrial: [
    {
      id: 'in_m1_clear',
      title: 'Misi 1: Pembersihan Area Kilang',
      description: 'Eliminasi 8 zombie pekerja di pelataran kilang',
      metric: 'kills',
      target: 8,
      rewardXp: 135,
      rewardScore: 270,
    },
    {
      id: 'in_m2_barrels',
      title: 'Misi 2: Sabotase Tangki Kimia',
      description: 'Ledakkan 3 barrel bahan bakar di sekitar pipa kilang',
      metric: 'barrels',
      target: 3,
      rewardXp: 180,
      rewardScore: 370,
    },
    {
      id: 'in_m3_radio',
      title: 'Misi 3: Kalibrasi Sensor Gas',
      description: 'Tahan zona menara sensor di Utara Kilang selama 6 detik',
      metric: 'radio_zone',
      target: 6,
      rewardXp: 210,
      rewardScore: 440,
    },
    {
      id: 'in_m4_samples',
      title: 'Misi 4: Ambil Sampel Limbah Toksik',
      description: 'Masuki Hanggar Turbin & Gudang Penyulingan untuk 3 koper sampel',
      metric: 'collect_intel',
      target: 3,
      rewardXp: 250,
      rewardScore: 530,
    },
    {
      id: 'in_m5_brutes',
      title: 'Misi 5: Pemburu Brute Pabrik',
      description: 'Kalahkan 3 zombie Brute raksasa di kompleks industri',
      metric: 'brutes',
      target: 3,
      rewardXp: 290,
      rewardScore: 630,
    },
    {
      id: 'in_m6_headshots',
      title: 'Misi 6: Presisi Ruang Turbin',
      description: 'Lakukan 6 tembakan kepala kritis di tengah kabut beracun',
      metric: 'headshots',
      target: 6,
      rewardXp: 320,
      rewardScore: 700,
    },
    {
      id: 'in_m7_boss',
      title: 'Misi 7: Eliminasi Bos Mutan Kilang',
      description: 'Tumbangkan 2 Zombie Bos penjaga tangki silo',
      metric: 'bosses',
      target: 2,
      rewardXp: 400,
      rewardScore: 900,
    },
    {
      id: 'in_m8_hold',
      title: 'Misi 8: Amankan Landasan Pabrik',
      description: 'Pertahankan zona suar selatan selama 15 detik hingga steril',
      metric: 'hold_helipad',
      target: 15,
      rewardXp: 470,
      rewardScore: 1150,
    },
  ],

  military: [
    {
      id: 'ml_m1_gate',
      title: 'Misi 1: Pertahanan Gerbang Markas',
      description: 'Tahan serbuan awal dan eliminasi 9 zombie di pangkalan',
      metric: 'kills',
      target: 9,
      rewardXp: 140,
      rewardScore: 280,
    },
    {
      id: 'ml_m2_radar',
      title: 'Misi 2: Sinkronisasi Menara Radar',
      description: 'Berdiri di zona Menara Radar Utara selama 6 detik',
      metric: 'radio_zone',
      target: 6,
      rewardXp: 180,
      rewardScore: 370,
    },
    {
      id: 'ml_m3_codes',
      title: 'Misi 3: Amankan Sandi Bunker',
      description: 'Masuki 3 bunker militer untuk mengumpulkan koper sandi rahasia',
      metric: 'collect_intel',
      target: 3,
      rewardXp: 230,
      rewardScore: 490,
    },
    {
      id: 'ml_m4_sniper',
      title: 'Misi 4: Uji Tembak Sniper Outpost',
      description: 'Cetak 6 Headshot Kritis untuk membersihkan area barak',
      metric: 'headshots',
      target: 6,
      rewardXp: 260,
      rewardScore: 560,
    },
    {
      id: 'ml_m5_ammo',
      title: 'Misi 5: Rebut Pasokan Taktis',
      description: 'Kumpulkan 3 suplai Amunisi, Medkit, atau Senjata Drop',
      metric: 'pickups',
      target: 3,
      rewardXp: 290,
      rewardScore: 620,
    },
    {
      id: 'ml_m6_barrels',
      title: 'Misi 6: Ledakkan Depot Bahan Bakar',
      description: 'Hancurkan 3 barrel bahan bakar militer di sekitar barikade',
      metric: 'barrels',
      target: 3,
      rewardXp: 330,
      rewardScore: 720,
    },
    {
      id: 'ml_m7_boss',
      title: 'Misi 7: Tumbangkan Bos Komandan',
      description: 'Kalahkan 2 Zombie Bos bersenjata biologi di lapangan markas',
      metric: 'bosses',
      target: 2,
      rewardXp: 420,
      rewardScore: 960,
    },
    {
      id: 'ml_m8_hold',
      title: 'Misi 8: Pertahankan Helipad Outpost',
      description: 'Tahan zona evakuasi pangkalan selama 16 detik',
      metric: 'hold_helipad',
      target: 16,
      rewardXp: 490,
      rewardScore: 1200,
    },
  ],

  harbor: [
    {
      id: 'hb_m1_dock',
      title: 'Misi 1: Bersihkan Dermaga Kontainer',
      description: 'Eliminasi 8 zombie di antara peti kemas pelabuhan',
      metric: 'kills',
      target: 8,
      rewardXp: 135,
      rewardScore: 270,
    },
    {
      id: 'hb_m2_beacon',
      title: 'Misi 2: Aktifkan Suar Mercusuar',
      description: 'Nyalakan pemancar dermaga utara selama 6 detik',
      metric: 'radio_zone',
      target: 6,
      rewardXp: 175,
      rewardScore: 360,
    },
    {
      id: 'hb_m3_manifest',
      title: 'Misi 3: Sita Manifest Kargo',
      description: 'Ambil 3 koper data di Bea Cukai, Gudang Kontainer & Dermaga Selatan',
      metric: 'collect_intel',
      target: 3,
      rewardXp: 225,
      rewardScore: 480,
    },
    {
      id: 'hb_m4_barrels',
      title: 'Misi 4: Sabotase Drum Solar Kapal',
      description: 'Ledakkan 2 barrel bahan bakar di jalur kontainer',
      metric: 'barrels',
      target: 2,
      rewardXp: 250,
      rewardScore: 530,
    },
    {
      id: 'hb_m5_headshots',
      title: 'Misi 5: Penembak Jitu Dermaga',
      description: 'Lakukan 6 tembakan kepala akurat di lorong peti kemas',
      metric: 'headshots',
      target: 6,
      rewardXp: 285,
      rewardScore: 610,
    },
    {
      id: 'hb_m6_brutes',
      title: 'Misi 6: Hentikan Brute Pelabuhan',
      description: 'Tumbangkan 3 zombie Brute bertubuh besar di tepi dermaga',
      metric: 'brutes',
      target: 3,
      rewardXp: 325,
      rewardScore: 710,
    },
    {
      id: 'hb_m7_boss',
      title: 'Misi 7: Buru Bos Lautan Mutan',
      description: 'Kalahkan 2 Zombie Bos penguasa Dark Harbor',
      metric: 'bosses',
      target: 2,
      rewardXp: 410,
      rewardScore: 930,
    },
    {
      id: 'hb_m8_hold',
      title: 'Misi 8: Amankan Dermaga Evakuasi',
      description: 'Pertahankan titik jemput selatan selama 15 detik',
      metric: 'hold_helipad',
      target: 15,
      rewardXp: 480,
      rewardScore: 1180,
    },
  ],

  subway: [
    {
      id: 'sb_m1_platform',
      title: 'Misi 1: Bersihkan Peron Utama',
      description: 'Eliminasi 8 zombie di sepanjang rel kereta bawah tanah',
      metric: 'kills',
      target: 8,
      rewardXp: 135,
      rewardScore: 270,
    },
    {
      id: 'sb_m2_relay',
      title: 'Misi 2: Pulihkan Relay Terowongan',
      description: 'Tahan zona pemancar darurat di peron utara selama 6 detik',
      metric: 'radio_zone',
      target: 6,
      rewardXp: 175,
      rewardScore: 360,
    },
    {
      id: 'sb_m3_blackbox',
      title: 'Misi 3: Ambil Kotak Hitam Kereta',
      description: 'Masuki Ruang Kontrol, Pos Keamanan & Peron Selatan untuk 3 koper',
      metric: 'collect_intel',
      target: 3,
      rewardXp: 225,
      rewardScore: 480,
    },
    {
      id: 'sb_m4_supplies',
      title: 'Misi 4: Kumpulkan Logistik Stasiun',
      description: 'Ambil 3 Medkit, Amunisi, atau Senjata Drop di terowongan',
      metric: 'pickups',
      target: 3,
      rewardXp: 255,
      rewardScore: 540,
    },
    {
      id: 'sb_m5_sniper',
      title: 'Misi 5: Sniper Lorong Gelap',
      description: 'Cetak 6 Headshot Kritis di antara gerbong rongsokan',
      metric: 'headshots',
      target: 6,
      rewardXp: 290,
      rewardScore: 620,
    },
    {
      id: 'sb_m6_barrels',
      title: 'Misi 6: Ledakkan Generator Rel',
      description: 'Hancurkan 2 barrel bahan bakar di jalur kereta',
      metric: 'barrels',
      target: 2,
      rewardXp: 325,
      rewardScore: 710,
    },
    {
      id: 'sb_m7_boss',
      title: 'Misi 7: Tumbangkan Bos Terowongan',
      description: 'Kalahkan 2 Zombie Bos penjaga stasiun bawah tanah',
      metric: 'bosses',
      target: 2,
      rewardXp: 410,
      rewardScore: 930,
    },
    {
      id: 'sb_m8_hold',
      title: 'Misi 8: Buka Pintu Keluar Darurat',
      description: 'Bertahan di zona peron selatan selama 15 detik',
      metric: 'hold_helipad',
      target: 15,
      rewardXp: 480,
      rewardScore: 1180,
    },
  ],

  hospital: [
    {
      id: 'hs_m1_triage',
      title: 'Misi 1: Sterilisasi Halaman IGD',
      description: 'Bersihkan 9 zombie dari halaman triase rumah sakit',
      metric: 'kills',
      target: 9,
      rewardXp: 145,
      rewardScore: 290,
    },
    {
      id: 'hs_m2_radio',
      title: 'Misi 2: Aktifkan Transmiter Medis',
      description: 'Tahan sinyal darurat di Sayap IGD Utara selama 6 detik',
      metric: 'radio_zone',
      target: 6,
      rewardXp: 185,
      rewardScore: 380,
    },
    {
      id: 'hs_m3_serum',
      title: 'Misi 3: Kumpulkan Serum Virologi',
      description: 'Masuki Gedung IGD, Klinik Vaksin & Lab Virologi untuk 3 koper serum',
      metric: 'collect_intel',
      target: 3,
      rewardXp: 240,
      rewardScore: 510,
    },
    {
      id: 'hs_m4_pharmacy',
      title: 'Misi 4: Suplai Farmasi Darurat',
      description: 'Kumpulkan 3 Medkit, Amunisi, atau Senjata Drop di area medis',
      metric: 'pickups',
      target: 3,
      rewardXp: 270,
      rewardScore: 580,
    },
    {
      id: 'hs_m5_precision',
      title: 'Misi 5: Tembakan Presisi Bangsal',
      description: 'Lakukan 6 Headshot Kritis untuk menghentikan penyebaran infeksi',
      metric: 'headshots',
      target: 6,
      rewardXp: 300,
      rewardScore: 650,
    },
    {
      id: 'hs_m6_barrels',
      title: 'Misi 6: Ledakkan Tabung Oksigen Bocor',
      description: 'Ledakkan 3 barrel merah di sekitar halaman rumah sakit',
      metric: 'barrels',
      target: 3,
      rewardXp: 340,
      rewardScore: 750,
    },
    {
      id: 'hs_m7_boss',
      title: 'Misi 7: Tumbangkan Bos Patogen',
      description: 'Kalahkan 2 Zombie Bos mutasi di kompleks Lab & Farmasi',
      metric: 'bosses',
      target: 2,
      rewardXp: 430,
      rewardScore: 980,
    },
    {
      id: 'hs_m8_hold',
      title: 'Misi 8: Amankan Helipad Medis',
      description: 'Pertahankan halaman helipad pusat selama 16 detik',
      metric: 'hold_helipad',
      target: 16,
      rewardXp: 510,
      rewardScore: 1250,
    },
  ],

  forest: [
    {
      id: 'fr_m1_patrol',
      title: 'Misi 1: Patroli Perkemahan Pinus',
      description: 'Bersihkan 9 zombie yang mengintai di perkemahan tengah hutan',
      metric: 'kills',
      target: 9,
      rewardXp: 145,
      rewardScore: 290,
    },
    {
      id: 'fr_m2_watchtower',
      title: 'Misi 2: Sinkronisasi Menara Pantau',
      description: 'Tahan sinyal di Menara Pantau Utara selama 6 detik',
      metric: 'radio_zone',
      target: 6,
      rewardXp: 185,
      rewardScore: 380,
    },
    {
      id: 'fr_m3_journals',
      title: 'Misi 3: Kumpulkan Jurnal Riset Hutan',
      description: 'Masuki Kabin Penjaga, Pos Observasi & Pondok Penelitian untuk 3 koper',
      metric: 'collect_intel',
      target: 3,
      rewardXp: 240,
      rewardScore: 510,
    },
    {
      id: 'fr_m4_sniper',
      title: 'Misi 4: Pemburu Kabut Pinus',
      description: 'Cetak 6 Headshot Kritis di antara pepohonan pinus',
      metric: 'headshots',
      target: 6,
      rewardXp: 275,
      rewardScore: 590,
    },
    {
      id: 'fr_m5_brutes',
      title: 'Misi 5: Hentikan Brute Rimba',
      description: 'Kalahkan 3 zombie Brute raksasa penjaga hutan',
      metric: 'brutes',
      target: 3,
      rewardXp: 315,
      rewardScore: 680,
    },
    {
      id: 'fr_m6_barrels',
      title: 'Misi 6: Sabotase Drum Bahan Bakar Kayu',
      description: 'Ledakkan 3 barrel merah di jalur penebangan hutan',
      metric: 'barrels',
      target: 3,
      rewardXp: 345,
      rewardScore: 760,
    },
    {
      id: 'fr_m7_boss',
      title: 'Misi 7: Buru Bos Rimba Terkutuk',
      description: 'Tumbangkan 2 Zombie Bos di Lembah Pinus Selatan',
      metric: 'bosses',
      target: 2,
      rewardXp: 430,
      rewardScore: 980,
    },
    {
      id: 'fr_m8_hold',
      title: 'Misi 8: Pertahankan Lapangan Evakuasi',
      description: 'Tahan titik suar hutan selatan selama 16 detik',
      metric: 'hold_helipad',
      target: 16,
      rewardXp: 510,
      rewardScore: 1250,
    },
  ],

  desert: [
    {
      id: 'ds_m1_convoy',
      title: 'Misi 1: Bersihkan Pos Konvoi',
      description: 'Eliminasi 9 zombie di persimpangan ngarai gurun',
      metric: 'kills',
      target: 9,
      rewardXp: 145,
      rewardScore: 290,
    },
    {
      id: 'ds_m2_radio',
      title: 'Misi 2: Aktifkan Antena Ngarai',
      description: 'Tahan sinyal di Pos Konvoi Utara selama 6 detik',
      metric: 'radio_zone',
      target: 6,
      rewardXp: 185,
      rewardScore: 380,
    },
    {
      id: 'ds_m3_solar',
      title: 'Misi 3: Ambil Modul Panel Surya',
      description: 'Masuki Pos Perbatasan, Bengkel Konvoi & Bunker Radio untuk 3 koper',
      metric: 'collect_intel',
      target: 3,
      rewardXp: 240,
      rewardScore: 510,
    },
    {
      id: 'ds_m4_barrels',
      title: 'Misi 4: Sabotase Tangki Bensin Gurun',
      description: 'Ledakkan 3 barrel bahan bakar di sekitar bengkel konvoi',
      metric: 'barrels',
      target: 3,
      rewardXp: 275,
      rewardScore: 590,
    },
    {
      id: 'ds_m5_sniper',
      title: 'Misi 5: Sniper Tebing Batu Merah',
      description: 'Lakukan 6 tembakan kepala jarak jauh di lembah gurun',
      metric: 'headshots',
      target: 6,
      rewardXp: 310,
      rewardScore: 670,
    },
    {
      id: 'ds_m6_supplies',
      title: 'Misi 6: Rebut Logistik Konvoi',
      description: 'Ambil 3 Medkit, Amunisi, atau Senjata Drop di ngarai',
      metric: 'pickups',
      target: 3,
      rewardXp: 340,
      rewardScore: 740,
    },
    {
      id: 'ds_m7_boss',
      title: 'Misi 7: Tumbangkan Bos Gurun Mutan',
      description: 'Kalahkan 2 Zombie Bos di Lembah Batu Merah Selatan',
      metric: 'bosses',
      target: 2,
      rewardXp: 430,
      rewardScore: 980,
    },
    {
      id: 'ds_m8_hold',
      title: 'Misi 8: Amankan Landasan Ngarai',
      description: 'Pertahankan zona pendaratan gurun selama 16 detik',
      metric: 'hold_helipad',
      target: 16,
      rewardXp: 510,
      rewardScore: 1250,
    },
  ],

  snowbase: [
    {
      id: 'sn_m1_snow',
      title: 'Misi 1: Pembersihan Lapangan Salju',
      description: 'Bersihkan 9 zombie di halaman Stasiun Riset Kutub',
      metric: 'kills',
      target: 9,
      rewardXp: 150,
      rewardScore: 300,
    },
    {
      id: 'sn_m2_sat',
      title: 'Misi 2: Nyalakan Antena Satelit Arktik',
      description: 'Tahan sinyal di menara satelit utara selama 6 detik',
      metric: 'radio_zone',
      target: 6,
      rewardXp: 190,
      rewardScore: 390,
    },
    {
      id: 'sn_m3_cryo',
      title: 'Misi 3: Amankan Tabung Sampel Krio',
      description: 'Masuki Kubah Riset, Hanggar & Klinik Hipotermia untuk 3 koper krio',
      metric: 'collect_intel',
      target: 3,
      rewardXp: 245,
      rewardScore: 520,
    },
    {
      id: 'sn_m4_supplies',
      title: 'Misi 4: Kumpulkan Suplai Hangat',
      description: 'Ambil 3 Medkit, Amunisi, atau Senjata Drop di tengah salju',
      metric: 'pickups',
      target: 3,
      rewardXp: 280,
      rewardScore: 600,
    },
    {
      id: 'sn_m5_sniper',
      title: 'Misi 5: Sniper Badai Salju',
      description: 'Cetak 6 Headshot Kritis di sekitar tangki krio',
      metric: 'headshots',
      target: 6,
      rewardXp: 315,
      rewardScore: 680,
    },
    {
      id: 'sn_m6_barrels',
      title: 'Misi 6: Ledakkan Tangki Bahan Bakar Krio',
      description: 'Hancurkan 3 barrel bahan bakar di pangkalan kutub',
      metric: 'barrels',
      target: 3,
      rewardXp: 350,
      rewardScore: 770,
    },
    {
      id: 'sn_m7_boss',
      title: 'Misi 7: Eliminasi Bos Frost Mutan',
      description: 'Kalahkan 2 Zombie Bos ganas di Gletser Selatan',
      metric: 'bosses',
      target: 2,
      rewardXp: 440,
      rewardScore: 1000,
    },
    {
      id: 'sn_m8_hold',
      title: 'Misi 8: Pertahankan Landasan Kutub',
      description: 'Tahan zona evakuasi Arktik selama 16 detik hingga aman',
      metric: 'hold_helipad',
      target: 16,
      rewardXp: 530,
      rewardScore: 1300,
    },
  ],
};

export const OPENWORLD_MISSIONS: MissionDef[] = MAP_MISSIONS.openworld;
export const MISSIONS: MissionDef[] = MAP_MISSIONS.metro;

export function getMissionsForMap(mapId: MapId): MissionDef[] {
  return MAP_MISSIONS[mapId] ?? MAP_MISSIONS.metro;
}

export type PuzzleLevel = 'SMP' | 'SMA';

export interface MissionPuzzleSpec {
  id: string;
  level: PuzzleLevel;
  subject: string;
  category: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  hint: string;
}

export interface ActiveMissionPuzzle {
  source?: 'mission' | 'boss';
  bossName?: string;
  rewardPreview?: string;
  missionIndex: number;
  missionTitle: string;
  missionMetric: MissionMetric;
  puzzle: MissionPuzzleSpec;
  wrongAttempts: number;
  feedback: string | null;
}

export const SMP_PUZZLE_BANK: MissionPuzzleSpec[] = [
  {
    id: 'smp_mat_1',
    level: 'SMP',
    subject: 'Matematika',
    category: 'SMP · Matematika',
    question: 'Jika diketahui persamaan linear 3x - 7 = 14, berapakah nilai dari 2x + 5?',
    options: ['15', '17', '19', '21'],
    correctIndex: 2,
    hint: 'Cari nilai x dulu: 3x = 14 + 7 = 21, sehingga x = 7. Lalu hitung 2(7) + 5.',
  },
  {
    id: 'smp_mat_2',
    level: 'SMP',
    subject: 'Matematika',
    category: 'SMP · Matematika',
    question:
      'Sebuah segitiga siku-siku memiliki sisi tegak 6 cm dan sisi alas 8 cm. Berapakah panjang sisi miring (hipotenusa) segitiga tersebut?',
    options: ['9 cm', '10 cm', '12 cm', '14 cm'],
    correctIndex: 1,
    hint: 'Gunakan Teorema Pythagoras: c = √(6² + 8²) = √(36 + 64).',
  },
  {
    id: 'smp_fis_1',
    level: 'SMP',
    subject: 'Fisika',
    category: 'SMP · Fisika',
    question:
      'Mobil patroli melaju dengan kecepatan tetap 72 km/jam selama 15 menit. Berapa jarak yang ditempuh mobil tersebut?',
    options: ['12 km', '15 km', '18 km', '24 km'],
    correctIndex: 2,
    hint: '15 menit = 1/4 jam. Jarak s = v × t = 72 × (1/4).',
  },
  {
    id: 'smp_fis_2',
    level: 'SMP',
    subject: 'Fisika',
    category: 'SMP · Fisika',
    question:
      'Sebuah rangkaian radio memiliki hambatan (R) sebesar 12 Ω dan dialiri arus listrik (I) sebesar 2,5 A. Berapakah besar tegangan listrik (V)?',
    options: ['24 Volt', '30 Volt', '36 Volt', '48 Volt'],
    correctIndex: 1,
    hint: 'Gunakan Hukum Ohm: V = I × R = 2,5 × 12.',
  },
  {
    id: 'smp_bio_1',
    level: 'SMP',
    subject: 'Biologi',
    category: 'SMP · Biologi',
    question:
      'Pada proses fotosintesis tumbuhan hijau dengan bantuan cahaya matahari, gas apakah yang diserap dari udara dan gas apakah yang dilepaskan?',
    options: [
      'Menyerap O₂, melepaskan CO₂',
      'Menyerap CO₂, melepaskan O₂',
      'Menyerap Nitrogen, melepaskan O₂',
      'Menyerap O₂, melepaskan uap air',
    ],
    correctIndex: 1,
    hint: 'Tumbuhan mengambil karbon dioksida (CO₂) untuk membuat glukosa dan menghasilkan oksigen (O₂).',
  },
  {
    id: 'smp_bio_2',
    level: 'SMP',
    subject: 'Biologi',
    category: 'SMP · Biologi',
    question:
      'Jaringan pembuluh pada tumbuhan yang berfungsi mengangkut air dan unsur hara dari akar menuju daun disebut...',
    options: ['Floem', 'Kambium', 'Xilem', 'Stomata'],
    correctIndex: 2,
    hint: 'Pembuluh kayu mengangkut air dari bawah ke atas, sedangkan floem mengedarkan hasil fotosintesis.',
  },
  {
    id: 'smp_kim_1',
    level: 'SMP',
    subject: 'IPA Kimia',
    category: 'SMP · IPA Kimia',
    question:
      'Larutan bersifat asam (pH < 7) seperti cuka jika diuji dengan kertas lakmus biru akan mengubah warnanya menjadi...',
    options: ['Merah', 'Tetap biru', 'Hijau', 'Kuning'],
    correctIndex: 0,
    hint: 'Ingat singkatan: Asam memerahkan lakmus biru, Basa membirukan lakmus merah.',
  },
  {
    id: 'smp_mat_3',
    level: 'SMP',
    subject: 'Matematika',
    category: 'SMP · Matematika',
    question:
      'Sebuah paket logistik seharga Rp250.000 mendapat diskon 20%. Berapakah harga yang harus dibayar setelah diskon?',
    options: ['Rp180.000', 'Rp195.000', 'Rp200.000', 'Rp210.000'],
    correctIndex: 2,
    hint: 'Potongan 20% dari 250.000 adalah 50.000. Kurangkan dari harga awal.',
  },
  {
    id: 'smp_fis_3',
    level: 'SMP',
    subject: 'Fisika',
    category: 'SMP · Fisika',
    question:
      'Sebuah gaya sebesar 600 N menekan tegak lurus bidang seluas 4 m². Berapakah besar tekanan yang dihasilkan?',
    options: ['120 Pa', '150 Pa', '240 Pa', '2.400 Pa'],
    correctIndex: 1,
    hint: 'Rumus tekanan zat padat: P = F / A = 600 ÷ 4.',
  },
  {
    id: 'smp_bio_3',
    level: 'SMP',
    subject: 'Biologi',
    category: 'SMP · Biologi',
    question:
      'Komponen darah manusia yang berfungsi utama mengikat dan mengedarkan oksigen ke seluruh tubuh berkat hemoglobin adalah...',
    options: [
      'Leukosit (Sel darah putih)',
      'Trombosit (Keping darah)',
      'Eritrosit (Sel darah merah)',
      'Plasma darah',
    ],
    correctIndex: 2,
    hint: 'Sel darah yang memberi warna merah karena mengandung hemoglobin.',
  },
  {
    id: 'smp_mat_4',
    level: 'SMP',
    subject: 'Matematika',
    category: 'SMP · Matematika',
    question:
      'Diketahui barisan aritmetika: 5, 9, 13, 17, ... Berapakah nilai suku ke-10 (U₁₀) dari barisan tersebut?',
    options: ['37', '39', '41', '45'],
    correctIndex: 2,
    hint: 'Suku pertama a = 5, beda b = 4. Rumus Uₙ = a + (n - 1)b → 5 + 9 × 4.',
  },
  {
    id: 'smp_fis_4',
    level: 'SMP',
    subject: 'Fisika',
    category: 'SMP · Fisika',
    question:
      'Sebuah benda bermassa 4 kg bergerak dengan kecepatan 5 m/s. Berapakah besar energi kinetik benda tersebut?',
    options: ['20 Joule', '40 Joule', '50 Joule', '100 Joule'],
    correctIndex: 2,
    hint: 'Rumus energi kinetik: Ek = ½ × m × v² = ½ × 4 × 5².',
  },
  {
    id: 'smp_geo_1',
    level: 'SMP',
    subject: 'IPS Geografi',
    category: 'SMP · IPS Geografi',
    question:
      'Karena wilayah Indonesia dilalui garis khatulistiwa (0° lintang) dan terletak di antara 6° LU – 11° LS, maka Indonesia memiliki iklim...',
    options: ['Subtropis', 'Tropis', 'Sedang', 'Kutub'],
    correctIndex: 1,
    hint: 'Wilayah di sekitar garis khatulistiwa mendapatkan penyinaran matahari sepanjang tahun.',
  },
  {
    id: 'smp_sej_1',
    level: 'SMP',
    subject: 'IPS Sejarah',
    category: 'SMP · IPS Sejarah',
    question:
      'Ikrar Sumpah Pemuda yang menyatakan bertumpah darah satu, berbangsa satu, dan berbahasa satu Indonesia diikrarkan pada tanggal...',
    options: ['20 Mei 1908', '28 Oktober 1928', '17 Agustus 1945', '10 November 1945'],
    correctIndex: 1,
    hint: 'Diperingati setiap akhir bulan Oktober sebagai Hari Sumpah Pemuda.',
  },
  {
    id: 'smp_mat_5',
    level: 'SMP',
    subject: 'Matematika',
    category: 'SMP · Matematika',
    question:
      'Sebuah dadu bersisi enam dilempar sekali. Berapakah peluang munculnya mata dadu bilangan prima?',
    options: ['1/6', '1/3', '1/2', '2/3'],
    correctIndex: 2,
    hint: 'Bilangan prima pada dadu adalah {2, 3, 5}, ada 3 dari 6 kemungkinan (3/6).',
  },
  {
    id: 'smp_fis_5',
    level: 'SMP',
    subject: 'Fisika',
    category: 'SMP · Fisika',
    question:
      'Termometer Celcius di ruang lab menunjukkan suhu 25°C. Berapakah suhu tersebut dalam satuan internasional Kelvin (K)?',
    options: ['248 K', '273 K', '298 K', '318 K'],
    correctIndex: 2,
    hint: 'Konversi Celcius ke Kelvin: K = °C + 273.',
  },
  {
    id: 'smp_bin_1',
    level: 'SMP',
    subject: 'Bahasa Indonesia',
    category: 'SMP · Bahasa Indonesia',
    question:
      'Kalimat "Angin malam berbisik lirih di antara pepohonan pinus yang gelap" menggunakan gaya bahasa (majas)...',
    options: ['Hiperbola', 'Personifikasi', 'Metafora', 'Ironi'],
    correctIndex: 1,
    hint: 'Majas yang mengumpamakan benda mati (angin) seolah memiliki sifat hidup seperti manusia (berbisik).',
  },
  {
    id: 'smp_mat_6',
    level: 'SMP',
    subject: 'Matematika',
    category: 'SMP · Matematika',
    question:
      'Sebuah landasan helipad berbentuk lingkaran memiliki jari-jari 7 meter (π = 22/7). Berapakah luas landasan tersebut?',
    options: ['44 m²', '88 m²', '154 m²', '308 m²'],
    correctIndex: 2,
    hint: 'Luas lingkaran L = π × r² = (22/7) × 7 × 7.',
  },
  {
    id: 'smp_kim_2',
    level: 'SMP',
    subject: 'IPA Kimia',
    category: 'SMP · IPA Kimia',
    question: 'Manakah rumus kimia yang tepat untuk senyawa garam dapur (Natrium Klorida)?',
    options: ['H₂O', 'CO₂', 'NaCl', 'H₂SO₄'],
    correctIndex: 2,
    hint: 'Gabungan unsur Natrium (Na) dan Klorin (Cl).',
  },
  {
    id: 'smp_bio_4',
    level: 'SMP',
    subject: 'Biologi',
    category: 'SMP · Biologi',
    question:
      'Perhatikan rantai makanan: Rumput → Belalang → Katak → Ular → Elang. Organisme yang berperan sebagai konsumen tingkat II adalah...',
    options: ['Belalang', 'Katak', 'Ular', 'Elang'],
    correctIndex: 1,
    hint: 'Rumput = produsen, Belalang = konsumen I, pemakan belalang = konsumen II.',
  },
];

export const SMA_PUZZLE_BANK: MissionPuzzleSpec[] = [
  {
    id: 'sma_mat_1',
    level: 'SMA',
    subject: 'Matematika',
    category: 'SMA · Matematika',
    question: 'Berapakah hasil dari operasi logaritma ²log 16 + ³log 27 - ⁵log 25?',
    options: ['3', '5', '7', '9'],
    correctIndex: 1,
    hint: '²log 16 = 4 (karena 2⁴=16), ³log 27 = 3 (3³=27), ⁵log 25 = 2 (5²=25). Hitung 4 + 3 - 2.',
  },
  {
    id: 'sma_mat_2',
    level: 'SMA',
    subject: 'Matematika',
    category: 'SMA · Matematika',
    question:
      'Diketahui fungsi f(x) = 3x³ - 4x² + 5x - 9. Berapakah nilai turunan pertamanya saat x = 2, yaitu f\'(2)?',
    options: ['17', '21', '25', '29'],
    correctIndex: 2,
    hint: 'Turunannya f\'(x) = 9x² - 8x + 5. Substitusi x = 2: 9(4) - 8(2) + 5.',
  },
  {
    id: 'sma_mat_3',
    level: 'SMA',
    subject: 'Matematika',
    category: 'SMA · Matematika',
    question: 'Berapakah nilai eksak dari sin 30° + cos 60° + tan 45°?',
    options: ['1', '1,5', '2', '2,5'],
    correctIndex: 2,
    hint: 'sin 30° = 1/2, cos 60° = 1/2, dan tan 45° = 1.',
  },
  {
    id: 'sma_mat_4',
    level: 'SMA',
    subject: 'Matematika',
    category: 'SMA · Matematika',
    question: 'Diketahui matriks ordo 2×2, A = [[5, 3], [2, 4]]. Berapakah determinan matriks A (det A)?',
    options: ['10', '14', '16', '26'],
    correctIndex: 1,
    hint: 'det A = (a × d) - (b × c) = (5 × 4) - (3 × 2).',
  },
  {
    id: 'sma_fis_1',
    level: 'SMA',
    subject: 'Fisika',
    category: 'SMA · Fisika',
    question:
      'Sebuah peti suplai bermassa 15 kg didorong dengan gaya mendatar 60 N di lantai licin tanpa gesekan. Berapakah percepatan peti tersebut?',
    options: ['2 m/s²', '3 m/s²', '4 m/s²', '6 m/s²'],
    correctIndex: 2,
    hint: 'Gunakan Hukum II Newton: F = m × a → a = F / m = 60 / 15.',
  },
  {
    id: 'sma_fis_2',
    level: 'SMA',
    subject: 'Fisika',
    category: 'SMA · Fisika',
    question:
      'Suatu gelombang sinyal merambat dengan cepat rambat 300 m/s dan panjang gelombang (λ) 15 meter. Berapakah frekuensinya?',
    options: ['15 Hz', '20 Hz', '25 Hz', '45 Hz'],
    correctIndex: 1,
    hint: 'Hubungan cepat rambat gelombang: v = λ × f → f = v / λ = 300 / 15.',
  },
  {
    id: 'sma_fis_3',
    level: 'SMA',
    subject: 'Fisika',
    category: 'SMA · Fisika',
    question:
      'Kotak kargo bermassa 2 kg berada di menara setinggi 20 meter (g = 10 m/s²). Berapakah energi potensial gravitasinya?',
    options: ['200 Joule', '300 Joule', '400 Joule', '800 Joule'],
    correctIndex: 2,
    hint: 'Rumus energi potensial: Ep = m × g × h = 2 × 10 × 20.',
  },
  {
    id: 'sma_fis_4',
    level: 'SMA',
    subject: 'Fisika',
    category: 'SMA · Fisika',
    question:
      'Kendaraan taktis bermassa 1.200 kg melaju lurus dengan kecepatan 15 m/s. Berapakah besar momentum liniernya?',
    options: ['12.000 kg·m/s', '15.000 kg·m/s', '18.000 kg·m/s', '24.000 kg·m/s'],
    correctIndex: 2,
    hint: 'Rumus momentum: p = m × v = 1.200 × 15.',
  },
  {
    id: 'sma_kim_1',
    level: 'SMA',
    subject: 'Kimia',
    category: 'SMA · Kimia',
    question:
      'Diketahui massa molekul relatif air (Mr H₂O) = 18 g/mol. Berapakah jumlah mol dalam 90 gram air murni?',
    options: ['3 mol', '4 mol', '5 mol', '6 mol'],
    correctIndex: 2,
    hint: 'Rumus stoikiometri mol: n = massa / Mr = 90 / 18.',
  },
  {
    id: 'sma_kim_2',
    level: 'SMA',
    subject: 'Kimia',
    category: 'SMA · Kimia',
    question:
      'Unsur Natrium (Na) memiliki nomor atom 11. Bagaimanakah konfigurasi elektron kulit (K, L, M) yang benar untuk atom Na netral?',
    options: ['2, 8, 1', '2, 7, 2', '2, 8, 2', '2, 6, 3'],
    correctIndex: 0,
    hint: 'Kulit K maksimal 2 elektron, kulit L maksimal 8 elektron, sisanya masuk ke kulit M.',
  },
  {
    id: 'sma_kim_3',
    level: 'SMA',
    subject: 'Kimia',
    category: 'SMA · Kimia',
    question:
      'Berdasarkan Hukum Kekekalan Massa Lavoisier, jika 12 gram karbon bereaksi habis dengan 32 gram oksigen dalam ruang tertutup membentuk CO₂, berapakah massa CO₂ yang dihasilkan?',
    options: ['20 gram', '32 gram', '44 gram', '48 gram'],
    correctIndex: 2,
    hint: 'Massa total zat sebelum reaksi sama dengan massa total zat sesudah reaksi (12 + 32).',
  },
  {
    id: 'sma_bio_1',
    level: 'SMA',
    subject: 'Biologi',
    category: 'SMA · Biologi',
    question:
      'Organel sel eukariotik yang dikenal sebagai pusat respirasi seluler untuk menghasilkan energi berupa ATP adalah...',
    options: ['Ribosom', 'Lisosom', 'Mitokondria', 'Badan Golgi'],
    correctIndex: 2,
    hint: 'Dijuluki "the powerhouse of the cell" dan memiliki membran ganda berlekuk (krista).',
  },
  {
    id: 'sma_bio_2',
    level: 'SMA',
    subject: 'Biologi',
    category: 'SMA · Biologi',
    question:
      'Persilangan monohibrid dominasi penuh antara dua individu heterozigot (Tt × Tt) menghasilkan perbandingan fenotipe Tinggi : Pendek sebesar...',
    options: ['1 : 1', '2 : 1', '3 : 1', '1 : 2 : 1'],
    correctIndex: 2,
    hint: 'Genotipenya TT, Tt, Tt, tt. Tiga di antaranya memiliki alel dominan T.',
  },
  {
    id: 'sma_bio_3',
    level: 'SMA',
    subject: 'Biologi',
    category: 'SMA · Biologi',
    question:
      'Pada tahap transkripsi sintesis protein, jika rantai DNA cetakan (template) berurutan A–T–G–C, maka urutan basa mRNA yang terbentuk adalah...',
    options: ['T–A–C–G', 'U–A–C–G', 'A–U–G–C', 'U–T–C–G'],
    correctIndex: 1,
    hint: 'Di RNA tidak ada Timin (T) melainkan Urasil (U): A→U, T→A, G→C, C→G.',
  },
  {
    id: 'sma_mat_5',
    level: 'SMA',
    subject: 'Matematika',
    category: 'SMA · Matematika',
    question:
      'Persamaan kuadrat x² - 7x + 12 = 0 memiliki akar-akar x₁ dan x₂. Berapakah nilai dari (x₁ + x₂) dan (x₁ × x₂) berturut-turut?',
    options: ['-7 dan 12', '7 dan 12', '7 dan -12', '12 dan 7'],
    correctIndex: 1,
    hint: 'Rumus Vieta: x₁ + x₂ = -b/a = -(-7)/1 = 7, dan x₁ × x₂ = c/a = 12/1.',
  },
  {
    id: 'sma_fis_5',
    level: 'SMA',
    subject: 'Fisika',
    category: 'SMA · Fisika',
    question:
      'Dua buah resistor masing-masing bernilai 10 Ω dirangkai secara PARALEL. Berapakah hambatan pengganti total rangkaian tersebut?',
    options: ['5 Ω', '10 Ω', '15 Ω', '20 Ω'],
    correctIndex: 0,
    hint: 'Untuk rangkaian paralel: 1/Rp = 1/10 + 1/10 = 2/10, sehingga Rp = 10/2.',
  },
  {
    id: 'sma_geo_1',
    level: 'SMA',
    subject: 'Geografi',
    category: 'SMA · Geografi',
    question:
      'Lapisan atmosfer Bumi yang mengandung lapisan ozon (O₃) untuk menyerap radiasi sinar ultraviolet berbahaya dari matahari adalah...',
    options: ['Troposfer', 'Stratosfer', 'Mesosfer', 'Termosfer'],
    correctIndex: 1,
    hint: 'Lapisan kedua atmosfer tepat di atas troposfer, tempat pesawat jet komersial biasa melintas.',
  },
  {
    id: 'sma_eko_1',
    level: 'SMA',
    subject: 'Ekonomi',
    category: 'SMA · Ekonomi',
    question:
      'Sesuai hukum permintaan (ceteris paribus), apabila harga suatu barang mengalami KENAIKAN, maka jumlah barang yang diminta konsumen akan...',
    options: ['Meningkat tajam', 'Tetap tidak berubah', 'Menurun / berkurang', 'Menjadi tak terbatas'],
    correctIndex: 2,
    hint: 'Hubungan harga dan jumlah permintaan bersifat berbanding terbalik.',
  },
  {
    id: 'sma_sej_1',
    level: 'SMA',
    subject: 'Sejarah',
    category: 'SMA · Sejarah',
    question:
      'Gagasan lima dasar negara yang diberi nama Pancasila disampaikan oleh Ir. Soekarno dalam sidang pertama BPUPKI pada tanggal...',
    options: ['29 Mei 1945', '1 Juni 1945', '22 Juni 1945', '18 Agustus 1945'],
    correctIndex: 1,
    hint: 'Tanggal tersebut diperingati setiap tahun sebagai Hari Lahir Pancasila.',
  },
  {
    id: 'sma_bin_1',
    level: 'SMA',
    subject: 'Logika & Bahasa',
    category: 'SMA · Logika & Bahasa',
    question:
      'Premis 1: Semua penyintas yang masuk laboratorium wajib memakai masker. Premis 2: Raka masuk ke dalam laboratorium. Kesimpulan silogisme yang sah adalah...',
    options: [
      'Raka mungkin memakai masker',
      'Raka wajib memakai masker',
      'Sebagian penyintas adalah Raka',
      'Raka tidak perlu masker saat keluar',
    ],
    correctIndex: 1,
    hint: 'Penarikan kesimpulan deduktif (Modus Ponens): jika A → B dan A terjadi, maka B pasti berlaku.',
  },
];

export const MISSION_PUZZLE_POOL: MissionPuzzleSpec[][] = [
  SMP_PUZZLE_BANK.slice(0, 5),
  SMP_PUZZLE_BANK.slice(5, 10),
  SMP_PUZZLE_BANK.slice(10, 15),
  SMP_PUZZLE_BANK.slice(15, 20),
  SMA_PUZZLE_BANK.slice(0, 5),
  SMA_PUZZLE_BANK.slice(5, 10),
  SMA_PUZZLE_BANK.slice(10, 15),
  SMA_PUZZLE_BANK.slice(15, 20),
];

export function pickPuzzleForMission(
  missionIndex: number,
  variantSeed = 0,
  mapId?: MapId,
): MissionPuzzleSpec {
  const mapOffset = mapId ? Math.max(0, MAP_ORDER.indexOf(mapId)) : 0;
  // Misi 1-4 (index 0..3) memakai bank soal SMP; Misi 5-8 (index 4..7) naik tingkat ke bank soal SMA
  const bank = missionIndex < 4 ? SMP_PUZZLE_BANK : SMA_PUZZLE_BANK;
  const idx = Math.abs(missionIndex * 3 + mapOffset * 5 + variantSeed) % bank.length;
  return bank[idx];
}

export function pickBossPuzzle(
  bossKillCount: number,
  seed = 0,
  mapId?: MapId,
): MissionPuzzleSpec {
  const mapOffset = mapId ? Math.max(0, MAP_ORDER.indexOf(mapId)) : 0;
  // Bergantian antara soal SMP dan SMA setiap mengeliminasi Zombie Bos
  const useSma = bossKillCount % 2 === 0;
  const bank = useSma ? SMA_PUZZLE_BANK : SMP_PUZZLE_BANK;
  const idx = Math.abs(bossKillCount * 7 + mapOffset * 3 + seed) % bank.length;
  return bank[idx];
}

export interface MinimapBlip {
  x: number;
  z: number;
  kind: 'zombie' | 'boss' | 'pickup' | 'collectible' | 'teammate' | 'objective' | 'vehicle' | 'portal';
}

export interface MissionProgress {
  index: number;
  totalCompleted: number;
  totalMissions: number;
  title: string;
  description: string;
  current: number;
  target: number;
  completedAll: boolean;
  objectiveX?: number;
  objectiveZ?: number;
  objectiveRadius?: number;
  objectiveLabel?: string;
  objectiveColor?: string;
  distanceMeters?: number;
  inObjectiveZone?: boolean;
}

export interface GameSettings {
  quality: GraphicsQuality;
  sfxVolume: number;
  musicVolume: number;
  sensitivity: number;
  controlMode: ControlMode;
  selectedMap: MapId;
  autoRotateMaps: boolean;
  selectedDifficulty: DifficultyId;
  selectedCharacter: CharacterId;
  selectedSkin: CharacterSkinId;
  cameraMode: CameraViewMode;
  weatherMode: WeatherMode;
}

export interface WeaponSlotHud {
  id: WeaponId;
  shortName: string;
  unlocked: boolean;
  unlockKills: number;
  ammoInMag: number;
  magSize: number;
  reserveAmmo: number;
}

export interface RemotePlayerSnapshot {
  id: string;
  name: string;
  color: string;
  characterId: CharacterId;
  skinId: CharacterSkinId;
  x: number;
  y: number;
  z: number;
  yaw: number;
  hp: number;
  maxHp: number;
  weaponId: WeaponId;
  level: number;
  kills: number;
  isMoving: boolean;
  isRunning: boolean;
  isCrouching: boolean;
  isDashing: boolean;
  alive: boolean;
}

export interface HudState {
  phase: GamePhase;
  introProgress: number;
  hp: number;
  maxHp: number;
  stamina: number;
  level: number;
  xp: number;
  xpToNext: number;
  selectedCharacter: CharacterId;
  selectedSkin: CharacterSkinId;
  currentWeapon: WeaponId;
  weapons: WeaponSlotHud[];
  ammoInMag: number;
  magSize: number;
  reserveAmmo: number;
  isReloading: boolean;
  reloadProgress: number;
  score: number;
  highScore: number;
  kills: number;
  headshots: number;
  wave: number;
  zombiesRemaining: number;
  difficulty: DifficultyId;
  currentMap: MapId;
  autoRotateMaps: boolean;
  mission: MissionProgress;
  waveBannerText: string | null;
  unlockBannerText: string | null;
  hitMarkerActive: boolean;
  isCriticalHit: boolean;
  damageFlashTick: number;
  pickupNotice: string | null;
  pointerLocked: boolean;
  isRunning: boolean;
  isCrouching: boolean;
  isJumping: boolean;
  isDashing: boolean;
  dashCooldownRatio: number; // 0 = ready, 1 = cooling down
  isAmmoLow: boolean;
  ammoRefillCooldownRatio: number; // 0 = ready, 1 = cooling down
  cameraMode: CameraViewMode;
  isAiming: boolean;
  isMultiplayer: boolean;
  roomCode: string | null;
  teammates: RemotePlayerSnapshot[];
  activeBoss: {
    name: string;
    hp: number;
    maxHp: number;
    skillWarning?: string | null;
  } | null;
  currentDistrict: string;
  playerX: number;
  playerZ: number;
  playerYaw: number;
  worldHalfSize: number;
  minimapBlips: MinimapBlip[];
  freeRoamMode: boolean;
  dayCount: number;
  timeOfDay: number;
  timeString: string;
  dayPhaseLabel: string;
  weather: WeatherType;
  weatherLabel: string;
  currentInterior: string | null;
  inVehicle: boolean;
  vehicleName: string | null;
  vehicleSpeedKmh: number;
  nearbyVehicleName: string | null;
  activePuzzle: ActiveMissionPuzzle | null;
  mapTravelOpen: boolean;
  nearPortalGate: boolean;
  visitedMaps: MapId[];
  mapMissionCompleted: Partial<Record<MapId, number>>;
  // 3D Action RPG State
  rpgMenuOpen: boolean;
  mp: number;
  maxMp: number;
  gold: number;
  statPoints: number;
  rpgStats: RpgStats;
  defense: number;
  critChancePct: number;
  damageBonusPct: number;
  equippedArmor: ArmorId;
  ownedArmors: ArmorId[];
  equippedRelic: RelicId;
  ownedRelics: RelicId[];
  weaponForageLevels: Record<WeaponId, number>;
  hpPotions: number;
  mpPotions: number;
  overdriveRemaining: number;
  skills: RpgSkillHudState[];
  combatTexts: FloatingCombatText[];
}

export interface RoomPlayerInfo {
  id: string;
  name: string;
  color: string;
  characterId: CharacterId;
  skinId: CharacterSkinId;
  isHost: boolean;
  alive: boolean;
  hp: number;
  maxHp: number;
  kills: number;
  score: number;
  level: number;
  weaponId: WeaponId;
}

export interface LobbyState {
  connected: boolean;
  roomCode: string | null;
  playerId: string | null;
  isHost: boolean;
  difficulty: DifficultyId;
  mapId: MapId;
  autoRotateMaps: boolean;
  started: boolean;
  players: RoomPlayerInfo[];
  error: string | null;
}

export const DEFAULT_SETTINGS: GameSettings = {
  quality: 'high',
  sfxVolume: 0.75,
  musicVolume: 0.45,
  sensitivity: 1.0,
  controlMode: 'auto',
  selectedMap: 'openworld',
  autoRotateMaps: false,
  selectedDifficulty: 'normal',
  selectedCharacter: 'raka',
  selectedSkin: 'rpd_officer',
  cameraMode: 'tps',
  weatherMode: 'dynamic',
};

export const INITIAL_HUD_STATE: HudState = {
  phase: 'intro',
  introProgress: 0,
  hp: 100,
  maxHp: 100,
  stamina: 100,
  level: 1,
  xp: 0,
  xpToNext: 100,
  selectedCharacter: 'raka',
  selectedSkin: 'rpd_officer',
  currentWeapon: 'pistol',
  weapons: WEAPON_ORDER.map((id) => ({
    id,
    shortName: WEAPONS[id].shortName,
    unlocked: id === 'pistol',
    unlockKills: WEAPONS[id].unlockKills,
    ammoInMag: WEAPONS[id].magSize,
    magSize: WEAPONS[id].magSize,
    reserveAmmo: WEAPONS[id].startReserve,
  })),
  ammoInMag: 12,
  magSize: 12,
  reserveAmmo: 72,
  isReloading: false,
  reloadProgress: 0,
  score: 0,
  highScore: 0,
  kills: 0,
  headshots: 0,
  wave: 1,
  zombiesRemaining: 0,
  difficulty: 'normal',
  currentMap: 'openworld',
  autoRotateMaps: false,
  mission: {
    index: 0,
    totalCompleted: 0,
    totalMissions: OPENWORLD_MISSIONS.length,
    title: OPENWORLD_MISSIONS[0].title,
    description: OPENWORLD_MISSIONS[0].description,
    current: 0,
    target: OPENWORLD_MISSIONS[0].target,
    completedAll: false,
  },
  waveBannerText: null,
  unlockBannerText: null,
  hitMarkerActive: false,
  isCriticalHit: false,
  damageFlashTick: 0,
  pickupNotice: null,
  pointerLocked: false,
  isRunning: false,
  isCrouching: false,
  isJumping: false,
  isDashing: false,
  dashCooldownRatio: 0,
  isAmmoLow: false,
  ammoRefillCooldownRatio: 0,
  cameraMode: 'tps',
  isAiming: false,
  isMultiplayer: false,
  roomCode: null,
  teammates: [],
  activeBoss: null,
  currentDistrict: 'Alun-Alun Kota',
  playerX: 0,
  playerZ: 4,
  playerYaw: Math.PI,
  worldHalfSize: 130,
  minimapBlips: [],
  freeRoamMode: false,
  dayCount: 1,
  timeOfDay: 0.34,
  timeString: '08:09',
  dayPhaseLabel: 'Pagi',
  weather: 'clear',
  weatherLabel: 'Cerah',
  currentInterior: null,
  inVehicle: false,
  vehicleName: null,
  vehicleSpeedKmh: 0,
  nearbyVehicleName: null,
  activePuzzle: null,
  mapTravelOpen: false,
  nearPortalGate: false,
  visitedMaps: ['openworld'],
  mapMissionCompleted: {},
  rpgMenuOpen: false,
  mp: 100,
  maxMp: 100,
  gold: 80,
  statPoints: 2,
  rpgStats: { str: 3, vit: 3, agi: 2, int: 2 },
  defense: 11,
  critChancePct: 12,
  damageBonusPct: 24,
  equippedArmor: 'starter_jacket',
  ownedArmors: ['starter_jacket'],
  equippedRelic: 'starter_badge',
  ownedRelics: ['starter_badge'],
  weaponForageLevels: { pistol: 0, smg: 0, shotgun: 0, rifle: 0 },
  hpPotions: 2,
  mpPotions: 1,
  overdriveRemaining: 0,
  skills: RPG_SKILL_ORDER.map((id) => ({
    id,
    name: RPG_SKILLS[id].name,
    shortName: RPG_SKILLS[id].shortName,
    hotkey: RPG_SKILLS[id].hotkey,
    mpCost: RPG_SKILLS[id].mpCost,
    cooldownRemaining: 0,
    maxCooldown: RPG_SKILLS[id].cooldown,
    accentColor: RPG_SKILLS[id].accentColor,
  })),
  combatTexts: [],
};
