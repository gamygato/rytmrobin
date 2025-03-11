// A simplified audio engine for testing without Strudel dependencies

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

let isInitialized = false;
let currentBPM = config.defaultBPM;
let isPlaying = false;
let intervalId = null;

// Dummy initialization function
export const initAudioEngine = async () => {
  console.log("Initializing simple audio engine...");
  isInitialized = true;
  return true;
};

// Add a sample to a track
export const addSampleToTrack = (trackIndex, sampleUrl) => {
  if (tracks[trackIndex].samples.length < config.maxSamplesPerTrack) {
    tracks[trackIndex].samples.push(sampleUrl);
    return true;
  }
  return false;
};

// Implement the round-robin playback logic
export const advanceTrackSample = (trackIndex) => {
  const track = tracks[trackIndex];
  if (track.samples.length > 1) {
    track.currentSampleIndex = (track.currentSampleIndex + 1) % track.samples.length;
  }
};

// Pattern control functions
export const setTrackPattern = (trackIndex, pattern) => {
  tracks[trackIndex].pattern = pattern;
};

// Set track volume
export const setTrackVolume = (trackIndex, volume) => {
  tracks[trackIndex].volume = volume;
};

// Toggle mute for a track
export const toggleTrackMute = (trackIndex) => {
  tracks[trackIndex].mute = !tracks[trackIndex].mute;
};

// Transport controls
export const setBPM = (bpm) => {
  currentBPM = bpm;
  if (isPlaying) {
    stopPlayback();
    startPlayback();
  }
};

export const startPlayback = () => {
  if (!isInitialized) {
    console.error("Audio engine not initialized");
    return;
  }
  
  isPlaying = true;
  console.log("Playback started at", currentBPM, "BPM");
  
  // Simulate pattern playback with console logs
  if (!intervalId) {
    intervalId = setInterval(() => {
      console.log("Beat at", new Date().toLocaleTimeString());
      
      // Trigger any callbacks for animations, etc.
      if (typeof window._onBeatCallback === 'function') {
        window._onBeatCallback();
      }
    }, (60000 / currentBPM) / 4);
  }
};

export const stopPlayback = () => {
  isPlaying = false;
  console.log("Playback stopped");
  
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}; 