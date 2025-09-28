/**
 * Interaction Scoring System
 * Calculates scores for student-recruiter interactions based on multiple factors
 */

/**
 * Personality types with their characteristics
 */
export const PERSONALITY_TYPES = {
  GENUINE: {
    name: 'genuine',
    baseMultiplier: 1.0,
    description: 'Authentic and straightforward communication'
  },
  SNARKY: {
    name: 'snarky',
    baseMultiplier: 0.8,  // Slightly negative base, but some recruiters prefer it
    description: 'Witty but potentially abrasive communication'
  },
  PROFESSIONAL: {
    name: 'professional',
    baseMultiplier: 1.1,
    description: 'Highly polished and corporate communication'
  },
  CASUAL: {
    name: 'casual',
    baseMultiplier: 0.9,
    description: 'Relaxed and informal communication style'
  }
};

/**
 * Company culture types that affect personality preferences
 */
const COMPANY_CULTURES = {
  'Jane Street': { prefers: 'snarky', weight: 1.4 },
  'Google': { prefers: 'professional', weight: 1.2 },
  'Netflix': { prefers: 'genuine', weight: 1.3 },
  'Stripe': { prefers: 'professional', weight: 1.1 },
  'Airbnb': { prefers: 'casual', weight: 1.2 },
  'Facebook': { prefers: 'professional', weight: 1.0 },
  'Amazon': { prefers: 'professional', weight: 1.1 },
  'Apple': { prefers: 'professional', weight: 1.2 },
  'Startup': { prefers: 'casual', weight: 1.1 },
  'Consulting': { prefers: 'professional', weight: 1.3 }
};

/**
 * Determine student personality based on experience and background
 */
export function determineStudentPersonality(student) {
  const { experience, stats } = student;
  
  // Get work experience indicators from stats
  const workExperience = stats?.internships || 0;
  const totalExperience = experience + workExperience;
  
  // Check if they have experience at specific companies that influence personality
  const previousCompanies = stats?.previousCompanies || [];
  
  // High-pressure finance/quant companies tend to make people more snarky
  const quantCompanies = ['Jane Street', 'Citadel', 'Two Sigma', 'D.E. Shaw'];
  const hasQuantExperience = previousCompanies.some(company => 
    quantCompanies.some(quant => company.toLowerCase().includes(quant.toLowerCase()))
  );
  
  if (hasQuantExperience) {
    return {
      type: PERSONALITY_TYPES.SNARKY,
      confidence: 0.8,
      reason: 'Experience at high-pressure quantitative firms'
    };
  }
  
  // High experience tends toward professional
  if (totalExperience >= 3) {
    return {
      type: PERSONALITY_TYPES.PROFESSIONAL,
      confidence: 0.7 + (totalExperience * 0.05),
      reason: 'High experience level'
    };
  }
  
  // Low experience with good GPA tends toward genuine
  if (totalExperience <= 1 && stats?.gpa >= 3.5) {
    return {
      type: PERSONALITY_TYPES.GENUINE,
      confidence: 0.6,
      reason: 'Low experience but strong academics'
    };
  }
  
  // Medium experience or mixed background tends toward casual
  return {
    type: PERSONALITY_TYPES.CASUAL,
    confidence: 0.5,
    reason: 'Moderate experience level'
  };
}

/**
 * Generate recruiter personality preferences based on their company/background
 */
export function generateRecruiterPreferences(recruiter) {
  const { stats } = recruiter;
  const company = stats?.company || 'Generic Corp';
  
  // Base preferences (all personalities have some baseline appeal)
  const preferences = {
    genuine: 0.7,
    snarky: 0.4,
    professional: 0.8,
    casual: 0.5
  };
  
  // Adjust based on company culture
  const culture = COMPANY_CULTURES[company] || { prefers: 'professional', weight: 1.0 };
  preferences[culture.prefers] *= culture.weight;
  
  // Add some randomness to make recruiters unique
  Object.keys(preferences).forEach(personality => {
    const variation = (Math.random() - 0.5) * 0.3; // ±15% variation
    preferences[personality] = Math.max(0.1, preferences[personality] + variation);
  });
  
  return {
    personalityWeights: preferences,
    preferredPersonality: culture.prefers,
    companyFactor: culture.weight
  };
}

/**
 * Calculate interaction score between student and recruiter
 */
export function calculateInteractionScore(student, recruiter, conversationData = {}) {
  const studentPersonality = determineStudentPersonality(student);
  const recruiterPrefs = generateRecruiterPreferences(recruiter);
  
  // Extract conversation metadata
  const conversationLength = conversationData.duration || 5000; // Default 5 seconds
  const messageCount = conversationData.messageCount || 3;
  
  // Calculate individual component scores (0-100 scale)
  const scores = {
    experience: calculateExperienceScore(student),
    networking: calculateNetworkingScore(student, recruiter, conversationLength),
    skills: calculateSkillsScore(student, recruiter),
    energy: calculateEnergyScore(student),
    luck: calculateLuckScore(),
    personality: calculatePersonalityScore(studentPersonality, recruiterPrefs)
  };
  
  // Component weights (should sum to 1.0)
  const weights = {
    experience: 0.2,
    networking: 0.2,
    skills: 0.25,
    energy: 0.1,
    luck: 0.15,
    personality: 0.1
  };
  
  // Calculate weighted score
  let totalScore = 0;
  Object.keys(scores).forEach(component => {
    totalScore += scores[component] * weights[component];
  });
  
  // Apply conversation quality multiplier
  const qualityMultiplier = Math.min(1.2, 1.0 + (messageCount - 1) * 0.05);
  totalScore *= qualityMultiplier;
  
  // Ensure score is within bounds
  totalScore = Math.max(0, Math.min(100, totalScore));
  
  return {
    totalScore: Math.round(totalScore * 10) / 10, // Round to 1 decimal
    componentScores: scores,
    weights,
    studentPersonality,
    recruiterPreferences: recruiterPrefs,
    conversationData: {
      length: conversationLength,
      messageCount,
      qualityMultiplier
    }
  };
}

