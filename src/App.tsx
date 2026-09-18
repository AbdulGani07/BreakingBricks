import React, { useState, useEffect } from 'react';
import { EmbeddedGame } from './components/EmbeddedGame';
import { DeveloperDocs } from './components/DeveloperDocs';
import { DeveloperPlayground } from './components/DeveloperPlayground';
import { EmbedView } from './components/EmbedView';
import './sdk'; // Ensure window.BreakingBricks is initialized
import { Gamepad2, Sparkles, BookOpen, ExternalLink, Code } from 'lucide-react';

export type AppView = 'game' | 'playground' | 'docs' | 'embed';

const determineInitialView = (): AppView => {
  if (typeof window === 'undefined') return 'game';

  const path = window.location.pathname.toLowerCase();
  const search = window.location.search.toLowerCase();
  const hash = window.location.hash.toLowerCase();

  if (
    path === '/embed' ||
    path.startsWith('/embed/') ||
    path.startsWith('/embed?') ||
    path.includes('/embed') ||
    search.includes('embed=true') ||
    hash === '#/embed' ||
    hash.startsWith('#/embed')
  ) {
    return 'embed';
  }
  if (path.includes('/docs') || hash === '#/docs') {
    return 'docs';
  }
  if (path.includes('/playground') || hash === '#/playground') {
    return 'playground';
  }
  return 'game';
};

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(determineInitialView);

  // Keep URL hash/history in sync with currentView
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleUrlChange = () => {
      setCurrentView(determineInitialView());
    };

    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  const navigateTo = (view: AppView) => {
    setCurrentView(view);
    if (typeof window !== 'undefined') {
      window.location.hash = `#/${view}`;
    }
  };

  // If in iframe embed mode, return isolated embed view without top navigation chrome
  if (currentView === 'embed') {
    return <EmbedView />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500/30">
      {/* Platform Navigation Bar */}
      <nav
        id="platform-navbar"
        className="w-full border-b border-slate-800/80 bg-slate-900/80 backdrop-blur sticky top-0 z-40 px-4 sm:px-6 py-2.5 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <button
            id="nav-brand-logo"
            onClick={() => navigateTo('game')}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 via-indigo-600 to-fuchsia-600 flex items-center justify-center font-black text-white text-sm shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
              BB
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                Breaking Bricks
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/15 text-sky-400 font-mono border border-sky-500/30">
                  Platform
                </span>
              </div>
              <div className="text-[11px] text-slate-400 leading-tight">HTML5 Arcade Engine & Developer SDK</div>
            </div>
          </button>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button
            id="nav-tab-arcade"
            onClick={() => navigateTo('game')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentView === 'game'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Play Arcade</span>
          </button>

          <button
            id="nav-tab-playground"
            onClick={() => navigateTo('playground')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentView === 'playground'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Playground</span>
          </button>

          <button
            id="nav-tab-docs"
            onClick={() => navigateTo('docs')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentView === 'docs'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Docs (/docs)</span>
          </button>

          <button
            id="nav-tab-embed-preview"
            onClick={() => navigateTo('embed')}
            title="Preview isolated iframe view"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Embed View</span>
          </button>
        </div>
      </nav>

      {/* View Content */}
      <div className="flex-1 flex flex-col">
        {currentView === 'game' && (
          <main className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 md:p-6">
            <EmbeddedGame />
          </main>
        )}

        {currentView === 'playground' && (
          <DeveloperPlayground onNavigateToDocs={() => navigateTo('docs')} />
        )}

        {currentView === 'docs' && (
          <DeveloperDocs onNavigateToPlayground={() => navigateTo('playground')} />
        )}
      </div>
    </div>
  );
};

export default App;
