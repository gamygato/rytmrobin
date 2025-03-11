// This file handles converting pattern strings to Strudel patterns
// eslint-disable-next-line no-unused-vars
import { Pattern } from '@strudel.cycles/core';
import { debug } from '../utils/debug';

let DEBUG_MODE = false;

export const enableDebug = () => {
  DEBUG_MODE = true;
};

// Parse a simple pattern string
export const parsePattern = (pattern) => {
  debug('PatternParser', `Parsing pattern: ${pattern}`);
  
  // Handle empty patterns
  if (!pattern) {
    return [];
  }
  
  // If pattern is already an array, return it
  if (Array.isArray(pattern)) {
    return pattern;
  }
  
  // Make sure pattern is a string before trying to trim it
  if (typeof pattern !== 'string') {
    console.error('Pattern is not a string:', pattern);
    return [];
  }
  
  // Check if the pattern is empty after trimming
  if (pattern.trim() === '') {
    return [];
  }
  
  // Split the pattern string into an array of beat positions
  let beatPositions;
  try {
    beatPositions = pattern.split(/\s+/).map(parseFloat);
    
    // Filter out any NaN values that might have resulted from parsing
    beatPositions = beatPositions.filter(position => !isNaN(position));
  } catch (e) {
    console.error('Error parsing pattern:', e);
    return [];
  }
  
  return beatPositions;
};

// Normalize a pattern to ensure it works with our system
export const normalizePattern = (pattern, min = 0, max = 1) => {
  if (DEBUG_MODE) console.log('Normalizing pattern:', pattern);
  
  // Parse the pattern if it's a string
  const positions = parsePattern(pattern);
  if (positions.length === 0) return positions;
  
  // Find the minimum and maximum values in the pattern
  const patternMin = Math.min(...positions);
  const patternMax = Math.max(...positions);
  
  // If min and max are the same, return a pattern with all values set to min
  if (patternMin === patternMax) {
    return positions.map(() => min);
  }
  
  // Normalize the pattern to the specified range
  return positions.map(position => {
    const normalized = (position - patternMin) / (patternMax - patternMin);
    return normalized * (max - min) + min;
  });
};

// Check if a beat position matches a pattern
export const beatMatchesPattern = (beatPosition, pattern, tolerance = 0.05) => {
  // Parse the pattern if it's a string
  const positions = parsePattern(pattern);
  if (positions.length === 0) return false;
  
  // Check if the beat position matches any position in the pattern
  return positions.some(position => {
    const distance = Math.abs(position - beatPosition);
    return distance <= tolerance || distance >= (1 - tolerance);
  });
};

/**
 * Transform a pattern using various transformations
 * @param {Array|string} pattern - The pattern to transform
 * @param {string} transformation - The type of transformation to apply
 * @param {any} param - Additional parameter for the transformation
 * @returns {Array} The transformed pattern
 */
export const transformPattern = (pattern, transformation, param) => {
  // Parse the pattern if it's a string
  const positions = parsePattern(pattern);
  if (positions.length === 0) return positions;
  
  let transformed = [...positions];
  
  switch (transformation) {
    case 'reverse':
      // Reverse the pattern
      transformed = positions.slice().reverse();
      break;
      
    case 'double':
      // Double the speed (halve the time between beats)
      transformed = positions.map(pos => pos / 2);
      break;
      
    case 'half':
      // Half the speed (double the time between beats)
      transformed = positions.map(pos => pos * 2 % 1);
      break;
      
    case 'offset':
      // Offset the pattern by the specified amount
      const offsetAmount = param || 0;
      transformed = positions.map(pos => {
        let newPos = (pos + offsetAmount) % 1;
        if (newPos < 0) newPos += 1; // Handle negative positions
        return newPos;
      });
      break;
      
    case 'every':
      // Keep every nth beat
      const n = param || 2;
      transformed = positions.filter((_, idx) => idx % n === 0);
      break;
      
    case 'euclid':
      // Apply Euclidean algorithm
      const options = param || { beats: positions.length, steps: 16 };
      const { beats, steps } = options;
      transformed = euclideanRhythm(beats, steps).map(pos => pos / steps);
      break;
      
    case 'rotate':
      // Rotate the pattern by n positions
      const rotateBy = param || 1;
      const len = positions.length;
      transformed = positions.map((_, idx) => {
        const newIdx = (idx + rotateBy) % len;
        return positions[newIdx];
      });
      break;
      
    case 'randomize':
      // Randomize the order of the pattern
      transformed = positions.slice();
      for (let i = transformed.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [transformed[i], transformed[j]] = [transformed[j], transformed[i]];
      }
      break;
      
    default:
      // Return the original pattern if the transformation is not recognized
      transformed = positions;
  }
  
  return transformed;
};

