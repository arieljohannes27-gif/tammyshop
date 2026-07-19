-- Phase 1: align live schema with Prisma (idempotent)
-- Existing Supabase project — do not recreate tables.

DO $$ BEGIN
  CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS approval_status "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by_id TEXT,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS next_invoice_number INTEGER NOT NULL DEFAULT 0;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill invoice sequence from existing POS invoices (INV-000123)
UPDATE businesses b
SET next_invoice_number = GREATEST(
  b.next_invoice_number,
  COALESCE((
    SELECT MAX(NULLIF(regexp_replace(s.invoice_number, '\D', '', 'g'), '')::int)
    FROM sales s
    WHERE s.business_id = b.id
  ), 0)
);

COMMENT ON COLUMN subscriptions.stripe_customer_id IS 'PayFast pf_payment_id (legacy column name)';
COMMENT ON COLUMN subscriptions.stripe_subscription_id IS 'PayFast subscription token (legacy column name)';
