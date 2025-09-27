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
