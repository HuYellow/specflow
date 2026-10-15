import { useEffect, useRef, type RefObject } from 'react';

const activeModals: { token: symbol; container: HTMLElement }[] = [];
let originalOverflow = '';

/** Keep keyboard navigation inside an active dialog and restore its trigger. */
export function useModalFocus(ref: RefObject<HTMLElement | null>, active: boolean, close: () => void, restoreFocus?: RefObject<HTMLElement | null>) {
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    const container = ref.current;
    if (!active || !container) return;
    const previous = restoreFocus?.current || document.activeElement as HTMLElement | null;
    const token = Symbol('modal');
    if (!activeModals.length) originalOverflow = document.body.style.overflow;
    activeModals.push({ token, container });
    const focusable = () => Array.from(container.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, [tabindex]'))
      .filter(element => element.tabIndex >= 0 && !element.matches(':disabled') && element.getClientRects().length > 0);
    document.body.style.overflow = 'hidden';
    if (!container.contains(document.activeElement)) (container.querySelector<HTMLElement>('input:not(:disabled), textarea:not(:disabled), select:not(:disabled)') || focusable()[0] || container).focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing || event.keyCode === 229 || activeModals.at(-1)?.token !== token) return;
      if (event.key === 'Escape') { event.preventDefault(); closeRef.current(); }
      if (event.key !== 'Tab') return;
      const elements = focusable(), first = elements[0], last = elements.at(-1);
      if (!first) { event.preventDefault(); container.focus(); return; }
      if (!container.contains(document.activeElement) || (event.shiftKey ? document.activeElement === first : document.activeElement === last)) {
        event.preventDefault(); (event.shiftKey ? last : first)?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      const wasTop = activeModals.at(-1)?.token === token;
      const index = activeModals.findIndex(modal => modal.token === token);
      if (index >= 0) activeModals.splice(index, 1);
      document.body.style.overflow = activeModals.length ? 'hidden' : originalOverflow;
      if (!wasTop) return;
      const remaining = activeModals.at(-1)?.container;
      if (remaining) {
        if (previous?.isConnected && remaining.contains(previous)) previous.focus();
        else (remaining.querySelector<HTMLElement>('button, input, textarea, [tabindex="0"]') || remaining).focus();
      } else if (previous?.isConnected && !container.contains(previous) && !previous.closest('[inert]')) previous.focus();
    };
  }, [active, ref, restoreFocus]);
}
