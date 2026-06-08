/**
 * Shared utility functions for the Amortix app.
 */

/**
 * Generates a RFC 4122 v4 UUID.
 * Used when inserting new records into Supabase tables that lack DB-side defaults.
 */
export function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
