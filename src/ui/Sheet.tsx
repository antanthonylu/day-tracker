import { useEffect } from 'preact/hooks';
import type { ComponentChildren } from 'preact';

interface Props {
  title: string;
  onClose: () => void;
  children: ComponentChildren;
  /** Right-hand action in the sheet header, usually Save. */
  action?: { label: string; onClick: () => void; disabled?: boolean };
}

/**
 * A bottom sheet. The app never calls alert() or confirm(): those render as
 * browser dialogs that look nothing like the app and break the standalone
 * illusion, so every prompt and confirmation lives in one of these.
 */
export function Sheet({ title, onClose, children, action }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div class="sheet-backdrop" onClick={onClose}>
      <div
        class="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <header class="sheet-head">
          <button type="button" class="sheet-side" onClick={onClose}>
            Cancel
          </button>
          <h2>{title}</h2>
          {action ? (
            <button
              type="button"
              class="sheet-side strong"
              onClick={action.onClick}
              disabled={action.disabled}
            >
              {action.label}
            </button>
          ) : (
            <span class="sheet-side" />
          )}
        </header>
        <div class="sheet-body">{children}</div>
      </div>
    </div>
  );
}
