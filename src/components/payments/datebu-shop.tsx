"use client";

import { memo, useState } from "react";
import { Heart, MessageCircle, Sparkles, WalletCards } from "lucide-react";
import { SHOP_PRODUCTS, type ShopProduct } from "@/lib/shop";
import { UpiPaymentDialog } from "@/components/payments/upi-payment-dialog";

const LIKE_PRODUCTS: ShopProduct[] = [
  "extra_likes_5",
  "extra_likes_15",
  "extra_likes_30",
];
const SUPERLIKE_PRODUCTS: ShopProduct[] = ["superlike_1", "superlike_5"];
const SUPERCHAT_PRODUCTS: ShopProduct[] = [
  "superchat_credit_1",
  "superchat_credit_3",
];

function ProductIcon({ product }: { product: ShopProduct }) {
  if (product.startsWith("superchat")) {
    return <MessageCircle className="h-4 w-4 text-[#550000] dark:text-red-400" />;
  }
  if (product.startsWith("superlike")) {
    return <Sparkles className="h-4 w-4 text-[#550000] dark:text-red-400" />;
  }
  return <Heart className="h-4 w-4 fill-current text-[#550000] dark:text-red-400" />;
}

function Section({
  title,
  eyebrow,
  description,
  icon,
  products,
  onBuy,
}: {
  title: string;
  eyebrow: string;
  description: string;
  icon: React.ReactNode;
  products: ShopProduct[];
  onBuy: (p: ShopProduct) => void;
}) {
  return (
    <section className="scroll-mt-20 space-y-3 font-sans">
      <div className="flex items-center gap-2.5 px-1">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#550000]/15 bg-[#550000]/5 text-[#550000] shadow-2xs dark:border-[#550000]/30 dark:bg-[#550000]/20 dark:text-red-300">
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#550000] dark:text-red-400">
            {eyebrow}
          </p>
          <h2 className="text-sm font-bold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-base">
            {title}
          </h2>
          <p className="text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
            {description}
          </p>
        </div>
      </div>

      <div className="grid gap-2.5">
        {products.map((product, index) => {
          const config = SHOP_PRODUCTS[product];
          const isFeatured = index === products.length - 1 && products.length > 1;

          return (
            <article
              key={product}
              className={`relative flex min-h-[108px] flex-col rounded-2xl border p-3.5 shadow-2xs transition-all ${
                isFeatured
                  ? "border-[#550000]/35 bg-[#550000]/5 ring-1 ring-[#550000]/20 dark:border-[#550000]/50 dark:bg-[#550000]/15 dark:ring-[#550000]/30"
                  : "border-zinc-200/90 bg-white dark:border-white/10 dark:bg-[#121216]"
              }`}
            >
              <div className="flex items-start gap-3 pr-14">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-zinc-200/80 bg-zinc-50 shadow-2xs dark:border-white/10 dark:bg-[#181820]">
                  <ProductIcon product={product} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold leading-snug text-zinc-950 dark:text-zinc-100 sm:text-sm">
                    {config.label}
                  </h3>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                    {config.description}
                  </p>
                </div>
              </div>

              <div className="mt-auto flex items-end justify-between gap-3 pt-3">
                <div>
                  <span className="text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
                    ₹{config.amountPaise / 100}
                  </span>
                  <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                    one-time
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onBuy(product)}
                  className="flex h-9 shrink-0 items-center justify-center rounded-xl border border-[#550000]/30 bg-[#550000] px-3.5 text-xs font-bold text-white shadow-2xs transition-all hover:bg-[#680202] active:scale-95 dark:bg-[#550000] dark:hover:bg-[#6e0303]"
                >
                  Buy with UPI
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export const DateBuShop = memo(function DateBuShop() {
  const [product, setProduct] = useState<ShopProduct | null>(null);
  const config = product ? SHOP_PRODUCTS[product] : null;

  return (
    <div className="space-y-6 font-sans">
      <Section
        eyebrow="One-time · Likes"
        title="Extra Likes"
        description="More opportunities to connect with people today."
        icon={<Heart className="h-4 w-4" />}
        products={LIKE_PRODUCTS}
        onBuy={setProduct}
      />

      <Section
        eyebrow="One-time · Super Likes"
        title="Super Likes"
        description="Highlight your profile with a stand-out badge."
        icon={<Sparkles className="h-4 w-4" />}
        products={SUPERLIKE_PRODUCTS}
        onBuy={setProduct}
      />

      <Section
        eyebrow="One-time · SuperChats"
        title="SuperChats"
        description="Send a direct message to someone before matching."
        icon={<MessageCircle className="h-4 w-4" />}
        products={SUPERCHAT_PRODUCTS}
        onBuy={setProduct}
      />

      <div className="flex items-center justify-center gap-1.5 border-t border-zinc-200/80 pt-4 text-[10px] font-medium text-zinc-400 dark:border-white/10 dark:text-zinc-500">
        <WalletCards className="h-3.5 w-3.5 text-[#550000] dark:text-red-400" />
        <span>Direct UPI checkout · verified instantly before delivery</span>
      </div>

      {product && config && (
        <UpiPaymentDialog
          endpoint="/api/upi/create-order"
          body={{ product }}
          amountPaise={config.amountPaise}
          title={config.label}
          description="Pay directly from your UPI app. Your items are added to your account as soon as the transaction is confirmed."
          onClose={() => setProduct(null)}
          onSubmitted={() => setProduct(null)}
        />
      )}
    </div>
  );
});

DateBuShop.displayName = "DateBuShop";