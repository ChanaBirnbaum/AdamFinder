// Fresh URLs from Figma nodes 177:1373 & 177:1316 (fetched 2026-07-02)
const imgIconSearch = "https://www.figma.com/api/mcp/asset/99e5c59d-ae0c-46d1-9874-4e10f71a8e66";
const imgCitizenDefault = "https://www.figma.com/api/mcp/asset/a5c739b1-c83a-43c2-b433-8f849c41ee3a";
const imgCitizenActive = "https://www.figma.com/api/mcp/asset/726f1bfa-5c95-4548-8b6f-036baafadbda";
const imgGuard = "https://www.figma.com/api/mcp/asset/38791ab7-4464-496d-b37d-3732cf0e7887";
const imgPrisonerHead = "https://www.figma.com/api/mcp/asset/ae526939-5965-44fa-8a48-61f2640219ee";
const imgPrisonerShoulders = "https://www.figma.com/api/mcp/asset/416c506e-b824-4796-880d-c3d4fd6694a2";
const imgPrisonerBase = "https://www.figma.com/api/mcp/asset/355fb0a1-3654-4905-8460-911e589081cb";
const imgOnlineDot = "https://www.figma.com/api/mcp/asset/7a8471ab-b5db-4914-8eb3-ac399bf3b1f0";
const imgProfilePlaceholder = "https://www.figma.com/api/mcp/asset/16424e10-bc7f-46b8-ac4a-ef33ed4ae013";

export function SearchIcon({ className }: { className?: string }) {
  return (
    <div className={`relative w-6 h-6 shrink-0 ${className ?? ""}`}>
      <img alt="" className="absolute inset-0 w-full h-full block" src={imgIconSearch} />
    </div>
  );
}

export function CitizenIcon({ active = false, className }: { active?: boolean; className?: string }) {
  return (
    <div className={`relative w-6 h-6 shrink-0 ${className ?? ""}`}>
      <img alt="" className="absolute inset-0 w-full h-full block" src={active ? imgCitizenActive : imgCitizenDefault} />
    </div>
  );
}

export function GuardIcon({ className }: { className?: string }) {
  return (
    <div className={`relative w-6 h-6 shrink-0 ${className ?? ""}`}>
      <img alt="" className="absolute inset-0 w-full h-full block" src={imgGuard} />
    </div>
  );
}

export function PrisonerIcon({ className }: { className?: string }) {
  return (
    <div className={`relative w-6 h-6 shrink-0 flex flex-col items-center gap-1 overflow-hidden px-[6px] py-[3px] ${className ?? ""}`}>
      <div className="relative w-2 h-2 shrink-0">
        <img alt="" className="block w-full h-full" src={imgPrisonerHead} />
      </div>
      <div className="relative w-3 h-[6px] shrink-0">
        <img alt="" className="block w-full h-full" src={imgPrisonerShoulders} />
      </div>
      <div className="absolute left-1/2 -translate-x-1/2 top-[10px] flex h-[11px] items-end justify-center">
        <div className="relative w-[6px] h-2 shrink-0">
          <img alt="" className="block w-full h-full" src={imgPrisonerBase} />
        </div>
      </div>
    </div>
  );
}

export function ProfilePlaceholder({ photoUrl, online = false }: { photoUrl?: string; online?: boolean }) {
  return (
    <div className="flex items-start justify-end p-1 relative shrink-0">
      <div className="relative shrink-0 w-[45.714px] h-[45.714px]">
        <div className="absolute border border-[#393b58] inset-[2.5%] rounded-[4px] overflow-hidden">
          <img
            alt=""
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            src={photoUrl ?? imgProfilePlaceholder}
          />
        </div>
        {online && (
          <div className="absolute left-[40px] top-[2px] w-[10px] h-[10px]">
            <img alt="" className="block w-full h-full" src={imgOnlineDot} />
          </div>
        )}
      </div>
    </div>
  );
}
