import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { 
  Landmark, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  History,
  XCircle
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { formatDate } from '@/lib/utils/formatDate';

export default async function LoansPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Fetch Loans & Profile
  const { data: loans } = await supabase
    .from('loans')
    .select('*, groups(name)')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false });

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single();

  // 2. Fetch Platform Settings for Eligibility
  const { data: settings } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'loan_config')
    .single();

  const maxLoanPercent = settings?.value?.max_loan_percent || 50;
  const totalContributions = Number(profile?.total_contributions) || 0;
  const maxEligibleAmount = totalContributions * (maxLoanPercent / 100);

  const activeLoan = loans?.find(l => l.status === 'disbursed' || l.status === 'repaying');
  const pendingLoan = loans?.find(l => l.status === 'pending');

  const { data: contributions } = await supabase
    .from('contributions')
    .select('count')
    .eq('user_id', user?.id)
    .eq('status', 'success')
    .single();

  return (
    <div className="loans-page">
      <header style={{ marginBottom: '2.5rem' }} className="header-flex">
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Loan <span className="text-gradient">Center</span></h1>
          <p style={{ color: 'var(--text-secondary)' }}>Access credit based on your thrift contribution history.</p>
        </div>
        
        <Link href="/dashboard/loans/request">
          <Button leftIcon={<Plus size={18} />} disabled={!!pendingLoan || !!activeLoan || maxEligibleAmount <= 0}>
            Request Loan
          </Button>
        </Link>
      </header>

      {/* Info Banner */}
      <div className="badge badge-success" style={{ 
        width: '100%', 
        padding: '1.25rem', 
        marginBottom: '2.5rem', 
        borderRadius: '1rem',
        textTransform: 'none',
        fontWeight: 400,
        gap: '1rem',
        alignItems: 'center'
      }}>
        <TrendingUp size={24} style={{ flexShrink: 0 }} />
        <div>
          <strong style={{ display: 'block', fontSize: '1rem' }}>Loan Eligibility</strong>
          <p style={{ color: 'inherit', fontSize: '0.875rem', opacity: 0.8 }}>
            Your eligibility is calculated as {maxLoanPercent}% of your total contributions (currently {formatCurrency(totalContributions)}).
          </p>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Status Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Card title="My Standing" className="glass">
             <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
               You have successfully contributed {contributions?.count || 0} times. 
               {profile?.kyc_verified ? ' Your account is fully verified.' : ' Complete KYC to unlock higher limits.'}
             </div>
             <div style={{ padding: '1.5rem', background: 'var(--bg-tertiary)', borderRadius: '0.75rem', textAlign: 'center' }}>
               <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>MAX ELIGIBLE AMOUNT</div>
               <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{formatCurrency(maxEligibleAmount)}</div>
             </div>
          </Card>

          {activeLoan && (
            <Card className="glass" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>ACTIVE REPAYMENT</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>{formatCurrency(activeLoan.total_repayment - (activeLoan.amount_repaid || 0))}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Due on {formatDate(activeLoan.due_date)}</div>
              <Button size="sm" variant="secondary" style={{ width: '100%', marginTop: '1.5rem' }}>Repay Now</Button>
            </Card>
          )}

          {pendingLoan && !activeLoan && (
            <div className="badge badge-warning" style={{ padding: '1rem', borderRadius: '0.75rem', display: 'flex', gap: '0.75rem', textTransform: 'none' }}>
              <Clock size={18} />
              <span style={{ fontSize: '0.875rem' }}>Your request for {formatCurrency(pendingLoan.amount)} is pending approval.</span>
            </div>
          )}
        </div>

        {/* Loan History */}
        <Card title="Loan History" className="glass">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {loans?.map((loan) => (
              <div key={loan.id} style={{ 
                padding: '1.25rem', 
                background: 'rgba(255, 255, 255, 0.02)', 
                borderRadius: '0.75rem', 
                border: '1px solid var(--glass-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ 
                    width: '44px', height: '44px', borderRadius: '10px', background: 'var(--bg-tertiary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Landmark size={20} color="var(--accent-primary)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{formatCurrency(loan.amount)}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{loan.groups?.name || 'General Loan'} • {formatDate(loan.created_at)}</div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                   <div style={{ 
                     fontSize: '0.75rem', 
                     fontWeight: 700, 
                     display: 'flex', 
                     alignItems: 'center', 
                     gap: '0.4rem', 
                     justifyContent: 'flex-end',
                     color: loan.status === 'disbursed' ? 'var(--accent-primary)' : 'inherit',
                     textTransform: 'uppercase'
                   }}>
                     {loan.status === 'pending' && <Clock size={14} className="text-warning" />}
                     {loan.status === 'approved' && <CheckCircle2 size={14} className="text-secondary" />}
                     {loan.status === 'disbursed' && <CheckCircle2 size={14} className="text-secondary" />}
                     {loan.status === 'rejected' && <XCircle size={14} className="text-danger" />}
                     <span>{loan.status}</span>
                   </div>
                   <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                     Total: {formatCurrency(loan.total_repayment)}
                   </div>
                </div>
              </div>
            ))}

            {(!loans || loans.length === 0) && (
              <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
                <History size={48} style={{ marginBottom: '1.5rem', opacity: 0.1 }} />
                <p>No loan history found.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
