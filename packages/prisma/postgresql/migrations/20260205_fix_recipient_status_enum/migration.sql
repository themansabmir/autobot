-- Add missing enum values to RecipientStatus
-- This migration adds STARTED and DELIVERED values that were missing from the database

-- Add DELIVERED if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'DELIVERED' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'RecipientStatus')
    ) THEN
        ALTER TYPE "RecipientStatus" ADD VALUE 'DELIVERED';
    END IF;
END$$;

-- Add STARTED if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'STARTED' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'RecipientStatus')
    ) THEN
        ALTER TYPE "RecipientStatus" ADD VALUE 'STARTED';
    END IF;
END$$;
