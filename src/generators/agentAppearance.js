const SKIN_TONES = ["#f9d7b9", "#f4c6a5", "#e6b189", "#d29b6d", "#b2784e", "#8d5524"];
const STUDENT_SHIRT_PALETTE = ["#ffadad", "#ffd6a5", "#fdffb6", "#caffbf", "#9bf6ff", "#a0c4ff", "#bdb2ff", "#ffc6ff", "#f7b267", "#f48498", "#84dccf", "#95b8d1"];
const RECRUITER_SHIRT_PALETTE = ["#6c8ed4", "#4e6bb1", "#3f5d8b", "#889bb7", "#b0c4de"];
const STUDENT_HAIR_STYLES = ["beanie", "curly", "pigtails", "bob", "spiky", "afro", "ponytail", "buzz"];
const RECRUITER_HAIR_STYLES = ["sidepart", "slick", "short"];
const HAIR_COLORS = ["#2b1b10", "#3f2a1a", "#5a3825", "#704214", "#a55728", "#d08159", "#f5e1a4", "#2d4370", "#4b2b5c", "#1f1f1f"];
const STUDENT_BODY_SCALES = [0.85, 0.95, 1, 1.08, 1.15];
const RECRUITER_BODY_SCALES = [0.95, 1, 1.05];
const ACCENT_COLORS = ["#ffe066", "#ff6b6b", "#4ecdc4", "#48bfe3", "#e599f7", "#ffd166", "#c77dff"];
const FACE_ACCESSORIES = ["none", "freckles", "rosyCheeks", "glasses"];
const EYE_SHAPES = ["round", "oval", "wide"];
const MOUTH_STYLES = ["flat", "smile", "open"];

function pickRandom(options) {
  return options[Math.floor(Math.random() * options.length)];
}

export function generateAgentAppearance(isStudent) {
  const appearance = {
    skinTone: pickRandom(SKIN_TONES),
    shirtColor: pickRandom(isStudent ? STUDENT_SHIRT_PALETTE : RECRUITER_SHIRT_PALETTE),
    hairStyle: pickRandom(isStudent ? STUDENT_HAIR_STYLES : RECRUITER_HAIR_STYLES),
    hairColor: pickRandom(HAIR_COLORS),
    bodyScale: pickRandom(isStudent ? STUDENT_BODY_SCALES : RECRUITER_BODY_SCALES),
    accentColor: pickRandom(ACCENT_COLORS)
  };

  appearance.faceAccessory = pickRandom(FACE_ACCESSORIES);
  appearance.eyeShape = pickRandom(EYE_SHAPES);
  appearance.mouth = pickRandom(MOUTH_STYLES);

  const accentChance = isStudent ? 0.75 : 0.45;
  appearance.hasAccent = Math.random() < accentChance || appearance.hairStyle === "beanie";

  return appearance;
}
