import React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { 
  Users, 
  Calendar, 
  Info, 
  ChevronLeft, 
  ShieldCheck,
  TrendingUp,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { formatDate } from '@/lib/utils/formatDate';
import { joinGroup } from '@/lib/group-actions';
import { ContributionProgress } from '@/components/groups/ContributionProgress';
import { MemberActionCenter } from './MemberActionCenter';

export default async function MemberGroupDetailPage({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: group } = await supabase
    .from('groups')
    .select('*, profiles(full_name)')
    .eq('slug', slug)
    .single();

  if (!group) notFound();

  const { data: membership } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', group.id)
    .eq('user_id', user.id)
    .single();

  const isMember = !!membership;

  const { data: schedule } = await supabase
    .from('payout_schedule')
    .select('*, profiles(full_name)')
    .eq('group_id', group.id)
    .order('scheduled_date', { ascending: true });

  // 4. Fetch Active Cycle for Progress Tracking
  let { data: activeCycle } = await supabase
    .from('group_cycles')
    .select('*')
    .eq('group_id', group.id)
    .eq('status', 'active')
    .order('cycle_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!activeCycle) {
    const { data: fallbackCycle } = await supabase
      .from('group_cycles')
      .select('*')
      .eq('group_id', group.id)
      .eq('cycle_number', (group as any).current_cycle_number || 1)
      .maybeSingle();
    activeCycle = fallbackCycle;
  }

  // 5. Fetch User Profile for Balance
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // 6. Fetch Member Contributions for Payout Stats
  const { data: memberContribs } = await supabase
    .from('contributions')
    .select('*')
    .eq('group_id', group.id)
    .eq('user_id', user.id);

  return (
    <div className="group-detail-page">
      <header style={{ marginBottom: '2.5rem' }}>
        <Link href="/dashboard/groups" style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          color: 'var(--text-secondary)',
          fontSize: '0.8125rem',
          marginBottom: '1rem'
        }} className="hover:text-white">
          <ChevronLeft size={14} /> Back to Browse
        </Link>
        
        <div className="header-flex">
          <div>
            <h1 style={{ marginBottom: '0.5rem' }}>{group.name}</h1>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div className={group.status === 'active' ? 'badge badge-success' : 'badge badge-warning'} style={{ fontSize: '0.65rem' }}>{group.status}</div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Managed by {group.profiles?.full_name}</span>
            </div>
          </div>
          
          {!isMember ? (
            <form action={joinGroup.bind(null, group.id) as any}>
              <Button size="lg" className="pulse-success" style={{ width: '100%' }}>Join Circle</Button>
            </form>
          ) : (
            <div className="badge badge-success" style={{ padding: '0.6rem 1.25rem', borderRadius: '0.75rem', fontSize: '0.8125rem' }}>
              <CheckCircle2 size={16} style={{ marginRight: '0.5rem' }} />
              Active Member
            </div>
          )}
        </div>
      </header>

      <div className="dashboard-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Main Info Card */}
          <Card className="glass shadow-sm">
            <h2 style={{ marginBottom: '1.25rem' }}>About this <span className="text-gradient">Circle</span></h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              {group.description || 'This group is dedicated to rotating savings and collective growth among its members.'}
            </p>

            <div className="stats-grid">
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', marginBottom: '0.25rem', fontWeight: 600, textTransform: 'uppercase' }}>CONTRIBUTION</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{formatCurrency(group.contribution_amount)}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', marginTop: '0.15rem' }}>Per {group.frequency}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', marginBottom: '0.25rem', fontWeight: 600, textTransform: 'uppercase' }}>START DATE</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{formatDate(group.start_date)}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>First cycle begins</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', marginBottom: '0.25rem', fontWeight: 600, textTransform: 'uppercase' }}>EXPECTED PAYOUT</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{formatCurrency(group.contribution_amount * group.max_members * 0.975)}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>Approx. after fees</div>
              </div>
            </div>
          </Card>

          {/* Membership Stats */}
          <div className="stats-grid">
            <Card className="glass">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ 
                  width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)'
                }}>
                  <Users size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Members</div>
                  <div style={{ fontWeight: 700 }}>{group.current_members} / {group.max_members}</div>
                </div>
              </div>
            </Card>
            <Card className="glass">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ 
                  width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-gold)'
                }}>
                  <Clock size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Frequency</div>
                  <div style={{ fontWeight: 700, textTransform: 'capitalize' }}>{group.frequency}</div>
                </div>
              </div>
            </Card>
          </div>

          <div className="stats-grid">
            <Card className="glass" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 700 }}>YOUR BALANCE</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{formatCurrency(profile?.wallet_balance || 0)}</div>
            </Card>
            <Card className="glass">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 700 }}>PAID TO DATE</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{formatCurrency(memberContribs?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0)}</div>
            </Card>
            <Card className="glass" style={{ background: 'rgba(59, 130, 246, 0.05)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 700 }}>ACTIVE ROUND</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>
                 {activeCycle?.cycle_number || (group as any).current_cycle_number || 1}
              </div>
            </Card>
          </div>

          {/* NEW: Action-First Mobile Layout - Move critical actions higher */}
          {isMember && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div className="desktop-only" style={{ display: 'none' }}>{/* Placeholder for desktop logic if needed */}</div>
              <Card title="Manage Savings" className="glass shadow-lg" style={{ border: '1px solid var(--accent-primary)', background: 'rgba(59, 130, 246, 0.05)' }}>
                <MemberActionCenter 
                  user={{ id: user.id, email: user.email! }}
                  group={{ id: group.id, contribution_amount: group.contribution_amount }}
                  activeCycle={activeCycle}
                />
              </Card>
              
              <div className="stats-grid">
                <Card title="Your Position" className="glass shadow-sm">
                  <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-primary)' }}>#{membership.position}</div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      Rotation Turn
                    </p>
                  </div>
                </Card>
                <Card title="Trust Score" className="glass shadow-sm">
                   <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                     <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>{profile?.trust_score || 350}</div>
                     <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                       Platform Reliability
                     </p>
                   </div>
                </Card>
              </div>
            </div>
          )}

          {/* New Contribution Progress Tracker */}
          {activeCycle && (
            <ContributionProgress 
              groupId={group.id} 
              cycleId={activeCycle.id} 
              cycleNumber={activeCycle.cycle_number}
              contributionAmount={group.contribution_amount} 
            />
          )}

          {/* Rotation Timeline */}
          {schedule && schedule.length > 0 && (
            <Card title="Rotation Schedule" subtitle="Transparency on all upcoming payouts in this circle." className="glass">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {schedule.map((item, idx) => (
                  <div key={item.id} style={{ 
                    display: 'flex', 
                    gap: '1.5rem', 
                    position: 'relative',
                    paddingBottom: idx === schedule.length - 1 ? 0 : '1.5rem'
                  }}>
                    {/* Timeline Line */}
                    {idx !== schedule.length - 1 && (
                      <div style={{ 
                        position: 'absolute', 
                        left: '19px', 
                        top: '40px', 
                        bottom: 0, 
                        width: '2px', 
                        background: 'var(--glass-border)' 
                      }}></div>
                    )}
                    
                    {/* Circle Indicator */}
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '50%', 
                      background: item.status === 'completed' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                      border: '4px solid var(--bg-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 1,
                      color: item.status === 'completed' ? '#000' : 'var(--text-secondary)'
                    }}>
                      {item.status === 'completed' ? <CheckCircle2 size={20} /> : <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>{idx + 1}</span>}
                    </div>

                    <div style={{ flex: 1, padding: '1rem', background: item.recipient_id === user?.id ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255, 255, 255, 0.02)', borderRadius: '0.75rem', border: '1px solid var(--glass-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <div style={{ fontWeight: 600 }}>
                          {item.profiles?.full_name} {item.recipient_id === user?.id && <span className="badge badge-success" style={{ marginLeft: '0.5rem' }}>YOU</span>}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDate(item.scheduled_date)}</div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Payout Amount: {formatCurrency(item.amount)}</div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: item.status === 'completed' ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                          {item.status}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {(!schedule || schedule.length === 0) && (
            <Card className="glass" style={{ textAlign: 'center', padding: '3rem' }}>
              <Calendar size={48} style={{ marginBottom: '1.5rem', opacity: 0.1 }} />
              <h3 style={{ marginBottom: '0.5rem' }}>No Schedule Yet</h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
                The rotation schedule will be generated by the administrator once the group is ready to start.
              </p>
            </Card>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Rules & Transparency */}
          <Card title="Transparency & Fees" className="glass">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Management Fee</span>
                <span style={{ fontWeight: 600 }}>{group.management_fee_percent}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Late Fee</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(group.late_fee_amount || 0)}</span>
              </div>
              <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', color: 'var(--accent-primary)', fontSize: '0.75rem', lineHeight: 1.4 }}>
                  <ShieldCheck size={16} style={{ flexShrink: 0 }} />
                  <p>All contributions are securely held and managed via Paystack integration for maximum transparency.</p>
                </div>
              </div>
            </div>
          </Card>

          {(!isMember && group.current_members < group.max_members) && (
            <Card className="glass" style={{ background: 'var(--accent-primary)', color: '#000' }}>
              <h3 style={{ marginBottom: '0.75rem' }}>Ready to Join?</h3>
              <p style={{ fontSize: '0.875rem', marginBottom: '1.5rem', opacity: 0.8 }}>
                Join now to secure your position in the upcoming rotation cycle.
              </p>
              <form action={joinGroup.bind(null, group.id) as any}>
                <Button variant="secondary" style={{ width: '100%', background: '#000', color: '#fff', border: 'none' }}>
                  Confirm & Join Group
                </Button>
              </form>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
