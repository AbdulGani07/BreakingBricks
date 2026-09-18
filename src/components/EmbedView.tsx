import React, { useEffect, useMemo, useRef, useState } from 'react';
import { EmbeddedGame } from './EmbeddedGame';
import { GameEventEmitter } from '../sdk/EventEmitter';
import {
  BreakingBricksConfig,
  BreakingBricksInstance,
  GameDifficulty,
  ThemeId,
} from '../sdk/types';
import { THEMES } from '../sdk/theme';

export const EmbedView: React.FC = () => {
  const instanceRef = useRef<BreakingBricksInstance | null>(null);
  const [params, setParams] = useState<URLSearchParams | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      // Also extract any parameters placed in hash (e.g., #/embed?theme=cyber)
      if (window.location.hash.includes('?')) {
        const hashQuery = window.location.hash.split('?')[1];
        const hashParams = new URLSearchParams(hashQuery);
        hashParams.forEach((val, key) => {
          if (!searchParams.has(key)) searchParams.set(key, val);
        });
      }
      setParams(searchParams);
    }
  }, []);

  const eventEmitter = useMemo(() => new GameEventEmitter(), []);

  // Compute config from URL params
  // Supports: /embed?theme=cyber&difficulty=hard&sound=true
  const config = useMemo<BreakingBricksConfig>(() => {
    if (!params) return {};

    const rawTheme = (params.get('theme') || 'cyber').toLowerCase();
    const rawDiff = (params.get('difficulty') || 'normal').toLowerCase();
    const soundParam = params.get('sound');
    const muteParam = params.get('mute') || params.get('muted');
    const volumeParam = params.get('volume');
    const guideParam = params.get('guide');
    const autostartParam = params.get('autostart') || params.get('autoStart');

    // Theme resolution: cyber (default), synthwave, retro, neon, matrix, minimal
    const theme: ThemeId = rawTheme && THEMES[rawTheme as ThemeId] ? (rawTheme as ThemeId) : 'cyber';

    // Difficulty resolution: easy, normal (default), hard, extreme (expert)
    let difficulty: GameDifficulty = 'normal';
    if (rawDiff === 'easy') difficulty = 'easy';
    else if (rawDiff === 'normal') difficulty = 'normal';
    else if (rawDiff === 'hard') difficulty = 'hard';
    else if (rawDiff === 'extreme' || rawDiff === 'expert') difficulty = 'extreme';

    // Sound resolution (sound=true/false, mute=true/false)
    let soundEnabled = true;
    if (soundParam === 'false' || soundParam === '0' || muteParam === 'true' || muteParam === '1') {
      soundEnabled = false;
    } else if (soundParam === 'true' || soundParam === '1') {
      soundEnabled = true;
    }

    const volumeVal = volumeParam ? Math.max(0, Math.min(1, parseFloat(volumeParam))) : 0.8;
    const autoStart = autostartParam === 'true' || autostartParam === '1';

    return {
      theme,
      difficulty,
      autoStart,
      showControlsGuide: guideParam === 'false' ? false : true,
      sound: {
        enabled: soundEnabled,
        sfxVolume: volumeVal,
        musicVolume: volumeVal * 0.7,
        muted: !soundEnabled,
      },
      width: '100%',
      maxContainerWidth: '600px',
    };
  }, [params]);

  // Hook bidirectional postMessage protocol
  useEffect(() => {
    // 1. Forward all emitted game events to parent window
    // Expected by parent: gameStarted, scoreUpdated, gameOver, levelCompleted
    const unsubs: Array<() => void> = [];
    const eventNames = [
      'gameStarted',
      'scoreUpdated',
      'gameOver',
      'levelCompleted',
      'brickDestroyed',
      'perfectLevelCompleted',
      'achievementUnlocked',
      'sessionStarted',
      'sessionEnded',
      'playTimeUpdated',
      'powerUpUsed',
      'playerDied',
    ] as const;

    eventNames.forEach((eventName) => {
      const unsub = eventEmitter.on(eventName as any, (payload: any) => {
        if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
          window.parent.postMessage(
            {
              event: eventName,
              type: eventName,
              source: 'breaking-bricks',
              version: '1.2.0',
              ...payload,
              payload,
              timestamp: Date.now(),
            },
            '*'
          );
        }
      });
      unsubs.push(unsub);
    });

    // 2. Listen to incoming control messages from parent window
    // Supported actions: pause, resume, restart, mute, changeDifficulty
    const handleParentMessage = (e: MessageEvent) => {
      let data = e.data;
      if (!data) return;

      // Handle string messages (e.g. postMessage('pause', '*'))
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch {
          data = { action: data };
        }
      }

      // If target is specified and not breaking-bricks, ignore
      if (data.target && data.target !== 'breaking-bricks' && data.target !== 'bb') return;

      const inst = instanceRef.current;
      if (!inst) return;

      const action = (data.action || data.type || data.command || '').toString().trim();

      switch (action) {
        case 'pause':
          inst.pause();
          break;
        case 'resume':
          inst.resume();
          break;
        case 'restart':
          inst.restart();
          break;
        case 'mute':
          if (typeof data.muted === 'boolean') {
            inst.setMuted(data.muted);
          } else if (typeof data.value === 'boolean') {
            inst.setMuted(data.value);
          } else {
            inst.setMuted(true);
          }
          break;
        case 'unmute':
          inst.setMuted(false);
          break;
        case 'changeDifficulty':
        case 'setDifficulty': {
          const rawDiff = (data.difficulty || data.value || data.diff || '').toString().toLowerCase();
          const mappedDiff: GameDifficulty = rawDiff === 'expert' ? 'extreme' : (rawDiff as GameDifficulty);
          if (mappedDiff === 'easy' || mappedDiff === 'normal' || mappedDiff === 'hard' || mappedDiff === 'extreme') {
            inst.setDifficulty(mappedDiff);
          }
          break;
        }
        case 'setVolume':
          if (typeof data.volume === 'number') {
            inst.setSoundVolume('sfx', data.volume);
            inst.setSoundVolume('music', data.volume * 0.7);
          }
          break;
        case 'setMuted':
          if (typeof data.muted === 'boolean') {
            inst.setMuted(data.muted);
          }
          break;
        case 'ping':
          if (window.parent && window.parent !== window) {
            window.parent.postMessage(
              {
                source: 'breaking-bricks',
                event: 'pong',
                type: 'pong',
                score: inst.getScore(),
                timestamp: Date.now(),
              },
              '*'
            );
          }
          break;
      }
    };

    window.addEventListener('message', handleParentMessage);

    // Announce ready to parent
    if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
      window.parent.postMessage(
        {
          source: 'breaking-bricks',
          event: 'ready',
          type: 'ready',
          version: '1.2.0',
          timestamp: Date.now(),
        },
        '*'
      );
    }

    return () => {
      unsubs.forEach((u) => u());
      window.removeEventListener('message', handleParentMessage);
    };
  }, [eventEmitter]);

  return (
    <div
      id="breaking-bricks-embed-container"
      className="w-full h-full min-h-screen sm:min-h-0 flex flex-col items-center justify-center bg-slate-950 text-slate-100 overflow-hidden select-none p-1 sm:p-2"
    >
      <EmbeddedGame
        config={config}
        eventEmitter={eventEmitter}
        onInstanceReady={(inst) => {
          instanceRef.current = inst;
        }}
      />
    </div>
  );
};
