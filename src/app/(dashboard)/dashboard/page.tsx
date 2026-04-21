import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Users, 
  Wallet, 
  ChevronRight, 
  Calendar, 
  ArrowRight,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { formatDate } from '@/lib/utils/formatDate';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'My Dashboard | Save with Jenny',
  description: 'Manage your contributions, rotations, and eligibility.',
};

export default async function MemberDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // 1. Fetch User Profile
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  
  // Smart Redirect for Admins/Owners
  if (profile?.role === 'owner' || profile?.role === 'admin') {
    redirect('/admin');
  }

  // 1b. Fetch Group Data
  const { data: memberships } = await supabase.from('group_members').select('group_id, position, created_at').eq('user_id', user.id);
  const groupIds = memberships?.map(m => m.group_id) || [];
  
  // 2. Fetch Next Payout
  const { data: nextPayout } = await supabase
    .from('payout_schedule')
    .select('*, groups(name)')
    .eq('recipient_id', user.id)
    .eq('status', 'scheduled')
    .order('scheduled_date', { ascending: true })
    .limit(1)
    .maybeSingle();

  // 3. Fetch Recent Contributions for Trust Score calculation
  const { data: recentContributions } = await supabase
    .from('contributions')
    .select('status')
    .eq('user_id', user.id);
  
  const successCount = recentContributions?.filter(c => c.status === 'paid').length || 0;
  const trustScore = Math.min(300 + (successCount * 50), 990); 

  return (
    <div className="member-dashboard">
      <header style={{ marginBottom: '2.5rem' }} className="header-flex">
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Hello, <span className="text-gradient">{profile?.full_name?.split(' ')[0]}</span></h1>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome back to your thrift Command Center.</p>
        </div>
      </header>

      <div className="dashboard-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Main Highlights */}
          <div className="stats-grid">
            <Card className="glass" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%)', padding: '1.5rem' }}>
               <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '0.5rem', fontWeight: 600 }}>WALLET BALANCE</div>
               <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{formatCurrency(Number(profile?.wallet_balance) || 0)}</div>
               <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Available for withdrawal</p>
            </Card>

            <Card className="glass" style={{ padding: '1.5rem' }}>
               <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '0.5rem', fontWeight: 600 }}>TOTAL CONTRIBUTED</div>
               <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{formatCurrency(Number(profile?.total_contributions) || 0)}</div>
               <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Across all groups</p>
            </Card>

            <Card className="glass" style={{ padding: '1.5rem' }}>
               <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '0.5rem', fontWeight: 600 }}>PAYOUTS RECEIVED</div>
               <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981' }}>{formatCurrency(Number(profile?.total_payouts_received) || 0)}</div>
               <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Lifecycle earnings</p>
            </Card>
          </div>

          {/* Quick Stats: Upcoming Payout */}
          {nextPayout && (
            <div style={{ marginTop: '0.5rem' }}>
              <h2 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Next <span className="text-gradient">Scheduled Payout</span></h2>
              <Card className="glass" style={{ padding: '1.5rem', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#3b82f6' }}>{formatCurrency(Number(nextPayout.amount))}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>From {nextPayout.groups?.name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{formatDate(nextPayout.scheduled_date)}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estimated Payout Date</div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Sidebar / Quick Tips */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <Card title="Trust Score" className="glass">
             <div style={{ fontSize: '2.5rem', fontWeight: 800, textAlign: 'center', margin: '1rem 0' }}>{trustScore}</div>
             <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '1.5rem' }}>
               {trustScore > 800 ? "Your score is Excellent! You're eligible for higher zero-interest loans." : "Increase your score by making regular on-time contributions."}
             </p>
             <div style={{ height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: `${(trustScore/1000)*100}%`, height: '100%', background: 'var(--accent-primary)' }}></div>
             </div>
          </Card>

          <Card title="Quick Resources" className="glass">
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.875rem' }}>
                   <CheckCircle2 size={16} className="text-secondary" style={{ flexShrink: 0 }} />
                   <span>How to maximize your rotation earnings</span>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.875rem' }}>
                   <CheckCircle2 size={16} className="text-secondary" style={{ flexShrink: 0 }} />
                   <span>Eligibility for business expansion loans</span>
                 </div>
                <Link href="/dashboard/profile" style={{ marginTop: '1rem' }}>
                  <Button variant="secondary" style={{ width: '100%' }}>Complete KYC</Button>
                </Link>
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
