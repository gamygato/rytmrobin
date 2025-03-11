// Implement this file first - it's the core of the application
// eslint-disable-next-line no-unused-vars
import { Pattern, Cyclist } from '@strudel.cycles/core';
// eslint-disable-next-line no-unused-vars
import { samplePlayer } from '@strudel.cycles/webaudio';
// eslint-disable-next-line no-unused-vars
import { parsePattern } from './patternParser';
// Remove import to prevent circular dependency
// import { getSample, playSample } from './sampleManager';
import * as Tone from 'tone';
import { debug } from '../utils/debug';
// eslint-disable-next-line no-unused-vars
import { getAvailableSamples, playSample } from './sampleManager';

// Debug mode for the audio engine
const DEBUG_MODE = false;

// Set up persistent audio objects
// eslint-disable-next-line no-unused-vars
let audioEngine = null;
export let audioContext = null;

// Track channel nodes for connecting effects
const trackChannels = {};

// We'll use a variable to store the playSample function once it's loaded
let playSampleFn = null;

// Load the playSample function dynamically to avoid circular dependency
const loadPlaySampleFn = async () => {
  if (!playSampleFn) {
    try {
      const module = await import('./sampleManager');
      playSampleFn = module.playSample;
      debug('AudioEngine', 'Successfully loaded playSample function');
    } catch (err) {
      console.error('Failed to load playSample function:', err);
    }
  }
  return playSampleFn;
};

// Helper function to play a sample by name using the dynamically loaded function
export const playSampleByName = async (name, trackIndex) => {
  const fn = await loadPlaySampleFn();
  if (fn) {
    // If a track index is provided, and we have a channel for that track, use it
    if (trackIndex !== undefined && trackChannels[trackIndex]) {
      debug('PlaySample', `Playing ${name} through track channel ${trackIndex}`);
      return fn(name, trackChannels[trackIndex]);
    } else {
      // Otherwise play directly to the main output
      return fn(name);
    }
  } else {
    console.error('Cannot play sample, playSample function not loaded');
    return Promise.reject(new Error('playSample function not loaded'));
  }
};

// Try to initialize the Web Audio API
try {
  debug('AudioEngine', 'Attempting to create audio context');
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (AudioContext) {
    audioContext = new AudioContext();
    // Expose audioContext to window to avoid circular dependencies
    window.polyRythmRobinAudioContext = audioContext;
    debug('AudioEngine', "Audio context created successfully", audioContext.state);
  }
} catch (e) {
  console.error('Web Audio API is not supported in this browser', e);
}

// Configuration
const config = {
  numTracks: 8,
  maxSamplesPerTrack: 4,
  defaultBPM: 120
};

// Track state management
export const tracks = Array(config.numTracks).fill().map(() => ({
  samples: [], // Array to hold up to 4 samples per track
  currentSampleIndex: 0, // For round-robin playback
  pattern: "0 1", // Default pattern (can be edited per track)
  volume: 1,
  mute: false,
  division: 16 // Similar to the PD patch's knob1 control
}));

let activePatterns = [];
// Always start as initialized to avoid blocking UI
let isInitialized = false;
// eslint-disable-next-line no-unused-vars
let currentBPM = config.defaultBPM;
let strudelInstance = null;

// Set up a mock Strudel instance right away
strudelInstance = {
  start: () => debug("Mock Strudel start called"),
  stop: () => debug("Mock Strudel stop called"),
  setTempo: (bpm) => debug("Mock Strudel setTempo called with", bpm)
};

// Initialize the Strudel engine
export const initAudioEngine = async () => {
  debug('AudioEngine', "initAudioEngine called");
  
  // If already initialized, just return true
  if (isInitialized) {
    debug('AudioEngine', "Audio engine already initialized, returning true");
    return true;
  }
  
  try {
    // Ensure audio context is active
    if (audioContext) {
      debug('AudioEngine', "Audio context exists, checking state:", audioContext.state);
      
      // Resume audio context if suspended
      if (audioContext.state === 'suspended') {
        debug('AudioEngine', "Attempting to resume suspended audio context");
        try {
          await audioContext.resume();
          debug('AudioEngine', "Audio context resumed successfully:", audioContext.state);
        } catch (resumeError) {
          console.error("Error resuming audio context:", resumeError);
          // Continue even if resuming fails
        }
      }
      
      debug('AudioEngine', "Audio context ready:", audioContext.state);
    }
    
    // Set initialized state
    isInitialized = true;
    
    debug('AudioEngine', "Audio engine initialization completed");
    return true;
  } catch (err) {
    console.error("Error initializing audio engine:", err);
    debug('AudioEngine', "Returning true despite error to avoid blocking the UI");
    // We still return true to avoid blocking the UI
    return true;
  }
};

