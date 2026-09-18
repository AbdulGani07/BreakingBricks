import React, { useState } from 'react';
import {
  Code,
  BookOpen,
  Terminal,
  ShieldCheck,
  Layers,
  Sparkles,
  Cpu,
  Check,
  Copy,
  ExternalLink,
  ChevronRight,
  Activity,
  Sliders,
  Database,
  ArrowRight,
  Share2,
} from 'lucide-react';

interface CodeSnippetProps {
  code: string;
  language?: string;
  id?: string;
}

const CodeSnippet: React.FC<CodeSnippetProps> = ({ code, language = 'javascript', id }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id={id} className="relative my-4 rounded-xl border border-slate-800 bg-slate-900/90 shadow-lg overflow-hidden group">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-950/60 text-xs text-slate-400 font-mono">
        <span className="uppercase font-semibold tracking-wider text-sky-400">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 text-xs sm:text-sm font-mono leading-relaxed text-slate-200 overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  );
};

export const DeveloperDocs: React.FC<{ onNavigateToPlayground?: () => void }> = ({
  onNavigateToPlayground,
}) => {
  const [activeSection, setActiveSection] = useState('getting-started');

  const navItems = [
    { id: 'getting-started', label: '1. Getting Started', icon: BookOpen },
    { id: 'installation', label: '2. Installation', icon: Terminal },
    { id: 'script-embed', label: '3. Script Embedding', icon: Code },
    { id: 'react-integration', label: '4. React Integration', icon: Layers },
    { id: 'configuration', label: '5. Configuration Reference', icon: Sliders },
    { id: 'runtime-api', label: '6. Runtime Instance API', icon: Cpu },
    { id: 'event-api', label: '7. Event System & Hooks', icon: Activity },
    { id: 'score-validation', label: '8. Score & Tamper Proofing', icon: ShieldCheck },
    { id: 'analytics-telemetry', label: '9. Analytics Adapters', icon: Sparkles },
    { id: 'iframe-embedding', label: '10. iframe postMessage API', icon: ExternalLink },
    { id: 'backend-examples', label: '11. Backend Verification', icon: Database },
    { id: 'social-sharing', label: '12. Social Sharing & Score Cards', icon: Share2 },
  ];

  return (
    <div id="developer-docs-container" className="w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center font-black text-white text-sm shadow-md shadow-sky-500/20">
            BB
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
              Breaking Bricks <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30">SDK v1.2.0</span>
            </h1>
            <p className="text-xs text-slate-400">Developer Platform & Integration Reference</p>
          </div>
        </div>

        {onNavigateToPlayground && (
          <button
            id="docs-btn-launch-playground"
            onClick={onNavigateToPlayground}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs sm:text-sm font-medium transition-all shadow-md shadow-sky-600/30"
          >
            Launch Playground <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        {/* Sidebar Nav */}
        <aside className="w-64 border-r border-slate-800/80 p-4 hidden lg:block sticky top-[69px] h-[calc(100vh-69px)] overflow-y-auto">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">
            Documentation Index
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => {
                    setActiveSection(item.id);
                    document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium text-left transition-colors ${
                    isActive
                      ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Body */}
        <main className="flex-1 p-6 sm:p-10 space-y-14 overflow-y-auto">
          {/* 1. Getting Started */}
          <section id="getting-started" className="space-y-4 scroll-mt-24">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-sky-500/10 text-sky-400 text-xs font-medium border border-sky-500/20">
              <BookOpen className="w-3.5 h-3.5" /> SDK Overview
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Getting Started</h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              <strong>Breaking Bricks</strong> is a production-grade, embeddable HTML5 arcade game platform built with React, TypeScript, and HTML5 Canvas. It delivers physics-rich brick breaker gameplay with zero external server dependencies, modular themes, cryptographic score verification, and rich event pipelines.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="text-sky-400 font-semibold text-sm mb-1">Serverless First</div>
                <div className="text-xs text-slate-400">Embed anywhere statically with client-side or custom persistence adapters.</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="text-sky-400 font-semibold text-sm mb-1">Versioned SDK</div>
                <div className="text-xs text-slate-400">Strict semantic versioning with <code className="text-slate-300">BreakingBricks.v1</code> long-term stability.</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="text-sky-400 font-semibold text-sm mb-1">Tamper-Proofing</div>
                <div className="text-xs text-slate-400">Deterministic cryptographic session hashing prevents falsified leaderboard scores.</div>
              </div>
            </div>
          </section>

          {/* 2. Installation */}
          <section id="installation" className="space-y-4 scroll-mt-24">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-sky-500/10 text-sky-400 text-xs font-medium border border-sky-500/20">
              <Terminal className="w-3.5 h-3.5" /> Package Setup
            </div>
            <h2 className="text-2xl font-bold text-white">Installation</h2>
            <p className="text-slate-300 text-sm">Install via npm, yarn, or pnpm for modern bundlers (Vite, Next.js, Webpack):</p>
            <CodeSnippet code="npm install breaking-bricks" language="bash" id="snippet-npm-install" />
            <p className="text-slate-300 text-sm">Or include the pre-built universal UMD bundle directly in your HTML:</p>
            <CodeSnippet
              code={`<!-- Include Breaking Bricks standalone bundle -->\n<script src="https://cdn.example.com/breaking-bricks/v1/breaking-bricks.js"></script>`}
              language="html"
              id="snippet-script-tag"
            />
          </section>

          {/* 3. Script Embedding */}
          <section id="script-embed" className="space-y-4 scroll-mt-24">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-sky-500/10 text-sky-400 text-xs font-medium border border-sky-500/20">
              <Code className="w-3.5 h-3.5" /> JavaScript API
            </div>
            <h2 className="text-2xl font-bold text-white">Vanilla JavaScript Embedding</h2>
            <p className="text-slate-300 text-sm">
              Use <code className="text-sky-400">BreakingBricks.mount()</code> (or version-pinned <code className="text-sky-400">BreakingBricks.v1.mount()</code>) to attach the arcade into any DOM element:
            </p>
            <CodeSnippet
              code={`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Arcade Integration</title>
  <script src="/breaking-bricks.js"></script>
</head>
<body style="background: #0f172a; margin: 0; padding: 20px;">
  <!-- Target mount container -->
  <div id="game-container" style="max-width: 800px; margin: 0 auto;"></div>

  <script>
    // Mount the game
    const game = BreakingBricks.mount('#game-container', {
      theme: 'cyber',
      difficulty: 'normal',
      sound: { enabled: true, sfxVolume: 0.8 },
      onScoreUpdated: (data) => {
        console.log('Current score:', data.score);
      },
      onGameOver: (result) => {
        console.log('Game over! Score:', result.score, 'Token:', result.validationToken);
      }
    });

    // Control programmatically
    // game.pause();
    // game.resume();
    // game.unmount();
  </script>
</body>
</html>`}
              language="html"
              id="snippet-vanilla-mount"
            />
          </section>

          {/* 4. React Integration */}
          <section id="react-integration" className="space-y-4 scroll-mt-24">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-sky-500/10 text-sky-400 text-xs font-medium border border-sky-500/20">
              <Layers className="w-3.5 h-3.5" /> Framework Integration
            </div>
            <h2 className="text-2xl font-bold text-white">React Component Integration</h2>
            <p className="text-slate-300 text-sm">
              Import types and create a lightweight wrapper component using a React <code className="text-sky-400">ref</code>:
            </p>
            <CodeSnippet
              code={`import React, { useEffect, useRef } from 'react';
import { BreakingBricks, BreakingBricksInstance } from 'breaking-bricks';

export const MyArcadeSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<BreakingBricksInstance | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Mount game instance
    const game = BreakingBricks.v1.mount(containerRef.current, {
      theme: 'synthwave',
      difficulty: 'hard',
      onLevelCompleted: (payload) => {
        console.log(\`Cleared level \${payload.level}!\`);
      },
      onGameOver: (payload) => {
        alert(\`Game finished! Final score: \${payload.score}\`);
      },
    });

    gameRef.current = game;

    // Cleanup on unmount
    return () => {
      game.unmount();
    };
  }, []);

  return (
    <div className="p-4 bg-slate-900 rounded-2xl shadow-2xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-white font-bold">Arcade Challenge</h2>
        <button
          onClick={() => gameRef.current?.restart()}
          className="px-3 py-1 bg-sky-600 text-white rounded text-sm hover:bg-sky-500"
        >
          Restart
        </button>
      </div>
      <div ref={containerRef} className="w-full" />
    </div>
  );
};`}
              language="tsx"
              id="snippet-react-wrapper"
            />
          </section>

          {/* 5. Configuration Reference */}
          <section id="configuration" className="space-y-4 scroll-mt-24">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-sky-500/10 text-sky-400 text-xs font-medium border border-sky-500/20">
              <Sliders className="w-3.5 h-3.5" /> SDK Options
            </div>
            <h2 className="text-2xl font-bold text-white">Configuration Reference</h2>
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/70">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-300 font-semibold">
                  <tr>
                    <th className="p-3">Property</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Default</th>
                    <th className="p-3">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  <tr>
                    <td className="p-3 font-mono text-sky-400">theme</td>
                    <td className="p-3 font-mono text-slate-400">'cyber' | 'synthwave' | 'retro' | 'neon' | 'matrix' | 'minimal' | ThemeConfig</td>
                    <td className="p-3 font-mono text-slate-500">'cyber'</td>
                    <td className="p-3">Color scheme and visual motif for paddle, background, HUD, and particles.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-sky-400">difficulty</td>
                    <td className="p-3 font-mono text-slate-400">'easy' | 'normal' | 'hard' | 'expert'</td>
                    <td className="p-3 font-mono text-slate-500">'normal'</td>
                    <td className="p-3">Sets starting lives, initial ball speeds, and paddle dimensions.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-sky-400">sound</td>
                    <td className="p-3 font-mono text-slate-400">{`{ enabled?: boolean, sfxVolume?: number, musicVolume?: number, muted?: boolean }`}</td>
                    <td className="p-3 font-mono text-slate-500">{`{ enabled: true }`}</td>
                    <td className="p-3">Audio configuration using Web Audio API procedural synthesis.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-sky-400">scoreAdapter</td>
                    <td className="p-3 font-mono text-slate-400">ScoreAdapter</td>
                    <td className="p-3 font-mono text-slate-500">LocalStorageAdapter</td>
                    <td className="p-3">Storage engine for high scores and persistent leaderboards.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-sky-400">analyticsAdapter</td>
                    <td className="p-3 font-mono text-slate-400">AnalyticsAdapter</td>
                    <td className="p-3 font-mono text-slate-500">LocalAnalyticsAdapter</td>
                    <td className="p-3">Telemetry adapter forwarding game metrics and play sessions.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 6. Runtime Instance API */}
          <section id="runtime-api" className="space-y-4 scroll-mt-24">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-sky-500/10 text-sky-400 text-xs font-medium border border-sky-500/20">
              <Cpu className="w-3.5 h-3.5" /> Instance Controls
            </div>
            <h2 className="text-2xl font-bold text-white">Runtime Instance API</h2>
            <p className="text-slate-300 text-sm">Calling <code className="text-sky-400">BreakingBricks.mount()</code> returns a controller object:</p>
            <CodeSnippet
              code={`const game = BreakingBricks.mount('#target');

// Playback control
game.pause();
game.resume();
game.restart();

// Realtime configuration
game.setDifficulty('hard');
game.setSoundVolume('sfx', 0.5);
game.setMuted(true);

// State inspection
const currentScore = game.getScore();
const savedHigh = await game.getHighScore();

// Cleanup and memory disposal
game.unmount();`}
              language="javascript"
              id="snippet-runtime-controls"
            />
          </section>

          {/* 7. Event API Reference */}
          <section id="event-api" className="space-y-4 scroll-mt-24">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-sky-500/10 text-sky-400 text-xs font-medium border border-sky-500/20">
              <Activity className="w-3.5 h-3.5" /> Telemetry & Events
            </div>
            <h2 className="text-2xl font-bold text-white">Event API Reference</h2>
            <p className="text-slate-300 text-sm">Subscribe to real-time gameplay events using <code className="text-sky-400">game.on(event, handler)</code>:</p>
            <CodeSnippet
              code={`// Subscribing to events
const unsubscribe = game.on('brickDestroyed', (e) => {
  console.log(\`Destroyed \${e.brickType} brick! Current combo: \${e.combo}\`);
});

game.on('levelCompleted', (e) => {
  console.log(\`Level \${e.level} finished! Perfect run: \${e.perfect}\`);
});

game.on('gameOver', (e) => {
  console.log(\`Match completed. Final Score: \${e.score}, Validation Hash: \${e.validationToken}\`);
});

// Remove listener when needed
// unsubscribe();`}
              language="javascript"
              id="snippet-event-api"
            />
          </section>

          {/* 8. Score & Tamper Proofing */}
          {/* 8. Serverless Score System & Tamper-Proofing */}
          <section id="score-validation" className="space-y-6 scroll-mt-24">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" /> Serverless Architecture
            </div>
            <h2 className="text-2xl font-bold text-white">Serverless Score System & Storage</h2>
            
            <p className="text-slate-300 text-sm leading-relaxed">
              Designed specifically for fast, zero-maintenance serverless deployments (such as Vercel). Breaking Bricks does not mandate a hosted database, authentication provider, or multi-tenant backend. Everything is designed to run <strong>completely client-side by default</strong> while preserving state between browser visits.
            </p>

            {/* Default LocalStorage Feature Card */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 text-sm">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Default Persistence: Namespaced LocalStorage
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm">
                The game automatically records and restores the following attributes across user sessions:
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                <li className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-center justify-between">
                  <span className="font-mono text-sky-400">high score</span>
                  <span className="text-slate-400">Highest match score</span>
                </li>
                <li className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-center justify-between">
                  <span className="font-mono text-emerald-400">highest level</span>
                  <span className="text-slate-400">Deepest arcade level reached</span>
                </li>
                <li className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-center justify-between">
                  <span className="font-mono text-amber-400">games played</span>
                  <span className="text-slate-400">Lifetime match counter</span>
                </li>
                <li className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-center justify-between">
                  <span className="font-mono text-pink-400">achievements</span>
                  <span className="text-slate-400">Array of unlocked badge IDs</span>
                </li>
              </ul>
            </div>

            {/* Optional Custom Callback: BreakingBricks.configure */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">Custom Score Saving Callback</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Need to route scores to your own serverless API, Supabase, Cloudflare Worker, or custom webhook? Use <code className="text-sky-400">BreakingBricks.configure()</code> to supply an optional asynchronous <code className="text-sky-400">saveScore</code> callback:
              </p>
              <CodeSnippet
                code={`import { BreakingBricks } from 'breaking-bricks';

// Optional: Provide custom score saving callback
BreakingBricks.configure({
  saveScore: async (data) => {
    await fetch("https://your-api.example.com/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        score: data.score,
        level: data.level,
        highScore: data.highScore,
        highestLevel: data.highestLevel,
        gamesPlayed: data.gamesPlayed,
        achievements: data.achievements,
        validationToken: data.validationToken,
        sessionId: data.sessionId,
        timestamp: data.timestamp
      })
    });
  }
});`}
                language="typescript"
                id="snippet-save-score-config"
              />
            </div>

            {/* ScoreSaveData Interface */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs font-mono">
              <div className="text-slate-400">// Structure of the data passed to saveScore:</div>
              <div className="text-sky-300">
{`interface ScoreSaveData {
  score: number;             // Match score achieved
  level: number;             // Final level reached
  highScore: number;         // Overall lifetime high score
  highestLevel: number;      // Deepest level conquered
  gamesPlayed: number;       // Lifetime match count
  achievements: string[];    // Array of unlocked achievement IDs
  isHighScore: boolean;      // True if this game set a new personal record
  sessionId: string;         // Unique cryptographic session UUID
  validationToken: string;   // HMAC tamper-proof session verification token
  timestamp: number;         // Epoch timestamp
  bricksBroken: number;      // Total bricks destroyed this game
  maxCombo: number;          // Peak combo multiplier
}`}
              </div>
            </div>

            {/* Tamper Proofing */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">Cryptographic Anti-Cheat Tamper-Proofing</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                When saving scores to external systems, client-side tampering is mitigated by the built-in <code className="text-sky-400">ScoreManager</code>. It generates an HMAC-style cryptographic signature (<code className="text-sky-400">validationToken</code>) based on match events, active replay ticks, and timestamps:
              </p>
              <CodeSnippet
                code={`import { validateScoreSession } from 'breaking-bricks';

// Server-side or client verification
const isValid = validateScoreSession(receivedPayload, 'optional_custom_salt');
if (!isValid) {
  throw new Error('Score token has been manipulated or spoofed!');
}`}
                language="typescript"
                id="snippet-validation-code"
              />
            </div>
          </section>

          {/* 9. Analytics Adapters */}
          <section id="analytics-telemetry" className="space-y-4 scroll-mt-24">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-sky-500/10 text-sky-400 text-xs font-medium border border-sky-500/20">
              <Sparkles className="w-3.5 h-3.5" /> Telemetry
            </div>
            <h2 className="text-2xl font-bold text-white">Custom Analytics Adapters</h2>
            <p className="text-slate-300 text-sm">
              Implement the <code className="text-sky-400">AnalyticsAdapter</code> interface to route telemetry to Google Analytics, Mixpanel, Datadog, or custom webhook endpoints:
            </p>
            <CodeSnippet
              code={`import { BreakingBricks, AnalyticsAdapter, CustomEndpointAnalyticsAdapter } from 'breaking-bricks';

// Option A: Use built-in Remote Webhook Adapter
const remoteAnalytics = new CustomEndpointAnalyticsAdapter({
  endpointUrl: 'https://analytics.mycompany.com/v1/game-events',
  headers: { 'X-Game-Key': 'my-api-token' },
  batchSize: 10,
  flushIntervalMs: 5000,
});

// Option B: Implement custom AnalyticsAdapter
const customAdapter: AnalyticsAdapter = {
  trackEvent: (eventName, payload, sessionId) => {
    window.dataLayer?.push({
      event: 'arcade_' + eventName,
      session_id: sessionId,
      ...payload
    });
  }
};

BreakingBricks.mount('#container', {
  analyticsAdapter: remoteAnalytics
});`}
              language="typescript"
              id="snippet-analytics-adapter"
            />
          </section>

          {/* 10. iframe Embedding */}
          <section id="iframe-embedding" className="space-y-4 scroll-mt-24">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-sky-500/10 text-sky-400 text-xs font-medium border border-sky-500/20">
              <ExternalLink className="w-3.5 h-3.5" /> Cross-Origin Embed
            </div>
            <h2 className="text-2xl font-bold text-white">iframe Embedding & postMessage API</h2>
            <p className="text-slate-300 text-sm">
              Embed Breaking Bricks in any CMS (WordPress, Webflow, Shopify) via <code className="text-sky-400">&lt;iframe&gt;</code> with bidirectional <code className="text-sky-400">window.postMessage</code> communication:
            </p>
            <CodeSnippet
              code={`<!-- Standard iframe embed with query parameters -->
<iframe
  id="arcade-frame"
  src="https://your-domain.com/embed?theme=cyber&difficulty=normal&sound=true"
  width="100%"
  height="650"
  style="border: none; border-radius: 12px;"
  allow="autoplay"
></iframe>

<script>
  const frame = document.getElementById('arcade-frame');

  // 1. Listen for events from game iframe
  window.addEventListener('message', (event) => {
    if (event.data?.source === 'breaking-bricks') {
      console.log('Received Game Event:', event.data.event, event.data.payload);
    }
  });

  // 2. Dispatch commands to game iframe
  function pauseGame() {
    frame.contentWindow.postMessage({ target: 'breaking-bricks', action: 'pause' }, '*');
  }

  function restartGame() {
    frame.contentWindow.postMessage({ target: 'breaking-bricks', action: 'restart' }, '*');
  }
</script>`}
              language="html"
              id="snippet-iframe-embed"
            />
          </section>

          {/* 11. Backend Examples */}
          <section id="backend-examples" className="space-y-4 scroll-mt-24">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-sky-500/10 text-sky-400 text-xs font-medium border border-sky-500/20">
              <Database className="w-3.5 h-3.5" /> Server Verification
            </div>
            <h2 className="text-2xl font-bold text-white">Node.js / Express Score Verification Endpoint</h2>
            <p className="text-slate-300 text-sm">
              Verify incoming scores securely on your server before updating player leaderboards:
            </p>
            <CodeSnippet
              code={`// server.js (Node.js + Express)
const express = require('express');
const { validateScoreSession } = require('breaking-bricks');

const app = express();
app.use(express.json());

app.post('/api/leaderboard/submit', async (req, res) => {
  const { scorePayload } = req.body;

  // Verify cryptographic token
  const isValid = validateScoreSession(scorePayload);
  if (!isValid) {
    return res.status(400).json({ error: 'Tampered score submission detected' });
  }

  // Sanity check: score should match broken bricks count bounds
  const { score, level, metadata } = scorePayload;
  if (score > (metadata.bricksBroken * 50 * 5) + 1000) {
    return res.status(400).json({ error: 'Mathematical score anomaly' });
  }

  // Persist to database
  await db.leaderboards.insert({
    userId: req.user.id,
    score,
    level,
    submittedAt: new Date()
  });

  res.json({ success: true, rank: 4 });
});`}
              language="javascript"
              id="snippet-backend-verification"
            />
          </section>

          {/* 12. Social Sharing & Viral Score Cards */}
          <section id="social-sharing" className="space-y-4 scroll-mt-24">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-cyan-500/10 text-cyan-400 text-xs font-medium border border-cyan-500/20">
              <Share2 className="w-3.5 h-3.5" /> Client-Side Social Sharing
            </div>
            <h2 className="text-2xl font-bold text-white">Social Sharing & Screenshot Score Cards</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Upon game completion (Game Over or Victory), Breaking Bricks provides a zero-backend, 100% client-side social sharing engine designed for viral distribution:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300 pt-1">
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                <div className="font-bold text-sky-400 flex items-center gap-1.5">
                  <span>📋 Copy Score Button</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Copies a formatted summary including final score, level reached, bricks smashed, and max combo directly to the player's clipboard.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <span>📱 Native Web Share API (Mobile)</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Invokes the mobile operating system's native share sheet (iOS/Android) to share scores directly to WhatsApp, iMessage, Instagram, or Twitter.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                <div className="font-bold text-amber-400 flex items-center gap-1.5">
                  <span>📸 Client-Side Score Card Capture</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Renders a crisp 800x480 cyberpunk arcade score card on an offscreen HTML5 canvas. Players can preview, download the PNG, or copy the image directly to their clipboard with zero server requests.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                <div className="font-bold text-pink-400 flex items-center gap-1.5">
                  <span>🚀 1-Click Desktop Channels</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Desktop players without the Web Share API can use 1-click sharing buttons for X (Twitter), WhatsApp Web, and Telegram.
                </p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};
