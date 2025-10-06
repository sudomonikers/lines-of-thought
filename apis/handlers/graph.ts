import { Request, Response } from 'express';
import { getNeo4jDriver } from '../lib/neo4j';
import { handleError, handleNotFound } from '../lib/error-handler';

interface ThoughtNode {
  elementId: string;
  text: string;
  createdAt: string;
}

interface ThoughtRelationship {
  elementId: string;
  fromElementId: string;
  toElementId: string;
  type: string;
  perspective?: string | null;
}

// Get multiple nodes with their immediate children (batch operation)
export const getBatchNodesWithChildren = async (req: Request, res: Response) => {
  try {
    const { elementIds } = req.body;

    if (!Array.isArray(elementIds) || elementIds.length === 0) {
      return res.status(400).json({ error: 'elementIds must be a non-empty array' });
    }

    const driver = getNeo4jDriver();
    const session = driver.session();

    // Get all nodes and their children in one query
    const result = await session.run(
      `MATCH (n:Thought)
       WHERE elementId(n) IN $elementIds
       OPTIONAL MATCH (n)-[r:BRANCHES_TO]->(child:Thought)
       OPTIONAL MATCH (parent:Thought)-[pr:BRANCHES_TO]->(n)
       RETURN n,
              collect(DISTINCT child) as children,
              collect(DISTINCT parent) as parents,
              collect(DISTINCT {rel: r, from: elementId(n), to: elementId(child)}) as childRelationships,
              collect(DISTINCT {rel: pr, from: elementId(parent), to: elementId(n)}) as parentRelationships`,
      { elementIds }
    );

    await session.close();

    const nodesMap = new Map<string, ThoughtNode>();
    const relationshipsMap = new Map<string, ThoughtRelationship>();

    result.records.forEach(record => {
      const node = record.get('n');
      const children = record.get('children') || [];
      const parents = record.get('parents') || [];
      const childRelationshipData = record.get('childRelationships') || [];
      const parentRelationshipData = record.get('parentRelationships') || [];

      // Add main node
      if (node && node.elementId) {
        nodesMap.set(node.elementId, {
          elementId: node.elementId,
          text: node.properties.text,
          createdAt: node.properties.createdAt.toString(),
        });
      }

      // Add children nodes
      children.forEach((child: any) => {
        if (child && child.elementId) {
          nodesMap.set(child.elementId, {
            elementId: child.elementId,
            text: child.properties.text,
            createdAt: child.properties.createdAt.toString(),
          });
        }
      });

      // Add parent nodes
      parents.forEach((parent: any) => {
        if (parent && parent.elementId) {
          nodesMap.set(parent.elementId, {
            elementId: parent.elementId,
            text: parent.properties.text,
            createdAt: parent.properties.createdAt.toString(),
          });
        }
      });

      // Extract child relationships
      childRelationshipData
        .filter((r: any) => r.rel && r.rel.elementId)
        .forEach((r: any) => {
          relationshipsMap.set(r.rel.elementId, {
            elementId: r.rel.elementId,
            fromElementId: r.from,
            toElementId: r.to,
            type: r.rel.type,
            perspective: r.rel.properties?.perspective || null,
          });
        });

      // Extract parent relationships
      parentRelationshipData
        .filter((r: any) => r.rel && r.rel.elementId)
        .forEach((r: any) => {
          relationshipsMap.set(r.rel.elementId, {
            elementId: r.rel.elementId,
            fromElementId: r.from,
            toElementId: r.to,
            type: r.rel.type,
            perspective: r.rel.properties?.perspective || null,
          });
        });
    });

    res.json({
      nodes: Array.from(nodesMap.values()),
      relationships: Array.from(relationshipsMap.values())
    });
  } catch (error) {
    handleError(res, error, 'getBatchNodesWithChildren');
  }
};

// Get a node with its immediate children (one level deep)
export const getNodeWithChildren = async (req: Request, res: Response) => {
  try {
    const { elementId } = req.params;

    const driver = getNeo4jDriver();
    const session = driver.session();

    // Get the node, its direct children, and its parent
    const result = await session.run(
      `MATCH (n:Thought)
       WHERE elementId(n) = $elementId
       OPTIONAL MATCH (n)-[r:BRANCHES_TO]->(child:Thought)
       OPTIONAL MATCH (parent:Thought)-[pr:BRANCHES_TO]->(n)
       RETURN n,
              collect(DISTINCT child) as children,
              collect(DISTINCT parent) as parents,
              collect(DISTINCT {rel: r, from: elementId(n), to: elementId(child)}) as childRelationships,
              collect(DISTINCT {rel: pr, from: elementId(parent), to: elementId(n)}) as parentRelationships`,
      { elementId }
    );

    await session.close();

    const record = result.records[0];
    if (!record) {
      return handleNotFound(res, 'Node');
    }

    const node = record.get('n');
    const children = record.get('children') || [];
    const parents = record.get('parents') || [];
    const childRelationshipData = record.get('childRelationships') || [];
    const parentRelationshipData = record.get('parentRelationships') || [];

    const nodes: ThoughtNode[] = [
      {
        elementId: node.elementId,
        text: node.properties.text,
        createdAt: node.properties.createdAt.toString(),
      }
    ];

    // Add children nodes
    children.forEach((child: any) => {
      if (child && child.elementId) {
        nodes.push({
          elementId: child.elementId,
          text: child.properties.text,
          createdAt: child.properties.createdAt.toString(),
        });
      }
    });

    // Add parent nodes
    parents.forEach((parent: any) => {
      if (parent && parent.elementId) {
        nodes.push({
          elementId: parent.elementId,
          text: parent.properties.text,
          createdAt: parent.properties.createdAt.toString(),
        });
      }
    });

    // Extract child relationships
    const relationships: ThoughtRelationship[] = [
      ...childRelationshipData
        .filter((r: any) => r.rel && r.rel.elementId)
        .map((r: any) => ({
          elementId: r.rel.elementId,
          fromElementId: r.from,
          toElementId: r.to,
          type: r.rel.type,
          perspective: r.rel.properties?.perspective || null,
        })),
      ...parentRelationshipData
        .filter((r: any) => r.rel && r.rel.elementId)
        .map((r: any) => ({
          elementId: r.rel.elementId,
          fromElementId: r.from,
          toElementId: r.to,
          type: r.rel.type,
          perspective: r.rel.properties?.perspective || null,
        }))
    ];

    res.json({ nodes, relationships });
  } catch (error) {
    handleError(res, error, 'getNodeWithChildren');
  }
};
