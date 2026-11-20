import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import {
  MultiplayerClient,
  ServerSnapshotPayload,
} from '../network/multiplayerClient';
import {
  DIFFICULTY_TUNING,
  findRandomZombieSpawnPos,
  getBuildingInteriorAt,
  getDistrictNameAt,
  MAP_LAYOUTS,
  pickRandomBossType,
  pickRandomZombieType,
  resolveCircleCollisionsShared,
} from '../shared/mapData';
import {
  ActiveMissionPuzzle,
  ARMOR_ORDER,
  ArmorId,
  CameraViewMode,
  CHARACTERS,
  CharacterId,
  CharacterSkinId,
  DEFAULT_SETTINGS,
  DifficultyId,
  FloatingCombatText,
  formatGameTime,
  GamePhase,
  GameSettings,
  getMissionsForMap,
  getWeaponForgeCost,
  HudState,
  INITIAL_HUD_STATE,
  LobbyState,
  MAP_ORDER,
  MAPS,
  MapId,
  MinimapBlip,
  MissionDef,
  MissionProgress,
  pickBossPuzzle,
  pickPuzzleForMission,
  PickupType,
  RELIC_ORDER,
  RelicId,
  RemotePlayerSnapshot,
  resolveSkinForCharacter,
  RPG_ARMORS,
  RPG_POTION_PRICES,
  RPG_RELICS,
  RPG_SKILL_ORDER,
  RPG_SKILLS,
  RpgSkillHudState,
  RpgSkillId,
  RpgStatKey,
  RpgStats,
  WEAPON_FORGE_MAX,
  WEAPON_ORDER,
  WEAPONS,
  WeaponId,
  WeaponSlotHud,
  WEATHER_LABELS,
  WEATHER_ORDER,
  WeatherType,
  ZOMBIE_APPEARANCE_INFO,
  ZOMBIE_APPEARANCES,
  ZombieAppearance,
  ZombieSkillState,
  ZombieVariant,
} from '../types/game';
import { SoundEngine } from './audio';
import {
  animatePlayerRig,
  createFirstPersonViewModel,
  createPickupModel,
  createPlayerModel,
  createZombieModel,
  disposeZombieRig,
  FirstPersonRig,
  PlayerRig,
  setFirstPersonWeapon,
  setPlayerWeaponModel,
  ZombieRig,
} from './characterModels';
import { BuiltCity, buildMapEnvironment, DriveableVehicleMesh } from './cityBuilder';
import { CityTextures, createCityTextures } from './textures';

interface ZombieEntity {
  id: number;
  variant: ZombieVariant;
  appearance: ZombieAppearance;
  rig: ZombieRig;
  position: THREE.Vector3;
  targetPos: THREE.Vector3;
  rotationY: number;
  targetYaw: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  scoreValue: number;
  xpValue: number;
  radius: number;
  attackCooldown: number;
  attackAnim: number;
  attackHand: 1 | -1;
  hitFlash: number;
  hitFlinch: number;
  walkPhase: number;
  moveWeight: number;
  strideOffset: number;
  dead: boolean;
  deathTimer: number;
  wanderAngle: number;
  skillState: ZombieSkillState;
  skillTimer: number;
  skillCooldown: number;
  skillDirX: number;
  skillDirZ: number;
  skillHitDealt: boolean;
  telegraphRing?: THREE.Mesh;
}

interface BossProjectileEntity {
  id: number;
  mesh: THREE.Group;
  position: THREE.Vector3;
  vx: number;
  vz: number;
  damage: number;
  life: number;
  networked: boolean;
}

interface ShockwaveEffect {
  mesh: THREE.Mesh;
  life: number;
  maxLife: number;
  maxScale: number;
}

interface RemotePlayerEntity {
  id: string;
  name: string;
  color: string;
  characterId: CharacterId;
  skinId: CharacterSkinId;
  rig: PlayerRig;
  position: THREE.Vector3;
  targetPos: THREE.Vector3;
  yaw: number;
  targetYaw: number;
  weaponId: WeaponId;
  isMoving: boolean;
  isRunning: boolean;
  isCrouching: boolean;
  isDashing: boolean;
  crouchBlend: number;
  speedRatio: number;
  walkPhase: number;
  muzzleTimer: number;
  alive: boolean;
  hp: number;
  maxHp: number;
  level: number;
  kills: number;
}

interface PickupEntity {
  id: number;
  type: PickupType;
  mesh: THREE.Group;
  position: THREE.Vector3;
  age: number;
}

interface IntelPickupEntity {
  id: number;
  mesh: THREE.Group;
  position: THREE.Vector3;
  age: number;
}

interface TracerBeam {
  mesh: THREE.Mesh;
  life: number;
  maxLife: number;
}

interface ParticleBurst {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  scaleStart: number;
}

interface WeaponAmmoState {
  unlocked: boolean;
  ammoInMag: number;
  reserveAmmo: number;
}

interface VehicleEntity {
  id: string;
  name: string;
  kind: DriveableVehicleMesh['def']['kind'];
  maxSpeed: number;
  accel: number;
  mesh: DriveableVehicleMesh;
  x: number;
  z: number;
  yaw: number;
  targetX: number;
  targetZ: number;
  targetYaw: number;
  speed: number;
  steerAngle: number;
  wheelSpin: number;
  driverId: string | null;
}

const _vecA = new THREE.Vector3();
const _vecB = new THREE.Vector3();
const _vecC = new THREE.Vector3();
const _shotDir = new THREE.Vector3();
const _camDesired = new THREE.Vector3();
const _camLook = new THREE.Vector3();
const _centerNdc = new THREE.Vector2(0, 0);
const _raycaster = new THREE.Raycaster();
const _skyNightColor = new THREE.Color(0x070b14);
const _skyDawnColor = new THREE.Color(0x4b2f3d);
const _skyDayColor = new THREE.Color(0x4b6f94);
const _skyStormColor = new THREE.Color(0x16202e);
const _skyWorkColor = new THREE.Color();
const _lightNightColor = new THREE.Color(0x8bb8f8);
const _lightDawnColor = new THREE.Color(0xffb478);
const _lightDayColor = new THREE.Color(0xfff4e0);
const _lightWorkColor = new THREE.Color();
const _hemiTopNight = new THREE.Color(0x1e2c48);
const _hemiTopDay = new THREE.Color(0x8ec5f8);
const _hemiBotNight = new THREE.Color(0x14131c);
const _hemiBotDay = new THREE.Color(0x3a3730);

const _projVec = new THREE.Vector3();
const HIGH_SCORE_KEY = 'zombie_survival_last_stand_highscore';

