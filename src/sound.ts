// Backward-compatible re-export bridging to the dedicated AudioSystem
import { audioSystem } from './audio/AudioSystem';

export { audioSystem, AudioSystem } from './audio/AudioSystem';
export const sounds = audioSystem;
