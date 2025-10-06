import { Request, Response } from 'express';
import { getNeo4jDriver } from '../lib/neo4j';
import { generateEmbedding } from '../lib/embeddings';
import { handleError } from '../lib/error-handler';
import { moderateContent, analyzeArgumentStrength } from '../lib/moderation';

// Create a new thought node
export const createNode = async (req: Request, res: Response) => {
  try {
    const { text, isParent, parentId, perspective } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (text.length > 5000) {
      return res.status(400).json({ error: 'Text must not exceed 5000 characters' });
    }

    if (perspective && (typeof perspective !== 'string' || perspective.length > 500)) {
      return res.status(400).json({ error: 'Perspective must be a string of 500 characters or less' });
    }

    // Generate embedding for the text first (before moderation)
    const embedding = await generateEmbedding(text);

    const driver = getNeo4jDriver();
    const session = driver.session();

    try {
      // Variable to store parent text if fetched
      let parentText: string | null = null;

      // Check for originality BEFORE moderation to avoid unnecessary Bedrock calls
      if (!parentId) {
        // Check for duplicate parent nodes
        const similarityResult = await session.run(
          `MATCH (p:Thought:Parent)
           WHERE p.embedding IS NOT NULL
           WITH p, gds.similarity.cosine(p.embedding, $embedding) AS similarity
           WHERE similarity > 0.9
           RETURN p, similarity
           ORDER BY similarity DESC
           LIMIT 1`,
          { embedding }
        );

        if (similarityResult.records.length > 0) {
          const similarity = similarityResult.records[0].get('similarity');
          return res.status(400).json({
            error: 'This thought already exists',
            errorCode: 'DUPLICATE_THOUGHT',
            message: `A very similar thought already exists (${(similarity * 100).toFixed(1)}% similarity). Please try a different perspective or build upon the existing thought.`,
            similarity: similarity,
          });
        }
      } else {
        // Fetch parent node and check similarity in one query
        const parentResult = await session.run(
          `MATCH (parent:Thought)
           WHERE elementId(parent) = $parentId
           RETURN parent.text as parentText,
                  parent.embedding as parentEmbedding,
                  CASE
                    WHEN parent.embedding IS NOT NULL
                    THEN gds.similarity.cosine(parent.embedding, $embedding)
                    ELSE null
                  END as similarity`,
          { parentId, embedding }
        );

        if (parentResult.records.length === 0) {
          return res.status(404).json({ error: 'Parent node not found' });
        }

        const parentRecord = parentResult.records[0];
        parentText = parentRecord.get('parentText');
        const similarity = parentRecord.get('similarity');

        if (similarity !== null && similarity > 0.9) {
          return res.status(400).json({
            error: 'Thought too similar to parent',
            errorCode: 'SIMILAR_TO_PARENT',
            message: `This thought is too similar to its parent (${(similarity * 100).toFixed(1)}% similarity). Please develop the idea further or explore a different angle.`,
            similarity: similarity,
          });
        }

        // Check for duplicate child thoughts under the same parent
        const siblingsSimilarityResult = await session.run(
          `MATCH (parent:Thought)-[:BRANCHES_TO]->(sibling:Thought)
           WHERE elementId(parent) = $parentId AND sibling.embedding IS NOT NULL
           WITH sibling, gds.similarity.cosine(sibling.embedding, $embedding) AS similarity
           WHERE similarity > 0.9
           RETURN sibling, similarity
           ORDER BY similarity DESC
           LIMIT 1`,
          { parentId, embedding }
        );

        if (siblingsSimilarityResult.records.length > 0) {
          const similarity = siblingsSimilarityResult.records[0].get('similarity');
          return res.status(400).json({
            error: 'This branch already exists',
            errorCode: 'DUPLICATE_THOUGHT',
            message: `A very similar branch already exists under this thought (${(similarity * 100).toFixed(1)}% similarity). Please try a different perspective.`,
            similarity: similarity,
          });
        }
      }

      // Content moderation using Claude 3.5 Haiku (only after similarity check passes)
      const moderation = await moderateContent(text);
      if (!moderation.isValid) {
        return res.status(400).json({
          error: 'Content rejected by moderation',
          errorCode: 'MODERATION_FAILED',
          reason: moderation.reason || 'This text does not appear to be a meaningful philosophical thought',
        });
      }

      // Add Parent label if isParent is true
      const labels = isParent ? ':Thought:Parent' : ':Thought';

      let query: string;
      let params: any;
      let strengthScore: number | null = null;
      let strengthAnalysis: string | null = null;

      if (parentId) {
        // Parent text was already fetched during similarity check
        if (!parentText) {
          return res.status(404).json({ error: 'Parent node not found' });
        }

        // Analyze argument strength between parent and child
        const strengthResult = await analyzeArgumentStrength(parentText, text);
        strengthScore = strengthResult.score;
        strengthAnalysis = strengthResult.analysis || null;

        // Create node and relationship in one transaction
        query = `
          MATCH (parent:Thought)
          WHERE elementId(parent) = $parentId
          CREATE (n${labels} {text: $text, embedding: $embedding, createdAt: datetime()})
          CREATE (parent)-[r:BRANCHES_TO]->(n)
          SET r.perspective = $perspective,
              r.strengthScore = $strengthScore,
              r.strengthAnalysis = $strengthAnalysis
          RETURN n, r, elementId(parent) as parentElementId
        `;
        params = {
          text,
          embedding,
          parentId,
          perspective: perspective || null,
          strengthScore,
          strengthAnalysis,
        };
      } else {
        // Create node only
        query = `
          CREATE (n${labels} {text: $text, embedding: $embedding, createdAt: datetime()})
          RETURN n
        `;
        params = { text, embedding };
      }

      const result = await session.run(query, params);
      const record = result.records[0];

      if (!record) {
        if (parentId) {
          return res.status(404).json({ error: 'Parent node not found' });
        }
        return res.status(500).json({ error: 'Failed to create node' });
      }

      const node = record.get('n');
      const responseData: any = {
        elementId: node.elementId,
        text: node.properties.text,
        createdAt: node.properties.createdAt.toString(),
      };

      // If relationship was created, include relationship info
      if (parentId && record.get('r')) {
        const relationship = record.get('r');
        responseData.relationship = {
          elementId: relationship.elementId,
          fromElementId: record.get('parentElementId'),
          toElementId: node.elementId,
          type: relationship.type,
          perspective: relationship.properties.perspective || null,
          strengthScore: relationship.properties.strengthScore || null,
          strengthAnalysis: relationship.properties.strengthAnalysis || null,
        };
      }

      res.status(201).json(responseData);
    } finally {
      await session.close();
    }
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
