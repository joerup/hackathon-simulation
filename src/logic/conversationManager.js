import { findAgentAt, getAdjacentPositions } from "../utils/gridUtils.js";

export function checkForConversations(gameState) {
  const { agents, conversationState, grid, size } = gameState;

  for (const agent of agents) {
    if (conversationState.isAgentInConversation(agent.id) || agent.lastConvoCooldown > 0) {
      continue;
    }

    const neighbors = getAdjacentPositions(size, agent.x, agent.y);
    for (const neighbor of neighbors) {
      const otherAgent = findAgentAt(grid, size, neighbor.x, neighbor.y);

      if (
        otherAgent &&
        !conversationState.isAgentInConversation(otherAgent.id) &&
        otherAgent.lastConvoCooldown === 0
      ) {
        conversationState.createConversation(agent, otherAgent);

        grid[agent.y][agent.x].type = "agent";
        grid[otherAgent.y][otherAgent.x].type = "agent";
        break;
      }
    }
  }
}

export function handleConversations(gameState) {
  const { conversationState, frameCount } = gameState;

  conversationState.processConversations();
  conversationState.synchronizeAgentStates();

  if (frameCount % 60 === 0) {
    conversationState.cleanup();
  }
}
