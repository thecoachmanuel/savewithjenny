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
  AlertCircle
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { notFound } from 'next/navigation';
import { generateRotationSchedule } from '@/lib/payout-actions';
import { InviteLinkButton } from './InviteLinkButton';
import { AddMemberForm } from './AddMemberForm';
import { MemberPositionForm } from './MemberPositionForm';
import { CycleJumpForm } from './CycleJumpForm';
import { PushNextCycleForm } from './PushNextCycleForm';
import { ContributionProgress } from '@/components/groups/ContributionProgress';
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

    // 1c. Fetch Cycle Info
    const { data: currentCycle } = await supabase
      .from('group_cycles')
      .select('*, profiles:payout_recipient(full_name)')
      .eq('group_id', group.id)
      .eq('cycle_number', group.current_cycle_number || 1)
      .single();

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
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{group.name}</h1>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div className={
                  group.status === 'active' ? 'badge badge-success' : 
                  group.status === 'completed' ? 'badge badge-neutral' : 
                  'badge badge-warning'
                }>
                  {group.status}
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Created by {group.profiles?.full_name}</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <InviteLinkButton slug={group.slug} />
              <Link href={`/admin/groups/${group.slug}/edit`}>
                <Button leftIcon={<Settings size={18} />}>Manage Group</Button>
              </Link>
            </div>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Group Overview Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
              <Card className="glass">
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '0.5rem' }}>TOTAL POOL</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{formatCurrency(group.total_pool || 0)}</div>
              </Card>
              <Card className="glass">
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '0.5rem' }}>CONTRIBUTION</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{formatCurrency(group.contribution_amount)}</div>
              </Card>
              <Card className="glass">
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '0.5rem' }}>CURRENT CYCLE</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                  {group.status === 'completed' ? 'Rotation Finished' : 
                   group.current_cycle_number ? `Round ${group.current_cycle_number}` : 'Standby'}
                </div>
              </Card>
            </div>

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

            {/* Quick Actions */}
            <Card title="Orchestration" className="glass">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem', fontWeight: 600 }}>NEXT STEP</div>
                  {group.status !== 'completed' ? (
                    <PushNextCycleForm 
                      groupId={group.id} 
                      groupSlug={group.slug} 
                      currentCycle={group.current_cycle_number || 0} 
                      totalMembers={members?.length || 0} 
                    />
                  ) : (
                    <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '0.5rem', textAlign: 'center', color: 'var(--accent-primary)', fontSize: '0.875rem', fontWeight: 600 }}>
                      Rotation Completed
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.25rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem', fontWeight: 600 }}>MANUAL OVERRIDE</div>
                  <CycleJumpForm 
                    groupId={group.id} 
                    currentCycle={group.current_cycle_number} 
                    totalCycles={group.max_members} 
                    status={group.status}
                  />
                </div>

                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.25rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem', fontWeight: 600 }}>MAINTENANCE</div>
                  <form action={generateRotationSchedule.bind(null, group.id)}>
                    <Button 
                      type="submit" 
                      variant="secondary" 
                      style={{ width: '100%', justifyContent: 'flex-start' }} 
                      leftIcon={<Calendar size={18} />}
                      disabled={group.status === 'completed'}
                    >
                      Sync & Rebuild Schedule
                    </Button>
                  </form>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'center' }}>
                    Ensures positions and payouts are correctly synced with member list.
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
            <Button onClick={() => typeof window !== 'undefined' && window.location.reload()}>
              Retry Connection
            </Button>
          </div>
        </Card>
      </div>
    );
  }
}
