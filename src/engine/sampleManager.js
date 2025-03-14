// This file handles loading and managing audio samples
// Remove direct import to avoid circular dependency
import { debug } from '../utils/debug';
import * as Tone from 'tone';

// No need to define a debug function, we're importing it above

// Sample library
const sampleLibrary = {};

// Map of fallback synth sounds for each sample
const synthSounds = {};

// Base URL for samples
const SAMPLE_BASE_URL = './samples/';

// Flag to use Tone.js for all audio operations
// eslint-disable-next-line no-unused-vars
const USE_TONE_FALLBACK = true;

// Flag to always use synthetic sounds instead of samples
// Set to false to try real samples first with synthetic fallback
const USE_SYNTHETIC_SOUNDS = false;

// Get the audioContext from global window to avoid circular dependencies
const getAudioContext = () => {
  // Look for the exported audioContext from audioEngine
  // This will be available after audioEngine initializes
  if (window.polyRythmRobinAudioContext) {
    return window.polyRythmRobinAudioContext;
  }
  return null;
};

// Also avoid direct reference to playBuffer
// eslint-disable-next-line no-unused-vars
const playBufferFallback = (buffer) => {
  debug('SampleManager', 'Using fallback buffer player');
  try {
    const audioCtx = getAudioContext();
    if (!audioCtx) {
      console.error('No audio context available for playBufferFallback');
      return false;
    }
    
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.start();
    return true;
  } catch (e) {
    console.error('Error in playBufferFallback:', e);
    return false;
  }
};

// Helper function to copy an ArrayBuffer
const copyArrayBuffer = (arrayBuffer) => {
  // Create a new Uint8Array with the same length
  const copy = new Uint8Array(new ArrayBuffer(arrayBuffer.byteLength));
  // Copy the original data into the new buffer
  copy.set(new Uint8Array(arrayBuffer));
  // Return the buffer of the copy
  return copy.buffer;
};

// Try to resolve the correct path for a sample
const resolveSamplePath = (url) => {
  // If it's already an absolute URL, return it
  if (url.startsWith('http')) {
    return url;
  }
  
  // If it includes samples/ already, adjust path as needed
  if (url.includes('samples/')) {
    // Check if it's missing the leading slash
    if (!url.startsWith('/')) {
      return '/' + url;
    }
    return url;
  }
  
  // Otherwise, ensure it has the proper prefix
  if (url.startsWith('/')) {
    return SAMPLE_BASE_URL.replace('./', '') + url.substring(1);
  }
  
  return SAMPLE_BASE_URL + url;
};

// Try alternate file extensions if the original doesn't work
const getAlternateUrls = (url) => {
  const formats = ['wav', 'mp3', 'ogg', 'aiff', 'flac'];
  const basePath = url.substring(0, url.lastIndexOf('.') !== -1 ? url.lastIndexOf('.') : url.length);
  
  return formats.map(format => `${basePath}.${format}`);
};

// Create a synthetic sound for a sample
const createSyntheticSound = (name) => {
  // Already have a synthetic sound for this sample?
  if (synthSounds[name]) {
    return synthSounds[name];
  }
  
  debug('SampleManager', `Creating synthetic sound for ${name}`);
  
  // Generate parameters based on the sample name
  // This gives different samples different sounds
  const nameSum = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  
  // Pick synth type based on name
  let synthType = 'membrane';
  if (name.includes('kit') || name.includes('snare')) {
    synthType = 'membrane';
  } else if (name.includes('hihat') || name.includes('hat')) {
    synthType = 'metal';
  } else if (name.includes('bass') || name.includes('kick')) {
    synthType = 'bass';
  } else if (name.includes('sample')) {
    // Use the number in the sample name to distinguish sounds
    const match = name.match(/(\d+)/);
    const num = match ? parseInt(match[1]) : 0;
    
    if (num % 5 === 0) synthType = 'membrane';
    else if (num % 5 === 1) synthType = 'metal';
    else if (num % 5 === 2) synthType = 'bass';
    else if (num % 5 === 3) synthType = 'pluck';
    else synthType = 'tone';
  }
  
  // Store the synthetic sound parameters
  const synth = {
    type: synthType,
    pitch: 100 + (nameSum % 400),  // Range from 100-500 Hz
    duration: 0.1 + (nameSum % 10) / 40, // Range from 0.1-0.35s
    decay: 0.1 + (nameSum % 5) / 20,   // Range from 0.1-0.35s
    volume: 0.8
  };
  
  // Store for future use
  synthSounds[name] = synth;
  
  return synth;
};

