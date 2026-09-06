import Image from "next/image";

export default function BrandLogo({ size = 36, showText = true, className = "" }: { size?: number; showText?: boolean; className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className={`relative grid shrink-0 place-items-center overflow-hidden rounded-[30%] bg-[#761f30] shadow-[0_8px_24px_rgba(118,31,48,.2)]`} style={{ width: size, height: size }}>
        <Image src="/icon-192.png" alt="Extrovert" fill className="object-cover" priority sizes={`${size}px`} />
      </div>
      {showText && <span className="font-black tracking-[-0.04em] text-zinc-950" style={{ fontSize: Math.max(18, size * .52) }}>extrovert</span>}
    </div>
  );
}
