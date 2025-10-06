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
