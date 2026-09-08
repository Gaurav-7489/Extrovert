export const EXTROVERT_UPI_ID = "gauravbhardwaj7489@okaxis";
export const EXTROVERT_PAYEE_NAME = "Extrovert";

export interface CreateUpiUrlParams {
  amountPaise: number;
  note: string;
  transactionRef?: string;
}

export function buildUpiQueryString({ amountPaise, note, transactionRef }: CreateUpiUrlParams): string {
  const params = new URLSearchParams({
    pa: EXTROVERT_UPI_ID,
    pn: EXTROVERT_PAYEE_NAME,
    am: (amountPaise / 100).toFixed(2),
    cu: "INR",
    tn: note.slice(0, 80),
  });
  if (transactionRef) {
    params.set("tr", transactionRef.slice(0, 35));
  }
  return params.toString();
}

export function createUpiPaymentUrl(params: CreateUpiUrlParams): string {
  return `upi://pay?${buildUpiQueryString(params)}`;
}

export function createAndroidUpiIntentUrl(params: CreateUpiUrlParams): string {
  const query = buildUpiQueryString(params);
  return `intent://pay?${query}#Intent;scheme=upi;end`;
}

export function parseAndroidIntentFromUpiUrl(upiUrl: string): string {
  const queryIndex = upiUrl.indexOf("?");
  const query = queryIndex !== -1 ? upiUrl.slice(queryIndex + 1) : "";
  return `intent://pay?${query}#Intent;scheme=upi;end`;
}