import React, { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// Portaled to <body> (like ResultsPanel/RecentSearchesPanel) so the tooltip
// isn't clipped by a host-page ancestor with overflow:hidden/auto, and isn't
// buried behind host content by an ancestor's stacking context.
const Tip: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [style, setStyle] = useState<React.CSSProperties>({ position: 'fixed', visibility: 'hidden' });

  useLayoutEffect(() => {
    if (!visible) return;
    const anchor = anchorRef.current;
    if (!anchor) return;

    const updatePosition = () => {
      const rect = anchor.getBoundingClientRect();
      setStyle({
        position: 'fixed',
        left: rect.left + rect.width / 2,
        bottom: window.innerHeight - rect.top + 6,
        transform: 'translateX(-50%)',
      });
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [visible]);

  return (
    <div
      ref={anchorRef}
      className="plib-relative plib-flex plib-items-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible &&
        createPortal(
          // Two elements on purpose: the outer one owns the positioning
          // transform (translateX(-50%) for centering), the inner one owns the
          // fadeIn animation. fadeIn animates `transform`, and an animated
          // value beats inline styles — sharing one element would drop the
          // centering for the animation's duration and snap it into place at
          // the end.
          <div className="plib-pointer-events-none plib-z-50" style={style} role="tooltip">
            <div className="plib-relative plib-whitespace-nowrap plib-rounded-md plib-bg-gray-800 plib-px-2 plib-py-1 plib-text-2xs plib-text-white plib-shadow-lg plib-animate-fadeIn">
              {label}
              <div className="plib-absolute plib-top-full plib-left-1/2 -plib-translate-x-1/2 plib-border-4 plib-border-transparent plib-border-t-gray-800" />
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default Tip;
