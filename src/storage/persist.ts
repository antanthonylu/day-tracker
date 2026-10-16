/**
 * Ask the browser not to evict our IndexedDB data under storage pressure.
 *
 * Safari grants this silently once the app is installed to the Home Screen and
 * may refuse it in a normal tab. A refusal is not an error -- Settings shows
 * the result so the state is visible rather than surprising.
 */
export type PersistenceState = 'persisted' | 'not-persisted' | 'unsupported';

export async function requestPersistentStorage(): Promise<PersistenceState> {
  if (!navigator.storage?.persist) return 'unsupported';
  try {
    if (await navigator.storage.persisted()) return 'persisted';
    return (await navigator.storage.persist()) ? 'persisted' : 'not-persisted';
  } catch {
    return 'unsupported';
  }
}