// Play an audio buffer
export const playBuffer = (buffer) => {
  if (!audioContext) {
    debug('AudioEngine', "Cannot play buffer: no audio context");
    return;
  }
  
  try {
    debug('AudioEngine', "Creating buffer source for playback");
    
    // Validate that we have a buffer
    if (!buffer) {
      console.error("No buffer provided to playBuffer");
      return;
    }
    
    // Check if it's a Tone.js buffer (which would be an object with get() method)
    if (buffer.get && typeof buffer.get === 'function') {
      debug('AudioEngine', "Detected Tone.js buffer, extracting AudioBuffer");
      buffer = buffer.get();
    }
    
    // Final validation for AudioBuffer type
    if (!(buffer instanceof AudioBuffer)) {
      console.error("Invalid audio buffer type:", buffer);
      // Try Tone.js as fallback
      try {
        const tonePlayer = new Tone.Player(buffer).toDestination();
        tonePlayer.start();
        debug('AudioEngine', "Falling back to Tone.js for playback");
        return;
      } catch (e) {
        console.error("Tone.js fallback failed too:", e);
        return;
      }
    }
    
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start();
    debug('AudioEngine', `Buffer playback started: duration=${buffer.duration}s, channels=${buffer.numberOfChannels}`);
  } catch (error) {
    console.error("Error playing buffer:", error);
    
    // Try Tone.js as fallback if there's an error
    try {
      const tonePlayer = new Tone.Player(buffer).toDestination();
      tonePlayer.start();
      debug('AudioEngine', "Recovered with Tone.js for playback after error");
    } catch (e) {
      console.error("Tone.js fallback failed too:", e);
    }
  }
};

// Add a sample to a track
export const addSampleToTrack = (trackIndex, sampleUrl) => {
  debug('AudioEngine', `addSampleToTrack called: track=${trackIndex}, sample=${sampleUrl}`);
  
  // Ensure the track exists
  while (tracks.length <= trackIndex) {
    tracks.push({ samples: [], pattern: "0", mute: false, volume: 0.8, currentSampleIndex: 0 });
  }
  
  // Add the sample to the track
  tracks[trackIndex].samples.push(sampleUrl);
  debug('AudioEngine', `Added sample ${sampleUrl} to track ${trackIndex}`);
  
  return tracks[trackIndex];
};

// Implement the round-robin playback logic
export const advanceTrackSample = (trackIndex) => {
  const track = tracks[trackIndex];
  
  // Make sure the track exists and has samples
  if (!track || track.samples.length === 0) {
    debug(`Track ${trackIndex} has no samples, cannot advance`);
    return;
  }
  
  if (track.samples.length > 1) {
    const oldIndex = track.currentSampleIndex;
    track.currentSampleIndex = (track.currentSampleIndex + 1) % track.samples.length;
    debug(`Track ${trackIndex} advanced from sample ${oldIndex} to ${track.currentSampleIndex}`);
  } else {
    // If there's only one sample, make sure index is 0
    track.currentSampleIndex = 0;
  }
};

// Pattern control functions
export const setTrackPattern = (trackIndex, pattern) => {
  debug(`Setting pattern for track ${trackIndex}: "${pattern}"`);
  tracks[trackIndex].pattern = pattern;
  
  // Update the strudel pattern if we're already playing
  if (activePatterns.length > 0) {
    stopPlayback();
    startPlayback();
  }
};

// Set track volume
export const setTrackVolume = (trackIndex, volume) => {
  debug(`Setting volume for track ${trackIndex}: ${volume}`);
  tracks[trackIndex].volume = volume;
  
  // Update if playing
  if (activePatterns.length > 0) {
    stopPlayback();
    startPlayback();
  }
};

// Toggle mute for a track
export const toggleTrackMute = (trackIndex) => {
  tracks[trackIndex].mute = !tracks[trackIndex].mute;
  debug(`Track ${trackIndex} mute set to: ${tracks[trackIndex].mute}`);
  
  // Update if playing
  if (activePatterns.length > 0) {
    stopPlayback();
    startPlayback();
  }
};

// Transport controls
export const setBPM = (bpm) => {
  debug(`Setting BPM to ${bpm}`);
  currentBPM = bpm;
  
  if (strudelInstance && typeof strudelInstance.setTempo === 'function') {
    strudelInstance.setTempo(bpm);
  }
  
  // Update metronome if it's running
  if (metronomeInterval) {
    stopPlayback();
    startPlayback();
  }
};

// Add this function to update track division
export const updateTrackDivision = (trackIndex, division) => {
  debug('AudioEngine', `Setting division for track ${trackIndex} to ${division}`);
  
  if (tracks[trackIndex]) {
    tracks[trackIndex].division = division;
    return true;
  }
  
  return false;
};

