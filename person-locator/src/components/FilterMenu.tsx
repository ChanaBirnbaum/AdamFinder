import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAnchoredPosition } from '../hooks/useAnchoredPosition';

interface FilterMenuProps {
  id: string;
  /** The button that opens the menu — receives focus back on Escape. */
  anchorRef: React.RefObject<HTMLElement | null>;
  /** The element whose left edge the menu lines up with (the search bar). */
  positionRef: React.RefObject<HTMLElement | null>;
  menuRef: React.RefObject<HTMLDivElement>;
  direction: 'up' | 'down';
  onClose: () => void;
  children: React.ReactNode;
}

const FilterMenu: React.FC<FilterMenuProps> = ({ id, anchorRef, positionRef, menuRef, direction, onClose, children }) => {
  const anchoredStyle = useAnchoredPosition(positionRef, direction);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!menuRef.current?.contains(target) && !anchorRef.current?.contains(target)) onClose();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (menuRef.current?.contains(document.activeElement)) anchorRef.current?.focus();
      onClose();
    };
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [anchorRef, menuRef, onClose]);

  // Mouse users keep focus in the input (see onMouseDown below), so the trigger only holds focus
  // when it was opened from the keyboard — and the portal is otherwise far away in tab order.
  useEffect(() => {
    if (document.activeElement !== anchorRef.current) return;
    menuRef.current?.querySelector<HTMLElement>('button:not([aria-disabled="true"]):not(:disabled)')?.focus();
  }, [anchorRef, menuRef]);

  return createPortal(
    <div
      ref={menuRef}
      id={id}
      role="group"
      aria-label="סינון תוצאות"
      dir="rtl"
      className={`plib-root plib-font-sans plib-z-[60] plib-flex plib-flex-col plib-py-2 plib-overflow-hidden plib-bg-white plib-rounded-lg plib-border plib-border-gray-200 plib-shadow-search ${direction === 'up' ? 'plib-mb-2' : 'plib-mt-2'}`}
      style={{ ...anchoredStyle, width: 'max-content', minWidth: 240 }}
      // Keep focus in the input so the typed search stays active while filters change.
      onMouseDown={(e) => e.preventDefault()}
    >
      {children}
    </div>,
    document.body,
  );
};

export default FilterMenu;
