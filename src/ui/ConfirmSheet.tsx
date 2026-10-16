import { Sheet } from './Sheet';

interface Props {
  title: string;
  body: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmSheet({
  title,
  body,
  confirmLabel,
  destructive,
  onConfirm,
  onClose,
}: Props) {
  return (
    <Sheet title={title} onClose={onClose}>
      <p class="confirm-body">{body}</p>
      <button
        type="button"
        class={`wide-button${destructive ? ' destructive' : ''}`}
        onClick={() => {
          onConfirm();
          onClose();
        }}
      >
        {confirmLabel}
      </button>
    </Sheet>
  );
}
