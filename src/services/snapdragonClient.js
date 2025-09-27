import { snapdragonConfig } from "../config.js";
import { generateDeterministicLuck } from "../utils/random.js";

export async function requestResumeStats(payload) {
  const { apiKey, apiUrl, model } = snapdragonConfig;

  if (!apiKey) {
    console.warn("LLM API key missing. Returning placeholder stats.");
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
          role: "System",
          content: "You are a helpful assistant."
        },
        {
          role: "User",
          content: `You are given a student resume. DO NOT MAKE ANY EXTERNAL CALLS. RESPOND ONLY IN TEXT. Read the resume and respond in the following format: \
          resume_data: {\
          summary (string)\\n \
          experience (integer)\\n\
          networking (integer)\\n\
          energyScore (integer 0-100)\\n\
          fillerRatio (number between 0 and 1)\\n\
          luck (integer 0-100)\\n\
          gpa(string or null)\\n\
          internships (integer)\\n\
          buzzwords (array of strings)\\n\
          skills (array of objects with label (string) and score (integer 0-100))\
          }\
          Do not make any tool calls. Resume data follows: ${payload.text}`
        }
      ],
      stream: false
    })
  });

  if (!response.ok) {
    const errorDetail = await safeReadError(response);
    throw new Error(`LLM API request failed (${response.status}): ${errorDetail}`);
  }

  const data = await response.json();
  const message = data?.choices?.[0]?.message;
  const rawContent = typeof message?.content === "string" ? message.content.trim() : "";
  const statsObject = parseResumeData(rawContent);

  return normalizeStats(statsObject, payload);
}

function parseResumeData(rawContent) {
  if (!rawContent) {
    throw new Error("LLM response was empty.");
  }

  const match = rawContent.match(/resume_data\s*:\s*({[\s\S]*})/i);
  let candidate = match ? match[1] : rawContent;
  candidate = candidate.trim();

  if (!candidate.startsWith('{')) {
    candidate = `{${candidate}`;
  }
  if (!candidate.endsWith('}')) {
    candidate = `${candidate}}`;
  }

  let parsed;
  try {
    parsed = JSON.parse(candidate);
  } catch (error) {
    let withQuotedKeys = candidate
      .replace(/([,{]\s*)([A-Za-z0-9_]+)\s*:/g, (full, prefix, key) => `${prefix}"${key}":`)
      .replace(/([0-9\]}"'])\s*(?="[A-Za-z0-9_]+"\s*:)/g, '$1,')
      .replace(/"score"\s*:\s*"([0-9]+(?:\.[0-9]+)?)"/gi, '"score": $1');

    try {
      parsed = JSON.parse(withQuotedKeys);
    } catch (innerError) {
      console.error("Failed to parse LLM response", { rawContent, candidate, withQuotedKeys, error: innerError });
      throw new Error("Unable to parse LLM response into structured data.");
    }
  }

  if (parsed && typeof parsed === "object" && parsed.resume_data) {
    return parsed.resume_data;
  }

  return parsed;
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
    summary: typeof rawStats.summary === "string" ? rawStats.summary : "",
    experience: coalesceNumber(rawStats.experience, rawStats.experienceScore, rawStats.experienceCount),
    networking: coalesceNumber(rawStats.networking, rawStats.networkingScore, rawStats.networkingCount),
    energyScore: coalesceNumber(rawStats.energyScore, rawStats.energy?.score),
    fillerRatio:
      typeof rawStats.fillerRatio === "number"
        ? clamp(rawStats.fillerRatio, 0, 1)
        : typeof rawStats.energy?.fillerRatio === "number"
        ? clamp(rawStats.energy.fillerRatio, 0, 1)
        : 0,
    luck: coalesceNumber(rawStats.luck, rawStats.luckScore),
    gpa: typeof rawStats.gpa === "string" ? rawStats.gpa : rawStats.gpa ?? null,
    internships: coalesceNumber(rawStats.internships, rawStats.internshipCount),
    buzzwords: Array.isArray(rawStats.buzzwords)
      ? rawStats.buzzwords.map(String)
      : [],
    skills: Array.isArray(rawStats.skills)
      ? rawStats.skills.map(normalizeSkill)
      : []
  };

  if (!normalized.luck && (payload?.text || payload?.fileName)) {
    normalized.luck = generateDeterministicLuck(payload.text || payload.fileName);
  }

  return normalized;
}

function normalizeSkill(skill) {
  if (!skill || typeof skill !== "object") {
    return { label: "Skill", score: 0 };
  }

  const label = typeof skill.label === "string" ? skill.label : skill.name || "Skill";
  const value = typeof skill.score === "number" && Number.isFinite(skill.score)
    ? skill.score
    : typeof skill.count === "number" && Number.isFinite(skill.count)
    ? skill.count
    : 0;

  return { label, score: value };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function createPlaceholderStats(payload) {
  const baseLuck = generateDeterministicLuck(payload?.text || payload?.fileName || Date.now().toString());

  return {
    summary: "LLM API key missing - replace with live response.",
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
