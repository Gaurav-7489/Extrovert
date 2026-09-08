export default function OnboardingLoading() {
  return (
    <main className="min-h-[100dvh] bg-white px-5 py-8 font-sans text-zinc-950">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-md flex-col justify-center animate-pulse">
        <div className="h-3 w-32 rounded bg-zinc-100" />
        <div className="mt-3 h-9 w-64 rounded-xl bg-zinc-100" />
        <div className="mt-3 h-10 w-full rounded-xl bg-zinc-100" />
        <div className="mt-5 h-24 w-full rounded-2xl bg-zinc-100" />
        <div className="mt-6 space-y-4">
          <div className="h-16 w-full rounded-2xl bg-zinc-100" />
          <div className="h-16 w-full rounded-2xl bg-zinc-100" />
          <div className="h-16 w-full rounded-2xl bg-zinc-100" />
          <div className="h-12 w-full rounded-2xl bg-zinc-100" />
        </div>
      </div>
    </main>
  );
}