// Now modify the shouldTriggerPattern function to use track-specific division
function shouldTriggerPattern(pattern, currentBeat, division = 16) {
  try {
    // If pattern is empty, never trigger
    if (!pattern) {
      return false;
    }
    
    // Make sure pattern is a string before trying to trim it
    if (typeof pattern !== 'string') {
      // If it's not a string but is an array, we'll handle it in parsePattern
      if (!Array.isArray(pattern)) {
        console.error('Pattern is not a string or array:', pattern);
        return false;
      }
    } else if (pattern.trim() === '') {
      return false;
    }
    
    // Convert current beat position to a value between 0 and 4 (one bar)
    // IMPORTANT: Use the track-specific division passed as parameter
    const beatInBar = (currentBeat / division) * 4;
    
    // Parse the pattern string into an array of beat positions
    const beatPositions = parsePattern(pattern);
    
    // Check if the current beat position is in the pattern
    for (const pos of beatPositions) {
      // Allow for some rounding error
      if (Math.abs(beatInBar % 4 - pos % 4) < 0.05) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    debug("Error in shouldTriggerPattern:", error);
    return false;
  }
}

export const startPlayback = () => {
  debug("startPlayback called, isInitialized =", isInitialized);
  
  // Make sure audio context is running
  if (audioContext && audioContext.state === 'suspended') {
    debug("Resuming audio context before playback");
    audioContext.resume().catch(error => {
      console.error("Error resuming audio context:", error);
    });
  }
  
  debug("Starting playback");
  
  // Make sure all tracks with samples have patterns
  const validTracks = tracks.filter(track => track.samples.length > 0);
  debug(`${validTracks.length} tracks with samples`);
  
  // For now, we'll use a simpler way to handle patterns for testing
  activePatterns = validTracks.map((track, index) => {
    debug(`Creating simple pattern for track ${index}`);
    return { track, index };
  });
  
  // Start the metronome using browser audio
  startMetronome();
  
  // Start the strudel instance if it exists
  if (strudelInstance && typeof strudelInstance.start === 'function') {
    debug(`Starting playback with ${activePatterns.length} active patterns`);
    strudelInstance.start();
  } else {
    debug("Using mock playback mode");
  }
  
  return true; // Always return success
};

// Simple metronome function using browser audio
let metronomeInterval = null;
let currentTick = 0;

// And update the metronome function to use track-specific division
function startMetronome() {
  if (metronomeInterval) {
    clearInterval(metronomeInterval);
  }
  
  debug("Starting metronome");
  currentTick = 0;
  
  metronomeInterval = setInterval(() => {
    const beat = currentTick % 16; // We'll keep using 16 as the master division
    debug(`Metronome tick ${currentTick}, beat ${beat}`);
    
    // Check if any track should be triggered on this beat
    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      
      // Skip empty or muted tracks
      if (track.samples.length === 0 || track.mute) {
        continue;
      }
      
      // IMPORTANT: Pass the track-specific division to shouldTriggerPattern
      // Check if this track should trigger on this beat using its own division
      if (shouldTriggerPattern(track.pattern, beat, track.division || 16)) {
        debug(`Track ${i} triggered on beat ${beat} (division: ${track.division || 16})`);
        
        // Get the current sample
        const sampleName = track.samples[track.currentSampleIndex];
        if (sampleName) {
          // Play the sample
          debug(`Playing sample ${sampleName} from track ${i}`);
          playSampleByName(sampleName, i);
          
          // Advance to the next sample for this track
          advanceTrackSample(i);
        }
      }
    }
    
    // Play a short beep for the metronome on quarter notes (every 4 ticks)
    if (beat % 4 === 0 && audioContext) {
      try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.frequency.value = 880;
        gainNode.gain.value = 0.05; // Lower volume for metronome clicks
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.05);
      } catch (error) {
        debug("Error playing metronome tick:", error);
      }
    }
    
    currentTick++;
  }, (60000 / currentBPM) / 4); // Keep using quarter notes as the base tick rate
}

export const stopPlayback = () => {
  debug("stopPlayback called");
  
  if (strudelInstance && typeof strudelInstance.stop === 'function') {
    strudelInstance.stop();
  }
  
  // Stop the metronome
  if (metronomeInterval) {
    clearInterval(metronomeInterval);
    metronomeInterval = null;
  }
  
  activePatterns = [];
  debug("Playback stopped, active patterns cleared");
};

