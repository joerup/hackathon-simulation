import { snapdragonConfig } from "../config.js";
import { generateDeterministicLuck } from "../utils/random.js";

export async function requestResumeStats(payload) {
  const { apiKey, apiUrl, model } = snapdragonConfig;

  if (!apiKey) {
    console.warn("SnapDragon API key missing. Returning placeholder stats.");
    return createPlaceholderStats(payload);
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: "You are an analyst that converts student resumes into RPG stats for a job hunt simulation. Respond with JSON only."
        },
        {
          role: "user",
          content: buildResumePrompt(payload)
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2
    })
  });

  if (!response.ok) {
    const errorDetail = await safeReadError(response);
    throw new Error(`SnapDragon request failed (${response.status}): ${errorDetail}`);
  }

  const data = await response.json();
  const message = data?.choices?.[0]?.message;
  let parsed = message?.parsed;

  if (!parsed && message?.content) {
    try {
      parsed = JSON.parse(message.content);
    } catch (error) {
      console.warn("Failed to parse SnapDragon JSON response", error);
    }
  }

  if (!parsed) {
    throw new Error("SnapDragon response missing JSON payload");
  }

  return normalizeStats(parsed, payload);
}

function buildResumePrompt(payload) {
  if (payload.base64) {
    return `Analyze this resume file (base64 encoded). Return JSON with keys: summary, experience, networking, energyScore, fillerRatio, luck, gpa, internships, buzzwords (array), skills (array of {"label","score"}). Base64: ${payload.base64}`;
  }

  return `Analyze this resume text and respond with JSON using fields: summary, experience, networking, energyScore, fillerRatio, luck, gpa, internships, buzzwords (array), skills (array of {"label","score"}). Resume text: ${payload.text}`;
}

function normalizeStats(rawStats, payload) {
  const coalesceNumber = (...values) => {
    for (const value of values) {
      if (typeof value === "number" && Number.isFinite(value)) {
        return value;
      }
    }
    return 0;
  };

  const normalized = {
    summary: rawStats.summary || rawStats.overview || "",
    experience: coalesceNumber(rawStats.experience, rawStats.experienceScore, rawStats.experienceCount),
    networking: coalesceNumber(rawStats.networking, rawStats.networkingScore, rawStats.networkingCount),
    energyScore: coalesceNumber(rawStats.energyScore, rawStats.energy?.score),
    fillerRatio: typeof rawStats.fillerRatio === "number" ? rawStats.fillerRatio : rawStats.energy?.fillerRatio,
    luck: coalesceNumber(rawStats.luck, rawStats.luckScore),
    gpa: rawStats.gpa ?? rawStats.gpaValue ?? null,
    internships: coalesceNumber(rawStats.internships, rawStats.internshipCount),
    buzzwords: Array.isArray(rawStats.buzzwords) ? rawStats.buzzwords : [],
    skills: Array.isArray(rawStats.skills)
      ? rawStats.skills
      : Array.isArray(rawStats.skillMatches)
      ? rawStats.skillMatches
      : []
  };

  if (!normalized.luck && (payload?.text || payload?.fileName)) {
    normalized.luck = generateDeterministicLuck(payload.text || payload.fileName);
  }

  return normalized;
}

function createPlaceholderStats(payload) {
  const baseLuck = generateDeterministicLuck(payload?.text || payload?.fileName || Date.now().toString());

  return {
    summary: "SnapDragon API key missing - replace with live response.",
    experience: 0,
    networking: 0,
    energyScore: 50,
    fillerRatio: 0.4,
    luck: baseLuck,
    gpa: null,
    internships: 0,
    buzzwords: [],
    skills: []
  };
}

async function safeReadError(response) {
  try {
    const text = await response.text();
    return text.slice(0, 400) || "no response body";
  } catch (error) {
    return "unable to read error body";
  }
}
