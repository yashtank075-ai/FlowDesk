-- Migration: Add agreedToTermsAt and termsVersion to users
-- Safe, additive migration: Does not drop, lock, or modify existing records
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "agreedToTermsAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "termsVersion" TEXT;

