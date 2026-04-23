import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { ChevronLeft, Info, Landmark, HelpCircle } from 'lucide-react';
import { LoanRequestForm } from '@/components/loans/LoanRequestForm';
import { redirect } from 'next/navigation';

export default async function RequestLoanPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // 1. Fetch Profile for contributions
  const { data: profile } = await supabase
    .from('profiles')
    .select('total_contributions')
    .eq('id', user.id)
    .single();

  // 2. Fetch Platform Settings for percentage
  const { data: settings } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'loan_config')
    .single();

  const maxLoanPercent = settings?.value?.max_loan_percent || 50;
  const totalContributions = Number(profile?.total_contributions) || 0;
  const maxEligibleAmount = totalContributions * (maxLoanPercent / 100);

  // Fetch groups where the user is a member
  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id, groups(name, contribution_amount, current_members)')
    .eq('user_id', user.id);

  return (
    <div className="request-loan-page" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2.5rem' }}>
        <Link href="/dashboard/loans" style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          color: 'var(--text-secondary)',
          fontSize: '0.875rem',
          marginBottom: '1rem'
        }} className="hover:text-white">
          <ChevronLeft size={16} /> Back to Loans
        </Link>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Request a <span className="text-gradient">Loan</span></h1>
        <p style={{ color: 'var(--text-secondary)' }}>Apply for a low-interest loan based on your contribution standing.</p>
      </header>

      <div className="dashboard-grid">
        <LoanRequestForm 
          memberships={memberships || []} 
          maxEligibleAmount={maxEligibleAmount} 
        />
...

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <Card title="Loan Summary" className="glass">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Interest Rate</span>
                <span style={{ fontWeight: 600 }}>5.0%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Term Duration</span>
                <span style={{ fontWeight: 600 }}>30 Days</span>
              </div>
              <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <Info size={16} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    Your application will be reviewed by the platform administrator. You will be notified via email and in-app once approved.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="glass" style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid var(--accent-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
               <Landmark size={20} color="var(--accent-primary)" />
               <h4 style={{ margin: 0 }}>Instant Credit</h4>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Save with Jenny provides credit at significantly lower rates compared to traditional banks by leveraging the trust built within your savings circle.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
