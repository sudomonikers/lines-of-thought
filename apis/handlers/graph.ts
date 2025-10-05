import { Request, Response } from 'express';
import { getNeo4jDriver } from '../lib/neo4j';

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
      return res.status(404).json({ error: 'Node not found' });
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
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get the full graph starting from a node (all descendants)
export const getFullGraph = async (req: Request, res: Response) => {
  try {
    const { elementId } = req.params;

    const driver = getNeo4jDriver();
    const session = driver.session();

    // Get the entire subgraph starting from this node
    const result = await session.run(
      `MATCH path = (start:Thought)-[:BRANCHES_TO*0..]->(descendant:Thought)
       WHERE elementId(start) = $elementId
       WITH collect(DISTINCT start) + collect(DISTINCT descendant) as allNodes,
            relationships(path) as rels
       UNWIND allNodes as n
       WITH collect(DISTINCT n) as nodes, collect(DISTINCT rels) as allRels
       UNWIND allRels as relList
       UNWIND relList as r
       RETURN nodes,
              collect(DISTINCT {rel: r, from: elementId(startNode(r)), to: elementId(endNode(r))}) as relationships`,
      { elementId }
    );

    await session.close();

    const record = result.records[0];
    if (!record) {
      return res.status(404).json({ error: 'Node not found' });
    }

    const nodeList = record.get('nodes') || [];
    const relationshipData = record.get('relationships') || [];

    const nodes: ThoughtNode[] = nodeList.map((node: any) => ({
      elementId: node.elementId,
      text: node.properties.text,
      createdAt: node.properties.createdAt.toString(),
    }));

    const relationships: ThoughtRelationship[] = relationshipData
      .filter((r: any) => r.rel && r.rel.elementId)
      .map((r: any) => ({
        elementId: r.rel.elementId,
        fromElementId: r.from,
        toElementId: r.to,
        type: r.rel.type,
        perspective: r.rel.properties?.perspective || null,
      }));

    res.json({ nodes, relationships });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
