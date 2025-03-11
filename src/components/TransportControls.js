import React from 'react';
import { FaPlay, FaPause, FaRedo } from 'react-icons/fa';

const TransportControls = ({ 
  isPlaying, 
  bpm, 
  division,
  onPlayPause, 
  onBPMChange,
  onDivisionChange,
  onReset,
  disabled
}) => {
  return (
    <div className={`transport-controls ${disabled ? 'disabled' : ''}`}>
      <button 
        className="play-button"
        onClick={onPlayPause}
        disabled={disabled}
      >
        {isPlaying ? <FaPause /> : <FaPlay />}
      </button>
      
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
      
      <div className="division-control">
        <span>Division</span>
        <select 
          value={division} 
          onChange={(e) => onDivisionChange(parseInt(e.target.value))}
          disabled={disabled}
        >
          <option value="4">1/4</option>
          <option value="8">1/8</option>
          <option value="16">1/16</option>
          <option value="32">1/32</option>
        </select>
      </div>
      
      <button 
        className="reset-button"
        onClick={onReset}
        disabled={disabled}
      >
        <FaRedo />
      </button>
    </div>
  );
};

export default TransportControls; 