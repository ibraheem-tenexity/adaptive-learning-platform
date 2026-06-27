/**
 * Detect cycles in a directed graph using DFS.
 * Returns true if the graph has a cycle (invalid DAG).
 */
export function hasCycle(nodes: string[], edges: Array<{ from: string; to: string }>): boolean {
  const adj = new Map<string, string[]>();
  for (const node of nodes) adj.set(node, []);
  for (const { from, to } of edges) {
    adj.get(from)?.push(to);
  }

  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map<string, number>();
  for (const n of nodes) color.set(n, WHITE);

  function dfs(node: string): boolean {
    color.set(node, GRAY);
    for (const neighbor of (adj.get(node) || [])) {
      if (color.get(neighbor) === GRAY) return true;
      if (color.get(neighbor) === WHITE && dfs(neighbor)) return true;
    }
    color.set(node, BLACK);
    return false;
  }

  for (const node of nodes) {
    if (color.get(node) === WHITE && dfs(node)) return true;
  }
  return false;
}

/**
 * Topological sort (Kahn's algorithm).
 * Returns ordered node names, or throws if cycle detected.
 */
export function topologicalSort(nodes: string[], edges: Array<{ from: string; to: string }>): string[] {
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();
  for (const n of nodes) { inDegree.set(n, 0); adj.set(n, []); }
  for (const { from, to } of edges) {
    adj.get(from)!.push(to);
    inDegree.set(to, (inDegree.get(to) || 0) + 1);
  }

  const queue = nodes.filter(n => (inDegree.get(n) || 0) === 0);
  const result: string[] = [];

  while (queue.length > 0) {
    const node = queue.shift()!;
    result.push(node);
    for (const neighbor of (adj.get(node) || [])) {
      const deg = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, deg);
      if (deg === 0) queue.push(neighbor);
    }
  }

  if (result.length !== nodes.length) throw new Error('Cycle detected in skill DAG');
  return result;
}