/**
 * Calculate experience score (0-100)
 */
function calculateExperienceScore(student) {
  const baseExperience = student.experience || 0;
  const internships = student.stats?.internships || 0;
  const totalExperience = baseExperience + internships;
  
  // Experience score: 0-5 experience maps to 30-85 score
  const baseScore = Math.min(85, 30 + (totalExperience * 11));
  
  // Bonus for prestigious companies/experience
  const experienceBonus = (student.stats?.previousCompanies || []).length * 5;
  
  return Math.min(100, baseScore + experienceBonus);
}

/**
 * Calculate networking score (0-100)
 */
function calculateNetworkingScore(student, recruiter, conversationLength) {
  const baseNetworking = student.stats?.networking || student.networking || 0;
  
  // Base networking ability (0-5 maps to 20-70)
  let networkingScore = 20 + (baseNetworking * 10);
  
  // Conversation length bonus (longer conversations = better networking)
  const lengthBonus = Math.min(20, (conversationLength / 1000) * 2); // 2 points per second, max 20
  
  // Recruiter visibility factor (simulated - could be based on recruiter stats)
  const visibilityBonus = Math.random() * 10; // Random factor for recruiter's network reach
  
  return Math.min(100, networkingScore + lengthBonus + visibilityBonus);
}

/**
 * Calculate skills score (0-100)
 */
function calculateSkillsScore(student, recruiter) {
  const studentSkills = student.stats?.skills || [];
  const recruiterRequirements = recruiter.stats?.requirements || [];
  
  if (recruiterRequirements.length === 0) return 60; // Default if no requirements
  
  // Calculate skill match percentage
  const matchingSkills = studentSkills.filter(skill => 
    recruiterRequirements.includes(skill)
  );
  const matchPercentage = matchingSkills.length / recruiterRequirements.length;
  
  // Base score from match percentage (0-100%)
  let skillScore = matchPercentage * 70; // Max 70 from perfect match
  
  // Bonus for having more skills than required
  const skillOverflow = Math.max(0, studentSkills.length - recruiterRequirements.length);
  const overflowBonus = Math.min(15, skillOverflow * 3);
  
  // GPA bonus for academic performance
  const gpaBonus = Math.max(0, ((student.stats?.gpa || 3.0) - 3.0) * 10);
  
  return Math.min(100, skillScore + overflowBonus + gpaBonus);
}

/**
 * Calculate energy score (0-100)
 */
function calculateEnergyScore(student) {
  // Energy directly affects movement probability and conversation engagement
  const energyScore = student.stats?.energyScore || student.energy || 70;
  
  // Normalize to 0-100 scale (assuming energy is already 0-100)
  return Math.max(0, Math.min(100, energyScore));
}

/**
 * Calculate luck score (0-100)
 */
function calculateLuckScore() {
  // Pure randomness factor
  return Math.random() * 100;
}

/**
 * Calculate personality score (0-100)
 */
function calculatePersonalityScore(studentPersonality, recruiterPrefs) {
  const personalityType = studentPersonality.type.name;
  const recruiterWeight = recruiterPrefs.personalityWeights[personalityType] || 0.5;
  const confidence = studentPersonality.confidence;
  
  // Base score from recruiter preference (0-150, normalized to 0-100)
  const baseScore = Math.min(100, recruiterWeight * 100);
  
  // Confidence modifier: how well the student expresses their personality
  const confidenceModifier = 0.8 + (confidence * 0.4); // 0.8 to 1.2 multiplier
  
  return Math.min(100, baseScore * confidenceModifier);
}

/**
 * Create interaction record for storage
 */
export function createInteractionRecord(student, recruiter, scoreData, timestamp = Date.now()) {
  return {
    studentId: student.id,
    recruiterId: recruiter.id,
    timestamp,
    score: scoreData.totalScore,
    componentScores: scoreData.componentScores,
    studentPersonality: scoreData.studentPersonality,
    recruiterCompany: recruiter.stats?.company || 'Unknown',
    conversationLength: scoreData.conversationData.length,
    messageCount: scoreData.conversationData.messageCount,
    wasSuccessful: scoreData.totalScore >= 60 // Threshold for "success"
  };
}

/**
 * Determine if interaction results in job offer
 */
export function determineJobOffer(scoreData, student) {
  const { totalScore } = scoreData;
  
  // Base probability based on score
  let offerProbability = 0;
  
  if (totalScore >= 85) offerProbability = 0.4; // 40% chance for excellent score
  else if (totalScore >= 75) offerProbability = 0.2; // 20% chance for good score  
  else if (totalScore >= 65) offerProbability = 0.1; // 10% chance for decent score
  else offerProbability = 0.02; // 2% chance for poor score (lucky break)
  
  // Experience multiplier (more experienced students get offers easier)
  const experienceMultiplier = 1 + ((student.experience || 0) * 0.1);
  offerProbability *= experienceMultiplier;
  
  // Apply luck factor
  const luckFactor = (scoreData.componentScores.luck / 100) * 0.5 + 0.5; // 0.5 to 1.0 multiplier
  offerProbability *= luckFactor;
  
  return Math.random() < offerProbability;
}
