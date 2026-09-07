export const EXTROVERT_UPI_ID = "gauravbhardwaj7489@okaxis";
export const EXTROVERT_PAYEE_NAME = "Extrovert";

export function createUpiPaymentUrl({
  amountPaise,
  note,
}: {
  amountPaise: number;
  note: string;
}) {
  const params = new URLSearchParams({
    pa: EXTROVERT_UPI_ID,
    pn: EXTROVERT_PAYEE_NAME,
    am: (amountPaise / 100).toFixed(2),
    cu: "INR",
    tn: note.slice(0, 80),
  });
  return `upi://pay?${params.toString()}`;
}
