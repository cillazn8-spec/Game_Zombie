import {
  ActiveMissionPuzzle,
  CharacterId,
  CharacterSkinId,
  DifficultyId,
  LobbyState,
  MapId,
  MissionProgress,
  PickupType,
  RemotePlayerSnapshot,
  WeaponId,
  WeatherType,
  ZombieAppearance,
  ZombieSkillState,
  ZombieVariant,
} from '../types/game';

export interface ServerVehicleState {
  id: string;
  x: number;
  z: number;
  yaw: number;
  speed: number;
  driverId: string | null;
}

export interface ServerSnapshotPayload {
  wave: number;
  zombiesRemaining: number;
  difficulty: DifficultyId;
  mapId: MapId;
  mission: MissionProgress;
  players: Array<
    RemotePlayerSnapshot & {
      score: number;
      xp: number;
      xpToNext: number;
    }
  >;
  zombies: Array<{
    id: number;
    variant: ZombieVariant;
    appearance: ZombieAppearance;
    x: number;
    z: number;
    yaw: number;
    hp: number;
    maxHp: number;
    skillState?: ZombieSkillState;
    skillDirX?: number;
    skillDirZ?: number;
  }>;
  bossProjectiles?: Array<{
    id: number;
    x: number;
    y: number;
    z: number;
  }>;
  pickups: Array<{
    id: number;
    type: PickupType;
    x: number;
    z: number;
  }>;
  barrels: Array<{
    id: number;
    exploded: boolean;
  }>;
  intelItems?: Array<{
    id: number;
    x: number;
    z: number;
  }>;
  vehicles?: ServerVehicleState[];
  dayCount?: number;
  timeOfDay?: number;
  weather?: WeatherType;
  activePuzzle?: ActiveMissionPuzzle | null;
  freeRoamMode?: boolean;
  mapMissionCompleted?: Partial<Record<MapId, number>>;
}

export interface MultiplayerCallbacks {
  onLobbyChange: (lobby: LobbyState) => void;
  onMatchStarted: (mapId: MapId, autoRotateMaps: boolean, difficulty: DifficultyId) => void;
  onSnapshot: (snap: ServerSnapshotPayload) => void;
  onRemoteShot: (data: {
    playerId: string;
    weaponId: WeaponId;
    start: { x: number; y: number; z: number };
    end: { x: number; y: number; z: number };
  }) => void;
  onZombieKilled: (data: {
    zombieId: number;
    x: number;
    z: number;
    attackerId: string;
    isHeadshot: boolean;
  }) => void;
  onBarrelExploded: (data: { barrelId: number; x: number; z: number }) => void;
  onPlayerHurt: (hp: number, damage: number) => void;
  onPlayerLevelUp: (level: number, maxHp: number, hp: number) => void;
  onPickupConfirmed: (pickupType: PickupType, hp: number) => void;
  onMissionCompleted: (title: string, rewardXp: number, rewardScore: number) => void;
  onMapChanged: (mapId: MapId, wave: number) => void;
  onWaveStarted: (wave: number) => void;
  onWaveCleared: (wave: number) => void;
  onBossSpawned: (appearance: ZombieAppearance) => void;
  onZombieAttack: (zombieId: number) => void;
  onBossSkill: (data: {
    zombieId: number;
    appearance: ZombieAppearance;
    stage: 'windup' | 'execute';
    x: number;
    z: number;
    dirX: number;
    dirZ: number;
  }) => void;
  onMatchGameOver: (wave: number) => void;
  onMatchVictory: () => void;
  onFreeRoamStarted: () => void;
  onPuzzleWrong?: (feedback: string, wrongAttempts: number) => void;
}

export class MultiplayerClient {
  private ws: WebSocket | null = null;
  private callbacks: MultiplayerCallbacks;
  public lobby: LobbyState = {
    connected: false,
    roomCode: null,
    playerId: null,
    isHost: false,
    difficulty: 'normal',
    mapId: 'openworld',
    autoRotateMaps: false,
    started: false,
    players: [],
    error: null,
  };

  constructor(callbacks: MultiplayerCallbacks) {
    this.callbacks = callbacks;
  }

