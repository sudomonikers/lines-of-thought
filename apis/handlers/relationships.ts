import { Request, Response } from 'express';
import { getNeo4jDriver } from '../lib/neo4j';
import { handleError, handleNotFound } from '../lib/error-handler';

// Create a relationship between two nodes
export const createRelationship = async (req: Request, res: Response) => {
  try {
    const { fromElementId, toElementId, type, perspective } = req.body;

    if (!fromElementId || !toElementId) {
      return res.status(400).json({ error: 'fromElementId and toElementId are required' });
    }

    if (type !== 'BRANCHES_TO') {
      return res.status(400).json({ error: 'Invalid relationship type' });
    }

    if (perspective && (typeof perspective !== 'string' || perspective.length > 500)) {
      return res.status(400).json({ error: 'Perspective must be a string of 500 characters or less' });
    }

    const driver = getNeo4jDriver();
    const session = driver.session();

    // Create relationship with optional perspective property
    const result = await session.run(
      `MATCH (from:Thought), (to:Thought)
       WHERE elementId(from) = $fromElementId AND elementId(to) = $toElementId
       CREATE (from)-[r:BRANCHES_TO]->(to)
       SET r.perspective = $perspective
       RETURN r, elementId(from) as fromElementId, elementId(to) as toElementId`,
      { fromElementId, toElementId, perspective: perspective || null }
    );

    await session.close();

    const record = result.records[0];
    if (!record) {
      return handleNotFound(res, 'One or both nodes');
    }

    const relationship = record.get('r');

    res.status(201).json({
      elementId: relationship.elementId,
      fromElementId: record.get('fromElementId'),
      toElementId: record.get('toElementId'),
      type: relationship.type,
      perspective: relationship.properties.perspective || null,
    });
  } catch (error) {
    handleError(res, error, 'createRelationship');
  }
};
