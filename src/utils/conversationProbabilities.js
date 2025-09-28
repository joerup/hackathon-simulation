/**
 * Utilities for calculating probabilistic conversation endings
 */

/**
 * Calculate the probability that a conversation should end based on message count and conversation type
 * @param {number} messageCount - Current number of messages in the conversation
 * @param {string} conversationType - Type of conversation ('student-student', 'recruiter-recruiter', 'student-recruiter')
 * @param {boolean} isRecruiter - Whether the current speaker is a recruiter (only relevant for s-r conversations)
 * @returns {number} Probability between 0 and 1 that the conversation should end
 */
export function calculateEndingProbability(messageCount, conversationType, isRecruiter = false) {
  // Base probabilities and curves for different conversation types
  let baseProbability = 0;
  let probabilityGrowthRate = 0;
  let maxProbability = 0.9; // Never go to 100% to allow for some randomness
  
  switch (conversationType) {
    case 'student-student':
      // Quick, casual conversations - should end after 3-5 messages
      baseProbability = messageCount <= 2 ? 0 : 0.1;
      probabilityGrowthRate = 0.3; // Aggressive growth
      break;
      
    case 'recruiter-recruiter':
      // Professional small talk - should end after 4-6 messages
      baseProbability = messageCount <= 3 ? 0 : 0.05;
      probabilityGrowthRate = 0.25;
      break;
      
    case 'student-recruiter':
      // Only recruiters can end these conversations
      if (!isRecruiter) {
        return 0; // Students cannot end s-r conversations
      }
      // Interview-style conversations - should end after 6-10 messages
      baseProbability = messageCount <= 5 ? 0 : 0.1;
      probabilityGrowthRate = 0.2; // Slower growth, longer conversations
      break;
      
    default:
      // Fallback for unknown conversation types
      baseProbability = messageCount <= 2 ? 0 : 0.1;
      probabilityGrowthRate = 0.2;
  }
  
  // Calculate probability using exponential growth
  const probability = baseProbability + (1 - baseProbability) * (1 - Math.exp(-probabilityGrowthRate * (messageCount - 1)));
  
  // Cap at maximum probability
  return Math.min(probability, maxProbability);
}

/**
 * Determine if a conversation should end based on probabilistic calculation
 * @param {number} messageCount - Current number of messages in the conversation
 * @param {string} conversationType - Type of conversation
 * @param {boolean} isRecruiter - Whether the current speaker is a recruiter
 * @returns {boolean} Whether the conversation should end
 */
export function shouldConversationEnd(messageCount, conversationType, isRecruiter = false) {
  const probability = calculateEndingProbability(messageCount, conversationType, isRecruiter);
  const randomValue = Math.random();
  
  const shouldEnd = randomValue < probability;
  
  console.log(`🎯 [PROBABILITY] Conversation ending check: ${messageCount} messages, ${conversationType}, ${isRecruiter ? 'recruiter' : 'non-recruiter'} speaking | Probability: ${(probability * 100).toFixed(1)}%, Random: ${(randomValue * 100).toFixed(1)}% | ${shouldEnd ? 'ENDING' : 'CONTINUING'}`);
  
  return shouldEnd;
}

/**
 * Get conversation ending guidance for LLM prompts based on conversation state
 * @param {number} messageCount - Current number of messages
 * @param {string} conversationType - Type of conversation
 * @param {boolean} isRecruiter - Whether the current speaker is a recruiter
 * @returns {string} Guidance text to include in LLM prompts
 */
export function getEndingGuidance(messageCount, conversationType, isRecruiter = false) {
  const probability = calculateEndingProbability(messageCount, conversationType, isRecruiter);
  
  if (probability === 0) {
    return "Keep the conversation going naturally.";
  }
  
  let guidance = "";
  
  if (conversationType === 'student-recruiter') {
    if (isRecruiter) {
      if (messageCount >= 6) {
        guidance = "You should wrap up the interview soon and make your hiring decision. Say you want to 'offer' them the position or 'decline'.";
      } else if (messageCount >= 4) {
        guidance = "Consider whether you have enough information to make a hiring decision. If so, conclude by saying 'offer' or 'unfortunately we'll pass'.";
      } else {
        guidance = "Continue the interview to gather more information about the candidate.";
      }
    } else {
      guidance = "Answer the recruiter's questions thoroughly and professionally.";
    }
  } else {
    // For s-s and r-r conversations, either party can end
    if (probability > 0.7) {
      guidance = "This conversation has gone on long enough. Consider ending it naturally with [end].";
    } else if (probability > 0.4) {
      guidance = "The conversation could naturally end soon. Look for a good stopping point and use [end] if appropriate.";
    } else if (probability > 0.1) {
      guidance = "Continue the conversation but keep it concise.";
    } else {
      guidance = "Keep the conversation going naturally.";
    }
  }
  
  return guidance;
}

/**
 * Force conversation ending thresholds - absolute limits to prevent infinite conversations
 * @param {number} messageCount - Current number of messages
 * @param {string} conversationType - Type of conversation
 * @returns {boolean} Whether to force the conversation to end regardless of probability
 */
export function shouldForceEnd(messageCount, conversationType) {
  const limits = {
    'student-student': 8,     // Force end after 8 messages
    'recruiter-recruiter': 10, // Force end after 10 messages
    'student-recruiter': 15    // Force end after 15 messages (longer interviews)
  };
  
  const limit = limits[conversationType] || 10;
  
  if (messageCount >= limit) {
    console.log(`🚨 [FORCE END] Conversation reached limit of ${limit} messages (${messageCount} total). Forcing end.`);
    return true;
  }
  
  return false;
}