  private ensureSocket(onOpenAction: () => void): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      onOpenAction();
      return;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    const isCapacitorNative =
      typeof (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
        ?.isNativePlatform === 'function' &&
      Boolean(
        (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
          ?.isNativePlatform?.(),
      );
    const configuredWsUrl = (import.meta.env.VITE_MULTIPLAYER_WS_URL as string | undefined)?.trim();
    const defaultAndroidWsUrl =
      'wss://ais-pre-bk5h3y2266utij32hab2og-728982644964.asia-northeast1.run.app/ws';
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url =
      configuredWsUrl ||
      (isCapacitorNative ? defaultAndroidWsUrl : `${proto}//${window.location.host}/ws`);
    const ws = new WebSocket(url);
    this.ws = ws;

    ws.onopen = () => {
      this.lobby = { ...this.lobby, connected: true, error: null };
      this.callbacks.onLobbyChange(this.lobby);
      onOpenAction();
    };

    ws.onerror = () => {
      this.lobby = {
        ...this.lobby,
        connected: false,
        error: 'Gagal terhubung ke server multiplayer.',
      };
      this.callbacks.onLobbyChange(this.lobby);
    };

    ws.onclose = () => {
      this.lobby = { ...this.lobby, connected: false };
      this.callbacks.onLobbyChange(this.lobby);
    };

    ws.onmessage = (evt) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(String(evt.data)) as Record<string, unknown>;
      } catch {
        return;
      }

      const type = String(msg.type || '');
      if (type === 'room:joined') {
        this.lobby = {
          ...this.lobby,
          roomCode: String(msg.roomCode),
          playerId: String(msg.playerId),
          isHost: Boolean(msg.isHost),
          error: null,
        };
        this.callbacks.onLobbyChange(this.lobby);
      } else if (type === 'room:lobby') {
        this.lobby = {
          ...this.lobby,
          roomCode: String(msg.roomCode),
          difficulty: (msg.difficulty as DifficultyId) ?? this.lobby.difficulty,
          mapId: msg.mapId as MapId,
          autoRotateMaps: Boolean(msg.autoRotateMaps),
          started: Boolean(msg.started),
          players: (msg.players as LobbyState['players']) || [],
          isHost:
            (msg.players as LobbyState['players'])?.some(
              (p) => p.id === this.lobby.playerId && p.isHost,
            ) ?? this.lobby.isHost,
        };
        this.callbacks.onLobbyChange(this.lobby);
      } else if (type === 'room:error') {
        this.lobby = { ...this.lobby, error: String(msg.message || 'Kesalahan ruang.') };
        this.callbacks.onLobbyChange(this.lobby);
      } else if (type === 'match:started') {
        const diff = (msg.difficulty as DifficultyId) ?? this.lobby.difficulty;
        this.lobby = { ...this.lobby, difficulty: diff, started: true };
        this.callbacks.onLobbyChange(this.lobby);
        this.callbacks.onMatchStarted(msg.mapId as MapId, Boolean(msg.autoRotateMaps), diff);
      } else if (type === 'room:snapshot') {
        this.callbacks.onSnapshot(msg as unknown as ServerSnapshotPayload);
      } else if (type === 'player:shot') {
        this.callbacks.onRemoteShot(
          msg as unknown as Parameters<MultiplayerCallbacks['onRemoteShot']>[0],
        );
      } else if (type === 'zombie:killed') {
        this.callbacks.onZombieKilled(
          msg as unknown as Parameters<MultiplayerCallbacks['onZombieKilled']>[0],
        );
      } else if (type === 'barrel:exploded') {
        this.callbacks.onBarrelExploded(
          msg as unknown as Parameters<MultiplayerCallbacks['onBarrelExploded']>[0],
        );
      } else if (type === 'player:hurt') {
        this.callbacks.onPlayerHurt(Number(msg.hp), Number(msg.damage));
      } else if (type === 'player:levelup') {
        this.callbacks.onPlayerLevelUp(Number(msg.level), Number(msg.maxHp), Number(msg.hp));
      } else if (type === 'pickup:confirmed') {
        this.callbacks.onPickupConfirmed(msg.pickupType as PickupType, Number(msg.hp));
      } else if (type === 'mission:completed') {
        this.callbacks.onMissionCompleted(
          String(msg.title),
          Number(msg.rewardXp),
          Number(msg.rewardScore),
        );
      } else if (type === 'map:changed') {
        this.callbacks.onMapChanged(msg.mapId as MapId, Number(msg.wave));
      } else if (type === 'wave:started') {
        this.callbacks.onWaveStarted(Number(msg.wave));
      } else if (type === 'wave:cleared') {
        this.callbacks.onWaveCleared(Number(msg.wave));
      } else if (type === 'boss:spawned') {
        this.callbacks.onBossSpawned(msg.appearance as ZombieAppearance);
      } else if (type === 'zombie:attack') {
        this.callbacks.onZombieAttack(Number(msg.zombieId));
      } else if (type === 'boss:skill') {
        this.callbacks.onBossSkill({
          zombieId: Number(msg.zombieId),
          appearance: msg.appearance as ZombieAppearance,
          stage: msg.stage as 'windup' | 'execute',
          x: Number(msg.x),
          z: Number(msg.z),
          dirX: Number(msg.dirX),
          dirZ: Number(msg.dirZ),
        });
      } else if (type === 'match:gameover') {
        this.callbacks.onMatchGameOver(Number(msg.wave));
      } else if (type === 'match:victory') {
        this.callbacks.onMatchVictory();
      } else if (type === 'match:freeroam') {
        this.callbacks.onFreeRoamStarted();
      } else if (type === 'puzzle:wrong') {
        this.callbacks.onPuzzleWrong?.(String(msg.feedback || 'Jawaban salah!'), Number(msg.wrongAttempts || 1));
      }
    };
  }

  public send(payload: unknown): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  public createRoom(
    name: string,
    mapId: MapId,
    autoRotateMaps: boolean,
    characterId: CharacterId,
    skinId: CharacterSkinId,
    difficulty: DifficultyId = 'normal',
  ): void {
    this.ensureSocket(() => {
      this.send({
        type: 'room:create',
        name,
        mapId,
        autoRotateMaps,
        characterId,
        skinId,
        difficulty,
      });
    });
  }

  public joinRoom(
    roomCode: string,
    name: string,
    characterId: CharacterId,
    skinId: CharacterSkinId,
  ): void {
    this.ensureSocket(() => {
      this.send({ type: 'room:join', roomCode, name, characterId, skinId });
    });
  }

  public updateConfig(mapId: MapId, autoRotateMaps: boolean, difficulty?: DifficultyId): void {
    this.send({ type: 'room:config', mapId, autoRotateMaps, difficulty });
  }

  public updateCharacter(characterId: CharacterId, skinId: CharacterSkinId): void {
    this.send({ type: 'room:character', characterId, skinId });
  }

  public startMatch(): void {
    this.send({ type: 'room:start' });
  }

  public continueFreeRoam(): void {
    this.send({ type: 'room:freeroam' });
  }

  public enterVehicle(vehicleId: string): void {
    this.send({ type: 'vehicle:enter', vehicleId });
  }

  public exitVehicle(x: number, z: number): void {
    this.send({ type: 'vehicle:exit', x, z });
  }

  public sendVehicleDrive(vehicleId: string, x: number, z: number, yaw: number, speed: number): void {
    this.send({ type: 'vehicle:drive', vehicleId, x, z, yaw, speed });
  }

  public submitPuzzleAnswer(optionIndex: number): void {
    this.send({ type: 'puzzle:answer', optionIndex });
  }

  public travelToMap(mapId: MapId): void {
    this.send({ type: 'map:travel', mapId });
  }

  public leaveRoom(): void {
    this.send({ type: 'room:leave' });
    this.ws?.close();
    this.ws = null;
    this.lobby = {
      connected: false,
      roomCode: null,
      playerId: null,
      isHost: false,
      difficulty: 'normal',
      mapId: 'openworld',
      autoRotateMaps: false,
      started: false,
      players: [],
      error: null,
    };
    this.callbacks.onLobbyChange(this.lobby);
  }

  public dispose(): void {
    this.ws?.close();
    this.ws = null;
  }
}
