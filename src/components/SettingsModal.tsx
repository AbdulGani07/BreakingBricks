import React, { useState, useEffect } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Volume1,
  Music,
  Sliders,
  Sparkles,
  MousePointer,
  Keyboard,
  Smartphone,
  Trash2,
} from 'lucide-react';
import { audioSystem } from '../audio/AudioSystem';
import { AudioSettings } from '../types';

interface SettingsModalProps {
  onResetHighScore: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onResetHighScore,
  onClose,
}) => {
  const [settings, setSettings] = useState<AudioSettings>(() => audioSystem.getSettings());

  useEffect(() => {
    // Subscribe to audio changes
    const unsubscribe = audioSystem.subscribe((newSettings) => {
      setSettings(newSettings);
    });
    return unsubscribe;
  }, []);

  const handleToggleMute = () => {
    audioSystem.toggleMute();
    audioSystem.playButtonClick();
  };

  const handleToggleMusic = () => {
    audioSystem.setMusicEnabled(!settings.musicEnabled);
    audioSystem.playButtonClick();
  };

  const handleMasterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    audioSystem.setMasterVolume(val);
  };

  const handleSfxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    audioSystem.setSfxVolume(val);
  };

  const handleMusicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    audioSystem.setMusicVolume(val);
  };

  const handleTestSfx = () => {
    audioSystem.playPowerUp();
  };

  return (
    <div
      id="settings-modal"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn select-none"
    >
      <div className="w-full max-w-md bg-slate-900/95 border border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col text-slate-100 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
              Arcade Audio & Settings
            </h2>
          </div>
          <button
            id="btn-close-settings"
            onClick={() => {
              audioSystem.playButtonClick();
              onClose();
            }}
            aria-label="Close Settings"
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Setting Sections */}
        <div className="flex flex-col gap-4">

          {/* AUDIO CONTROLS SECTION */}
          <div className="flex flex-col gap-3 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {settings.isMuted ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                )}
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Audio System
                </span>
              </div>
              
              {/* Master Mute Toggle Button */}
              <button
                id="btn-toggle-sound-settings"
                onClick={handleToggleMute}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  settings.isMuted
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30'
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30'
                }`}
              >
                {settings.isMuted ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5" />
                    <span>MUTED</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>ACTIVE</span>
                  </>
                )}
              </button>
            </div>

            {/* Slider 1: Master Volume */}
            <div className="flex flex-col gap-1 pt-1">
              <div className="flex justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Volume1 className="w-3.5 h-3.5 text-slate-400" />
                  Master Volume
                </span>
                <span className="font-mono text-cyan-400 font-bold">
                  {settings.isMuted ? '0%' : `${Math.round(settings.masterVolume * 100)}%`}
                </span>
              </div>
              <input
                id="slider-master-volume"
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={settings.masterVolume}
                onChange={handleMasterChange}
                disabled={settings.isMuted}
                aria-label="Master Volume"
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400 disabled:opacity-35"
              />
            </div>

            {/* Slider 2: SFX Volume */}
            <div className="flex flex-col gap-1 pt-1">
              <div className="flex justify-between text-xs text-slate-300">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Arcade SFX</span>
                  <button
                    id="btn-test-sfx"
                    onClick={handleTestSfx}
                    disabled={settings.isMuted}
                    className="text-[10px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30 transition-colors disabled:opacity-30"
                  >
                    Test
                  </button>
                </div>
                <span className="font-mono text-amber-400 font-bold">
                  {Math.round(settings.sfxVolume * 100)}%
                </span>
              </div>
              <input
                id="slider-sfx-volume"
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={settings.sfxVolume}
                onChange={handleSfxChange}
                disabled={settings.isMuted}
                aria-label="SFX Volume"
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400 disabled:opacity-35"
              />
            </div>

            {/* Slider 3: Background Synth Music */}
            <div className="flex flex-col gap-1 pt-1 border-t border-slate-700/40 mt-1">
              <div className="flex justify-between items-center text-xs text-slate-300 pt-1">
                <div className="flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-purple-400" />
                  <span>Retro Synth BGM</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-purple-400 font-bold">
                    {settings.musicEnabled ? `${Math.round(settings.musicVolume * 100)}%` : 'OFF'}
                  </span>
                  <button
                    id="btn-toggle-music"
                    onClick={handleToggleMusic}
                    disabled={settings.isMuted}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all ${
                      settings.musicEnabled && !settings.isMuted
                        ? 'bg-purple-500/25 text-purple-300 border border-purple-500/40'
                        : 'bg-slate-700 text-slate-400 border border-slate-600'
                    }`}
                  >
                    {settings.musicEnabled ? 'BGM ON' : 'BGM OFF'}
                  </button>
                </div>
              </div>
              <input
                id="slider-music-volume"
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={settings.musicVolume}
                onChange={handleMusicChange}
                disabled={settings.isMuted || !settings.musicEnabled}
                aria-label="Synth Music Volume"
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-400 disabled:opacity-35"
              />
            </div>
          </div>

          {/* CONTROLS GUIDE REFERENCE */}
          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/40 flex flex-col gap-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Arcade Controls
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <MousePointer className="w-4 h-4 text-cyan-400 shrink-0" />
              <span><strong>Mouse:</strong> Move cursor left & right to glide paddle</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
              <span><strong>Touch:</strong> Drag finger across screen / Tap to fire</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Keyboard className="w-4 h-4 text-amber-400 shrink-0" />
              <span><strong>Keys:</strong> Left / Right or A / D, Space to Pause / Launch</span>
            </div>
          </div>

          {/* RESET RECORD */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/20 border border-red-500/20">
            <div className="text-xs text-slate-400">Reset Local Record</div>
            <button
              id="btn-reset-high-score"
              onClick={() => {
                if (window.confirm('Reset your saved high score?')) {
                  audioSystem.playButtonClick();
                  onResetHighScore();
                }
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-bold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Done Button */}
        <button
          id="btn-settings-done"
          onClick={() => {
            audioSystem.playButtonClick();
            onClose();
          }}
          className="mt-4 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-md active:scale-[0.99]"
        >
          Done
        </button>
      </div>
    </div>
  );
};
