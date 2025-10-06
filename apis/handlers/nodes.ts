import { Request, Response } from 'express';
import { getNeo4jDriver } from '../lib/neo4j';
import { generateEmbedding } from '../lib/embeddings';
import { handleError, handleNotFound } from '../lib/error-handler';

// Create a new thought node
export const createNode = async (req: Request, res: Response) => {
  try {
    const { text, isParent } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (text.length > 5000) {
      return res.status(400).json({ error: 'Text must not exceed 5000 characters' });
    }

    // Generate embedding for the text
    const embedding = await generateEmbedding(text);

    const driver = getNeo4jDriver();
    const session = driver.session();

    // Add Parent label if isParent is true
    const labels = isParent ? ':Thought:Parent' : ':Thought';
    const result = await session.run(
      `CREATE (n${labels} {text: $text, embedding: $embedding, createdAt: datetime()})
       RETURN n`,
      { text, embedding }
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
    handleError(res, error, 'createNode');
  }
};

// Hybrid search combining semantic embeddings and keyword matching
export const searchNodes = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    // Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(q);

    const driver = getNeo4jDriver();
    const session = driver.session();

    // Hybrid search: Combine vector similarity and keyword matching
    // Vector similarity gets 70% weight, keyword match gets 30% weight
    const result = await session.run(
      `MATCH (n:Thought:Parent)
       WHERE n.embedding IS NOT NULL
       WITH n,
            gds.similarity.cosine(n.embedding, $queryEmbedding) AS vectorScore,
            CASE
              WHEN toLower(n.text) CONTAINS toLower($query) THEN 1.0
              ELSE 0.0
            END AS keywordScore
       WITH n,
            vectorScore,
            keywordScore,
            (0.7 * vectorScore + 0.3 * keywordScore) AS hybridScore
       RETURN n, vectorScore, keywordScore, hybridScore
       ORDER BY hybridScore DESC
       LIMIT 10`,
      { queryEmbedding, query: q }
    );

    await session.close();

    const nodes = result.records.map(record => {
      const node = record.get('n');
      const hybridScore = record.get('hybridScore');
      return {
        elementId: node.elementId,
        text: node.properties.text,
        createdAt: node.properties.createdAt.toString(),
        score: hybridScore, // Combined score for ranking
      };
    });

    res.json(nodes);
  } catch (error) {
    handleError(res, error, 'searchNodes');
  }
};

// Get all nodes with pagination
export const getAllNodes = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 9;
    const skip = parseInt(req.query.skip as string) || 0;

    if (limit < 1 || limit > 100) {
      return res.status(400).json({ error: 'Limit must be between 1 and 100' });
    }

    if (skip < 0) {
      return res.status(400).json({ error: 'Skip must be non-negative' });
    }

    const driver = getNeo4jDriver();
    const session = driver.session();

    // Get total count first (only Parent nodes)
    const countResult = await session.run(`MATCH (n:Thought:Parent) RETURN count(n) as total`);
    const total = countResult.records[0]?.get('total').toNumber() || 0;

    // Then get paginated results (only Parent nodes)
    const nodesResult = await session.run(
      `MATCH (n:Thought:Parent)
       RETURN n
       ORDER BY n.createdAt DESC
       SKIP toInteger($skip)
       LIMIT toInteger($limit)`,
      { skip, limit }
    );

    await session.close();
    const nodes = nodesResult.records.map(record => {
      const node = record.get('n');
      return {
        elementId: node.elementId,
        text: node.properties.text,
        createdAt: node.properties.createdAt.toString(),
      };
    });

    res.json({
      nodes,
      total,
      limit,
      skip,
      hasMore: skip + nodes.length < total,
    });
  } catch (error) {
    handleError(res, error, 'getAllNodes');
  }
};
