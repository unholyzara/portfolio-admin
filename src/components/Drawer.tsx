import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useEscape } from './useEscape';

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Drawer({ title, onClose, children }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  useEscape(onClose);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return createPortal(
    <div className="overlay overlay--end" onMouseDown={onClose}>
      <div
        ref={panelRef}
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="drawer__head">
          <h2 id="drawer-title" className="drawer__title">
            {title}
          </h2>
          <button type="button" className="btn btn--small" onClick={onClose}>
            Chiudi
          </button>
        </header>
        <div className="drawer__body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
