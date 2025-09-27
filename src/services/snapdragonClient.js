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
    // Try to fix common formatting issues in LLM response
    let withQuotedKeys = candidate
      // Quote unquoted object keys
      .replace(/([,{]\s*)([A-Za-z0-9_]+)\s*:/g, (full, prefix, key) => `${prefix}"${key}":`)
      // Normalize whitespace - replace multiple spaces/newlines with single space
      .replace(/\s+/g, ' ')
      // Add missing commas after values before next property
      // This handles: "value" "nextKey": or 123 "nextKey": or ] "nextKey": or } "nextKey":
      .replace(/("(?:[^"\\]|\\.)*"|(?:\d+(?:\.\d+)?)|(?:\])|(?:\})|(?:true)|(?:false)|(?:null))\s+("[\w_]+"\s*:)/g, '$1, $2')
      // Fix cases where comma is missing after array/object closing brackets
      .replace(/(\]|\})\s*("[\w_]+"\s*:)/g, '$1, $2')
      // Clean up any double commas that might have been introduced
      .replace(/,\s*,/g, ',')
      // Fix numeric scores that got quoted
      .replace(/"score"\s*:\s*"(\d+(?:\.\d+)?)"/gi, '"score": $1')
      // Ensure proper spacing around colons and commas
      .replace(/"\s*:\s*/g, '": ')
      .replace(/,\s*/g, ', ');

    try {
      parsed = JSON.parse(withQuotedKeys);
    } catch (innerError) {
      // Last resort: try to manually parse the JavaScript object-like syntax
      try {
        parsed = parseJavaScriptObjectLiteral(candidate);
      } catch (finalError) {
        console.error("Failed to parse LLM response", { 
          rawContent, 
          candidate, 
          withQuotedKeys, 
          error: innerError,
          finalError 
        });
        throw new Error("Unable to parse LLM response into structured data.");
      }
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

/**
 * Parse JavaScript object literal syntax as a fallback when JSON.parse fails
 * This handles cases where the LLM returns object syntax without proper JSON formatting
 */
function parseJavaScriptObjectLiteral(objStr) {
  try {
    // Remove the outer braces and clean up
    let content = objStr.trim();
    if (content.startsWith('{')) content = content.slice(1);
    if (content.endsWith('}')) content = content.slice(0, -1);
    
    const result = {};
    let i = 0;
    
    while (i < content.length) {
      // Skip whitespace and newlines
      while (i < content.length && /\s/.test(content[i])) i++;
      if (i >= content.length) break;
      
      // Parse property name
      let propName = '';
      if (content[i] === '"' || content[i] === "'") {
        const quote = content[i++];
        while (i < content.length && content[i] !== quote) {
          propName += content[i++];
        }
        i++; // Skip closing quote
      } else {
        while (i < content.length && /[a-zA-Z0-9_]/.test(content[i])) {
          propName += content[i++];
        }
      }
      
      // Skip whitespace and colon
      while (i < content.length && /\s/.test(content[i])) i++;
      if (i < content.length && content[i] === ':') i++;
      while (i < content.length && /\s/.test(content[i])) i++;
      
      // Parse property value
      let value;
      if (content[i] === '"') {
        // String value
        i++; // Skip opening quote
        value = '';
        while (i < content.length && content[i] !== '"') {
          if (content[i] === '\\' && i + 1 < content.length) {
            i++; // Skip escape character
            value += content[i++];
          } else {
            value += content[i++];
          }
        }
        i++; // Skip closing quote
      } else if (content[i] === '[') {
        // Array value
        const arrayStart = i;
        let bracketCount = 0;
        do {
          if (content[i] === '[') bracketCount++;
          if (content[i] === ']') bracketCount--;
          i++;
        } while (i < content.length && bracketCount > 0);
        
        const arrayStr = content.slice(arrayStart, i);
        try {
          // Fix common array formatting issues and try to parse as JSON
          const fixedArrayStr = arrayStr
            // Quote unquoted object keys within the array
            .replace(/([a-zA-Z0-9_]+)\s*:/g, '"$1":')
            // Add missing commas between array elements (handle objects and strings)
            .replace(/(\})\s*\n\s*(\{)/g, '$1,$2')
            .replace(/("(?:[^"\\]|\\.)*")\s*\n\s*(\{|")/g, '$1,$2')
            .replace(/(\d+(?:\.\d+)?)\s*\n\s*(\{|")/g, '$1,$2');
          
          value = JSON.parse(fixedArrayStr);
        } catch (parseError) {
          // Enhanced fallback: parse arrays manually
          value = parseArrayManually(arrayStr);
        }
      } else {
        // Number, boolean, or null
        let valueStr = '';
        while (i < content.length && !/[,\n\r}]/.test(content[i])) {
          valueStr += content[i++];
        }
        valueStr = valueStr.trim();
        
        if (valueStr === 'null') value = null;
        else if (valueStr === 'true') value = true;
        else if (valueStr === 'false') value = false;
        else if (/^\d+(\.\d+)?$/.test(valueStr)) value = parseFloat(valueStr);
        else value = valueStr;
      }
      
      result[propName] = value;
      
      // Skip comma and whitespace
      while (i < content.length && /[\s,\n\r]/.test(content[i])) i++;
    }
    
    return result;
  } catch (error) {
    throw new Error(`JavaScript object literal parsing failed: ${error.message}`);
  }
}

/**
 * Parse array manually when JSON.parse fails
 */
function parseArrayManually(arrayStr) {
  try {
    // Remove brackets and clean up
    let content = arrayStr.trim();
    if (content.startsWith('[')) content = content.slice(1);
    if (content.endsWith(']')) content = content.slice(0, -1);
    content = content.trim();
    
    if (!content) return [];
    
    const result = [];
    let i = 0;
    
    while (i < content.length) {
      // Skip whitespace and newlines
      while (i < content.length && /\s/.test(content[i])) i++;
      if (i >= content.length) break;
      
      let element;
      
      if (content[i] === '"') {
        // String element
        i++; // Skip opening quote
        element = '';
        while (i < content.length && content[i] !== '"') {
          if (content[i] === '\\' && i + 1 < content.length) {
            i++; // Skip escape character
            element += content[i++];
          } else {
            element += content[i++];
          }
        }
        i++; // Skip closing quote
      } else if (content[i] === '{') {
        // Object element
        const objStart = i;
        let braceCount = 0;
        do {
          if (content[i] === '{') braceCount++;
          if (content[i] === '}') braceCount--;
          i++;
        } while (i < content.length && braceCount > 0);
        
        const objStr = content.slice(objStart, i);
        try {
          // Try to parse the object
          element = parseJavaScriptObjectLiteral(objStr);
        } catch {
          element = {};
        }
      } else {
        // Number, boolean, or other primitive
        let valueStr = '';
        while (i < content.length && !/[,\n\r\]}]/.test(content[i])) {
          valueStr += content[i++];
        }
        valueStr = valueStr.trim();
        
        if (valueStr === 'null') element = null;
        else if (valueStr === 'true') element = true;
        else if (valueStr === 'false') element = false;
        else if (/^\d+(\.\d+)?$/.test(valueStr)) element = parseFloat(valueStr);
        else element = valueStr;
      }
      
      result.push(element);
      
      // Skip comma and whitespace
      while (i < content.length && /[\s,\n\r]/.test(content[i])) i++;
    }
    
    return result;
  } catch (error) {
    console.warn('Manual array parsing failed:', error.message);
    return [];
  }
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
