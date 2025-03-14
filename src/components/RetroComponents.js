import React from 'react';

/**
 * This file re-exports components from the react-retro library (installed as 'frontend')
 * We create this wrapper to make it easier to import and use these components in our application
 */

// Simple Card component implementation (fallback if the library doesn't work)
export const Card = ({ className, header, children }) => {
  return (
    <div className={`retro-card ${className || ''}`}>
      {header && <div className="retro-card-header">{header}</div>}
      <div className="retro-card-content">
        {children}
      </div>
    </div>
  );
};

// RetroIconButton component for pixelated icon buttons
export const RetroIconButton = ({ 
  icon: Icon, 
  onClick, 
  className = '', 
  isActive = false,
  activeColor = '#4CAF50',
  inactiveColor = '#333',
  size = 36,
  ...props
}) => {
  return (
    <button 
      className={`retro-icon-button ${isActive ? 'active' : ''} ${className}`}
      onClick={onClick}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: isActive ? activeColor : inactiveColor,
        borderStyle: 'solid',
        borderWidth: '3px',
        borderImageSlice: '3',
        borderImageWidth: '3',
        borderImageOutset: '0',
        borderImageRepeat: 'stretch',
        borderImageSource: "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"3\" height=\"3\"><path d=\"M0 0h1v1H0zm2 0h1v1H2zM0 2h1v1H0zm2 0h1v1H2z\" fill=\"white\"/></svg>')",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        cursor: 'pointer',
        padding: '2px',
        transition: 'all 0.2s',
        imageRendering: 'pixelated'
      }}
      {...props}
    >
      {Icon && <Icon style={{ fontSize: `${size/2}px` }} />}
    </button>
  );
};

// Try to import and re-export the real Card component if available
try {
  // This might not work if the package structure is different
  const retroImport = require('frontend');
  if (retroImport && retroImport.Card) {
    exports.Card = retroImport.Card;
  }
} catch (error) {
  console.warn('Could not import Card from react-retro, using fallback component');
} 