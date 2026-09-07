"use client";

import { useEffect, useState } from "react";
import { MessageCircle, WalletCards, X, Loader2 } from "lucide-react";
import { SHOP_PRODUCTS } from "@/lib/shop";
import { createClient } from "@/lib/supabase/client";
import { UpiPaymentDialog } from "@/components/payments/upi-payment-dialog";

type Props = {
  targetUserId: string;
  targetName: string;
  onClose: () => void;
  onComplete?: () => void;
};

type WalletClient = {
  from: (table: string) => {
    select: (columns: string) => {
      maybeSingle: () => Promise<{
        data: { purchased_superchats?: number } | null;
      }>;
    };
  };
  rpc: (
    name: string,
    args: Record<string, string>
  ) => Promise<{ error: { message: string } | null }>;
};

export default function SuperChatComposer({
  targetUserId,
  targetName,
  onClose,
  onComplete,
}: Props) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credits, setCredits] = useState(0);
  const [paying, setPaying] = useState(false);
  const product = SHOP_PRODUCTS.superchat;

  useEffect(() => {
    const supabase = createClient() as unknown as WalletClient;
    void supabase
      .from("superchat_wallets")
      .select("purchased_superchats")
      .maybeSingle()
      .then(({ data }) => setCredits(data?.purchased_superchats ?? 0));
  }, []);

  async function sendWithCredit() {
    const text = content.trim();
    if (!text || loading) return;

    try {
      setLoading(true);
      setError(null);
      const supabase = createClient() as unknown as WalletClient;
      const { error: rpcError } = await supabase.rpc("send_superchat_with_credit", {
        p_recipient_id: targetUserId,
        p_content: text,
      });

      if (rpcError) {
        throw new Error(
          rpcError.message.includes("SUPERCHAT_EMPTY")
            ? "Your SuperChat credits are empty."
            : "Couldn't send the SuperChat. Please try again."
        );
      }

      setCredits((v) => Math.max(0, v - 1));
      onComplete?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send SuperChat.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[10003] flex items-center justify-center bg-black/60 p-3 backdrop-blur-xs font-sans">
      <div className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-[2rem] border border-zinc-200/90 bg-white p-5 text-zinc-950 shadow-2xl transition-colors no-scrollbar dark:border-white/10 dark:bg-[#121216] dark:text-zinc-50 sm:p-6">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#550000]/20 bg-[#550000]/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#550000] shadow-2xs dark:border-[#550000]/35 dark:bg-[#550000]/15 dark:text-red-300">
              <MessageCircle className="h-3.5 w-3.5" />
              <span>SuperChat</span>
            </div>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
              Message {targetName}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              Send one direct, stand-out message before matching.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full border border-zinc-200 bg-zinc-50 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 active:scale-95 dark:border-white/10 dark:bg-[#16161d] dark:text-zinc-400 dark:hover:bg-[#202028] dark:hover:text-zinc-200"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Message Input Box */}
        <div className="mt-4 rounded-2xl border border-[#550000]/20 bg-[#550000]/5 p-3.5 transition-colors dark:border-[#550000]/30 dark:bg-[#550000]/10">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, 500))}
            rows={4}
            autoFocus
            placeholder="Say something authentic and thoughtful..."
            className="min-h-[110px] w-full resize-none rounded-xl border border-zinc-200/90 bg-white p-3 text-xs text-zinc-900 placeholder:text-zinc-400 transition focus:border-[#550000] focus:outline-none focus:ring-2 focus:ring-[#550000]/15 dark:border-white/10 dark:bg-[#16161d] dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-[#550000]"
          />
          <div className="mt-2 flex items-center justify-between text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
            <span>{content.length}/500</span>
            <span>Be respectful and genuine.</span>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-3 rounded-2xl border border-rose-200/90 bg-rose-50/90 px-3.5 py-2 text-xs font-semibold text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/25 dark:text-rose-300"
          >
            {error}
          </p>
        )}

        {/* Action Button */}
        <button
          type="button"
          onClick={() => (credits > 0 ? void sendWithCredit() : setPaying(true))}
          disabled={!content.trim() || loading}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#550000]/30 bg-[#550000] py-3.5 text-xs font-bold text-white shadow-md shadow-[#550000]/25 transition hover:bg-[#680202] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 dark:bg-[#550000] dark:hover:bg-[#6e0303]"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Sending…</span>
            </>
          ) : credits > 0 ? (
            <>
              <WalletCards className="h-4 w-4" />
              <span>Use SuperChat credit · {credits} left</span>
            </>
          ) : (
            <>
              <MessageCircle className="h-4 w-4" />
              <span>Send SuperChat · ₹{product.amountPaise / 100}</span>
            </>
          )}
        </button>

        <p className="mt-2.5 text-center text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
          {credits > 0
            ? "Deducts 1 credit from your balance"
            : "Pay directly with UPI; delivers once transaction is confirmed."}
        </p>

        {paying && (
          <UpiPaymentDialog
            endpoint="/api/upi/create-order"
            body={{
              product: "superchat",
              targetUserId,
              content: content.trim(),
            }}
            amountPaise={product.amountPaise}
            title={`SuperChat to ${targetName}`}
            description="Pay directly via UPI. The SuperChat is delivered immediately after transaction confirmation."
            onClose={() => setPaying(false)}
            onSubmitted={() => {
              setPaying(false);
              onComplete?.();
              onClose();
            }}
          />
        )}
      </div>
    </div>
  );
}