// Play a synthetic sound
const playSyntheticSound = (name, destination) => {
  // Create a simple synthetic sound using Tone.js
  // We'll create different sounds based on the sample name
  
  // Get the base name without any numbering
  const baseName = name.replace(/\d+$/, '').toLowerCase();
  
  debug('SampleManager', `Creating synthetic sound for ${baseName}`);
  
  let synth;
  let note = 'C4';
  let duration = '16n';
  
  // Choose parameters based on the sample name
  if (baseName.includes('kick')) {
    synth = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 10,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.001,
        decay: 0.4,
        sustain: 0.01,
        release: 1.4,
        attackCurve: 'exponential'
      }
    });
    note = 'C1';
  } else if (baseName.includes('snare')) {
    synth = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: {
        attack: 0.001,
        decay: 0.2,
        sustain: 0
      }
    });
    duration = '16n';
  } else if (baseName.includes('hihat') || baseName.includes('hat')) {
    synth = new Tone.MetalSynth({
      frequency: 200,
      envelope: {
        attack: 0.001,
        decay: 0.1,
        release: 0.01
      }
    });
    
    // Closed or open hi-hat?
    if (baseName.includes('closed')) {
      duration = '32n';
    } else if (baseName.includes('open')) {
      duration = '8n';
    } else {
      duration = '16n';
    }
  } else if (baseName.includes('tom')) {
    synth = new Tone.MembraneSynth({
      pitchDecay: 0.1,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.001,
        decay: 0.2,
        sustain: 0.01,
        release: 0.2
      }
    });
    
    // Different tom sounds based on high/mid/low
    if (baseName.includes('high')) {
      note = 'G3';
    } else if (baseName.includes('mid')) {
      note = 'E3';
    } else {
      note = 'C2';
    }
  } else {
    // Default synth for unrecognized samples
    synth = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.001,
        decay: 0.1,
        sustain: 0.1,
        release: 0.1
      }
    });
  }
  
  // Connect to the provided destination or directly to the master output
  if (destination) {
    synth.connect(destination);
  } else {
    synth.toDestination();
  }
  
  // Play the sound
  if (synth instanceof Tone.NoiseSynth) {
    synth.triggerAttackRelease(duration);
  } else {
    synth.triggerAttackRelease(note, duration);
  }
  
  // Clean up when done
  setTimeout(() => {
    synth.dispose();
  }, 1000);
  
  return Promise.resolve(true);
};

