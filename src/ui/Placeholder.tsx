export function Placeholder({ text }: { text: string }) {
  return (
    <div class="placeholder">
      <div class="placeholder-mark" aria-hidden="true" />
      <p>{text}</p>
    </div>
  );
}
