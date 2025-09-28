const hasProcess = typeof process !== "undefined" && process?.env;

const snapdragonDefaults = {
  apiKey: hasProcess ? process.env.SNAPDRAGON_API_KEY || "" : "",
  apiUrl: hasProcess ? process.env.SNAPDRAGON_API_URL || "https://api.snapdragon.ai/v1/chat/completions" : "https://api.snapdragon.ai/v1/chat/completions",
  model: hasProcess ? process.env.SNAPDRAGON_MODEL || "snapdragon-llm-latest" : "snapdragon-llm-latest"
};

export const snapdragonConfig = { ...snapdragonDefaults };

export function setSnapdragonConfig(partial) {
  Object.assign(snapdragonConfig, partial);
}

// Game speed configuration
export const gameSpeedConfig = {
  speeds: [
    { label: "0.25x", multiplier: 0.25, delay: 4000 },
    { label: "0.5x", multiplier: 0.5, delay: 2000 },
    { label: "0.75x", multiplier: 0.75, delay: 1333 },
    { label: "1x", multiplier: 1, delay: 1000 },
    { label: "1.25x", multiplier: 1.25, delay: 800 },
    { label: "1.5x", multiplier: 1.5, delay: 667 },
    { label: "2x", multiplier: 2, delay: 500 },
    { label: "2.5x", multiplier: 2.5, delay: 400 },
    { label: "3x", multiplier: 3, delay: 333 },
    { label: "4x", multiplier: 4, delay: 250 },
    { label: "5x", multiplier: 5, delay: 200 },
    { label: "6x", multiplier: 6, delay: 167 },
    { label: "7x", multiplier: 7, delay: 143 },
    { label: "8x", multiplier: 8, delay: 125 },
    { label: "10x", multiplier: 10, delay: 100 },
    { label: "12x", multiplier: 12, delay: 83 },
    { label: "15x", multiplier: 15, delay: 67 },
    { label: "20x", multiplier: 20, delay: 50 },
    { label: "25x", multiplier: 25, delay: 40 },
    { label: "30x", multiplier: 30, delay: 33 },
    { label: "35x", multiplier: 35, delay: 29 },
    { label: "40x", multiplier: 40, delay: 25 },
    { label: "45x", multiplier: 45, delay: 22 },
    { label: "50x", multiplier: 50, delay: 20 }
  ],
  defaultSpeedIndex: 6
};

let currentSpeedIndex = gameSpeedConfig.defaultSpeedIndex;

export function getCurrentSpeed() {
  return gameSpeedConfig.speeds[currentSpeedIndex];
}

export function setCurrentSpeedIndex(index) {
  if (index >= 0 && index < gameSpeedConfig.speeds.length) {
    currentSpeedIndex = index;
    return true;
  }
  return false;
}

export function getCurrentSpeedIndex() {
  return currentSpeedIndex;
}
