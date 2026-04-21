import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { 
  Users, 
  Calendar, 
  Settings, 
  ChevronLeft, 
  Share2, 
  UserPlus,
  ArrowRight,
  AlertCircle,
  RefreshCcw as RefreshCwIcon
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { notFound } from 'next/navigation';
import { generateRotationSchedule } from '@/lib/payout-actions';
import { InviteLinkButton } from './InviteLinkButton';
import { AddMemberForm } from './AddMemberForm';
import { MemberPositionForm } from './MemberPositionForm';
import { CycleJumpForm } from './CycleJumpForm';
import { PushNextCycleForm } from './PushNextCycleForm';
import { CompleteRotationForm } from './CompleteRotationForm';
import { ContributionProgress } from '@/components/groups/ContributionProgress';
import { AdminPaymentMatrix } from '@/components/groups/AdminPaymentMatrix';
import { unstable_noStore as noStore } from 'next/cache';

export default async function AdminGroupDetailPage({ params }: { params: { slug: string } }) {
  noStore();
  const { slug } = await params;
  
  try {
    const supabase = await createClient();

    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('*, profiles(full_name)')
      .eq('slug', slug)
      .single();

    if (groupError || !group) {
      notFound();
    }

    const { data: members } = await supabase
      .from('group_members')
      .select('*, profiles(full_name, email, avatar_url)')
      .eq('group_id', group.id)
      .order('position', { ascending: true });

    // 1b. Fetch All Profiles for Manual Selection
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .order('full_name', { ascending: true });

    // 1c. Fetch Active Cycle Info
    let { data: currentCycle } = await supabase
      .from('group_cycles')
      .select('*, profiles:payout_recipient(full_name)')
      .eq('group_id', group.id)
      .eq('status', 'active')
      .order('cycle_number', { ascending: false }) // Take the latest active one if multiple exist
      .limit(1)
      .maybeSingle();

    if (!currentCycle) {
      const { data: fallbackCycle } = await supabase
        .from('group_cycles')
        .select('*, profiles:payout_recipient(full_name)')
        .eq('group_id', group.id)
        .eq('cycle_number', (group as any).current_cycle_number || 1)
        .maybeSingle();
      currentCycle = fallbackCycle;
    }

  return (
    <div className="group-detail-page">
      <header style={{ marginBottom: '2.5rem' }}>
        <Link href="/admin/groups" style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          color: 'var(--text-secondary)',
          fontSize: '0.875rem',
          marginBottom: '1rem'
        }} className="hover:text-white">
          <ChevronLeft size={16} /> Back to Groups
        </Link>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
              <h1 style={{ fontSize: '2.5rem', margin: 0 }}>{group.name}</h1>
              <div className={
                group.status === 'active' ? 'badge badge-success' : 
                group.status === 'completed' ? 'badge badge-neutral' : 
                'badge badge-warning'
              }>
                {group.status}
              </div>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
              Management System Overview • Created by {group.profiles?.full_name}
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <InviteLinkButton slug={group.slug} />
            <Link href={`/admin/groups/${group.slug}/edit`}>
              <Button leftIcon={<Settings size={18} />} variant="secondary">Configure</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* NEW: Action Center Hero Banner */}
      <Card className="glass" style={{ marginBottom: '2.5rem', border: '1px solid var(--accent-primary)', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, transparent 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ 
              width: '48px', height: '48px', borderRadius: '1rem', background: 'rgba(16, 185, 129, 0.1)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)'
            }}>
              <Calendar size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Admin Action Center
              </div>
              <h2 style={{ margin: '0.25rem 0', fontSize: '1.5rem' }}>
                {group.status === 'active' ? (
                  currentCycle ? `In Round ${currentCycle.cycle_number} of ${members?.length || '?'}` : 'Rotation Ready to Start'
                ) : group.status === 'completed' ? 'Rotation Finished Successfully' : 'Group in Standby'}
              </h2>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {group.status === 'active' 
                  ? `Next Payout: ${currentCycle?.profiles?.full_name || 'N/A'} for ${formatCurrency(currentCycle?.payout_amount || 0)}`
                  : group.status === 'pending' ? 'Click Start to begin the first round of contributions.' : 'This rotation has ended.'}
              </p>
            </div>
          </div>
          
          <div style={{ minWidth: '200px' }}>
            {group.status === 'active' && currentCycle && (
              // Only show "Finish" if we are IN the final cycle and it is already ACTIVE
              // This avoids the 'skip Round 1' confusion
              currentCycle.cycle_number >= (members?.length || 0) && currentCycle.cycle_number > 1 ? (
                <CompleteRotationForm groupId={group.id} />
              ) : (
                <PushNextCycleForm 
                  groupId={group.id} 
                  groupSlug={group.slug} 
                  currentCycle={currentCycle.cycle_number} 
                  totalMembers={members?.length || 0} 
                />
              )
            )}
            {group.status === 'pending' && (
               <PushNextCycleForm 
                  groupId={group.id} 
                  groupSlug={group.slug} 
                  currentCycle={0} 
                  totalMembers={members?.length || 0} 
               />
            )}
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Group Overview Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
              <Card className="glass" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '0.5rem', fontWeight: 700 }}>LIQUIDITY POOL</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900 }}>{formatCurrency(group.total_pool || 0)}</div>
              </Card>
              <Card className="glass">
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '0.5rem' }}>MEMBER CONTRIBUTION</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900 }}>{formatCurrency(group.contribution_amount)}</div>
              </Card>
              <Card className="glass" style={{ background: 'rgba(59, 130, 246, 0.05)' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '0.5rem' }}>ACTIVE STATUS</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                  {group.status === 'completed' ? 'COMPLETE' : 
                   currentCycle ? `ROUND ${currentCycle.cycle_number}` : 'STANDBY'}
                </div>
              </Card>
            </div>

            {/* New: Robust Payment Tracking Matrix */}
            <AdminPaymentMatrix 
              groupId={group.id} 
              contributionAmount={group.contribution_amount} 
              totalPool={group.total_pool || 0}
            />

            {/* Contribution Progress Tracker for Admins */}
            {currentCycle && (
              <ContributionProgress 
                groupId={group.id} 
                cycleId={currentCycle.id} 
                cycleNumber={currentCycle.cycle_number}
                contributionAmount={group.contribution_amount} 
              />
            )}

            {/* Member List */}
            <Card title={`Members (${members?.length || 0} / ${group.max_members})`} className="glass">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {members?.map((member) => (
                  <div key={member.id} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '1rem',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '0.75rem',
                    border: '1px solid var(--glass-border)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ 
                        width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-tertiary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {member.profiles?.avatar_url ? (
                          <img src={member.profiles.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                        ) : (
                          <span style={{ fontWeight: 600 }}>{member.profiles?.full_name?.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{member.profiles?.full_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{member.profiles?.email}</div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>POSITION</div>
                        <MemberPositionForm 
                          groupId={group.id} 
                          userId={member.user_id} 
                          currentPosition={member.position}
                          maxMembers={group.max_members}
                        />
                      </div>
                      <div className="badge badge-success">{member.status}</div>
                    </div>
                  </div>
                ))}

                {(!members || members.length === 0) && (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                    <Users size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                    <p>No members have joined this group yet.</p>
                  </div>
                )}
              </div>

              {group.status !== 'completed' && (
                <AddMemberForm groupId={group.id} allProfiles={allProfiles || []} />
              )}
            </Card>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Rules Card */}
            <Card title="Group Rules" className="glass">
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                {group.rules || 'No specific rules defined for this group.'}
              </p>
              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Management Fee</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{group.management_fee_percent}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Late Fee</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{formatCurrency(group.late_fee_amount || 0)}</span>
                </div>
              </div>
            </Card>

            {/* Orchestration Controls */}
            <Card className="glass" style={{ border: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <Settings size={20} className="text-gradient" />
                <h3 style={{ margin: 0, fontSize: '1rem' }}>Command Console</h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Round Override</div>
                  <CycleJumpForm 
                    groupId={group.id} 
                    currentCycle={currentCycle?.cycle_number || 1} 
                    totalCycles={group.max_members} 
                    status={group.status}
                  />
                </div>

                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>System Sync</div>
                  <form action={generateRotationSchedule.bind(null, group.id) as any}>
                    <Button 
                      type="submit" 
                      variant="secondary" 
                      style={{ width: '100%', justifyContent: 'flex-start', background: 'rgba(255, 255, 255, 0.02)' }} 
                      leftIcon={<RefreshCwIcon size={18} />}
                      disabled={group.status === 'completed'}
                    >
                      Sync Rotation Data
                    </Button>
                  </form>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'center' }}>
                    Re-aligns payout recipients with the latest member positions.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  } catch (err) {
    console.error('[ADMIN GROUP PAGE] Error loading data:', err);
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <Card className="glass" style={{ maxWidth: '500px', margin: '0 auto', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: '1.5rem' }} />
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Connection <span className="text-gradient">Error</span></h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            We encountered a temporary issue connecting to the database. This usually happens during intermittent network status or maintenance.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link href="/admin/groups">
              <Button variant="secondary">Back to Groups</Button>
            </Link>
            <Link href={`/admin/groups/${slug}`}>
              <Button>Retry Connection</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }
}
