# Rytm Robin

## Introduction

Rytm Robin is a browser-based drum sequencer/rhythm machine that enables users to create, manipulate, and play rhythmic patterns using audio samples. It provides a feature-rich environment for music production directly in the browser, combining powerful audio processing capabilities with an intuitive user interface.

## Core Functionality

The application allows users to:

- Create and play rhythmic patterns using various audio samples
- Control multiple independent tracks (up to 4 tracks in the current UI)
- Apply audio effects with adjustable parameters to each track
- Adjust global parameters like BPM (beats per minute) and rhythmic division
- Transform patterns using various algorithms (reverse, speed changes, etc.)
- Visually monitor the current beat position during playback

## Architecture

Rytm Robin is built with React and leverages the Web Audio API (using Tone.js as a wrapper) for sound generation and processing. The application is structured around these main components:

### Main Application Components

- **App.js**: The central component that:
  - Manages the overall application state
  - Coordinates between UI components and the audio engine
  - Handles initialization and error states
  - Processes user interactions

- **TransportControls.js**: Controls the playback mechanics:
  - Play/pause toggle
  - BPM adjustment
  - Beat division selection
  - Reset functionality

- **TrackControl.js**: Provides UI for individual tracks:
  - Pattern input and visualization
  - Volume control
  - Sample selection and management
  - Effect application
  - Mute toggling
  - Division adjustment per track

- **VisualBeatDisplay.js**: Creates a visual representation of:
  - Current beat position
  - Beat divisions (quarter, eighth, sixteenth notes)
  - Playback progress

### Audio Engine

- **audioEngine.js**: The core sound processing system:
  - Manages the Web Audio API context and connections
  - Controls pattern triggering based on current beat position
  - Handles playback timing and synchronization
  - Creates and applies audio effect processing chains
  - Implements track volume and muting

- **sampleManager.js**: Handles audio sample resources:
  - Loads samples from various sources
  - Manages the sample library
  - Provides synthetic fallbacks when sample loading fails
  - Implements round-robin sample playback

- **patternParser.js**: Processes rhythm patterns:
  - Converts text-based pattern strings into numerical sequences
  - Provides pattern transformation functions
  - Includes preset patterns in various styles
  - Implements the Euclidean rhythm algorithm

## User Interface and Features

The application features a dark-themed UI designed for both aesthetics and usability:

### Transport Section

- Play/pause button that changes color based on playback state
- BPM control slider with a range of 60-200 BPM
- Division selector for choosing the master rhythmic division
- Reset button to return to the beginning of the pattern

### Beat Display

- Visual indicators showing the current beat position
- Different styling for quarter notes, eighth notes, and sixteenth notes
- Horizontal layout for clear visualization of the pattern progression

### Track Controls

Each track includes:

- Pattern input field for typing rhythmic patterns (e.g., "0 1 2 3")
- Volume slider with percentage display
- Division selector allowing different divisions per track
- Mute button for silencing individual tracks
- Sample management panel for adding and removing samples
- Effects section with various processors and parameters
- Visual feedback when a track is triggered

### Pattern Features

- Preset patterns organized into categories:
  - Basic patterns (quarter notes, eighth notes, etc.)
  - Offbeat variations
  - Drum patterns (house, jungle, hip-hop)
  - Rhythmic patterns (waltz, tresillo, clave)
  - Experimental patterns

- Pattern transformation functions:
  - Reverse: Play the pattern backwards
  - Speed changes: Double or half the pattern speed
  - Offset: Shift the pattern in time
  - Every nth beat: Keep only selected beats
  - Euclidean rhythms: Distribute beats evenly across steps

### Sample Management

- Built-in sample library with:
  - Numbered generic samples (1-24)
  - Drum-specific sounds (kick, snare, hi-hat, etc.)
- Round-robin playback for sample variation within a track
- Support for multiple samples per track
- Visual indicators for the currently playing sample

### Effects Processing

The application offers several audio effects with adjustable parameters:

- Delay with adjustable time and feedback
- Reverb with decay control
- Distortion with amount control
- Low-pass filter with frequency and resonance parameters
- High-pass filter with frequency and resonance parameters
- Chorus with depth and rate controls
- Phaser with rate and depth adjustments

## Technical Implementation Details

### Pattern System

Patterns in Rytm Robin are expressed as space-separated numbers representing beat positions within a bar (typically in a 0-4 range), for example:
- "0 1 2 3" represents quarter notes (beats on 1, 2, 3, 4)
- "0 0.5 1 1.5 2 2.5 3 3.5" represents eighth notes

The application:
1. Parses these pattern strings into numerical arrays
2. Continuously checks if the current playback position matches any pattern position
3. Triggers the appropriate samples when matches occur
4. Handles different divisions per track for complex polyrhythms

### Audio Processing

The audio system uses a combination of:

1. **Web Audio API** for core audio handling and low-level operations
2. **Tone.js** for higher-level audio control, effects, and scheduling
3. Fallback mechanisms when audio loading fails, including synthetic sound generation

Audio routing is implemented with a channel-based approach:
- Each track has its own channel
- Effects are inserted into the signal chain for each track
- Master output includes limiter protection against clipping

### Error Handling and Initialization

The application implements robust error handling:

1. Timeout mechanisms to prevent hanging during initialization
2. Audio context unlocking on user interaction (required by modern browsers)
3. Synthetic sound generation as fallbacks when samples can't be loaded
4. Visual error displays for critical failures
5. Debug mode for development assistance

### Responsive Design

The CSS includes:
- Flexible layouts that adapt to different screen sizes
- Media queries for mobile device optimization
- Consistent styling with a dark theme for visual comfort
- Accessibility considerations for controls and interactions

## Development Features

The application includes several developer-focused features:

1. Debug utilities for logging and testing
2. Performance monitoring via `reportWebVitals.js`
3. React Strict Mode for catching potential problems
4. Timeout-protected asynchronous operations
5. Comprehensive error handling and reporting

## Summary

Rytm Robin represents a sophisticated rhythm programming environment with:

- Multiple independent tracks with adjustable parameters
- Flexible pattern creation and transformation tools
- Sample selection with round-robin playback
- Visual feedback for rhythm visualization
- Extensive audio effects processing capabilities
- Responsive design for various devices

The application successfully combines Web Audio API capabilities, React component architecture, and thoughtful UI design to create an accessible yet powerful music production tool that runs entirely in the browser.