/**
 * Generate a Euclidean rhythm pattern
 * Distributes n beats as evenly as possible over m steps
 * @param {number} beats - Number of beats to distribute
 * @param {number} steps - Total number of steps
 * @returns {Array} Array of indices where beats occur
 */
export const euclideanRhythm = (beats, steps) => {
  // Handle edge cases
  if (beats <= 0) return [];
  if (beats >= steps) return Array.from({ length: steps }, (_, i) => i);
  
  // Björklund's algorithm implementation
  const pattern = Array(steps).fill(0);
  const indices = [];
  
  // Calculate where the beats should occur
  const perBeat = steps / beats;
  for (let i = 0; i < beats; i++) {
    const idx = Math.floor(i * perBeat);
    pattern[idx] = 1;
    indices.push(idx);
  }
  
  return indices;
};

// Common patterns for easy reference
export const commonPatterns = {
  // Basic patterns
  quarter: "0 1 2 3",          // 4 quarter notes per bar
  eighth: "0 0.5 1 1.5 2 2.5 3 3.5",  // 8 eighth notes per bar
  sixteenth: "0 0.25 0.5 0.75 1 1.25 1.5 1.75 2 2.25 2.5 2.75 3 3.25 3.5 3.75", // 16 sixteenth notes
  offbeat: "0.5 1.5 2.5 3.5",  // Offbeats on the "and" of each beat
  
  // Offbeat variations
  offbeatQuarter: "1 3",       // Beats 2 and 4
  offbeatTriple: "1 2 3",      // Beats 2, 3, and 4
  lateOffbeat: "0.25 0.75 1.25 1.75 2.25 2.75 3.25 3.75", // 16th note offbeats
  
  // Drum patterns
  kickSnare: "0 1 2 3",        // Basic kick on every beat
  house: "0 1 2 3",            // Four-on-the-floor kick
  jungle: "0 0.5 1 1.75 2 2.5 3 3.75", // Classic jungle/breakbeat
  hiphop: "0 1.66 2 3.66",     // Hip-hop beat
  trap: "0 0.5 1 2 2.5 3",     // Trap style
  
  // Rhythmic patterns
  waltz: "0 1 2",               // 3/4 time (waltz)
  tresillo: "0 1.33 2.66",      // Latin 3-2 pattern
  clave: "0 1.5 2.66 4 5.5",    // Son clave pattern
  chachacha: "0 1 1.5 2.5 3",   // Cha-cha-cha pattern
  swing: "0 0.66 1 1.66 2 2.66 3 3.66", // Swing rhythm
  
  // Experimental patterns
  sparse: "0 1.2 2.8",           // Sparse, irregular pattern
  fibonacci: "0 1 1.6 2.6 4.2",  // Based on Fibonacci sequence
  primes: "0 1.1 1.7 2.3 2.9 3.7", // Based on prime numbers
  golden: "0 0.618 1.618 2.618", // Based on golden ratio
  random: "0.12 0.87 1.32 1.94 2.41 3.67", // Random-sounding pattern
}; 