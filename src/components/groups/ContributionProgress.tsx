import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { CheckCircle2, Clock, Mail, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatCurrency';

interface ContributionProgressProps {
  groupId: string;
  cycleId: string;
  cycleNumber: number;
  contributionAmount: number;
}

export async function ContributionProgress({ groupId, cycleId, cycleNumber, contributionAmount }: ContributionProgressProps) {
  const supabase = await createClient();

  try {
    // If cycleNumber is not provided, try to resolve it from the cycle record
    let resolvedCycleNumber = cycleNumber;
    if (!resolvedCycleNumber && cycleId) {
      const { data: cycleData } = await supabase.from('group_cycles').select('cycle_number').eq('id', cycleId).single();
      resolvedCycleNumber = cycleData?.cycle_number || 1;
    }

    // 1. Get all members of the group
    const { data: members, error: membersError } = await supabase
      .from('group_members')
      .select('*, profiles(full_name, avatar_url, email)')
      .eq('group_id', groupId)
      .order('position', { ascending: true });

    if (membersError) throw membersError;

    // 2. Get all contributions for this specific cycle
    let contributions: any[] = [];
    
    // Attempt 1: Standard lookup (with cycle_id if available)
    try {
      const { data: contribData, error: contribError } = await supabase
        .from('contributions')
        .select('user_id, status, amount, cycle_id')
        .eq('group_id', groupId)
        .eq('status', 'paid');
      
      if (contribError) throw contribError;

      // Filter for this cycle if possible
      const primaryResults = (contribData || []).filter(c => !cycleId || c.cycle_id === cycleId);
      
      // If we found participants, use them
      if (primaryResults.length > 0) {
        contributions = primaryResults;
      } else {
        // Attempt 2: Fallback to payment_records ONLY IF cycle_id linking is broken
        // but restrict to very recent records to avoid cross-round leakage
        const { data: records } = await supabase
          .from('payment_records')
          .select('user_id, status, amount, created_at')
          .eq('group_id', groupId)
          .eq('status', 'success')
          .order('created_at', { descending: true });
        
        // Safety: If we're in a specific cycle, we shouldn't just grab every history record.
        // For now, we'll only use these if the contributions table is truly empty for this group.
        if (!contribData || contribData.length === 0) {
           contributions = (records || []).slice(0, members.length).map(r => ({ ...r, status: 'paid' }));
        }
      }
    } catch (e: any) {
      console.warn('[CONTRIBUTION PROGRESS] Fallback: Direct query failed, checking payment_records', e.message);
      const { data: records } = await supabase
        .from('payment_records')
        .select('user_id, status, amount')
        .eq('group_id', groupId)
        .eq('status', 'success');
      
      contributions = (records || []).map(r => ({ ...r, status: 'paid' }));
    }

    if (!members) return null;

    const paidUserIds = new Set(contributions?.map(c => c.user_id) || []);
    const paidCount = paidUserIds.size;
    const totalCount = members.length;
    const progressPercent = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;
    const totalCollected = paidCount * contributionAmount;
    const totalExpected = totalCount * contributionAmount;
    const isFullyPaid = paidCount === totalCount && totalCount > 0;

    return (
    <Card className="glass" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
      {/* Background Decorative Gradient */}
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        right: 0, 
        width: '150px', 
        height: '150px', 
        background: isFullyPaid ? 'radial-gradient(circle at top right, rgba(16, 185, 129, 0.15), transparent)' : 'radial-gradient(circle at top right, rgba(59, 130, 246, 0.1), transparent)',
        pointerEvents: 'none'
      }} />

      {isFullyPaid ? (
        <div style={{ 
          position: 'absolute', 
          top: '1rem', 
          right: '1rem', 
          background: 'rgba(16, 185, 129, 0.1)', 
          color: 'var(--accent-primary)',
          padding: '0.35rem 0.85rem',
          borderRadius: '2rem',
          fontSize: '0.7rem',
          fontWeight: 800,
          border: '1px solid var(--accent-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          zIndex: 10,
          boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)'
        }}>
          <CheckCircle2 size={14} />
          READY TO ROTATE
        </div>
      ) : (
        <div style={{ 
          position: 'absolute', 
          top: '1rem', 
          right: '1rem', 
          background: 'rgba(59, 130, 246, 0.1)', 
          color: '#3b82f6',
          padding: '0.35rem 0.85rem',
          borderRadius: '2rem',
          fontSize: '0.7rem',
          fontWeight: 800,
          border: '1px solid #3b82f6',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          zIndex: 10
        }}>
          <Clock size={14} />
          {paidCount}/{totalCount} PAID
        </div>
      )}
      
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--accent-primary)' }}></div>
          <h3 style={{ fontSize: '1.25rem', margin: 0, letterSpacing: '-0.02em' }}>
            Tracking <span className="text-gradient">Round {resolvedCycleNumber}</span>
          </h3>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
          {isFullyPaid ? "All members have contributed. You can now advance the cycle." : `${totalCount - paidCount} members pending for this round.`}
        </p>
      </div>

      {/* Progress Visualization */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ 
            height: '12px', 
            background: 'rgba(15, 23, 42, 0.4)', 
            borderRadius: '6px', 
            overflow: 'hidden',
            border: '1px solid var(--glass-border)',
            position: 'relative'
          }}>
            <div style={{ 
              height: '100%', 
              width: `${progressPercent}%`, 
              background: isFullyPaid ? 'var(--accent-primary)' : 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
              boxShadow: isFullyPaid ? '0 0 20px var(--accent-primary)' : 'none',
              transition: 'width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
              borderRadius: '6px'
            }} />
          </div>
        </div>
        <div style={{ fontSize: '1.25rem', fontWeight: 900, color: isFullyPaid ? 'var(--accent-primary)' : 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
          {progressPercent}%
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {members.map((member) => {
          const hasPaid = paidUserIds.has(member.user_id);
          return (
            <div key={member.id} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: '0.75rem',
              background: hasPaid ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255, 255, 255, 0.02)',
              borderRadius: '0.75rem',
              border: '1px solid',
              borderColor: hasPaid ? 'rgba(16, 185, 129, 0.2)' : 'var(--glass-border)',
              transition: 'all 0.2s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ 
                  width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-tertiary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem',
                  border: hasPaid ? '1px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                  overflow: 'hidden'
                }}>
                  {member.profiles?.avatar_url ? (
                    <img src={member.profiles.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontWeight: 600 }}>{member.profiles?.full_name?.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{member.profiles?.full_name}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{member.profiles?.email}</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {hasPaid ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-primary)', fontSize: '0.75rem', fontWeight: 700 }}>
                    <CheckCircle2 size={14} />
                    <span>PAID</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 500 }}>
                      <Clock size={14} />
                      <span>PENDING</span>
                    </div>
                    {/* Placeholder for Remind functionality */}
                    <button style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: 'var(--accent-secondary)', 
                      padding: '0.25rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      opacity: 0.7
                    }} title="Send Reminder">
                      <Mail size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ 
        marginTop: '1.5rem', 
        paddingTop: '1.25rem', 
        borderTop: '1px solid var(--glass-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>ROUND TOTAL</div>
        <div style={{ fontWeight: 700, fontSize: '1.125rem' }}>
          {formatCurrency(totalCollected)} <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.875rem' }}>/ {formatCurrency(totalExpected)}</span>
        </div>
      </div>
    </Card>
    );
  } catch (err) {
    console.error('[CONTRIBUTION PROGRESS] Error loading data:', err);
    return (
      <Card className="glass" style={{ padding: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#ef4444' }}>
          <AlertCircle size={20} />
          <span style={{ fontWeight: 600 }}>Unable to load progress data</span>
        </div>
      </Card>
    );
  }
}
