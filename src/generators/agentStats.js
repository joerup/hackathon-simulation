const BASE_SKILLS = ["JavaScript", "Python", "React", "Node.js", "TypeScript", "SQL", "Java", "Go", "Rust", "C++"];
const MAJORS = ["Computer Science", "Software Engineering", "Data Science", "Information Systems", "Computer Engineering"];
const STUDENT_SUMMARIES = [
  "Full-stack student who thrives on hackathon sprints and rapid prototyping.",
  "Backend-focused engineer blending data pipelines with distributed systems side projects.",
  "Product-minded developer pairing UX empathy with scalable web architecture.",
  "Machine learning tinkerer combining research with automation in real-world projects."
];
const STUDENT_FIRST_NAMES = ["Avery", "Jordan", "Taylor", "Riley", "Morgan", "Casey", "Elliot", "Hayden", "Parker", "Quinn"];
const STUDENT_LAST_NAMES = ["Nguyen", "Patel", "Garcia", "O'Neil", "Kim", "Rivera", "Chen", "Johnson", "Williams", "Martinez"];
const RECRUITER_FIRST_NAMES = ["Alex", "Sam", "Jamie", "Harper", "Logan", "Emerson", "Drew", "Skyler", "Rowan", "Blake"];
const RECRUITER_LAST_NAMES = ["Brooks", "Henderson", "Lopez", "Mehta", "Fischer", "Khan", "Bennett", "Sawyer", "Diaz", "Coleman"];

const BUZZWORDS = [
  "cloud-native",
  "AI",
  "open source",
  "automation",
  "cross-functional",
  "microservices",
  "data-driven",
  "team leadership",
  "devops",
  "observability"
];

const COMPANIES = [
  "Jane Street", "Google", "Netflix", "Stripe", "Airbnb", 
  "Facebook", "Amazon", "Apple", "Microsoft", "Tesla",
  "Uber", "Lyft", "Palantir", "Databricks", "OpenAI",
  "Consulting", "Startup", "Tech Corp", "StartupXYZ", "Big Tech Inc", "Innovation Labs"
];

const PREVIOUS_COMPANIES = [
  "Jane Street", "Citadel", "Two Sigma", "D.E. Shaw", "Goldman Sachs",
  "Google", "Facebook", "Amazon", "Microsoft", "Apple", 
  "Netflix", "Uber", "Airbnb", "Stripe", "Palantir",
  "Local Startup", "Consulting Firm", "Research Lab"
];

const POSITIONS = ["Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer"];
const PREFERENCES = [
  "Looking for candidates with strong problem-solving skills",
  "Seeking developers with experience in modern frameworks",
  "Interested in candidates with leadership potential",
  "Want developers who can work in fast-paced environments",
  "Looking for team players with good communication skills"
];

function randomItem(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildFullName(firstNames, lastNames) {
  const first = randomItem(firstNames);
  const last = randomItem(lastNames);
  return `${first} ${last}`;
}

function pickSubset(pool, count) {
  if (!Array.isArray(pool) || pool.length === 0) return [];
  const available = [...pool];
  const selection = [];
  const limit = Math.min(count, available.length);
  for (let i = 0; i < limit; i++) {
    const index = randomInt(0, available.length - 1);
    selection.push(available[index]);
    available.splice(index, 1);
  }
  return selection;
}

function buildStudentStats() {
  const skillCount = randomInt(2, Math.min(5, BASE_SKILLS.length));
  const skills = pickSubset(BASE_SKILLS, skillCount);
  const skillDetails = skills.map(label => ({
    label,
    score: randomInt(55, 95)
  }));

  const internshipCount = randomInt(0, 3);
  const previousCompanies = internshipCount > 0 ? pickSubset(PREVIOUS_COMPANIES, Math.min(internshipCount, 2)) : [];

  return {
    name: buildFullName(STUDENT_FIRST_NAMES, STUDENT_LAST_NAMES),
    gpa: Number((Math.random() * 1.2 + 2.6).toFixed(2)),
    skills,
    skillsDetailed: skillDetails,
    experience: randomInt(0, 4),
    major: randomItem(MAJORS),
    networking: randomInt(0, 5),
    energyScore: randomInt(45, 95),
    luck: randomInt(25, 95),
    internships: internshipCount,
    previousCompanies: previousCompanies,
    buzzwords: pickSubset(BUZZWORDS, randomInt(1, 3)),
    summary: randomItem(STUDENT_SUMMARIES),
    fillerRatio: Number((Math.random() * 0.45).toFixed(2)),
    connections: 0,
    interactionHistory: [], // Track all interactions with scores
    totalInteractionScore: 0 // Sum of all interaction scores
  };
}

function buildRecruiterStats() {
  return {
    name: buildFullName(RECRUITER_FIRST_NAMES, RECRUITER_LAST_NAMES),
    company: randomItem(COMPANIES),
    position: randomItem(POSITIONS),
    requirements: pickSubset(BASE_SKILLS, randomInt(2, 4)),
    experienceRequired: randomInt(1, 5),
    lookingFor: {
      company: randomItem(COMPANIES),
      role: randomItem(POSITIONS),
      preferences: randomItem(PREFERENCES)
    },
    // Personality preferences are generated dynamically in interactionScoring.js
    // based on company culture, but we can store base preferences here
    personalityPreferences: {
      genuine: Number((Math.random() * 0.4 + 0.6).toFixed(2)), // 0.6-1.0
      snarky: Number((Math.random() * 0.6 + 0.2).toFixed(2)),  // 0.2-0.8
      professional: Number((Math.random() * 0.3 + 0.7).toFixed(2)), // 0.7-1.0
      casual: Number((Math.random() * 0.5 + 0.3).toFixed(2))   // 0.3-0.8
    },
    viewRadius: randomInt(2, 4) // How far the recruiter can "see" for networking score
  };
}

export function generateAgentStats(isStudent) {
  return isStudent ? buildStudentStats() : buildRecruiterStats();
}
