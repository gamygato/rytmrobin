// Debug utility for consistent logging throughout the application
const DEBUG_MODE = true;

/**
 * Debug logging utility 
 * @param {string} context - Context identifier for the log
 * @param {string} message - Message to log
 * @param {any[]} args - Additional arguments to log
 */
export const debug = (context, message, ...args) => {
  if (DEBUG_MODE) {
    console.log(`[${context}]`, message, ...args);
  }
};

/**
 * Enable debug mode
 */
export const enableDebug = () => {
  // This is already set to true, but kept for consistency with other modules
};

export default debug; 