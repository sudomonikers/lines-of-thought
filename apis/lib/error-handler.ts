import { Response } from 'express';

/**
 * Logs detailed error information to CloudWatch and returns a generic error to the client
 */
export function handleError(res: Response, error: unknown, context: string): void {
  // Log detailed error for debugging (goes to CloudWatch)
  console.error(`[${context}] Error:`, {
    message: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    error,
  });

  // Return generic error message to client (don't expose internal details)
  res.status(500).json({
    error: 'An internal error occurred. Please try again later.',
  });
}

/**
 * Handles validation errors with client-friendly messages
 */
export function handleValidationError(res: Response, message: string): Response {
  return res.status(400).json({ error: message });
}

/**
 * Handles not found errors
 */
export function handleNotFound(res: Response, resource: string): Response {
  return res.status(404).json({ error: `${resource} not found` });
}
