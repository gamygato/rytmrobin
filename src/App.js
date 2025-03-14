import React, { useState, useEffect } from 'react';
import { 
  initAudioEngine,
  startPlayback, 
  stopPlayback, 
  setTrackPattern,
  setTrackVolume,
  toggleTrackMute,
  setBPM,
  addSampleToTrack, 
  audioContext,
  updateTrackSamples,
  applyTrackEffect,
  updateTrackDivision,
  startTrackPlayback,
  stopTrackPlayback
} from './engine/audioEngine';
import { 
  preloadDefaultSamples, 
  getAvailableSamples
} from './engine/sampleManager';
import { parsePattern, transformPattern } from './engine/patternParser';
import TransportControls from './components/TransportControls';
import TrackControl from './components/TrackControl';
import VisualBeatDisplay from './components/VisualBeatDisplay';
import './styles.css';
import { debug } from './utils/debug';

// Enable debug mode - this will be handled by the imported debug function
const DEBUG = true;

// Add a strict timeout to ensure initialization doesn't hang
const withTimeout = (promise, timeoutMs, fallbackValue) => {
  let timeoutHandle;
  const timeoutPromise = new Promise(resolve => {
    timeoutHandle = setTimeout(() => resolve(fallbackValue), timeoutMs);
  });

  return Promise.race([
    promise,
    timeoutPromise
  ]).then(result => {
    clearTimeout(timeoutHandle);
    return result;
  });
};

