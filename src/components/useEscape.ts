import { useEffect } from 'react';

export const useEscape = (handler: () => void) => {
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        handler();
      }
    };
    document.addEventListener('keydown', listener);
    return () => document.removeEventListener('keydown', listener);
  }, [handler]);
};