// eslint-disable-next-line no-unused-vars
const createTrackPattern = (track, trackIndex) => {
  // This is a simplified version for testing
  debug(`Creating pattern for track ${trackIndex}`);
  
  // Skip if track has no samples
  if (track.samples.length === 0) {
    debug(`Track ${trackIndex} has no samples, skipping`);
    return null;
  }
  
  // For testing, just return a simple object
  return {
    sample: track.samples[track.currentSampleIndex],
    volume: track.mute ? 0 : track.volume,
    onTrigger: () => advanceTrackSample(trackIndex)
  };
};

// Add this new function to update track samples in the audio engine
export const updateTrackSamples = (trackIndex, samplesList) => {
  debug('AudioEngine', `Updating samples for track ${trackIndex}`, samplesList);
  
  // Update the track's samples list directly
  if (tracks[trackIndex]) {
    tracks[trackIndex].samples = [...samplesList];
    
    // Reset the current sample index if needed
    if (tracks[trackIndex].currentSampleIndex >= samplesList.length) {
      tracks[trackIndex].currentSampleIndex = Math.max(0, samplesList.length - 1);
    }
    
    debug('AudioEngine', `Track ${trackIndex} samples updated, now has ${samplesList.length} samples`);
    
    // If playing, we need to handle any current playback
    if (metronomeInterval) {
      // If track has no samples left, make sure any current playback is stopped
      if (samplesList.length === 0) {
        debug('AudioEngine', `Track ${trackIndex} now has no samples, ensuring playback is stopped`);
        // Silence any currently playing sounds for this track (if we have a dedicated channel)
        if (trackChannels[trackIndex]) {
          // Temporarily mute the channel to silence current sounds
          trackChannels[trackIndex].mute = true;
          // Reset after a short delay
          setTimeout(() => {
            trackChannels[trackIndex].mute = false;
          }, 50);
        }
      }
    }
    
    return true;
  }
  
  debug('AudioEngine', `Failed to update samples for track ${trackIndex}: track not found`);
  return false;
};

// Add this function to clean up track resources
export const cleanupTrackResources = (trackIndex) => {
  debug('AudioEngine', `Cleaning up resources for track ${trackIndex}`);
  
  // Dispose of any effects associated with this track
  if (trackChannels[trackIndex]) {
    debug('AudioEngine', `Disposing channel for track ${trackIndex}`);
    
    // Disconnect the channel
    trackChannels[trackIndex].disconnect();
    
    // If using Tone.js, we can properly dispose
    if (typeof trackChannels[trackIndex].dispose === 'function') {
      trackChannels[trackIndex].dispose();
    }
    
    // Remove the channel reference
    delete trackChannels[trackIndex];
  }
};

