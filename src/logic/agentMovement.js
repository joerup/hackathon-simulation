import { getAdjacentPositions, isValidPosition } from "../utils/gridUtils.js";

export function moveAgent(gameState, agent, newX, newY) {
  if (gameState.conversationState.isAgentInConversation(agent.id)) {
    return false;
  }

  if (!isValidPosition(gameState.size, newX, newY)) {
    return false;
  }

  if (gameState.grid[newY][newX].type !== "walkable") {
    return false;
  }

  const oldX = agent.x;
  const oldY = agent.y;

  gameState.grid[oldY][oldX] = {
    type: "walkable",
    agent: null,
    obstacle: null
  };

  gameState.grid[newY][newX] = {
    type: "agent",
    agent,
    obstacle: null
  };

  agent.position = [newX, newY];
  return true;
}

export function moveAgentRandomly(gameState, agent) {
  if (gameState.conversationState.isAgentInConversation(agent.id)) {
    return false;
  }

  const adjacentPositions = getAdjacentPositions(gameState.size, agent.x, agent.y);
  const walkablePositions = adjacentPositions.filter(pos =>
    gameState.grid[pos.y][pos.x].type === "walkable"
  );

  if (walkablePositions.length === 0) {
    return false;
  }

  const randomPosition = walkablePositions[Math.floor(Math.random() * walkablePositions.length)];
  return moveAgent(gameState, agent, randomPosition.x, randomPosition.y);
}
