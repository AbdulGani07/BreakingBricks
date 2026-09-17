import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { GameEngine } from './game/GameEngine';
import { GameCanvas } from './components/GameCanvas';
import { ModernHUD } from './components/ModernHUD';
import { MainMenu } from './components/MainMenu';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { VictoryModal } from './components/VictoryModal';
import { SettingsModal } from './components/SettingsModal';
import { AchievementsModal } from './components/AchievementsModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { ControlsGuide } from './components/ControlsGuide';
import { GameStats, GameStatus } from './types';
import { audioSystem } from './audio/AudioSystem';

export const App: React.FC = () => {
  const [isMuted, setIsMuted] = useState(() => audioSystem.getSettings().isMuted);
  const [status, setStatus] = useState<GameStatus>('idle');
  const [, setTick] = useState(0);

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

  // Initialize engine
  const engine = useMemo(() => {
    let eng: GameEngine;
    eng = new GameEngine(() => {
      setTick((t) => t + 1);
      if (eng) {
        setStatus(eng.status);
      }
    });
    return eng;
  }, []);

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
    setStatus(newStatus);
  }, []);

  const handleResetHighScore = useCallback(() => {
    localStorage.removeItem('breaking_bricks_high_score');
    engine.highScore = 0;
    setTick((t) => t + 1);
  }, [engine]);

  // Global key listener for quick Escape to Pause or Close Modals
  useEffect(() => {
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
  }, [engine, showSettings, showAchievements, showLeaderboard]);

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-3 sm:p-6 text-slate-100 selection:bg-cyan-500/30 overflow-x-hidden">
      <div className="relative w-full max-w-[600px] flex flex-col items-center">
        
        {/* VIEW 1: MAIN MENU */}
        {status === 'idle' ? (
          <MainMenu
            onStartGame={handleStartGame}
            onOpenSettings={() => setShowSettings(true)}
            onOpenAchievements={() => setShowAchievements(true)}
            onOpenLeaderboard={() => setShowLeaderboard(true)}
            highScore={stats.highScore}
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
            <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
              <GameCanvas
                engine={engine}
                status={status}
                onStatusChange={handleStatusChange}
              />

              {/* Pause Modal */}
              {status === 'paused' && (
                <PauseModal
                  stats={stats}
                  onResume={handleTogglePause}
                  onRestart={handleRestart}
                  onOpenSettings={() => setShowSettings(true)}
                  onHome={handleReturnHome}
                />
              )}

              {/* Game Over Modal */}
              {status === 'game_over' && (
                <GameOverModal
                  stats={stats}
                  onRetry={handleRestart}
                  onHome={handleReturnHome}
                />
              )}

              {/* Victory Modal */}
              {status === 'game_won' && (
                <VictoryModal
                  stats={stats}
                  onRetry={handleRestart}
                  onHome={handleReturnHome}
                />
              )}
            </div>

            {/* Controls Guide Footer */}
            <ControlsGuide />
          </div>
        )}

        {/* FLOATING OVERLAY MODALS (Accessible anywhere) */}
        {showSettings && (
          <SettingsModal
            onResetHighScore={handleResetHighScore}
            onClose={() => setShowSettings(false)}
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
    </main>
  );
};

export default App;
