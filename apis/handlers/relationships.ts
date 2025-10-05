import { Request, Response } from 'express';
import { getNeo4jDriver } from '../lib/neo4j';

// Create a relationship between two nodes
export const createRelationship = async (req: Request, res: Response) => {
  try {
    const { fromElementId, toElementId, type } = req.body;

    if (!fromElementId || !toElementId) {
      return res.status(400).json({ error: 'fromElementId and toElementId are required' });
    }

    if (type !== 'BRANCHES_TO') {
      return res.status(400).json({ error: 'Invalid relationship type' });
    }

    const driver = getNeo4jDriver();
    const session = driver.session();

    const result = await session.run(
      `MATCH (from:Thought), (to:Thought)
       WHERE elementId(from) = $fromElementId AND elementId(to) = $toElementId
       CREATE (from)-[r:BRANCHES_TO]->(to)
       RETURN r, elementId(from) as fromElementId, elementId(to) as toElementId`,
      { fromElementId, toElementId }
    );

    await session.close();

    const record = result.records[0];
    if (!record) {
      return res.status(404).json({ error: 'One or both nodes not found' });
    }

    const relationship = record.get('r');

    res.status(201).json({
      elementId: relationship.elementId,
      fromElementId: record.get('fromElementId'),
      toElementId: record.get('toElementId'),
      type: relationship.type,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get all outgoing relationships for a node
export const getNodeRelationships = async (req: Request, res: Response) => {
  try {
    const { elementId } = req.params;

    const driver = getNeo4jDriver();
    const session = driver.session();

    const result = await session.run(
      `MATCH (from:Thought)-[r:BRANCHES_TO]->(to:Thought)
       WHERE elementId(from) = $elementId
       RETURN r, elementId(from) as fromElementId, elementId(to) as toElementId`,
      { elementId }
    );

    await session.close();

    const relationships = result.records.map(record => {
      const relationship = record.get('r');
      return {
        elementId: relationship.elementId,
        fromElementId: record.get('fromElementId'),
        toElementId: record.get('toElementId'),
        type: relationship.type,
      };
    });

    res.json(relationships);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Delete a relationship by elementId
export const deleteRelationship = async (req: Request, res: Response) => {
  try {
    const { elementId } = req.params;

    const driver = getNeo4jDriver();
    const session = driver.session();

    const result = await session.run(
      `MATCH ()-[r:BRANCHES_TO]->()
       WHERE elementId(r) = $elementId
       DELETE r
       RETURN count(r) as deleted`,
      { elementId }
    );

    await session.close();

    const deleted = result.records[0]?.get('deleted').toNumber();
    if (deleted === 0) {
      return res.status(404).json({ error: 'Relationship not found' });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
