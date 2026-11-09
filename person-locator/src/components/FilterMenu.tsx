import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAnchoredPosition } from '../hooks/useAnchoredPosition';

interface FilterMenuProps {
  id: string;
  /** The button that opened the menu — the menu is positioned against it. */
  anchorRef: React.RefObject<HTMLElement | null>;
  menuRef: React.RefObject<HTMLDivElement>;
  direction: 'up' | 'down';
  onClose: () => void;
  children: React.ReactNode;
}

const FilterMenu: React.FC<FilterMenuProps> = ({ id, anchorRef, menuRef, direction, onClose, children }) => {
  const anchoredStyle = useAnchoredPosition(anchorRef, direction);

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
      className={`plib-root plib-font-sans plib-z-[60] plib-flex plib-flex-col plib-gap-1 plib-bg-white plib-rounded-lg plib-border plib-border-gray-200 plib-shadow-search plib-p-2 ${direction === 'up' ? 'plib-mb-1' : 'plib-mt-1'}`}
      style={{ ...anchoredStyle, width: 'max-content', minWidth: 176 }}
      // Keep focus in the input so the typed search stays active while filters change.
      onMouseDown={(e) => e.preventDefault()}
    >
      {children}
    </div>,
    document.body,
  );
};

export default FilterMenu;
