export type ActionOutcome<T> = { kind: 'completed'; value: T } | { kind: 'busy' };

/** Close the double-click window synchronously, before React renders busy state. */
export function createActionGate() {
  let active = false;
  return async function exclusive<T>(action: () => Promise<T>): Promise<ActionOutcome<T>> {
    if (active) return { kind: 'busy' };
    active = true;
    try {
      return { kind: 'completed', value: await action() };
    } finally {
      active = false;
    }
  };
}
