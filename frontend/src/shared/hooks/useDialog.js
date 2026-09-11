import { useEffect } from 'react';
let locks = 0;
let previousOverflow;
// Keep focus in the topmost dialog and restore it after closing nested viewers.
export function useDialog(ref, open = true) {
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    if (locks++ === 0) { previousOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; }
    const root = () => ref.current?.closest('[role="dialog"]');
    const focusable = () => [...(root()?.querySelectorAll('button:not(:disabled), a[href], input, select, textarea, [tabindex="0"]') ?? [])].filter(node => node.getClientRects().length);
    const frame = requestAnimationFrame(() => (focusable()[0] || root())?.focus());
    const trap = (event) => {
      const dialogs = [...document.querySelectorAll('[role="dialog"]')];
      if (event.key !== 'Tab' || dialogs.at(-1) !== root()) return;
      const nodes = focusable();
      if (!nodes.length) { event.preventDefault(); root()?.focus(); return; }
      if (event.shiftKey && (document.activeElement === nodes[0] || !root().contains(document.activeElement))) { event.preventDefault(); nodes.at(-1).focus(); }
      else if (!event.shiftKey && (document.activeElement === nodes.at(-1) || !root().contains(document.activeElement))) { event.preventDefault(); nodes[0].focus(); }
    };
    document.addEventListener('keydown', trap);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', trap);
      if (--locks === 0) document.body.style.overflow = previousOverflow;
      if (previous?.isConnected) previous.focus();
    };
  }, [ref, open]);
}
