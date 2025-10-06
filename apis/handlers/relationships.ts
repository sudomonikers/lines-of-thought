import { Request, Response } from 'express';
import { getNeo4jDriver } from '../lib/neo4j';
import { handleError, handleNotFound } from '../lib/error-handler';
import { analyzeArgumentStrength } from '../lib/moderation';

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

    // First, fetch both nodes to get their text for strength analysis
    const nodesResult = await session.run(
      `MATCH (from:Thought), (to:Thought)
       WHERE elementId(from) = $fromElementId AND elementId(to) = $toElementId
       RETURN from.text as fromText, to.text as toText`,
      { fromElementId, toElementId }
    );

    if (nodesResult.records.length === 0) {
      await session.close();
      return handleNotFound(res, 'One or both nodes');
    }

    const fromText = nodesResult.records[0].get('fromText');
    const toText = nodesResult.records[0].get('toText');

    // Analyze argument strength between parent and child
    const strengthResult = await analyzeArgumentStrength(fromText, toText);

    // Create relationship with optional perspective property and strength score
    const result = await session.run(
      `MATCH (from:Thought), (to:Thought)
       WHERE elementId(from) = $fromElementId AND elementId(to) = $toElementId
       CREATE (from)-[r:BRANCHES_TO]->(to)
       SET r.perspective = $perspective,
           r.strengthScore = $strengthScore,
           r.strengthAnalysis = $strengthAnalysis
       RETURN r, elementId(from) as fromElementId, elementId(to) as toElementId`,
      {
        fromElementId,
        toElementId,
        perspective: perspective || null,
        strengthScore: strengthResult.score,
        strengthAnalysis: strengthResult.analysis || null,
      }
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
      strengthScore: relationship.properties.strengthScore || null,
      strengthAnalysis: relationship.properties.strengthAnalysis || null,
    });
  } catch (error) {
    handleError(res, error, 'createRelationship');
  }
};
