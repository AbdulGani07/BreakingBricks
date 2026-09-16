import React, { useState, useMemo, useCallback } from 'react';
import { GameEngine } from './game/GameEngine';
import { GameCanvas } from './components/GameCanvas';
import { GameHeader } from './components/GameHeader';
import { ControlsGuide } from './components/ControlsGuide';
import { GameStats, GameStatus } from './types';
import { sounds } from './sound';

export const App: React.FC = () => {
  const [isMuted, setIsMuted] = useState(false);
  const [status, setStatus] = useState<GameStatus>('idle');
  const [, setTick] = useState(0);

  // Initialize engine
  const engine = useMemo(() => {
    return new GameEngine(() => {
      setTick((t) => t + 1);
    });
  }, []);

  const stats: GameStats = useMemo(() => {
    return engine.getStats();
  }, [engine, status]);

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      sounds.setMuted(next);
      return next;
    });
  }, []);

  const handleTogglePause = useCallback(() => {
    engine.togglePause();
    setStatus(engine.status);
  }, [engine]);

  const handleRestart = useCallback(() => {
    engine.restartGame();
    setStatus(engine.status);
  }, [engine]);

  const handleStatusChange = useCallback((newStatus: GameStatus) => {
    setStatus(newStatus);
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-3 sm:p-6 text-slate-100 selection:bg-red-500/20">
      <div className="w-full max-w-[600px] flex flex-col items-center">
        {/* Game Top Navigation / Stats Bar */}
        <GameHeader
          stats={stats}
          status={status}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onTogglePause={handleTogglePause}
          onRestart={handleRestart}
        />

        {/* Arcade Screen Canvas */}
        <GameCanvas
          engine={engine}
          status={status}
          onStatusChange={handleStatusChange}
        />

        {/* Instructions / Controls Footer */}
        <ControlsGuide />
      </div>
    </main>
  );
};

export default App;