// Add this new function to apply effects to tracks
export const applyTrackEffect = async (trackIndex, effectType, params = {}) => {
  debug('AudioEngine', `Applying ${effectType} effect to track ${trackIndex}`, params);
  
  // Remove any existing effect for this track
  if (trackChannels[trackIndex] && trackChannels[trackIndex].__effect) {
    try {
      trackChannels[trackIndex].__effect.disconnect();
      if (typeof trackChannels[trackIndex].__effect.dispose === 'function') {
        trackChannels[trackIndex].__effect.dispose();
      }
      delete trackChannels[trackIndex].__effect;
      debug('AudioEngine', `Removed existing effect for track ${trackIndex}`);
    } catch (err) {
      console.error(`Error removing existing effect for track ${trackIndex}:`, err);
    }
  }
  
  // Ensure we have a channel for this track
  if (!trackChannels[trackIndex]) {
    // Create a new channel for this track with volume control
    trackChannels[trackIndex] = new Tone.Channel({
      volume: 0,
      pan: 0, 
      mute: false
    }).toDestination();
    debug('AudioEngine', `Created new channel for track ${trackIndex}`);
  }
  
  // If effect type is "none", just connect the channel directly to output
  if (effectType === 'none' || !effectType) {
    trackChannels[trackIndex].disconnect();
    trackChannels[trackIndex].toDestination();
    debug('AudioEngine', `No effect for track ${trackIndex}, using direct connection`);
    return true;
  }
  
  // Extract parameters with defaults
  const amount = params.amount !== undefined ? params.amount : 0.5;
  const wetDry = params.wetDry !== undefined ? params.wetDry : 0.5;
  
  // Create the new effect
  let effect;
  
  switch (effectType) {
    case 'delay':
      const delayTime = params.delayTime !== undefined ? params.delayTime : 0.25;
      const feedback = params.feedback !== undefined ? params.feedback : 0.5;
      
      effect = new Tone.FeedbackDelay({
        delayTime: delayTime,
        feedback: feedback,
        wet: wetDry,
        maxDelay: 1
      });
      debug('AudioEngine', `Created delay effect: time=${delayTime}, feedback=${feedback}, wet=${wetDry}`);
      break;
      
    case 'reverb':
      const decayTime = params.decay !== undefined ? params.decay * 5 : 2.5;
      
      effect = new Tone.Reverb({
        decay: decayTime,
        wet: wetDry,
        preDelay: 0.01
      });
      await effect.generate(); // Need to wait for reverb to generate its IR
      debug('AudioEngine', `Created reverb effect: decay=${decayTime}, wet=${wetDry}`);
      break;
      
    case 'distortion':
      const distortionAmount = params.distortion !== undefined ? params.distortion : amount;
      
      effect = new Tone.Distortion({
        distortion: distortionAmount,
        wet: wetDry,
        oversample: "4x" // Higher quality
      });
      debug('AudioEngine', `Created distortion effect: amount=${distortionAmount}, wet=${wetDry}`);
      break;
      
    case 'lowpass':
      const lpFrequency = params.frequency !== undefined 
        ? 100 + (params.frequency * 15000) 
        : 500 + (amount * 10000);
      const lpQ = params.q !== undefined ? params.q * 10 : 1;
      
      effect = new Tone.Filter({
        type: 'lowpass',
        frequency: lpFrequency,
        Q: lpQ
      });
      debug('AudioEngine', `Created lowpass filter: freq=${lpFrequency}, Q=${lpQ}`);
      break;
      
    case 'highpass':
      const hpFrequency = params.frequency !== undefined 
        ? 20 + (params.frequency * 10000) 
        : amount * 5000;
      const hpQ = params.q !== undefined ? params.q * 10 : 1;
      
      effect = new Tone.Filter({
        type: 'highpass',
        frequency: hpFrequency,
        Q: hpQ
      });
      debug('AudioEngine', `Created highpass filter: freq=${hpFrequency}, Q=${hpQ}`);
      break;
      
    case 'chorus':
      const depth = params.depth !== undefined ? params.depth : 0.7;
      const chorusRate = params.rate !== undefined ? params.rate : 4;
      
      effect = new Tone.Chorus({
        frequency: chorusRate,
        delayTime: 4,
        depth: depth,
        wet: wetDry
      }).start(); // Chorus needs to be started
      debug('AudioEngine', `Created chorus effect: depth=${depth}, rate=${chorusRate}, wet=${wetDry}`);
      break;
      
    case 'phaser':
      const phaserRate = params.rate !== undefined ? params.rate * 10 : 0.5;
      const phaserDepth = params.depth !== undefined ? params.depth : 0.6;
      
      effect = new Tone.Phaser({
        frequency: phaserRate,
        octaves: 3,
        baseFrequency: 1000,
        depth: phaserDepth,
        wet: wetDry
      });
      debug('AudioEngine', `Created phaser effect: rate=${phaserRate}, depth=${phaserDepth}, wet=${wetDry}`);
      break;
      
    default:
      debug('AudioEngine', `Unknown effect type: ${effectType}, using direct connection`);
      trackChannels[trackIndex].disconnect();
      trackChannels[trackIndex].toDestination();
      return true;
  }
  
  // Store the effect on the channel for later cleanup
  trackChannels[trackIndex].__effect = effect;
  
  // IMPORTANT: Create proper chain to ensure effect is heard
  // First disconnect existing connections
  trackChannels[trackIndex].disconnect();
  
  // Connect properly - channel -> effect -> destination
  trackChannels[trackIndex].chain(effect, Tone.Destination);
  
  debug('AudioEngine', `Connected effect ${effectType} for track ${trackIndex} to audio chain`);
  
  // Return success
  return true;
};

class AudioEngine {
  constructor() {
    this.initialized = false;
    this.isPlaying = false;
    this.bpm = 120;
    this.metronomeEnabled = true;
    this.metronomeVolume = 0.5;
    
    this.tracks = [];
    this.samples = {};
    this.sampleBuffers = {};
    this.effects = {};
    
    // Round-robin state for each track
    this.roundRobinState = {};
    this.stepIndex = 0;
    
    // We'll use these to track which tracks are triggered on each beat
    this.triggeredTracks = new Set();
    
    // Create a master output with limiter to prevent clipping
    this.masterLimiter = new Tone.Limiter(-3).toDestination();
    this.masterVolume = new Tone.Volume(-6).connect(this.masterLimiter);
    
    // Create a metronome click
    this.metronomeClick = new Tone.MembraneSynth({
      envelope: {
        attack: 0.001,
        decay: 0.1,
        sustain: 0,
        release: 0.1
      },
      octaves: 4,
      pitchDecay: 0.1,
      volume: -10
    }).connect(this.masterVolume);
    
    // For testing samples
    this.testPlayer = new Tone.Player().connect(this.masterVolume);
  }
  
