// Centralized error handling utilities

export function handleError(error: unknown, userMessage: string): void {
  console.error(userMessage, error);

  // Extract error message if available
  const errorMessage = error instanceof Error ? error.message : String(error);

  // Show user-friendly message
  alert(`${userMessage}\n\nDetails: ${errorMessage}`);
}

export function logError(error: unknown, context: string): void {
  console.error(`[${context}]`, error);
}
