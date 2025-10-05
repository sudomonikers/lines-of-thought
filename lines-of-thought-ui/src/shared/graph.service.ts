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
  perspective?: string | null;
}

export interface CreateNodePayload {
  text: string;
  isParent?: boolean;
}

export interface CreateRelationshipPayload {
  fromElementId: string;
  toElementId: string;
  type: 'BRANCHES_TO';
  perspective?: string | null;
}

export interface GraphResponse {
  nodes: ThoughtNode[];
  relationships: ThoughtRelationship[];
}

export interface PaginatedNodesResponse {
  nodes: ThoughtNode[];
  total: number;
  limit: number;
  skip: number;
  hasMore: boolean;
}

// Create a new thought node
export async function createNode(payload: CreateNodePayload): Promise<ThoughtNode> {
  return fetchAPI<ThoughtNode>('/nodes', {
    method: 'POST',
    body: JSON.stringify(payload),
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

// Get a node and its children (one level deep)
export async function getNodeWithChildren(elementId: string): Promise<GraphResponse> {
  return fetchAPI<GraphResponse>(`/nodes/${encodeURIComponent(elementId)}/graph`);
}

// Search nodes by text
export async function searchNodes(query: string): Promise<ThoughtNode[]> {
  return fetchAPI<ThoughtNode[]>(`/nodes/search?q=${encodeURIComponent(query)}`);
}

// Get all nodes with pagination
export async function getAllNodes(limit: number = 9, skip: number = 0): Promise<PaginatedNodesResponse> {
  return fetchAPI<PaginatedNodesResponse>(`/nodes/all?limit=${limit}&skip=${skip}`);
}