// Load a sample into the library
export const loadSample = async (name, url) => {
  debug('SampleManager', `Loading sample ${name} from ${url}`);
  
  if (sampleLibrary[name]) {
    debug('SampleManager', `Sample ${name} already loaded`);
    return sampleLibrary[name];
  }
  
  // Create synthetic sound as fallback
  createSyntheticSound(name);
  
  // If we're using synthetic sounds only, don't even try to load the real sample
  if (USE_SYNTHETIC_SOUNDS) {
    debug('SampleManager', `Using synthetic sound for ${name} instead of loading sample`);
    sampleLibrary[name] = {
      synthetic: true,
      name,
      url
    };
    return sampleLibrary[name];
  }
  
  // Try to load the real sample
  try {
    const resolvedUrl = resolveSamplePath(url);
    debug('SampleManager', `Resolved sample path: ${resolvedUrl}`);
    
    // First try loading with Tone.js
    try {
      debug('SampleManager', `Loading ${name} with Tone.js`);
      const toneBuffer = new Tone.Buffer();
      await toneBuffer.load(resolvedUrl);
      
      // Store the Tone.js buffer
      sampleLibrary[name] = {
        buffer: toneBuffer.get(),
        toneBuffer: toneBuffer,
        url: resolvedUrl,
        decoded: true,
        toneFallback: true
      };
      
      debug('SampleManager', `Successfully loaded ${name} with Tone.js`);
      return sampleLibrary[name];
    } catch (toneError) {
      debug('SampleManager', `Tone.js failed to load sample ${name}, trying Web Audio API`);
      
      // Try alternate formats if this one failed
      const alternateUrls = getAlternateUrls(resolvedUrl);
      for (const altUrl of alternateUrls) {
        try {
          debug('SampleManager', `Trying alternate format: ${altUrl}`);
          const altToneBuffer = new Tone.Buffer();
          await altToneBuffer.load(altUrl);
          
          // Store the Tone.js buffer for the alternate format
          sampleLibrary[name] = {
            buffer: altToneBuffer.get(),
            toneBuffer: altToneBuffer,
            url: altUrl,
            decoded: true,
            toneFallback: true,
            alternateFormat: true
          };
          
          debug('SampleManager', `Successfully loaded ${name} with alternate format: ${altUrl}`);
          return sampleLibrary[name];
        } catch (altError) {
          // Continue to next format
        }
      }
      
      // Try Web Audio API as fallback
      try {
        // Fetch the sample data
        const response = await fetch(resolvedUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch sample: ${response.status} ${response.statusText}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const rawBufferCopy = copyArrayBuffer(arrayBuffer);
        
        // Try to decode the audio data
        if (getAudioContext()) {
          try {
            const audioBuffer = await getAudioContext().decodeAudioData(arrayBuffer);
            
            // Successfully decoded with Web Audio API
            sampleLibrary[name] = {
              buffer: audioBuffer,
              rawBuffer: rawBufferCopy,
              url: resolvedUrl,
              decoded: true
            };
            
            debug('SampleManager', `Sample ${name} decoded successfully with Web Audio API`);
            return sampleLibrary[name];
          } catch (decodeError) {
            throw new Error(`Failed to decode audio: ${decodeError.message}`);
          }
        } else {
          throw new Error('No audio context available');
        }
      } catch (fetchError) {
        throw new Error(`Failed to fetch or decode sample: ${fetchError.message}`);
      }
    }
  } catch (allError) {
    debug('SampleManager', `All methods failed to load sample ${name}: ${allError.message}`);
    
    // Create a synthetic fallback entry
    sampleLibrary[name] = {
      synthetic: true,
      name,
      url,
      error: allError.message
    };
    
    debug('SampleManager', `Created synthetic fallback for ${name}`);
    return sampleLibrary[name];
  }
};

// Preload default samples
export const preloadDefaultSamples = async () => {
  debug('SampleManager', 'Preloading default samples');
  
  // Use the numbered samples from 1 to 24
  const samples = [];
  
  // Add the numbered samples
  for (let i = 1; i <= 24; i++) {
    samples.push({
      name: `sample${i}`,
      url: `/samples/${i}.wav`,
      description: `Sample ${i}`
    });
  }
  
  // Add standard drum samples with better naming
  const drumSamples = [
    { name: 'kick', url: '/samples/bd.wav', description: 'Kick Drum' },
    { name: 'snare', url: '/samples/sd.wav', description: 'Snare Drum' },
    { name: 'hihat', url: '/samples/hh.wav', description: 'Hi-Hat' },
    { name: 'clap', url: '/samples/cp.wav', description: 'Clap' },
    { name: 'tom', url: '/samples/tom.wav', description: 'Tom Drum' },
    { name: 'rim', url: '/samples/rim.wav', description: 'Rim Shot' },
    { name: 'cowbell', url: '/samples/cowbell.wav', description: 'Cowbell' },
    { name: 'perc', url: '/samples/perc.wav', description: 'Percussion' }
  ];
  
  // Add the drum samples to our array
  samples.push(...drumSamples);
  
  debug('SampleManager', `Preloading ${samples.length} samples...`);
  
  // If we're using synthetic sounds only, pre-generate all synth sounds
  if (USE_SYNTHETIC_SOUNDS) {
    debug('SampleManager', 'Using synthetic sounds, pre-generating all synth parameters');
    samples.forEach(sample => {
      createSyntheticSound(sample.name);
      
      // Store a synthetic sample entry
      sampleLibrary[sample.name] = {
        synthetic: true,
        name: sample.name,
        url: sample.url,
        description: sample.description
      };
    });
    
    debug('SampleManager', `Generated synthetic sounds for ${samples.length} samples`);
    return true;
  }
  
  // Try to load each sample with fallbacks
  let loaded = 0;
  let synthetic = 0;
  let failed = 0;
  
  for (const sample of samples) {
    try {
      debug('SampleManager', `Loading sample ${sample.name} from ${sample.url}`);
      const result = await loadSample(sample.name, sample.url);
      
      if (result.synthetic) {
        debug('SampleManager', `Using synthetic for ${sample.name}`);
        synthetic++;
      } else if (result.toneFallback) {
        debug('SampleManager', `Using Tone.js for ${sample.name}`);
        loaded++;
      } else if (result.decoded) {
        debug('SampleManager', `Using WebAudio for ${sample.name}`);
        loaded++;
      } else {
        debug('SampleManager', `Sample ${sample.name} had issues: ${result.error || 'unknown error'}`);
        failed++;
      }
      
      // Add a small delay to prevent overloading
      await new Promise(resolve => setTimeout(resolve, 10));
    } catch (error) {
      console.warn(`Error loading sample ${sample.name}:`, error);
      failed++;
      
      // Ensure we have a synthetic fallback for this sample
      if (!sampleLibrary[sample.name]) {
        sampleLibrary[sample.name] = {
          synthetic: true,
          name: sample.name,
          url: sample.url,
          error: error.message
        };
        synthetic++;
      }
    }
  }
  
  // Summary of loading results
  const summary = {
    total: samples.length,
    real: loaded,
    synthetic: synthetic,
    failed: failed,
    success: loaded + synthetic
  };
  
  debug('SampleManager', `Sample loading complete: ${JSON.stringify(summary)}`);
  return loaded > 0 || synthetic > 0;
};

// Get a loaded sample
export const getSample = (name) => {
  return sampleLibrary[name];
};

// Play a sample directly
export const playSample = async (name, destination) => {
  debug('SampleManager', `Playing sample ${name}`);
  
  const sample = sampleLibrary[name];
  if (!sample) {
    console.warn(`Sample ${name} not found, using synthetic fallback`);
    return playSyntheticSound(name, destination);
  }
  
  // If it's a synthetic sample, play the synthetic version
  if (sample.synthetic) {
    debug('SampleManager', `Using synthetic sound for ${name}`);
    return playSyntheticSound(name, destination);
  }
  
  // If we're forcing synthetic sounds, use that
  if (USE_SYNTHETIC_SOUNDS) {
    debug('SampleManager', `Forcing synthetic sound for ${name}`);
    return playSyntheticSound(name, destination);
  }
  
  try {
    // Get the audio context - this must be available
    const audioCtx = getAudioContext();
    if (!audioCtx) {
      debug('SampleManager', 'No audio context available, falling back to synthetic sound');
      return playSyntheticSound(name, destination);
    }
    
    // Ensure audio context is running
    if (audioCtx.state === 'suspended') {
      try {
        debug('SampleManager', 'Resuming suspended audio context');
        await audioCtx.resume();
      } catch (resumeError) {
        console.warn('Error resuming audio context:', resumeError);
        // Continue anyway
      }
    }
    
    // Use Tone.js directly if available
    if (sample.toneFallback && sample.toneBuffer) {
      debug('SampleManager', `Playing sample ${name} with Tone.js`);
      
      // Verify the destination if provided
      let validDestination = true;
      if (destination) {
        try {
          // Check if destination has valid connect method
          validDestination = typeof destination.connect === 'function';
        } catch (e) {
          debug('SampleManager', `Invalid destination provided, will use default output: ${e.message}`);
          validDestination = false;
        }
      }
      
      try {
        // Create a player for the sample
        const player = new Tone.Player(sample.toneBuffer);
        
        // Connect to the provided destination or directly to the master output
        if (destination && validDestination) {
          player.connect(destination);
        } else {
          player.toDestination();
        }
        
        player.start();
        return Promise.resolve(true);
      } catch (toneError) {
        console.warn(`Error playing ${name} with Tone.js:`, toneError);
        // Try Web Audio API as fallback
      }
    }
    
    // Use Web Audio API if available
    if (sample.buffer) {
      try {
        debug('SampleManager', `Playing sample ${name} with Web Audio API`);
        const source = audioCtx.createBufferSource();
        source.buffer = sample.buffer;
        
        // Check if destination is valid
        let validDestination = true;
        if (destination) {
          try {
            // This will throw if the destination is invalid
            if (typeof destination.connect !== 'function') {
              validDestination = false;
            }
          } catch (e) {
            debug('SampleManager', `Invalid destination, will use default output: ${e.message}`);
            validDestination = false;
          }
        }
        
        // Connect to destination or default output
        if (destination && validDestination) {
          try {
            source.connect(destination);
          } catch (connectError) {
            debug('SampleManager', `Error connecting to destination, using default: ${connectError.message}`);
            source.connect(audioCtx.destination);
          }
        } else {
          source.connect(audioCtx.destination);
        }
        
        // Start the sound
        source.start(0);
        return Promise.resolve(true);
      } catch (e) {
        console.error(`Error playing sample ${name} with Web Audio API:`, e);
      }
    }
  } catch (error) {
    console.error(`Unexpected error playing sample ${name}:`, error);
  }
  
  // Fall back to synthetic if all else fails
  debug('SampleManager', `All methods failed, falling back to synthetic sound for ${name}`);
  return playSyntheticSound(name, destination);
};

// Test play all samples
export const testPlayAllSamples = () => {
  debug('SampleManager', 'Testing playback of all samples');
  
  const sampleNames = Object.keys(sampleLibrary);
  if (sampleNames.length === 0) {
    console.warn("No samples available to test");
    
    // Create and play some demo sounds anyway
    debug('SampleManager', 'Creating demo synthetic sounds');
    const demoSamples = [
      'sample1', 'sample2', 'sample3', 'sample4', 'sample5',
      'kick', 'snare', 'hihat', 'bass', 'tom'
    ];
    
    let interval = 0;
    const spacing = 300; // ms between sounds
    
    demoSamples.forEach((name, index) => {
      setTimeout(() => {
        debug('SampleManager', `Playing demo synthetic sound ${name}`);
        playSyntheticSound(name);
      }, interval);
      
      interval += spacing;
    });
    
    return demoSamples.length;
  }
  
  debug('SampleManager', `Found ${sampleNames.length} samples to test`);
  
  // Create a summary of sample types
  const summary = sampleNames.reduce((acc, name) => {
    const sample = sampleLibrary[name];
    if (!sample) return acc;
    
    const type = sample.synthetic ? 'synthetic' :
                 (sample.toneFallback ? 'tone' : 
                 (sample.decoded ? 'decoded' : 'raw'));
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  
  debug('SampleManager', `Sample types summary: ${JSON.stringify(summary)}`);
  
  let interval = 0;
  let playedCount = 0;
  const spacing = 300; // Increased spacing for clearer audio testing
  
  sampleNames.forEach((name, index) => {
    // Play each sample with a delay to hear them in sequence
    setTimeout(async () => {
      debug('SampleManager', `Test playing sample ${name} (${index + 1}/${sampleNames.length})`);
      try {
        await playSample(name);
        playedCount++;
        debug('SampleManager', `Successfully played sample ${name}`);
      } catch (err) {
        console.warn(`Error testing sample ${name}:`, err);
      }
      
      // Log final count when all samples are processed
      if (index === sampleNames.length - 1) {
        debug('SampleManager', `Finished testing samples. Successfully played ${playedCount}/${sampleNames.length} samples.`);
      }
    }, interval);
    
    interval += spacing;
  });
  
  return sampleNames.length; // Return number of samples being tested
};

// Get all available sample names
export const getAvailableSamples = () => {
  debug('SampleManager', `Getting available samples, returning ${Object.keys(sampleLibrary).length} samples`);
  return Object.keys(sampleLibrary);
}; 