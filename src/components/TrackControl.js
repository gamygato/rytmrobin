import React, { useState } from 'react';
import { FaVolumeMute, FaEllipsisH, FaTimes, FaMagic, FaPlay, FaPause } from 'react-icons/fa';
import { commonPatterns } from '../engine/patternParser';
import { Card, RetroIconButton } from '../components/RetroComponents';

const PatternPresets = ({ onSelectPattern }) => {
  const [category, setCategory] = useState('basic');
  
  // Group patterns by category
  const patternCategories = {
    basic: ['quarter', 'eighth', 'sixteenth', 'offbeat'],
    offbeat: ['offbeat', 'offbeatQuarter', 'offbeatTriple', 'lateOffbeat'],
    drum: ['kickSnare', 'house', 'jungle', 'hiphop', 'trap'],
    rhythmic: ['waltz', 'tresillo', 'clave', 'chachacha', 'swing'],
    experimental: ['sparse', 'fibonacci', 'primes', 'golden', 'random']
  };
  
  return (
    <div className="pattern-presets">
      <div className="preset-categories">
        {Object.keys(patternCategories).map(cat => (
          <button 
            key={cat}
            className={category === cat ? 'active' : ''}
            onClick={() => setCategory(cat)}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>
      
      <div className="preset-header">Pattern Presets:</div>
      <div className="preset-buttons">
        {patternCategories[category].map(patternName => (
          <button 
            key={patternName}
            onClick={() => onSelectPattern(commonPatterns[patternName])}
            title={commonPatterns[patternName]}
          >
            {patternName}
          </button>
        ))}
      </div>
    </div>
  );
};

const SampleSelector = ({ availableSamples, onAddSample, onRemoveSample, currentSamples, disabled }) => {
  const [activeTab, setActiveTab] = useState('numbered');
  
  // Separate samples into categories
  const numberedSamples = availableSamples.filter(name => name.startsWith('sample'));
  const drumSamples = availableSamples.filter(name => !name.startsWith('sample'));
  
  return (
    <div className="sample-selector">
      <div className="sample-tabs">
        <button 
          className={activeTab === 'numbered' ? 'active' : ''} 
          onClick={() => setActiveTab('numbered')}
        >
          Numbered Samples
        </button>
        <button 
          className={activeTab === 'drums' ? 'active' : ''} 
          onClick={() => setActiveTab('drums')}
        >
          Drum Samples
        </button>
        <button 
          className={activeTab === 'current' ? 'active' : ''} 
          onClick={() => setActiveTab('current')}
        >
          Current ({currentSamples.length})
        </button>
      </div>
      
      <div className="sample-grid">
        {activeTab === 'numbered' && numberedSamples.map(sample => (
          <button 
            key={sample}
            onClick={() => onAddSample(sample)}
            disabled={disabled}
            className="sample-button"
          >
            {sample.replace('sample', '#')}
          </button>
        ))}
        
        {activeTab === 'drums' && drumSamples.map(sample => (
          <button 
            key={sample}
            onClick={() => onAddSample(sample)}
            disabled={disabled}
            className="sample-button"
          >
            {sample.charAt(0).toUpperCase() + sample.slice(1)}
          </button>
        ))}
        
        {activeTab === 'current' && (
          <div className="current-samples-list">
            {currentSamples.length === 0 ? (
              <p className="no-samples">No samples added yet</p>
            ) : (
              currentSamples.map((sample, index) => (
                <div key={`${sample}-${index}`} className="current-sample-item">
                  <span>{sample}</span>
                  <button 
                    className="remove-sample-button"
                    onClick={() => onRemoveSample(index)}
                    title="Remove sample"
                  >
                    <FaTimes />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Add an Effects component that will be used for each track
const TrackEffects = ({ onApplyEffect }) => {
  const [selectedEffect, setSelectedEffect] = useState('none');
  const [effectParams, setEffectParams] = useState({
    amount: 0.5,
    wetDry: 0.5,
    delayTime: 0.25,
    feedback: 0.5,
    decay: 0.5,
    distortion: 0.5,
    frequency: 0.5, 
    q: 0.1,
    depth: 0.7,
    rate: 0.5
  });
  
  const effects = [
    { id: 'none', name: 'No Effect' },
    { id: 'delay', name: 'Delay' },
    { id: 'reverb', name: 'Reverb' },
    { id: 'distortion', name: 'Distortion' },
    { id: 'lowpass', name: 'Low-Pass Filter' },
    { id: 'highpass', name: 'High-Pass Filter' },
    { id: 'chorus', name: 'Chorus' },
    { id: 'phaser', name: 'Phaser' }
  ];
  
  const handleApplyEffect = () => {
    if (selectedEffect === 'none') return;
    // Apply effect with all relevant parameters
    onApplyEffect(selectedEffect, effectParams);
  };

  // Handle parameter change
  const handleParamChange = (param, value) => {
    setEffectParams(prev => ({
      ...prev,
      [param]: parseFloat(value)
    }));
  };
  
  // Get effect-specific parameters UI
  const getEffectParameters = () => {
    switch (selectedEffect) {
      case 'none':
        return null;
        
      case 'delay':
        return (
          <div className="effect-params">
            <div className="param-group">
              <label>Delay Time</label>
              <input
                type="range"
                min="0.05"
                max="1"
                step="0.01"
                value={effectParams.delayTime}
                onChange={(e) => handleParamChange('delayTime', e.target.value)}
                className="param-slider"
              />
              <span>{(effectParams.delayTime * 1000).toFixed(0)}ms</span>
            </div>
            
            <div className="param-group">
              <label>Feedback</label>
              <input
                type="range"
                min="0"
                max="0.9"
                step="0.01"
                value={effectParams.feedback}
                onChange={(e) => handleParamChange('feedback', e.target.value)}
                className="param-slider"
              />
              <span>{Math.round(effectParams.feedback * 100)}%</span>
            </div>
            
            <div className="param-group">
              <label>Wet/Dry</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={effectParams.wetDry}
                onChange={(e) => handleParamChange('wetDry', e.target.value)}
                className="param-slider"
              />
              <span>{Math.round(effectParams.wetDry * 100)}%</span>
            </div>
          </div>
        );
        
      case 'reverb':
        return (
          <div className="effect-params">
            <div className="param-group">
              <label>Decay</label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.01"
                value={effectParams.decay}
                onChange={(e) => handleParamChange('decay', e.target.value)}
                className="param-slider"
              />
              <span>{(effectParams.decay * 5).toFixed(1)}s</span>
            </div>
            
            <div className="param-group">
              <label>Wet/Dry</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={effectParams.wetDry}
                onChange={(e) => handleParamChange('wetDry', e.target.value)}
                className="param-slider"
              />
              <span>{Math.round(effectParams.wetDry * 100)}%</span>
            </div>
          </div>
        );
        
      case 'distortion':
        return (
          <div className="effect-params">
            <div className="param-group">
              <label>Distortion</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={effectParams.distortion}
                onChange={(e) => handleParamChange('distortion', e.target.value)}
                className="param-slider"
              />
              <span>{Math.round(effectParams.distortion * 100)}%</span>
            </div>
            
            <div className="param-group">
              <label>Wet/Dry</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={effectParams.wetDry}
                onChange={(e) => handleParamChange('wetDry', e.target.value)}
                className="param-slider"
              />
              <span>{Math.round(effectParams.wetDry * 100)}%</span>
            </div>
          </div>
        );
        
      case 'lowpass':
      case 'highpass':
        return (
          <div className="effect-params">
            <div className="param-group">
              <label>Frequency</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={effectParams.frequency}
                onChange={(e) => handleParamChange('frequency', e.target.value)}
                className="param-slider"
              />
              <span>
                {selectedEffect === 'lowpass' 
                  ? Math.round(100 + effectParams.frequency * 15000) 
                  : Math.round(20 + effectParams.frequency * 10000)
                } Hz
              </span>
            </div>
            
            <div className="param-group">
              <label>Resonance (Q)</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={effectParams.q}
                onChange={(e) => handleParamChange('q', e.target.value)}
                className="param-slider"
              />
              <span>{(effectParams.q * 10).toFixed(1)}</span>
            </div>
          </div>
        );
        
      case 'chorus':
        return (
          <div className="effect-params">
            <div className="param-group">
              <label>Depth</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={effectParams.depth}
                onChange={(e) => handleParamChange('depth', e.target.value)}
                className="param-slider"
              />
              <span>{Math.round(effectParams.depth * 100)}%</span>
            </div>
            
            <div className="param-group">
              <label>Rate</label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.01"
                value={effectParams.rate}
                onChange={(e) => handleParamChange('rate', e.target.value)}
                className="param-slider"
              />
              <span>{(effectParams.rate * 10).toFixed(1)} Hz</span>
            </div>
            
            <div className="param-group">
              <label>Wet/Dry</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={effectParams.wetDry}
                onChange={(e) => handleParamChange('wetDry', e.target.value)}
                className="param-slider"
              />
              <span>{Math.round(effectParams.wetDry * 100)}%</span>
            </div>
          </div>
        );
        
      case 'phaser':
        return (
          <div className="effect-params">
            <div className="param-group">
              <label>Rate</label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.01"
                value={effectParams.rate}
                onChange={(e) => handleParamChange('rate', e.target.value)}
                className="param-slider"
              />
              <span>{(effectParams.rate * 10).toFixed(1)} Hz</span>
            </div>
            
            <div className="param-group">
              <label>Depth</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={effectParams.depth}
                onChange={(e) => handleParamChange('depth', e.target.value)}
                className="param-slider"
              />
              <span>{Math.round(effectParams.depth * 100)}%</span>
            </div>
            
            <div className="param-group">
              <label>Wet/Dry</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={effectParams.wetDry}
                onChange={(e) => handleParamChange('wetDry', e.target.value)}
                className="param-slider"
              />
              <span>{Math.round(effectParams.wetDry * 100)}%</span>
            </div>
          </div>
        );
        
      default:
        return (
          <div className="effect-params">
            <div className="param-group">
              <label>Amount</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={effectParams.amount}
                onChange={(e) => handleParamChange('amount', e.target.value)}
                className="param-slider"
              />
              <span>{Math.round(effectParams.amount * 100)}%</span>
            </div>
          </div>
        );
    }
  };
  
  return (
    <div className="track-effects">
      <div className="effects-header">
        <h4>Effects</h4>
      </div>
      <div className="effects-row">
        <select 
          value={selectedEffect}
          onChange={(e) => setSelectedEffect(e.target.value)}
          className="effect-select"
        >
          {effects.map(effect => (
            <option key={effect.id} value={effect.id}>{effect.name}</option>
          ))}
        </select>
      </div>
      
      {getEffectParameters()}
      
      <button 
        className="apply-effect-button"
        onClick={handleApplyEffect}
        disabled={selectedEffect === 'none'}
      >
        Apply Effect
      </button>
    </div>
  );
};

// Add a PatternFunctions component
const PatternFunctions = ({ onApplyFunction }) => {
  const patternFunctions = [
    { id: 'reverse', name: 'Reverse Pattern' },
    { id: 'speed2x', name: '2x Speed' },
    { id: 'speed05x', name: '1/2 Speed' },
    { id: 'offsetPlus', name: 'Offset +0.25' },
    { id: 'offsetMinus', name: 'Offset -0.25' },
    { id: 'every2nd', name: 'Every 2nd Beat' },
    { id: 'euclid', name: 'Euclidean Rhythm' }
  ];
  
  return (
    <div className="pattern-functions">
      <div className="functions-header">
        <h4>Pattern Functions</h4>
      </div>
      <div className="functions-buttons">
        {patternFunctions.map(func => (
          <button 
            key={func.id}
            className="function-button"
            onClick={() => onApplyFunction(func.id)}
          >
            {func.name}
          </button>
        ))}
      </div>
    </div>
  );
};

// Add this helper function to provide a human-readable description
const getDivisionLabel = (division) => {
  switch (parseInt(division)) {
    case 4: return "Quarter notes (1/4)";
    case 8: return "Eighth notes (1/8)";
    case 16: return "Sixteenth notes (1/16)";
    case 32: return "32nd notes (1/32)";
    case 3: return "Quarter note triplets";
    case 6: return "Eighth note triplets";
    case 12: return "Sixteenth note triplets";
    case 5: return "Quintuplets (1/4)";
    case 10: return "Quintuplets (1/8)";
    case 7: return "Septuplets (1/4)";
    case 14: return "Septuplets (1/8)";
    default: return `Division: ${division}`;
  }
};

const TrackControl = ({ 
  trackIndex, 
  track, 
  availableSamples,
  onPatternChange,
  onVolumeChange,
  onMuteToggle,
  onAddSample,
  onRemoveSample,
  onApplyEffect,
  onApplyFunction,
  onDivisionChange,
  onTrackPlayPause
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPatternPresets, setShowPatternPresets] = useState(false);
  const [activeTab, setActiveTab] = useState('samples'); // samples, effects, functions
  
  const handlePatternPresetSelect = (pattern) => {
    onPatternChange(trackIndex, pattern);
    setShowPatternPresets(false);
  };
  
  const handleAddSample = (sample) => {
    onAddSample(trackIndex, sample);
  };
  
  const handleRemoveSample = (sampleIndex) => {
    onRemoveSample(trackIndex, sampleIndex);
  };
  
  const handleApplyFunction = (functionId) => {
    onApplyFunction && onApplyFunction(trackIndex, functionId);
  };

  // Render the division selector UI
  const renderDivisionSelector = () => (
    <div className="track-division">
      <div className="track-division-info" title={getDivisionLabel(track.division)}>
        <label>Division</label>
      </div>
      <select 
        value={track.division} 
        onChange={(e) => onDivisionChange(trackIndex, parseInt(e.target.value))}
        className="division-select"
      >
        <option value="4">1/4</option>
        <option value="8">1/8</option>
        <option value="16">1/16</option>
        <option value="32">1/32</option>
        <option value="3">1/4T</option>
        <option value="6">1/8T</option>
        <option value="12">1/16T</option>
        <option value="5">1/4 (5)</option>
        <option value="10">1/8 (5)</option>
        <option value="7">1/4 (7)</option>
        <option value="14">1/8 (7)</option>
      </select>
    </div>
  );
  
  return (
    <Card 
      className={`track-control ${track.isTriggered ? 'triggered' : ''}`}
      header={`Track ${trackIndex + 1}`}
    >
      <div className="track-samples">
        {track.samples.map((sample, i) => (
          <div 
            key={i} 
            className={`sample-indicator ${i === track.currentSampleIndex ? 'active' : ''}`}
            title={sample}
          />
        ))}
        {track.samples.length > 0 && (
          <div className="current-sample">
            {track.samples[track.currentSampleIndex]}
          </div>
        )}
      </div>
      <div className="track-controls-buttons">
        <RetroIconButton 
          icon={track.isPlaying ? FaPause : FaPlay}
          onClick={() => onTrackPlayPause(trackIndex)}
          isActive={track.isPlaying}
          activeColor="#4CAF50"
          inactiveColor="#333"
          title={track.isPlaying ? "Pause track" : "Play track"}
          aria-label={track.isPlaying ? "Pause track" : "Play track"}
        />
        <RetroIconButton 
          icon={FaVolumeMute}
          onClick={() => onMuteToggle(trackIndex)}
          isActive={track.mute}
          activeColor="#f44336"
          inactiveColor="#333"
          title={track.mute ? "Unmute track" : "Mute track"}
          aria-label={track.mute ? "Unmute track" : "Mute track"}
        />
      </div>
      
      <div className="track-body">
        <div className="pattern-input-container">
          <input 
            type="text"
            value={track.pattern}
            onChange={(e) => onPatternChange(trackIndex, e.target.value)}
            placeholder="Enter pattern (e.g. 0 1 2 3)"
            className="pattern-input"
          />
          <button 
            className="pattern-preset-button"
            onClick={() => setShowPatternPresets(!showPatternPresets)}
            title="Show pattern presets"
          >
            <FaEllipsisH />
          </button>
          <button 
            className="pattern-functions-button"
            onClick={() => {
              setIsExpanded(true);
              setActiveTab('functions');
            }}
            title="Pattern functions"
          >
            <FaMagic />
          </button>
        </div>
        
        {showPatternPresets && (
          <PatternPresets onSelectPattern={handlePatternPresetSelect} />
        )}
        
        <div className="volume-control">
          <span className="volume-label">Volume: {Math.round(track.volume * 100)}%</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={track.volume}
            onChange={(e) => onVolumeChange(trackIndex, parseFloat(e.target.value))}
            className="volume-slider"
          />
        </div>
        
        {renderDivisionSelector()}
        
        {isExpanded && (
          <div className="expanded-panel">
            <div className="expanded-tabs">
              <button 
                className={`expanded-tab ${activeTab === 'samples' ? 'active' : ''}`}
                onClick={() => setActiveTab('samples')}
              >
                Samples
              </button>
              <button 
                className={`expanded-tab ${activeTab === 'effects' ? 'active' : ''}`}
                onClick={() => setActiveTab('effects')}
              >
                Effects
              </button>
              <button 
                className={`expanded-tab ${activeTab === 'functions' ? 'active' : ''}`}
                onClick={() => setActiveTab('functions')}
              >
                Functions
              </button>
            </div>
            
            {activeTab === 'samples' && (
              <SampleSelector 
                availableSamples={availableSamples}
                onAddSample={handleAddSample}
                onRemoveSample={handleRemoveSample}
                currentSamples={track.samples}
                disabled={track.samples.length >= 4}
              />
            )}
            
            {activeTab === 'effects' && (
              <TrackEffects 
                onApplyEffect={(effectType, params) => onApplyEffect(trackIndex, effectType, params)} 
              />
            )}
            
            {activeTab === 'functions' && (
              <PatternFunctions 
                onApplyFunction={handleApplyFunction}
              />
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default TrackControl; 