import { createAdminClient } from '@/lib/supabase/admin';
import { verifyTransaction } from '@/lib/paystack';

export interface PaymentMetadata {
  userId: string;
  groupId: string;
  type: 'contribution' | 'loan_repayment';
  cycleId?: string;
}

export async function processPayment(reference: string) {
  const supabase = createAdminClient();

  // 1. Check if we already processed this reference
  const { data: existing } = await supabase
    .from('payment_records')
    .select('id')
    .eq('paystack_reference', reference)
    .maybeSingle();

  if (existing) {
    return { success: true, message: 'Already processed' };
  }

  // 2. Verify with Paystack
  const verification = await verifyTransaction(reference);
  if (!verification.status || verification.data.status !== 'success') {
    return { success: false, error: 'Payment verification failed' };
  }

  const { amount } = verification.data;
  let metadata = verification.data.metadata;

  // Paystack metadata can sometimes be a string
  if (typeof metadata === 'string') {
    try {
      metadata = JSON.parse(metadata);
    } catch (e) {
      console.error('[PAYMENT SERVICE] Failed to parse metadata string:', e);
    }
  }

  const { userId, groupId, type } = metadata as PaymentMetadata;
  let cycleId = (metadata as PaymentMetadata).cycleId;
  const actualAmount = amount / 100; // Convert from kobo

  if (!userId || !groupId) {
    console.error('[PAYMENT SERVICE ERROR] Missing required metadata:', { userId, groupId, type });
    return { success: false, error: 'Invalid payment metadata' };
  }

  // 3. Resolve Cycle ID for Contributions (Smart Allocation)
  if (type === 'contribution' && !cycleId) {
    try {
      // Find the oldest unpaid cycle for this member
      const { data: cycles } = await supabase
        .from('group_cycles')
        .select('id, cycle_number')
        .eq('group_id', groupId)
        .order('cycle_number', { ascending: true });

      const { data: existingContributions } = await supabase
        .from('contributions')
        .select('cycle_id')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .eq('status', 'paid');

      const paidCycleIds = new Set(existingContributions?.map(c => c.cycle_id) || []);
      
      // Find first cycle not in paidCycleIds
      // Find first cycle that hasn't been paid for by this user
      const unresolvedCycle = cycles?.find(c => !paidCycleIds.has(c.id));
      
      if (unresolvedCycle) {
        cycleId = unresolvedCycle.id;
        console.log(`[PAYMENT SERVICE] Auto-allocated payment to Oldest Unpaid Cycle #${unresolvedCycle.cycle_number} (${cycleId})`);
      } else {
        // Fallback: Use Currently Active Cycle
        // We fetch the group safely to handle the 'current_cycle_number' column possibly being missing
        const { data: group, error: groupErr } = await supabase
          .from('groups')
          .select('*') // Select all to avoid schema cache issues with specific columns if they just changed
          .eq('id', groupId)
          .single();

        if (groupErr) {
          console.error('[PAYMENT SERVICE] Failed to fetch group for fallback:', groupErr);
        }

        // Use current_cycle_number if it exists, otherwise default to 1 (first round)
        const activeCycleNumber = (group as any)?.current_cycle_number || 1;
        const activeCycle = cycles?.find(c => c.cycle_number === activeCycleNumber);
        
        // If active is already paid, try to find the next one
        const nextCycle = cycles?.find(c => c.cycle_number === activeCycleNumber + 1);
        
        cycleId = nextCycle?.id || activeCycle?.id || (cycles && cycles.length > 0 ? cycles[0].id : undefined);
        console.log(`[PAYMENT SERVICE] Fallback allocation to Cycle ID: ${cycleId} (Active Round: ${activeCycleNumber})`);
      }
    } catch (err) {
      console.error('[PAYMENT SERVICE] Failed to auto-resolve cycleId:', err);
    }
  }

  // 4. Begin Database Updates (Atomic-like)
  try {
    // A. Record the payment event
    await supabase.from('payment_records').insert({
      paystack_reference: reference,
      user_id: userId,
      group_id: groupId, // Link to group for admin tracking
      amount: actualAmount,
      status: 'success',
      metadata: verification.data,
      paid_at: new Date().toISOString()
    });

    if (type === 'contribution') {
      // B. Update/Create contribution record
      // We check for error explicitly because supabase-js doesn't throw on DB errors
      const { error: insertError } = await supabase
        .from('contributions')
        .insert({
          group_id: groupId,
          user_id: userId,
          cycle_id: cycleId, // Use resolved cycleId
          amount: actualAmount,
          status: 'paid',
          paid_at: new Date().toISOString()
        });

      if (insertError) {
        if (insertError.message?.includes('cycle_id') || insertError.code === '42703') {
          console.warn('[PAYMENT SERVICE] Fallback: Inserting contribution without cycle_id');
          const { error: fallbackError } = await supabase
            .from('contributions')
            .insert({
              group_id: groupId,
              user_id: userId,
              amount: actualAmount,
              status: 'paid',
              paid_at: new Date().toISOString()
            });
          
          if (fallbackError) {
            console.error('[PAYMENT SERVICE FATAL] Fallback failed:', fallbackError);
            return { success: false, error: fallbackError.message };
          }
        } else {
          console.error('[PAYMENT SERVICE ERROR] Failed to insert contribution:', insertError);
          return { success: false, error: insertError.message };
        }
      }

      // C. Increment Group Total Pool
      const { data: group } = await supabase
        .from('groups')
        .select('total_pool')
        .eq('id', groupId)
        .single();

      await supabase
        .from('groups')
        .update({ total_pool: (group?.total_pool || 0) + actualAmount })
        .eq('id', groupId);

      // D. Increment User's Total Contributions in Profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_contributions')
        .eq('id', userId)
        .single();

      await supabase
        .from('profiles')
        .update({ total_contributions: (profile?.total_contributions || 0) + actualAmount })
        .eq('id', userId);
        
      // E. Increment Member's total contribution in group_members
      const { data: member } = await supabase
        .from('group_members')
        .select('total_contributed')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .single();
        
      await supabase
        .from('group_members')
        .update({ total_contributed: (member?.total_contributed || 0) + actualAmount })
        .eq('group_id', groupId)
        .eq('user_id', userId);
    }

    // F. Log Transaction in Wallet
    await supabase.from('wallet_transactions').insert({
      user_id: userId,
      group_id: groupId, // Explicitly link to group
      amount: actualAmount,
      type: 'credit',
      category: type,
      description: `Payment for ${type.replace('_', ' ')} in group`,
      created_at: new Date().toISOString()
    });

    return { success: true };
  } catch (err: any) {
    console.error('[PAYMENT SERVICE ERROR]', err);
    return { success: false, error: err.message };
  }
}
