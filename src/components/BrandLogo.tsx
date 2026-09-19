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
    <div className={"flex items-center gap-2.5 select-none " + className}>
      <div
        className="relative grid shrink-0 place-items-center overflow-hidden rounded-[30%] bg-[rgb(var(--brand-red))] shadow-[0_7px_22px_rgb(var(--brand-red)/.24)] ring-1 ring-white/10"
        style={{ width: size, height: size }}
      >
        <Image
          src="/icon-192.png"
          alt="Extrovert"
          fill
          className="object-cover"
          priority
          sizes={size + "px"}
        />
      </div>
      {showText ? (
        <span
          className="flex items-center font-black tracking-[-0.045em] text-zinc-50"
          style={{ fontSize: Math.max(18, size * 0.52) }}
        >
          Extrovert
          <span className="ml-1 mt-[-.35em] inline-block h-1.5 w-1.5 rounded-full bg-[rgb(var(--brand-red))] shadow-[0_0_10px_rgb(var(--brand-red)/.7)]" />
        </span>
      ) : null}
    </div>
  );
}
