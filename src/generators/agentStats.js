const BASE_SKILLS = ["JavaScript", "Python", "React", "Node.js"];
const MAJORS = ["Computer Science", "Software Engineering", "Data Science"];
const COMPANIES = ["Tech Corp", "StartupXYZ", "Big Tech Inc", "Innovation Labs"];
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

export function generateAgentStats(isStudent) {
  if (isStudent) {
    return {
      gpa: Math.random() * 2 + 2,
      skills: BASE_SKILLS.slice(0, Math.floor(Math.random() * 4) + 1),
      experience: Math.floor(Math.random() * 5),
      major: randomItem(MAJORS)
    };
  }

  return {
    company: randomItem(COMPANIES),
    position: randomItem(POSITIONS),
    requirements: BASE_SKILLS.slice(0, Math.floor(Math.random() * 3) + 1),
    experienceRequired: Math.floor(Math.random() * 5) + 1,
    lookingFor: {
      company: randomItem(COMPANIES),
      role: randomItem(POSITIONS),
      preferences: randomItem(PREFERENCES)
    }
  };
}
