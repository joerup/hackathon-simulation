export function isValidPosition(size, x, y) {
  return x >= 0 && x < size && y >= 0 && y < size;
}

export function getAdjacentPositions(size, x, y) {
  const positions = [
    { x, y: y - 1 },
    { x, y: y + 1 },
    { x: x - 1, y },
    { x: x + 1, y }
  ];

  return positions.filter(pos => isValidPosition(size, pos.x, pos.y));
}

export function findAgentAt(grid, size, x, y) {
  if (!isValidPosition(size, x, y)) {
    return null;
  }

  const cell = grid[y][x];
  return cell.type === 'agent' ? cell.agent : null;
}
