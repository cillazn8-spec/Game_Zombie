import { useEffect, useRef, useState } from 'react';
import { GameHUD } from './components/GameHUD';
import { GameOverModal } from './components/GameOverModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { MainMenu } from './components/MainMenu';
import { MapTravelModal } from './components/MapTravelModal';
import { MultiplayerModal } from './components/MultiplayerModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { OpeningSequence } from './components/OpeningSequence';
import { PauseModal } from './components/PauseModal';
import { PuzzleModal } from './components/PuzzleModal';
import { RpgMenuModal } from './components/RpgMenuModal';
import { SettingsModal } from './components/SettingsModal';
import { TouchControls } from './components/TouchControls';
import { GameEngine } from './engine/GameEngine';
import {
  CharacterId,
  CharacterSkinId,
  DEFAULT_SETTINGS,
  DifficultyId,
  GameSettings,
  HudState,
  INITIAL_HUD_STATE,
  LobbyState,
  MapId,
  resolveSkinForCharacter,
} from './types/game';

const INITIAL_LOBBY: LobbyState = {
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

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [hud, setHud] = useState<HudState>(INITIAL_HUD_STATE);
  const [lobby, setLobby] = useState<LobbyState>(INITIAL_LOBBY);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMultiplayer, setShowMultiplayer] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isCapacitorNative =
      typeof (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
        ?.isNativePlatform === 'function' &&
      Boolean(
        (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
          ?.isNativePlatform?.(),
      );
    setIsTouchDevice(isCapacitorNative || coarse || (hasTouch && window.innerWidth < 1280));
  }, []);

  useEffect(() => {
    const mountEl = canvasMountRef.current;
    if (!mountEl) return;

    const engine = new GameEngine(
      mountEl,
      settings,
      (nextHud) => setHud(nextHud),
      (nextLobby) => {
        setLobby(nextLobby);
        if (nextLobby.started) {
          setShowMultiplayer(false);
        }
      },
      () => setContextLost(true),
    );
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
    // Mount WebGL scene once; settings updates sync via updateSettings() below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSettingsChange = (next: GameSettings) => {
    setSettings(next);
    engineRef.current?.updateSettings(next);
  };

  const handleSelectMap = (mapId: MapId) => {
    handleSettingsChange({ ...settings, selectedMap: mapId });
  };

  const handleToggleAutoRotate = (enabled: boolean) => {
    handleSettingsChange({ ...settings, autoRotateMaps: enabled });
  };

  const handleSelectDifficulty = (difficulty: DifficultyId) => {
    handleSettingsChange({ ...settings, selectedDifficulty: difficulty });
  };

  const handleSelectCharacter = (characterId: CharacterId) => {
    const resolvedSkin = resolveSkinForCharacter(characterId, settings.selectedSkin);
    handleSettingsChange({
      ...settings,
      selectedCharacter: characterId,
      selectedSkin: resolvedSkin,
    });
  };

  const handleSelectSkin = (skinId: CharacterSkinId) => {
    const resolvedSkin = resolveSkinForCharacter(settings.selectedCharacter, skinId);
    handleSettingsChange({ ...settings, selectedSkin: resolvedSkin });
  };

  const showTouchControls =
    hud.phase === 'playing' &&
    (settings.controlMode === 'touch' ||
      (settings.controlMode === 'auto' && isTouchDevice));

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-[#07090d]"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Isolated WebGL Mount Container */}
      <div ref={canvasMountRef} className="absolute inset-0 w-full h-full" />

      {/* WebGL Context Lost Graceful Fallback */}
      {contextLost && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#07090d] p-6 text-center">
          <div className="max-w-sm bg-[#0b101b] border border-white/15 rounded-xl p-6">
            <h2 className="font-display text-xl font-bold text-white mb-2">
              Koneksi Grafis WebGL Terputus
            </h2>
            <p className="text-sm text-slate-300 mb-4">
              Silakan muat ulang halaman untuk memulihkan tampilan 3D.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-lg bg-amber-500 text-slate-950 font-display font-bold text-sm cursor-pointer"
            >
              MUAT ULANG
            </button>
          </div>
        </div>
      )}

      {/* Cinematic 3D Opening Sequence */}
      {hud.phase === 'intro' && (
        <OpeningSequence
          progress={hud.introProgress}
          selectedMap={settings.selectedMap}
          onUnlockAudio={() => {
            engineRef.current?.audio.unlock();
            engineRef.current?.audio.playIntroBoom();
          }}
          onSkip={() => engineRef.current?.skipIntro()}
        />
      )}

      {/* Main Menu Overlay */}
      {hud.phase === 'menu' && (
        <MainMenu
          highScore={hud.highScore}
          selectedDifficulty={settings.selectedDifficulty}
          selectedMap={settings.selectedMap}
          autoRotateMaps={settings.autoRotateMaps}
          selectedCharacter={settings.selectedCharacter}
          selectedSkin={settings.selectedSkin}
          onSelectDifficulty={handleSelectDifficulty}
          onSelectMap={handleSelectMap}
          onToggleAutoRotate={handleToggleAutoRotate}
          onSelectCharacter={handleSelectCharacter}
          onSelectSkin={handleSelectSkin}
          onPlaySolo={() => {
            setShowHowToPlay(false);
            setShowSettings(false);
            setShowMultiplayer(false);
            engineRef.current?.startNewGame(
              settings.selectedMap,
              settings.autoRotateMaps,
              settings.selectedDifficulty,
            );
          }}
          onOpenMultiplayer={() => {
            setShowHowToPlay(false);
            setShowSettings(false);
            setShowMultiplayer(true);
          }}
          onHowToPlay={() => setShowHowToPlay(true)}
          onSettings={() => setShowSettings(true)}
          onReplayIntro={() => engineRef.current?.replayIntro()}
        />
      )}

      {/* Gameplay HUD */}
      {(hud.phase === 'playing' || hud.phase === 'paused') && (
        <GameHUD
          hud={hud}
          isTouchVisible={showTouchControls}
          onPause={() => engineRef.current?.pauseGame()}
          onLockPointer={() => engineRef.current?.requestPointerLockSafe()}
          onSelectWeapon={(id) => engineRef.current?.switchWeapon(id)}
          onToggleRun={() => engineRef.current?.toggleRun()}
          onJump={() => engineRef.current?.triggerJump()}
          onToggleCrouch={() => engineRef.current?.toggleCrouch()}
          onDash={() => engineRef.current?.triggerDash()}
          onAmmoRefill={() => engineRef.current?.triggerEmergencyAmmoRefill()}
          onToggleCamera={() => engineRef.current?.toggleCameraMode()}
          onToggleAim={() => engineRef.current?.toggleAiming()}
          onToggleVehicle={() => engineRef.current?.toggleEnterExitVehicle()}
          onOpenMapTravel={() => engineRef.current?.openMapTravel()}
          onOpenRpgMenu={() => engineRef.current?.openRpgMenu()}
          onCastSkill={(id) => engineRef.current?.castRpgSkill(id)}
          onUseHpPotion={() => engineRef.current?.usePotion('hp')}
        />
      )}

      {/* Android / Touch Controls */}
      {showTouchControls && !hud.activePuzzle && !hud.mapTravelOpen && !hud.rpgMenuOpen && (
        <TouchControls
          isCrouching={hud.isCrouching}
          cameraMode={hud.cameraMode}
          isAiming={hud.isAiming}
          inVehicle={hud.inVehicle}
          nearbyVehicleName={hud.nearbyVehicleName}
          dashCooldownRatio={hud.dashCooldownRatio}
          isAmmoLow={hud.isAmmoLow}
          ammoRefillCooldownRatio={hud.ammoRefillCooldownRatio}
          onJoystickMove={(x, y) => engineRef.current?.setTouchJoystick(x, y)}
          onLookDrag={(dx, dy) => engineRef.current?.addTouchLook(dx, dy)}
          onShootChange={(active) => engineRef.current?.setTouchShoot(active)}
          onReload={() => engineRef.current?.triggerReload()}
          onRunChange={(active) => engineRef.current?.setTouchRun(active)}
          onToggleCrouch={() => engineRef.current?.toggleCrouch()}
          onJump={() => engineRef.current?.triggerJump()}
          onDash={() => engineRef.current?.triggerDash()}
          onAmmoRefill={() => engineRef.current?.triggerEmergencyAmmoRefill()}
          onToggleCamera={() => engineRef.current?.toggleCameraMode()}
          onToggleAim={() => engineRef.current?.toggleAiming()}
          onToggleVehicle={() => engineRef.current?.toggleEnterExitVehicle()}
        />
      )}

      {/* In-Game 10-Map World Travel Atlas Modal */}
      {hud.phase === 'playing' && hud.mapTravelOpen && (
        <MapTravelModal
          currentMap={hud.currentMap}
          visitedMaps={hud.visitedMaps}
          mapMissionCompleted={hud.mapMissionCompleted}
          isMultiplayer={hud.isMultiplayer}
          onTravel={(mapId) => engineRef.current?.travelToMap(mapId)}
          onClose={() => engineRef.current?.closeMapTravel()}
        />
      )}

      {/* 3D Action RPG Menu (Attributes, Equipment, Weapon Forge, Skills & Potions) */}
      {hud.phase === 'playing' && hud.rpgMenuOpen && (
        <RpgMenuModal
          hud={hud}
          onAllocateStat={(stat) => engineRef.current?.allocateRpgStat(stat)}
          onBuyOrEquipArmor={(id) => engineRef.current?.buyOrEquipArmor(id)}
          onBuyOrEquipRelic={(id) => engineRef.current?.buyOrEquipRelic(id)}
          onUpgradeWeapon={(wId) => engineRef.current?.upgradeWeaponForge(wId)}
          onBuyPotion={(kind) => engineRef.current?.buyPotion(kind)}
          onUsePotion={(kind) => engineRef.current?.usePotion(kind)}
          onClose={() => engineRef.current?.closeRpgMenu()}
        />
      )}

      {/* Mission Verification Riddle / Puzzle Modal */}
      {hud.phase === 'playing' && hud.activePuzzle && (
        <PuzzleModal
          activePuzzle={hud.activePuzzle}
          onAnswer={(idx) => engineRef.current?.submitPuzzleAnswer(idx)}
        />
      )}

      {/* Pause Modal */}
      {hud.phase === 'paused' && !showSettings && (
        <PauseModal
          onResume={() => engineRef.current?.resumeGame()}
          onRestart={() => {
            if (hud.isMultiplayer) {
              engineRef.current?.multiplayer.startMatch();
            } else {
              engineRef.current?.startNewGame(
                settings.selectedMap,
                settings.autoRotateMaps,
                settings.selectedDifficulty,
              );
            }
          }}
          onSettings={() => setShowSettings(true)}
          onMainMenu={() => engineRef.current?.returnToMenu()}
        />
      )}

      {/* Game Over / Victory Modal */}
      {(hud.phase === 'gameover' || hud.phase === 'victory') && (
        <GameOverModal
          score={hud.score}
          highScore={hud.highScore}
          kills={hud.kills}
          wave={hud.wave}
          level={hud.level}
          missionsCompleted={hud.mission.totalCompleted}
          isVictory={hud.phase === 'victory'}
          isMultiplayer={hud.isMultiplayer}
          isHost={lobby.isHost}
          onContinueFreeRoam={() => engineRef.current?.continueFreeRoam()}
          onPlayAgain={() => {
            if (hud.isMultiplayer) {
              if (lobby.isHost) {
                engineRef.current?.multiplayer.startMatch();
              } else {
                engineRef.current?.returnToMenu();
              }
            } else {
              engineRef.current?.startNewGame(
                settings.selectedMap,
                settings.autoRotateMaps,
                settings.selectedDifficulty,
              );
            }
          }}
          onMainMenu={() => engineRef.current?.returnToMenu()}
        />
      )}

      {/* Multiplayer Lobby Modal */}
      {showMultiplayer && (
        <MultiplayerModal
          lobby={lobby}
          defaultDifficulty={settings.selectedDifficulty}
          defaultMap={settings.selectedMap}
          defaultAutoRotate={settings.autoRotateMaps}
          selectedCharacter={settings.selectedCharacter}
          selectedSkin={settings.selectedSkin}
          onSelectCharacter={handleSelectCharacter}
          onSelectSkin={handleSelectSkin}
          onChangeLobbyCharacter={(charId, skinId) =>
            engineRef.current?.multiplayer.updateCharacter(charId, skinId)
          }
          onCreateRoom={(name, mapId, autoRotate, charId, skinId, difficulty) =>
            engineRef.current?.multiplayer.createRoom(
              name,
              mapId,
              autoRotate,
              charId,
              skinId,
              difficulty,
            )
          }
          onJoinRoom={(code, name, charId, skinId) =>
            engineRef.current?.multiplayer.joinRoom(code, name, charId, skinId)
          }
          onUpdateConfig={(mapId, autoRotate, difficulty) =>
            engineRef.current?.multiplayer.updateConfig(mapId, autoRotate, difficulty)
          }
          onStartMatch={() => engineRef.current?.multiplayer.startMatch()}
          onLeaveRoom={() => engineRef.current?.multiplayer.leaveRoom()}
          onClose={() => setShowMultiplayer(false)}
        />
      )}

      {/* How To Play Modal */}
      {showHowToPlay && (
        <HowToPlayModal onClose={() => setShowHowToPlay(false)} />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onChange={handleSettingsChange}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* PWA Offline Indicator */}
      <OfflineIndicator />
    </div>
  );
}
