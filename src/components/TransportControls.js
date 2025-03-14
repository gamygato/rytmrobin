import React from 'react';
import { FaPlay, FaPause, FaRedo } from 'react-icons/fa';
import { RetroIconButton } from './RetroComponents';

const TransportControls = ({ 
  isPlaying, 
  bpm, 
  onPlayPause, 
  onBPMChange,
  onReset,
  disabled
}) => {
  return (
    <div className={`transport-controls ${disabled ? 'disabled' : ''}`}>
      <RetroIconButton 
        icon={isPlaying ? FaPause : FaPlay}
        onClick={onPlayPause}
        isActive={isPlaying}
        activeColor="#cf6679"
        inactiveColor="#03dac5"
        size={48}
        disabled={disabled}
        title={isPlaying ? "Pause" : "Play"}
        aria-label={isPlaying ? "Pause" : "Play"}
      />
      
      <div className="bpm-control">
        <span>BPM</span>
        <input 
          type="range" 
          min="60" 
          max="200" 
          value={bpm} 
          onChange={(e) => onBPMChange(parseInt(e.target.value))}
          disabled={disabled}
        />
        <span>{bpm}</span>
      </div>
      
      <RetroIconButton 
        icon={FaRedo}
        onClick={onReset}
        isActive={false}
        inactiveColor="#6200ea"
        size={42}
        disabled={disabled}
        title="Reset"
        aria-label="Reset"
      />
    </div>
  );
};

export default TransportControls; 