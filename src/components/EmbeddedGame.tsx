import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { GameEngine } from '../game/GameEngine';
import { GameCanvas } from './GameCanvas';
import { ModernHUD } from './ModernHUD';
import { MainMenu } from './MainMenu';
import { PauseModal } from './PauseModal';
import { GameOverModal } from './GameOverModal';
import { VictoryModal } from './VictoryModal';
import { SettingsModal } from './SettingsModal';
import { AchievementsModal } from './AchievementsModal';
import { LeaderboardModal } from './LeaderboardModal';
import { ControlsGuide } from './ControlsGuide';
import { GameStats, GameStatus } from '../types';
import { audioSystem } from '../audio/AudioSystem';
import {
  BreakingBricksConfig,
  BreakingBricksInstance,
  GameDifficulty,
} from '../sdk/types';
import { GameEventEmitter } from '../sdk/EventEmitter';
import { resolveTheme } from '../sdk/theme';

export interface EmbeddedGameProps {
  config?: BreakingBricksConfig;
  eventEmitter?: GameEventEmitter;
  onInstanceReady?: (instance: BreakingBricksInstance) => void;
}

const DEFAULT_CONFIG: BreakingBricksConfig = Object.freeze({});

export const EmbeddedGame: React.FC<EmbeddedGameProps> = ({
  config = DEFAULT_CONFIG,
  eventEmitter: passedEmitter,
  onInstanceReady,
}) => {
  // Setup event emitter
  const eventEmitter = useMemo(() => passedEmitter || new GameEventEmitter(), [passedEmitter]);

  const [isMuted, setIsMuted] = useState(() => audioSystem.getSettings().isMuted);
  const [status, setStatus] = useState<GameStatus>('idle');
  const [, setTick] = useState(0);

  // Maintain single stable GameEngine instance
  const engineRef = useRef<GameEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new GameEngine(
      () => {
        setTick((t) => t + 1);
        if (engineRef.current) {
          const s = engineRef.current.status;
          setStatus((prev) => (prev !== s ? s : prev));
        }
      },
      config,
      eventEmitter
    );
  }
  const engine = engineRef.current;

  // Keep engine configuration synchronized if parent config changes
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.updateConfig(config, eventEmitter);
    }
  }, [config, eventEmitter]);

  // Bind direct config callbacks to emitter
  useEffect(() => {
    const unsubs: Array<() => void> = [];
    if (config.onGameStarted) unsubs.push(eventEmitter.on('gameStarted', config.onGameStarted));
    if (config.onScoreUpdated) unsubs.push(eventEmitter.on('scoreUpdated', config.onScoreUpdated));
    if (config.onBrickDestroyed) unsubs.push(eventEmitter.on('brickDestroyed', config.onBrickDestroyed));
    if (config.onLevelCompleted) unsubs.push(eventEmitter.on('levelCompleted', config.onLevelCompleted));
    if (config.onGameOver) unsubs.push(eventEmitter.on('gameOver', config.onGameOver));
    if (config.onAchievementUnlocked) unsubs.push(eventEmitter.on('achievementUnlocked', config.onAchievementUnlocked));

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [config, eventEmitter]);

  // Sound configuration initialization
  useEffect(() => {
    if (config.sound) {
      if (config.sound.enabled === false) {
        audioSystem.setMasterVolume(0);
        audioSystem.setMuted(true);
      } else {
        if (typeof config.sound.sfxVolume === 'number') {
          audioSystem.setSfxVolume(config.sound.sfxVolume);
        }
        if (typeof config.sound.musicVolume === 'number') {
          audioSystem.setMusicVolume(config.sound.musicVolume);
        }
        if (typeof config.sound.muted === 'boolean') {
          audioSystem.setMuted(config.sound.muted);
        }
      }
    }
  }, [config.sound]);

  // Modal dialog states
  const [showSettings, setShowSettings] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Subscribe to audio system changes
  useEffect(() => {
    const unsub = audioSystem.subscribe((settings) => {
      setIsMuted(settings.isMuted);
    });
    return unsub;
  }, []);

  // Sync background synth music with gameplay state
  useEffect(() => {
    if (status === 'playing') {
      audioSystem.resumeMusic();
    } else {
      audioSystem.pauseMusic();
    }
  }, [status]);

  // Auto-start if requested
  const hasAutoStarted = useRef(false);
  useEffect(() => {
    if (config.autoStart && !hasAutoStarted.current) {
      hasAutoStarted.current = true;
      engine.startCountdown();
      setStatus(engine.status);
    }
  }, [config.autoStart, engine]);

  // Expose instance methods via onInstanceReady
  useEffect(() => {
    if (!onInstanceReady) return;

    const instance: BreakingBricksInstance = {
      unmount: () => {
        audioSystem.stopMusic();
      },
      destroy: () => {
        audioSystem.stopMusic();
      },
      restart: () => {
        engine.restartGame();
        setStatus(engine.status);
      },
      pause: () => {
        if (engine.status === 'playing') {
          engine.togglePause();
          setStatus(engine.status);
        }
      },
      resume: () => {
        if (engine.status === 'paused') {
          engine.togglePause();
          setStatus(engine.status);
        }
      },
      on: (evt, handler) => eventEmitter.on(evt, handler),
      off: (evt, handler) => eventEmitter.off(evt, handler),
      getScore: () => engine.score,
      getHighScore: async () => {
        return Promise.resolve(engine.scoreAdapter.getHighScore());
      },
      setDifficulty: (diff: GameDifficulty) => {
        engine.setDifficulty(diff);
        setTick((t) => t + 1);
      },
      setSoundVolume: (type, vol) => {
        if (type === 'master') audioSystem.setMasterVolume(vol);
        else if (type === 'sfx') audioSystem.setSfxVolume(vol);
        else if (type === 'music') audioSystem.setMusicVolume(vol);
      },
      setMuted: (muted) => {
        audioSystem.setMuted(muted);
      },
      getStoredStats: async () => {
        if (engine.scoreAdapter.getStats) {
          return Promise.resolve(engine.scoreAdapter.getStats());
        }
        return {
          highScore: await Promise.resolve(engine.scoreAdapter.getHighScore()),
          highestLevel: engine.highestLevel,
          gamesPlayed: engine.gamesPlayed,
          achievements: Array.from(engine.unlockedAchievements),
        };
      },
      resetStats: async () => {
        if (engine.scoreAdapter.resetStats) {
          await Promise.resolve(engine.scoreAdapter.resetStats());
        }
        engine.resetStoredStats();
      },
    };

    onInstanceReady(instance);
  }, [engine, eventEmitter, onInstanceReady]);

  // Current reactive snapshot of game stats
  const stats: GameStats = engine.getStats();

  const handleToggleMute = useCallback(() => {
    audioSystem.toggleMute();
  }, []);

  const handleTogglePause = useCallback(() => {
    engine.togglePause();
    setStatus(engine.status);
  }, [engine]);

  const handleStartGame = useCallback(() => {
    engine.startCountdown();
    setStatus(engine.status);
  }, [engine]);

  const handleRestart = useCallback(() => {
    engine.restartGame();
    setStatus(engine.status);
  }, [engine]);

  const handleReturnHome = useCallback(() => {
    engine.returnToMainMenu();
    setStatus(engine.status);
  }, [engine]);

  const handleStatusChange = useCallback((newStatus: GameStatus) => {
    setStatus((prev) => (prev !== newStatus ? newStatus : prev));
  }, []);

  const handleResetHighScore = useCallback(() => {
    Promise.resolve(engine.scoreAdapter.saveHighScore(0)).then(() => {
      engine.highScore = 0;
      setTick((t) => t + 1);
    });
  }, [engine]);

  // Global key listener for Escape
  useEffect(() => {
    if (config.controls?.keyboard === false) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showSettings || showAchievements || showLeaderboard) {
          setShowSettings(false);
          setShowAchievements(false);
          setShowLeaderboard(false);
        } else if (engine.status === 'playing' || engine.status === 'paused') {
          engine.togglePause();
          setStatus(engine.status);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [engine, showSettings, showAchievements, showLeaderboard, config.controls?.keyboard]);

  // Theme resolution
  const theme = resolveTheme(config.theme || 'cyber');

  // Dimension styling
  const customWidth = config.width !== undefined
    ? (typeof config.width === 'number' ? `${config.width}px` : config.width)
    : '100%';
  const customHeight = config.height !== undefined
    ? (typeof config.height === 'number' ? `${config.height}px` : config.height)
    : undefined;
  const maxContainerWidth = config.maxContainerWidth !== undefined
    ? (typeof config.maxContainerWidth === 'number' ? `${config.maxContainerWidth}px` : config.maxContainerWidth)
    : '600px';

  const showGuide = config.controls?.showGuide !== false;

  return (
    <div
      id="breaking-bricks-embedded-root"
      className={`relative w-full ${theme.bgMain} ${theme.textColor} flex flex-col items-center justify-start sm:justify-center p-2 sm:p-4 selection:bg-cyan-500/30 overflow-x-hidden`}
      style={{
        width: customWidth,
        height: customHeight,
        backgroundColor: config.customTheme?.background,
        color: config.customTheme?.text,
      }}
    >
      <div
        className="relative w-full flex flex-col items-center my-auto sm:my-0"
        style={{ maxWidth: maxContainerWidth }}
      >
        {/* VIEW 1: MAIN MENU */}
        {status === 'idle' ? (
          <MainMenu
            onStartGame={handleStartGame}
            onOpenSettings={() => setShowSettings(true)}
            onOpenAchievements={() => setShowAchievements(true)}
            onOpenLeaderboard={() => setShowLeaderboard(true)}
            highScore={stats.highScore}
            highestLevel={stats.highestLevel}
            gamesPlayed={stats.gamesPlayed}
          />
        ) : (
          /* VIEW 2: ACTIVE GAME WITH MODERN HUD & CANVAS */
          <div className="relative w-full flex flex-col items-center">
            {/* Cyber Glassmorphism HUD */}
            <ModernHUD
              stats={stats}
              status={status}
              isMuted={isMuted}
              onToggleMute={handleToggleMute}
              onTogglePause={handleTogglePause}
              onOpenSettings={() => setShowSettings(true)}
              ballCount={engine.balls.length}
            />

            {/* High-DPI Arcade Canvas Container */}
            <div
              className={`relative w-full rounded-2xl overflow-hidden shadow-2xl border ${theme.borderColor}`}
              style={{
                borderColor: config.customTheme?.accent,
              }}
            >
              <GameCanvas
                engine={engine}
                status={status}
                onStatusChange={handleStatusChange}
              />
            </div>

            {/* Controls Guide Footer */}
            {showGuide && <ControlsGuide />}
          </div>
        )}

        {/* IN-GAME MODALS */}
        {status === 'paused' && (
          <PauseModal
            stats={stats}
            onResume={handleTogglePause}
            onRestart={handleRestart}
            onOpenSettings={() => setShowSettings(true)}
            onHome={handleReturnHome}
          />
        )}

        {status === 'game_over' && (
          <GameOverModal
            stats={stats}
            onRetry={handleRestart}
            onHome={handleReturnHome}
          />
        )}

        {status === 'game_won' && (
          <VictoryModal
            stats={stats}
            onRetry={handleRestart}
            onHome={handleReturnHome}
          />
        )}

        {/* FLOATING OVERLAY MODALS */}
        {showSettings && (
          <SettingsModal
            onClose={() => setShowSettings(false)}
            onResetHighScore={handleResetHighScore}
          />
        )}

        {showAchievements && (
          <AchievementsModal
            stats={stats}
            onClose={() => setShowAchievements(false)}
          />
        )}

        {showLeaderboard && (
          <LeaderboardModal
            playerHighScore={stats.highScore}
            playerLevel={stats.level}
            onClose={() => setShowLeaderboard(false)}
          />
        )}
      </div>
    </div>
  );
};
