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

  // 1. Fetch User Profile & Groups
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  
  // Smart Redirect for Admins/Owners
  if (profile?.role === 'owner' || profile?.role === 'admin') {
    redirect('/admin');
  }
  const { data: memberships } = await supabase.from('group_members').select('group_id, position, created_at').eq('user_id', user.id);
  const groupIds = memberships?.map(m => m.group_id) || [];
  const { data: groups } = groupIds.length > 0 
    ? await supabase.from('groups').select('*').in('id', groupIds)
    : { data: [] };

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
  const trustScore = Math.min(300 + (successCount * 50), 990); // Start at 300, gain 50 per successful pay

  return (
    <div className="member-dashboard">
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Hello, <span className="text-gradient">{profile?.full_name?.split(' ')[0]}</span></h1>
        <p style={{ color: 'var(--text-secondary)' }}>Welcome back to your thrift Command Center.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Main Highlights */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <Card className="glass flex-center" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)', padding: '2rem', alignItems: 'flex-start' }}>
               <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>TOTAL CONTRIBUTED</div>
               <div style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>{formatCurrency(Number(profile?.total_contributions) || 0)}</div>
               <Link href="/dashboard/wallet">
                 <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={16} />}>View Ledger</Button>
               </Link>
            </Card>

            <Card className="glass" style={{ padding: '2rem' }}>
               <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>UPCOMING PAYOUT</div>
               {nextPayout ? (
                 <>
                   <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>{formatCurrency(Number(nextPayout.amount))}</div>
                   <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                     <Calendar size={16} /> {formatDate(nextPayout.scheduled_date)}
                   </div>
                 </>
               ) : (
                 <div style={{ padding: '1rem 0' }}>
                   <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No payouts currently scheduled.</p>
                   <Link href="/dashboard/groups" className="text-gradient" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
                     Join a group to start saving <ChevronRight size={14} />
                   </Link>
                 </div>
               )}
            </Card>
          </div>

          {/* Active Groups List */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
               <h2 style={{ fontSize: '1.5rem' }}>Active <span className="text-gradient">Thrift Groups</span></h2>
               <Link href="/dashboard/groups" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }} className="hover:text-white">See all</Link>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               {groups?.map((group) => {
                 const membership = memberships?.find(m => m.group_id === group.id);
                 return (
                  <Link key={group.id} href={`/dashboard/groups/${group.slug}`}>
                    <Card className="glass hover-lift" style={{ padding: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
                            <Users size={20} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700 }}>{group.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{group.frequency} contribution cycle</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 600 }}>{formatCurrency(Number(group.contribution_amount))}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 600 }}>
                            Position #{membership?.position}
                          </div>
                          <div style={{ 
                            fontSize: '0.65rem', 
                            padding: '0.2rem 0.6rem', 
                            borderRadius: '1rem', 
                            background: group.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                            color: group.status === 'active' ? 'var(--accent-primary)' : 'var(--text-muted)',
                            display: 'inline-block',
                            marginTop: '0.25rem',
                            fontWeight: 700,
                            textTransform: 'uppercase'
                          }}>
                            {group.status}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                )})}
               
               {groups?.length === 0 && (
                 <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', border: '2px dashed var(--glass-border)', borderRadius: '1rem' }}>
                   Join a group to see it here!
                 </div>
               )}
            </div>
          </section>
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
                <Link href="/dashboard/profile">
                  <Button variant="secondary" style={{ width: '100%', marginTop: '1rem' }}>Complete KYC</Button>
                </Link>
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
