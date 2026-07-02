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
      className={`flex gap-1 items-center bg-transparent border-0 cursor-pointer p-0 shrink-0 ${className ?? ""}`}
    >
      <div
        className={`relative flex h-6 w-12 items-center rounded-full transition-colors shrink-0 ${
          checked ? "bg-[#006aff]" : "bg-[#c5cbdd]"
        }`}
      >
        <span
          className={`absolute top-[2px] h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-[26px]" : "translate-x-[2px]"
          }`}
        />
      </div>
      <p
        className="m-0 font-rubik font-normal leading-[1.25] text-[#8e929f] text-sm text-right whitespace-nowrap"
        dir="auto"
      >
        {checked ? "פעיל" : "לא פעיל"}
      </p>
    </button>
  );
}
