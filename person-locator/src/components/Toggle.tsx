type ToggleProps = {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
};

export default function Toggle({ checked, onChange, className }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange?.(!checked)}
      dir="ltr"
      className={`flex gap-1 items-center bg-transparent border-0 cursor-pointer p-0 shrink-0 ${className ?? ''}`}
    >
      <div
        className={`relative flex h-5 w-10 items-center rounded-full transition-colors shrink-0 ${
          checked ? 'bg-primary-main' : 'bg-control-off'
        }`}
      >
        <span
          className={`absolute left-0 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5.5' : 'translate-x-0.5'
          }`}
        />
      </div>
      <p
        className="m-0 font-rubik font-normal leading-tight text-text-muted text-sm text-right whitespace-nowrap"
        dir="auto"
      >
        {checked ? 'לא פעיל' : 'פעיל'}
      </p>
    </button>
  );
}
