import React from 'react';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { 
  Landmark, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Filter,
  Search,
  ArrowUpRight,
  User as UserIcon
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { formatDate } from '@/lib/utils/formatDate';
import { approveLoan } from '@/lib/loan-actions';
import { unstable_noStore as noStore } from 'next/cache';

export default async function AdminLoansPage() {
  noStore();
  const supabase = await createClient();

  const { data: loans, error: loansError } = await supabase
    .from('loans')
    .select('*, profiles:user_id(full_name, avatar_url, email), groups(name)')
    .order('created_at', { ascending: false });

  if (loansError) {
    console.error('Error fetching loans for admin:', {
      message: loansError.message,
      details: loansError.details,
      hint: loansError.hint,
      code: loansError.code
    });
  }

  const pendingLoans = loans?.filter(l => l.status === 'pending') || [];
  const processedLoans = loans?.filter(l => l.status !== 'pending') || [];

  return (
    <div className="admin-loans-page">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Loan <span className="text-gradient">Requests</span></h1>
          <p style={{ color: 'var(--text-secondary)' }}>Review and approve loan applications from members.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
           <Button variant="secondary" leftIcon={<Filter size={18} />}>Filter</Button>
        </div>
      </header>

      {/* Pending Loans Section */}
      <section style={{ marginBottom: '4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem' }}>Pending <span className="text-gradient">Approvals</span></h2>
          <div style={{ 
            width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent-gold)', 
            color: '#000', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}>
            {pendingLoans.length}
          </div>
          <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {pendingLoans.map((loan) => (
            <Card key={loan.id} className="glass">
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1.5fr) 1fr 1fr 1fr', gap: '2rem', alignItems: 'center' }}>
                {/* User Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ 
                    width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-tertiary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                  }}>
                    {loan.profiles?.avatar_url ? (
                      <img src={loan.profiles.avatar_url} alt="" style={{ width: '100%', height: '100%' }} />
                    ) : (
                      <UserIcon size={24} color="var(--text-secondary)" />
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{loan.profiles?.full_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)' }}>{loan.profiles?.email}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{loan.groups?.name || 'General'}</div>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>REQUESTED</div>
                  <div style={{ fontWeight: 700, fontSize: '1.125rem' }}>{formatCurrency(loan.amount)}</div>
                </div>

                {/* Purpose */}
                <div style={{ maxWidth: '200px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>PURPOSE</div>
                  <div style={{ 
                    fontSize: '0.875rem', 
                    color: 'var(--text-secondary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }} title={loan.purpose}>
                    {loan.purpose}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <Button variant="ghost" style={{ color: 'var(--danger)' }}><XCircle size={18} /></Button>
                  <form action={approveLoan.bind(null, loan.id) as any}>
                    <Button type="submit" size="sm" leftIcon={<CheckCircle2 size={16} />}>Approve</Button>
                  </form>
                </div>
              </div>
            </Card>
          ))}

          {pendingLoans.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>
              <CheckCircle2 size={48} style={{ marginBottom: '1rem', color: 'var(--accent-primary)' }} />
              <p>No pending loan requests at the moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* Processed History */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--text-secondary)' }}>Loan <span style={{ color: 'var(--text-muted)' }}>History</span></h2>
          <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
        </div>

        <Card className="glass" style={{ padding: '0' }}>
           <div style={{ display: 'flex', flexDirection: 'column' }}>
             {processedLoans.map((loan) => (
                <div key={loan.id} style={{ 
                  padding: '1.25rem 2rem', 
                  borderBottom: '1px solid var(--glass-border)',
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{loan.profiles?.full_name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{loan.profiles?.email}</div>
                    </div>
                    <div className="badge badge-success" style={{ fontSize: '0.65rem' }}>{loan.status}</div>
                  </div>
                  <div style={{ fontSize: '0.875rem' }}>{formatCurrency(loan.amount)}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{formatDate(loan.created_at)}</div>
                  <div style={{ textAlign: 'right' }}>
                    <Link href={`/admin/members?q=${loan.profiles?.email}`} className="btn-ghost" style={{ padding: '0.5rem' }}>
                       <ArrowUpRight size={18} />
                    </Link>
                  </div>
                </div>
             ))}
           </div>
        </Card>
      </section>
    </div>
  );
}
