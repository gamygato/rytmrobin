// A simplified sample manager for testing without Tone.js dependencies

// Sample library
const sampleLibrary = {};

// Load a sample (dummy implementation)
export const loadSample = async (name, url) => {
  console.log(`Loading sample ${name} from ${url}`);
  // Simply store the URL in our library for now
  sampleLibrary[name] = url;
  return true;
};

// Preload default samples
export const preloadDefaultSamples = async () => {
  const defaultSamples = [
    { name: 'kick', url: '/samples/bd.wav' },
    { name: 'snare', url: '/samples/sd.wav' },
    { name: 'hihat', url: '/samples/hh.wav' },
    { name: 'clap', url: '/samples/cp.wav' },
    { name: 'tom', url: '/samples/tom.wav' },
    { name: 'rim', url: '/samples/rim.wav' },
    { name: 'cowbell', url: '/samples/cowbell.wav' },
    { name: 'perc', url: '/samples/perc.wav' }
  ];
  
  console.log('Preloading sample library...');
  
  // Just load the sample names for the UI
  defaultSamples.forEach(sample => {
    sampleLibrary[sample.name] = sample.url;
  });
  
  return true;
};

// Get a loaded sample
export const getSample = (name) => {
  return sampleLibrary[name];
};

// Get all available sample names
export const getAvailableSamples = () => {
  return Object.keys(sampleLibrary);
}; 