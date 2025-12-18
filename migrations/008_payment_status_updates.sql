-- Migration to update ticket statuses for Real Payment Logic

-- 1. Update default status for new tickets to 'pending'
ALTER TABLE tickets ALTER COLUMN status SET DEFAULT 'pending';

-- 2. Add comment to clarify status values
COMMENT ON COLUMN tickets.status IS 'Status of the ticket: pending, paid, failed, cancelled';

-- 3. Ensure payment_configs is strictly for Razorpay (optional clean up, but good for enforcement)
ALTER TABLE payment_configs ADD CONSTRAINT check_provider CHECK (provider = 'razorpay');