  // Initialize the audio engine
  async init() {
    try {
      debug('init', 'Initializing audio engine...');
      await Tone.start();
      debug('init', 'Tone.js audio context started successfully');
      Tone.Transport.bpm.value = this.bpm;
      
      // Create a looping callback that runs on each 16th note
      this.scheduleRepeat = Tone.Transport.scheduleRepeat((time) => {
        this.onBeat(time);
      }, '16n');
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize audio engine:', error);
      this.initialized = false;
      throw error;
    }
  }
  
  // Load a sample into the engine
  async loadSample(name, url) {
    if (!this.initialized) {
      throw new Error("Audio engine not initialized");
    }
    
    try {
      debug('loadSample', `Loading sample ${name} from ${url}`);
      
      // If we already have this sample, just return it
      if (this.samples[name]) {
        debug('loadSample', `Sample ${name} already loaded`);
        return name;
      }
      
      // Create a new buffer for the sample
      const buffer = new Tone.Buffer();
      await buffer.load(url);
      
      // Store the buffer
      this.sampleBuffers[name] = buffer;
      
      // Create a player for the sample
      const player = new Tone.Player({
        url: url,
        loop: false,
        volume: 0
      }).connect(this.masterVolume);
      
      // Store the player
      this.samples[name] = player;
      
      debug('loadSample', `Sample ${name} loaded successfully`);
      return name;
    } catch (error) {
      console.error(`Failed to load sample ${name}:`, error);
      throw error;
    }
  }
  
  // Set the tracks to be played
  setTracks(tracks) {
    this.tracks = tracks.map(track => ({
      ...track,
      lastTriggered: 0
    }));
    
    // Initialize round-robin state for each track
    tracks.forEach((_, index) => {
      if (!this.roundRobinState[index]) {
        this.roundRobinState[index] = {
          currentIndex: 0
        };
      }
    });
    
    debug('setTracks', `Set ${tracks.length} tracks`);
  }
  
