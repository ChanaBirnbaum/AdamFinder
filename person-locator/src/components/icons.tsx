export function SearchIcon({ className, size = 24 }: { className?: string; size?: number }) {
  return (
    <div className={`plib-root plib-relative plib-shrink-0 ${className ?? ''}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="plib-absolute plib-inset-0 plib-w-full plib-h-full" aria-hidden="true">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    </div>
  );
}

export function CitizenIcon({ active = false, className, size = 30 }: { active?: boolean; className?: string; size?: number }) {
  return (
    <div className={`plib-root plib-relative plib-shrink-0 ${active ? 'plib-text-primary-main' : ''} ${className ?? ''}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="plib-absolute plib-inset-0 plib-w-full plib-h-full" aria-hidden="true">
        <path d="M12 11C12 12.0609 12.4214 13.0783 13.1716 13.8284C13.9217 14.5786 14.9391 15 16 15C17.0609 15 18.0783 14.5786 18.8284 13.8284C19.5786 13.0783 20 12.0609 20 11C20 9.93913 19.5786 8.92172 18.8284 8.17157C18.0783 7.42143 17.0609 7 16 7C14.9391 7 13.9217 7.42143 13.1716 8.17157C12.4214 8.92172 12 9.93913 12 11Z" />
        <path d="M10 25V23C10 21.9391 10.4214 20.9217 11.1716 20.1716C11.9217 19.4214 12.9391 19 14 19H18C19.0609 19 20.0783 19.4214 20.8284 20.1716C21.5786 20.9217 22 21.9391 22 23V25" />
      </svg>
    </div>
  );
}

export function GuardIcon({ className, size = 30 }: { className?: string; size?: number }) {
  return (
    <div className={`plib-root plib-relative plib-shrink-0 ${className ?? ''}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="plib-absolute plib-inset-0 plib-w-full plib-h-full" aria-hidden="true">
        <path d="M12 11C12 12.0609 12.4214 13.0783 13.1716 13.8284C13.9217 14.5786 14.9391 15 16 15C17.0609 15 18.0783 14.5786 18.8284 13.8284C19.5786 13.0783 20 12.0609 20 11C20 9.93913 19.5786 8.92172 18.8284 8.17157C18.0783 7.42143 17.0609 7 16 7C14.9391 7 13.9217 7.42143 13.1716 8.17157C12.4214 8.92172 12 9.93913 12 11Z" />
        <path d="M10 25V23C10 21.9391 10.4214 20.9217 11.1716 20.1716C11.9217 19.4214 12.9391 19 14 19H18C19.0609 19 20.0783 19.4214 20.8284 20.1716C21.5786 20.9217 22 21.9391 22 23V25" />
        <path d="M18.6667 6H13.3333C12.597 6 12 6.59695 12 7.33333V8C12 8.73638 12.597 9.33333 13.3333 9.33333H18.6667C19.403 9.33333 20 8.73638 20 8V7.33333C20 6.59695 19.403 6 18.6667 6Z" fill="currentColor" stroke="none" />
      </svg>
    </div>
  );
}

export function PrisonerIcon({ className, size = 30 }: { className?: string; size?: number }) {
  return (
    <div className={`plib-root plib-relative plib-shrink-0 ${className ?? ''}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="plib-absolute plib-inset-0 plib-w-full plib-h-full" aria-hidden="true">
        <path d="M12 11C12 12.0609 12.4214 13.0783 13.1716 13.8284C13.9217 14.5786 14.9391 15 16 15C17.0609 15 18.0783 14.5786 18.8284 13.8284C19.5786 13.0783 20 12.0609 20 11C20 9.93913 19.5786 8.92172 18.8284 8.17157C18.0783 7.42143 17.0609 7 16 7C14.9391 7 13.9217 7.42143 13.1716 8.17157C12.4214 8.92172 12 9.93913 12 11Z" />
        <path d="M10 25V23C10 21.9391 10.4214 20.9217 11.1716 20.1716C11.9217 19.4214 12.9391 19 14 19H18C19.0609 19 20.0783 19.4214 20.8284 20.1716C21.5786 20.9217 22 21.9391 22 23V25" />
        <path d="M13 17V25" />
        <path d="M15 17V25" />
        <path d="M17 17V25" />
        <path d="M19 17V25" />
      </svg>
    </div>
  );
}

export function ProfilePlaceholder({ photoUrl, online = false }: { photoUrl?: string; online?: boolean }) {
  return (
    <div className="plib-root plib-flex plib-items-start plib-justify-end plib-p-1 plib-relative plib-shrink-0">
      <div className="plib-relative plib-shrink-0 plib-w-photo plib-h-photo">
        <div className="plib-absolute plib-border plib-border-photo-frame plib-inset-[2.5%] plib-rounded plib-overflow-hidden">
          {photoUrl ? (
            <img alt="" className="plib-absolute plib-inset-0 plib-w-full plib-h-full plib-object-cover plib-pointer-events-none" src={photoUrl} />
          ) : (
            <div className="plib-absolute plib-inset-0 plib-bg-grey-100 plib-flex plib-items-center plib-justify-center">
              <svg viewBox="0 0 24 24" fill="currentColor" className="plib-w-6 plib-h-6 plib-text-text-disabled" aria-hidden="true">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
              </svg>
            </div>
          )}
        </div>
        {/* FLAG: uses success-main (#1B7B3A) while ResultCard's presence dot uses `online` (#22C55E) — kept as-is */}
        {online && (
          <div className="plib-absolute plib-left-10 plib-top-0.5 plib-w-2.5 plib-h-2.5 plib-rounded-full plib-bg-success-main plib-border-2 plib-border-white" />
        )}
      </div>
    </div>
  );
}
