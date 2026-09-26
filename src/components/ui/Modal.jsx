import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

/** Bottom sheet on phones, centred dialog from 620px up. */
export default function Modal({ open, onClose, title, description, children, footer }) {
  const ref = useRef(null);

  /**
   * onClose is almost always an inline arrow, so it is a new function on every
   * render of the parent. Holding it in a ref keeps it out of the effect's
   * dependencies — otherwise the effect re-ran on each keystroke and called
   * focus() on the dialog, taking the caret out of whichever field was being
   * typed into. That is what made every input accept one character at a time.
   */
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });

  useEffect(() => {
    if (!open) return undefined;

    const onKey = (e) => { if (e.key === 'Escape') closeRef.current?.(); };
    document.addEventListener('keydown', onKey);

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus the dialog once, when it opens, so a screen reader announces it
    // and Escape works before anything is tapped. Never again after that.
    ref.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        {/* Sticky so the action buttons stay reachable when a sheet is taller
            than the screen and the keyboard is open. */}
        <div className="modal-head">
          <div>
            <h2>{title}</h2>
            {description && <p className="small muted" style={{ margin: '4px 0 0' }}>{description}</p>}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <X size={18} />
          </Button>
        </div>
        {children}
        {footer && <div className="modal-actions">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', tone = 'primary', loading }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant={tone} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </>
      }
    >
      <p className="muted" style={{ margin: 0 }}>{message}</p>
    </Modal>
  );
}
