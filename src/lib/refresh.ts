type Listener = () => void;

const listeners = new Set<Listener>();

/** Notifica a los hooks `useData` que los datos cambiaron para recargar. */
export function notifyDataChanged(): void {
  for (const listener of listeners) listener();
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}