-- ============================================================
-- Extrovert — Fix 19: Enforce unique UPI UTR references
-- ============================================================
-- A UTR / transaction reference identifies a payment and must not
-- be reusable across multiple payment submissions.
--
-- Normalize whitespace and case so formatting differences cannot
-- bypass the uniqueness rule. NULL/blank UTRs remain allowed until
-- the user submits payment proof.
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS upi_payment_submissions_utr_unique_idx
  ON public.upi_payment_submissions (lower(btrim(utr)))
  WHERE utr IS NOT NULL AND btrim(utr) <> '';

COMMENT ON INDEX public.upi_payment_submissions_utr_unique_idx IS
  'Fix 19: prevents the same UPI UTR/transaction reference from being submitted for multiple payments.';
