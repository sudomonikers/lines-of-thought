// Mock Neo4j types for development

export interface GraphNode {
  elementId: string;
  text: string;
  createdAt: string;
}

export interface GraphRelationship {
  elementId: string;
  fromElementId: string;
  toElementId: string;
  type: 'BRANCHES_TO';
  perspective?: string | null;
}

export interface GraphData {
  nodes: Map<string, GraphNode>;
  relationships: GraphRelationship[];
}

// Mock data generator
export function createMockGraph(): GraphData {
  const nodes = new Map<string, GraphNode>();

  // Root thought
  nodes.set('1', {
    elementId: '1',
    text: 'What is consciousness?',
    createdAt: new Date().toISOString(),
  });

  // First level branches
  nodes.set('2', {
    elementId: '2',
    text: 'Is it an emergent property of complex systems?',
    createdAt: new Date().toISOString(),
  });

  nodes.set('3', {
    elementId: '3',
    text: 'Or is it something fundamental to the universe?',
    createdAt: new Date().toISOString(),
  });

  // Second level branches from node 2
  nodes.set('4', {
    elementId: '4',
    text: 'How complex does a system need to be?',
    createdAt: new Date().toISOString(),
  });

  nodes.set('5', {
    elementId: '5',
    text: 'Could AI become conscious?',
    createdAt: new Date().toISOString(),
  });

  // Second level branch from node 3
  nodes.set('6', {
    elementId: '6',
    text: 'Panpsychism suggests everything has some level of consciousness',
    createdAt: new Date().toISOString(),
  });

  const relationships: GraphRelationship[] = [
    { elementId: 'r1', fromElementId: '1', toElementId: '2', type: 'BRANCHES_TO' },
    { elementId: 'r2', fromElementId: '1', toElementId: '3', type: 'BRANCHES_TO' },
    { elementId: 'r3', fromElementId: '2', toElementId: '4', type: 'BRANCHES_TO' },
    { elementId: 'r4', fromElementId: '2', toElementId: '5', type: 'BRANCHES_TO' },
    { elementId: 'r5', fromElementId: '3', toElementId: '6', type: 'BRANCHES_TO' },
  ];

  return { nodes, relationships };
}

// Helper to get child nodes for a given node elementId
export function getChildNodes(elementId: string, graph: GraphData): GraphNode[] {
  const childIds = graph.relationships
    .filter(rel => rel.fromElementId === elementId)
    .map(rel => rel.toElementId);

  return childIds
    .map(id => graph.nodes.get(id))
    .filter((node): node is GraphNode => node !== undefined);
}

// Helper to get parent node for a given node elementId
export function getParentNode(elementId: string, graph: GraphData): GraphNode | null {
  const parentRel = graph.relationships.find(rel => rel.toElementId === elementId);
  if (!parentRel) return null;

  return graph.nodes.get(parentRel.fromElementId) || null;
}

// Helper to get child relationships for a given node elementId
export function getChildRelationships(elementId: string, graph: GraphData): GraphRelationship[] {
  return graph.relationships.filter(rel => rel.fromElementId === elementId);
}
