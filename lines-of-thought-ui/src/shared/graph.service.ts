import { fetchAPI } from './api.config';
import type { GraphNode, GraphRelationship } from '../types/graph';

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
  nodes: GraphNode[];
  relationships: GraphRelationship[];
}

export interface PaginatedNodesResponse {
  nodes: GraphNode[];
  total: number;
  limit: number;
  skip: number;
  hasMore: boolean;
}

// Create a new thought node
export async function createNode(payload: CreateNodePayload): Promise<GraphNode> {
  return fetchAPI<GraphNode>('/nodes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// Create a relationship between two nodes
export async function createRelationship(
  payload: CreateRelationshipPayload
): Promise<GraphRelationship> {
  return fetchAPI<GraphRelationship>('/relationships', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// Get a node and its children (one level deep)
export async function getNodeWithChildren(elementId: string): Promise<GraphResponse> {
  return fetchAPI<GraphResponse>(`/nodes/${encodeURIComponent(elementId)}/graph`);
}

// Get multiple nodes with their children (batch operation)
export async function getBatchNodesWithChildren(elementIds: string[]): Promise<GraphResponse> {
  return fetchAPI<GraphResponse>('/nodes/batch/graph', {
    method: 'POST',
    body: JSON.stringify({ elementIds }),
  });
}

// Search nodes by text
export async function searchNodes(query: string): Promise<GraphNode[]> {
  return fetchAPI<GraphNode[]>(`/nodes/search?q=${encodeURIComponent(query)}`);
}

// Get all nodes with pagination
export async function getAllNodes(limit: number = 9, skip: number = 0): Promise<PaginatedNodesResponse> {
  return fetchAPI<PaginatedNodesResponse>(`/nodes/all?limit=${limit}&skip=${skip}`);
}
