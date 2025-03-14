# Strudel PolyRhythm Sampler

A web-based sampler application inspired by PureData patches, built with Strudel, React, and the Web Audio API.

## Features

- 8-track sampler with polyrhythmic capabilities
- Round-robin sample playback (up to 4 samples per track)
- Adjustable BPM and division
- Visual beat display
- Individual track controls for pattern, volume, and mute
- Modern, responsive UI

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/strudel-sampler.git
cd strudel-sampler
```

2. Install dependencies
```bash
npm install
```

3. Place your audio samples in the `public/samples` directory
   - The application comes with some default samples
   - Supported formats: .wav, .mp3

4. Start the development server
```bash
npm start
```

5. Open your browser to http://localhost:3000

## Usage

### Basic Controls

- **Play/Pause**: Start or stop the sampler
- **BPM**: Adjust the tempo of the playback
- **Division**: Change the beat division (1/4, 1/8, 1/16, 1/32)
- **Reset**: Reset the pattern counter to the beginning

### Track Controls

- **Pattern Input**: Enter a pattern for each track (e.g., "0 1 2 3" for quarter notes)
- **Volume Slider**: Adjust volume for each track
- **Mute Button**: Mute/unmute individual tracks
- **Add Sample**: Add samples to a track (up to 4 per track)

### Pattern Syntax

The pattern input uses Strudel's pattern syntax:
- `0 1 2 3`: Quarter notes (equally spaced)
- `0 0.5 1 1.5 2 2.5 3 3.5`: Eighth notes
- `0.5 1.5 2.5 3.5`: Off-beat eighth notes
- `0 2`: Half notes
- `0 1 0 1`: Basic kick-snare pattern

## PureData to Strudel Migration

This application is a web-based recreation of a PureData patch with the following features migrated:

### Metronome Functionality
The `master-metronome.pd` functionality is implemented through Strudel's built-in timing mechanisms, with visual feedback through the beat display. The metronome handles:
- Quarter, eighth, and sixteenth note divisions
- Adjustable BPM (mapped from the "knob1" control in the original patch)
- Start/stop control

### Sampler Voice Implementation
The `sampler-voice.pd` functionality has been reimplemented as follows:
- Round-robin sample playback (up to 4 samples per track)
- Volume control (mapped from the original patch)
- Pattern-based triggering

### Control Mapping
The PureData controls have been mapped to the web interface:
- `knob1` → Division control (determines how many steps in a pattern)
- `knob2` → BPM control (tempo adjustment)
- `knob3` → Sample speed control (in the original patch - implemented as pattern speed)
- `knob4` → Decay control (implemented as track volume)

### Pattern Creation
Unlike the PureData implementation that used fixed patterns, this version allows for flexible pattern creation using Strudel's pattern language, making it more versatile while retaining the polyrhythmic capabilities of the original.

## Advanced Usage

### Creating Complex Polyrhythms

To create interesting polyrhythms, set different patterns for each track with varying rhythmic values:

1. Track 1: `0 1 2 3` (4/4 rhythm)
2. Track 2: `0 1.5 3` (3/4 rhythm) 
3. Track 3: `0 1.2 2.4 3.6` (5/4 rhythm)

This will create a pattern that cycles every 60 beats (LCM of 4, 3, and 5).

### Round-Robin Sample Usage

Each track can have up to 4 samples loaded. When triggered, it will advance through the samples in a round-robin fashion, creating dynamic and evolving patterns.

## Technologies Used

- **Strudel.cycles**: For audio pattern generation and sample playback
- **React**: For the user interface
- **Web Audio API**: For audio processing
- **Tone.js**: For advanced audio capabilities

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by PureData patches
- Built with [Strudel](https://strudel.tidalcycles.org/)
- Sample management with [Tone.js](https://tonejs.github.io/) 