export class GameEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private composer: EffectComposer | null = null;
  private bloomPass: UnrealBloomPass | null = null;
  private isSoftwareGl: boolean;
  private textures: CityTextures;
  private city: BuiltCity;
  private player: PlayerRig;
  private fpsRig: FirstPersonRig;
  private hemiLight: THREE.HemisphereLight;
  private moonLight: THREE.DirectionalLight;
  private rimLight: THREE.DirectionalLight;
  private flashlight: THREE.SpotLight;
  private flashlightTarget: THREE.Object3D;
  private dustPoints: THREE.Points;
  private rainPoints!: THREE.Points;
  public audio: SoundEngine;
  public multiplayer: MultiplayerClient;

  private frameId = 0;
  private disposed = false;
  private lastTime = performance.now();

  private phase: GamePhase = 'intro';
  private introTimer = 0;
  private readonly introDuration = 6.8;
  private introEmitTimer = 0;
  private settings: GameSettings = { ...DEFAULT_SETTINGS };
  private onHudUpdate: (hud: HudState) => void;
  private onLobbyUpdate: (lobby: LobbyState) => void;
  private hudEmitTimer = 0;

  // Mode & Map
  private isMultiplayer = false;
  private difficulty: DifficultyId = 'normal';
  private currentMap: MapId = 'openworld';
  private autoRotateMaps = false;
  private freeRoamMode = false;
  private roomCode: string | null = null;
  private mpSendTimer = 0;
  private spectatingDowned = false;

  // Player state
  private playerPos = new THREE.Vector3(0, 0, 4);
  private playerY = 0;
  private playerVelY = 0;
  private playerYaw = Math.PI;
  private camYaw = Math.PI;
  private camPitch = 0.16;
  private cameraMode: CameraViewMode = 'tps';
  private tpsZoomDist = 4.3;
  private isAiming = false;
  private aimBlend = 0;
  private camCurrentPos = new THREE.Vector3(0, 3.2, 9);
  private camCurrentLook = new THREE.Vector3(0, 1.5, 0);
  private camShake = 0;
  private walkPhase = 0;
  private playerVelX = 0;
  private playerVelZ = 0;
  private moveLocalFwd = 0;
  private moveLocalRight = 0;
  private playerTurnVel = 0;
  private landingSquash = 0;
  private lastFootstepStep = 0;
  private fpsLookSwayX = 0;
  private fpsLookSwayY = 0;
  private recoilAnim = 0;
  private muzzleTimer = 0;

  // Jump, Crouch & Dash kinematics
  private isCrouching = false;
  private crouchBlend = 0;
  private dashTimer = 0;
  private dashCooldown = 0;
  private dashDir = new THREE.Vector3(0, 0, -1);
  private runToggleActive = false;
  private ammoRefillCooldown = 0;

  private hp = 100;
  private maxHp = 100;
  private stamina = 100;
  private level = 1;
  private xp = 0;
  private xpToNext = 100;

  private currentWeapon: WeaponId = 'pistol';
  private weaponState: Record<WeaponId, WeaponAmmoState> = {
    pistol: { unlocked: true, ammoInMag: 12, reserveAmmo: 72 },
    smg: { unlocked: false, ammoInMag: 28, reserveAmmo: 140 },
    shotgun: { unlocked: false, ammoInMag: 8, reserveAmmo: 48 },
    rifle: { unlocked: false, ammoInMag: 30, reserveAmmo: 150 },
  };
  private isReloading = false;
  private reloadTimer = 0;
  private fireCooldown = 0;

  private score = 0;
  private highScore = 0;
  private kills = 0;
  private headshots = 0;
  private wave = 1;
  private zombiesToSpawn = 0;
  private bossesToSpawn = 0;
  private bossSpawnTimer = 0;
  private spawnTimer = 0;
  private waveBreakTimer = 0;
  private waveBannerText: string | null = null;
  private waveBannerTimer = 0;
  private unlockBannerText: string | null = null;
  private unlockBannerTimer = 0;
  private hitMarkerTimer = 0;
  private isCriticalHit = false;
  private damageFlashTick = 0;
  private pickupNotice: string | null = null;
  private pickupNoticeTimer = 0;

  // Solo Mission & Riddle Gate state (persisted per map when traveling across all 10 zones)
  private missionIndex = 0;
  private missionProgressValue = 0;
  private missionCompletedAll = false;
  private mapMissionStates: Partial<Record<MapId, { index: number; progress: number; completedAll: boolean }>> = {};
  private serverMapMissionCompleted: Partial<Record<MapId, number>> = {};
  private serverMissionState: MissionProgress | null = null;
  private serverZombiesRemaining = 0;
  private activePuzzle: ActiveMissionPuzzle | null = null;
  private bossKills = 0;
  private pendingBossRewardName: string | null = null;
  private mapTravelOpen = false;
  private visitedMaps = new Set<MapId>(['openworld']);

  // 3D Action RPG State (Attributes, Mana, Gold, Equipment, Weapon Forge, Skills, Combat Text)
  private rpgMenuOpen = false;
  private mp = 100;
  private maxMp = 100;
  private gold = 80;
  private statPoints = 2;
  private rpgStats: RpgStats = { str: 3, vit: 3, agi: 2, int: 2 };
  private equippedArmor: ArmorId = 'starter_jacket';
  private ownedArmors = new Set<ArmorId>(['starter_jacket']);
  private equippedRelic: RelicId = 'starter_badge';
  private ownedRelics = new Set<RelicId>(['starter_badge']);
  private weaponForgeLevels: Record<WeaponId, number> = {
    pistol: 0,
    smg: 0,
    shotgun: 0,
    rifle: 0,
  };
  private hpPotions = 2;
  private mpPotions = 1;
  private healRegenTimer = 0;
  private overdriveTimer = 0;
  private skillCooldowns: Record<RpgSkillId, number> = {
    shockwave: 0,
    heal: 0,
    overdrive: 0,
  };
  private rpgRings: Array<{
    mesh: THREE.Mesh;
    age: number;
    maxAge: number;
    startScale: number;
    endScale: number;
    followPlayer: boolean;
    riseSpeed: number;
  }> = [];
  private overdriveAuraRing: THREE.Mesh | null = null;
  private worldCombatTexts: Array<{
    id: number;
    worldPos: THREE.Vector3;
    text: string;
    kind: FloatingCombatText['kind'];
    age: number;
    maxAge: number;
  }> = [];
  private nextCombatTextId = 1;

  // Vehicles, Day-Night Cycle & Dynamic Weather
  private vehicles: VehicleEntity[] = [];
  private activeVehicleId: string | null = null;
  private nearbyVehicleId: string | null = null;
  private vehicleRamCooldowns = new Map<number, number>();
  private dayCount = 1;
  private timeOfDay = 0.34;
  private currentWeather: WeatherType = 'clear';
  private weatherTimer = 38;
  private thunderTimer = 9;
  private lightningFlash = 0;

  // Entities
  private nextEntityId = 1;
  private zombies: ZombieEntity[] = [];
  private remotePlayers = new Map<string, RemotePlayerEntity>();
  private pickups: PickupEntity[] = [];
  private intelPickups: IntelPickupEntity[] = [];
  private tracers: TracerBeam[] = [];
  private particles: ParticleBurst[] = [];
  private bossProjectiles: BossProjectileEntity[] = [];
  private shockwaves: ShockwaveEffect[] = [];

  // 3D Open-World Objective Waypoint Beacon
  private objectiveBeaconGroup!: THREE.Group;
  private objectiveOuterRing!: THREE.Mesh;
  private objectiveProgressRing!: THREE.Mesh;
  private objectivePillar!: THREE.Mesh;
  private objectiveDiamond!: THREE.Mesh;

  private tracerGeo = new THREE.CylinderGeometry(0.022, 0.022, 1, 6);
  private particleGeo = new THREE.BoxGeometry(0.14, 0.14, 0.14);
  private bossOrbGeo = new THREE.SphereGeometry(0.24, 12, 10);
  private bossOrbSpikeGeo = new THREE.OctahedronGeometry(0.34, 0);
  private shockwaveGeo = new THREE.RingGeometry(0.76, 1.0, 32);

  // Inputs
  private keys: Record<string, boolean> = {};
  private mouseDown = false;
  private touchShootHeld = false;
  private touchRunHeld = false;
  private joyX = 0;
  private joyY = 0;
  private pointerLocked = false;
  private isDraggingLook = false;
  private lastMouseX = 0;
  private lastMouseY = 0;

  constructor(
    container: HTMLElement,
    initialSettings: GameSettings,
    onHudUpdate: (hud: HudState) => void,
    onLobbyUpdate: (lobby: LobbyState) => void,
    onContextLost?: () => void,
  ) {
    this.container = container;
    this.settings = { ...initialSettings };
    this.cameraMode = initialSettings.cameraMode ?? 'tps';
    this.difficulty = initialSettings.selectedDifficulty ?? 'normal';
    this.currentMap = initialSettings.selectedMap;
    this.autoRotateMaps = initialSettings.autoRotateMaps;
    this.onHudUpdate = onHudUpdate;
    this.onLobbyUpdate = onLobbyUpdate;
    this.audio = new SoundEngine();
    this.audio.setVolumes(this.settings.sfxVolume, this.settings.musicVolume);

    try {
      const saved = localStorage.getItem(HIGH_SCORE_KEY);
      if (saved) this.highScore = Math.max(0, parseInt(saved, 10) || 0);
    } catch {
      this.highScore = 0;
    }

    // Multiplayer client setup
    this.multiplayer = new MultiplayerClient({
      onLobbyChange: (lobby) => {
        this.roomCode = lobby.roomCode;
        this.onLobbyUpdate(lobby);
      },
      onMatchStarted: (mapId, autoRotate, difficulty) => {
        this.startMultiplayerMatch(mapId, autoRotate, difficulty);
      },
      onSnapshot: (snap) => this.applyServerSnapshot(snap),
      onRemoteShot: (data) => this.spawnRemoteShotEffects(data),
      onZombieKilled: (data) => this.handleServerZombieKilled(data),
      onBarrelExploded: (data) => this.handleServerBarrelExploded(data),
      onPlayerHurt: (newHp) => {
        this.hp = newHp;
        this.damageFlashTick++;
        this.camShake = Math.max(this.camShake, 0.25);
        this.audio.playPlayerHurt();
        if (this.hp <= 0) {
          this.spectatingDowned = true;
          this.player.root.visible = false;
        }
        this.emitHud();
      },
      onPlayerLevelUp: (lvl, maxHp, hp) => {
        this.level = lvl;
        this.maxHp = maxHp;
        this.hp = hp;
        this.audio.playLevelUp();
        this.showUnlockBanner(`LEVEL UP! LEVEL ${lvl} (+10% DAMAGE · +20 HP)`);
      },
      onPickupConfirmed: (pickupType, newHp) => {
        this.handlePickupGrant(pickupType, newHp);
        this.emitHud();
      },
      onMissionCompleted: (title, rewardXp, rewardScore) => {
        this.audio.playWeaponUnlock();
        this.showUnlockBanner(`MISI SELESAI: ${title} (+${rewardXp} XP · +${rewardScore} SKOR)`);
      },
      onMapChanged: (nextMap, waveNum) => {
        this.activeVehicleId = null;
        this.mapTravelOpen = false;
        this.loadMap(nextMap);
        this.visitedMaps.add(nextMap);
        this.playerPos.set(0, 0, 4);
        this.playerY = 0;
        this.playerVelY = 0;
        this.player.root.position.set(0, 0, 4);
        this.player.root.visible = !this.spectatingDowned && this.cameraMode !== 'fps';
        this.fpsRig.root.visible = !this.spectatingDowned && this.cameraMode === 'fps';
        this.audio.playWaveBanner();
        this.showWaveBanner(`GELOMBANG ${waveNum} · PETA: ${MAPS[nextMap].name.toUpperCase()}`);
        this.emitHud();
      },
      onWaveStarted: (waveNum) => {
        this.wave = waveNum;
        if (this.spectatingDowned && this.hp <= 0) {
          this.spectatingDowned = false;
          this.hp = Math.round(this.maxHp * 0.5);
          this.player.root.visible = true;
        }
        this.audio.playWaveBanner();
        this.showWaveBanner(`GELOMBANG ${waveNum} — BERTAHAN HIDUP`);
      },
      onWaveCleared: (waveNum) => {
        this.showWaveBanner(`GELOMBANG ${waveNum} SELESAI! (+${waveNum * 150} SKOR)`);
      },
      onBossSpawned: (appearance) => {
        this.audio.playZombieGroan(0.52);
        const bossInfo = ZOMBIE_APPEARANCE_INFO[appearance];
        this.showUnlockBanner(`PERINGATAN ZOMBIE BOS: ${bossInfo.name.toUpperCase()}!`);
      },
      onZombieAttack: (zombieId) => {
        const lz = this.zombies.find((z) => z.id === zombieId);
        if (lz && !lz.dead) {
          lz.attackAnim = 1;
          lz.attackHand = lz.attackHand === 1 ? -1 : 1;
        }
      },
      onBossSkill: (data) => {
        const lz = this.zombies.find((z) => z.id === data.zombieId);
        if (data.stage === 'windup') {
          this.audio.playBossSkillWindup();
          if (lz && !lz.dead) {
            lz.skillState = 'windup';
            lz.skillTimer =
              data.appearance === 'boss_tyrant'
                ? 0.75
                : data.appearance === 'boss_bioweapon'
                  ? 0.65
                  : 0.7;
            lz.skillDirX = data.dirX;
            lz.skillDirZ = data.dirZ;
            this.spawnBossTelegraph(lz);
          }
        } else {
          if (lz) {
            this.clearZombieTelegraph(lz);
            lz.skillState = 'active';
            lz.skillTimer =
              data.appearance === 'boss_tyrant'
                ? 0.45
                : data.appearance === 'boss_bioweapon'
                  ? 0.55
                  : 0.4;
          }
          const dToPlayer = Math.hypot(data.x - this.playerPos.x, data.z - this.playerPos.z);
          if (data.appearance === 'boss_tyrant') {
            this.audio.playBossSlam();
            this.spawnBossShockwave(data.x, data.z, 5.6, 0xf97316);
            this.spawnParticles(_vecA.set(data.x, 0.35, data.z), 0xf97316, 16, 8.2, 1.35);
            this.camShake = Math.max(this.camShake, Math.max(0.12, 0.55 - dToPlayer * 0.025));
          } else if (data.appearance === 'boss_bioweapon') {
            this.audio.playBossCharge();
            this.spawnParticles(_vecA.set(data.x, 1.0, data.z), 0xdc2626, 12, 6.5, 1.1);
          } else {
            this.audio.playBossProjectile();
            this.spawnParticles(_vecA.set(data.x, 1.35, data.z), 0xbe123c, 12, 5.2, 1.0);
          }
        }
      },
      onMatchGameOver: () => {
        this.handleGameOver();
      },
      onMatchVictory: () => {
        this.triggerVictory();
      },
      onFreeRoamStarted: () => {
        this.freeRoamMode = true;
        this.spectatingDowned = false;
        this.player.root.visible = this.cameraMode !== 'fps' && !this.activeVehicleId;
        this.phase = 'playing';
        this.showUnlockBanner('MODE FREE-ROAM AKTIF — JELAJAHI KOTA SEPUASNYA!');
        this.requestPointerLockSafe();
        this.emitHud();
      },
      onPuzzleWrong: (feedback, wrongAttempts) => {
        if (this.activePuzzle) {
          this.activePuzzle = {
            ...this.activePuzzle,
            feedback,
            wrongAttempts,
          };
          this.audio.playPuzzleFail();
          this.emitHud();
        }
      },
    });

    this.isSoftwareGl = (() => {
      const probe = document.createElement('canvas').getContext('webgl2');
      if (!probe) return true;
      const ext = probe.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
      const gpu = String(probe.getParameter(param));
      probe.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl && this.settings.quality !== 'low',
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.16;
    this.applyQualitySettings();
    this.renderer.setSize(
      container.clientWidth || window.innerWidth,
      container.clientHeight || window.innerHeight,
    );

    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    container.appendChild(this.renderer.domElement);

    this.renderer.domElement.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      onContextLost?.();
    });

    this.scene = new THREE.Scene();
    const mapSpec = MAPS[this.currentMap];
    this.scene.background = new THREE.Color(mapSpec.fogColor);
    this.scene.fog = new THREE.FogExp2(mapSpec.fogColor, mapSpec.fogDensity);

    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(65, w / h, 0.08, 380);
    this.scene.add(this.camera);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.85;
    pmrem.dispose();

    this.hemiLight = new THREE.HemisphereLight(mapSpec.skyTopColor, mapSpec.skyBottomColor, 0.98);
    this.scene.add(this.hemiLight);

    this.moonLight = new THREE.DirectionalLight(mapSpec.moonColor, 1.92);
    this.moonLight.position.set(22, 34, 18);
    this.moonLight.castShadow = !this.isSoftwareGl && this.settings.quality !== 'low';
    const initialShadowSize = this.settings.quality === 'high' ? 2048 : 1024;
    this.moonLight.shadow.mapSize.set(initialShadowSize, initialShadowSize);
    this.moonLight.shadow.camera.near = 2;
    this.moonLight.shadow.camera.far = 95;
    this.moonLight.shadow.camera.left = -28;
    this.moonLight.shadow.camera.right = 28;
    this.moonLight.shadow.camera.top = 28;
    this.moonLight.shadow.camera.bottom = -28;
    this.moonLight.shadow.bias = -0.0005;
    this.moonLight.shadow.normalBias = 0.02;
    this.moonLight.shadow.radius = 2.6;
    this.scene.add(this.moonLight);
    this.scene.add(this.moonLight.target);

    this.rimLight = new THREE.DirectionalLight(mapSpec.rimColor, 0.56);
    this.rimLight.position.set(-24, 16, -24);
    this.scene.add(this.rimLight);

    // HD Post-Processing Pipeline (GPU only, safely disabled on software WebGL)
    if (!this.isSoftwareGl) {
      this.composer = new EffectComposer(this.renderer);
      this.composer.setPixelRatio(this.renderer.getPixelRatio());
      this.composer.setSize(w, h);
      this.composer.addPass(new RenderPass(this.scene, this.camera));
      this.bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), 0.34, 0.45, 0.86);
      this.bloomPass.enabled = this.settings.quality === 'high';
      this.composer.addPass(this.bloomPass);
      this.composer.addPass(new OutputPass());
    }

    // Tactical Weapon Flashlight
    this.flashlight = new THREE.SpotLight(0xfff1d6, 0, 38, Math.PI / 6.2, 0.62, 1.45);
    this.flashlight.castShadow = false;
    this.flashlightTarget = new THREE.Object3D();
    this.scene.add(this.flashlight);
    this.scene.add(this.flashlightTarget);
    this.flashlight.target = this.flashlightTarget;

    this.textures = createCityTextures(this.renderer);
    this.city = buildMapEnvironment(this.currentMap, this.textures);
    this.scene.add(this.city.group);
    this.syncVehiclesFromCity();

    // Ambient Drifting Ash & Dust Motes
    const dustCount = 260;
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 76;
      dustPos[i * 3 + 1] = 0.4 + Math.random() * 8.5;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 76;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      map: this.textures.dustSprite,
      color: 0xcbd5e1,
      size: 0.24,
      transparent: true,
      opacity: 0.36,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.dustPoints = new THREE.Points(dustGeo, dustMat);
    this.scene.add(this.dustPoints);

    // Dynamic Rain & Storm Streaks
    const rainCount = 720;
    const rainPos = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount; i++) {
      rainPos[i * 3] = (Math.random() - 0.5) * 68;
      rainPos[i * 3 + 1] = Math.random() * 22;
      rainPos[i * 3 + 2] = (Math.random() - 0.5) * 68;
    }
    const rainGeo = new THREE.BufferGeometry();
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
    const rainMat = new THREE.PointsMaterial({
      map: this.textures.dustSprite,
      color: 0xbae6fd,
      size: 0.22,
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
    });
    this.rainPoints = new THREE.Points(rainGeo, rainMat);
    this.rainPoints.visible = false;
    this.scene.add(this.rainPoints);

    const initialSkin = resolveSkinForCharacter(
      this.settings.selectedCharacter,
      this.settings.selectedSkin,
    );
    this.settings.selectedSkin = initialSkin;
    this.player = createPlayerModel(
      this.textures.contactShadow,
      this.settings.selectedCharacter,
      undefined,
      undefined,
      initialSkin,
    );
    this.player.root.position.set(0, 0, 4);
    this.player.root.rotation.y = Math.PI;
    this.player.root.visible = true;
    this.scene.add(this.player.root);

    this.fpsRig = createFirstPersonViewModel(this.settings.selectedCharacter, initialSkin);
    this.fpsRig.root.visible = false;
    this.camera.add(this.fpsRig.root);

    this.initObjectiveBeacon();
    this.tracerGeo.rotateX(Math.PI / 2);
    this.shockwaveGeo.rotateX(-Math.PI / 2);
    this.spawnMenuShowcaseZombies();

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.bindEvents();
    this.emitHud();
    this.startLoop();
  }

  private applyQualitySettings(): void {
    const cap =
      this.settings.quality === 'high' ? 2.0 : this.settings.quality === 'medium' ? 1.35 : 1.0;
    const pixelRatio = this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, cap);
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl && this.settings.quality !== 'low';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    if (this.moonLight) {
      this.moonLight.castShadow = !this.isSoftwareGl && this.settings.quality !== 'low';
      const targetSize = this.settings.quality === 'high' ? 2048 : 1024;
      if (this.moonLight.shadow.mapSize.width !== targetSize) {
        this.moonLight.shadow.mapSize.set(targetSize, targetSize);
        this.moonLight.shadow.map?.dispose();
        this.moonLight.shadow.map = null;
      }
    }
    if (this.composer) {
      const w = this.container.clientWidth || window.innerWidth;
      const h = this.container.clientHeight || window.innerHeight;
      this.composer.setPixelRatio(pixelRatio);
      this.composer.setSize(w, h);
    }
    if (this.bloomPass) {
      this.bloomPass.enabled = !this.isSoftwareGl && this.settings.quality === 'high';
    }
  }

  public updateSettings(next: GameSettings): void {
    const resolvedSkin = resolveSkinForCharacter(next.selectedCharacter, next.selectedSkin);
    const normalizedNext: GameSettings = { ...next, selectedSkin: resolvedSkin };
    const mapChanged = normalizedNext.selectedMap !== this.currentMap && this.phase === 'menu';
    const charChanged = normalizedNext.selectedCharacter !== this.settings.selectedCharacter;
    const skinChanged = normalizedNext.selectedSkin !== this.settings.selectedSkin;
    const camChanged = normalizedNext.cameraMode !== this.settings.cameraMode;
    this.settings = normalizedNext;
    this.autoRotateMaps = normalizedNext.autoRotateMaps;
    if (this.phase === 'menu' || this.phase === 'intro' || this.phase === 'lobby') {
      this.difficulty = normalizedNext.selectedDifficulty ?? 'normal';
    }
    if (camChanged) {
      this.cameraMode = normalizedNext.cameraMode;
    }
    this.audio.setVolumes(normalizedNext.sfxVolume, normalizedNext.musicVolume);
    this.applyQualitySettings();
    if (charChanged || skinChanged) {
      this.rebuildPlayerRig(normalizedNext.selectedCharacter, normalizedNext.selectedSkin);
    }
    if (mapChanged) {
      this.loadMap(normalizedNext.selectedMap);
      this.spawnMenuShowcaseZombies();
    }
    this.emitHud();
  }

  private disposeGroup(group: THREE.Group): void {
    group.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const m = obj as THREE.Mesh;
        m.geometry?.dispose();
        if (Array.isArray(m.material)) m.material.forEach((mat) => mat.dispose());
        else m.material?.dispose();
      }
    });
  }

  private rebuildPlayerRig(characterId: CharacterId, skinId: CharacterSkinId): void {
    const wasVisible = this.player?.root.visible ?? false;
    if (this.player) {
      this.scene.remove(this.player.root);
      this.disposeGroup(this.player.root);
    }
    this.player = createPlayerModel(
      this.textures.contactShadow,
      characterId,
      undefined,
      undefined,
      skinId,
    );
    this.player.root.position.set(this.playerPos.x, this.playerY, this.playerPos.z);
    this.player.root.rotation.y = this.playerYaw;
    this.player.root.visible = wasVisible;
    setPlayerWeaponModel(this.player, this.currentWeapon);
    this.scene.add(this.player.root);

    const wasFpsVisible = this.fpsRig?.root.visible ?? false;
    if (this.fpsRig) {
      this.camera.remove(this.fpsRig.root);
      this.disposeGroup(this.fpsRig.root);
    }
    this.fpsRig = createFirstPersonViewModel(characterId, skinId);
    this.fpsRig.root.visible = wasFpsVisible;
    setFirstPersonWeapon(this.fpsRig, this.currentWeapon);
    this.camera.add(this.fpsRig.root);
  }

  private syncVehiclesFromCity(): void {
    this.activeVehicleId = null;
    this.nearbyVehicleId = null;
    this.vehicleRamCooldowns.clear();
    this.vehicles = this.city.vehicles.map((vm) => ({
      id: vm.def.id,
      name: vm.def.name,
      kind: vm.def.kind,
      maxSpeed: vm.def.maxSpeed,
      accel: vm.def.accel,
      mesh: vm,
      x: vm.def.x,
      z: vm.def.z,
      yaw: vm.def.rotY,
      targetX: vm.def.x,
      targetZ: vm.def.z,
      targetYaw: vm.def.rotY,
      speed: 0,
      steerAngle: 0,
      wheelSpin: 0,
      driverId: null,
    }));
  }

  public loadMap(mapId: MapId): void {
    this.currentMap = mapId;
    const spec = MAPS[mapId];
    this.scene.background = new THREE.Color(spec.fogColor);
    this.scene.fog = new THREE.FogExp2(spec.fogColor, spec.fogDensity);
    this.hemiLight.color.setHex(spec.skyTopColor);
    this.hemiLight.groundColor.setHex(spec.skyBottomColor);
    this.moonLight.color.setHex(spec.moonColor);
    this.rimLight.color.setHex(spec.rimColor);

    if (this.city) {
      this.scene.remove(this.city.group);
      this.disposeGroup(this.city.group);
    }
    this.city = buildMapEnvironment(mapId, this.textures);
    this.scene.add(this.city.group);
    this.syncVehiclesFromCity();
  }

  private resetPlayerStats(): void {
    this.playerPos.set(0, 0, 4);
    this.playerY = 0;
    this.playerVelY = 0;
    this.playerVelX = 0;
    this.playerVelZ = 0;
    this.moveLocalFwd = 0;
    this.moveLocalRight = 0;
    this.playerTurnVel = 0;
    this.landingSquash = 0;
    this.lastFootstepStep = 0;
    this.fpsLookSwayX = 0;
    this.fpsLookSwayY = 0;
    this.isCrouching = false;
    this.crouchBlend = 0;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.runToggleActive = false;
    this.ammoRefillCooldown = 0;
    this.playerYaw = Math.PI;
    this.camYaw = Math.PI;
    this.camPitch = 0.12;
    this.cameraMode = this.settings.cameraMode ?? 'tps';
    this.tpsZoomDist = 4.3;
    this.isAiming = false;
    this.aimBlend = 0;
    this.player.root.position.set(0, 0, 4);
    this.player.root.rotation.y = this.playerYaw;
    this.player.root.visible = this.cameraMode !== 'fps';
    this.fpsRig.root.visible = this.cameraMode === 'fps';
    this.spectatingDowned = false;

    const baseStats = CHARACTERS[this.settings.selectedCharacter]?.baseStats ?? {
      str: 3,
      vit: 3,
      agi: 2,
      int: 2,
    };
    this.rpgMenuOpen = false;
    this.rpgStats = { ...baseStats };
    this.statPoints = 2;
    this.gold = 80;
    this.equippedArmor = 'starter_jacket';
    this.ownedArmors = new Set<ArmorId>(['starter_jacket']);
    this.equippedRelic = 'starter_badge';
    this.ownedRelics = new Set<RelicId>(['starter_badge']);
    this.weaponForgeLevels = { pistol: 0, smg: 0, shotgun: 0, rifle: 0 };
    this.hpPotions = 2;
    this.mpPotions = 1;
    this.healRegenTimer = 0;
    this.overdriveTimer = 0;
    this.skillCooldowns = { shockwave: 0, heal: 0, overdrive: 0 };
    this.clearRpgEffects();

    this.stamina = 100;
    this.level = 1;
    this.xp = 0;
    this.xpToNext = 100;
    this.recomputeRpgDerivedStats(false);
    this.hp = this.maxHp;
    this.mp = this.maxMp;

    this.currentWeapon = 'pistol';
    setPlayerWeaponModel(this.player, 'pistol');
    setFirstPersonWeapon(this.fpsRig, 'pistol');
    this.weaponState = {
      pistol: { unlocked: true, ammoInMag: WEAPONS.pistol.magSize, reserveAmmo: WEAPONS.pistol.startReserve },
      smg: { unlocked: false, ammoInMag: WEAPONS.smg.magSize, reserveAmmo: WEAPONS.smg.startReserve },
      shotgun: { unlocked: false, ammoInMag: WEAPONS.shotgun.magSize, reserveAmmo: WEAPONS.shotgun.startReserve },
      rifle: { unlocked: false, ammoInMag: WEAPONS.rifle.magSize, reserveAmmo: WEAPONS.rifle.startReserve },
    };

    this.isReloading = false;
    this.reloadTimer = 0;
    this.fireCooldown = 0;
    this.score = 0;
    this.kills = 0;
    this.headshots = 0;
    this.wave = 1;
    this.freeRoamMode = false;
    this.missionIndex = 0;
    this.missionProgressValue = 0;
    this.missionCompletedAll = false;
    this.mapMissionStates = {};
    this.serverMapMissionCompleted = {};
    this.serverMissionState = null;
    this.activePuzzle = null;
    this.bossKills = 0;
    this.pendingBossRewardName = null;
    this.mapTravelOpen = false;
    this.visitedMaps = new Set<MapId>([this.currentMap]);
    this.activeVehicleId = null;
    this.nearbyVehicleId = null;
    this.vehicleRamCooldowns.clear();
    this.dayCount = 1;
    this.timeOfDay = 0.34;
    this.currentWeather =
      this.settings.weatherMode === 'dynamic' ? 'clear' : this.settings.weatherMode;
    this.weatherTimer = 38;
    this.thunderTimer = 9;
    this.lightningFlash = 0;
    this.pickupNotice = null;
    this.pickupNoticeTimer = 0;
    this.unlockBannerText = null;
    this.unlockBannerTimer = 0;

    this.camCurrentPos.set(0, 2.8, 9.2);
    this.camCurrentLook.set(0, 1.5, 4);
  }

  // ---- 3D Action RPG Derived Stats, Skills, Equipment & Forge ----
  private getDefense(): number {
    const armorDef = RPG_ARMORS[this.equippedArmor]?.defense ?? 0;
    return armorDef + this.rpgStats.vit * 3;
  }

  private getCritChancePct(): number {
    const relicCrit = RPG_RELICS[this.equippedRelic]?.bonusCritPct ?? 0;
    const overdriveCrit = this.overdriveTimer > 0 ? 35 : 0;
    return Math.min(85, Math.round(6 + this.rpgStats.agi * 3.5 + relicCrit + overdriveCrit));
  }

  private getDamageBonusPct(): number {
    const levelBonus = (this.level - 1) * 10;
    const strBonus = this.rpgStats.str * 8;
    const relicBonus = RPG_RELICS[this.equippedRelic]?.bonusDmgPct ?? 0;
    const overdriveBonus = this.overdriveTimer > 0 ? 60 : 0;
    return Math.round(levelBonus + strBonus + relicBonus + overdriveBonus);
  }

  private getMpRegenRate(): number {
    const relicRegen = RPG_RELICS[this.equippedRelic]?.bonusMpRegen ?? 0;
    return 4.5 + this.rpgStats.int * 1.2 + relicRegen;
  }

  private getMoveSpeedMult(): number {
    const agiMult = 1 + this.rpgStats.agi * 0.03;
    const overdriveMult = this.overdriveTimer > 0 ? 1.2 : 1.0;
    return Math.min(1.75, agiMult * overdriveMult);
  }

  private getReloadDurationMult(): number {
    return Math.max(0.45, 1 / (1 + this.rpgStats.agi * 0.1));
  }

  private recomputeRpgDerivedStats(healDelta = true): void {
    const prevMaxHp = this.maxHp;
    const prevMaxMp = this.maxMp;
    const armorHp = RPG_ARMORS[this.equippedArmor]?.bonusHp ?? 0;
    const relicMp = RPG_RELICS[this.equippedRelic]?.bonusMp ?? 0;

    this.maxHp = 80 + (this.level - 1) * 8 + this.rpgStats.vit * 18 + armorHp;
    this.maxMp = 70 + (this.level - 1) * 6 + this.rpgStats.int * 15 + relicMp;

    if (healDelta) {
      if (this.maxHp > prevMaxHp) this.hp = Math.min(this.maxHp, this.hp + (this.maxHp - prevMaxHp));
      else this.hp = Math.min(this.maxHp, this.hp);
      if (this.maxMp > prevMaxMp) this.mp = Math.min(this.maxMp, this.mp + (this.maxMp - prevMaxMp));
      else this.mp = Math.min(this.maxMp, this.mp);
    } else {
      this.hp = Math.min(this.maxHp, this.hp);
      this.mp = Math.min(this.maxMp, this.mp);
    }
  }

  private applyDefendedPlayerDamage(rawDmg: number): number {
    const def = this.getDefense();
    const mitigated = Math.max(1, Math.round(rawDmg * (100 / (100 + def * 2.4))));
    this.hp = Math.max(0, this.hp - mitigated);
    return mitigated;
  }

  private grantGold(baseAmount: number, worldPos?: THREE.Vector3): number {
    const bonusGoldPct = RPG_RELICS[this.equippedRelic]?.bonusGoldPct ?? 0;
    const gained = Math.max(1, Math.round(baseAmount * (1 + bonusGoldPct / 100)));
    this.gold += gained;
    if (worldPos) {
      this.spawnCombatText(
        _vecB.copy(worldPos).setY(worldPos.y + 1.9),
        `+${gained} G`,
        'gold',
      );
    }
    return gained;
  }

  private spawnCombatText(
    worldPos: THREE.Vector3,
    text: string,
    kind: FloatingCombatText['kind'],
  ): void {
    if (this.worldCombatTexts.length >= 22) {
      this.worldCombatTexts.shift();
    }
    this.worldCombatTexts.push({
      id: this.nextCombatTextId++,
      worldPos: worldPos.clone().add(
        new THREE.Vector3((Math.random() - 0.5) * 0.45, 0, (Math.random() - 0.5) * 0.45),
      ),
      text,
      kind,
      age: 0,
      maxAge: kind === 'crit' || kind === 'skill' ? 1.15 : 0.9,
    });
  }

  private spawnRpgRingVfx(
    pos: THREE.Vector3,
    colorHex: number,
    startScale: number,
    endScale: number,
    maxAge: number,
    followPlayer: boolean,
    riseSpeed: number,
  ): void {
    const mat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(this.shockwaveGeo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(pos.x, Math.max(0.14, pos.y + 0.14), pos.z);
    mesh.scale.setScalar(startScale);
    this.scene.add(mesh);
    this.rpgRings.push({
      mesh,
      age: 0,
      maxAge,
      startScale,
      endScale,
      followPlayer,
      riseSpeed,
    });
  }

  private clearRpgEffects(): void {
    for (const r of this.rpgRings) {
      this.scene.remove(r.mesh);
      (r.mesh.material as THREE.Material).dispose();
    }
    this.rpgRings = [];
    if (this.overdriveAuraRing) {
      this.scene.remove(this.overdriveAuraRing);
      (this.overdriveAuraRing.material as THREE.Material).dispose();
      this.overdriveAuraRing = null;
    }
    this.worldCombatTexts = [];
  }

  public openRpgMenu(): void {
    if (this.phase !== 'playing' || this.activePuzzle !== null) return;
    this.mapTravelOpen = false;
    this.rpgMenuOpen = true;
    this.mouseDown = false;
    this.touchShootHeld = false;
    this.isAiming = false;
    this.keys = {};
    if (document.pointerLockElement === this.renderer.domElement) {
      document.exitPointerLock?.();
    }
    this.emitHud();
  }

  public closeRpgMenu(): void {
    if (!this.rpgMenuOpen) return;
    this.rpgMenuOpen = false;
    this.emitHud();
  }

  public toggleRpgMenu(): void {
    if (this.rpgMenuOpen) {
      this.closeRpgMenu();
    } else {
      this.openRpgMenu();
    }
  }

  public allocateRpgStat(stat: RpgStatKey): void {
    if (this.phase !== 'playing' || this.statPoints <= 0) return;
    this.statPoints -= 1;
    this.rpgStats[stat] += 1;
    this.recomputeRpgDerivedStats(true);
    this.audio.unlock();
    this.audio.playForgeUpgrade();
    this.pickupNotice = `ATRIBUT ${stat.toUpperCase()} NAIK KE ${this.rpgStats[stat]}!`;
    this.pickupNoticeTimer = 1.8;
    this.emitHud();
  }

  public buyOrEquipArmor(id: ArmorId): void {
    if (this.phase !== 'playing') return;
    const spec = RPG_ARMORS[id];
    if (!spec) return;
    this.audio.unlock();
    if (!this.ownedArmors.has(id)) {
      if (this.gold < spec.price) return;
      this.gold -= spec.price;
      this.ownedArmors.add(id);
      this.audio.playForgeUpgrade();
      this.pickupNotice = `ARMOR DIBELI & DIPAKAI: ${spec.name.toUpperCase()}`;
    } else {
      this.audio.playPickup('ammo');
      this.pickupNotice = `ARMOR DIPAKAI: ${spec.name.toUpperCase()}`;
    }
    this.equippedArmor = id;
    this.recomputeRpgDerivedStats(true);
    this.pickupNoticeTimer = 2.0;
    this.emitHud();
  }

  public buyOrEquipRelic(id: RelicId): void {
    if (this.phase !== 'playing') return;
    const spec = RPG_RELICS[id];
    if (!spec) return;
    this.audio.unlock();
    if (!this.ownedRelics.has(id)) {
      if (this.gold < spec.price) return;
      this.gold -= spec.price;
      this.ownedRelics.add(id);
      this.audio.playForgeUpgrade();
      this.pickupNotice = `RELIK DIBELI & DIPAKAI: ${spec.name.toUpperCase()}`;
    } else {
      this.audio.playPickup('ammo');
      this.pickupNotice = `RELIK DIPAKAI: ${spec.name.toUpperCase()}`;
    }
    this.equippedRelic = id;
    this.recomputeRpgDerivedStats(true);
    this.pickupNoticeTimer = 2.0;
    this.emitHud();
  }

  public upgradeWeaponForge(weaponId: WeaponId): void {
    if (this.phase !== 'playing') return;
    const currentTier = this.weaponForgeLevels[weaponId] ?? 0;
    if (currentTier >= WEAPON_FORGE_MAX) return;
    const cost = getWeaponForgeCost(currentTier);
    if (this.gold < cost) return;
    this.gold -= cost;
    this.weaponForgeLevels[weaponId] = currentTier + 1;
    this.audio.unlock();
    this.audio.playForgeUpgrade();
    this.pickupNotice = `${WEAPONS[weaponId].shortName.toUpperCase()} DITEMPA KE +${currentTier + 1}!`;
    this.pickupNoticeTimer = 2.2;
    this.emitHud();
  }

  public buyPotion(kind: 'hp' | 'mp'): void {
    if (this.phase !== 'playing') return;
    const cost = kind === 'hp' ? RPG_POTION_PRICES.hp : RPG_POTION_PRICES.mp;
    if (this.gold < cost) return;
    this.gold -= cost;
    if (kind === 'hp') this.hpPotions += 1;
    else this.mpPotions += 1;
    this.audio.unlock();
    this.audio.playPickup(kind === 'hp' ? 'medkit' : 'ammo');
    this.pickupNotice =
      kind === 'hp' ? `MEMBELI RAMUAN HP (+1)` : `MEMBELI RAMUAN MP (+1)`;
    this.pickupNoticeTimer = 1.6;
    this.emitHud();
  }

  public usePotion(kind: 'hp' | 'mp'): void {
    if (this.phase !== 'playing' || this.spectatingDowned) return;
    this.audio.unlock();
    if (kind === 'hp') {
      if (this.hpPotions <= 0 || this.hp >= this.maxHp) return;
      this.hpPotions -= 1;
      const healAmount = 60 + this.rpgStats.vit * 4;
      this.hp = Math.min(this.maxHp, this.hp + healAmount);
      this.audio.playSkillHeal();
      this.spawnRpgRingVfx(this.playerPos, 0x34d399, 0.5, 2.4, 0.55, true, 2.2);
      this.spawnParticles(_vecA.set(this.playerPos.x, this.playerY + 1.0, this.playerPos.z), 0x34d399, 10, 4.2, 0.8);
      this.spawnCombatText(_vecA.set(this.playerPos.x, this.playerY + 2.1, this.playerPos.z), `+${healAmount} HP`, 'heal');
      this.pickupNotice = `RAMUAN HP DIGUNAKAN (+${healAmount} HP)`;
      this.pickupNoticeTimer = 1.6;
    } else {
      if (this.mpPotions <= 0 || this.mp >= this.maxMp) return;
      this.mpPotions -= 1;
      const mpAmount = 60 + this.rpgStats.int * 4;
      this.mp = Math.min(this.maxMp, this.mp + mpAmount);
      this.audio.playPickup('ammo');
      this.spawnRpgRingVfx(this.playerPos, 0x38bdf8, 0.5, 2.4, 0.55, true, 2.2);
      this.spawnCombatText(_vecA.set(this.playerPos.x, this.playerY + 2.1, this.playerPos.z), `+${mpAmount} MP`, 'skill');
      this.pickupNotice = `RAMUAN MP DIGUNAKAN (+${mpAmount} MP)`;
      this.pickupNoticeTimer = 1.6;
    }
    this.emitHud();
  }

  public castRpgSkill(id: RpgSkillId): void {
    if (
      this.phase !== 'playing' ||
      this.spectatingDowned ||
      this.activePuzzle !== null ||
      this.mapTravelOpen ||
      this.rpgMenuOpen
    ) {
      return;
    }
    const spec = RPG_SKILLS[id];
    if (!spec) return;
    if (this.skillCooldowns[id] > 0) return;
    if (this.mp < spec.mpCost) {
      this.audio.playEmptyClick();
      this.pickupNotice = `MP TIDAK CUKUP (${Math.floor(this.mp)}/${spec.mpCost} MP)`;
      this.pickupNoticeTimer = 1.3;
      this.emitHud();
      return;
    }

    this.audio.unlock();
    this.mp = Math.max(0, this.mp - spec.mpCost);
    this.skillCooldowns[id] = spec.cooldown;

    if (id === 'shockwave') {
      const radius = 9.5;
      const skillDmg = Math.round(
        (75 + this.rpgStats.int * 12 + this.rpgStats.str * 8) *
          (1 + (this.overdriveTimer > 0 ? 0.35 : 0)),
      );
      this.audio.playSkillShockwave();
      this.camShake = Math.max(this.camShake, 0.36);
      this.spawnRpgRingVfx(this.playerPos, 0x22d3ee, 0.8, radius, 0.52, false, 0.4);
      this.spawnRpgRingVfx(this.playerPos, 0x38bdf8, 0.4, radius * 0.72, 0.4, false, 1.4);
      this.spawnParticles(
        _vecA.set(this.playerPos.x, this.playerY + 0.9, this.playerPos.z),
        0x22d3ee,
        22,
        9.2,
        1.15,
      );

      let hitCount = 0;
      for (const z of this.zombies) {
        if (z.dead) continue;
        const dx = z.position.x - this.playerPos.x;
        const dz = z.position.z - this.playerPos.z;
        const dist = Math.hypot(dx, dz);
        if (dist <= radius) {
          hitCount++;
          const falloff = 1 - (dist / radius) * 0.3;
          const finalDmg = Math.round(skillDmg * falloff);
          const hitPos = _vecB.set(z.position.x, 1.5, z.position.z);
          this.spawnCombatText(hitPos, `KEJUT ${finalDmg}!`, 'skill');
          if (this.isMultiplayer) {
            this.multiplayer.send({
              type: 'player:hitZombie',
              zombieId: z.id,
              damage: finalDmg,
              isHeadshot: true,
            });
            z.hitFlash = 0.16;
            z.hitFlinch = 1;
          } else {
            this.damageZombieSolo(z, finalDmg, true, hitPos);
            if (!z.dead && dist > 0.05) {
              const push = (1 - dist / radius) * 3.8 + 1.4;
              z.position.x += (dx / dist) * push;
              z.position.z += (dz / dist) * push;
              resolveCircleCollisionsShared(
                z.position,
                z.radius,
                this.city.colliders,
                this.city.barrels,
                this.city.halfSize,
              );
            }
          }
        }
      }
      this.pickupNotice =
        hitCount > 0
          ? `GELOMBANG KEJUT MENGENAI ${hitCount} ZOMBIE!`
          : 'GELOMBANG KEJUT DILUNCURKAN!';
      this.pickupNoticeTimer = 1.8;
    } else if (id === 'heal') {
      const instantHeal = Math.round(45 + this.rpgStats.int * 6);
      this.hp = Math.min(this.maxHp, this.hp + instantHeal);
      this.healRegenTimer = 4.0;
      this.audio.playSkillHeal();
      this.spawnRpgRingVfx(this.playerPos, 0x34d399, 0.5, 3.4, 0.72, true, 2.6);
      this.spawnRpgRingVfx(this.playerPos, 0x6ee7b7, 0.35, 2.2, 0.55, true, 3.8);
      this.spawnParticles(
        _vecA.set(this.playerPos.x, this.playerY + 0.6, this.playerPos.z),
        0x34d399,
        18,
        5.0,
        0.95,
      );
      this.spawnCombatText(
        _vecA.set(this.playerPos.x, this.playerY + 2.2, this.playerPos.z),
        `+${instantHeal} HP`,
        'heal',
      );
      this.pickupNotice = `AURA PENYEMBUHAN AKTIF (+${instantHeal} HP + REGEN 4 DETIK)`;
      this.pickupNoticeTimer = 2.0;
    } else if (id === 'overdrive') {
      this.overdriveTimer = 8.0;
      this.audio.playSkillOverdrive();
      this.camShake = Math.max(this.camShake, 0.24);
      this.spawnRpgRingVfx(this.playerPos, 0xf59e0b, 0.6, 5.2, 0.65, true, 1.8);
      this.spawnRpgRingVfx(this.playerPos, 0xa855f7, 0.4, 3.8, 0.55, true, 3.2);
      this.spawnParticles(
        _vecA.set(this.playerPos.x, this.playerY + 1.0, this.playerPos.z),
        0xf59e0b,
        22,
        6.8,
        1.1,
      );
      this.spawnCombatText(
        _vecA.set(this.playerPos.x, this.playerY + 2.3, this.playerPos.z),
        'MODE OVERDRIVE!',
        'crit',
      );
      if (!this.overdriveAuraRing) {
        const auraMat = new THREE.MeshBasicMaterial({
          color: 0xf59e0b,
          transparent: true,
          opacity: 0.78,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        this.overdriveAuraRing = new THREE.Mesh(this.shockwaveGeo, auraMat);
        this.overdriveAuraRing.rotation.x = -Math.PI / 2;
        this.scene.add(this.overdriveAuraRing);
      }
      this.showUnlockBanner('MODE OVERDRIVE AKTIF! (+60% DMG · +35% CRIT · +20% SPEED)');
    }

    this.emitHud();
  }

  public startNewGame(
    mapOverride?: MapId,
    autoRotateOverride?: boolean,
    difficultyOverride?: DifficultyId,
  ): void {
    this.audio.unlock();
    this.audio.startHorrorMusic();
    this.isMultiplayer = false;
    this.roomCode = null;
    this.clearEntities();

    const targetMap = mapOverride ?? this.settings.selectedMap;
    this.autoRotateMaps = autoRotateOverride ?? this.settings.autoRotateMaps;
    this.difficulty = difficultyOverride ?? this.settings.selectedDifficulty ?? 'normal';
    this.loadMap(targetMap);

    this.phase = 'playing';
    this.resetPlayerStats();

    this.spawnPickup('medkit', new THREE.Vector3(-12, 0, 0));
    this.spawnPickup('ammo', new THREE.Vector3(12, 0, 0));
    if (this.currentMap === 'openworld') {
      // Stock supplies in outer districts too so explorers are rewarded
      for (let i = 3; i < this.city.pickupSpots.length; i++) {
        this.spawnPickup(i % 2 === 0 ? 'medkit' : 'ammo', this.city.pickupSpots[i]);
      }
      this.showUnlockBanner('OPEN WORLD: IKUTI SUAR BIRU MENUJU MENARA RADIO!');
    }
    this.startWave(1);
    this.requestPointerLockSafe();
    this.emitHud();
  }

  public continueFreeRoam(): void {
    if (this.isMultiplayer) {
      this.multiplayer.continueFreeRoam();
      return;
    }
    this.freeRoamMode = true;
    this.phase = 'playing';
    this.hp = Math.min(this.maxHp, Math.max(this.hp, Math.round(this.maxHp * 0.7)) + 25);
    this.refillAllUnlockedAmmo();
    this.audio.unlock();
    this.showUnlockBanner('MODE FREE-ROAM AKTIF — JELAJAHI KOTA SEPUASNYA!');
    this.requestPointerLockSafe();
    this.emitHud();
  }

  private startMultiplayerMatch(
    mapId: MapId,
    autoRotate: boolean,
    difficulty: DifficultyId = 'normal',
  ): void {
    this.audio.unlock();
    this.audio.startHorrorMusic();
    this.isMultiplayer = true;
    this.autoRotateMaps = autoRotate;
    this.difficulty = difficulty ?? 'normal';
    this.clearEntities();
    this.loadMap(mapId);

    this.phase = 'playing';
    this.resetPlayerStats();
    this.requestPointerLockSafe();
    this.emitHud();
  }

  public resumeGame(): void {
    if (this.phase !== 'paused') return;
    this.audio.unlock();
    this.phase = 'playing';
    this.requestPointerLockSafe();
    this.emitHud();
  }

  public pauseGame(): void {
    if (this.phase !== 'playing') return;
    this.phase = 'paused';
    this.mapTravelOpen = false;
    this.rpgMenuOpen = false;
    this.mouseDown = false;
    this.touchShootHeld = false;
    this.isAiming = false;
    this.keys = {};
    if (document.pointerLockElement === this.renderer.domElement) {
      document.exitPointerLock?.();
    }
    this.emitHud();
  }

  public openMapTravel(): void {
    if (this.phase !== 'playing' || this.activePuzzle !== null) return;
    this.rpgMenuOpen = false;
    this.mapTravelOpen = true;
    this.mouseDown = false;
    this.touchShootHeld = false;
    this.isAiming = false;
    this.keys = {};
    if (document.pointerLockElement === this.renderer.domElement) {
      document.exitPointerLock?.();
    }
    this.emitHud();
  }

  public closeMapTravel(): void {
    if (!this.mapTravelOpen) return;
    this.mapTravelOpen = false;
    this.emitHud();
  }

  public toggleMapTravel(): void {
    if (this.mapTravelOpen) {
      this.closeMapTravel();
    } else {
      this.openMapTravel();
    }
  }

  public travelToMap(targetMap: MapId): void {
    if (this.phase !== 'playing') return;
    if (targetMap === this.currentMap) {
      this.closeMapTravel();
      return;
    }

    this.audio.unlock();
    this.mapTravelOpen = false;
    this.mouseDown = false;
    this.touchShootHeld = false;
    this.isAiming = false;
    this.keys = {};

    if (this.isMultiplayer) {
      this.multiplayer.travelToMap(targetMap);
      this.emitHud();
      return;
    }

    // Solo map travel: preserve level, XP, HP, weapons, ammo, score, kills, day, weather & wave
    if (this.activeVehicleId) {
      const prevVeh = this.vehicles.find((v) => v.id === this.activeVehicleId);
      if (prevVeh && prevVeh.driverId === 'local') prevVeh.driverId = null;
      this.activeVehicleId = null;
    }

    // Save current map's mission progress before leaving
    this.mapMissionStates[this.currentMap] = {
      index: this.missionIndex,
      progress: this.missionProgressValue,
      completedAll: this.missionCompletedAll,
    };

    this.clearEntities();
    this.loadMap(targetMap);
    this.visitedMaps.add(targetMap);

    this.playerPos.set(0, 0, 4);
    this.playerY = 0;
    this.playerVelY = 0;
    this.playerVelX = 0;
    this.playerVelZ = 0;
    this.moveLocalFwd = 0;
    this.moveLocalRight = 0;
    this.landingSquash = 0;
    this.playerYaw = Math.PI;
    this.camYaw = Math.PI;
    this.camPitch = 0.12;
    this.player.root.position.set(0, 0, 4);
    this.player.root.rotation.y = this.playerYaw;
    this.player.root.visible = this.cameraMode !== 'fps';
    this.fpsRig.root.visible = this.cameraMode === 'fps';
    this.camCurrentPos.set(0, 2.8, 9.2);
    this.camCurrentLook.set(0, 1.5, 4);

    // Restore destination map's saved mission progress (or start from Misi 1 on first visit)
    const saved = this.mapMissionStates[targetMap];
    this.missionIndex = saved ? saved.index : 0;
    this.missionProgressValue = saved ? saved.progress : 0;
    this.missionCompletedAll = saved ? saved.completedAll : false;
    this.activePuzzle = null;

    if (!this.missionCompletedAll) {
      const destList = this.getActiveMissions();
      const destDef = destList[Math.min(this.missionIndex, destList.length - 1)];
      if (destDef && (destDef.metric === 'collect_intel' || destDef.metric === 'bosses')) {
        // Re-populate intel briefcases or mission bosses on return if in progress
        this.onLocalMissionStepEntered(destDef);
      }
    }

    // Stock supplies across the destination map for exploration
    const spots = this.city.pickupSpots;
    if (spots.length >= 2) {
      this.spawnPickup('medkit', spots[0]);
      this.spawnPickup('ammo', spots[1]);
      for (let i = 2; i < Math.min(spots.length, 6); i++) {
        this.spawnPickup(i % 2 === 0 ? 'medkit' : 'ammo', spots[i]);
      }
    } else {
      this.spawnPickup('medkit', new THREE.Vector3(-12, 0, 0));
      this.spawnPickup('ammo', new THREE.Vector3(12, 0, 0));
    }

    // Resume wave spawning cleanly on the destination map
    const diff = DIFFICULTY_TUNING[this.difficulty] ?? DIFFICULTY_TUNING.normal;
    this.zombiesToSpawn = Math.max(4, Math.round((5 + this.wave * 3) * diff.spawnMult));
    this.bossesToSpawn =
      targetMap === 'openworld'
        ? this.wave >= 3
          ? 1
          : 0
        : this.wave >= 7
          ? 3
          : this.wave >= 4
            ? 2
            : 1;
    this.bossSpawnTimer = 6.0;
    this.spawnTimer = 1.0;
    this.waveBreakTimer = 0;

    this.audio.playWaveBanner();
    this.showWaveBanner(`TIBA DI: ${MAPS[targetMap].name.toUpperCase()}`);
    this.showUnlockBanner(
      `ZONA DIJELAJAHI: ${this.visitedMaps.size} / ${MAP_ORDER.length} PETA`,
    );
    this.requestPointerLockSafe();
    this.emitHud();
  }

  public skipIntro(): void {
    if (this.phase !== 'intro') return;
    this.audio.unlock();
    this.phase = 'menu';
    this.player.root.visible = false;
    this.fpsRig.root.visible = false;
    this.flashlight.intensity = 0;
    this.emitHud();
  }

  public replayIntro(): void {
    this.audio.unlock();
    this.audio.playIntroBoom();
    this.introTimer = 0;
    this.introEmitTimer = 0;
    this.phase = 'intro';
    this.isAiming = false;
    this.playerPos.set(0, 0, 4);
    this.playerYaw = Math.PI;
    this.player.root.position.set(0, 0, 4);
    this.player.root.rotation.y = Math.PI;
    this.player.root.visible = true;
    this.fpsRig.root.visible = false;
    this.emitHud();
  }

  public returnToMenu(): void {
    if (this.isMultiplayer) {
      this.multiplayer.leaveRoom();
      this.isMultiplayer = false;
      this.roomCode = null;
    }
    this.phase = 'menu';
    this.player.root.visible = false;
    this.fpsRig.root.visible = false;
    this.flashlight.intensity = 0;
    this.mouseDown = false;
    this.touchShootHeld = false;
    this.isAiming = false;
    this.activePuzzle = null;
    this.mapTravelOpen = false;
    this.rpgMenuOpen = false;
    this.activeVehicleId = null;
    this.keys = {};
    if (document.pointerLockElement === this.renderer.domElement) {
      document.exitPointerLock?.();
    }
    this.clearEntities();
    this.loadMap(this.settings.selectedMap);
    this.spawnMenuShowcaseZombies();
    this.emitHud();
  }

  public toggleCameraMode(): void {
    if (this.phase !== 'playing') return;
    this.cameraMode = this.cameraMode === 'tps' ? 'fps' : 'tps';
    if (this.cameraMode === 'tps' && this.tpsZoomDist < 2.8) {
      this.tpsZoomDist = 4.3;
    }
    this.pickupNotice =
      this.cameraMode === 'fps'
        ? 'KAMERA: ORANG PERTAMA (1ST PERSON)'
        : 'KAMERA: ORANG KETIGA (3RD PERSON)';
    this.pickupNoticeTimer = 1.4;
    this.emitHud();
  }

  public setAiming(active: boolean): void {
    if (this.phase !== 'playing' || this.spectatingDowned) {
      this.isAiming = false;
      return;
    }
    if (this.isAiming !== active) {
      this.isAiming = active;
      this.emitHud();
    }
  }

  public toggleAiming(): void {
    this.setAiming(!this.isAiming);
  }

  public switchWeapon(weaponId: WeaponId): void {
    if (this.phase !== 'playing') return;
    if (!this.weaponState[weaponId].unlocked || this.currentWeapon === weaponId) return;
    this.currentWeapon = weaponId;
    this.isReloading = false;
    this.reloadTimer = 0;
    setPlayerWeaponModel(this.player, weaponId);
    setFirstPersonWeapon(this.fpsRig, weaponId);
    this.audio.playReload();
    this.emitHud();
  }

  public requestPointerLockSafe(): void {
    if (this.settings.controlMode === 'touch') return;
    const isTouchOnly =
      window.matchMedia?.('(pointer: coarse)').matches && this.settings.controlMode === 'auto';
    if (isTouchOnly) return;
    try {
      this.renderer.domElement.requestPointerLock?.();
    } catch {
      // Fallback drag aim available
    }
  }

  public triggerReload(): void {
    if (this.phase !== 'playing' || this.spectatingDowned) return;
    const wSpec = WEAPONS[this.currentWeapon];
    const wAmmo = this.weaponState[this.currentWeapon];
    if (this.isReloading || wAmmo.ammoInMag >= wSpec.magSize || wAmmo.reserveAmmo <= 0) return;
    this.isReloading = true;
    this.reloadTimer = 0;
    this.audio.playReload();
    this.emitHud();
  }

  public setTouchJoystick(x: number, y: number): void {
    this.joyX = THREE.MathUtils.clamp(x, -1, 1);
    this.joyY = THREE.MathUtils.clamp(y, -1, 1);
  }

  public addTouchLook(deltaX: number, deltaY: number): void {
    if (this.phase !== 'playing') return;
    const aimSlowdown = this.isAiming ? 0.6 : 1.0;
    const sens = 0.0042 * this.settings.sensitivity * aimSlowdown;
    this.camYaw -= deltaX * sens;
    this.camPitch = THREE.MathUtils.clamp(this.camPitch + deltaY * sens, -0.68, 0.72);
    this.fpsLookSwayX = THREE.MathUtils.clamp(this.fpsLookSwayX - deltaX * 0.00055, -0.045, 0.045);
    this.fpsLookSwayY = THREE.MathUtils.clamp(this.fpsLookSwayY + deltaY * 0.00045, -0.035, 0.035);
  }

  public setTouchShoot(active: boolean): void {
    this.touchShootHeld = active;
    if (active) this.audio.unlock();
  }

  public setTouchRun(active: boolean): void {
    this.touchRunHeld = active;
    if (active) this.isCrouching = false;
  }

  public toggleRun(): void {
    if (this.phase !== 'playing' || this.spectatingDowned) return;
    this.runToggleActive = !this.runToggleActive;
    if (this.runToggleActive) this.isCrouching = false;
    this.emitHud();
  }

  public triggerEmergencyAmmoRefill(): void {
    if (this.phase !== 'playing' || this.spectatingDowned) return;
    if (this.ammoRefillCooldown > 0) return;

    const wSpec = WEAPONS[this.currentWeapon];
    const wAmmo = this.weaponState[this.currentWeapon];
    const isLow =
      wAmmo.ammoInMag <= Math.max(4, Math.ceil(wSpec.magSize * 0.35)) ||
      wAmmo.reserveAmmo <= wSpec.magSize * 2;
    if (!isLow) return;

    this.isReloading = false;
    this.reloadTimer = 0;
    wAmmo.ammoInMag = wSpec.magSize;
    wAmmo.reserveAmmo = Math.max(wAmmo.reserveAmmo + wSpec.ammoPickupAmount, wSpec.startReserve);
    for (const id of WEAPON_ORDER) {
      if (id !== this.currentWeapon && this.weaponState[id].unlocked) {
        this.weaponState[id].reserveAmmo += Math.round(WEAPONS[id].ammoPickupAmount * 0.5);
      }
    }

    this.ammoRefillCooldown = 10;
    this.audio.unlock();
    this.audio.playPickup('ammo');
    this.pickupNotice = `REFILL PELURU PENUH (${wSpec.shortName})`;
    this.pickupNoticeTimer = 2.0;
    this.emitHud();
  }

  public triggerJump(): void {
    if (this.phase !== 'playing' || this.spectatingDowned) return;
    if (this.playerY <= 0.01) {
      this.playerVelY = 8.4;
      this.isCrouching = false;
      this.audio.unlock();
      this.audio.playJump();
      this.emitHud();
    }
  }

  public toggleCrouch(): void {
    if (this.phase !== 'playing' || this.spectatingDowned) return;
    this.isCrouching = !this.isCrouching;
    if (this.isCrouching) {
      this.touchRunHeld = false;
      this.runToggleActive = false;
    }
    this.emitHud();
  }

  public setCrouch(active: boolean): void {
    if (this.phase !== 'playing' || this.spectatingDowned) return;
    this.isCrouching = active;
    if (active) {
      this.touchRunHeld = false;
      this.runToggleActive = false;
    }
    this.emitHud();
  }

  public triggerDash(): void {
    if (this.phase !== 'playing' || this.spectatingDowned) return;
    if (this.dashTimer > 0 || this.dashCooldown > 0) return;

    let moveForward = 0;
    let moveRight = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveForward += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveForward -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveRight += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveRight -= 1;
    if (Math.abs(this.joyX) > 0.08 || Math.abs(this.joyY) > 0.08) {
      moveRight += this.joyX;
      moveForward -= this.joyY;
    }

    const fwdX = -Math.sin(this.camYaw);
    const fwdZ = -Math.cos(this.camYaw);
    const rightX = Math.cos(this.camYaw);
    const rightZ = -Math.sin(this.camYaw);

    if (Math.hypot(moveForward, moveRight) > 0.05) {
      this.dashDir.set(fwdX * moveForward + rightX * moveRight, 0, fwdZ * moveForward + rightZ * moveRight).normalize();
    } else {
      this.dashDir.set(fwdX, 0, fwdZ).normalize();
    }

    this.dashTimer = 0.18;
    this.dashCooldown = 1.35;
    this.isCrouching = false;
    this.audio.unlock();
    this.audio.playDash();
    this.spawnParticles(_vecA.set(this.playerPos.x, this.playerY + 0.85, this.playerPos.z), 0x22d3ee, 10, 6.2, 0.9);
    this.emitHud();
  }

  public toggleEnterExitVehicle(): void {
    if (
      this.phase !== 'playing' ||
      this.spectatingDowned ||
      this.activePuzzle ||
      this.mapTravelOpen ||
      this.rpgMenuOpen
    )
      return;
    this.audio.unlock();

    if (this.activeVehicleId) {
      const veh = this.vehicles.find((v) => v.id === this.activeVehicleId);
      if (veh) {
        veh.driverId = null;
        veh.speed *= 0.3;
        const exitX = veh.x + Math.cos(veh.yaw) * 2.15;
        const exitZ = veh.z - Math.sin(veh.yaw) * 2.15;
        this.playerPos.set(exitX, 0, exitZ);
        resolveCircleCollisionsShared(
          this.playerPos,
          0.48,
          this.city.colliders,
          this.city.barrels,
          this.city.halfSize,
        );
        this.playerY = 0;
        this.playerVelY = 0;
        if (this.isMultiplayer) {
          this.multiplayer.exitVehicle(
            Number(this.playerPos.x.toFixed(2)),
            Number(this.playerPos.z.toFixed(2)),
          );
        }
      }
      this.activeVehicleId = null;
      this.player.root.visible = this.cameraMode !== 'fps';
      this.fpsRig.root.visible = this.cameraMode === 'fps';
      this.audio.playVehicleEnter();
      this.pickupNotice = 'TURUN DARI KENDARAAN';
      this.pickupNoticeTimer = 1.5;
      this.emitHud();
      return;
    }

    let closest: VehicleEntity | null = null;
    let bestDist = 4.6;
    for (const veh of this.vehicles) {
      if (veh.driverId) continue;
      const d = Math.hypot(veh.x - this.playerPos.x, veh.z - this.playerPos.z);
      if (d < bestDist) {
        bestDist = d;
        closest = veh;
      }
    }
    if (!closest) return;

    this.activeVehicleId = closest.id;
    closest.driverId = this.isMultiplayer
      ? (this.multiplayer.lobby.playerId ?? 'local')
      : 'local';
    this.isCrouching = false;
    this.playerY = 0;
    this.playerVelY = 0;
    this.isAiming = false;
    this.mouseDown = false;
    this.touchShootHeld = false;
    this.playerPos.set(closest.x, 0, closest.z);
    this.camYaw = closest.yaw + Math.PI;
    this.player.root.visible = false;
    this.fpsRig.root.visible = false;
    this.audio.playVehicleEnter();
    if (this.isMultiplayer) {
      this.multiplayer.enterVehicle(closest.id);
    }
    this.pickupNotice = `MENGEMUDI: ${closest.name.toUpperCase()} ([G] TURUN)`;
    this.pickupNoticeTimer = 2.4;
    this.emitHud();
  }

  public submitPuzzleAnswer(optionIndex: number): void {
    if (!this.activePuzzle || this.phase !== 'playing') return;
    this.audio.unlock();

    if (this.isMultiplayer) {
      this.multiplayer.submitPuzzleAnswer(optionIndex);
      return;
    }

    if (optionIndex === this.activePuzzle.puzzle.correctIndex) {
      const solvedPuzzle = this.activePuzzle;
      this.activePuzzle = null;
      this.audio.playPuzzleSuccess();
      this.grantGold(80, this.playerPos);

      if (solvedPuzzle.source === 'boss') {
        this.grantBossLootReward(solvedPuzzle.bossName ?? 'Zombie Bos');
      } else {
        this.finalizeLocalMissionAfterPuzzle();
        if (this.pendingBossRewardName) {
          const bossName = this.pendingBossRewardName;
          this.pendingBossRewardName = null;
          this.grantBossLootReward(bossName);
        }
      }

      if ((this.phase as GamePhase) === 'playing') {
        this.requestPointerLockSafe();
      }
      this.emitHud();
    } else {
      this.activePuzzle = {
        ...this.activePuzzle,
        wrongAttempts: this.activePuzzle.wrongAttempts + 1,
        feedback: 'Jawaban belum tepat! Cek petunjuk dan coba pilih jawaban lain.',
      };
      this.audio.playPuzzleFail();
      this.emitHud();
    }
  }

  private previewNextBossReward(): string {
    const nextLockedWeapon = WEAPON_ORDER.find((id) => !this.weaponState[id].unlocked);
    if (nextLockedWeapon) {
      return `Senjata ${WEAPONS[nextLockedWeapon].name} (Penuh Amunisi) + 1 Ramuan HP + 1 Ramuan MP + 180 Gold`;
    }

    const nextArmor = ARMOR_ORDER.find((id) => !this.ownedArmors.has(id));
    const nextRelic = RELIC_ORDER.find((id) => !this.ownedRelics.has(id));
    const currentForge = this.weaponForgeLevels[this.currentWeapon] ?? 0;
    const forgeCandidate =
      currentForge < WEAPON_FORGE_MAX
        ? this.currentWeapon
        : WEAPON_ORDER.find((id) => (this.weaponForgeLevels[id] ?? 0) < WEAPON_FORGE_MAX);

    if (nextArmor && (!nextRelic || this.bossKills % 2 === 1)) {
      return `Armor ${RPG_ARMORS[nextArmor].name} + 2 Ramuan HP + 1 Ramuan MP + 2 Poin Atribut + 220 Gold`;
    }
    if (nextRelic) {
      return `Relik ${RPG_RELICS[nextRelic].name} + 2 Ramuan HP + 1 Ramuan MP + 2 Poin Atribut + 220 Gold`;
    }
    if (forgeCandidate) {
      const nextTier = (this.weaponForgeLevels[forgeCandidate] ?? 0) + 1;
      return `Tempa Gratis ${WEAPONS[forgeCandidate].name} +${nextTier} (+18% DMG) + 2 Ramuan HP + 1 Ramuan MP + 2 Poin Atribut + 220 Gold`;
    }
    return `Amunisi Penuh Semua Senjata + 2 Ramuan HP + 2 Ramuan MP + 2 Poin Atribut + 300 Gold`;
  }

  private grantBossLootReward(bossName: string): void {
    const nextLockedWeapon = WEAPON_ORDER.find((id) => !this.weaponState[id].unlocked);
    let primaryHeadline = '';

    if (nextLockedWeapon) {
      const spec = WEAPONS[nextLockedWeapon];
      const st = this.weaponState[nextLockedWeapon];
      st.unlocked = true;
      st.ammoInMag = spec.magSize;
      st.reserveAmmo = Math.max(st.reserveAmmo, spec.startReserve + spec.ammoPickupAmount);
      this.currentWeapon = nextLockedWeapon;
      this.isReloading = false;
      this.reloadTimer = 0;
      setPlayerWeaponModel(this.player, nextLockedWeapon);
      setFirstPersonWeapon(this.fpsRig, nextLockedWeapon);
      this.hpPotions += 1;
      this.mpPotions += 1;
      this.grantGold(180, this.playerPos);
      primaryHeadline = `SENJATA BOS DIDAPAT: ${spec.name.toUpperCase()} + RAMUAN & 180G!`;
    } else {
      const nextArmor = ARMOR_ORDER.find((id) => !this.ownedArmors.has(id));
      const nextRelic = RELIC_ORDER.find((id) => !this.ownedRelics.has(id));
      const currentForge = this.weaponForgeLevels[this.currentWeapon] ?? 0;
      const forgeCandidate =
        currentForge < WEAPON_FORGE_MAX
          ? this.currentWeapon
          : WEAPON_ORDER.find((id) => (this.weaponForgeLevels[id] ?? 0) < WEAPON_FORGE_MAX);

      this.hpPotions += 2;
      this.mpPotions += 1;
      this.statPoints += 2;
      this.refillAllUnlockedAmmo();

      if (nextArmor && (!nextRelic || this.bossKills % 2 === 1)) {
        this.ownedArmors.add(nextArmor);
        this.equippedArmor = nextArmor;
        this.recomputeRpgDerivedStats(true);
        this.grantGold(220, this.playerPos);
        primaryHeadline = `ITEM BOS: ${RPG_ARMORS[nextArmor].name.toUpperCase()} + 2 POIN STAT!`;
      } else if (nextRelic) {
        this.ownedRelics.add(nextRelic);
        this.equippedRelic = nextRelic;
        this.recomputeRpgDerivedStats(true);
        this.grantGold(220, this.playerPos);
        primaryHeadline = `RELIK BOS: ${RPG_RELICS[nextRelic].name.toUpperCase()} + 2 POIN STAT!`;
      } else if (forgeCandidate) {
        const nextTier = (this.weaponForgeLevels[forgeCandidate] ?? 0) + 1;
        this.weaponForgeLevels[forgeCandidate] = nextTier;
        this.grantGold(220, this.playerPos);
        primaryHeadline = `TEMPA BOS: ${WEAPONS[forgeCandidate].shortName.toUpperCase()} +${nextTier} + RAMUAN!`;
      } else {
        this.mpPotions += 1;
        this.grantGold(300, this.playerPos);
        primaryHeadline = `PETI BOS ${bossName.toUpperCase()}: AMUNISI PENUH + RAMUAN + 300G!`;
      }
    }

    this.hp = Math.min(this.maxHp, this.hp + Math.round(this.maxHp * 0.35));
    this.mp = Math.min(this.maxMp, this.mp + Math.round(this.maxMp * 0.45));
    this.audio.playWeaponUnlock();
    this.audio.playForgeUpgrade();
    this.spawnRpgRingVfx(this.playerPos, 0xf59e0b, 0.7, 4.4, 0.75, true, 1.8);
    this.spawnParticles(
      _vecA.set(this.playerPos.x, this.playerY + 1.2, this.playerPos.z),
      0xfbbf24,
      20,
      6.4,
      1.15,
    );
    this.spawnCombatText(
      _vecA.set(this.playerPos.x, this.playerY + 2.5, this.playerPos.z),
      'HADIAH BOS!',
      'gold',
    );
    this.showUnlockBanner(primaryHeadline);
    this.pickupNotice = primaryHeadline;
    this.pickupNoticeTimer = 3.2;
  }

  private showWaveBanner(text: string): void {
    this.waveBannerText = text;
    this.waveBannerTimer = 3.2;
  }

  private showUnlockBanner(text: string): void {
    this.unlockBannerText = text;
    this.unlockBannerTimer = 3.4;
  }

  private refillAllUnlockedAmmo(): void {
    for (const id of WEAPON_ORDER) {
      if (this.weaponState[id].unlocked) {
        this.weaponState[id].reserveAmmo += WEAPONS[id].ammoPickupAmount;
      }
    }
  }

  private checkWeaponUnlocks(): void {
    for (const id of WEAPON_ORDER) {
      const spec = WEAPONS[id];
      const st = this.weaponState[id];
      if (!st.unlocked && this.kills >= spec.unlockKills) {
        st.unlocked = true;
        st.ammoInMag = spec.magSize;
        st.reserveAmmo = spec.startReserve;
        this.currentWeapon = id;
        this.isReloading = false;
        this.reloadTimer = 0;
        setPlayerWeaponModel(this.player, id);
        setFirstPersonWeapon(this.fpsRig, id);
        this.audio.playWeaponUnlock();
        this.showUnlockBanner(`SENJATA BARU TERBUKA: ${spec.name.toUpperCase()}!`);
      }
    }
  }

  private awardLocalXp(amount: number): void {
    this.xp += amount;
    while (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level += 1;
      this.xpToNext = Math.round(this.xpToNext * 1.35 + 40);
      this.statPoints += 3;
      const lvlGold = this.grantGold(50);
      this.recomputeRpgDerivedStats(true);
      this.hp = Math.min(this.maxHp, this.hp + 30);
      this.mp = Math.min(this.maxMp, this.mp + 40);
      this.audio.playLevelUp();
      this.spawnRpgRingVfx(this.playerPos, 0xfbbf24, 0.5, 4.6, 0.75, true, 2.4);
      this.spawnCombatText(
        _vecA.set(this.playerPos.x, this.playerY + 2.3, this.playerPos.z),
        `LEVEL ${this.level}! +3 POIN`,
        'crit',
      );
      this.showUnlockBanner(
        `LEVEL UP! LVL ${this.level} (+3 POIN ATRIBUT [B] · +${lvlGold} GOLD)`,
      );
    }
  }

  private initObjectiveBeacon(): void {
    this.objectiveBeaconGroup = new THREE.Group();
    this.objectiveBeaconGroup.visible = false;

    const ringGeo = new THREE.RingGeometry(0.92, 1.0, 48);
    ringGeo.rotateX(-Math.PI / 2);
    this.objectiveOuterRing = new THREE.Mesh(
      ringGeo,
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.78,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    this.objectiveOuterRing.position.y = 0.08;

    const fillGeo = new THREE.CircleGeometry(1, 40);
    fillGeo.rotateX(-Math.PI / 2);
    this.objectiveProgressRing = new THREE.Mesh(
      fillGeo,
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.16,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    this.objectiveProgressRing.position.y = 0.05;

    const pillarGeo = new THREE.CylinderGeometry(0.24, 0.52, 64, 12, 1, true);
    this.objectivePillar = new THREE.Mesh(
      pillarGeo,
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    this.objectivePillar.position.y = 32;

    this.objectiveDiamond = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.68, 0),
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.92,
      }),
    );
    this.objectiveDiamond.position.y = 4.2;

    this.objectiveBeaconGroup.add(
      this.objectiveOuterRing,
      this.objectiveProgressRing,
      this.objectivePillar,
      this.objectiveDiamond,
    );
    this.scene.add(this.objectiveBeaconGroup);
  }

  private createIntelBriefcaseMesh(): THREE.Group {
    const g = new THREE.Group();
    const inner = new THREE.Group();
    const caseMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.35,
      metalness: 0.75,
    });
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.44, 0.26), caseMat);
    const vial = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.36, 10), glowMat);
    vial.rotation.z = Math.PI / 2;
    vial.position.z = 0.13;
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.08, 0.08), caseMat);
    handle.position.y = 0.26;
    const beaconRing = new THREE.Mesh(
      new THREE.RingGeometry(0.65, 0.85, 24),
      new THREE.MeshBasicMaterial({
        color: 0x22d3ee,
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide,
      }),
    );
    beaconRing.rotation.x = -Math.PI / 2;
    beaconRing.position.y = 0.05;

    inner.add(body, vial, handle);
    inner.position.y = 0.7;
    g.add(inner, beaconRing);
    return g;
  }

  private spawnIntelPickup(pos: { x: number; z: number }, explicitId?: number): IntelPickupEntity {
    const mesh = this.createIntelBriefcaseMesh();
    mesh.position.set(pos.x, 0, pos.z);
    this.scene.add(mesh);
    const entity: IntelPickupEntity = {
      id: explicitId ?? this.nextEntityId++,
      mesh,
      position: new THREE.Vector3(pos.x, 0, pos.z),
      age: Math.random() * Math.PI * 2,
    };
    this.intelPickups.push(entity);
    return entity;
  }

  private getActiveMissions(): MissionDef[] {
    return getMissionsForMap(this.currentMap);
  }

  private getLocalObjectiveSpec(): {
    x: number;
    z: number;
    radius: number;
    label: string;
    color: string;
  } | null {
    if (this.missionCompletedAll) return null;
    const list = this.getActiveMissions();
    const def = list[Math.min(this.missionIndex, list.length - 1)];
    if (!def) return null;
    const pois = MAP_LAYOUTS[this.currentMap].missionPOIs;

    if (def.metric === 'radio_zone') {
      return { x: pois.radioTower.x, z: pois.radioTower.z, radius: 10, label: 'ZONA SINYAL RADIO', color: '#38bdf8' };
    }
    if (def.metric === 'barrels') {
      return { x: pois.industrialDepot.x, z: pois.industrialDepot.z, radius: 14, label: 'TARGET BARREL', color: '#f97316' };
    }
    if (def.metric === 'collect_intel') {
      const first = this.intelPickups[0]?.position ?? pois.militaryOutpost;
      return { x: first.x, z: first.z, radius: 12, label: 'KOPER DATA / SAMPEL', color: '#22d3ee' };
    }
    if (def.metric === 'bosses') {
      const activeBoss = this.zombies.find((z) => !z.dead && z.variant === 'boss');
      const pt = activeBoss ? activeBoss.position : pois.bossPatrolSpots[0];
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

  private onLocalMissionStepEntered(def: MissionDef): void {
    const layout = MAP_LAYOUTS[this.currentMap];
    const pois = layout.missionPOIs;

    if (def.metric === 'radio_zone') {
      this.showWaveBanner(`TARGET BARU: ${def.title.toUpperCase()}`);
    } else if (def.metric === 'barrels') {
      for (const b of this.city.barrels) {
        b.exploded = false;
        b.respawnTimer = 0;
        b.mesh.visible = true;
      }
      for (let i = 0; i < 4; i++) {
        const sp = findRandomZombieSpawnPos(
          [{ x: this.playerPos.x, z: this.playerPos.z }],
          this.city.colliders,
          this.city.barrels,
          this.city.spawnPoints,
          10,
          this.city.halfSize,
          pois.industrialDepot,
          24,
        );
        const { appearance, variant } = pickRandomZombieType(this.wave);
        this.spawnZombieAt(sp.x, sp.z, variant, appearance);
      }
      this.showWaveBanner(`TARGET BARU: ${def.title.toUpperCase()}`);
    } else if (def.metric === 'collect_intel') {
      const remaining = Math.max(1, def.target - Math.floor(this.missionProgressValue));
      for (let i = 0; i < Math.min(remaining, pois.collectibleSpots.length); i++) {
        this.spawnIntelPickup(pois.collectibleSpots[i]);
      }
      for (let i = 0; i < 4; i++) {
        const sp = findRandomZombieSpawnPos(
          [{ x: this.playerPos.x, z: this.playerPos.z }],
          this.city.colliders,
          this.city.barrels,
          this.city.spawnPoints,
          10,
          this.city.halfSize,
          pois.militaryOutpost,
          26,
        );
        const { appearance, variant } = pickRandomZombieType(this.wave + 1);
        this.spawnZombieAt(sp.x, sp.z, variant, appearance);
      }
      this.showWaveBanner(`TARGET BARU: ${def.title.toUpperCase()}`);
    } else if (def.metric === 'bosses') {
      const aliveBossCount = this.zombies.filter((z) => !z.dead && z.variant === 'boss').length;
      const needed = Math.max(0, def.target - Math.floor(this.missionProgressValue) - aliveBossCount);
      for (let i = 0; i < needed; i++) {
        const spot = pois.bossPatrolSpots[i % pois.bossPatrolSpots.length];
        const { appearance, variant } = pickRandomBossType();
        this.spawnZombieAt(spot.x, spot.z, variant, appearance);
      }
      this.audio.playZombieGroan(0.5);
      this.showWaveBanner(`PERINGATAN: ZOMBIE BOS MUNCUL — ${def.title.toUpperCase()}!`);
    } else if (def.metric === 'hold_helipad') {
      for (let i = 0; i < 5; i++) {
        const sp = findRandomZombieSpawnPos(
          [{ x: this.playerPos.x, z: this.playerPos.z }],
          this.city.colliders,
          this.city.barrels,
          this.city.spawnPoints,
          14,
          this.city.halfSize,
          pois.helipad,
          32,
        );
        const { appearance, variant } = pickRandomZombieType(this.wave + 2);
        this.spawnZombieAt(sp.x, sp.z, variant, appearance);
      }
      const bossSp = findRandomZombieSpawnPos(
        [{ x: this.playerPos.x, z: this.playerPos.z }],
        this.city.colliders,
        this.city.barrels,
        this.city.spawnPoints,
        16,
        this.city.halfSize,
        pois.helipad,
        34,
      );
      const { appearance, variant } = pickRandomBossType();
      this.spawnZombieAt(bossSp.x, bossSp.z, variant, appearance);
      this.audio.playWaveBanner();
      this.showWaveBanner(`PERTAHANKAN ZONA EVAKUASI (${def.target} DETIK)!`);
    } else if (def.metric === 'extract') {
      this.audio.playWaveBanner();
      this.showWaveBanner('HELIKOPTER MENDARAT! MASUK KE ZONA HIJAU HELIPAD!');
    }
  }

  private finalizeLocalMissionAfterPuzzle(): void {
    const list = this.getActiveMissions();
    const def = list[this.missionIndex];
    if (!def) return;

    this.score += def.rewardScore;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      try {
        localStorage.setItem(HIGH_SCORE_KEY, String(this.highScore));
      } catch {
        // ignore
      }
    }
    const missionGold = this.grantGold(120 + this.missionIndex * 35);
    this.awardLocalXp(def.rewardXp);
    this.refillAllUnlockedAmmo();
    this.audio.playWeaponUnlock();
    this.showUnlockBanner(
      `MISI SELESAI: ${def.title} (+${def.rewardXp} XP · +${missionGold} GOLD)`,
    );

    if (this.missionIndex + 1 < list.length) {
      this.missionIndex += 1;
      this.missionProgressValue = 0;
      this.mapMissionStates[this.currentMap] = {
        index: this.missionIndex,
        progress: 0,
        completedAll: false,
      };
      const nextDef = list[this.missionIndex];
      if (nextDef.metric === 'wave') {
        this.missionProgressValue = this.wave;
      }
      this.onLocalMissionStepEntered(nextDef);
    } else {
      this.missionCompletedAll = true;
      this.mapMissionStates[this.currentMap] = {
        index: list.length,
        progress: def.target,
        completedAll: true,
      };
      if (this.currentMap === 'openworld') {
        this.triggerVictory();
      } else {
        this.showWaveBanner(`SEMUA 8 MISI DI ${MAPS[this.currentMap].name.toUpperCase()} SELESAI! BUKA PETA [M] UNTUK ZONA LAIN`);
      }
    }
  }

  private advanceLocalMission(
    metric: MissionDef['metric'],
    amount: number,
    absolute = false,
  ): void {
    if (this.isMultiplayer || this.missionCompletedAll || this.activePuzzle) return;
    const list = this.getActiveMissions();
    const def = list[this.missionIndex];
    if (!def || def.metric !== metric) return;

    if (absolute) {
      this.missionProgressValue = Math.max(this.missionProgressValue, amount);
    } else {
      this.missionProgressValue += amount;
    }

    if (this.missionProgressValue >= def.target) {
      this.missionProgressValue = def.target;
      this.activePuzzle = {
        missionIndex: this.missionIndex,
        missionTitle: def.title,
        missionMetric: def.metric,
        puzzle: pickPuzzleForMission(this.missionIndex, this.wave + this.kills, this.currentMap),
        wrongAttempts: 0,
        feedback: null,
      };
      this.mouseDown = false;
      this.touchShootHeld = false;
      this.isAiming = false;
      this.keys = {};
      if (document.pointerLockElement === this.renderer.domElement) {
        document.exitPointerLock?.();
      }
      this.emitHud();
    }
  }

  private startWave(waveNum: number): void {
    this.wave = waveNum;
    const diff = DIFFICULTY_TUNING[this.difficulty] ?? DIFFICULTY_TUNING.normal;
    this.zombiesToSpawn = Math.max(4, Math.round((5 + waveNum * 3) * diff.spawnMult));
    this.bossesToSpawn =
      this.currentMap === 'openworld'
        ? waveNum >= 3
          ? 1
          : 0
        : waveNum >= 7
          ? 3
          : waveNum >= 4
            ? 2
            : 1;
    this.bossSpawnTimer = 5.5;
    this.spawnTimer = 0.6;
    this.waveBreakTimer = 0;

    const arenaMaps = MAP_ORDER.filter((m) => m !== 'openworld');
    if (this.currentMap !== 'openworld' && this.autoRotateMaps && waveNum > 1 && (waveNum - 1) % 2 === 0) {
      const idx = arenaMaps.indexOf(this.currentMap);
      const nextMap = arenaMaps[(idx + 1) % arenaMaps.length];
      this.loadMap(nextMap);
      this.visitedMaps.add(nextMap);
      this.playerPos.set(0, 0, 4);
      this.showWaveBanner(`GELOMBANG ${waveNum} · PETA: ${MAPS[nextMap].name.toUpperCase()}`);
    } else if (this.currentMap !== 'openworld' || waveNum > 1) {
      this.showWaveBanner(`GELOMBANG ${waveNum} — BERTAHAN HIDUP`);
    }

    this.audio.playWaveBanner();

    if (this.pickups.length < 5) {
      const spot = this.city.pickupSpots[waveNum % this.city.pickupSpots.length];
      this.spawnPickup(waveNum % 2 === 0 ? 'medkit' : 'ammo', spot);
    }
    this.advanceLocalMission('wave', waveNum, true);
  }

  private clearZombieTelegraph(z: ZombieEntity): void {
    if (z.telegraphRing) {
      this.scene.remove(z.telegraphRing);
      (z.telegraphRing.material as THREE.Material).dispose();
      z.telegraphRing = undefined;
    }
  }

  private clearEntities(): void {
    for (const z of this.zombies) {
      this.clearZombieTelegraph(z);
      this.scene.remove(z.rig.root);
      disposeZombieRig(z.rig);
    }
    this.zombies = [];
    for (const rp of this.remotePlayers.values()) this.scene.remove(rp.rig.root);
    this.remotePlayers.clear();
    for (const p of this.pickups) this.scene.remove(p.mesh);
    this.pickups = [];
    for (const intel of this.intelPickups) {
      this.scene.remove(intel.mesh);
      this.disposeGroup(intel.mesh);
    }
    this.intelPickups = [];
    if (this.objectiveBeaconGroup) this.objectiveBeaconGroup.visible = false;
    for (const t of this.tracers) {
      this.scene.remove(t.mesh);
      (t.mesh.material as THREE.Material).dispose();
    }
    this.tracers = [];
    for (const pt of this.particles) {
      this.scene.remove(pt.mesh);
      (pt.mesh.material as THREE.Material).dispose();
    }
    this.particles = [];
    for (const pr of this.bossProjectiles) {
      this.scene.remove(pr.mesh);
      pr.mesh.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mat = (obj as THREE.Mesh).material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat?.dispose();
        }
      });
    }
    this.bossProjectiles = [];
    for (const sw of this.shockwaves) {
      this.scene.remove(sw.mesh);
      (sw.mesh.material as THREE.Material).dispose();
    }
    this.shockwaves = [];
    this.clearRpgEffects();
  }

  private spawnMenuShowcaseZombies(): void {
    for (const z of this.zombies) {
      this.clearZombieTelegraph(z);
      this.scene.remove(z.rig.root);
      disposeZombieRig(z.rig);
    }
    this.zombies = [];
    const showcaseOrder: ZombieAppearance[] = [
      'officer',
      'ribcage',
      'spiked',
      'mutant',
      'boss_tyrant',
      'boss_bioweapon',
      'boss_lady',
      'officer',
      'ribcage',
      'spiked',
      ZOMBIE_APPEARANCES[Math.floor(Math.random() * ZOMBIE_APPEARANCES.length)],
    ];
    for (const appearance of showcaseOrder) {
      const variant: ZombieVariant = appearance.startsWith('boss_')
        ? 'boss'
        : appearance === 'mutant'
          ? 'brute'
          : appearance === 'spiked'
            ? 'runner'
            : 'walker';
      const pos = findRandomZombieSpawnPos(
        [{ x: 0, z: 0 }],
        this.city.colliders,
        this.city.barrels,
        this.city.spawnPoints,
        5,
        this.city.halfSize,
        { x: 0, z: 0 },
        28,
      );
      this.spawnZombieAt(pos.x, pos.z, variant, appearance);
    }
  }

  private spawnZombieAt(
    x: number,
    z: number,
    variant: ZombieVariant,
    appearance?: ZombieAppearance,
    explicitId?: number,
    explicitHp?: number,
    explicitMaxHp?: number,
  ): ZombieEntity {
    const chosenAppearance: ZombieAppearance =
      appearance ?? ZOMBIE_APPEARANCES[Math.floor(Math.random() * ZOMBIE_APPEARANCES.length)];
    const rig = createZombieModel(variant, this.textures.contactShadow, chosenAppearance);
    rig.root.position.set(x, 0, z);
    this.scene.add(rig.root);

    const diff = DIFFICULTY_TUNING[this.difficulty] ?? DIFFICULTY_TUNING.normal;
    const waveScale = 1 + (this.wave - 1) * 0.14;
    const baseHp =
      chosenAppearance === 'boss_tyrant'
        ? 950
        : chosenAppearance === 'boss_bioweapon'
          ? 850
          : chosenAppearance === 'boss_lady'
            ? 820
            : chosenAppearance === 'mutant'
              ? 380
              : chosenAppearance === 'spiked'
                ? 78
                : chosenAppearance === 'ribcage'
                  ? 84
                  : 95;
    const maxHp = explicitMaxHp ?? Math.round(baseHp * waveScale * diff.hpMult);
    const hp = explicitHp ?? maxHp;
    const speed =
      ((chosenAppearance === 'boss_tyrant'
        ? 2.55
        : chosenAppearance === 'boss_bioweapon'
          ? 3.15
          : chosenAppearance === 'boss_lady'
            ? 2.9
            : chosenAppearance === 'spiked'
              ? 4.95
              : chosenAppearance === 'mutant'
                ? 2.45
                : chosenAppearance === 'ribcage'
                  ? 3.75
                  : 3.2) +
        Math.min(1.4, (this.wave - 1) * 0.12)) *
      diff.speedMult;
    const baseDamage =
      chosenAppearance === 'boss_bioweapon'
        ? 34
        : chosenAppearance === 'boss_tyrant'
          ? 32
          : chosenAppearance === 'boss_lady'
            ? 30
            : chosenAppearance === 'mutant'
              ? 24
              : chosenAppearance === 'spiked'
                ? 14
                : 13;
    const damage = Math.round(baseDamage * diff.damageMult);
    const baseScoreValue =
      chosenAppearance === 'boss_tyrant'
        ? 1000
        : chosenAppearance === 'boss_bioweapon'
          ? 950
          : chosenAppearance === 'boss_lady'
            ? 920
            : chosenAppearance === 'mutant'
              ? 360
              : chosenAppearance === 'spiked'
                ? 150
                : 100;
    const scoreValue = Math.round(baseScoreValue * diff.scoreMult);
    const xpValue =
      chosenAppearance === 'boss_tyrant'
        ? 350
        : chosenAppearance === 'boss_bioweapon'
          ? 340
          : chosenAppearance === 'boss_lady'
            ? 330
            : chosenAppearance === 'mutant'
              ? 135
              : chosenAppearance === 'spiked'
                ? 52
                : 38;
    const radius =
      chosenAppearance === 'boss_tyrant' || chosenAppearance === 'boss_bioweapon'
        ? 0.74
        : chosenAppearance === 'boss_lady'
          ? 0.68
          : chosenAppearance === 'mutant'
            ? 0.65
            : 0.45;

    if (hp < maxHp) {
      const ratio = Math.max(0.01, hp / Math.max(1, maxHp));
      const halfFill = variant === 'boss' ? 0.555 : 0.355;
      rig.hpBarBg.visible = true;
      rig.hpBarFill.scale.x = ratio;
      rig.hpBarFill.position.x = -halfFill * (1 - ratio);
    }

    const entity: ZombieEntity = {
      id: explicitId ?? this.nextEntityId++,
      variant,
      appearance: chosenAppearance,
      rig,
      position: new THREE.Vector3(x, 0, z),
      targetPos: new THREE.Vector3(x, 0, z),
      rotationY: Math.random() * Math.PI * 2,
      targetYaw: 0,
      hp,
      maxHp,
      speed,
      damage,
      scoreValue,
      xpValue,
      radius,
      attackCooldown: 0,
      attackAnim: 0,
      attackHand: Math.random() < 0.5 ? 1 : -1,
      hitFlash: 0,
      hitFlinch: 0,
      walkPhase: Math.random() * Math.PI * 2,
      moveWeight: 0,
      strideOffset: Math.random() * Math.PI * 2,
      dead: false,
      deathTimer: 0,
      wanderAngle: Math.random() * Math.PI * 2,
      skillState: 'none',
      skillTimer: 0,
      skillCooldown: variant === 'boss' ? 2.8 + Math.random() * 1.4 : 0,
      skillDirX: 0,
      skillDirZ: 1,
      skillHitDealt: false,
    };
    this.zombies.push(entity);
    return entity;
  }

  private handlePickupGrant(pickupType: PickupType, explicitHp?: number): void {
    if (pickupType === 'medkit') {
      this.hp = explicitHp !== undefined ? explicitHp : Math.min(this.maxHp, this.hp + 35);
      this.pickupNotice = '+35 HP MEDKIT';
      this.audio.playPickup('medkit');
    } else if (pickupType === 'ammo') {
      this.refillAllUnlockedAmmo();
      this.pickupNotice = '+AMUNISI SEMUA SENJATA';
      this.audio.playPickup('ammo');
    } else {
      const wId: WeaponId =
        pickupType === 'weapon_smg'
          ? 'smg'
          : pickupType === 'weapon_shotgun'
            ? 'shotgun'
            : 'rifle';
      const spec = WEAPONS[wId];
      const st = this.weaponState[wId];
      if (!st.unlocked) {
        st.unlocked = true;
        st.ammoInMag = spec.magSize;
        st.reserveAmmo = spec.startReserve;
        this.currentWeapon = wId;
        this.isReloading = false;
        this.reloadTimer = 0;
        setPlayerWeaponModel(this.player, wId);
        setFirstPersonWeapon(this.fpsRig, wId);
        this.audio.playWeaponUnlock();
        this.showUnlockBanner(`SENJATA DROP DIDAPAT: ${spec.name.toUpperCase()}!`);
        this.pickupNotice = `+SENJATA BARU: ${spec.shortName}`;
      } else {
        st.reserveAmmo += spec.ammoPickupAmount;
        this.audio.playPickup('ammo');
        this.pickupNotice = `+${spec.ammoPickupAmount} AMUNISI ${spec.shortName}`;
      }
    }
    this.pickupNoticeTimer = 2.2;
  }

  private spawnPickup(type: PickupType, pos: THREE.Vector3, explicitId?: number): PickupEntity {
    const mesh = createPickupModel(type);
    mesh.position.set(pos.x, 0, pos.z);
    this.scene.add(mesh);
    const entity: PickupEntity = {
      id: explicitId ?? this.nextEntityId++,
      type,
      mesh,
      position: new THREE.Vector3(pos.x, 0, pos.z),
      age: 0,
    };
    this.pickups.push(entity);
    return entity;
  }

  private spawnTracer(start: THREE.Vector3, end: THREE.Vector3, colorHex = 0xfef08a): void {
    const dist = start.distanceTo(end);
    if (dist < 0.05) return;
    const mat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.92,
    });
    const mesh = new THREE.Mesh(this.tracerGeo, mat);
    mesh.scale.set(1, 1, dist);
    mesh.position.copy(start).lerp(end, 0.5);
    mesh.lookAt(end);
    this.scene.add(mesh);
    this.tracers.push({ mesh, life: 0.08, maxLife: 0.08 });
  }

  private spawnParticles(
    origin: THREE.Vector3,
    colorHex: number,
    count: number,
    speed = 5,
    scale = 1,
  ): void {
    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 1,
      });
      const mesh = new THREE.Mesh(this.particleGeo, mat);
      mesh.position.copy(origin);
      mesh.scale.setScalar(scale);
      this.scene.add(mesh);
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        0.35 + Math.random() * 1.1,
        (Math.random() - 0.5) * 2,
      )
        .normalize()
        .multiplyScalar(speed * (0.5 + Math.random() * 0.8));
      this.particles.push({
        mesh,
        velocity,
        life: 0.45 + Math.random() * 0.25,
        maxLife: 0.65,
        scaleStart: scale,
      });
    }
  }

  private spawnBossTelegraph(z: ZombieEntity): void {
    this.clearZombieTelegraph(z);
    const colorHex =
      z.appearance === 'boss_tyrant'
        ? 0xf97316
        : z.appearance === 'boss_bioweapon'
          ? 0xef4444
          : 0xf43f5e;
    const mat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(this.shockwaveGeo, mat);
    ring.position.set(z.position.x, 0.06, z.position.z);
    ring.scale.setScalar(z.appearance === 'boss_tyrant' ? 1.5 : 1.35);
    this.scene.add(ring);
    z.telegraphRing = ring;
  }

  private spawnBossShockwave(x: number, z: number, maxScale: number, colorHex: number): void {
    const mat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(this.shockwaveGeo, mat);
    mesh.position.set(x, 0.08, z);
    mesh.scale.setScalar(0.8);
    this.scene.add(mesh);
    this.shockwaves.push({ mesh, life: 0.48, maxLife: 0.48, maxScale });
  }

  private spawnBossProjectile(
    x: number,
    y: number,
    z: number,
    vx: number,
    vz: number,
    damage: number,
    networked: boolean,
    explicitId?: number,
  ): BossProjectileEntity {
    const group = new THREE.Group();
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xfb7185 });
    const core = new THREE.Mesh(this.bossOrbGeo, coreMat);
    const shellMat = new THREE.MeshBasicMaterial({
      color: 0x9f1239,
      wireframe: true,
      transparent: true,
      opacity: 0.9,
    });
    const shell = new THREE.Mesh(this.bossOrbSpikeGeo, shellMat);
    group.add(core, shell);
    group.position.set(x, y, z);
    this.scene.add(group);

    const proj: BossProjectileEntity = {
      id: explicitId ?? this.nextEntityId++,
      mesh: group,
      position: new THREE.Vector3(x, y, z),
      vx,
      vz,
      damage,
      life: 2.8,
      networked,
    };
    this.bossProjectiles.push(proj);
    return proj;
  }

  private disposeBossProjectile(pr: BossProjectileEntity): void {
    this.scene.remove(pr.mesh);
    pr.mesh.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mat = (obj as THREE.Mesh).material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat?.dispose();
      }
    });
  }

  private animateZombieRig(
    z: ZombieEntity,
    dt: number,
    elapsed: number,
    targetMoveFactor: number,
  ): void {
    z.hitFlinch = Math.max(0, z.hitFlinch - dt * 5.2);
    z.attackAnim = Math.max(0, z.attackAnim - dt * 3.1);
    z.moveWeight = THREE.MathUtils.damp(z.moveWeight, targetMoveFactor, 9, dt);

    const isRunner = z.appearance === 'spiked';
    const isHeavy = z.appearance === 'mutant' || z.appearance === 'boss_tyrant';
    const isLady = z.appearance === 'boss_lady';
    const isBioweapon = z.appearance === 'boss_bioweapon';
    const isWalker = !isRunner && !isHeavy && !isLady && !isBioweapon;

    const activeCharge = z.skillState === 'active' && isBioweapon;
    const pace = activeCharge ? 14.5 : 2.1 + z.speed * 2.05;
    z.walkPhase += dt * pace * (0.28 + 0.72 * z.moveWeight);
    const ph = z.walkPhase + z.strideOffset;

    const stride = isRunner ? 0.78 : isHeavy ? 0.46 : isLady ? 0.38 : 0.56;
    const limpSkew = isWalker ? 0.28 : isBioweapon ? 0.1 : 0;
    const baseLean = isRunner ? 0.34 : isWalker ? 0.16 : isBioweapon ? 0.18 : isLady ? 0.05 : 0.1;
    const armRaise = isRunner ? -0.62 : isWalker ? -0.44 : isHeavy ? -0.26 : -0.3;
    const elbowBase = isRunner ? -0.96 : isWalker ? -0.64 : isHeavy ? -0.44 : -0.5;

    const mw = z.moveWeight;
    const sinL = Math.sin(ph);
    const sinR = Math.sin(ph + Math.PI + limpSkew);

    let legLX = sinL * stride * mw;
    let legRX = sinR * stride * mw * (1 - limpSkew * 0.3);
    let kneeLX = (0.1 + Math.max(0, -Math.cos(ph)) * 0.78) * mw;
    let kneeRX = (0.1 + Math.max(0, -Math.cos(ph + Math.PI + limpSkew)) * 0.78) * mw;

    const walkBob = Math.abs(Math.sin(ph)) * (isLady ? 0.035 : isHeavy ? 0.055 : 0.07) * mw;
    const idleBreath = Math.sin(elapsed * 2.4 + z.strideOffset) * 0.014 * (1 - mw * 0.5);
    let bodyY = walkBob + idleBreath - (isRunner ? 0.06 * mw : 0);
    let torsoLean = baseLean * (0.45 + 0.55 * mw);
    let torsoTwist = Math.cos(ph) * (isHeavy ? 0.08 : 0.13) * mw;
    let torsoRoll =
      Math.sin(ph) * (isLady ? 0.035 : isWalker ? 0.085 : 0.055) * mw +
      (isWalker ? 0.05 * mw : 0);

    let armLX = armRaise + sinR * 0.28 * mw + Math.sin(elapsed * 2.1 + z.strideOffset) * 0.05;
    let armRX = armRaise + sinL * 0.28 * mw - Math.sin(elapsed * 2.1 + z.strideOffset) * 0.05;
    let armLY = 0.06 * mw;
    let armRY = -0.06 * mw;
    let elbowLX = elbowBase - Math.max(0, sinR) * 0.24 * mw;
    let elbowRX = elbowBase - Math.max(0, sinL) * 0.24 * mw;

    let headX = Math.sin(elapsed * 2.8 + z.strideOffset) * 0.05 - torsoLean * 0.35;
    let headY = Math.sin(elapsed * 1.4 + z.strideOffset) * 0.08;
    let headZ = Math.cos(ph) * 0.05 * mw;

    // Alternating multi-phase melee strike
    if (z.attackAnim > 0) {
      const t = 1 - z.attackAnim;
      const useRight = z.attackHand === 1 || isBioweapon;
      const bothHands = z.variant === 'brute' || z.appearance === 'boss_tyrant';
      if (t < 0.28) {
        const w = t / 0.28;
        torsoLean -= w * 0.14;
        torsoTwist += (useRight ? -0.3 : 0.3) * w;
        if (useRight || bothHands) {
          armRX += 0.58 * w;
          elbowRX -= 0.35 * w;
        }
        if (!useRight || bothHands) {
          armLX += 0.58 * w;
          elbowLX -= 0.35 * w;
        }
      } else {
        const s =
          t < 0.65 ? (t - 0.28) / 0.37 : 1 - (t - 0.65) / 0.35;
        torsoLean += s * 0.26;
        torsoTwist += (useRight ? 0.38 : -0.38) * s;
        if (useRight || bothHands) {
          armRX = THREE.MathUtils.lerp(armRX, -1.55, s);
          armRY = THREE.MathUtils.lerp(armRY, -0.45, s);
          elbowRX = THREE.MathUtils.lerp(elbowRX, -0.25, s);
        }
        if (!useRight || bothHands) {
          armLX = THREE.MathUtils.lerp(armLX, -1.55, s);
          armLY = THREE.MathUtils.lerp(armLY, 0.45, s);
          elbowLX = THREE.MathUtils.lerp(elbowLX, -0.25, s);
        }
      }
    }

    // Bullet hit flinch reaction
    if (z.hitFlinch > 0) {
      const flinch = Math.sin(z.hitFlinch * Math.PI);
      torsoLean -= flinch * 0.24;
      torsoTwist += flinch * 0.18 * z.attackHand;
      headX -= flinch * 0.32;
      headZ += flinch * 0.18 * z.attackHand;
      armLX += flinch * 0.2;
      armRX += flinch * 0.2;
    }

    // Boss special skill choreography
    if (z.variant === 'boss' && z.skillState !== 'none') {
      if (z.appearance === 'boss_tyrant') {
        if (z.skillState === 'windup') {
          const p = Math.min(1, 1 - z.skillTimer / 0.75);
          bodyY += p * 0.08;
          torsoLean = THREE.MathUtils.lerp(torsoLean, -0.18, p);
          armLX = THREE.MathUtils.lerp(armLX, -2.25, p);
          armRX = THREE.MathUtils.lerp(armRX, -2.25, p);
          elbowLX = THREE.MathUtils.lerp(elbowLX, -0.42, p);
          elbowRX = THREE.MathUtils.lerp(elbowRX, -0.42, p);
          headX -= 0.15 * p;
        } else {
          const impact = Math.min(1, z.skillTimer / 0.45);
          bodyY -= 0.22 * impact;
          torsoLean = THREE.MathUtils.lerp(torsoLean, 0.38, impact);
          kneeLX = Math.max(kneeLX, 0.55 * impact);
          kneeRX = Math.max(kneeRX, 0.55 * impact);
          legLX = -0.28 * impact;
          legRX = -0.28 * impact;
          armLX = THREE.MathUtils.lerp(armLX, 0.12, impact);
          armRX = THREE.MathUtils.lerp(armRX, 0.12, impact);
          elbowLX = -0.22;
          elbowRX = -0.22;
        }
      } else if (z.appearance === 'boss_bioweapon') {
        if (z.skillState === 'windup') {
          const p = Math.min(1, 1 - z.skillTimer / 0.65);
          bodyY -= 0.22 * p;
          torsoLean = THREE.MathUtils.lerp(torsoLean, 0.28, p);
          torsoTwist = THREE.MathUtils.lerp(torsoTwist, -0.48, p);
          legLX = -0.42 * p;
          kneeLX = 0.85 * p;
          legRX = 0.28 * p;
          kneeRX = 0.52 * p;
          armRX = THREE.MathUtils.lerp(armRX, 0.82, p);
          armRY = THREE.MathUtils.lerp(armRY, -0.58, p);
          elbowRX = THREE.MathUtils.lerp(elbowRX, -0.78, p);
          armLX = THREE.MathUtils.lerp(armLX, -0.85, p);
        } else {
          const prog = Math.min(1, 1 - z.skillTimer / 0.55);
          torsoLean = 0.44;
          torsoTwist = THREE.MathUtils.lerp(-0.4, 0.55, prog);
          armRX = THREE.MathUtils.lerp(-0.6, -1.65, Math.min(1, prog * 1.4));
          armRY = THREE.MathUtils.lerp(-0.55, 0.65, prog);
          elbowRX = -0.22;
          armLX = 0.35;
        }
      } else {
        // boss_lady: Blood Thorn Barrage
        if (z.skillState === 'windup') {
          const p = Math.min(1, 1 - z.skillTimer / 0.7);
          bodyY += 0.14 * p;
          torsoLean = -0.1 * p;
          armLX = THREE.MathUtils.lerp(armLX, -1.25, p);
          armRX = THREE.MathUtils.lerp(armRX, -1.25, p);
          armLY = -0.48 * p;
          armRY = 0.48 * p;
          elbowLX = -0.34;
          elbowRX = -0.34;
          headX -= 0.12 * p;
        } else {
          const thrust = Math.min(1, z.skillTimer / 0.4);
          torsoLean = 0.16 * thrust;
          armLX = THREE.MathUtils.lerp(armLX, -1.45, thrust);
          armRX = THREE.MathUtils.lerp(armRX, -1.45, thrust);
          armLY = 0.15 * thrust;
          armRY = -0.15 * thrust;
          elbowLX = -0.18;
          elbowRX = -0.18;
        }
      }
    }

    const dampRate = z.attackAnim > 0 || z.hitFlinch > 0.1 || z.skillState !== 'none' ? 22 : 14;
    const rig = z.rig;

    rig.bodyGroup.position.y = THREE.MathUtils.damp(rig.bodyGroup.position.y, bodyY, dampRate, dt);
    rig.bodyGroup.rotation.x = THREE.MathUtils.damp(rig.bodyGroup.rotation.x, torsoLean, dampRate, dt);
    rig.bodyGroup.rotation.y = THREE.MathUtils.damp(rig.bodyGroup.rotation.y, torsoTwist, dampRate, dt);
    rig.bodyGroup.rotation.z = THREE.MathUtils.damp(rig.bodyGroup.rotation.z, torsoRoll, dampRate, dt);

    rig.legL.rotation.x = THREE.MathUtils.damp(rig.legL.rotation.x, legLX, dampRate, dt);
    rig.legR.rotation.x = THREE.MathUtils.damp(rig.legR.rotation.x, legRX, dampRate, dt);
    rig.kneeL.rotation.x = THREE.MathUtils.damp(rig.kneeL.rotation.x, kneeLX, dampRate, dt);
    rig.kneeR.rotation.x = THREE.MathUtils.damp(rig.kneeR.rotation.x, kneeRX, dampRate, dt);

    rig.armL.rotation.x = THREE.MathUtils.damp(rig.armL.rotation.x, armLX, dampRate, dt);
    rig.armL.rotation.y = THREE.MathUtils.damp(rig.armL.rotation.y, armLY, dampRate, dt);
    rig.armR.rotation.x = THREE.MathUtils.damp(rig.armR.rotation.x, armRX, dampRate, dt);
    rig.armR.rotation.y = THREE.MathUtils.damp(rig.armR.rotation.y, armRY, dampRate, dt);
    rig.elbowL.rotation.x = THREE.MathUtils.damp(rig.elbowL.rotation.x, elbowLX, dampRate, dt);
    rig.elbowR.rotation.x = THREE.MathUtils.damp(rig.elbowR.rotation.x, elbowRX, dampRate, dt);

    rig.headMesh.rotation.x = THREE.MathUtils.damp(
      rig.headMesh.rotation.x,
      rig.baseHeadRot.x + headX,
      dampRate,
      dt,
    );
    rig.headMesh.rotation.y = THREE.MathUtils.damp(
      rig.headMesh.rotation.y,
      rig.baseHeadRot.y + headY,
      dampRate,
      dt,
    );
    rig.headMesh.rotation.z = THREE.MathUtils.damp(
      rig.headMesh.rotation.z,
      rig.baseHeadRot.z + headZ,
      dampRate,
      dt,
    );

    if (z.telegraphRing) {
      z.telegraphRing.position.set(z.position.x, 0.06, z.position.z);
      if (z.appearance === 'boss_tyrant') {
        const prog = Math.min(1, Math.max(0, 1 - z.skillTimer / 0.75));
        z.telegraphRing.scale.setScalar(1.3 + prog * 4.3);
        (z.telegraphRing.material as THREE.MeshBasicMaterial).opacity = 0.4 + 0.45 * prog;
      } else {
        const pulse = 1.65 + Math.sin(elapsed * 18) * 0.28;
        z.telegraphRing.scale.setScalar(pulse);
      }
    }
  }

  private tryShoot(): void {
    if (
      this.phase !== 'playing' ||
      this.spectatingDowned ||
      this.activePuzzle ||
      this.mapTravelOpen ||
      this.rpgMenuOpen ||
      this.activeVehicleId
    )
      return;
    const wSpec = WEAPONS[this.currentWeapon];
    const wAmmo = this.weaponState[this.currentWeapon];
    if (this.isReloading || this.fireCooldown > 0) return;

    if (wAmmo.ammoInMag <= 0) {
      this.fireCooldown = 0.25;
      this.audio.playEmptyClick();
      if (wAmmo.reserveAmmo > 0) this.triggerReload();
      return;
    }

    wAmmo.ammoInMag--;
    this.fireCooldown = this.overdriveTimer > 0 ? wSpec.fireRate * 0.78 : wSpec.fireRate;
    this.recoilAnim = 1;
    this.muzzleTimer = 0.055;
    this.camShake = Math.max(
      this.camShake,
      this.currentWeapon === 'shotgun' ? 0.18 : this.currentWeapon === 'rifle' ? 0.11 : 0.075,
    );
    this.audio.playGunshot(this.currentWeapon);

    this.playerYaw = this.camYaw + Math.PI;
    this.player.root.rotation.y = this.playerYaw;
    this.player.root.updateMatrixWorld(true);

    if (this.cameraMode === 'fps') {
      this.camera.updateMatrixWorld(true);
      this.fpsRig.muzzleFlash.visible = true;
      this.fpsRig.muzzleFlash.rotation.z = Math.random() * Math.PI;
      this.fpsRig.muzzleLight.intensity = 6;
      this.fpsRig.muzzlePoint.getWorldPosition(_vecA);
    } else {
      this.player.muzzleFlash.visible = true;
      this.player.muzzleFlash.rotation.z = Math.random() * Math.PI;
      this.player.muzzleLight.intensity = 6;
      this.player.muzzlePoint.getWorldPosition(_vecA);
    }

    const zombieHits: THREE.Object3D[] = [];
    const meshToZombie = new Map<THREE.Object3D, ZombieEntity>();
    for (const z of this.zombies) {
      if (z.dead) continue;
      for (const m of z.rig.hitMeshes) {
        zombieHits.push(m);
        meshToZombie.set(m, z);
      }
    }
    const allTargets = [...zombieHits, ...this.city.worldHitMeshes];
    const forgeTier = this.weaponForgeLevels[this.currentWeapon] ?? 0;
    const dmgMultiplier = (1 + this.getDamageBonusPct() / 100) * (1 + forgeTier * 0.18);
    const critChance = this.getCritChancePct();

    _raycaster.setFromCamera(_centerNdc, this.camera);
    const baseDir = _vecC.copy(_raycaster.ray.direction);
    const rayOrigin = _raycaster.ray.origin;
    _raycaster.far = wSpec.range;

    let firstTracerEnd: THREE.Vector3 | null = null;

    const baseSpread = this.isCrouching ? wSpec.spread * 0.65 : wSpec.spread;
    const effectiveSpread = this.isAiming ? baseSpread * 0.45 : baseSpread;
    const minHitDist = this.cameraMode === 'fps' ? 0.22 : 2.0;

    for (let p = 0; p < wSpec.pellets; p++) {
      _shotDir.copy(baseDir);
      if (effectiveSpread > 0) {
        _shotDir.x += (Math.random() - 0.5) * effectiveSpread;
        _shotDir.y += (Math.random() - 0.5) * effectiveSpread;
        _shotDir.z += (Math.random() - 0.5) * effectiveSpread;
        _shotDir.normalize();
      }
      _raycaster.set(rayOrigin, _shotDir);

      const intersects = _raycaster.intersectObjects(allTargets, false);
      let hitPoint = _vecB.copy(rayOrigin).addScaledVector(_shotDir, wSpec.range);

      if (intersects.length > 0) {
        const firstHit = intersects.find((hit) => hit.distance > minHitDist) || intersects[0];
        hitPoint = firstHit.point;

        const hitZombie = meshToZombie.get(firstHit.object);
        if (hitZombie) {
          const isHead = firstHit.object.userData?.part === 'head';
          const isRpgCrit = !isHead && Math.random() * 100 < critChance;
          const isCrit = isHead || isRpgCrit;
          const rawDmg = isHead ? wSpec.headshotDamage : wSpec.damage;
          const dmg = Math.round(rawDmg * dmgMultiplier * (isRpgCrit ? 1.75 : 1));
          if (p === 0 || isCrit) {
            this.spawnCombatText(
              hitPoint,
              isCrit ? `CRIT ${dmg}!` : `-${dmg}`,
              isCrit ? 'crit' : 'damage',
            );
          }
          if (this.isMultiplayer) {
            this.multiplayer.send({
              type: 'player:hitZombie',
              zombieId: hitZombie.id,
              damage: dmg,
              isHeadshot: isCrit,
            });
            hitZombie.hitFlash = 0.12;
            hitZombie.hitFlinch = 1;
            this.hitMarkerTimer = 0.14;
            this.isCriticalHit = isCrit;
            this.audio.playZombieHit(isCrit);
            this.spawnParticles(hitPoint, isCrit ? 0xb91c1c : 0x7f1d1d, isCrit ? 8 : 5, 4.5, 0.85);
          } else {
            this.damageZombieSolo(hitZombie, dmg, isCrit, hitPoint);
          }
        } else if (typeof firstHit.object.userData?.barrelId === 'number') {
          const bId = firstHit.object.userData.barrelId as number;
          const barrel = this.city.barrels[bId];
          if (barrel && !barrel.exploded) {
            if (this.isMultiplayer) {
              this.multiplayer.send({ type: 'player:hitBarrel', barrelId: bId });
            } else {
              this.detonateBarrelSolo(barrel);
            }
          }
        } else {
          this.spawnParticles(hitPoint, 0xfbbf24, 3, 4.6, 0.55);
          this.spawnParticles(hitPoint, 0x94a3b8, 2, 2.8, 0.65);
        }
      }

      if (!firstTracerEnd) firstTracerEnd = hitPoint.clone();
      this.spawnTracer(_vecA, hitPoint, wSpec.tracerColor);
    }

    if (this.isMultiplayer && firstTracerEnd) {
      this.multiplayer.send({
        type: 'player:shot',
        start: { x: _vecA.x, y: _vecA.y, z: _vecA.z },
        end: { x: firstTracerEnd.x, y: firstTracerEnd.y, z: firstTracerEnd.z },
      });
    }

    if (wAmmo.ammoInMag === 0 && wAmmo.reserveAmmo > 0) {
      this.triggerReload();
    }
    this.emitHud();
  }

  private detonateBarrelSolo(barrel: BuiltCity['barrels'][number]): void {
    barrel.exploded = true;
    barrel.respawnTimer = 26;
    barrel.mesh.visible = false;
    this.audio.playExplosion();
    this.camShake = Math.max(this.camShake, 0.48);

    this.spawnParticles(barrel.position, 0xf97316, 18, 9.5, 1.8);
    this.spawnParticles(barrel.position, 0xfef08a, 10, 7.0, 1.3);
    this.advanceLocalMission('barrels', 1);

    const blastRadius = 7.2;
    for (const z of this.zombies) {
      if (z.dead) continue;
      const dist = z.position.distanceTo(barrel.position);
      if (dist <= blastRadius) {
        const falloff = 1 - dist / blastRadius;
        const dmg = Math.round(90 + 110 * falloff);
        this.damageZombieSolo(z, dmg, true, z.position);
      }
    }
  }

  private damageZombieSolo(
    z: ZombieEntity,
    dmg: number,
    isCritical: boolean,
    hitPoint: THREE.Vector3,
  ): void {
    if (z.dead) return;
    z.hp = Math.max(0, z.hp - dmg);
    z.hitFlash = 0.12;
    z.hitFlinch = 1;
    this.hitMarkerTimer = 0.14;
    this.isCriticalHit = isCritical;
    this.audio.playZombieHit(isCritical);

    const ratio = z.hp / z.maxHp;
    const halfFill = z.variant === 'boss' ? 0.555 : 0.355;
    z.rig.hpBarBg.visible = true;
    z.rig.hpBarFill.scale.x = Math.max(0.01, ratio);
    z.rig.hpBarFill.position.x = -halfFill * (1 - ratio);

    _vecC.copy(z.position).sub(this.playerPos).setY(0).normalize();
    z.position.addScaledVector(_vecC, isCritical ? 0.45 : 0.25);

    this.spawnParticles(
      hitPoint,
      isCritical ? 0xb91c1c : 0x7f1d1d,
      isCritical ? 9 : 5,
      4.5,
      0.85,
    );

    if (z.hp <= 0) {
      this.clearZombieTelegraph(z);
      z.dead = true;
      z.deathTimer = 0.55;
      z.rig.hpBarBg.visible = false;
      this.kills++;
      if (isCritical) this.headshots++;
      this.score += z.scoreValue + (isCritical ? 50 : 0);
      if (this.score > this.highScore) {
        this.highScore = this.score;
        try {
          localStorage.setItem(HIGH_SCORE_KEY, String(this.highScore));
        } catch {
          // Ignore storage error
        }
      }

      const baseGold =
        z.variant === 'boss'
          ? 240
          : z.variant === 'brute'
            ? 65
            : z.variant === 'runner'
              ? 26
              : 18;
      this.grantGold(baseGold, z.position);
      this.awardLocalXp(z.xpValue + (isCritical ? 15 : 0));
      this.checkWeaponUnlocks();
      this.advanceLocalMission('kills', 1);
      if (isCritical) this.advanceLocalMission('headshots', 1);
      if (z.variant === 'brute' || z.variant === 'boss') this.advanceLocalMission('brutes', 1);

      if (z.variant === 'boss') {
        this.bossKills++;
        const bossInfo = ZOMBIE_APPEARANCE_INFO[z.appearance];
        this.showUnlockBanner(`BOS DIKALAHKAN: ${bossInfo.name.toUpperCase()}!`);
        this.advanceLocalMission('bosses', 1);

        // Always drop 2 useful physical 3D pickups at boss defeat location
        const weaponDrop: PickupType = !this.weaponState.smg.unlocked
          ? 'weapon_smg'
          : !this.weaponState.shotgun.unlocked
            ? 'weapon_shotgun'
            : 'weapon_rifle';
        const supplyDrop: PickupType = this.hp < this.maxHp * 0.78 ? 'medkit' : 'ammo';
        this.spawnPickup(
          weaponDrop,
          _vecA.set(z.position.x - 1.05, 0, z.position.z + 0.35),
        );
        this.spawnPickup(
          supplyDrop,
          _vecA.set(z.position.x + 1.05, 0, z.position.z - 0.35),
        );

        const rewardPreview = this.previewNextBossReward();
        if (this.activePuzzle) {
          // Boss kill also finished the active mission: merge Boss Chest Reward into the same SMP/SMA riddle
          this.activePuzzle = {
            ...this.activePuzzle,
            bossName: bossInfo.name,
            rewardPreview,
          };
          this.pendingBossRewardName = bossInfo.name;
        } else {
          // Mandatory SMP / SMA Riddle Gate to unlock Boss Weapon / RPG Item Chest
          this.activePuzzle = {
            source: 'boss',
            bossName: bossInfo.name,
            rewardPreview,
            missionIndex: this.missionIndex,
            missionTitle: `Teka-Teki Hadiah Bos: ${bossInfo.name}`,
            missionMetric: 'bosses',
            puzzle: pickBossPuzzle(this.bossKills, this.wave + this.kills, this.currentMap),
            wrongAttempts: 0,
            feedback: null,
          };
          this.mouseDown = false;
          this.touchShootHeld = false;
          this.isAiming = false;
          this.keys = {};
          if (document.pointerLockElement === this.renderer.domElement) {
            document.exitPointerLock?.();
          }
        }
      }

      this.spawnParticles(
        _vecC.copy(z.position).setY(1.1),
        z.variant === 'boss' ? 0xf59e0b : 0x881337,
        z.variant === 'boss' ? 18 : 11,
        5.5,
        z.variant === 'boss' ? 1.35 : 1.05,
      );

      if (z.variant !== 'boss' && this.pickups.length < 12) {
        let dropType: PickupType | null = null;
        if (
          this.kills === 2 ||
          (!this.weaponState.smg.unlocked && this.kills >= 4 && Math.random() < 0.6)
        ) {
          dropType = 'weapon_smg';
        } else if (
          this.kills === 6 ||
          (!this.weaponState.shotgun.unlocked && this.kills >= 8 && Math.random() < 0.55)
        ) {
          dropType = 'weapon_shotgun';
        } else if (
          this.kills === 11 ||
          (!this.weaponState.rifle.unlocked && this.kills >= 14 && Math.random() < 0.55)
        ) {
          dropType = 'weapon_rifle';
        } else if (Math.random() < 0.42) {
          if (Math.random() < 0.38) {
            const pool: PickupType[] = ['weapon_smg', 'weapon_shotgun', 'weapon_rifle'];
            dropType = pool[Math.floor(Math.random() * pool.length)];
          } else {
            dropType = this.hp < 65 && Math.random() < 0.6 ? 'medkit' : 'ammo';
          }
        }
        if (dropType) {
          this.spawnPickup(dropType, z.position);
        }
      }

      if (z.variant === 'boss') {
        this.emitHud();
      }
    }
  }

  private applyServerSnapshot(snap: ServerSnapshotPayload): void {
    if (!this.isMultiplayer || this.phase === 'menu') return;

    this.wave = snap.wave;
    this.difficulty = snap.difficulty ?? this.difficulty;
    this.serverZombiesRemaining = snap.zombiesRemaining;
    this.serverMissionState = snap.mission;
    if (typeof snap.freeRoamMode === 'boolean') {
      this.freeRoamMode = snap.freeRoamMode;
    }

    if (snap.mapId !== this.currentMap) {
      this.loadMap(snap.mapId);
    }

    if (typeof snap.dayCount === 'number') this.dayCount = snap.dayCount;
    if (typeof snap.timeOfDay === 'number') this.timeOfDay = snap.timeOfDay;
    if (snap.weather) this.currentWeather = snap.weather;
    if (snap.mapMissionCompleted) {
      this.serverMapMissionCompleted = snap.mapMissionCompleted;
    }

    // Sync active mission / boss puzzle gate from server
    const prevPuzzle = this.activePuzzle;
    const prevHadPuzzle = prevPuzzle !== null;
    if (snap.activePuzzle) {
      this.activePuzzle = snap.activePuzzle;
      if (!prevHadPuzzle) {
        this.mouseDown = false;
        this.touchShootHeld = false;
        this.isAiming = false;
        this.keys = {};
        if (document.pointerLockElement === this.renderer.domElement) {
          document.exitPointerLock?.();
        }
        this.emitHud();
      }
    } else if (prevHadPuzzle) {
      this.activePuzzle = null;
      this.audio.playPuzzleSuccess();
      if (prevPuzzle?.source === 'boss' || prevPuzzle?.bossName) {
        this.bossKills++;
        this.grantBossLootReward(prevPuzzle.bossName ?? 'Zombie Bos');
      } else {
        this.grantGold(80, this.playerPos);
      }
      if ((this.phase as GamePhase) === 'playing') {
        this.requestPointerLockSafe();
      }
      this.emitHud();
    }

    // Sync vehicles from server
    const localPlayerId = this.multiplayer.lobby.playerId;
    if (snap.vehicles) {
      for (const sv of snap.vehicles) {
        const lv = this.vehicles.find((v) => v.id === sv.id);
        if (!lv) continue;
        lv.driverId = sv.driverId;
        const iAmDriver = sv.driverId === localPlayerId && localPlayerId !== null;
        if (iAmDriver) {
          this.activeVehicleId = lv.id;
        } else {
          if (this.activeVehicleId === lv.id && sv.driverId !== localPlayerId) {
            this.activeVehicleId = null;
          }
          lv.targetX = sv.x;
          lv.targetZ = sv.z;
          lv.targetYaw = sv.yaw;
          lv.speed = sv.speed;
        }
      }
    }

    // Sync barrels
    for (const sb of snap.barrels) {
      const localBarrel = this.city.barrels[sb.id];
      if (localBarrel) {
        localBarrel.exploded = sb.exploded;
        localBarrel.mesh.visible = !sb.exploded;
      }
    }

    // Sync local player authoritative stats & remote teammates
    const myId = this.multiplayer.lobby.playerId;
    const seenPlayerIds = new Set<string>();
    for (const sp of snap.players) {
      if (sp.id === myId) {
        this.hp = sp.hp;
        this.maxHp = sp.maxHp;
        this.level = sp.level;
        this.xp = sp.xp;
        this.xpToNext = sp.xpToNext;
        this.kills = sp.kills;
        this.score = sp.score;
        if (this.score > this.highScore) {
          this.highScore = this.score;
          try {
            localStorage.setItem(HIGH_SCORE_KEY, String(this.highScore));
          } catch {
            // ignore
          }
        }
        this.checkWeaponUnlocks();
        continue;
      }

      seenPlayerIds.add(sp.id);
      const resolvedSpChar: CharacterId = sp.characterId ?? 'raka';
      const resolvedSpSkin: CharacterSkinId = resolveSkinForCharacter(resolvedSpChar, sp.skinId);
      let rp = this.remotePlayers.get(sp.id);
      if (!rp) {
        const rig = createPlayerModel(
          this.textures.contactShadow,
          resolvedSpChar,
          sp.color,
          sp.name,
          resolvedSpSkin,
        );
        rig.root.position.set(sp.x, sp.y ?? 0, sp.z);
        this.scene.add(rig.root);
        rp = {
          id: sp.id,
          name: sp.name,
          color: sp.color,
          characterId: resolvedSpChar,
          skinId: resolvedSpSkin,
          rig,
          position: new THREE.Vector3(sp.x, sp.y ?? 0, sp.z),
          targetPos: new THREE.Vector3(sp.x, sp.y ?? 0, sp.z),
          yaw: sp.yaw,
          targetYaw: sp.yaw,
          weaponId: sp.weaponId,
          isMoving: sp.isMoving,
          isRunning: sp.isRunning,
          isCrouching: Boolean(sp.isCrouching),
          isDashing: Boolean(sp.isDashing),
          crouchBlend: sp.isCrouching ? 1 : 0,
          speedRatio: 0,
          walkPhase: 0,
          muzzleTimer: 0,
          alive: sp.alive,
          hp: sp.hp,
          maxHp: sp.maxHp,
          level: sp.level,
          kills: sp.kills,
        };
        this.remotePlayers.set(sp.id, rp);
      } else {
        if (resolvedSpChar !== rp.characterId || resolvedSpSkin !== rp.skinId) {
          this.scene.remove(rp.rig.root);
          this.disposeGroup(rp.rig.root);
          rp.characterId = resolvedSpChar;
          rp.skinId = resolvedSpSkin;
          rp.rig = createPlayerModel(
            this.textures.contactShadow,
            resolvedSpChar,
            sp.color,
            sp.name,
            resolvedSpSkin,
          );
          setPlayerWeaponModel(rp.rig, sp.weaponId);
          this.scene.add(rp.rig.root);
        }
        rp.targetPos.set(sp.x, sp.y ?? 0, sp.z);
        rp.targetYaw = sp.yaw;
        rp.isMoving = sp.isMoving;
        rp.isRunning = sp.isRunning;
        rp.isCrouching = Boolean(sp.isCrouching);
        rp.isDashing = Boolean(sp.isDashing);
        rp.alive = sp.alive;
        rp.hp = sp.hp;
        rp.maxHp = sp.maxHp;
        rp.level = sp.level;
        rp.kills = sp.kills;
        if (rp.weaponId !== sp.weaponId) {
          rp.weaponId = sp.weaponId;
          setPlayerWeaponModel(rp.rig, sp.weaponId);
        }
      }
      const drivingSomeVehicle = this.vehicles.some((v) => v.driverId === sp.id);
      rp.rig.root.visible = sp.alive && !drivingSomeVehicle;
    }

    for (const [id, rp] of this.remotePlayers.entries()) {
      if (!seenPlayerIds.has(id)) {
        this.scene.remove(rp.rig.root);
        this.remotePlayers.delete(id);
      }
    }

    // Sync authoritative zombies
    const seenZombieIds = new Set<number>();
    const existingMap = new Map<number, ZombieEntity>();
    for (const z of this.zombies) existingMap.set(z.id, z);

    for (const sz of snap.zombies) {
      seenZombieIds.add(sz.id);
      let lz = existingMap.get(sz.id);
      if (!lz) {
        lz = this.spawnZombieAt(
          sz.x,
          sz.z,
          sz.variant,
          sz.appearance ?? 'officer',
          sz.id,
          sz.hp,
          sz.maxHp,
        );
      } else {
        if (sz.hp < lz.hp) {
          lz.hitFlinch = Math.max(lz.hitFlinch, 0.85);
        }
        lz.targetPos.set(sz.x, 0, sz.z);
        lz.targetYaw = sz.yaw;
        lz.hp = sz.hp;
        lz.maxHp = sz.maxHp;
        if (sz.skillState) {
          const prevSkill = lz.skillState;
          lz.skillState = sz.skillState;
          if (typeof sz.skillDirX === 'number') lz.skillDirX = sz.skillDirX;
          if (typeof sz.skillDirZ === 'number') lz.skillDirZ = sz.skillDirZ;
          if (sz.skillState === 'none' && prevSkill !== 'none') {
            this.clearZombieTelegraph(lz);
          } else if (sz.skillState === 'windup' && !lz.telegraphRing) {
            this.spawnBossTelegraph(lz);
          }
        }
        if (sz.hp < sz.maxHp) {
          const ratio = sz.hp / sz.maxHp;
          const halfFill = lz.variant === 'boss' ? 0.555 : 0.355;
          lz.rig.hpBarBg.visible = true;
          lz.rig.hpBarFill.scale.x = Math.max(0.01, ratio);
          lz.rig.hpBarFill.position.x = -halfFill * (1 - ratio);
        }
      }
    }

    // Sync networked boss projectiles
    if (snap.bossProjectiles) {
      const seenProjIds = new Set<number>();
      const projMap = new Map<number, BossProjectileEntity>();
      for (const pr of this.bossProjectiles) {
        if (pr.networked) projMap.set(pr.id, pr);
      }
      for (const spr of snap.bossProjectiles) {
        seenProjIds.add(spr.id);
        const existingProj = projMap.get(spr.id);
        if (!existingProj) {
          this.spawnBossProjectile(spr.x, spr.y, spr.z, 0, 0, 0, true, spr.id);
        } else {
          existingProj.position.set(spr.x, spr.y, spr.z);
        }
      }
      for (let i = this.bossProjectiles.length - 1; i >= 0; i--) {
        const pr = this.bossProjectiles[i];
        if (pr.networked && !seenProjIds.has(pr.id)) {
          this.spawnParticles(pr.mesh.position, 0xf43f5e, 6, 4.2, 0.85);
          this.disposeBossProjectile(pr);
          this.bossProjectiles.splice(i, 1);
        }
      }
    }

    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const z = this.zombies[i];
      if (!z.dead && !seenZombieIds.has(z.id)) {
        this.clearZombieTelegraph(z);
        this.scene.remove(z.rig.root);
        disposeZombieRig(z.rig);
        this.zombies.splice(i, 1);
      }
    }

    // Sync pickups
    const seenPickupIds = new Set<number>();
    const pMap = new Map<number, PickupEntity>();
    for (const p of this.pickups) pMap.set(p.id, p);

    for (const sp of snap.pickups) {
      seenPickupIds.add(sp.id);
      if (!pMap.has(sp.id)) {
        this.spawnPickup(sp.type, new THREE.Vector3(sp.x, 0, sp.z), sp.id);
      }
    }
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      if (!seenPickupIds.has(this.pickups[i].id)) {
        this.scene.remove(this.pickups[i].mesh);
        this.pickups.splice(i, 1);
      }
    }

    // Sync Open-World Antivirus Intel Pickups
    if (snap.intelItems) {
      const seenIntelIds = new Set<number>();
      const intelMap = new Map<number, IntelPickupEntity>();
      for (const item of this.intelPickups) intelMap.set(item.id, item);
      for (const si of snap.intelItems) {
        seenIntelIds.add(si.id);
        if (!intelMap.has(si.id)) {
          this.spawnIntelPickup({ x: si.x, z: si.z }, si.id);
        }
      }
      for (let i = this.intelPickups.length - 1; i >= 0; i--) {
        if (!seenIntelIds.has(this.intelPickups[i].id)) {
          this.scene.remove(this.intelPickups[i].mesh);
          this.disposeGroup(this.intelPickups[i].mesh);
          this.intelPickups.splice(i, 1);
        }
      }
    }
  }

  private spawnRemoteShotEffects(data: {
    playerId: string;
    weaponId: WeaponId;
    start: { x: number; y: number; z: number };
    end: { x: number; y: number; z: number };
  }): void {
    const rp = this.remotePlayers.get(data.playerId);
    if (rp) {
      rp.rig.muzzleFlash.visible = true;
      rp.rig.muzzleLight.intensity = 5;
      rp.muzzleTimer = 0.055;
    }
    this.audio.playGunshot(data.weaponId);
    this.spawnTracer(
      new THREE.Vector3(data.start.x, data.start.y, data.start.z),
      new THREE.Vector3(data.end.x, data.end.y, data.end.z),
      WEAPONS[data.weaponId]?.tracerColor ?? 0xfef08a,
    );
  }

  private handleServerZombieKilled(data: {
    zombieId: number;
    x: number;
    z: number;
    isHeadshot: boolean;
  }): void {
    this.spawnParticles(new THREE.Vector3(data.x, 1.1, data.z), 0x881337, 11, 5.2, 1.05);
    const idx = this.zombies.findIndex((z) => z.id === data.zombieId);
    if (idx !== -1) {
      this.clearZombieTelegraph(this.zombies[idx]);
      this.scene.remove(this.zombies[idx].rig.root);
      disposeZombieRig(this.zombies[idx].rig);
      this.zombies.splice(idx, 1);
    }
  }

  private handleServerBarrelExploded(data: { barrelId: number; x: number; z: number }): void {
    const b = this.city.barrels[data.barrelId];
    if (b) {
      b.exploded = true;
      b.mesh.visible = false;
    }
    const pos = new THREE.Vector3(data.x, 0.65, data.z);
    this.audio.playExplosion();
    this.camShake = Math.max(this.camShake, 0.45);
    this.spawnParticles(pos, 0xf97316, 18, 9.5, 1.8);
    this.spawnParticles(pos, 0xfef08a, 10, 7.0, 1.3);
  }

  private clampCameraOutsideWalls(target: THREE.Vector3, desired: THREE.Vector3): void {
    const dir = _vecC.copy(desired).sub(target);
    const len = dir.length();
    if (len < 0.1) return;
    dir.divideScalar(len);
    _raycaster.set(target, dir);
    _raycaster.far = len;
    const hits = _raycaster.intersectObjects(this.city.worldHitMeshes, false);
    if (hits.length > 0 && hits[0].distance < len && hits[0].distance > 0.8) {
      desired.copy(target).addScaledVector(dir, hits[0].distance - 0.35);
    }
  }

  private updateAtmosphere(dt: number, elapsed: number): void {
    const isSubway = this.currentMap === 'subway';

    // Advance day-night & weather in Solo (in Multiplayer, server snapshots are authoritative)
    if (
      !this.isMultiplayer &&
      this.phase === 'playing' &&
      !this.activePuzzle &&
      !this.mapTravelOpen &&
      !this.rpgMenuOpen
    ) {
      this.timeOfDay += dt / 150;
      if (this.timeOfDay >= 1) {
        this.timeOfDay -= 1;
        this.dayCount += 1;
        this.pickupNotice = `HARI KE-${this.dayCount} DIMULAI — BERTAHAN HIDUP!`;
        this.pickupNoticeTimer = 2.6;
      }

      if (this.settings.weatherMode !== 'dynamic') {
        this.currentWeather = this.settings.weatherMode;
      } else {
        this.weatherTimer -= dt;
        if (this.weatherTimer <= 0) {
          this.weatherTimer = 36 + Math.random() * 24;
          const pool = WEATHER_ORDER.filter((w) => w !== this.currentWeather);
          this.currentWeather = pool[Math.floor(Math.random() * pool.length)];
          this.pickupNotice = `CUACA BERUBAH: ${WEATHER_LABELS[this.currentWeather].toUpperCase()}`;
          this.pickupNoticeTimer = 2.2;
        }
      }
    } else if (!this.isMultiplayer && this.settings.weatherMode !== 'dynamic') {
      this.currentWeather = this.settings.weatherMode;
    }

    const effectiveTime = this.phase === 'intro' ? 0.06 : this.timeOfDay;
    const sunAngle = (effectiveTime - 0.25) * Math.PI * 2;
    const sinElev = Math.sin(sunAngle);
    const cosElev = Math.cos(sunAngle);
    const dayFactor = isSubway ? 0 : THREE.MathUtils.clamp((sinElev + 0.18) / 1.18, 0, 1);
    const twilightFactor = isSubway ? 0 : Math.exp(-Math.pow(sinElev / 0.24, 2));

    // Thunder & lightning during storm
    if (this.lightningFlash > 0) {
      this.lightningFlash = Math.max(0, this.lightningFlash - dt * 3.4);
    }
    if (!isSubway && this.currentWeather === 'storm' && this.phase === 'playing') {
      this.thunderTimer -= dt;
      if (this.thunderTimer <= 0) {
        this.thunderTimer = 7.5 + Math.random() * 8.5;
        this.lightningFlash = 1.0;
        this.audio.playThunder();
      }
    }

    const focusX = this.phase === 'playing' ? this.playerPos.x : 0;
    const focusZ = this.phase === 'playing' ? this.playerPos.z : 0;

    // Sky & Fog colors blended by time of day + weather + lightning
    const mapSpec = MAPS[this.currentMap];
    if (isSubway) {
      _skyWorkColor.setHex(mapSpec.fogColor);
    } else {
      _skyWorkColor.copy(_skyNightColor).lerp(_skyDayColor, dayFactor);
      _skyWorkColor.lerp(_skyDawnColor, twilightFactor * 0.55);
      if (this.currentWeather === 'storm') {
        _skyWorkColor.lerp(_skyStormColor, 0.72);
      } else if (this.currentWeather === 'rain') {
        _skyWorkColor.lerp(_skyStormColor, 0.45);
      } else if (this.currentWeather === 'foggy') {
        _skyWorkColor.lerp(_skyStormColor, 0.35);
      }
      if (this.lightningFlash > 0.02) {
        _skyWorkColor.lerp(_lightDayColor, this.lightningFlash * 0.55);
      }
    }

    if (this.scene.background instanceof THREE.Color) {
      this.scene.background.copy(_skyWorkColor);
    }
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.copy(_skyWorkColor);
      const weatherFogMult =
        this.currentWeather === 'foggy'
          ? 1.9
          : this.currentWeather === 'storm'
            ? 1.55
            : this.currentWeather === 'rain'
              ? 1.28
              : 0.74;
      const dayFogMult = isSubway ? 1 : THREE.MathUtils.lerp(1.08, 0.72, dayFactor);
      this.scene.fog.density = mapSpec.fogDensity * weatherFogMult * dayFogMult;
    }

    // Main directional Sun/Moon light & SkyAtmosphere meshes
    if (!isSubway) {
      const orbitDist = 42;
      if (dayFactor > 0.08) {
        this.moonLight.position.set(
          focusX + cosElev * orbitDist,
          Math.max(12, sinElev * orbitDist + 8),
          focusZ + 18,
        );
        _lightWorkColor.copy(_lightDayColor).lerp(_lightDawnColor, twilightFactor * 0.75);
      } else {
        this.moonLight.position.set(
          focusX - cosElev * orbitDist,
          Math.max(18, -sinElev * orbitDist + 10),
          focusZ - 16,
        );
        _lightWorkColor.copy(_lightNightColor);
      }
      this.moonLight.target.position.set(focusX, 0, focusZ);
      this.moonLight.color.copy(_lightWorkColor);
      const weatherLightMult =
        this.currentWeather === 'storm'
          ? 0.52
          : this.currentWeather === 'rain'
            ? 0.72
            : this.currentWeather === 'foggy'
              ? 0.78
              : 1.0;
      const baseDirInt = THREE.MathUtils.lerp(1.25, 2.35, dayFactor);
      this.moonLight.intensity = baseDirInt * weatherLightMult + this.lightningFlash * 2.8;

      this.hemiLight.color.copy(_hemiTopNight).lerp(_hemiTopDay, dayFactor);
      this.hemiLight.groundColor.copy(_hemiBotNight).lerp(_hemiBotDay, dayFactor);
      this.hemiLight.intensity =
        THREE.MathUtils.lerp(0.68, 1.28, dayFactor) * weatherLightMult + this.lightningFlash * 0.8;

      if (this.city.skyAtmosphere) {
        const sky = this.city.skyAtmosphere;
        const skyR = 135;
        sky.sun.position.set(
          focusX + cosElev * skyR,
          sinElev * skyR,
          focusZ - 48,
        );
        sky.sun.visible = sinElev > -0.08 && this.currentWeather !== 'storm';
        sky.moon.position.set(
          focusX - cosElev * skyR,
          -sinElev * skyR,
          focusZ - 48,
        );
        sky.moonHalo.position.copy(sky.moon.position);
        const moonVisible = -sinElev > -0.05;
        sky.moon.visible = moonVisible;
        sky.moonHalo.visible = moonVisible && this.currentWeather !== 'storm';
        sky.starPoints.position.set(focusX, 0, focusZ);
        sky.starMat.opacity =
          (1 - dayFactor) *
          (this.currentWeather === 'clear' ? 0.92 : this.currentWeather === 'foggy' ? 0.35 : 0.12);
      }
    }

    // Streetlamp flicker boosted at night / storm
    const lampNightFactor = isSubway ? 1.0 : THREE.MathUtils.lerp(1.3, 0.35, dayFactor);
    for (const fl of this.city.flickerLights) {
      const wave = Math.sin(elapsed * 7.5 + fl.seed) * Math.sin(elapsed * 23 + fl.seed);
      const dim = wave > 0.72 ? 0.35 : 1.0;
      fl.light.intensity = fl.baseIntensity * dim * lampNightFactor;
      (fl.bulb.material as THREE.MeshStandardMaterial).emissiveIntensity =
        (dim > 0.5 ? 2.2 : 0.4) * Math.max(0.45, lampNightFactor);
    }

    // Falling rain / storm particles (sheltered when player is inside a building!)
    if (this.rainPoints) {
      const raining = !isSubway && (this.currentWeather === 'rain' || this.currentWeather === 'storm');
      this.rainPoints.visible = raining;
      if (raining) {
        const interior = getBuildingInteriorAt(this.currentMap, focusX, focusZ);
        const rainMat = this.rainPoints.material as THREE.PointsMaterial;
        rainMat.opacity = interior
          ? 0.24
          : this.currentWeather === 'storm'
            ? 0.76
            : 0.56;
        const fallSpeed = this.currentWeather === 'storm' ? 29 : 21;
        const windX = this.currentWeather === 'storm' ? 5.2 : 1.8;
        const posAttr = this.rainPoints.geometry.getAttribute('position') as THREE.BufferAttribute;
        const arr = posAttr.array as Float32Array;
        for (let i = 0; i < arr.length; i += 3) {
          arr[i] += windX * dt;
          arr[i + 1] -= fallSpeed * dt;
          if (arr[i + 1] < 0.1) {
            arr[i] = focusX + (Math.random() - 0.5) * 68;
            arr[i + 1] = 16 + Math.random() * 8;
            arr[i + 2] = focusZ + (Math.random() - 0.5) * 68;
          }
          if (arr[i] - focusX > 34) arr[i] -= 68;
          else if (arr[i] - focusX < -34) arr[i] += 68;
          if (arr[i + 2] - focusZ > 34) arr[i + 2] -= 68;
          else if (arr[i + 2] - focusZ < -34) arr[i + 2] += 68;
          // Push raindrop outside player's indoor shelter ceiling
          if (
            interior &&
            arr[i] >= interior.minX - 0.4 &&
            arr[i] <= interior.maxX + 0.4 &&
            arr[i + 2] >= interior.minZ - 0.4 &&
            arr[i + 2] <= interior.maxZ + 0.4 &&
            arr[i + 1] < 5.6
          ) {
            arr[i + 1] = 18 + Math.random() * 6;
          }
        }
        posAttr.needsUpdate = true;
      }
    }
  }

  private updateVehicles(dt: number, elapsed: number): void {
    // Decrement per-zombie vehicle ram cooldowns
    for (const [zid, cd] of this.vehicleRamCooldowns.entries()) {
      const next = cd - dt;
      if (next <= 0) this.vehicleRamCooldowns.delete(zid);
      else this.vehicleRamCooldowns.set(zid, next);
    }

    const myId = this.isMultiplayer ? (this.multiplayer.lobby.playerId ?? 'local') : 'local';

    let nearestFreeId: string | null = null;
    let nearestFreeDist = 4.6;

    for (const veh of this.vehicles) {
      const isLocallyDriven = this.activeVehicleId === veh.id && !this.spectatingDowned;

      if (isLocallyDriven) {
        let throttle = 0;
        let steerInput = 0;
        if (this.keys['KeyW'] || this.keys['ArrowUp']) throttle += 1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) throttle -= 1;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) steerInput += 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) steerInput -= 1;

        if (Math.abs(this.joyX) > 0.08 || Math.abs(this.joyY) > 0.08) {
          throttle -= this.joyY;
          steerInput -= this.joyX;
        }
        throttle = THREE.MathUtils.clamp(throttle, -1, 1);
        steerInput = THREE.MathUtils.clamp(steerInput, -1, 1);

        const turbo = Boolean(
          this.keys['ShiftLeft'] ||
            this.keys['ShiftRight'] ||
            this.touchRunHeld ||
            this.runToggleActive,
        );
        const handbrake = Boolean(this.keys['Space']);

        const topSpeed = veh.maxSpeed * (turbo ? 1.32 : 1.0);
        const accel = veh.accel * (turbo ? 1.35 : 1.0);

        if (handbrake) {
          veh.speed = THREE.MathUtils.damp(veh.speed, 0, 9.5, dt);
        } else if (throttle > 0.05) {
          veh.speed = Math.min(topSpeed, veh.speed + accel * throttle * dt);
        } else if (throttle < -0.05) {
          const revRate = veh.speed > 0 ? accel * 1.85 : accel * 0.72;
          veh.speed = Math.max(-veh.maxSpeed * 0.45, veh.speed + revRate * throttle * dt);
        } else {
          veh.speed = THREE.MathUtils.damp(veh.speed, 0, 2.8, dt);
          if (Math.abs(veh.speed) < 0.06) veh.speed = 0;
        }

        const targetSteer = steerInput * 0.46;
        veh.steerAngle = THREE.MathUtils.damp(veh.steerAngle, targetSteer, 11, dt);

        if (Math.abs(veh.speed) > 0.25) {
          const dirSign = veh.speed >= 0 ? 1 : -1;
          const speedFactor = Math.min(1, Math.abs(veh.speed) / 5.5);
          veh.yaw += steerInput * 2.25 * (0.28 + 0.72 * speedFactor) * dirSign * dt;
        }

        const prevX = veh.x;
        const prevZ = veh.z;
        const nextPos = {
          x: veh.x + Math.sin(veh.yaw) * veh.speed * dt,
          z: veh.z + Math.cos(veh.yaw) * veh.speed * dt,
        };
        resolveCircleCollisionsShared(
          nextPos,
          1.55,
          this.city.colliders,
          this.city.barrels,
          this.city.halfSize,
        );

        const actualStep = Math.hypot(nextPos.x - prevX, nextPos.z - prevZ);
        const expectedStep = Math.abs(veh.speed) * dt;
        if (expectedStep > 0.08 && actualStep < expectedStep * 0.45) {
          if (Math.abs(veh.speed) > 7.5) {
            this.audio.playVehicleImpact();
            this.camShake = Math.max(this.camShake, 0.22);
          }
          veh.speed *= 0.35;
        }

        veh.x = nextPos.x;
        veh.z = nextPos.z;
        veh.targetX = veh.x;
        veh.targetZ = veh.z;
        veh.targetYaw = veh.yaw;
        this.playerPos.set(veh.x, 0, veh.z);
        this.playerY = 0;
        this.playerYaw = veh.yaw;

        // Ram zombies at speed
        if (Math.abs(veh.speed) > 4.2) {
          for (const z of this.zombies) {
            if (z.dead) continue;
            if (this.vehicleRamCooldowns.has(z.id)) continue;
            const d = Math.hypot(z.position.x - veh.x, z.position.z - veh.z);
            if (d <= 2.25 + z.radius) {
              this.vehicleRamCooldowns.set(z.id, 0.45);
              const ramDmg = Math.round(32 + Math.abs(veh.speed) * 4.5);
              this.audio.playVehicleImpact();
              this.camShake = Math.max(this.camShake, 0.26);
              this.hitMarkerTimer = 0.14;
              this.isCriticalHit = false;
              this.spawnParticles(
                _vecA.set(z.position.x, 1.0, z.position.z),
                0x991b1b,
                8,
                6.2,
                1.05,
              );
              if (this.isMultiplayer) {
                this.multiplayer.send({
                  type: 'player:shoot',
                  weaponId: this.currentWeapon,
                  start: { x: veh.x, y: 1.0, z: veh.z },
                  end: { x: z.position.x, y: 1.0, z: z.position.z },
                  hits: [{ zombieId: z.id, damage: ramDmg, isHeadshot: false }],
                });
              } else {
                const pushAng = Math.atan2(z.position.x - veh.x, z.position.z - veh.z);
                z.position.x += Math.sin(pushAng) * 2.1;
                z.position.z += Math.cos(pushAng) * 2.1;
                this.damageZombieSolo(z, ramDmg, false, z.position);
              }
            }
          }
        }
      } else {
        // Parked or remote-driven vehicle interpolation
        if (this.isMultiplayer && veh.driverId && veh.driverId !== myId) {
          veh.x = THREE.MathUtils.damp(veh.x, veh.targetX, 12, dt);
          veh.z = THREE.MathUtils.damp(veh.z, veh.targetZ, 12, dt);
          let yDiff = veh.targetYaw - veh.yaw;
          while (yDiff > Math.PI) yDiff -= Math.PI * 2;
          while (yDiff < -Math.PI) yDiff += Math.PI * 2;
          veh.yaw += yDiff * Math.min(1, dt * 12);
        } else {
          veh.speed = THREE.MathUtils.damp(veh.speed, 0, 4.5, dt);
          veh.steerAngle = THREE.MathUtils.damp(veh.steerAngle, 0, 8, dt);
        }

        if (!veh.driverId && !this.activeVehicleId) {
          const d = Math.hypot(veh.x - this.playerPos.x, veh.z - this.playerPos.z);
          if (d < nearestFreeDist) {
            nearestFreeDist = d;
            nearestFreeId = veh.id;
          }
        }
      }

      // Apply 3D mesh transform, wheel roll, front wheel steering & lights
      veh.wheelSpin += (veh.speed / 0.44) * dt;
      const vm = veh.mesh;
      vm.root.position.set(veh.x, 0, veh.z);
      vm.root.rotation.y = veh.yaw;
      vm.wheelFL.rotation.y = veh.steerAngle;
      vm.wheelFR.rotation.y = veh.steerAngle;
      vm.wheelFL.rotation.x = veh.wheelSpin;
      vm.wheelFR.rotation.x = veh.wheelSpin;
      vm.wheelRL.rotation.x = veh.wheelSpin;
      vm.wheelRR.rotation.x = veh.wheelSpin;
      vm.headlightMat.emissiveIntensity = veh.driverId ? 3.5 : 0.9;
      if (vm.beaconMesh) {
        const bMat = vm.beaconMesh.material as THREE.MeshStandardMaterial;
        bMat.emissiveIntensity = veh.driverId
          ? 2.2 + Math.sin(elapsed * 14) * 1.4
          : 0.7;
      }
    }

    this.nearbyVehicleId = nearestFreeId;
  }

  private update(dt: number, elapsed: number): void {
    // Dynamic Day-Night Cycle, Weather Climate, Rain & Streetlamp Atmosphere
    this.updateAtmosphere(dt, elapsed);

    // Subtle drifting dust/ash atmosphere wrapped seamlessly around active focus
    if (this.dustPoints) {
      const posAttr = this.dustPoints.geometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      const cx = this.phase === 'playing' ? this.playerPos.x : 0;
      const cz = this.phase === 'playing' ? this.playerPos.z : 0;
      for (let i = 0; i < arr.length; i += 3) {
        arr[i] += Math.sin(elapsed * 0.4 + i) * 0.14 * dt;
        arr[i + 1] += 0.18 * dt;
        if (arr[i + 1] > 9.0) arr[i + 1] = 0.35;
        if (arr[i] - cx > 38) arr[i] -= 76;
        else if (arr[i] - cx < -38) arr[i] += 76;
        if (arr[i + 2] - cz > 38) arr[i + 2] -= 76;
        else if (arr[i + 2] - cz < -38) arr[i + 2] += 76;
      }
      posAttr.needsUpdate = true;
    }

    if (this.phase === 'intro') {
      this.introTimer += dt;
      const p = Math.min(1, this.introTimer / this.introDuration);

      // Keep showcase zombies and bosses patrolling the foggy streets
      for (const z of this.zombies) {
        z.wanderAngle += Math.sin(elapsed * 0.6 + z.id) * 0.5 * dt;
        z.position.x += Math.sin(z.wanderAngle) * 1.15 * dt;
        z.position.z += Math.cos(z.wanderAngle) * 1.15 * dt;
        resolveCircleCollisionsShared(
          z.position,
          z.radius,
          this.city.colliders,
          this.city.barrels,
          this.city.halfSize,
        );
        if (Math.abs(z.position.x) > 20 || Math.abs(z.position.z) > 20) {
          z.wanderAngle += Math.PI * 0.7;
        }
        z.rig.root.position.copy(z.position);
        z.rig.root.rotation.y = z.wanderAngle;
        this.animateZombieRig(z, dt, elapsed, 0.72);
      }

      // Hero survivor illuminated at street center with organic breathing idle & tactical flashlight
      this.player.root.visible = true;
      this.player.root.position.set(0, 0, 4);
      this.player.root.rotation.y = Math.PI;
      animatePlayerRig(
        this.player,
        {
          elapsed,
          walkPhase: 0,
          speedRatio: 0,
          localFwd: 0,
          localRight: 0,
          turnVel: Math.cos(elapsed * 0.85) * 0.45,
          isRunning: false,
          isCrouching: false,
          crouchBlend: 0,
          isAirborne: false,
          velY: 0,
          landingSquash: 0,
          isDashing: false,
          aimBlend: 0.35,
          camPitch: Math.sin(elapsed * 0.6) * 0.06,
          recoil: 0,
          isReloading: false,
          reloadProgress: 0,
          weaponId: this.currentWeapon,
        },
        dt,
      );
      this.player.flashlightAnchor.getWorldPosition(_vecA);
      this.flashlight.position.copy(_vecA);
      this.flashlightTarget.position.set(
        Math.sin(elapsed * 0.85) * 4.5,
        1.1,
        -14,
      );
      this.flashlight.intensity = p > 0.3 ? 34 : 18;

      // 3-Act Cinematic Camera Choreography
      if (p < 0.35) {
        const t = THREE.MathUtils.smoothstep(p / 0.35, 0, 1);
        _camDesired.set(
          THREE.MathUtils.lerp(-22, -10, t),
          THREE.MathUtils.lerp(16.5, 5.8, t),
          THREE.MathUtils.lerp(-18, -11, t),
        );
        _camLook.set(0, THREE.MathUtils.lerp(2.4, 1.5, t), 0);
      } else if (p < 0.68) {
        const t = THREE.MathUtils.smoothstep((p - 0.35) / 0.33, 0, 1);
        _camDesired.set(
          THREE.MathUtils.lerp(-10, 8.2, t),
          THREE.MathUtils.lerp(5.8, 2.0, t),
          THREE.MathUtils.lerp(-11, -5.2, t),
        );
        _camLook.set(
          THREE.MathUtils.lerp(0, 0, t),
          1.45,
          THREE.MathUtils.lerp(0, 2.5, t),
        );
      } else {
        const t = THREE.MathUtils.smoothstep((p - 0.68) / 0.32, 0, 1);
        _camDesired.set(
          THREE.MathUtils.lerp(8.2, -3.6, t),
          THREE.MathUtils.lerp(2.0, 1.95, t),
          THREE.MathUtils.lerp(-5.2, 8.6, t),
        );
        _camLook.set(0, 1.48, THREE.MathUtils.lerp(2.5, 3.6, t));
      }

      this.camera.position.copy(_camDesired);
      this.camera.lookAt(_camLook);

      this.introEmitTimer += dt;
      if (this.introEmitTimer >= 0.04) {
        this.introEmitTimer = 0;
        this.emitHud();
      }

      if (p >= 1) {
        this.skipIntro();
      }
      return;
    }

    if (this.phase === 'menu' || this.phase === 'lobby') {
      this.flashlight.intensity = 0;
      const orbitAngle = elapsed * 0.14;
      const camR = 17.5;
      this.camera.position.set(
        Math.cos(orbitAngle) * camR,
        5.8 + Math.sin(elapsed * 0.4) * 0.6,
        Math.sin(orbitAngle) * camR,
      );
      this.camera.lookAt(0, 1.4, 0);

      for (const z of this.zombies) {
        z.wanderAngle += Math.sin(elapsed * 0.6 + z.id) * 0.5 * dt;
        z.position.x += Math.sin(z.wanderAngle) * 1.15 * dt;
        z.position.z += Math.cos(z.wanderAngle) * 1.15 * dt;
        resolveCircleCollisionsShared(
          z.position,
          z.radius,
          this.city.colliders,
          this.city.barrels,
          this.city.halfSize,
        );
        if (Math.abs(z.position.x) > 20 || Math.abs(z.position.z) > 20) {
          z.wanderAngle += Math.PI * 0.7;
        }
        z.rig.root.position.copy(z.position);
        z.rig.root.rotation.y = z.wanderAngle;
        this.animateZombieRig(z, dt, elapsed, 0.72);
      }
      return;
    }

    if (this.phase !== 'playing') return;

    // Animate 3D Transit Portal Gate ring & energy core
    if (this.city.portalGate) {
      this.city.portalGate.ring.rotation.z += dt * 1.15;
      this.city.portalGate.core.rotation.z -= dt * 0.65;
    }

    // Pause combat & movement cleanly while a mission riddle puzzle, 10-map atlas, or RPG menu is open
    if (this.activePuzzle !== null || this.mapTravelOpen || this.rpgMenuOpen) {
      this.hudEmitTimer += dt;
      if (this.hudEmitTimer >= 0.1) {
        this.hudEmitTimer = 0;
        this.emitHud(false);
      }
      return;
    }

    // 1. Timers & RPG Cooldowns / Passive Mana & Heal Regen
    if (this.fireCooldown > 0) this.fireCooldown -= dt;
    if (this.hitMarkerTimer > 0) this.hitMarkerTimer -= dt;
    for (const sid of RPG_SKILL_ORDER) {
      if (this.skillCooldowns[sid] > 0) {
        this.skillCooldowns[sid] = Math.max(0, this.skillCooldowns[sid] - dt);
      }
    }
    if (!this.spectatingDowned) {
      this.mp = Math.min(this.maxMp, this.mp + this.getMpRegenRate() * dt);
      if (this.healRegenTimer > 0) {
        this.healRegenTimer = Math.max(0, this.healRegenTimer - dt);
        const regenPerSec = 10 + this.rpgStats.int * 2.2;
        this.hp = Math.min(this.maxHp, this.hp + regenPerSec * dt);
      }
      if (this.overdriveTimer > 0) {
        this.overdriveTimer = Math.max(0, this.overdriveTimer - dt);
        if (this.overdriveAuraRing) {
          this.overdriveAuraRing.visible = true;
          this.overdriveAuraRing.position.set(
            this.playerPos.x,
            this.playerY + 0.16,
            this.playerPos.z,
          );
          const pulse = 1.15 + Math.sin(elapsed * 9) * 0.14;
          this.overdriveAuraRing.scale.setScalar(pulse);
          this.overdriveAuraRing.rotation.z = elapsed * 2.4;
          (this.overdriveAuraRing.material as THREE.MeshBasicMaterial).opacity =
            0.48 + Math.sin(elapsed * 11) * 0.22;
        }
      } else if (this.overdriveAuraRing) {
        this.overdriveAuraRing.visible = false;
      }
    }
    if (this.waveBannerTimer > 0) {
      this.waveBannerTimer -= dt;
      if (this.waveBannerTimer <= 0) this.waveBannerText = null;
    }
    if (this.unlockBannerTimer > 0) {
      this.unlockBannerTimer -= dt;
      if (this.unlockBannerTimer <= 0) this.unlockBannerText = null;
    }
    if (this.pickupNoticeTimer > 0) {
      this.pickupNoticeTimer -= dt;
      if (this.pickupNoticeTimer <= 0) this.pickupNotice = null;
    }
    if (this.camShake > 0) {
      this.camShake = Math.max(0, this.camShake - dt * 1.8);
    }
    if (this.muzzleTimer > 0) {
      this.muzzleTimer -= dt;
      if (this.muzzleTimer <= 0) {
        this.player.muzzleFlash.visible = false;
        this.player.muzzleLight.intensity = 0;
        this.fpsRig.muzzleFlash.visible = false;
        this.fpsRig.muzzleLight.intensity = 0;
      }
    }

    const wSpec = WEAPONS[this.currentWeapon];
    const wAmmo = this.weaponState[this.currentWeapon];
    const effectiveReloadDuration = wSpec.reloadDuration * this.getReloadDurationMult();

    if (this.isReloading) {
      this.reloadTimer += dt;
      if (this.reloadTimer >= effectiveReloadDuration) {
        const needed = wSpec.magSize - wAmmo.ammoInMag;
        const transfer = Math.min(needed, wAmmo.reserveAmmo);
        wAmmo.ammoInMag += transfer;
        wAmmo.reserveAmmo -= transfer;
        this.isReloading = false;
        this.reloadTimer = 0;
      }
    }

    if ((this.mouseDown || this.touchShootHeld) && !this.spectatingDowned) {
      this.tryShoot();
    }

    // 2. Driveable Vehicles & Local Player Movement
    let isMoving = false;
    let canRun = false;

    if (this.dashCooldown > 0) {
      this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    }
    if (this.ammoRefillCooldown > 0) {
      this.ammoRefillCooldown = Math.max(0, this.ammoRefillCooldown - dt);
    }

    this.updateVehicles(dt, elapsed);
    const activeVeh = this.activeVehicleId
      ? (this.vehicles.find((v) => v.id === this.activeVehicleId) ?? null)
      : null;

    if (!this.spectatingDowned && activeVeh) {
      // Seated inside a vehicle: project vehicle headlights via tactical spotlight
      const vFwdX = Math.sin(activeVeh.yaw);
      const vFwdZ = Math.cos(activeVeh.yaw);
      this.flashlight.position.set(
        activeVeh.x + vFwdX * 2.1,
        1.15,
        activeVeh.z + vFwdZ * 2.1,
      );
      this.flashlightTarget.position.set(
        activeVeh.x + vFwdX * 26,
        0.2,
        activeVeh.z + vFwdZ * 26,
      );
      this.flashlight.intensity = 46;
      this.stamina = Math.min(100, this.stamina + 20 * dt);
      isMoving = Math.abs(activeVeh.speed) > 0.4;
      canRun = Math.abs(activeVeh.speed) > activeVeh.maxSpeed * 0.9;
    } else if (!this.spectatingDowned) {
      let moveForward = 0;
      let moveRight = 0;
      if (this.keys['KeyW'] || this.keys['ArrowUp']) moveForward += 1;
      if (this.keys['KeyS'] || this.keys['ArrowDown']) moveForward -= 1;
      if (this.keys['KeyD'] || this.keys['ArrowRight']) moveRight += 1;
      if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveRight -= 1;

      if (Math.abs(this.joyX) > 0.08 || Math.abs(this.joyY) > 0.08) {
        moveRight += this.joyX;
        moveForward -= this.joyY;
      }

      const inputLen = Math.hypot(moveForward, moveRight);
      isMoving = inputLen > 0.05;
      const wantsRun =
        Boolean(
          this.keys['ShiftLeft'] ||
            this.keys['ShiftRight'] ||
            this.touchRunHeld ||
            this.runToggleActive,
        ) &&
        isMoving &&
        !this.isCrouching;
      canRun = wantsRun && this.stamina > 4;

      if (canRun) this.stamina = Math.max(0, this.stamina - 24 * dt);
      else this.stamina = Math.min(100, this.stamina + 18 * dt);

      const fwdX = -Math.sin(this.camYaw);
      const fwdZ = -Math.cos(this.camYaw);
      const rightX = Math.cos(this.camYaw);
      const rightZ = -Math.sin(this.camYaw);

      let targetVx = 0;
      let targetVz = 0;
      if (this.dashTimer > 0) {
        this.dashTimer = Math.max(0, this.dashTimer - dt);
        targetVx = this.dashDir.x * 20;
        targetVz = this.dashDir.z * 20;
      } else if (isMoving) {
        const baseMoveSpeed = this.isCrouching ? 3.1 : canRun ? 8.6 : 5.2;
        const moveSpeed = baseMoveSpeed * this.getMoveSpeedMult();
        const nf = moveForward / Math.max(1, inputLen);
        const nr = moveRight / Math.max(1, inputLen);
        targetVx = (fwdX * nf + rightX * nr) * moveSpeed;
        targetVz = (fwdZ * nf + rightZ * nr) * moveSpeed;
      }

      // Smooth ground acceleration & momentum deceleration (responsive yet weighted, zero snappy stiffness)
      const accelLambda = this.dashTimer > 0 ? 28 : isMoving ? 15 : 11.5;
      this.playerVelX = THREE.MathUtils.damp(this.playerVelX, targetVx, accelLambda, dt);
      this.playerVelZ = THREE.MathUtils.damp(this.playerVelZ, targetVz, accelLambda, dt);

      const groundSpeed = Math.hypot(this.playerVelX, this.playerVelZ);
      if (groundSpeed > 0.02) {
        const prevPx = this.playerPos.x;
        const prevPz = this.playerPos.z;
        this.playerPos.x += this.playerVelX * dt;
        this.playerPos.z += this.playerVelZ * dt;
        resolveCircleCollisionsShared(
          this.playerPos,
          0.48,
          this.city.colliders,
          this.city.barrels,
          this.city.halfSize,
        );
        // Zero out velocity into solid walls so legs slow naturally when pressed against cover
        const actualDisp = Math.hypot(this.playerPos.x - prevPx, this.playerPos.z - prevPz);
        const expectedDisp = groundSpeed * dt;
        if (expectedDisp > 0.01 && actualDisp < expectedDisp * 0.35) {
          this.playerVelX *= 0.45;
          this.playerVelZ *= 0.45;
        }
      } else {
        this.playerVelX = 0;
        this.playerVelZ = 0;
      }

      // Vertical Jump, Gravity & Tactile Landing Impact Squash
      const wasAirborne = this.playerY > 0.02;
      if (this.playerY > 0 || this.playerVelY > 0) {
        this.playerVelY -= 22 * dt;
        this.playerY += this.playerVelY * dt;
        if (this.playerY <= 0) {
          const impactVel = Math.abs(this.playerVelY);
          this.playerY = 0;
          this.playerVelY = 0;
          if (wasAirborne && impactVel > 2.2) {
            this.landingSquash = Math.min(1, impactVel / 10.2);
            this.camShake = Math.max(this.camShake, 0.065 * this.landingSquash);
            this.audio.playLandImpact(this.landingSquash);
          }
        }
      }
      this.landingSquash = THREE.MathUtils.damp(this.landingSquash, 0, 9.5, dt);

      this.crouchBlend = THREE.MathUtils.damp(this.crouchBlend, this.isCrouching ? 1 : 0, 14, dt);

      const targetYaw = this.camYaw + Math.PI;
      let diff = targetYaw - this.playerYaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      const yawStep = diff * Math.min(1, dt * 13);
      this.playerYaw += yawStep;
      const rawTurnVel = dt > 0.0001 ? yawStep / dt : 0;
      this.playerTurnVel = THREE.MathUtils.damp(this.playerTurnVel, rawTurnVel, 12, dt);

      this.player.root.position.set(this.playerPos.x, this.playerY, this.playerPos.z);
      this.player.root.rotation.y = this.playerYaw;

      // Decompose actual ground velocity into character-local forward/strafe components
      const realSpeed = Math.hypot(this.playerVelX, this.playerVelZ);
      const speedRatio = THREE.MathUtils.clamp(realSpeed / 8.2, 0, 1.35);
      const rawLocalFwd = realSpeed > 0.15 ? (this.playerVelX * fwdX + this.playerVelZ * fwdZ) / Math.max(4.8, realSpeed) : 0;
      const rawLocalRight = realSpeed > 0.15 ? (this.playerVelX * rightX + this.playerVelZ * rightZ) / Math.max(4.8, realSpeed) : 0;
      this.moveLocalFwd = THREE.MathUtils.damp(this.moveLocalFwd, THREE.MathUtils.clamp(rawLocalFwd, -1, 1), 12, dt);
      this.moveLocalRight = THREE.MathUtils.damp(this.moveLocalRight, THREE.MathUtils.clamp(rawLocalRight, -1, 1), 12, dt);

      // Stride phase synced to true ground speed & direction (reverses cleanly when backpedaling)
      if (this.playerY <= 0.06 && (realSpeed > 0.28 || this.dashTimer > 0)) {
        const strideDir = this.moveLocalFwd < -0.25 && Math.abs(this.moveLocalRight) < 0.65 ? -1 : 1;
        const cadence = this.dashTimer > 0 ? 17.5 : 3.2 + realSpeed * 1.32;
        this.walkPhase += dt * cadence * strideDir;

        // Trigger organic boot footstep SFX right on foot-plant half-cycles
        const stepBucket = Math.floor(this.walkPhase / Math.PI);
        if (stepBucket !== this.lastFootstepStep && realSpeed > 1.25 && this.dashTimer <= 0) {
          this.lastFootstepStep = stepBucket;
          this.audio.playFootstep(canRun, this.isCrouching);
        }
      }

      if (this.recoilAnim > 0) this.recoilAnim = Math.max(0, this.recoilAnim - dt * 9);
      const reloadProgress = this.isReloading
        ? Math.min(1, this.reloadTimer / Math.max(0.1, wSpec.reloadDuration))
        : 0;

      // Drive 15-joint HD biomechanical survivor animation
      animatePlayerRig(
        this.player,
        {
          elapsed,
          walkPhase: this.walkPhase,
          speedRatio,
          localFwd: this.moveLocalFwd,
          localRight: this.moveLocalRight,
          turnVel: this.playerTurnVel,
          isRunning: canRun,
          isCrouching: this.isCrouching,
          crouchBlend: this.crouchBlend,
          isAirborne: this.playerY > 0.06,
          velY: this.playerVelY,
          landingSquash: this.landingSquash,
          isDashing: this.dashTimer > 0,
          aimBlend: this.aimBlend,
          camPitch: this.camPitch,
          recoil: this.recoilAnim,
          isReloading: this.isReloading,
          reloadProgress,
          weaponId: this.currentWeapon,
        },
        dt,
      );

      // Aim tactical flashlight along look vector (camera-aligned in FPS, body anchor in TPS)
      if (this.cameraMode === 'fps') {
        const rightX = Math.cos(this.camYaw);
        const rightZ = -Math.sin(this.camYaw);
        const fwdX = -Math.sin(this.camYaw);
        const fwdZ = -Math.cos(this.camYaw);
        _vecA.set(
          this.playerPos.x + rightX * 0.18 + fwdX * 0.25,
          1.42 + this.playerY - 0.52 * this.crouchBlend,
          this.playerPos.z + rightZ * 0.18 + fwdZ * 0.25,
        );
      } else {
        this.player.flashlightAnchor.getWorldPosition(_vecA);
      }
      this.flashlight.position.copy(_vecA);
      this.flashlightTarget.position.set(
        _vecA.x - Math.sin(this.camYaw) * 18,
        Math.max(-6.0, _vecA.y - Math.sin(this.camPitch) * 16 - 0.35),
        _vecA.z - Math.cos(this.camYaw) * 18,
      );
      this.flashlight.intensity = 28;
    } else {
      this.flashlight.intensity = 0;
    }

    // 3. Multi-Mode 3D Camera (Vehicle Chase OR 1st-Person FPS OR 3rd-Person TPS + ADS Zoom)
    const isFpsActive = this.cameraMode === 'fps' && !this.spectatingDowned && !activeVeh;
    this.player.root.visible = !this.spectatingDowned && !isFpsActive && !activeVeh;
    this.fpsRig.root.visible = isFpsActive;

    this.aimBlend = THREE.MathUtils.damp(
      this.aimBlend,
      this.isAiming && !this.spectatingDowned ? 1 : 0,
      14,
      dt,
    );

    const baseFov = isFpsActive ? 74 : 65;
    const adsFov = isFpsActive ? 46 : 48;
    const targetFov =
      this.dashTimer > 0
        ? baseFov + 8
        : THREE.MathUtils.lerp(baseFov, adsFov, this.aimBlend);
    if (Math.abs(this.camera.fov - targetFov) > 0.05) {
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 14, dt);
      this.camera.updateProjectionMatrix();
    }

    const focusTarget = _vecB.set(this.playerPos.x, this.playerY, this.playerPos.z);
    if (this.spectatingDowned) {
      for (const rp of this.remotePlayers.values()) {
        if (rp.alive) {
          focusTarget.copy(rp.position);
          break;
        }
      }
    }

    const crouchCamDrop = -0.52 * this.crouchBlend;
    const fwdX = -Math.sin(this.camYaw);
    const fwdZ = -Math.cos(this.camYaw);
    const rightX = Math.cos(this.camYaw);
    const rightZ = -Math.sin(this.camYaw);

    if (isFpsActive) {
      const bobAmp =
        isMoving && this.playerY <= 0.06
          ? canRun
            ? 0.042
            : this.isCrouching
              ? 0.015
              : 0.028
          : 0;
      const bobY = Math.abs(Math.sin(this.walkPhase)) * bobAmp;
      const bobX = Math.cos(this.walkPhase * 0.5) * bobAmp * 0.55;
      const eyeHeight = 1.66 + focusTarget.y + crouchCamDrop + bobY;

      this.camCurrentPos.set(
        focusTarget.x + rightX * bobX,
        eyeHeight,
        focusTarget.z + rightZ * bobX,
      );

      const cosP = Math.cos(this.camPitch);
      _camLook.set(
        this.camCurrentPos.x + fwdX * cosP * 16,
        this.camCurrentPos.y - Math.sin(this.camPitch) * 16,
        this.camCurrentPos.z + fwdZ * cosP * 16,
      );
      this.camCurrentLook.copy(_camLook);

      this.camera.position.copy(this.camCurrentPos);
      if (this.camShake > 0) {
        this.camera.position.x += (Math.random() - 0.5) * this.camShake * 0.6;
        this.camera.position.y += (Math.random() - 0.5) * this.camShake * 0.6;
      }
      this.camera.lookAt(this.camCurrentLook);

      // First-Person Hands + Weapon Inertia Sway, Figure-8 Bob, Sprint Cant, Landing Dip & Reload
      this.fpsLookSwayX = THREE.MathUtils.damp(this.fpsLookSwayX, 0, 10, dt);
      this.fpsLookSwayY = THREE.MathUtils.damp(this.fpsLookSwayY, 0, 10, dt);

      const hipX = 0.21;
      const hipY = -0.2;
      const hipZ = -0.36;
      const adsX = 0.0;
      const adsY = -0.138;
      const adsZ = -0.255;

      const fpsSpeedFactor = THREE.MathUtils.clamp(
        Math.hypot(this.playerVelX, this.playerVelZ) / 6.5,
        0,
        1.2,
      );
      const fpsSprintCant =
        canRun && !this.isAiming && !this.isReloading && this.recoilAnim < 0.08
          ? Math.min(1, fpsSpeedFactor * 0.85)
          : 0;
      const swayScale = (1 - this.aimBlend * 0.78) * (0.18 + fpsSpeedFactor * 0.92);
      const swayX = Math.sin(this.walkPhase) * 0.016 * swayScale;
      const swayY =
        Math.sin(this.walkPhase * 2) * 0.011 * swayScale +
        Math.sin(elapsed * 2.15) * 0.0045 * (1 - this.aimBlend * 0.55);
      const landDip = this.landingSquash * 0.055 * (1 - this.aimBlend * 0.5);
      const reloadProgressFps = this.isReloading
        ? Math.min(1, this.reloadTimer / Math.max(0.1, wSpec.reloadDuration))
        : 0;
      const reloadDrop = this.isReloading ? Math.sin(reloadProgressFps * Math.PI) * 0.12 : 0;
      const reloadPitch = this.isReloading ? -Math.sin(reloadProgressFps * Math.PI) * 0.46 : 0;
      const reloadRoll = this.isReloading ? Math.sin(reloadProgressFps * Math.PI) * 0.34 : 0;

      const targetFpsX =
        THREE.MathUtils.lerp(hipX, adsX, this.aimBlend) +
        swayX +
        this.fpsLookSwayX * (1 - this.aimBlend * 0.65) -
        fpsSprintCant * 0.065;
      const targetFpsY =
        THREE.MathUtils.lerp(hipY, adsY, this.aimBlend) -
        swayY -
        reloadDrop -
        landDip -
        this.fpsLookSwayY * (1 - this.aimBlend * 0.65) -
        fpsSprintCant * 0.045;
      const targetFpsZ =
        THREE.MathUtils.lerp(hipZ, adsZ, this.aimBlend) +
        this.recoilAnim * 0.072 +
        fpsSprintCant * 0.035;

      this.fpsRig.pivot.position.x = THREE.MathUtils.damp(this.fpsRig.pivot.position.x, targetFpsX, 18, dt);
      this.fpsRig.pivot.position.y = THREE.MathUtils.damp(this.fpsRig.pivot.position.y, targetFpsY, 18, dt);
      this.fpsRig.pivot.position.z = THREE.MathUtils.damp(this.fpsRig.pivot.position.z, targetFpsZ, 22, dt);

      const targetRotX =
        this.recoilAnim * 0.15 + reloadPitch - fpsSprintCant * 0.16 - landDip * 1.4;
      const targetRotY =
        this.fpsLookSwayX * 2.2 * (1 - this.aimBlend * 0.65) + fpsSprintCant * 0.34;
      const targetRotZ =
        -swayX * 1.8 -
        this.moveLocalRight * 0.065 * (1 - this.aimBlend * 0.7) +
        reloadRoll +
        fpsSprintCant * 0.24;

      this.fpsRig.pivot.rotation.x = THREE.MathUtils.damp(this.fpsRig.pivot.rotation.x, targetRotX, 18, dt);
      this.fpsRig.pivot.rotation.y = THREE.MathUtils.damp(this.fpsRig.pivot.rotation.y, targetRotY, 16, dt);
      this.fpsRig.pivot.rotation.z = THREE.MathUtils.damp(this.fpsRig.pivot.rotation.z, targetRotZ, 16, dt);

      // Animate FPS left support arm dipping smoothly to swap magazine during reload
      const fpsMagDip = this.isReloading ? Math.sin(reloadProgressFps * Math.PI) : 0;
      this.fpsRig.armL.position.y = THREE.MathUtils.damp(
        this.fpsRig.armL.position.y,
        -fpsMagDip * 0.16,
        16,
        dt,
      );
      this.fpsRig.armL.position.z = THREE.MathUtils.damp(
        this.fpsRig.armL.position.z,
        fpsMagDip * 0.09,
        16,
        dt,
      );
    } else if (activeVeh) {
      // Smooth third-person vehicle chase camera (gently follows heading while allowing mouse orbit)
      if (Math.abs(activeVeh.speed) > 1.2 && !this.isDraggingLook) {
        const targetCamYaw = activeVeh.yaw + Math.PI;
        let yDiff = targetCamYaw - this.camYaw;
        while (yDiff > Math.PI) yDiff -= Math.PI * 2;
        while (yDiff < -Math.PI) yDiff += Math.PI * 2;
        this.camYaw += yDiff * Math.min(1, dt * 2.4);
      }
      const vFwdX = -Math.sin(this.camYaw);
      const vFwdZ = -Math.cos(this.camYaw);
      const chaseDist = 7.8 + Math.min(2.2, Math.abs(activeVeh.speed) * 0.08);
      const horizDist = Math.cos(this.camPitch * 0.6) * chaseDist;
      const vertOffset = 3.25 + Math.sin(this.camPitch * 0.7) * 4.5;

      _camDesired.set(
        activeVeh.x - vFwdX * horizDist,
        Math.max(1.4, vertOffset),
        activeVeh.z - vFwdZ * horizDist,
      );
      _camLook.set(
        activeVeh.x + vFwdX * 7.5,
        1.55,
        activeVeh.z + vFwdZ * 7.5,
      );
      _vecA.set(activeVeh.x, 1.85, activeVeh.z);
      this.clampCameraOutsideWalls(_vecA, _camDesired);

      this.camCurrentPos.x = THREE.MathUtils.damp(this.camCurrentPos.x, _camDesired.x, 11, dt);
      this.camCurrentPos.y = THREE.MathUtils.damp(this.camCurrentPos.y, _camDesired.y, 11, dt);
      this.camCurrentPos.z = THREE.MathUtils.damp(this.camCurrentPos.z, _camDesired.z, 11, dt);
      this.camCurrentLook.x = THREE.MathUtils.damp(this.camCurrentLook.x, _camLook.x, 14, dt);
      this.camCurrentLook.y = THREE.MathUtils.damp(this.camCurrentLook.y, _camLook.y, 14, dt);
      this.camCurrentLook.z = THREE.MathUtils.damp(this.camCurrentLook.z, _camLook.z, 14, dt);

      this.camera.position.copy(this.camCurrentPos);
      if (this.camShake > 0) {
        this.camera.position.x += (Math.random() - 0.5) * this.camShake;
        this.camera.position.y += (Math.random() - 0.5) * this.camShake;
      }
      this.camera.lookAt(this.camCurrentLook);
    } else {
      const camDist = THREE.MathUtils.lerp(this.tpsZoomDist, 2.35, this.aimBlend);
      const shoulderOffset = THREE.MathUtils.lerp(0.68, 0.52, this.aimBlend);
      const horizDist = Math.cos(this.camPitch) * camDist;
      const vertOffset = 1.95 + focusTarget.y + crouchCamDrop + Math.sin(this.camPitch) * camDist;

      _camDesired.set(
        focusTarget.x - fwdX * horizDist + rightX * shoulderOffset,
        Math.max(0.65, vertOffset),
        focusTarget.z - fwdZ * horizDist + rightZ * shoulderOffset,
      );
      _camLook.set(
        focusTarget.x + fwdX * 6 + rightX * shoulderOffset * 0.4,
        1.45 + focusTarget.y + crouchCamDrop * 0.85 - Math.sin(this.camPitch) * 2.4,
        focusTarget.z + fwdZ * 6 + rightZ * shoulderOffset * 0.4,
      );

      _vecA.set(focusTarget.x, 1.55 + focusTarget.y + crouchCamDrop, focusTarget.z);
      this.clampCameraOutsideWalls(_vecA, _camDesired);

      this.camCurrentPos.x = THREE.MathUtils.damp(this.camCurrentPos.x, _camDesired.x, 18, dt);
      this.camCurrentPos.y = THREE.MathUtils.damp(this.camCurrentPos.y, _camDesired.y, 18, dt);
      this.camCurrentPos.z = THREE.MathUtils.damp(this.camCurrentPos.z, _camDesired.z, 18, dt);

      this.camCurrentLook.x = THREE.MathUtils.damp(this.camCurrentLook.x, _camLook.x, 22, dt);
      this.camCurrentLook.y = THREE.MathUtils.damp(this.camCurrentLook.y, _camLook.y, 22, dt);
      this.camCurrentLook.z = THREE.MathUtils.damp(this.camCurrentLook.z, _camLook.z, 22, dt);

      this.camera.position.copy(this.camCurrentPos);
      if (this.camShake > 0) {
        this.camera.position.x += (Math.random() - 0.5) * this.camShake;
        this.camera.position.y += (Math.random() - 0.5) * this.camShake;
      }
      this.camera.lookAt(this.camCurrentLook);
    }

    // 4. Multiplayer network sync & remote interpolation
    if (this.isMultiplayer) {
      this.mpSendTimer += dt;
      if (this.mpSendTimer >= 0.05) {
        this.mpSendTimer = 0;
        this.multiplayer.send({
          type: 'player:move',
          x: Number(this.playerPos.x.toFixed(2)),
          y: Number(this.playerY.toFixed(2)),
          z: Number(this.playerPos.z.toFixed(2)),
          yaw: Number(this.playerYaw.toFixed(3)),
          isMoving,
          isRunning: canRun,
          isCrouching: this.isCrouching,
          isDashing: this.dashTimer > 0,
          weaponId: this.currentWeapon,
        });
        if (activeVeh) {
          this.multiplayer.sendVehicleDrive(
            activeVeh.id,
            Number(activeVeh.x.toFixed(2)),
            Number(activeVeh.z.toFixed(2)),
            Number(activeVeh.yaw.toFixed(3)),
            Number(activeVeh.speed.toFixed(2)),
          );
        }
      }

      for (const rp of this.remotePlayers.values()) {
        if (!rp.alive) continue;
        const prevX = rp.position.x;
        const prevZ = rp.position.z;
        const prevY = rp.position.y;
        rp.position.x = THREE.MathUtils.damp(rp.position.x, rp.targetPos.x, 16, dt);
        rp.position.y = THREE.MathUtils.damp(rp.position.y, rp.targetPos.y, 16, dt);
        rp.position.z = THREE.MathUtils.damp(rp.position.z, rp.targetPos.z, 16, dt);

        const rVx = dt > 0.0001 ? (rp.position.x - prevX) / dt : 0;
        const rVz = dt > 0.0001 ? (rp.position.z - prevZ) / dt : 0;
        const rVy = dt > 0.0001 ? (rp.position.y - prevY) / dt : 0;
        const rSpeed = Math.hypot(rVx, rVz);

        let rDiff = rp.targetYaw - rp.yaw;
        while (rDiff > Math.PI) rDiff -= Math.PI * 2;
        while (rDiff < -Math.PI) rDiff += Math.PI * 2;
        const rYawStep = rDiff * Math.min(1, dt * 14);
        rp.yaw += rYawStep;

        rp.rig.root.position.copy(rp.position);
        rp.rig.root.rotation.y = rp.yaw;
        rp.crouchBlend = THREE.MathUtils.damp(rp.crouchBlend, rp.isCrouching ? 1 : 0, 14, dt);
        const targetSpeedRatio = rp.isDashing
          ? 1.25
          : rp.isMoving
            ? Math.max(rp.isRunning ? 0.95 : 0.6, Math.min(1.2, rSpeed / 8.0))
            : Math.min(0.6, rSpeed / 8.0);
        rp.speedRatio = THREE.MathUtils.damp(rp.speedRatio, targetSpeedRatio, 12, dt);

        if (rp.muzzleTimer > 0) {
          rp.muzzleTimer -= dt;
          if (rp.muzzleTimer <= 0) {
            rp.rig.muzzleFlash.visible = false;
            rp.rig.muzzleLight.intensity = 0;
          }
        }

        // Character forward is (+sin(yaw), +cos(yaw)), right is (-cos(yaw), +sin(yaw))
        const rpFwdX = Math.sin(rp.yaw);
        const rpFwdZ = Math.cos(rp.yaw);
        const rpRightX = -Math.cos(rp.yaw);
        const rpRightZ = Math.sin(rp.yaw);
        const rpLocalFwd =
          rSpeed > 0.25 ? THREE.MathUtils.clamp((rVx * rpFwdX + rVz * rpFwdZ) / Math.max(4.5, rSpeed), -1, 1) : rp.isMoving ? 1 : 0;
        const rpLocalRight =
          rSpeed > 0.25 ? THREE.MathUtils.clamp((rVx * rpRightX + rVz * rpRightZ) / Math.max(4.5, rSpeed), -1, 1) : 0;

        if (rp.speedRatio > 0.08 && rp.position.y <= 0.08) {
          const rDir = rpLocalFwd < -0.25 && Math.abs(rpLocalRight) < 0.65 ? -1 : 1;
          rp.walkPhase += dt * (rp.isDashing ? 17.5 : rp.isRunning ? 13.5 : 8.8) * rDir;
        }

        animatePlayerRig(
          rp.rig,
          {
            elapsed,
            walkPhase: rp.walkPhase,
            speedRatio: rp.speedRatio,
            localFwd: rpLocalFwd,
            localRight: rpLocalRight,
            turnVel: dt > 0.0001 ? rYawStep / dt : 0,
            isRunning: rp.isRunning,
            isCrouching: rp.isCrouching,
            crouchBlend: rp.crouchBlend,
            isAirborne: rp.position.y > 0.08,
            velY: rVy,
            landingSquash: 0,
            isDashing: rp.isDashing,
            aimBlend: rp.muzzleTimer > 0 ? 0.85 : 0.2,
            camPitch: 0,
            recoil: rp.muzzleTimer > 0 ? 0.6 : 0,
            isReloading: false,
            reloadProgress: 0,
            weaponId: rp.weaponId,
          },
          dt,
        );
      }

      // Smoothly interpolate server zombies
      for (const z of this.zombies) {
        if (z.hitFlash > 0) {
          z.hitFlash -= dt;
          const flashOn = z.hitFlash > 0;
          for (const m of z.rig.materialsToFlash) {
            m.emissive.setHex(flashOn ? 0x991b1b : 0x000000);
            m.emissiveIntensity = flashOn ? 0.7 : 0;
          }
        }
        if (z.rig.hpBarBg.visible) z.rig.hpBarBg.lookAt(this.camera.position);

        if (z.skillState === 'windup' || z.skillState === 'active') {
          z.skillTimer = Math.max(0, z.skillTimer - dt);
        }

        const prevX = z.position.x;
        const prevZ = z.position.z;
        z.position.x = THREE.MathUtils.damp(z.position.x, z.targetPos.x, 14, dt);
        z.position.z = THREE.MathUtils.damp(z.position.z, z.targetPos.z, 14, dt);
        const stepSpeed = Math.hypot(z.position.x - prevX, z.position.z - prevZ) / Math.max(0.001, dt);
        const moveFactor = Math.min(1.2, stepSpeed / Math.max(1.2, z.speed));

        let zDiff = z.targetYaw - z.rotationY;
        while (zDiff > Math.PI) zDiff -= Math.PI * 2;
        while (zDiff < -Math.PI) zDiff += Math.PI * 2;
        z.rotationY += zDiff * Math.min(1, dt * 10);

        z.rig.root.position.copy(z.position);
        z.rig.root.rotation.y = z.rotationY;
        this.animateZombieRig(z, dt, elapsed, moveFactor);
      }

      // Pickups check -> request server claim
      for (const p of this.pickups) {
        p.age += dt;
        p.mesh.rotation.y += dt * 1.8;
        const baseFloat = p.type.startsWith('weapon_') ? 0.55 : 0.45;
        p.mesh.children[0].position.y = baseFloat + Math.sin(p.age * 3.2) * 0.08;
        if (!this.spectatingDowned && p.position.distanceTo(this.playerPos) < 1.55) {
          this.multiplayer.send({ type: 'player:pickup', pickupId: p.id });
        }
      }
    } else {
      // SOLO MODE: local wave spawning, boss spawning, zombie AI, barrels, pickups
      const aliveZombies = this.zombies.filter((z) => !z.dead).length;
      if (this.bossesToSpawn > 0) {
        this.bossSpawnTimer -= dt;
        if (this.bossSpawnTimer <= 0 && aliveZombies < 20) {
          const sp = findRandomZombieSpawnPos(
            [{ x: this.playerPos.x, z: this.playerPos.z }],
            this.city.colliders,
            this.city.barrels,
            this.city.spawnPoints,
            12.5,
            this.city.halfSize,
            this.currentMap === 'openworld' ? { x: this.playerPos.x, z: this.playerPos.z } : undefined,
            48,
          );
          const { appearance, variant } = pickRandomBossType();
          this.spawnZombieAt(sp.x, sp.z, variant, appearance);
          this.bossesToSpawn--;
          this.bossSpawnTimer = 8.5;
          this.audio.playZombieGroan(0.52);
          const bossInfo = ZOMBIE_APPEARANCE_INFO[appearance];
          this.showUnlockBanner(`PERINGATAN ZOMBIE BOS: ${bossInfo.name.toUpperCase()}!`);
        }
      }

      if (this.zombiesToSpawn > 0) {
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0 && aliveZombies < 18) {
          const sp = findRandomZombieSpawnPos(
            [{ x: this.playerPos.x, z: this.playerPos.z }],
            this.city.colliders,
            this.city.barrels,
            this.city.spawnPoints,
            12.5,
            this.city.halfSize,
            this.currentMap === 'openworld' ? { x: this.playerPos.x, z: this.playerPos.z } : undefined,
            46,
          );
          const { appearance, variant } = pickRandomZombieType(this.wave);

          this.spawnZombieAt(sp.x, sp.z, variant, appearance);
          this.zombiesToSpawn--;
          const baseDelay = Math.max(0.45, 1.45 - this.wave * 0.1);
          this.spawnTimer = baseDelay * (0.7 + Math.random() * 0.6);
          if (Math.random() < 0.35) {
            this.audio.playZombieGroan(
              variant === 'brute' ? 0.72 : variant === 'runner' ? 1.25 : 1,
            );
          }
        }
      } else if (this.bossesToSpawn <= 0 && aliveZombies === 0 && this.waveBreakTimer <= 0) {
        this.waveBreakTimer = this.currentMap === 'openworld' ? 1.8 : 3.2;
        this.score += this.wave * 150;
        this.showWaveBanner(`GELOMBANG ${this.wave} SELESAI! (+${this.wave * 150} SKOR)`);
      }

      if (this.waveBreakTimer > 0) {
        this.waveBreakTimer -= dt;
        if (this.waveBreakTimer <= 0) {
          this.startWave(this.wave + 1);
        }
      }

      for (const b of this.city.barrels) {
        if (b.exploded) {
          b.respawnTimer -= dt;
          if (b.respawnTimer <= 0) {
            b.exploded = false;
            b.mesh.visible = true;
          }
        }
      }

      for (let i = this.zombies.length - 1; i >= 0; i--) {
        const z = this.zombies[i];

        if (z.dead) {
          z.deathTimer -= dt;
          z.rig.root.position.y -= dt * 1.4;
          const s = Math.max(0.01, z.deathTimer / 0.55);
          z.rig.root.scale.setScalar(s);
          if (z.deathTimer <= 0) {
            this.scene.remove(z.rig.root);
            disposeZombieRig(z.rig);
            this.zombies.splice(i, 1);
          }
          continue;
        }

        if (z.hitFlash > 0) {
          z.hitFlash -= dt;
          const flashOn = z.hitFlash > 0;
          for (const m of z.rig.materialsToFlash) {
            m.emissive.setHex(flashOn ? 0x991b1b : 0x000000);
            m.emissiveIntensity = flashOn ? 0.7 : 0;
          }
        }

        if (z.rig.hpBarBg.visible) z.rig.hpBarBg.lookAt(this.camera.position);
        if (z.attackCooldown > 0) z.attackCooldown -= dt;
        if (z.skillCooldown > 0 && z.skillState === 'none') z.skillCooldown -= dt;

        const dx = this.playerPos.x - z.position.x;
        const dz = this.playerPos.z - z.position.z;
        const dist = Math.hypot(dx, dz);
        const diffTuning = DIFFICULTY_TUNING[this.difficulty] ?? DIFFICULTY_TUNING.normal;

        let moveFactor = 0;

        if (z.variant === 'boss' && z.skillState !== 'none') {
          z.skillTimer -= dt;
          if (z.skillState === 'windup') {
            if (dist > 0.01) {
              z.skillDirX = dx / dist;
              z.skillDirZ = dz / dist;
              const targetAngle = Math.atan2(dx, dz);
              let diff = targetAngle - z.rotationY;
              while (diff > Math.PI) diff -= Math.PI * 2;
              while (diff < -Math.PI) diff += Math.PI * 2;
              z.rotationY += diff * Math.min(1, dt * 10);
            }
            if (z.skillTimer <= 0) {
              this.clearZombieTelegraph(z);
              z.skillState = 'active';
              z.skillHitDealt = false;

              if (z.appearance === 'boss_tyrant') {
                z.skillTimer = 0.45;
                this.audio.playBossSlam();
                this.spawnBossShockwave(z.position.x, z.position.z, 5.6, 0xf97316);
                this.spawnParticles(_vecA.set(z.position.x, 0.35, z.position.z), 0xf97316, 16, 8.2, 1.35);
                this.camShake = Math.max(this.camShake, Math.max(0.18, 0.58 - dist * 0.025));

                if (dist <= 5.6 && this.dashTimer <= 0 && this.playerY < 1.1) {
                  const slamDmg = Math.round(38 * diffTuning.damageMult);
                  this.applyDefendedPlayerDamage(slamDmg);
                  this.damageFlashTick++;
                  this.audio.playPlayerHurt();
                  if (dist > 0.05) {
                    const inv = 1 / dist;
                    this.playerPos.x -= dx * inv * 1.9;
                    this.playerPos.z -= dz * inv * 1.9;
                    resolveCircleCollisionsShared(
                      this.playerPos,
                      0.48,
                      this.city.colliders,
                      this.city.barrels,
                      this.city.halfSize,
                    );
                  }
                  if (this.hp <= 0) {
                    this.handleGameOver();
                    return;
                  }
                }
              } else if (z.appearance === 'boss_bioweapon') {
                z.skillTimer = 0.55;
                this.audio.playBossCharge();
                this.spawnParticles(_vecA.set(z.position.x, 1.0, z.position.z), 0xdc2626, 12, 6.5, 1.1);
              } else {
                // boss_lady: Blood Thorn Barrage (3 crimson orbs)
                z.skillTimer = 0.4;
                this.audio.playBossProjectile();
                this.spawnParticles(_vecA.set(z.position.x, 1.35, z.position.z), 0xbe123c, 12, 5.2, 1.0);
                const baseAngle = Math.atan2(z.skillDirX, z.skillDirZ);
                const orbSpeed = 16.5;
                const orbDmg = Math.round(26 * diffTuning.damageMult);
                for (const offset of [-0.22, 0, 0.22]) {
                  const ang = baseAngle + offset;
                  this.spawnBossProjectile(
                    z.position.x + Math.sin(ang) * 1.1,
                    1.3,
                    z.position.z + Math.cos(ang) * 1.1,
                    Math.sin(ang) * orbSpeed,
                    Math.cos(ang) * orbSpeed,
                    orbDmg,
                    false,
                  );
                }
              }
            }
          } else if (z.skillState === 'active') {
            if (z.appearance === 'boss_bioweapon') {
              moveFactor = 1.35;
              z.position.x += z.skillDirX * 13.5 * dt;
              z.position.z += z.skillDirZ * 13.5 * dt;
              if (Math.random() < 0.35) {
                this.spawnParticles(_vecA.set(z.position.x, 0.25, z.position.z), 0x7f1d1d, 2, 3.2, 0.7);
              }
              if (!z.skillHitDealt && dist <= 2.2) {
                z.skillHitDealt = true;
                if (this.dashTimer <= 0 && this.playerY < 1.1) {
                  const chargeDmg = Math.round(38 * diffTuning.damageMult);
                  this.applyDefendedPlayerDamage(chargeDmg);
                  this.damageFlashTick++;
                  this.camShake = Math.max(this.camShake, 0.38);
                  this.audio.playPlayerHurt();
                  this.playerPos.x += z.skillDirX * 1.8;
                  this.playerPos.z += z.skillDirZ * 1.8;
                  resolveCircleCollisionsShared(
                    this.playerPos,
                    0.48,
                    this.city.colliders,
                    this.city.barrels,
                    this.city.halfSize,
                  );
                  if (this.hp <= 0) {
                    this.handleGameOver();
                    return;
                  }
                }
                z.skillTimer = Math.min(z.skillTimer, 0.08);
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
          if (dist > 0.01) {
            const targetAngle = Math.atan2(dx, dz);
            let diff = targetAngle - z.rotationY;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            z.rotationY += diff * Math.min(1, dt * 8);
          }

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
              this.audio.playBossSkillWindup();
              this.spawnBossTelegraph(z);
            }
          }

          if (!triggeredSkill) {
            const attackRange = z.variant === 'boss' ? 2.25 : z.variant === 'brute' ? 1.95 : 1.55;
            if (dist > attackRange) {
              const inv = 1 / Math.max(0.001, dist);
              const dirX = dx * inv;
              const dirZ = dz * inv;
              const weave = dist > 2.8 ? Math.sin(elapsed * 2.1 + z.strideOffset) * 0.14 : 0;
              z.position.x += (dirX - dirZ * weave) * z.speed * dt;
              z.position.z += (dirZ + dirX * weave) * z.speed * dt;
              moveFactor = 1;
            } else if (z.attackCooldown <= 0) {
              z.attackCooldown = 1.05;
              z.attackAnim = 1;
              z.attackHand = z.attackHand === 1 ? -1 : 1;
              if (this.dashTimer <= 0 && this.playerY < 1.05) {
                this.applyDefendedPlayerDamage(z.damage);
                this.damageFlashTick++;
                this.camShake = Math.max(this.camShake, 0.25);
                this.audio.playPlayerHurt();
                if (this.hp <= 0) {
                  this.handleGameOver();
                  return;
                }
              }
            }
          }
        }

        for (let j = i - 1; j >= 0; j--) {
          const other = this.zombies[j];
          if (other.dead) continue;
          const sx = z.position.x - other.position.x;
          const sz = z.position.z - other.position.z;
          const minSep = z.radius + other.radius + 0.15;
          const dSq = sx * sx + sz * sz;
          if (dSq < minSep * minSep && dSq > 0.0001) {
            const d = Math.sqrt(dSq);
            const push = (minSep - d) * 0.5;
            z.position.x += (sx / d) * push;
            z.position.z += (sz / d) * push;
            other.position.x -= (sx / d) * push;
            other.position.z -= (sz / d) * push;
          }
        }

        if (this.currentMap === 'openworld' && z.variant !== 'boss' && dist > 68) {
          const sp = findRandomZombieSpawnPos(
            [{ x: this.playerPos.x, z: this.playerPos.z }],
            this.city.colliders,
            this.city.barrels,
            this.city.spawnPoints,
            22,
            this.city.halfSize,
            { x: this.playerPos.x, z: this.playerPos.z },
            44,
          );
          z.position.set(sp.x, 0, sp.z);
        }

        resolveCircleCollisionsShared(
          z.position,
          z.radius,
          this.city.colliders,
          this.city.barrels,
          this.city.halfSize,
        );
        z.rig.root.position.copy(z.position);
        z.rig.root.rotation.y = z.rotationY;
        this.animateZombieRig(z, dt, elapsed, moveFactor);
      }

      for (let i = this.pickups.length - 1; i >= 0; i--) {
        const p = this.pickups[i];
        p.age += dt;
        p.mesh.rotation.y += dt * 1.8;
        const baseFloat = p.type.startsWith('weapon_') ? 0.55 : 0.45;
        p.mesh.children[0].position.y = baseFloat + Math.sin(p.age * 3.2) * 0.08;

        if (p.position.distanceTo(this.playerPos) < 1.55) {
          this.handlePickupGrant(p.type);
          this.advanceLocalMission('pickups', 1);
          this.scene.remove(p.mesh);
          this.pickups.splice(i, 1);
        }
      }

      // Spatial Mission Updates across all 10 maps (Solo)
      if (!this.missionCompletedAll) {
        const list = this.getActiveMissions();
        const activeDef = list[this.missionIndex];
        const pois = MAP_LAYOUTS[this.currentMap].missionPOIs;
        if (activeDef) {
          if (activeDef.metric === 'radio_zone') {
            if (Math.hypot(this.playerPos.x - pois.radioTower.x, this.playerPos.z - pois.radioTower.z) <= 10.0) {
              this.advanceLocalMission('radio_zone', dt);
            }
          } else if (activeDef.metric === 'collect_intel') {
            for (let k = this.intelPickups.length - 1; k >= 0; k--) {
              const intel = this.intelPickups[k];
              if (Math.hypot(this.playerPos.x - intel.position.x, this.playerPos.z - intel.position.z) <= 2.4) {
                this.audio.playPickup('ammo');
                this.spawnParticles(_vecA.set(intel.position.x, 0.8, intel.position.z), 0x22d3ee, 10, 5.2, 1.0);
                this.pickupNotice = `KOPER MISI DIAMBIL (${Math.min(activeDef.target, Math.floor(this.missionProgressValue) + 1)}/${activeDef.target})`;
                this.pickupNoticeTimer = 2.0;
                this.scene.remove(intel.mesh);
                this.disposeGroup(intel.mesh);
                this.intelPickups.splice(k, 1);
                this.advanceLocalMission('collect_intel', 1);
              }
            }
          } else if (activeDef.metric === 'hold_helipad') {
            if (Math.hypot(this.playerPos.x - pois.helipad.x, this.playerPos.z - pois.helipad.z) <= 9.5) {
              this.advanceLocalMission('hold_helipad', dt);
            }
          } else if (activeDef.metric === 'extract') {
            if (Math.hypot(this.playerPos.x - pois.helipad.x, this.playerPos.z - pois.helipad.z) <= 7.5) {
              this.advanceLocalMission('extract', 1);
              if ((this.phase as GamePhase) === 'victory') return;
            }
          }
        }
      }
    }

    // 4b. Animate 3D Antivirus Intel Briefcases, Objective Beacon & Rescue Helicopter
    for (const intel of this.intelPickups) {
      intel.age += dt;
      intel.mesh.children[0].rotation.y += dt * 1.9;
      intel.mesh.children[0].position.y = 0.72 + Math.sin(intel.age * 3.4) * 0.12;
    }

    const missionHud = this.buildLocalMissionProgress();
    if (
      !missionHud.completedAll &&
      typeof missionHud.objectiveX === 'number' &&
      typeof missionHud.objectiveZ === 'number'
    ) {
      this.objectiveBeaconGroup.visible = true;
      this.objectiveBeaconGroup.position.set(missionHud.objectiveX, 0, missionHud.objectiveZ);
      const radius = missionHud.objectiveRadius ?? 10;
      this.objectiveOuterRing.scale.setScalar(radius);
      const progRatio = Math.max(0.02, Math.min(1, missionHud.current / Math.max(1, missionHud.target)));
      this.objectiveProgressRing.scale.setScalar(radius * (missionHud.inObjectiveZone ? progRatio : 0.14));
      const beaconColor = missionHud.objectiveColor ?? '#38bdf8';
      (this.objectiveOuterRing.material as THREE.MeshBasicMaterial).color.set(beaconColor);
      (this.objectiveProgressRing.material as THREE.MeshBasicMaterial).color.set(beaconColor);
      (this.objectivePillar.material as THREE.MeshBasicMaterial).color.set(beaconColor);
      (this.objectiveDiamond.material as THREE.MeshBasicMaterial).color.set(beaconColor);
      this.objectiveDiamond.rotation.y += dt * 2.2;
      this.objectiveDiamond.position.y = 4.2 + Math.sin(elapsed * 3.0) * 0.45;
    } else {
      this.objectiveBeaconGroup.visible = false;
    }

    if (this.city.helipadChopper) {
      const chopper = this.city.helipadChopper;
      const list = this.getActiveMissions();
      const mIdx = this.isMultiplayer && this.serverMissionState ? this.serverMissionState.index : this.missionIndex;
      const activeMetric = list[Math.min(mIdx, list.length - 1)]?.metric;
      const showChopper =
        this.currentMap === 'openworld' &&
        (activeMetric === 'hold_helipad' || activeMetric === 'extract' || this.missionCompletedAll);
      chopper.root.visible = showChopper;
      if (showChopper) {
        chopper.rotorMain.rotation.y += dt * 16;
        chopper.rotorTail.rotation.x += dt * 24;
        let targetY = 18;
        if (activeMetric === 'hold_helipad') {
          const holdFrac = Math.min(1, missionHud.current / Math.max(1, missionHud.target));
          targetY = THREE.MathUtils.lerp(22, 6.5, holdFrac);
        } else if (activeMetric === 'extract') {
          targetY = 0.25;
        } else if (this.freeRoamMode) {
          targetY = 0.25;
        }
        chopper.root.position.y = THREE.MathUtils.damp(chopper.root.position.y, targetY, 2.2, dt);
      }
    }

    // 5. Shared Tracers, Particles, Boss Projectiles & Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.life -= dt;
      const ratio = Math.max(0, sw.life / sw.maxLife);
      const scale = THREE.MathUtils.lerp(sw.maxScale, 0.9, ratio);
      sw.mesh.scale.setScalar(scale);
      (sw.mesh.material as THREE.MeshBasicMaterial).opacity = ratio * 0.88;
      if (sw.life <= 0) {
        this.scene.remove(sw.mesh);
        (sw.mesh.material as THREE.Material).dispose();
        this.shockwaves.splice(i, 1);
      }
    }

    for (let i = this.bossProjectiles.length - 1; i >= 0; i--) {
      const pr = this.bossProjectiles[i];
      pr.mesh.rotation.y += dt * 7.5;
      pr.mesh.rotation.x += dt * 4.2;

      if (pr.networked) {
        pr.mesh.position.x = THREE.MathUtils.damp(pr.mesh.position.x, pr.position.x, 18, dt);
        pr.mesh.position.y = THREE.MathUtils.damp(pr.mesh.position.y, pr.position.y, 18, dt);
        pr.mesh.position.z = THREE.MathUtils.damp(pr.mesh.position.z, pr.position.z, 18, dt);
        continue;
      }

      pr.life -= dt;
      pr.position.x += pr.vx * dt;
      pr.position.z += pr.vz * dt;
      pr.mesh.position.copy(pr.position);

      let removeProj =
        pr.life <= 0 ||
        Math.abs(pr.position.x) >= this.city.halfSize ||
        Math.abs(pr.position.z) >= this.city.halfSize;

      if (!removeProj) {
        for (const coll of this.city.colliders) {
          if (
            coll.maxY >= 1.1 &&
            pr.position.x >= coll.minX - 0.28 &&
            pr.position.x <= coll.maxX + 0.28 &&
            pr.position.z >= coll.minZ - 0.28 &&
            pr.position.z <= coll.maxZ + 0.28
          ) {
            removeProj = true;
            break;
          }
        }
      }

      if (!removeProj && !this.spectatingDowned && this.dashTimer <= 0 && this.playerY < 1.45) {
        const dSq =
          (this.playerPos.x - pr.position.x) ** 2 + (this.playerPos.z - pr.position.z) ** 2;
        if (dSq <= 1.05 * 1.05) {
          this.applyDefendedPlayerDamage(pr.damage);
          this.damageFlashTick++;
          this.camShake = Math.max(this.camShake, 0.28);
          this.audio.playPlayerHurt();
          removeProj = true;
          if (this.hp <= 0) {
            this.disposeBossProjectile(pr);
            this.bossProjectiles.splice(i, 1);
            this.handleGameOver();
            return;
          }
        }
      }

      if (removeProj) {
        this.spawnParticles(pr.position, 0xf43f5e, 6, 4.2, 0.85);
        this.disposeBossProjectile(pr);
        this.bossProjectiles.splice(i, 1);
      }
    }

    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const t = this.tracers[i];
      t.life -= dt;
      (t.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, t.life / t.maxLife);
      if (t.life <= 0) {
        this.scene.remove(t.mesh);
        (t.mesh.material as THREE.Material).dispose();
        this.tracers.splice(i, 1);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.life -= dt;
      pt.velocity.y -= 14 * dt;
      pt.mesh.position.addScaledVector(pt.velocity, dt);
      if (pt.mesh.position.y < 0.05) {
        pt.mesh.position.y = 0.05;
        pt.velocity.y *= -0.35;
      }
      const ratio = Math.max(0, pt.life / pt.maxLife);
      pt.mesh.scale.setScalar(pt.scaleStart * ratio);
      (pt.mesh.material as THREE.MeshBasicMaterial).opacity = ratio;
      if (pt.life <= 0) {
        this.scene.remove(pt.mesh);
        (pt.mesh.material as THREE.Material).dispose();
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.rpgRings.length - 1; i >= 0; i--) {
      const r = this.rpgRings[i];
      r.age += dt;
      const t = Math.min(1, r.age / r.maxAge);
      const eased = 1 - (1 - t) * (1 - t);
      const scale = THREE.MathUtils.lerp(r.startScale, r.endScale, eased);
      r.mesh.scale.setScalar(scale);
      if (r.followPlayer) {
        r.mesh.position.x = this.playerPos.x;
        r.mesh.position.z = this.playerPos.z;
      }
      r.mesh.position.y += r.riseSpeed * dt;
      (r.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, (1 - t) * 0.9);
      if (r.age >= r.maxAge) {
        this.scene.remove(r.mesh);
        (r.mesh.material as THREE.Material).dispose();
        this.rpgRings.splice(i, 1);
      }
    }

    for (let i = this.worldCombatTexts.length - 1; i >= 0; i--) {
      const ct = this.worldCombatTexts[i];
      ct.age += dt;
      ct.worldPos.y += dt * 1.15;
      if (ct.age >= ct.maxAge) {
        this.worldCombatTexts.splice(i, 1);
      }
    }

    this.hudEmitTimer += dt;
    if (this.hudEmitTimer >= 0.05) {
      this.hudEmitTimer = 0;
      this.emitHud(canRun);
    }
  }

  private handleGameOver(): void {
    this.phase = 'gameover';
    this.mouseDown = false;
    this.touchShootHeld = false;
    this.isAiming = false;
    this.activePuzzle = null;
    this.mapTravelOpen = false;
    this.rpgMenuOpen = false;
    if (this.activeVehicleId) {
      const v = this.vehicles.find((veh) => veh.id === this.activeVehicleId);
      if (v && v.driverId === 'local') v.driverId = null;
      this.activeVehicleId = null;
    }
    this.fpsRig.root.visible = false;
    this.keys = {};
    if (document.pointerLockElement === this.renderer.domElement) {
      document.exitPointerLock?.();
    }
    this.emitHud();
  }

  private triggerVictory(): void {
    this.phase = 'victory';
    this.mouseDown = false;
    this.touchShootHeld = false;
    this.isAiming = false;
    this.activePuzzle = null;
    this.mapTravelOpen = false;
    this.rpgMenuOpen = false;
    if (this.activeVehicleId) {
      const v = this.vehicles.find((veh) => veh.id === this.activeVehicleId);
      if (v && v.driverId === 'local') v.driverId = null;
      this.activeVehicleId = null;
    }
    this.fpsRig.root.visible = false;
    this.keys = {};
    this.audio.playVictoryFanfare();
    if (document.pointerLockElement === this.renderer.domElement) {
      document.exitPointerLock?.();
    }
    this.emitHud();
  }

  private buildLocalMissionProgress(): MissionProgress {
    if (this.isMultiplayer && this.serverMissionState) {
      const m = this.serverMissionState;
      const dist =
        typeof m.objectiveX === 'number' && typeof m.objectiveZ === 'number'
          ? Math.round(Math.hypot(this.playerPos.x - m.objectiveX, this.playerPos.z - m.objectiveZ))
          : undefined;
      return { ...m, distanceMeters: dist };
    }
    const list = this.getActiveMissions();
    const def = list[Math.min(this.missionIndex, list.length - 1)];
    const obj = this.getLocalObjectiveSpec();
    const dist = obj
      ? Math.hypot(this.playerPos.x - obj.x, this.playerPos.z - obj.z)
      : undefined;
    return {
      index: this.missionIndex,
      totalCompleted: this.missionCompletedAll ? list.length : this.missionIndex,
      totalMissions: list.length,
      title: def.title,
      description: def.description,
      current: this.missionCompletedAll
        ? def.target
        : Number(Math.min(def.target, this.missionProgressValue).toFixed(1)),
      target: def.target,
      completedAll: this.missionCompletedAll,
      objectiveX: obj?.x,
      objectiveZ: obj?.z,
      objectiveRadius: obj?.radius,
      objectiveLabel: obj?.label,
      objectiveColor: obj?.color,
      distanceMeters: dist !== undefined ? Math.round(dist) : undefined,
      inObjectiveZone: obj && dist !== undefined ? dist <= obj.radius : false,
    };
  }

  private emitHud(isRunning = false): void {
    const aliveZombies = this.isMultiplayer
      ? this.serverZombiesRemaining
      : this.zombies.filter((z) => !z.dead).length + this.zombiesToSpawn + this.bossesToSpawn;

    const bossEntity = this.zombies.find((z) => !z.dead && z.variant === 'boss');
    const bossSkillWarning =
      bossEntity && (bossEntity.skillState === 'windup' || bossEntity.skillState === 'active')
        ? bossEntity.appearance === 'boss_tyrant'
          ? 'HANTAMAN GEMPA — LOMPAT / MENJAUH!'
          : bossEntity.appearance === 'boss_bioweapon'
            ? 'TERJANGAN CAKAR MUTAN — HINDAR!'
            : 'BADAI MAWAR DARAH — CARI PERLINDUNGAN!'
        : null;
    const activeBoss = bossEntity
      ? {
          name: ZOMBIE_APPEARANCE_INFO[bossEntity.appearance].name,
          hp: Math.max(0, Math.ceil(bossEntity.hp)),
          maxHp: bossEntity.maxHp,
          skillWarning: bossSkillWarning,
        }
      : null;

    const wSpec = WEAPONS[this.currentWeapon];
    const wAmmo = this.weaponState[this.currentWeapon];
    const weaponsHud: WeaponSlotHud[] = WEAPON_ORDER.map((id) => ({
      id,
      shortName: WEAPONS[id].shortName,
      unlocked: this.weaponState[id].unlocked,
      unlockKills: WEAPONS[id].unlockKills,
      ammoInMag: this.weaponState[id].ammoInMag,
      magSize: WEAPONS[id].magSize,
      reserveAmmo: this.weaponState[id].reserveAmmo,
    }));

    const teammates: RemotePlayerSnapshot[] = Array.from(this.remotePlayers.values()).map((rp) => ({
      id: rp.id,
      name: rp.name,
      color: rp.color,
      characterId: rp.characterId,
      skinId: rp.skinId,
      x: rp.position.x,
      y: rp.position.y,
      z: rp.position.z,
      yaw: rp.yaw,
      hp: rp.hp,
      maxHp: rp.maxHp,
      weaponId: rp.weaponId,
      level: rp.level,
      kills: rp.kills,
      isMoving: rp.isMoving,
      isRunning: rp.isRunning,
      isCrouching: rp.isCrouching,
      isDashing: rp.isDashing,
      alive: rp.alive,
    }));

    const mission = this.buildLocalMissionProgress();
    const minimapBlips: MinimapBlip[] = [];
    // Include up to 26 nearest alive zombies on radar
    const aliveList = this.zombies
      .filter((z) => !z.dead)
      .map((z) => ({
        z,
        dSq:
          (z.position.x - this.playerPos.x) ** 2 + (z.position.z - this.playerPos.z) ** 2,
      }))
      .sort((a, b) => a.dSq - b.dSq)
      .slice(0, 26);
    for (const item of aliveList) {
      minimapBlips.push({
        x: item.z.position.x,
        z: item.z.position.z,
        kind: item.z.variant === 'boss' ? 'boss' : 'zombie',
      });
    }
    for (const p of this.pickups) {
      minimapBlips.push({ x: p.position.x, z: p.position.z, kind: 'pickup' });
    }
    for (const intel of this.intelPickups) {
      minimapBlips.push({ x: intel.position.x, z: intel.position.z, kind: 'collectible' });
    }
    for (const rp of this.remotePlayers.values()) {
      if (rp.alive) {
        minimapBlips.push({ x: rp.position.x, z: rp.position.z, kind: 'teammate' });
      }
    }
    for (const v of this.vehicles) {
      minimapBlips.push({ x: v.x, z: v.z, kind: 'vehicle' });
    }
    if (this.city.portalGate) {
      minimapBlips.push({
        x: this.city.portalGate.pos.x,
        z: this.city.portalGate.pos.z,
        kind: 'portal',
      });
    }
    if (!mission.completedAll && typeof mission.objectiveX === 'number' && typeof mission.objectiveZ === 'number') {
      minimapBlips.push({ x: mission.objectiveX, z: mission.objectiveZ, kind: 'objective' });
    }

    const nearPortalGate = this.city.portalGate
      ? Math.hypot(
          this.playerPos.x - this.city.portalGate.pos.x,
          this.playerPos.z - this.city.portalGate.pos.z,
        ) < 6.4
      : false;

    const timeInfo = formatGameTime(this.timeOfDay);
    const interior = getBuildingInteriorAt(this.currentMap, this.playerPos.x, this.playerPos.z);
    const activeVeh = this.activeVehicleId
      ? (this.vehicles.find((v) => v.id === this.activeVehicleId) ?? null)
      : null;
    const nearbyVeh = this.nearbyVehicleId
      ? (this.vehicles.find((v) => v.id === this.nearbyVehicleId) ?? null)
      : null;

    const effectiveReloadDuration = wSpec.reloadDuration * this.getReloadDurationMult();
    const rpgSkillsHud: RpgSkillHudState[] = RPG_SKILL_ORDER.map((sid) => {
      const spec = RPG_SKILLS[sid];
      const rem = this.skillCooldowns[sid];
      return {
        id: sid,
        name: spec.name,
        shortName: spec.shortName,
        hotkey: spec.hotkey,
        mpCost: spec.mpCost,
        cooldownRemaining: Number(rem.toFixed(1)),
        maxCooldown: spec.cooldown,
        accentColor: spec.accentColor,
      };
    });

    const projectedCombatTexts: FloatingCombatText[] = [];
    if (this.phase === 'playing' && !this.rpgMenuOpen && !this.mapTravelOpen) {
      for (const ct of this.worldCombatTexts) {
        _projVec.copy(ct.worldPos).project(this.camera);
        if (_projVec.z >= -1 && _projVec.z <= 1) {
          const sx = (_projVec.x * 0.5 + 0.5) * 100;
          const sy = (-_projVec.y * 0.5 + 0.5) * 100;
          if (sx >= 2 && sx <= 98 && sy >= 4 && sy <= 94) {
            projectedCombatTexts.push({
              id: ct.id,
              text: ct.text,
              kind: ct.kind,
              xPct: Number(sx.toFixed(1)),
              yPct: Number(sy.toFixed(1)),
              alpha: Number(Math.max(0, 1 - ct.age / ct.maxAge).toFixed(2)),
            });
          }
        }
      }
    }

    this.onHudUpdate({
      ...INITIAL_HUD_STATE,
      phase: this.phase,
      introProgress: Math.min(1, this.introTimer / this.introDuration),
      hp: Math.ceil(this.hp),
      maxHp: this.maxHp,
      stamina: Math.round(this.stamina),
      level: this.level,
      xp: this.xp,
      xpToNext: this.xpToNext,
      selectedCharacter: this.settings.selectedCharacter,
      selectedSkin: this.settings.selectedSkin,
      currentWeapon: this.currentWeapon,
      weapons: weaponsHud,
      ammoInMag: wAmmo.ammoInMag,
      magSize: wSpec.magSize,
      reserveAmmo: wAmmo.reserveAmmo,
      isReloading: this.isReloading,
      reloadProgress: this.isReloading
        ? Math.min(1, this.reloadTimer / Math.max(0.1, effectiveReloadDuration))
        : 0,
      score: this.score,
      highScore: this.highScore,
      kills: this.kills,
      headshots: this.headshots,
      wave: this.wave,
      zombiesRemaining: aliveZombies,
      activeBoss,
      difficulty: this.difficulty,
      currentMap: this.currentMap,
      autoRotateMaps: this.autoRotateMaps,
      mission,
      waveBannerText: this.waveBannerText,
      unlockBannerText: this.unlockBannerText,
      hitMarkerActive: this.hitMarkerTimer > 0,
      isCriticalHit: this.isCriticalHit,
      damageFlashTick: this.damageFlashTick,
      pickupNotice: this.pickupNotice,
      pointerLocked: this.pointerLocked,
      isRunning: isRunning || this.runToggleActive,
      isCrouching: this.isCrouching,
      isJumping: this.playerY > 0.06,
      isDashing: this.dashTimer > 0,
      dashCooldownRatio: Math.max(0, Math.min(1, this.dashCooldown / 1.35)),
      isAmmoLow:
        wAmmo.ammoInMag <= Math.max(4, Math.ceil(wSpec.magSize * 0.35)) ||
        wAmmo.reserveAmmo <= wSpec.magSize * 2,
      ammoRefillCooldownRatio: Math.max(0, Math.min(1, this.ammoRefillCooldown / 10)),
      cameraMode: this.cameraMode,
      isAiming: this.isAiming,
      isMultiplayer: this.isMultiplayer,
      roomCode: this.roomCode,
      teammates,
      currentDistrict: getDistrictNameAt(this.currentMap, this.playerPos.x, this.playerPos.z),
      playerX: this.playerPos.x,
      playerZ: this.playerPos.z,
      playerYaw: this.camYaw,
      worldHalfSize: this.city.halfSize,
      minimapBlips,
      freeRoamMode: this.freeRoamMode,
      dayCount: this.dayCount,
      timeOfDay: this.timeOfDay,
      timeString: timeInfo.timeString,
      dayPhaseLabel: timeInfo.dayPhaseLabel,
      weather: this.currentWeather,
      weatherLabel: WEATHER_LABELS[this.currentWeather],
      currentInterior: interior?.name ?? null,
      inVehicle: activeVeh !== null,
      vehicleName: activeVeh?.name ?? null,
      vehicleSpeedKmh: activeVeh ? Math.round(Math.abs(activeVeh.speed) * 4.5) : 0,
      nearbyVehicleName: nearbyVeh?.name ?? null,
      activePuzzle: this.activePuzzle,
      mapTravelOpen: this.mapTravelOpen,
      nearPortalGate,
      visitedMaps: Array.from(this.visitedMaps),
      mapMissionCompleted: this.getMapMissionCompletedSummary(),
      rpgMenuOpen: this.rpgMenuOpen,
      mp: Math.floor(this.mp),
      maxMp: this.maxMp,
      gold: this.gold,
      statPoints: this.statPoints,
      rpgStats: { ...this.rpgStats },
      defense: this.getDefense(),
      critChancePct: this.getCritChancePct(),
      damageBonusPct: this.getDamageBonusPct(),
      equippedArmor: this.equippedArmor,
      ownedArmors: Array.from(this.ownedArmors),
      equippedRelic: this.equippedRelic,
      ownedRelics: Array.from(this.ownedRelics),
      weaponForageLevels: { ...this.weaponForgeLevels },
      hpPotions: this.hpPotions,
      mpPotions: this.mpPotions,
      overdriveRemaining: Number(this.overdriveTimer.toFixed(1)),
      skills: rpgSkillsHud,
      combatTexts: projectedCombatTexts,
    });
  }

  private getMapMissionCompletedSummary(): Partial<Record<MapId, number>> {
    if (this.isMultiplayer) {
      return { ...this.serverMapMissionCompleted };
    }
    const summary: Partial<Record<MapId, number>> = {};
    for (const [mId, st] of Object.entries(this.mapMissionStates)) {
      if (!st) continue;
      const listLen = getMissionsForMap(mId as MapId).length;
      summary[mId as MapId] = st.completedAll ? listLen : st.index;
    }
    const curLen = getMissionsForMap(this.currentMap).length;
    summary[this.currentMap] = this.missionCompletedAll ? curLen : this.missionIndex;
    return summary;
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    this.keys[e.code] = true;
    if (this.phase === 'intro') {
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape') {
        e.preventDefault();
        this.skipIntro();
      }
      return;
    }
    if (this.activePuzzle !== null) {
      return;
    }
    if (e.code === 'KeyB' && !e.repeat) {
      if (this.phase === 'playing') {
        e.preventDefault();
        this.toggleRpgMenu();
      }
      return;
    }
    if (this.rpgMenuOpen) {
      if (e.code === 'Escape') {
        e.preventDefault();
        this.closeRpgMenu();
      }
      return;
    }
    if (e.code === 'KeyM' && !e.repeat) {
      if (this.phase === 'playing') {
        e.preventDefault();
        this.toggleMapTravel();
      }
      return;
    }
    if (this.mapTravelOpen) {
      if (e.code === 'Escape') {
        e.preventDefault();
        this.closeMapTravel();
      }
      return;
    }
    if (e.code === 'Space') {
      if (this.phase === 'playing') {
        e.preventDefault();
        if (this.activeVehicleId) {
          if (!e.repeat) this.audio.playVehicleHorn();
        } else {
          this.triggerJump();
        }
      }
    } else if (e.code === 'KeyG') {
      if (this.phase === 'playing' && !e.repeat) {
        this.toggleEnterExitVehicle();
      }
    } else if (e.code === 'KeyC' || e.code === 'ControlLeft') {
      if (this.phase === 'playing' && !e.repeat && !this.activeVehicleId) {
        this.toggleCrouch();
      }
    } else if (e.code === 'KeyQ') {
      if (this.phase === 'playing' && !e.repeat && !this.activeVehicleId) {
        this.triggerDash();
      }
    } else if (e.code === 'KeyE') {
      if (this.phase === 'playing' && !e.repeat) {
        this.castRpgSkill('shockwave');
      }
    } else if (e.code === 'KeyX') {
      if (this.phase === 'playing' && !e.repeat) {
        this.castRpgSkill('heal');
      }
    } else if (e.code === 'KeyT') {
      if (this.phase === 'playing' && !e.repeat) {
        this.castRpgSkill('overdrive');
      }
    } else if (e.code === 'KeyH') {
      if (this.phase === 'playing' && !e.repeat) {
        this.usePotion('hp');
      }
    } else if (e.code === 'KeyF') {
      if (this.phase === 'playing' && !e.repeat) {
        this.triggerEmergencyAmmoRefill();
      }
    } else if (e.code === 'KeyV') {
      if (this.phase === 'playing' && !e.repeat && !this.activeVehicleId) {
        this.toggleCameraMode();
      }
    } else if (e.code === 'KeyZ') {
      if (this.phase === 'playing' && !e.repeat && !this.activeVehicleId) {
        this.setAiming(true);
      }
    } else if (e.code === 'KeyR') {
      if (!this.activeVehicleId) this.triggerReload();
    } else if (e.code === 'Digit1') {
      this.switchWeapon('pistol');
    } else if (e.code === 'Digit2') {
      this.switchWeapon('smg');
    } else if (e.code === 'Digit3') {
      this.switchWeapon('shotgun');
    } else if (e.code === 'Digit4') {
      this.switchWeapon('rifle');
    } else if (e.code === 'Escape' || e.code === 'KeyP') {
      if (this.phase === 'playing') this.pauseGame();
      else if (this.phase === 'paused') this.resumeGame();
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.keys[e.code] = false;
    if (e.code === 'KeyZ') {
      this.setAiming(false);
    }
  };

  private handleMouseMove = (e: MouseEvent): void => {
    if (
      this.phase !== 'playing' ||
      this.activePuzzle !== null ||
      this.mapTravelOpen ||
      this.rpgMenuOpen
    )
      return;
    const aimSlowdown = this.isAiming ? 0.58 : 1.0;
    if (this.pointerLocked) {
      const sens = 0.0022 * this.settings.sensitivity * aimSlowdown;
      this.camYaw -= e.movementX * sens;
      this.camPitch = THREE.MathUtils.clamp(this.camPitch + e.movementY * sens, -0.68, 0.72);
      this.fpsLookSwayX = THREE.MathUtils.clamp(this.fpsLookSwayX - e.movementX * 0.00045, -0.045, 0.045);
      this.fpsLookSwayY = THREE.MathUtils.clamp(this.fpsLookSwayY + e.movementY * 0.00038, -0.035, 0.035);
    } else if (this.isDraggingLook) {
      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      const sens = 0.0032 * this.settings.sensitivity * aimSlowdown;
      this.camYaw -= dx * sens;
      this.camPitch = THREE.MathUtils.clamp(this.camPitch + dy * sens, -0.68, 0.72);
      this.fpsLookSwayX = THREE.MathUtils.clamp(this.fpsLookSwayX - dx * 0.00045, -0.045, 0.045);
      this.fpsLookSwayY = THREE.MathUtils.clamp(this.fpsLookSwayY + dy * 0.00038, -0.035, 0.035);
    }
  };

  private handleMouseDown = (e: MouseEvent): void => {
    if (
      this.phase !== 'playing' ||
      this.activePuzzle !== null ||
      this.mapTravelOpen ||
      this.rpgMenuOpen
    )
      return;
    if (e.target !== this.renderer.domElement) return;
    this.audio.unlock();

    if (e.button === 0) {
      if (!this.pointerLocked) this.requestPointerLockSafe();
      if (!this.activeVehicleId) {
        this.mouseDown = true;
        this.tryShoot();
      }
    } else if (e.button === 2) {
      if (this.pointerLocked) {
        this.setAiming(true);
      } else {
        this.isDraggingLook = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
      }
    }
  };

  private handleMouseUp = (e: MouseEvent): void => {
    if (e.button === 0) this.mouseDown = false;
    if (e.button === 2) {
      this.isDraggingLook = false;
      this.setAiming(false);
    }
  };

  private handleWheel = (e: WheelEvent): void => {
    if (
      this.phase !== 'playing' ||
      this.activePuzzle !== null ||
      this.mapTravelOpen ||
      this.rpgMenuOpen
    )
      return;
    if (e.deltaY < 0) {
      // Scroll up -> Zoom in closer; crossing 2.5m snaps into First-Person view
      if (this.cameraMode === 'tps') {
        this.tpsZoomDist = Math.max(2.2, this.tpsZoomDist - 0.45);
        if (this.tpsZoomDist <= 2.35) {
          this.cameraMode = 'fps';
          this.pickupNotice = 'KAMERA: ORANG PERTAMA (1ST PERSON)';
          this.pickupNoticeTimer = 1.2;
          this.emitHud();
        }
      }
    } else if (e.deltaY > 0) {
      // Scroll down -> Zoom out to Third-Person view
      if (this.cameraMode === 'fps') {
        this.cameraMode = 'tps';
        this.tpsZoomDist = 3.0;
        this.pickupNotice = 'KAMERA: ORANG KETIGA (3RD PERSON)';
        this.pickupNoticeTimer = 1.2;
        this.emitHud();
      } else {
        this.tpsZoomDist = Math.min(7.5, this.tpsZoomDist + 0.45);
      }
    }
  };

  private handlePointerLockChange = (): void => {
    this.pointerLocked = document.pointerLockElement === this.renderer.domElement;
    if (!this.pointerLocked) {
      this.isAiming = false;
    }
    this.emitHud();
  };

  private handleResize = (): void => {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer?.setSize(w, h);
    this.bloomPass?.resolution.set(w, h);
  };

  private bindEvents(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
    window.addEventListener('wheel', this.handleWheel, { passive: true });
    window.addEventListener('resize', this.handleResize);
    document.addEventListener('pointerlockchange', this.handlePointerLockChange);
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) {
        if (sync) gl.deleteSync(sync);
        return;
      }
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private startLoop(): void {
    const tick = () => {
      if (this.disposed) return;
      const now = performance.now();
      const dt = Math.min(0.05, Math.max(0.001, (now - this.lastTime) / 1000));
      this.lastTime = now;

      this.update(dt, now / 1000);
      if (!this.isSoftwareGl && this.settings.quality === 'high' && this.composer) {
        this.composer.render();
      } else {
        this.renderer.render(this.scene, this.camera);
      }

      if (this.isSoftwareGl) this.afterDraw(tick);
      else this.frameId = requestAnimationFrame(tick);
    };

    if (this.isSoftwareGl) this.afterDraw(tick);
    else this.frameId = requestAnimationFrame(tick);
  }

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);

    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('wheel', this.handleWheel);
    window.removeEventListener('resize', this.handleResize);
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange);

    this.multiplayer.dispose();
    this.clearEntities();
    this.tracerGeo.dispose();
    this.particleGeo.dispose();
    this.bossOrbGeo.dispose();
    this.bossOrbSpikeGeo.dispose();
    this.shockwaveGeo.dispose();
    this.textures.dispose();
    this.audio.dispose();

    this.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.geometry?.dispose();
        if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose());
        else mesh.material?.dispose();
      }
    });

    this.composer?.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
