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
          content: "You are a resume analysis assistant. Create a concise, professional summary of the candidate based on their resume. Focus on key skills, experience, and qualifications. Keep it under 150 words."
        },
        {
          role: "User",
          content: payload.text ? `Please create a professional summary for this resume:\n\n${payload.text}` : "No resume text provided."
        }
      ],
      stream: false
    })
  });

  if (!response.ok) {
    const errorDetail = await safeReadError(response);
    throw new Error(`LLM API request failed (${response.status}): ${errorDetail}`);
  }

  // Process the LLM response to get the professional summary
  const data = await response.json();
  const message = data?.choices?.[0]?.message;
  const llmSummary = message?.content || "";

  // Return stats with LLM-generated summary, fallback to extracted text if needed
  return {
    summary: llmSummary || payload?.text || "No text could be extracted from the resume.",
    experience: 5,
    networking: 3,
    energyScore: 75,
    fillerRatio: 0.2,
    luck: generateDeterministicLuck(payload?.text || "default"),
    gpa: null,
    internships: 1,
    buzzwords: ["AI", "Python"],
    skills: [{ label: "Communication", count: 1 }]
  };
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

  // Create a basic summary from extracted text if available
  let summary;
  if (payload?.text && payload.text.trim()) {
    const previewText = payload.text.substring(0, 300).replace(/\s+/g, ' ').trim();
    summary = `Resume Preview: ${previewText}${payload.text.length > 300 ? '...' : ''}\n\n(Note: LLM API key missing - showing raw extracted text)`;
  } else {
    summary = "No text could be extracted from the resume. (LLM API key missing)";
  }

  return {
    summary,
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
