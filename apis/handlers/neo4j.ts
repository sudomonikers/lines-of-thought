import { Request, Response } from 'express';
import { getNeo4jDriver } from '../lib/neo4j';

export const testConnection = async (_req: Request, res: Response) => {
  try {
    const driver = getNeo4jDriver();
    let { records, summary } = await driver.executeQuery(`
        MATCH (n:Person) RETURN n
      `
    )

    res.json({ connected: true });
  } catch (error) {
    console.error(error)
    res.status(500).json({
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const executeQuery = async (req: Request, res: Response) => {
  try {
    const { cypher, params = {} } = req.body;

    if (!cypher) {
      return res.status(400).json({ error: 'Cypher query is required' });
    }

    const driver = getNeo4jDriver();
    const session = driver.session();

    const result = await session.run(cypher, params);
    const records = result.records.map(record => record.toObject());

    await session.close();

    res.json({ records });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
