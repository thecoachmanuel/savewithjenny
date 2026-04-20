'use server';
// Build Sync: 2026-04-21 00:32:00
import { createClient } from './supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Ensures that all members have a scheduled payout in the rotation.
 * This preserves the current active round number if it exists.
 */
export async function generateRotationSchedule(groupId: string) {
  const supabase = await createClient()

  // 1. Fetch group details
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('*, profiles(full_name)')
    .eq('id', groupId)
    .single()

  if (groupError || !group) return { error: 'Group not found' }

  // 2. Fetch members in their positions
  const { data: members, error: membersError } = await supabase
    .from('group_members')
    .select('user_id, position')
    .eq('group_id', groupId)
    .order('position', { ascending: true })

  if (membersError || !members || members.length < 2) {
    return { error: 'Need at least 2 members to generate a rotation.' }
  }

  // 3. Fetch existing cycles to avoid duplication
  const { data: existingCycles } = await supabase
    .from('group_cycles')
    .select('id, cycle_number')
    .eq('group_id', groupId)

  const existingMap = new Map(existingCycles?.map(c => [c.cycle_number, c.id]))

  // 4. Create/Sync Cycles
  const startDate = new Date(group.start_date)
  
  for (let i = 0; i < members.length; i++) {
    const member = members[i]
    const cycleNumber = i + 1
    
    // Calculate dates based on frequency
    const cycleStart = new Date(startDate)
    if (group.frequency === 'weekly') cycleStart.setDate(startDate.getDate() + (i * 7))
    if (group.frequency === 'bi-weekly') cycleStart.setDate(startDate.getDate() + (i * 14))
    if (group.frequency === 'monthly') cycleStart.setMonth(startDate.getMonth() + i)
    
    const cycleEnd = new Date(cycleStart)
    if (group.frequency === 'weekly') cycleEnd.setDate(cycleStart.getDate() + 6)
    if (group.frequency === 'bi-weekly') cycleEnd.setDate(cycleStart.getDate() + 13)
    if (group.frequency === 'monthly') {
      cycleEnd.setMonth(cycleStart.getMonth() + 1)
      cycleEnd.setDate(cycleEnd.getDate() - 1)
    }

    const payoutAmount = group.contribution_amount * members.length * (1 - (group.management_fee_percent / 100))

    if (existingMap.has(cycleNumber)) {
      // SANITY FLUSH: Update existing rounds with the latest calculated amount and fix status if stuck
      const existingId = existingMap.get(cycleNumber);
      await supabase
        .from('group_cycles')
        .update({ 
           payout_amount: payoutAmount,
           payout_recipient: member.user_id,
           status: cycleNumber === (group as any).current_cycle_number ? 'active' : 'scheduled'
        })
        .eq('id', existingId);
      continue;
    }

    const { data: cycle, error: cycleError } = await supabase
      .from('group_cycles')
      .insert({
        group_id: groupId,
        cycle_number: cycleNumber,
        start_date: cycleStart.toISOString(),
        end_date: cycleEnd.toISOString(),
        payout_recipient: member.user_id,
        payout_amount: payoutAmount,
        status: 'scheduled'
      })
      .select()
      .single()

    if (cycleError) {
      console.error('Error creating cycle:', cycleError)
      continue
    }

    // Create Payout Schedule entry
    await supabase
      .from('payout_schedule')
      .insert({
        group_id: groupId,
        cycle_id: cycle.id,
        recipient_id: member.user_id,
        amount: payoutAmount,
        scheduled_date: cycleEnd.toISOString(),
        status: 'scheduled'
      })
  }

  // 5. Ensure group has a current_cycle_number set if it's active
  if (!group.current_cycle_number || group.current_cycle_number === 0) {
    await supabase
      .from('groups')
      .update({ current_cycle_number: 1 })
      .eq('id', groupId)

    await supabase
      .from('group_cycles')
      .update({ status: 'active' })
      .eq('group_id', groupId)
      .eq('cycle_number', 1)
  }

  revalidatePath(`/admin/groups/${group.slug}`)
  revalidatePath(`/dashboard/groups/${group.slug}`)
  return { success: true }
}

/**
 * Advanced the group to the next rotation cycle.
 * This function is atomic: it payouts the current recipient and moves to the next.
 */
