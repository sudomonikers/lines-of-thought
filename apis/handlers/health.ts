import { Request, Response } from 'express';

export const healthCheck = (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
};
