/** Short, non-sensitive code for a render error: error type + hash of the message (never the message itself). */
export function renderErrorCode(error: unknown): string {
  const name = error instanceof Error ? error.name : typeof error;
  const msg = error instanceof Error ? error.message : String(error);
  let h = 5381;
  for (let i = 0; i < msg.length; i++) h = ((h * 33) ^ msg.charCodeAt(i)) >>> 0;
  return `CT-${name.replace(/[^A-Za-z]/g, '').slice(0, 16) || 'Error'}-${h.toString(36).slice(0, 5).toUpperCase()}`;
}
