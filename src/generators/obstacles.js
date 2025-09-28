export function createObstacle(x, y, obstacleData = {}) {
  return {
    id: obstacleData.id || `obstacle_${x}_${y}`,
    x,
    y,
    ...obstacleData
  };
}

export const DEFAULT_OBSTACLE_POSITIONS = [
  { x: 2, y: 3 },
  { x: 4, y: 1 },
  { x: 7, y: 6 },
  { x: 1, y: 8 },
  { x: 8, y: 2 },
  { x: 5, y: 7 },
  { x: 3, y: 5 },
  { x: 9, y: 4 },
  { x: 6, y: 9 },
  { x: 0, y: 5 }
];
