import { fetchAPI } from './api.config';

export interface ThoughtNode {
  elementId: string;
  text: string;
  createdAt: string;
}

export interface ThoughtRelationship {
  elementId: string;
  fromElementId: string;
  toElementId: string;
  type: 'BRANCHES_TO';
}

export interface CreateNodePayload {
  text: string;
}

export interface CreateRelationshipPayload {
  fromElementId: string;
  toElementId: string;
  type: 'BRANCHES_TO';
}

export interface UpdateNodePayload {
  text: string;
}

export interface GraphResponse {
  nodes: ThoughtNode[];
  relationships: ThoughtRelationship[];
}

// Create a new thought node
export async function createNode(payload: CreateNodePayload): Promise<ThoughtNode> {
  return fetchAPI<ThoughtNode>('/nodes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// Get a node by elementId
export async function getNode(elementId: string): Promise<ThoughtNode> {
  return fetchAPI<ThoughtNode>(`/nodes/${encodeURIComponent(elementId)}`);
}

// Update a node by elementId
export async function updateNode(
  elementId: string,
  payload: UpdateNodePayload
): Promise<ThoughtNode> {
  return fetchAPI<ThoughtNode>(`/nodes/${encodeURIComponent(elementId)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

// Delete a node by elementId
export async function deleteNode(elementId: string): Promise<void> {
  return fetchAPI<void>(`/nodes/${encodeURIComponent(elementId)}`, {
    method: 'DELETE',
  });
}

// Create a relationship between two nodes
export async function createRelationship(
  payload: CreateRelationshipPayload
): Promise<ThoughtRelationship> {
  return fetchAPI<ThoughtRelationship>('/relationships', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// Get all relationships for a node (outgoing)
export async function getNodeRelationships(
  elementId: string
): Promise<ThoughtRelationship[]> {
  return fetchAPI<ThoughtRelationship[]>(
    `/nodes/${encodeURIComponent(elementId)}/relationships`
  );
}

// Delete a relationship by elementId
export async function deleteRelationship(elementId: string): Promise<void> {
  return fetchAPI<void>(`/relationships/${encodeURIComponent(elementId)}`, {
    method: 'DELETE',
  });
}

// Get a node and its children (one level deep)
export async function getNodeWithChildren(elementId: string): Promise<GraphResponse> {
  return fetchAPI<GraphResponse>(`/nodes/${encodeURIComponent(elementId)}/graph`);
}

// Get all root nodes (nodes with no incoming relationships)
export async function getRootNodes(): Promise<ThoughtNode[]> {
  return fetchAPI<ThoughtNode[]>('/nodes/roots');
}

// Get the full graph starting from a node
export async function getFullGraph(elementId: string): Promise<GraphResponse> {
  return fetchAPI<GraphResponse>(`/nodes/${encodeURIComponent(elementId)}/graph/full`);
}

// Search nodes by text
export async function searchNodes(query: string): Promise<ThoughtNode[]> {
  return fetchAPI<ThoughtNode[]>(`/nodes/search?q=${encodeURIComponent(query)}`);
}