export async function pushNextCycle(groupId: string, allowUnpaid: boolean = false) {
  const supabase = await createClient()

  // 1. Fetch Group & Current State
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .single()

  if (groupError || !group) return { error: 'Group not found' }
  if (group.status === 'completed') return { error: 'Rotation already completed.' }

  // 2. Fetch Current Cycle Record
  const currentCycleNumber = group.current_cycle_number || 1
  const { data: currentCycle, error: currentCycleError } = await supabase
    .from('group_cycles')
    .select('*')
    .eq('group_id', groupId)
    .eq('cycle_number', currentCycleNumber)
    .single()

  if (currentCycleError || !currentCycle) return { error: 'Current cycle data missing.' }

  // 3. Status Check: Do all members pay?
  if (!allowUnpaid) {
    const { data: members } = await supabase.from('group_members').select('user_id').eq('group_id', groupId)
    const memberCount = members?.length
    
    // Check contributions
    let paidCount = 0;
    const { count, error: countError } = await supabase
      .from('contributions')
      .select('*', { count: 'exact', head: true })
      .eq('cycle_id', currentCycle.id)
      .eq('status', 'paid');
    
    paidCount = count || 0;

    if (countError || paidCount < (memberCount || 0)) {
      // Fallback for missing cycle_id links
      const { data: contribs } = await supabase
        .from('contributions')
        .select('user_id')
        .eq('group_id', groupId)
        .eq('status', 'paid');
      
      const uniquePayers = new Set(contribs?.map(c => c.user_id) || []);
      paidCount = uniquePayers.size;

      if (paidCount < (memberCount || 0)) {
        return { 
          error: 'Cannot advance: Some members have not paid for the current round.',
          code: 'PENDING_PAYMENTS',
          details: { paidCount, memberCount }
        }
      }
    }
  }

  // 4. Find Next Cycle
  const nextCycleNumber = currentCycleNumber + 1
  const { data: nextCycle, error: cycleError } = await supabase
    .from('group_cycles')
    .select('*')
    .eq('group_id', groupId)
    .eq('cycle_number', nextCycleNumber)
    .single()

  if (cycleError || !nextCycle) {
    return { 
      error: "The next round record is missing from the database. Please click 'Sync Rotation Data' first to repair the schedule.",
      code: 'MISSING_ROUND_DATA'
    };
  }

  // --- FINANCIAL ORCHESTRATION: Payout the current recipient ---
  if (currentCycleNumber > 0) {
    const payoutAmount = Number(currentCycle.payout_amount || 0);
    const recipientId = currentCycle.payout_recipient;

    if (recipientId) {
      // 1. Mark Cycle as Completed
      await supabase
        .from('group_cycles')
        .update({ status: 'completed' })
        .eq('id', currentCycle.id);

      // 2. Update Payout Schedule status
      await supabase
        .from('payout_schedule')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('cycle_id', currentCycle.id);

      // 3. Credit Recipient Wallet (requires wallet_balance column)
      const { data: profile } = await supabase.from('profiles').select('wallet_balance').eq('id', recipientId).single();
      const currentBalance = Number(profile?.wallet_balance || 0);
      
      await supabase
        .from('profiles')
        .update({ 
          wallet_balance: currentBalance + payoutAmount,
          total_payouts_received: (profile as any)?.total_payouts_received + payoutAmount
        })
        .eq('id', recipientId);

      // 4. Update Group Liquidity Pool
      const newGroupPool = Math.max(0, (Number(group.total_pool || 0)) - payoutAmount);
      await supabase
        .from('groups')
        .update({ total_pool: newGroupPool })
        .eq('id', groupId);
    }
  }

  // 5. Advance to next cycle
  await supabase
    .from('groups')
    .update({ 
      current_cycle_number: nextCycleNumber,
      updated_at: new Date().toISOString() 
    })
    .eq('id', groupId)

  await supabase
    .from('group_cycles')
    .update({ status: 'active' })
    .eq('id', nextCycle.id)

  revalidatePath(`/admin/groups/${group.slug}`)
  revalidatePath(`/dashboard/groups/${group.slug}`)
  return { success: true }
}

/**
 * Manually jump to a specific cycle number (Administrative Override)
 */
export async function jumpToCycle(groupId: string, newCycleNumber: number) {
  const supabase = await createClient()

  // 1. Security Check
  const { data: { user } } = await supabase.auth.getUser()
  const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', user?.id).single()
  if (adminProfile?.role !== 'owner' && adminProfile?.role !== 'admin') {
    return { error: 'Unauthorized override attempted.' }
  }

  // 2. Get group
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .single()

  if (groupError || !group) return { error: 'Group not found' }

  // 3. Update active round in group
  const { error: updateError } = await supabase
    .from('groups')
    .update({ 
      current_cycle_number: newCycleNumber,
      status: 'active', // Reactivate group if it was completed
      updated_at: new Date().toISOString()
    })
    .eq('id', groupId)

  if (updateError) return { error: updateError.message }

  // 4. Update Cycles Statuses (Reset all to correct state)
  // 1. Mark past rounds as completed
  await supabase
    .from('group_cycles')
    .update({ status: 'completed' })
    .eq('group_id', groupId)
    .lt('cycle_number', newCycleNumber);

  // 2. Mark current round as active
  await supabase
    .from('group_cycles')
    .update({ status: 'active' })
    .eq('group_id', groupId)
    .eq('cycle_number', newCycleNumber);

  // 3. Mark future rounds as scheduled
  await supabase
    .from('group_cycles')
    .update({ status: 'scheduled' })
    .eq('group_id', groupId)
    .gt('cycle_number', newCycleNumber);

  // 5. Synchronize Payout Schedule Statuses
  const { data: allCycles } = await supabase
    .from('group_cycles')
    .select('id, status')
    .eq('group_id', groupId);

  if (allCycles) {
    for (const cycle of allCycles) {
      await supabase
        .from('payout_schedule')
        .update({ 
          status: cycle.status === 'active' ? 'scheduled' : cycle.status,
          updated_at: new Date().toISOString()
        })
        .eq('cycle_id', cycle.id)
        .neq('status', 'paid');
    }
  }

  revalidatePath(`/admin/groups/${group.slug}`)
  revalidatePath(`/dashboard/groups/${group.slug}`)
  return { success: true }
}

/**
 * Explicitly completes the rotation and closes the group.
 */
export async function completeRotation(groupId: string) {
  const supabase = await createClient();

  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .single();

  if (groupError || !group) return { error: "Group not found." };

  const { error: updateError } = await supabase
    .from('groups')
    .update({ 
      status: 'completed',
      updated_at: new Date().toISOString()
    })
    .eq('id', groupId);

  if (updateError) return { error: updateError.message };

  revalidatePath(`/admin/groups/${group.slug}`);
  revalidatePath(`/dashboard/groups/${group.slug}`);
  
  return { success: true };
}
