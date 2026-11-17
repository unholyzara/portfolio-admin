import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useEscape } from './useEscape';

interface Props {
  title: string;
  message: string;
  confirmLabel: string;
  tone?: 'default' | 'danger';
  busy?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ title, message, confirmLabel, tone = 'default', busy, error, onConfirm, onCancel }: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEscape(onCancel);

  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  return createPortal(
    <div className="overlay overlay--center" onMouseDown={onCancel}>
      <div
        className="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-message"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id="dialog-title" className="dialog__title">
          {title}
        </h2>
        <p id="dialog-message" className="dialog__message">
          {message}
        </p>
        {error && (
          <p className="notice notice--error" role="alert">
            {error}
          </p>
        )}
        <div className="dialog__actions">
          <button ref={cancelRef} type="button" className="btn" onClick={onCancel} disabled={busy}>
            Annulla
          </button>
          <button
            type="button"
            className={tone === 'danger' ? 'btn btn--danger' : 'btn btn--primary'}
            onClick={onConfirm}
            disabled={busy}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
