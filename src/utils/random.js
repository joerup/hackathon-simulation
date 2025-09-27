export function generateDeterministicLuck(seedText) {
  if (!seedText) {
    return Math.floor(Math.random() * 101);
  }

  let hash = 0;
  for (let i = 0; i < seedText.length; i += 1) {
    hash = (hash << 5) - hash + seedText.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash % 101);
}
