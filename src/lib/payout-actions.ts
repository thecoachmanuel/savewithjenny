'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath, unstable_noStore as noStore } from 'next/cache'

export async function generateRotationSchedule(groupId: string) {
  const supabase = await createClient()

  // 1. Get group details
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .single()

  if (groupError || !group) return { error: 'Group not found' }

  // 2. Get members
  const { data: members, error: membersError } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', groupId)
    .order('position', { ascending: true })

  if (membersError || !members || members.length === 0) {
    return { error: 'No members in group' }
  }

  // 3. Get existing cycles to avoid overwriting completed ones
  const { data: existingCycles } = await supabase
    .from('group_cycles')
    .select('*')
    .eq('group_id', groupId)
    .order('cycle_number', { ascending: true })

  const cycleMap = new Map(existingCycles?.map(c => [c.cycle_number, c]))

  // 4. Create/Update Group Cycles and Payout Schedule
  const startDate = new Date(group.start_date)
  const frequency = group.frequency

  for (let i = 0; i < members.length; i++) {
    const member = members[i]
    const cycleNumber = i + 1
    const existing = cycleMap.get(cycleNumber)

    // Skip completed cycles
    if (existing?.status === 'completed') continue

    // Calculate dates based on frequency
    const cycleStartDate = new Date(startDate)
    if (frequency === 'weekly') cycleStartDate.setDate(startDate.getDate() + (i * 7))
    if (frequency === 'bi-weekly') cycleStartDate.setDate(startDate.getDate() + (i * 14))
    if (frequency === 'monthly') cycleStartDate.setMonth(startDate.getMonth() + i)

    const cycleEndDate = new Date(cycleStartDate)
    if (frequency === 'weekly') cycleEndDate.setDate(cycleStartDate.getDate() + 6)
    if (frequency === 'bi-weekly') cycleEndDate.setDate(cycleStartDate.getDate() + 13)
    if (frequency === 'monthly') {
      cycleEndDate.setMonth(cycleStartDate.getMonth() + 1, 0)
    }

    const payoutAmount = group.contribution_amount * members.length * (1 - (group.management_fee_percent / 100))

    if (existing) {
      // Update existing cycle
      const { data: updatedCycle } = await supabase
        .from('group_cycles')
        .update({
          start_date: cycleStartDate.toISOString().split('T')[0],
          end_date: cycleEndDate.toISOString().split('T')[0],
          payout_recipient: member.user_id,
          payout_amount: payoutAmount
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (updatedCycle) {
        await supabase
          .from('payout_schedule')
          .update({
            recipient_id: member.user_id,
            position: member.position,
            scheduled_date: cycleEndDate.toISOString().split('T')[0],
            amount: payoutAmount
          })
          .eq('cycle_id', existing.id)
          .eq('status', 'scheduled')
      }
    } else {
      // Create New Cycle
      const { data: cycle, error: cycleError } = await supabase
        .from('group_cycles')
        .insert({
          group_id: groupId,
          cycle_number: cycleNumber,
          start_date: cycleStartDate.toISOString().split('T')[0],
          end_date: cycleEndDate.toISOString().split('T')[0],
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
      await supabase.from('payout_schedule').insert({
        group_id: groupId,
        cycle_id: cycle.id,
        recipient_id: member.user_id,
        position: member.position,
        scheduled_date: cycleEndDate.toISOString().split('T')[0],
        amount: cycle.payout_amount,
        status: 'scheduled'
      })
    }
  }

  // 5. Clean up extra cycles (if members were removed)
  if (existingCycles && existingCycles.length > members.length) {
    const extraCycleIds = existingCycles
      .filter(c => c.cycle_number > members.length && c.status !== 'completed')
      .map(c => c.id)
    
    if (extraCycleIds.length > 0) {
      await supabase.from('group_cycles').delete().in('id', extraCycleIds)
    }
  }

  // 6. Set Group to cycle #1 and mark it as active
  // This skips the 'Standby' phase and begins Round 1 immediately
  await supabase
    .from('groups')
    .update({ current_cycle_number: 1 })
    .eq('id', groupId);

  await supabase
    .from('group_cycles')
    .update({ status: 'active' })
    .eq('group_id', groupId)
    .eq('cycle_number', 1);

  revalidatePath(`/admin/groups/${group.slug}`)
  revalidatePath(`/dashboard/groups/${group.slug}`)
  return { success: true }
}

export async function syncRotationRecipients(groupId: string) {
  const supabase = await createClient()
  
  // 1. Get members ordered by position
  const { data: members } = await supabase
    .from('group_members')
    .select('user_id, position')
    .eq('group_id', groupId)
    .order('position', { ascending: true });

  if (!members) return;

  // 2. Get cycles that are NOT completed
  const { data: cycles } = await supabase
    .from('group_cycles')
    .select('id, cycle_number')
    .eq('group_id', groupId)
    .neq('status', 'completed');

  if (!cycles) return;

  // 3. Update recipients for each active/scheduled cycle
  for (const cycle of cycles) {
    const member = members.find(m => m.position === cycle.cycle_number);
    if (member) {
      await supabase
        .from('group_cycles')
        .update({ payout_recipient: member.user_id })
        .eq('id', cycle.id);
      
      await supabase
        .from('payout_schedule')
        .update({ recipient_id: member.user_id })
        .eq('cycle_id', cycle.id)
        .eq('status', 'scheduled');
    }
  }
}


export async function pushNextCycle(groupId: string, allowUnpaid: boolean = false) {
  noStore();
  const supabase = await createClient()
  const { data: { user: adminUser } } = await supabase.auth.getUser()

  if (!adminUser) return { error: 'Not authenticated' }

  // 1. Verify Admin Role
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', adminUser.id).single();
  const role = profile?.role?.toLowerCase().trim();
  if (role !== 'owner' && role !== 'admin') {
    return { error: 'Unauthorized. Only admins can advance cycles.' };
  }

  // 2. Get current group state
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .single()

  if (groupError || !group) return { error: 'Group not found' }

  const nextCycleNumber = (group.current_cycle_number || 0) + 1

  // 3. Mark CURRENT cycle as completed
  if (group.current_cycle_number > 0) {
    const { data: currentCycle } = await supabase
      .from('group_cycles')
      .select('id')
      .eq('group_id', groupId)
      .eq('cycle_number', group.current_cycle_number)
      .single();

    if (currentCycle) {
      // VERIFY PAYMENTS: Check if all members paid for this cycle
      let paidCount = 0;
      
      // Attempt 1: Standard cycle-linked lookup
      const { count, error: countError } = await supabase
        .from('contributions')
        .select('*', { count: 'exact', head: true })
        .eq('cycle_id', currentCycle.id)
        .eq('status', 'paid');
      
      paidCount = count || 0;

      // Attempt 2: Fallback heuristic (if primary count is incomplete)
      // We do this if primary check failed OR if it found fewer payments than members
      const { count: memberCount } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId);

      if (paidCount < (memberCount || 0)) {
        console.log(`[PUSH NEXT CYCLE] Primary check incomplete (${paidCount}/${memberCount}). Checking fallbacks...`);
        
        // Check contributions without cycle_id and payment_records
        const { data: contribs } = await supabase
          .from('contributions')
          .select('user_id')
          .eq('group_id', groupId)
          .eq('status', 'paid');
        
        const { data: records } = await supabase
          .from('payment_records')
          .select('user_id')
          .eq('group_id', groupId)
          .eq('status', 'success');
        
        const uniquePayers = new Set([
          ...(contribs?.map(c => c.user_id) || []),
          ...(records?.map(r => r.user_id) || [])
        ]);
        
        paidCount = uniquePayers.size;
        console.log(`[PUSH NEXT CYCLE] Fallback unique payers found: ${paidCount}`);
      }

      const hasPendingPayments = (paidCount || 0) < (memberCount || 0);

      if (hasPendingPayments && !allowUnpaid) {
        return { 
          error: `Incomplete payments for Round ${group.current_cycle_number}. Only ${paidCount}/${memberCount} members have paid.`,
          code: 'PENDING_PAYMENTS',
          details: { paidCount, memberCount }
        };
      }

      await supabase
        .from('group_cycles')
        .update({ status: 'completed' })
        .eq('id', currentCycle.id);
        
      await supabase
        .from('payout_schedule')
        .update({ status: 'completed' })
        .eq('group_id', groupId)
        .eq('cycle_id', currentCycle.id)
        .eq('status', 'scheduled');
    }
  }

  // 4. Check if next cycle exists
  const { data: nextCycle, error: cycleError } = await supabase
    .from('group_cycles')
    .select('*')
    .eq('group_id', groupId)
    .eq('cycle_number', nextCycleNumber)
    .single()

  if (cycleError || !nextCycle) {
    // No more cycles -> Mark group as completed
    await supabase
      .from('groups')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', groupId);

    revalidatePath(`/admin/groups/${group.slug}`)
    revalidatePath(`/dashboard/groups/${group.slug}`)
    return { success: true, message: 'Rotation completed and group closed.' }
  }

  // 5. Advance to next cycle
  const { error: updateError } = await supabase
    .from('groups')
    .update({ 
      current_cycle_number: nextCycleNumber,
      updated_at: new Date().toISOString()
    })
    .eq('id', groupId)

  if (updateError) return { error: updateError.message }

  // 6. Mark next cycle as active
  await supabase
    .from('group_cycles')
    .update({ status: 'active' })
    .eq('id', nextCycle.id);

  revalidatePath(`/admin/groups/${group.slug}`)
  revalidatePath(`/dashboard/groups/${group.slug}`)
  return { success: true }
}


export async function jumpToCycle(groupId: string, newCycleNumber: number) {
  noStore();
  const supabase = await createClient()
  const { data: { user: adminUser } } = await supabase.auth.getUser()

  if (!adminUser) return { error: 'Not authenticated' }

  // 1. Verify Admin Role
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', adminUser.id).single();
  const role = profile?.role?.toLowerCase().trim();
  if (role !== 'owner' && role !== 'admin') {
    return { error: 'Unauthorized. Only admins can manage cycles.' };
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
      updated_at: new Date().toISOString()
    })
    .eq('id', groupId)

  if (updateError) return { error: updateError.message }

  // 4. Update Cycles Statuses
  // Past cycles -> completed
  await supabase
    .from('group_cycles')
    .update({ status: 'completed' })
    .eq('group_id', groupId)
    .lt('cycle_number', newCycleNumber);

  // New active cycle -> active
  await supabase
    .from('group_cycles')
    .update({ status: 'active' })
    .eq('group_id', groupId)
    .eq('cycle_number', newCycleNumber);

  // Future cycles -> scheduled
  await supabase
    .from('group_cycles')
    .update({ status: 'scheduled' })
    .eq('group_id', groupId)
    .gt('cycle_number', newCycleNumber);

  // 5. Synchronize Payout Schedule Statuses
  // We match payout_schedule status to cycle status
  const { data: allCycles } = await supabase
    .from('group_cycles')
    .select('id, status')
    .eq('group_id', groupId);

  if (allCycles) {
    for (const cycle of allCycles) {
      await supabase
        .from('payout_schedule')
        .update({ status: cycle.status === 'active' ? 'scheduled' : cycle.status }) // payout items are either scheduled or completed
        .eq('cycle_id', cycle.id)
        .neq('status', 'paid'); // Don't overwrite if it was already paid/processed somehow
    }
  }

  revalidatePath(`/admin/groups/${group.slug}`)
  revalidatePath(`/dashboard/groups/${group.slug}`)
  return { success: true }
}
