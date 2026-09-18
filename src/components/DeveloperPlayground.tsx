import React, { useState, useMemo, useRef, useCallback } from 'react';
import { EmbeddedGame } from './EmbeddedGame';
import { GameEventEmitter } from '../sdk/EventEmitter';
import {
  BreakingBricksConfig,
  BreakingBricksInstance,
  GameDifficulty,
  ThemeId,
  GameEventMap,
  StoredGameStats,
} from '../sdk/types';
import { THEMES } from '../sdk/theme';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Code2,
  Radio,
  Sliders,
  Sparkles,
  Trash2,
  Terminal,
  Activity,
  Layers,
  ExternalLink,
  Database,
  Trophy,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface EventLogItem {
  id: string;
  time: string;
  eventName: string;
  payload: any;
}

export const DeveloperPlayground: React.FC<{ onNavigateToDocs?: () => void }> = ({
  onNavigateToDocs,
}) => {
  // Config state
  const [theme, setTheme] = useState<ThemeId>('cyber');
  const [difficulty, setDifficulty] = useState<GameDifficulty>('normal');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [volume, setVolume] = useState<number>(0.8);
  const [showGuide, setShowGuide] = useState<boolean>(true);
  const [codeTab, setCodeTab] = useState<'html' | 'react' | 'iframe' | 'serverless' | 'npm'>('html');
  const [copied, setCopied] = useState(false);

  // Serverless Score state
  const [customSaveScoreActive, setCustomSaveScoreActive] = useState<boolean>(true);
  const [persistedStats, setPersistedStats] = useState<StoredGameStats | null>(null);

  // Runtime instance reference
  const instanceRef = useRef<BreakingBricksInstance | null>(null);
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(true);

  // Event stream state
  const [eventLogs, setEventLogs] = useState<EventLogItem[]>([]);
  const [streamPaused, setStreamPaused] = useState<boolean>(false);
  const streamPausedRef = useRef(false);
  streamPausedRef.current = streamPaused;

  const refreshPersistedStats = useCallback(() => {
    if (instanceRef.current?.getStoredStats) {
      Promise.resolve(instanceRef.current.getStoredStats()).then((st) => {
        if (st) setPersistedStats(st);
      });
    }
  }, []);

  const eventEmitter = useMemo(() => {
    const emitter = new GameEventEmitter();

    const logEvent = (eventName: string, payload: any) => {
      if (streamPausedRef.current) return;
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
      
      setEventLogs((prev) => [
        {
          id: `${Date.now()}-${Math.random()}`,
          time: timeStr,
          eventName,
          payload,
        },
        ...prev.slice(0, 49), // Keep last 50 events
      ]);

      if (eventName === 'scoreUpdated') {
        setCurrentScore(payload.score);
      }
      if (['scoreUpdated', 'gameOver', 'levelCompleted', 'achievementUnlocked'].includes(eventName)) {
        setTimeout(refreshPersistedStats, 100);
      }
    };

    const trackedEvents = [
      'gameStarted',
      'scoreUpdated',
      'brickDestroyed',
      'levelCompleted',
      'perfectLevelCompleted',
      'gameOver',
      'achievementUnlocked',
      'sessionStarted',
      'sessionEnded',
      'playTimeUpdated',
      'powerUpUsed',
      'playerDied',
    ] as const;

    trackedEvents.forEach((ev) => {
      emitter.on(ev as any, (p: any) => logEvent(ev, p));
    });

    return emitter;
  }, [refreshPersistedStats]);

  // Compute live config
  const config = useMemo<BreakingBricksConfig>(() => {
    return {
      theme,
      difficulty,
      showControlsGuide: showGuide,
      sound: {
        enabled: soundEnabled,
        sfxVolume: volume,
        musicVolume: volume * 0.7,
        muted: !soundEnabled,
      },
      saveScore: customSaveScoreActive
        ? (data) => {
            const now = new Date();
            const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
            setEventLogs((prev) => [
              {
                id: `${Date.now()}-${Math.random()}`,
                time: timeStr,
                eventName: 'saveScore [Custom Callback]',
                payload: {
                  score: data.score,
                  level: data.level,
                  highScore: data.highScore,
                  highestLevel: data.highestLevel,
                  gamesPlayed: data.gamesPlayed,
                  achievements: data.achievements,
                  validationToken: data.validationToken,
                },
              },
              ...prev.slice(0, 49),
            ]);
            setTimeout(refreshPersistedStats, 50);
          }
        : undefined,
    };
  }, [theme, difficulty, soundEnabled, volume, showGuide, customSaveScoreActive, refreshPersistedStats]);

  // Generated code snippets
  const generatedCode = useMemo(() => {
    switch (codeTab) {
      case 'html':
        return `<!-- Breaking Bricks Standalone Embed -->
<div id="game-mount-point" style="width: 100%; max-width: 720px; margin: 0 auto;"></div>

<script src="https://unpkg.com/breaking-bricks@1.2.0/dist/breaking-bricks.js"></script>
<script>
  const game = BreakingBricks.v1.mount('#game-mount-point', {
    theme: '${theme}',
    difficulty: '${difficulty}',
    sound: { enabled: ${soundEnabled}, sfxVolume: ${volume} },
    showControlsGuide: ${showGuide},
    onScoreUpdated: (data) => console.log('Score:', data.score),
    onGameOver: (res) => console.log('Match result:', res),
  });
</script>`;

      case 'react':
        return `import React, { useEffect, useRef } from 'react';
import { BreakingBricks } from 'breaking-bricks';

export const ArcadeWidget = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const game = BreakingBricks.mount(containerRef.current, {
      theme: '${theme}',
      difficulty: '${difficulty}',
      sound: { enabled: ${soundEnabled}, sfxVolume: ${volume} },
      showControlsGuide: ${showGuide},
    });

    return () => game.unmount();
  }, []);

  return <div ref={containerRef} className="w-full max-w-2xl mx-auto" />;
};`;

      case 'iframe':
        return `<!-- Universal responsive iframe embed -->
<iframe
  src="https://your-domain.com/embed?theme=${theme}&difficulty=${difficulty}&sound=${soundEnabled}&volume=${volume}&guide=${showGuide}"
  width="100%"
  height="600"
  style="border: none; border-radius: 12px; overflow: hidden;"
  allow="autoplay"
></iframe>`;

      case 'serverless':
        return `// Serverless Vercel Score Configuration
import { BreakingBricks } from 'breaking-bricks';

// Optional: Provide custom score saving callback
BreakingBricks.configure({
  saveScore: async (data) => {
    console.log('[BreakingBricks] Saving score to serverless API:', data);
    await fetch('/api/save-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
});

// Mount game (all statistics saved to localStorage by default)
const game = BreakingBricks.mount('#game-container', {
  theme: '${theme}',
  difficulty: '${difficulty}',
});`;

      case 'npm':
        return `// 1. Install package
// npm install breaking-bricks

import { BreakingBricks, LocalStorageAdapter } from 'breaking-bricks';

const game = BreakingBricks.mount('#game-root', {
  theme: '${theme}',
  difficulty: '${difficulty}',
  scoreAdapter: new LocalStorageAdapter('my_app_high_score'),
});`;
    }
  }, [codeTab, theme, difficulty, soundEnabled, volume, showGuide]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTogglePause = () => {
    if (!instanceRef.current) return;
    if (isPaused) {
      instanceRef.current.resume();
      setIsPaused(false);
    } else {
      instanceRef.current.pause();
      setIsPaused(true);
    }
  };

  const handleRestart = () => {
    if (instanceRef.current) {
      instanceRef.current.restart();
      setIsPaused(false);
      refreshPersistedStats();
    }
  };

  const handleResetStats = async () => {
    if (instanceRef.current?.resetStats) {
      await instanceRef.current.resetStats();
      if (instanceRef.current.getStoredStats) {
        const fresh = await instanceRef.current.getStoredStats();
        setPersistedStats(fresh);
      }
    }
  };

  return (
    <div id="developer-playground-container" className="w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center font-black text-white text-sm shadow-md shadow-indigo-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
              Developer Playground
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Interactive Testing Studio
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onNavigateToDocs && (
            <button
              id="playground-btn-view-docs"
              onClick={onNavigateToDocs}
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs sm:text-sm font-medium transition-colors"
            >
              SDK Documentation
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto w-full">
        {/* Left / Center Column: Live Game Preview + Runtime Controls (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          {/* Game Canvas Box */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl p-3 sm:p-4 overflow-hidden flex flex-col items-center justify-center min-h-[460px]">
            {isMounted ? (
              <EmbeddedGame
                config={config}
                eventEmitter={eventEmitter}
                onInstanceReady={(inst) => {
                  instanceRef.current = inst;
                  if (inst.getStoredStats) {
                    Promise.resolve(inst.getStoredStats()).then((st) => {
                      if (st) setPersistedStats(st);
                    });
                  }
                }}
              />
            ) : (
              <div className="text-center py-24 text-slate-500">
                <p className="text-sm">Game instance unmounted.</p>
                <button
                  onClick={() => setIsMounted(true)}
                  className="mt-3 px-4 py-2 bg-sky-600 text-white rounded-lg text-xs font-semibold hover:bg-sky-500"
                >
                  Remount Instance
                </button>
              </div>
            )}
          </div>

          {/* Runtime Control Toolbar */}
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/70 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <button
                id="pg-ctrl-pause-resume"
                onClick={handleTogglePause}
                disabled={!isMounted}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors disabled:opacity-50"
              >
                {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
                <span>{isPaused ? 'Resume' : 'Pause'}</span>
              </button>

              <button
                id="pg-ctrl-restart"
                onClick={handleRestart}
                disabled={!isMounted}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
                <span>Restart</span>
              </button>

              <button
                id="pg-ctrl-unmount-remount"
                onClick={() => setIsMounted((prev) => !prev)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              >
                <span>{isMounted ? 'Unmount' : 'Mount'}</span>
              </button>
            </div>

            <div className="flex items-center gap-3 font-mono text-slate-300">
              <span className="text-slate-400">Score:</span>
              <span className="font-bold text-sky-400 text-sm">{currentScore}</span>
            </div>
          </div>

          {/* Dynamic Integration Code Box */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Code2 className="w-4 h-4 text-sky-400" />
                <span>Generated Embed Code</span>
              </div>

              {/* Code format tabs */}
              <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs flex-wrap gap-1">
                {(['html', 'react', 'iframe', 'serverless', 'npm'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setCodeTab(tab)}
                    className={`px-2.5 py-1 rounded capitalize transition-colors ${
                      codeTab === tab
                        ? 'bg-sky-600 text-white font-medium'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Snippet box */}
            <div className="relative rounded-lg border border-slate-800 bg-slate-950 p-3.5 font-mono text-xs text-slate-200 overflow-x-auto max-h-48">
              <button
                onClick={handleCopyCode}
                className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded bg-slate-800/90 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <pre>
                <code>{generatedCode}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Right Column: Configuration Controls + Real-Time Telemetry Stream (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-5">
          {/* Configuration Controls */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
              <Sliders className="w-4 h-4 text-sky-400" />
              <span>Configuration Options</span>
            </div>

            {/* Theme Selector */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400">Theme Motif</label>
              <div className="grid grid-cols-3 gap-2">
                {(['cyber', 'synthwave', 'retro', 'neon', 'matrix', 'minimal'] as ThemeId[]).map((th) => (
                  <button
                    key={th}
                    id={`btn-theme-${th}`}
                    onClick={() => setTheme(th)}
                    className={`py-1.5 px-2 rounded-lg text-xs capitalize font-medium transition-all ${
                      theme === th
                        ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 ring-1 ring-sky-400'
                        : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {th}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Selector */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400">Difficulty Preset</label>
              <div className="grid grid-cols-4 gap-2">
                {(['easy', 'normal', 'hard', 'expert'] as GameDifficulty[]).map((diff) => (
                  <button
                    key={diff}
                    id={`btn-diff-${diff}`}
                    onClick={() => {
                      setDifficulty(diff);
                      if (instanceRef.current) instanceRef.current.setDifficulty(diff);
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs capitalize font-medium transition-all ${
                      difficulty === diff
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400'
                        : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            {/* Sound Toggles */}
            <div className="space-y-2 pt-1 border-t border-slate-800/60">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Audio System</span>
                <button
                  onClick={() => setSoundEnabled((p) => !p)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    soundEnabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  <span>{soundEnabled ? 'Enabled' : 'Muted'}</span>
                </button>
              </div>

              {soundEnabled && (
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-400">Volume:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setVolume(v);
                      if (instanceRef.current) {
                        instanceRef.current.setSoundVolume('sfx', v);
                        instanceRef.current.setSoundVolume('music', v * 0.7);
                      }
                    }}
                    className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <span className="font-mono text-slate-300 w-8">{Math.round(volume * 100)}%</span>
                </div>
              )}
            </div>

            {/* Controls Guide */}
            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/60">
              <span className="text-slate-300">Show Controls Guide</span>
              <input
                type="checkbox"
                checked={showGuide}
                onChange={(e) => setShowGuide(e.target.checked)}
                className="accent-sky-500 rounded cursor-pointer w-4 h-4"
              />
            </div>
          </div>

          {/* Serverless Score & Persistence Inspector */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Serverless Score Storage</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                  localStorage
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  id="pg-btn-refresh-stats"
                  onClick={refreshPersistedStats}
                  title="Refresh stats"
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  id="pg-btn-reset-stats"
                  onClick={handleResetStats}
                  title="Reset stats in localStorage"
                  className="px-2 py-0.5 rounded text-[11px] bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/60 transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Persistent Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">High Score</div>
                <div className="text-sm font-bold font-mono text-sky-400 mt-0.5">
                  {(persistedStats?.highScore ?? 0).toLocaleString()}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Highest Level</div>
                <div className="text-sm font-bold font-mono text-indigo-400 mt-0.5">
                  {persistedStats?.highestLevel ?? 1}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Games Played</div>
                <div className="text-sm font-bold font-mono text-amber-400 mt-0.5">
                  {persistedStats?.gamesPlayed ?? 0}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Badges</div>
                <div className="text-sm font-bold font-mono text-pink-400 mt-0.5">
                  {persistedStats?.achievements?.length ?? 0} / 6
                </div>
              </div>
            </div>

            {/* Custom saveScore Callback Toggle */}
            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/60">
              <div className="flex flex-col">
                <span className="text-slate-300 font-medium">Custom saveScore Callback</span>
                <span className="text-[10px] text-slate-500">Dispatches full session telemetry</span>
              </div>
              <input
                id="pg-toggle-custom-save-score"
                type="checkbox"
                checked={customSaveScoreActive}
                onChange={(e) => setCustomSaveScoreActive(e.target.checked)}
                className="accent-emerald-500 rounded cursor-pointer w-4 h-4"
              />
            </div>
          </div>

          {/* Real-time Telemetry & Event Inspector */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-3 flex-1 flex flex-col min-h-[300px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Live Event Stream</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStreamPaused((p) => !p)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                    streamPaused
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {streamPaused ? 'Paused' : 'Active'}
                </button>
                <button
                  onClick={() => setEventLogs([])}
                  title="Clear events"
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Event list container */}
            <div className="flex-1 rounded-lg border border-slate-800 bg-slate-950 p-2 overflow-y-auto space-y-1.5 font-mono text-xs max-h-[360px]">
              {eventLogs.length === 0 ? (
                <div className="text-center py-12 text-slate-600 text-xs">
                  Awaiting gameplay events (start game or destroy a brick)...
                </div>
              ) : (
                eventLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2 rounded bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition-colors space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-sky-400 font-semibold">{log.eventName}</span>
                      <span className="text-slate-500 text-[10px]">{log.time}</span>
                    </div>
                    <div className="text-slate-400 text-[11px] overflow-x-auto whitespace-pre-wrap break-all">
                      {JSON.stringify(log.payload)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
