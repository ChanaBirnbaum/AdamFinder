import { CitizenIcon, GuardIcon, PrisonerIcon } from "./icons";

export type TabKey = "citizens" | "guards" | "prisoners";

const TABS: { key: TabKey; label: string }[] = [
  { key: "citizens", label: "אזרחים" },
  { key: "guards", label: "סוהרים" },
  { key: "prisoners", label: "אסירים" },
];

function TabIcon({ tabKey, active }: { tabKey: TabKey; active: boolean }) {
  if (tabKey === "citizens") return <CitizenIcon active={active} />;
  if (tabKey === "guards") return <GuardIcon />;
  return <PrisonerIcon />;
}

export default function Tabs({
  active,
  counts,
  onChange,
}: {
  active: TabKey;
  counts: Record<TabKey, number>;
  onChange?: (key: TabKey) => void;
}) {
  return (
    <div className="flex flex-1 h-full items-center justify-end min-w-0">
      {TABS.map(({ key, label }) => {
        const isActive = key === active;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange?.(key)}
            className={`flex gap-2 h-12 items-center justify-center px-2 py-[10px] bg-transparent border-0 border-b cursor-pointer shrink-0 ${
              isActive ? "border-[#006aff]" : "border-transparent"
            }`}
          >
            <div
              className={`flex flex-col items-center justify-center px-2 py-1 rounded-[32px] w-6 h-6 box-border shrink-0 ${
                isActive ? "bg-[#e6f4ff]" : "bg-[#f5f5f5]"
              }`}
            >
              <p
                className={`m-0 font-rubik text-sm whitespace-nowrap ${
                  isActive ? "font-medium leading-none text-[#006aff]" : "font-normal leading-[1.25] text-[#8e929f]"
                }`}
                dir="auto"
              >
                {counts[key]}
              </p>
            </div>
            <p
              className={`m-0 font-rubik text-base leading-[1.25] whitespace-nowrap ${
                isActive ? "font-semibold text-[#006aff]" : "font-normal text-[#8e929f]"
              }`}
              dir="auto"
            >
              {label}
            </p>
            <div className="flex items-center justify-center p-1 rounded-lg shrink-0">
              <TabIcon tabKey={key} active={isActive} />
            </div>
          </button>
        );
      })}
    </div>
  );
}
