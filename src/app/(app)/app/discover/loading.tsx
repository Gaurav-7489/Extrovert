export default function DiscoverLoading() {
  return (
    <main className="mx-auto flex h-[calc(100dvh-130px)] min-h-0 w-full max-w-md flex-col overflow-hidden px-2 pb-2 pt-1 font-sans" aria-busy="true" aria-label="Loading Discover">
      <div className="mb-2 flex shrink-0 items-center justify-between px-1.5 pt-1">
        <div>
          <div className="h-2.5 w-16 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-2 h-5 w-56 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <div className="h-9 w-9 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <div className="relative min-h-0 flex-1 animate-pulse rounded-[2rem] bg-zinc-100 dark:bg-[#121216]" />
      <div className="mt-2.5 flex shrink-0 justify-center gap-2 px-1">
        {[40, 48, 56, 48, 44, 40].map((size, index) => (
          <div key={`${size}-${index}`} style={{ width: size, height: size }} className="rounded-full bg-zinc-200 dark:bg-zinc-800" />
        ))}
      </div>
    </main>
  );
}