// Error Message component to show if initialization fails
const ErrorMessage = ({ message }) => {
  return (
    <div className="error-banner">
      <p>{message}</p>
      <button onClick={() => window.location.reload()}>Try Again</button>
    </div>
  );
};

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpmState] = useState(120);
  const [division, setDivision] = useState(16);
  const [trackStates, setTrackStates] = useState([
    { samples: [], pattern: "", mute: false, volume: 0.8, currentSampleIndex: 0, isTriggered: false, division: 16, isPlaying: false },
    { samples: [], pattern: "", mute: false, volume: 0.8, currentSampleIndex: 0, isTriggered: false, division: 16, isPlaying: false },
    { samples: [], pattern: "", mute: false, volume: 0.8, currentSampleIndex: 0, isTriggered: false, division: 16, isPlaying: false },
    { samples: [], pattern: "", mute: false, volume: 0.8, currentSampleIndex: 0, isTriggered: false, division: 16, isPlaying: false }
  ]);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [availableSamples, setAvailableSamples] = useState([]);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Initialize audio engine and load samples
  useEffect(() => {
    async function initAudio() {
      debug('App', "Starting audio initialization");
      setIsInitializing(true);
      
      try {
        // Use timeouts to ensure we don't get stuck
        debug('App', "Initializing audio engine");
        await withTimeout(
          initAudioEngine(),
          3000, // 3 second timeout
          true  // Return true after timeout to continue
        );
        
        // Set initial track states in the audio engine
        setTrackPattern(0, trackStates[0].pattern);
        setTrackPattern(1, trackStates[1].pattern);
        setTrackPattern(2, trackStates[2].pattern);
        setTrackPattern(3, trackStates[3].pattern);
        
        setAudioInitialized(true);
        
        // Load available samples
        await withTimeout(
          preloadDefaultSamples(),
          5000, // 5 second timeout
          true  // Return true after timeout to continue
        );
        
        const availableSampleNames = getAvailableSamples();
        setAvailableSamples(availableSampleNames);
        
        debug('App', `Loaded ${availableSampleNames.length} samples`);
      } catch (error) {
        console.error("Error during initialization:", error);
        setErrorMessage(`Initialization error: ${error.message}`);
      } finally {
        setIsInitializing(false);
      }
    }
    
    initAudio();
  }, []);
  
  // Beat counter for visual feedback
  useEffect(() => {
    if (!isPlaying) return;
    
    debug("Setting up beat counter interval");
    const interval = setInterval(() => {
      setCurrentBeat((prev) => (prev + 1) % (division));
      
      // Track highlighting disabled as requested
      // Instead of updating isTriggered to true randomly, we always set it to false
      setTrackStates(prevStates => prevStates.map(track => ({
        ...track,
        isTriggered: false // Always false to disable the red highlighting
      })));
      
      // No need for timeout to reset trigger visual since it's always false
      
    }, (60000 / bpm) / 4);
    
    return () => {
      debug("Clearing beat counter interval");
      clearInterval(interval);
    };
  }, [isPlaying, bpm, division]);
  
  // Handle play/pause
  const handlePlayPause = () => {
    debug(`${isPlaying ? 'Stopping' : 'Starting'} playback`);
    
    // Always consider the audio to be initialized
    if (!audioInitialized) {
      debug("Setting audioInitialized to true even though engine reported not ready");
      setAudioInitialized(true);
    }
    
    if (isPlaying) {
      // When stopping, stop global playback AND all individual tracks
      stopPlayback();
      
      // Stop all individual track playback
      trackStates.forEach((track, index) => {
        if (track.isPlaying) {
          stopTrackPlayback(index);
        }
      });
      
      // Update all track states to reflect they are paused
      setTrackStates(prevStates => prevStates.map(track => ({
        ...track,
        isPlaying: false
      })));
    } else {
      // When playing, start global playback and all tracks
      const success = startPlayback();
      debug("startPlayback returned:", success);
      
      // Start playback for all tracks
      trackStates.forEach((track, index) => {
        startTrackPlayback(index);
      });
      
      // Update all track states to reflect they are playing
      setTrackStates(prevStates => prevStates.map(track => ({
        ...track,
        isPlaying: true
      })));
    }
    setIsPlaying(!isPlaying);
  };
  
  // Handle BPM change
  const handleBPMChange = (newBpm) => {
    debug(`Changing BPM to ${newBpm}`);
    setBpmState(newBpm);
    setBPM(newBpm);
  };
  
  // Handle division change
  const handleDivisionChange = (newDivision) => {
    debug(`Changing division to ${newDivision}`);
    setDivision(newDivision);
    // Additional logic if needed to update engine
  };
  
  // Handle reset
  const handleReset = () => {
    debug("Resetting playback");
    if (isPlaying) {
      stopPlayback();
      setIsPlaying(false);
    }
    
    // Stop all individual track playback and reset their playing state
    trackStates.forEach((track, index) => {
      if (track.isPlaying) {
        stopTrackPlayback(index);
      }
    });
    
    // Update all track states to set isPlaying to false
    setTrackStates(prevStates => prevStates.map(track => ({
      ...track,
      isPlaying: false
    })));
    
    setCurrentBeat(0);
    // Additional reset logic if needed
  };
  
  // Handle pattern change
  const handlePatternChange = (trackIndex, pattern) => {
    debug(`Changing pattern for track ${trackIndex}`);
    setTrackStates(prevStates => prevStates.map((track, i) => 
      i === trackIndex ? { ...track, pattern } : track
    ));
    setTrackPattern(trackIndex, pattern);
  };
  
  // Handle volume change for a track
  const handleVolumeChange = (trackIndex, volume) => {
    console.log(`Setting volume for track ${trackIndex} to ${volume}`);
    
    // Update the audio engine volume for this track
    setTrackVolume(trackIndex, volume);
    
    // Update the track state in our React state
    setTrackStates(prevStates => {
      const newStates = [...prevStates];
      newStates[trackIndex] = {
        ...newStates[trackIndex],
        volume: volume
      };
      return newStates;
    });
  };
  
  // Handle mute toggle
  const handleMuteToggle = (trackIndex) => {
    debug(`Toggling mute for track ${trackIndex}`);
    setTrackStates(prevStates => prevStates.map((track, i) => 
      i === trackIndex ? { ...track, mute: !track.mute } : track
    ));
    toggleTrackMute(trackIndex);
  };
  
  // Handle adding a sample
  const handleAddSample = (trackIndex, sample) => {
    debug(`Adding sample ${sample} to track ${trackIndex}`);
    // Add sample in audio engine
    const success = addSampleToTrack(trackIndex, sample);
    
    if (success) {
      setTrackStates(prevStates => prevStates.map((track, i) => 
        i === trackIndex ? { 
          ...track, 
          samples: [...track.samples, sample]
        } : track
      ));
    }
  };
  
  // Add a handler for removing samples from tracks
  const handleRemoveSample = (trackIndex, sampleIndex) => {
    debug('App', `Removing sample at index ${sampleIndex} from track ${trackIndex}`);
    setTrackStates(currentTracks => {
      const updatedTracks = [...currentTracks];
      const track = { ...updatedTracks[trackIndex] };
      
      // Get the sample being removed for debugging
      const removedSample = track.samples[sampleIndex];
      debug('App', `Removing sample ${removedSample} from track ${trackIndex}`);
      
      // Remove the sample at the specified index
      const newSamples = [...track.samples];
      newSamples.splice(sampleIndex, 1);
      
      // Adjust currentSampleIndex if needed
      if (track.currentSampleIndex >= newSamples.length && newSamples.length > 0) {
        track.currentSampleIndex = newSamples.length - 1;
      }
      
      track.samples = newSamples;
      updatedTracks[trackIndex] = track;
      
      // IMPORTANT: Update the audio engine with the new samples list
      updateTrackSamples(trackIndex, newSamples);
      
      // Also update the pattern to ensure track state is fully refreshed
      setTrackPattern(trackIndex, track.pattern);
      
      return updatedTracks;
    });
  };

  // Update the handleApplyEffect function to use the exported functions directly
  const handleApplyEffect = (trackIndex, effectType, params) => {
    debug('App', `Applying ${effectType} effect to track ${trackIndex}`, params);
    
    // Apply effect to the track's sample using the audio engine
    if (!audioInitialized) return;
    
    try {
      // Import this function at the top of App.js along with your other imports
      // Note: We don't access this through audioEngine object
      applyTrackEffect(trackIndex, effectType, params);
    } catch (error) {
      console.error('Error applying effect:', error);
    }
  };

  // Add handler for applying pattern functions
  const handleApplyFunction = (trackIndex, functionId) => {
    debug('App', `Applying pattern function ${functionId} to track ${trackIndex}`);
    
    setTrackStates(currentTracks => {
      const updatedTracks = [...currentTracks];
      const track = { ...updatedTracks[trackIndex] };
      const currentPattern = track.pattern;
      
      // Parse the current pattern
      const parsedPattern = parsePattern(currentPattern);
      
      // Apply the selected function to transform the pattern
      let transformedPattern;
      switch (functionId) {
        case 'reverse':
          transformedPattern = transformPattern(parsedPattern, 'reverse');
          break;
        case 'speed2x':
          transformedPattern = transformPattern(parsedPattern, 'double');
          break;
        case 'speed05x':
          transformedPattern = transformPattern(parsedPattern, 'half');
          break;
        case 'offsetPlus':
          transformedPattern = transformPattern(parsedPattern, 'offset', 0.25);
          break;
        case 'offsetMinus':
          transformedPattern = transformPattern(parsedPattern, 'offset', -0.25);
          break;
        case 'every2nd':
          transformedPattern = transformPattern(parsedPattern, 'every', 2);
          break;
        case 'euclid':
          // Euclidean algorithm: distribute n beats as evenly as possible over m steps
          const numBeats = parsedPattern.length;
          const numSteps = 16; // Default to 16 steps
          transformedPattern = transformPattern(parsedPattern, 'euclid', { beats: numBeats, steps: numSteps });
          break;
        default:
          transformedPattern = parsedPattern;
      }
      
      // Convert the transformed pattern back to a string
      track.pattern = transformedPattern.join(' ');
      updatedTracks[trackIndex] = track;
      
      return updatedTracks;
    });
  };
  
  // Function to unlock audio on first user interaction
  const unlockAudio = () => {
    debug('App', 'Attempting to unlock audio through user interaction');
    if (audioContext) {
      debug('App', `Current audio context state: ${audioContext.state}`);
      
      if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
          debug('App', `Audio context resumed: ${audioContext.state}`);
        }).catch(err => {
          console.error('Failed to resume audio context:', err);
        });
      }
      
      // Create and play a silent buffer to unlock audio
      try {
        const buffer = audioContext.createBuffer(1, 1, 22050);
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start(0);
        debug('App', 'Played silent buffer to unlock audio');
      } catch (e) {
        console.error('Failed to play silent buffer:', e);
      }
    }
  };
  
  // Add a click listener to the document to handle audio unlock
  useEffect(() => {
    const handleClick = () => {
      unlockAudio();
      // Remove the listener after first click
      document.removeEventListener('click', handleClick);
      debug('App', 'Removed audio unlock click listener');
    };
    
    document.addEventListener('click', handleClick);
    
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);
  
  // Add this new handler function
  const handleTrackDivisionChange = (trackIndex, division) => {
    debug('App', `Changing division for track ${trackIndex} to ${division}`);
    
    setTrackStates(prevStates => prevStates.map((track, i) => 
      i === trackIndex ? { ...track, division } : track
    ));
    
    // Update the track division in the audio engine
    updateTrackDivision(trackIndex, division);
  };
  
  // Handle individual track play/pause
  const handleTrackPlayPause = (trackIndex) => {
    debug(`Toggling play/pause for track ${trackIndex}`);
    
    // Get current playing state before updating
    const currentlyPlaying = trackStates[trackIndex].isPlaying;
    
    try {
      if (currentlyPlaying) {
        // Pausing a track - only affects this track
        stopTrackPlayback(trackIndex);
        
        // Update just this track's state to paused
        setTrackStates(prevStates => prevStates.map((track, i) => 
          i === trackIndex ? { ...track, isPlaying: false } : track
        ));
      } else {
        // Check if global playback is active
        if (!isPlaying) {
          // If global playback is not active, start it first
          try {
            const success = startPlayback();
            debug("startPlayback returned:", success);
            setIsPlaying(true);
          } catch (err) {
            console.error("Error starting global playback:", err);
            // Continue with individual track playback even if global start fails
          }
        }
        
        // Now start this specific track
        try {
          startTrackPlayback(trackIndex);
        } catch (err) {
          console.error(`Error starting track ${trackIndex}:`, err);
          // If track start fails, we still want to update UI
        }
        
        // Update just this track's state to playing
        setTrackStates(prevStates => prevStates.map((track, i) => 
          i === trackIndex ? { ...track, isPlaying: true } : track
        ));
      }
    } catch (error) {
      console.error(`Error in handleTrackPlayPause for track ${trackIndex}:`, error);
      // Update UI state to reflect what happened
      const newPlayingState = !currentlyPlaying;
      setTrackStates(prevStates => prevStates.map((track, i) => 
        i === trackIndex ? { ...track, isPlaying: newPlayingState } : track
      ));
    }
  };
  
  // If there's an error, show the error message
  if (errorMessage) {
    return (
      <div className="app">
        <h1>Rytm Robin</h1>
        <ErrorMessage message={errorMessage} />
      </div>
    );
  }
  
  // If still initializing, show a loading message
  if (isInitializing) {
    return (
      <div className="app">
        <h1>Rytm Robin</h1>
        <div className="loading-spinner">
          <p>Initializing audio engine and loading samples...</p>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="app">
      <h1>Rytm Robin</h1>
      
      <div className="controls-container">
        <TransportControls 
          isPlaying={isPlaying}
          bpm={bpm}
          onPlayPause={handlePlayPause}
          onBPMChange={handleBPMChange}
          onReset={handleReset}
          disabled={!audioInitialized}
        />
      </div>
      
      <VisualBeatDisplay 
        currentBeat={currentBeat}
        totalBeats={division}
      />
      
      <div className="tracks-container">
        {trackStates.map((track, index) => (
          <TrackControl 
            key={index}
            trackIndex={index}
            track={track}
            availableSamples={availableSamples}
            onPatternChange={handlePatternChange}
            onVolumeChange={handleVolumeChange}
            onMuteToggle={handleMuteToggle}
            onAddSample={handleAddSample}
            onRemoveSample={handleRemoveSample}
            onApplyEffect={handleApplyEffect}
            onApplyFunction={handleApplyFunction}
            onDivisionChange={handleTrackDivisionChange}
            onTrackPlayPause={handleTrackPlayPause}
          />
        ))}
      </div>
    </div>
  );
}

export default App; 