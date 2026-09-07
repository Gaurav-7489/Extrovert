import Image from "next/image";

export default function BrandLogo({
  size = 36,
  showText = true,
  className = "",
}: {
  size?: number;
  showText?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div
        className="relative grid shrink-0 place-items-center overflow-hidden rounded-[28%] bg-[#550000] shadow-[0_4px_16px_rgba(85,0,0,0.3)] ring-1 ring-white/10"
        style={{ width: size, height: size }}
      >
        <Image
          src="/icon-192.png"
          alt="DateBu"
          fill
          className="object-cover"
          priority
          sizes={`${size}px`}
        />
      </div>
      {showText && (
        <span
          className="font-black tracking-[-0.035em] text-zinc-950 transition-colors dark:text-zinc-50 flex items-center"
          style={{ fontSize: Math.max(18, size * 0.52) }}
        >
          DateBu
          <span className="ml-0.5 inline-block h-1.5 w-1.5 rounded-full bg-[#550000] dark:bg-red-400" />
        </span>
      )}
    </div>
  );
}