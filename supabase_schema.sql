-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create PROFILES table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  kyc_verified BOOLEAN DEFAULT FALSE,
  kyc_document_url TEXT,
  bank_name TEXT,
  bank_account_number TEXT,
  bank_account_name TEXT,
  paystack_customer_code TEXT,
  total_contributions DECIMAL(12,2) DEFAULT 0,
  total_payouts_received DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create GROUPS table
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  contribution_amount DECIMAL(12,2) NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'bi-weekly', 'monthly')),
  max_members INTEGER NOT NULL DEFAULT 10,
  current_members INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'paused', 'completed', 'cancelled')),
  start_date DATE NOT NULL,
  end_date DATE,
  management_fee_percent DECIMAL(5,2) DEFAULT 2.00,
  late_fee_amount DECIMAL(12,2) DEFAULT 0,
  paystack_plan_code TEXT,
  total_pool DECIMAL(12,2) DEFAULT 0,
  rules TEXT,
  current_cycle_number INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create GROUP_MEMBERS table
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  status TEXT DEFAULT 'active',
  total_contributed DECIMAL(12,2) DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id),
  UNIQUE(group_id, position)
);

-- 5. Create CONTRIBUTIONS table
CREATE TABLE IF NOT EXISTS contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  cycle_id UUID, -- Optional: link to a cycle record
  amount DECIMAL(12,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'paid')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create LOANS table
CREATE TABLE IF NOT EXISTS loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  interest_rate DECIMAL(5,2) DEFAULT 5.00,
  total_repayment DECIMAL(12,2) NOT NULL,
  amount_repaid DECIMAL(12,2) DEFAULT 0,
  purpose TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'disbursed', 'repaying', 'completed', 'overdue')),
  due_date DATE NOT NULL,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create GROUP_CYCLES table
CREATE TABLE IF NOT EXISTS group_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  cycle_number INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  payout_recipient UUID REFERENCES profiles(id),
  payout_amount DECIMAL(12,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, cycle_number)
);

-- 8. Create PAYOUT_SCHEDULE table
CREATE TABLE IF NOT EXISTS payout_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES group_cycles(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  scheduled_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'pending_approval', 'processing', 'completed', 'failed')),
  payout_reference TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Create WALLET_TRANSACTIONS table
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  category TEXT NOT NULL, -- 'contribution', 'payout', 'loan_disbursement', 'loan_repayment'
  description TEXT,
  balance_after DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Create PAYMENT_RECORDS table (for auditing raw Paystack events)
CREATE TABLE IF NOT EXISTS payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paystack_reference TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES profiles(id),
  group_id UUID REFERENCES groups(id), -- Linked for administrative tracking
  amount DECIMAL(12,2) NOT NULL,
  status TEXT NOT NULL,
  metadata JSONB,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;

-- 12. Core RLS Policies
-- Profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile." ON profiles;
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

-- Groups
DROP POLICY IF EXISTS "Anyone can view active groups." ON groups;
CREATE POLICY "Anyone can view active groups." ON groups FOR SELECT USING (status = 'active');
DROP POLICY IF EXISTS "Members can view their groups." ON groups;
CREATE POLICY "Members can view their groups." ON groups FOR SELECT USING (
  EXISTS (SELECT 1 FROM group_members WHERE group_id = id AND user_id = auth.uid())
);
DROP POLICY IF EXISTS "Owners/Admins can manage groups." ON groups;
CREATE POLICY "Owners/Admins can manage groups." ON groups FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
);

-- Memberships
DROP POLICY IF EXISTS "Members can view their own memberships." ON group_members;
CREATE POLICY "Members can view their own memberships." ON group_members FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can join groups." ON group_members;
CREATE POLICY "Users can join groups." ON group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can manage memberships." ON group_members;
CREATE POLICY "Admins can manage memberships." ON group_members FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
);

-- Contributions
DROP POLICY IF EXISTS "Users can view their own financial data." ON contributions;
CREATE POLICY "Users can view their own financial data." ON contributions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can manage all contributions." ON contributions;
CREATE POLICY "Admins can manage all contributions." ON contributions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
);

-- Loans
DROP POLICY IF EXISTS "Users can view their own loans." ON loans;
CREATE POLICY "Users can view their own loans." ON loans FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can request loans." ON loans;
CREATE POLICY "Users can request loans." ON loans FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can manage all loans." ON loans;
CREATE POLICY "Admins can manage all loans." ON loans FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
);

-- Group Cycles
DROP POLICY IF EXISTS "Members can view cycles for their groups." ON group_cycles;
CREATE POLICY "Members can view cycles for their groups." ON group_cycles FOR SELECT USING (
  EXISTS (SELECT 1 FROM group_members WHERE group_id = group_cycles.group_id AND user_id = auth.uid())
);
DROP POLICY IF EXISTS "Admins can manage cycles." ON group_cycles;
CREATE POLICY "Admins can manage cycles." ON group_cycles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
);

-- Payouts
DROP POLICY IF EXISTS "Users can view their own payout schedule." ON payout_schedule;
CREATE POLICY "Users can view their own payout schedule." ON payout_schedule FOR SELECT USING (auth.uid() = recipient_id);
DROP POLICY IF EXISTS "Admins can manage payout schedules." ON payout_schedule;
CREATE POLICY "Admins can manage payout schedules." ON payout_schedule FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
);

-- Wallet
DROP POLICY IF EXISTS "Users can view their own transactions." ON wallet_transactions;
CREATE POLICY "Users can view their own transactions." ON wallet_transactions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view all transactions." ON wallet_transactions;
CREATE POLICY "Admins can view all transactions." ON wallet_transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
);

-- Audit
DROP POLICY IF EXISTS "Admins can view and manage payment records." ON payment_records;
CREATE POLICY "Admins can view and manage payment records." ON payment_records FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
);

-- 12. Trigger for Automatic Profile Creation on Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'User'), 
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'member')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
-- 13. Create PLATFORM_SETTINGS table
CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id)
);

-- Seed initial settings
INSERT INTO platform_settings (key, value) 
VALUES ('loan_config', '{"max_loan_percent": 50, "min_trust_score": 500}')
ON CONFLICT (key) DO NOTHING;

-- 14. Storage Bucket Setup
-- NOTE: You must also create the bucket via the Supabase Dashboard if the INSERT doesn't trigger bucket creation.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

-- 15. Storage RLS Policies
-- policies are applied to the storage.objects table
DROP POLICY IF EXISTS "Users can upload their own KYC docs" ON storage.objects;
CREATE POLICY "Users can upload their own KYC docs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can view their own KYC docs" ON storage.objects;
CREATE POLICY "Users can view their own KYC docs" ON storage.objects
  FOR SELECT USING (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Admins can view all KYC docs" ON storage.objects;
CREATE POLICY "Admins can view all KYC docs" ON storage.objects
  FOR SELECT USING (bucket_id = 'kyc-documents' AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- 16. Enable Realtime
DO $$
BEGIN
  -- Re-enable publication if it exists or create it
  -- Note: Next.js/Supabase usually handle the publication itself, but we can add tables to it.
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE payment_records;
    ALTER PUBLICATION supabase_realtime ADD TABLE contributions;
    ALTER PUBLICATION supabase_realtime ADD TABLE loans;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    -- Table already in publication, ignore
    NULL;
END $$;
