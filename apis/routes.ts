import { Router } from 'express';
import { healthCheck } from './handlers/health';
import { testConnection, executeQuery } from './handlers/neo4j';
import {
  createNode,
  getNode,
  updateNode,
  deleteNode,
  getRootNodes,
  searchNodes,
} from './handlers/nodes';
import {
  createRelationship,
  getNodeRelationships,
  deleteRelationship,
} from './handlers/relationships';
import {
  getNodeWithChildren,
  getFullGraph,
} from './handlers/graph';

const router = Router();

// Health check
router.get('/health', healthCheck);

// Neo4j routes
router.get('/neo4j/test', testConnection);
router.post('/query', executeQuery);

// Node CRUD routes
router.post('/nodes', createNode);
router.get('/nodes/roots', getRootNodes);
router.get('/nodes/search', searchNodes);
router.get('/nodes/:elementId', getNode);
router.put('/nodes/:elementId', updateNode);
router.delete('/nodes/:elementId', deleteNode);

// Relationship routes
router.post('/relationships', createRelationship);
router.get('/nodes/:elementId/relationships', getNodeRelationships);
router.delete('/relationships/:elementId', deleteRelationship);

// Graph query routes
router.get('/nodes/:elementId/graph', getNodeWithChildren);
router.get('/nodes/:elementId/graph/full', getFullGraph);

export default router;
