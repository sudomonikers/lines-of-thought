import { Request, Response } from 'express';
import { getNeo4jDriver } from '../lib/neo4j';

// Create a new thought node
export const createNode = async (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    const driver = getNeo4jDriver();
    const session = driver.session();

    const result = await session.run(
      `CREATE (n:Thought {text: $text, createdAt: datetime()})
       RETURN n`,
      { text }
    );

    const node = result.records[0]?.get('n');
    await session.close();

    if (!node) {
      return res.status(500).json({ error: 'Failed to create node' });
    }

    res.status(201).json({
      elementId: node.elementId,
      text: node.properties.text,
      createdAt: node.properties.createdAt.toString(),
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get a node by elementId
export const getNode = async (req: Request, res: Response) => {
  try {
    const { elementId } = req.params;

    const driver = getNeo4jDriver();
    const session = driver.session();

    const result = await session.run(
      `MATCH (n:Thought)
       WHERE elementId(n) = $elementId
       RETURN n`,
      { elementId }
    );

    await session.close();

    const node = result.records[0]?.get('n');
    if (!node) {
      return res.status(404).json({ error: 'Node not found' });
    }

    res.json({
      elementId: node.elementId,
      text: node.properties.text,
      createdAt: node.properties.createdAt.toString(),
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update a node by elementId
export const updateNode = async (req: Request, res: Response) => {
  try {
    const { elementId } = req.params;
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    const driver = getNeo4jDriver();
    const session = driver.session();

    const result = await session.run(
      `MATCH (n:Thought)
       WHERE elementId(n) = $elementId
       SET n.text = $text
       RETURN n`,
      { elementId, text }
    );

    await session.close();

    const node = result.records[0]?.get('n');
    if (!node) {
      return res.status(404).json({ error: 'Node not found' });
    }

    res.json({
      elementId: node.elementId,
      text: node.properties.text,
      createdAt: node.properties.createdAt.toString(),
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Delete a node by elementId
export const deleteNode = async (req: Request, res: Response) => {
  try {
    const { elementId } = req.params;

    const driver = getNeo4jDriver();
    const session = driver.session();

    // Delete the node and all its relationships
    const result = await session.run(
      `MATCH (n:Thought)
       WHERE elementId(n) = $elementId
       DETACH DELETE n
       RETURN count(n) as deleted`,
      { elementId }
    );

    await session.close();

    const deleted = result.records[0]?.get('deleted').toNumber();
    if (deleted === 0) {
      return res.status(404).json({ error: 'Node not found' });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get all root nodes (nodes with no incoming relationships)
export const getRootNodes = async (_req: Request, res: Response) => {
  try {
    const driver = getNeo4jDriver();
    const session = driver.session();

    const result = await session.run(
      `MATCH (n:Thought)
       WHERE NOT ()-[:BRANCHES_TO]->(n)
       RETURN n
       ORDER BY n.createdAt DESC`
    );

    await session.close();

    const nodes = result.records.map(record => {
      const node = record.get('n');
      return {
        elementId: node.elementId,
        text: node.properties.text,
        createdAt: node.properties.createdAt.toString(),
      };
    });

    res.json(nodes);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Search nodes by text
export const searchNodes = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const driver = getNeo4jDriver();
    const session = driver.session();

    // Case-insensitive search using CONTAINS
    const result = await session.run(
      `MATCH (n:Thought)
       WHERE toLower(n.text) CONTAINS toLower($query)
       RETURN n
       ORDER BY n.createdAt DESC
       LIMIT 50`,
      { query: q }
    );

    await session.close();

    const nodes = result.records.map(record => {
      const node = record.get('n');
      return {
        elementId: node.elementId,
        text: node.properties.text,
        createdAt: node.properties.createdAt.toString(),
      };
    });

    res.json(nodes);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