  // Start or stop playback
  togglePlayback() {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.play();
    }
    return this.isPlaying;
  }
  
  // Start playback
  play() {
    if (!this.initialized) {
      throw new Error("Audio engine not initialized");
    }
    
    debug('play', 'Starting playback');
    this.stepIndex = 0;
    Tone.Transport.start();
    this.isPlaying = true;
  }
  
  // Stop playback
  stop() {
    if (!this.initialized) {
      throw new Error("Audio engine not initialized");
    }
    
    debug('stop', 'Stopping playback');
    Tone.Transport.stop();
    this.isPlaying = false;
    
    // Clear any triggered tracks
    this.triggeredTracks.clear();
  }
  
  // Set the BPM
  setBPM(bpm) {
    if (!this.initialized) {
      throw new Error("Audio engine not initialized");
    }
    
    this.bpm = bpm;
    Tone.Transport.bpm.value = bpm;
    debug('setBPM', `Set BPM to ${bpm}`);
  }
  
  // Enable or disable the metronome
  setMetronome(enabled, volume = 0.5) {
    this.metronomeEnabled = enabled;
    this.metronomeVolume = volume;
    debug('setMetronome', `Metronome ${enabled ? 'enabled' : 'disabled'}, volume: ${volume}`);
  }
  
  // Check if a specific beat should trigger a pattern
  shouldTriggerPattern(beatPosition, pattern) {
    if (!pattern) return false;
    
    // Parse the pattern string into an array of beat positions
    const beatPositions = parsePattern(pattern);
    
    if (beatPositions.length === 0) return false;
    
    // Normalize beatPosition to the range of 0-4 (one bar)
    // Beat position needs to account for which beat in the bar we're on (0-3)
    // plus the fraction of the beat (0-1)
    const beatsPerBar = 4; // Standard 4/4 time
    
    // Check if the current beat position is in the pattern
    return beatPositions.some(pos => {
      // Both position should be in range 0-4 for a full bar
      // Use modulo to handle cases where the pattern has values > 4
      const patternPos = pos % beatsPerBar;
      const currentPos = beatPosition % beatsPerBar;
      
      // Allow for some flexibility in timing (within 0.05 beats)
      const diff = Math.abs(currentPos - patternPos);
      // Check both for direct match and for wrapping around the bar
      const isMatch = diff < 0.05 || beatsPerBar - diff < 0.05;
      
      if (isMatch && DEBUG_MODE) {
        debug('AudioEngine', `Pattern hit: Position ${currentPos.toFixed(2)} matches pattern position ${patternPos.toFixed(2)}`);
      }
      
      return isMatch;
    });
  }
  
  // Callback that runs on each beat
  onBeat(time) {
    if (!this.initialized || !this.isPlaying) return;
    
    // Current position in beats (Tone.js format: "bars:beats:sixteenths")
    const positionInBeats = Tone.Transport.position;
    const [bars, beats, sixteenths] = positionInBeats.split(':').map(Number);
    
    // Calculate the beat position within the bar (0-4 range)
    // For example, beat 2 with sixteenth 2 (0.5) would be position 2.5
    const beatPosition = beats + (sixteenths / 4);
    
    // For debugging
    if (DEBUG_MODE && sixteenths === 0) {
      debug('AudioEngine', `Beat ${beats} of bar ${bars} (position ${beatPosition})`);
    }
    
    // Increment the step index for the metronome
    this.stepIndex = (this.stepIndex + 1) % 16;
    
    // Play the metronome click on each quarter note
    if (this.metronomeEnabled && sixteenths === 0) {
      // Louder click on the 1
      const velocity = beats === 0 ? 0.7 : 0.3;
      const note = beats === 0 ? 'C2' : 'C3';
      this.metronomeClick.triggerAttackRelease(note, '16n', time, velocity * this.metronomeVolume);
    }
    
    // Clear the triggered tracks set at the start of each bar
    if (beats === 0 && sixteenths === 0) {
      this.triggeredTracks.clear();
    }
    
    // Check and play each track
    this.tracks.forEach((track, index) => {
      if (!track || track.mute || track.samples.length === 0) return;
      
      // Use the same beat position within the bar
      // Check if this track should be triggered on this beat
      if (this.shouldTriggerPattern(beatPosition, track.pattern)) {
        // Mark this track as triggered
        this.triggeredTracks.add(index);
        
        // Get the current sample for this track
        const sampleIndex = this.getNextSampleIndex(index, track);
        const sampleName = track.samples[sampleIndex];
        
        if (sampleName) {
          debug('AudioEngine', `Triggering sample ${sampleName} on track ${index} at beat ${beatPosition}`);
          
          // Set volume adjustment based on track settings
          Tone.getContext().volume.value = Tone.gainToDb(track.volume || 0.8);
          
          // Use the helper function to play the sample
          playSampleByName(sampleName, index).catch(err => {
            console.warn(`Error playing sample ${sampleName} during beat:`, err);
          });
          
          // Update the track state to show it's triggered
          track.lastTriggered = Date.now();
        }
      }
    });
  }
  
  // Get the next sample to play using round-robin logic
  getNextSampleIndex(trackIndex, track) {
    if (!track || track.samples.length === 0) return 0;
    
    // If there's only one sample, always use it
    if (track.samples.length === 1) return 0;
    
    // Get the current state for this track
    const state = this.roundRobinState[trackIndex] || { currentIndex: 0 };
    
    // Get the current index
    const currentIndex = state.currentIndex;
    
    // Update the index for next time
    state.currentIndex = (currentIndex + 1) % track.samples.length;
    
    // Update the state
    this.roundRobinState[trackIndex] = state;
    
    return currentIndex;
  }
  
  // Test playing a specific sample
  testSample(sampleName) {
    if (!this.initialized) {
      throw new Error("Audio engine not initialized");
    }
    
    if (!this.samples[sampleName]) {
      throw new Error(`Sample ${sampleName} not loaded`);
    }
    
    debug('testSample', `Testing sample ${sampleName}`);
    
    // Use the test player to avoid interfering with ongoing playback
    this.testPlayer.buffer = this.sampleBuffers[sampleName];
    this.testPlayer.start();
  }
  
  // Check if the engine has been triggered recently
  isTrackTriggered(trackIndex) {
    return this.triggeredTracks.has(trackIndex);
  }
  
  // Apply an effect to a track - completely rewritten for better effect handling
  async applyEffect(trackIndex, effectType, params = {}) {
    if (!this.initialized) {
      throw new Error("Audio engine not initialized");
    }
    
    debug('applyEffect', `Applying ${effectType} effect to track ${trackIndex}`, params);
    
    // Remove any existing effect
    if (this.effects[trackIndex]) {
      try {
        this.effects[trackIndex].disconnect();
        if (typeof this.effects[trackIndex].dispose === 'function') {
          this.effects[trackIndex].dispose();
        }
        delete this.effects[trackIndex];
        debug('applyEffect', `Removed existing effect for track ${trackIndex}`);
      } catch (err) {
        console.error(`Error removing existing effect for track ${trackIndex}:`, err);
      }
    }
    
    // Ensure we have a channel for this track
    if (!trackChannels[trackIndex]) {
      // Create a new channel for this track with volume control
      trackChannels[trackIndex] = new Tone.Channel({
        volume: 0,
        pan: 0,
        mute: false
      }).toDestination();
      debug('applyEffect', `Created new channel for track ${trackIndex}`);
    }
    
    // If effect type is "none", just connect the channel directly to output
    if (effectType === 'none' || !effectType) {
      trackChannels[trackIndex].disconnect();
      trackChannels[trackIndex].toDestination();
      debug('applyEffect', `No effect for track ${trackIndex}, using direct connection`);
      return true;
    }
    
    // Extract parameters with defaults
    const amount = params.amount !== undefined ? params.amount : 0.5;
    const wetDry = params.wetDry !== undefined ? params.wetDry : 0.5;
    
    // Create the new effect
    let effect;
    
    switch (effectType) {
      case 'delay':
        const delayTime = params.delayTime !== undefined ? params.delayTime : 0.25;
        const feedback = params.feedback !== undefined ? params.feedback : 0.5;
        
        effect = new Tone.FeedbackDelay({
          delayTime: delayTime,
          feedback: feedback,
          wet: wetDry,
          maxDelay: 1
        });
        debug('applyEffect', `Created delay effect: time=${delayTime}, feedback=${feedback}, wet=${wetDry}`);
        break;
        
      case 'reverb':
        const decayTime = params.decay !== undefined ? params.decay * 5 : 2.5;
        
        effect = new Tone.Reverb({
          decay: decayTime,
          wet: wetDry,
          preDelay: 0.01
        });
        await effect.generate(); // Need to wait for reverb to generate its IR
        debug('applyEffect', `Created reverb effect: decay=${decayTime}, wet=${wetDry}`);
        break;
        
      case 'distortion':
        const distortionAmount = params.distortion !== undefined ? params.distortion : amount;
        
        effect = new Tone.Distortion({
          distortion: distortionAmount,
          wet: wetDry,
          oversample: "4x" // Higher quality
        });
        debug('applyEffect', `Created distortion effect: amount=${distortionAmount}, wet=${wetDry}`);
        break;
        
      case 'lowpass':
        const lpFrequency = params.frequency !== undefined 
          ? 100 + (params.frequency * 15000) 
          : 500 + (amount * 10000);
        const lpQ = params.q !== undefined ? params.q * 10 : 1;
        
        effect = new Tone.Filter({
          type: 'lowpass',
          frequency: lpFrequency,
          Q: lpQ
        });
        debug('applyEffect', `Created lowpass filter: freq=${lpFrequency}, Q=${lpQ}`);
        break;
        
      case 'highpass':
        const hpFrequency = params.frequency !== undefined 
          ? 20 + (params.frequency * 10000) 
          : amount * 5000;
        const hpQ = params.q !== undefined ? params.q * 10 : 1;
        
        effect = new Tone.Filter({
          type: 'highpass',
          frequency: hpFrequency,
          Q: hpQ
        });
        debug('applyEffect', `Created highpass filter: freq=${hpFrequency}, Q=${hpQ}`);
        break;
        
      case 'chorus':
        const depth = params.depth !== undefined ? params.depth : 0.7;
        const chorusRate = params.rate !== undefined ? params.rate : 4;
        
        effect = new Tone.Chorus({
          frequency: chorusRate,
          delayTime: 4,
          depth: depth,
          wet: wetDry
        }).start(); // Chorus needs to be started
        debug('applyEffect', `Created chorus effect: depth=${depth}, rate=${chorusRate}, wet=${wetDry}`);
        break;
        
      case 'phaser':
        const phaserRate = params.rate !== undefined ? params.rate * 10 : 0.5;
        const phaserDepth = params.depth !== undefined ? params.depth : 0.6;
        
        effect = new Tone.Phaser({
          frequency: phaserRate,
          octaves: 3,
          baseFrequency: 1000,
          depth: phaserDepth,
          wet: wetDry
        });
        debug('applyEffect', `Created phaser effect: rate=${phaserRate}, depth=${phaserDepth}, wet=${wetDry}`);
        break;
        
      default:
        debug('applyEffect', `Unknown effect type: ${effectType}, using direct connection`);
        trackChannels[trackIndex].disconnect();
        trackChannels[trackIndex].toDestination();
        return true;
    }
    
    // Store the effect
    this.effects[trackIndex] = effect;
    
    // IMPORTANT: Create proper chain to ensure effect is heard
    // First disconnect existing connections
    trackChannels[trackIndex].disconnect();
    
    // Connect properly - channel -> effect -> destination
    trackChannels[trackIndex].chain(effect, Tone.Destination);
    
    debug('applyEffect', `Connected effect ${effectType} for track ${trackIndex} to audio chain`);
    
    // Return success
    return true;
  }
}

export default AudioEngine; 