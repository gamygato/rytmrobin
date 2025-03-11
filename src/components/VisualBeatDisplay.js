import React from 'react';

const VisualBeatDisplay = ({ currentBeat, totalBeats }) => {
  // Determine which beats should be emphasized (quarter, eighth notes)
  const isQuarterNote = (index) => index % 4 === 0;
  const isEighthNote = (index) => index % 2 === 0 && !isQuarterNote(index);
  
  return (
    <div className="beat-display-container">
      <div className="beat-display horizontal">
        {Array(totalBeats).fill().map((_, i) => (
          <div 
            key={i} 
            className={`beat-indicator 
              ${i === currentBeat ? 'active' : ''}
              ${isQuarterNote(i) ? 'quarter-note' : ''}
              ${isEighthNote(i) ? 'eighth-note' : ''}
            `} 
          />
        ))}
      </div>
    </div>
  );
};

export default VisualBeatDisplay; 