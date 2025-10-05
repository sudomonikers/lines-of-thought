import { Router } from 'express';
import { healthCheck } from './handlers/health';
import {
  createNode,
  searchNodes,
  getAllNodes,
} from './handlers/nodes';
import {
  createRelationship,
} from './handlers/relationships';
import {
  getNodeWithChildren,
} from './handlers/graph';

const router = Router();

// Health check
router.get('/health', healthCheck);

// Node routes
router.post('/nodes', createNode);
router.get('/nodes/all', getAllNodes);
router.get('/nodes/search', searchNodes);

// Relationship routes
router.post('/relationships', createRelationship);

// Graph query routes
router.get('/nodes/:elementId/graph', getNodeWithChildren);

export default router;
