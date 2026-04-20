'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath, unstable_noStore as noStore } from 'next/cache'
import { redirect } from 'next/navigation'
import { generateRotationSchedule } from './payout-actions'

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
}

export async function createGroup(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/login')

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const contributionAmount = parseFloat(formData.get('contributionAmount') as string)
  const frequency = formData.get('frequency') as string
  const maxMembers = parseInt(formData.get('maxMembers') as string)
  const startDate = formData.get('startDate') as string
  const managementFee = parseFloat(formData.get('managementFee') as string) || 2.0
  const lateFee = parseFloat(formData.get('lateFee') as string) || 0

  const slug = `${slugify(name)}-${Math.random().toString(36).substring(2, 7)}`

  const { error } = await supabase
    .from('groups')
    .insert({
      name,
      slug,
      description,
      contribution_amount: contributionAmount,
      frequency,
      max_members: maxMembers,
      start_date: startDate,
      management_fee_percent: managementFee,
      late_fee_amount: lateFee,
      created_by: user.id,
      status: 'active'
    })

  if (error) {
    console.error('Error creating group:', error)
    return { error: error.message }
  }

  revalidatePath('/admin/groups')
  redirect('/admin/groups')
}

export async function updateGroup(groupId: string, formData: FormData) {
  noStore();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return redirect('/login');

  // Verify Admin Role
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const role = profile?.role?.toLowerCase().trim();
  if (role !== 'owner' && role !== 'admin') {
    return { error: 'Unauthorized' };
  }

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const contributionAmount = parseFloat(formData.get('contributionAmount') as string);
  const frequency = formData.get('frequency') as string;
  const maxMembers = parseInt(formData.get('maxMembers') as string);
  const rules = formData.get('rules') as string;
  const managementFee = parseFloat(formData.get('managementFee') as string);
  const lateFee = parseFloat(formData.get('lateFee') as string);

  const { error } = await supabase
    .from('groups')
    .update({
      name,
      description,
      contribution_amount: contributionAmount,
      frequency,
      max_members: maxMembers,
      rules,
      management_fee_percent: managementFee,
      late_fee_amount: lateFee,
      updated_at: new Date().toISOString()
    })
    .eq('id', groupId);

  if (error) {
    console.error('Error updating group:', error);
    return { error: error.message };
  }

  revalidatePath(`/admin/groups`);
  revalidatePath(`/dashboard/groups`);
  return { success: true };
}

export async function addMemberManually(groupId: string, email: string) {
  noStore();
  const supabase = await createClient();
  const { data: { user: adminUser } } = await supabase.auth.getUser();

  if (!adminUser) return { error: 'Not authenticated' };

  // Verify Admin Role
  const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', adminUser.id).single();
  const role = adminProfile?.role?.toLowerCase().trim();
  if (role !== 'owner' && role !== 'admin') {
    return { error: 'Unauthorized' };
  }

  // 1. Find the user being added
  const { data: targetUser, error: userError } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('email', email.trim())
    .single();

  if (userError || !targetUser) {
    return { error: 'User not found in system. Please ask them to sign up first.' };
  }

  // 2. Check group capacity
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('id, current_members, max_members')
    .eq('id', groupId)
    .single();

  if (groupError || !group) return { error: 'Group not found' };
  if (group.current_members >= group.max_members) return { error: 'Group is full' };

  // 3. Check if already a member
  const { data: existing } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', targetUser.id)
    .maybeSingle();

  if (existing) return { error: 'User is already a member of this group' };

  // 4. Insert membership
  const nextPosition = (group.current_members || 0) + 1;
  const { error: insertError } = await supabase
    .from('group_members')
    .insert({
      group_id: groupId,
      user_id: targetUser.id,
      position: nextPosition,
      status: 'active'
    });

  if (insertError) return { error: insertError.message };

  revalidatePath(`/admin/groups`);
  return { success: true };
}

export async function joinGroup(groupId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/login')

  // 1. Check if group exists and has space
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('id, current_members, max_members')
    .eq('id', groupId)
    .single()

  if (groupError || !group) {
    return { error: 'Group not found' }
  }

  if (group.current_members >= group.max_members) {
    return { error: 'Group is full' }
  }

  // 2. Check if already a member
  const { data: existingMember } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingMember) {
    return { error: 'You are already a member of this group' }
  }

  // 3. Join group
  const nextPosition = (group.current_members || 0) + 1

  console.log(`[DEBUG JOIN] Group: ${groupId}, User: ${user.id}, Position: ${nextPosition}`);

  // Verification check before insert
  const { data: profileCheck } = await supabase.from('profiles').select('id').eq('id', user.id).single();
  if (!profileCheck) {
    console.error(`[DEBUG JOIN ERROR] Profile missing for user ${user.id}`);
    return { error: 'Your profile is missing. Please contact support or try logging out and back in.' };
  }

  const { error: joinError } = await supabase
    .from('group_members')
    .insert({
      group_id: groupId,
      user_id: user.id,
      position: nextPosition
    })

  if (joinError) {
    console.error('Error joining group:', joinError)
    return { error: joinError.message }
  }

  revalidatePath(`/dashboard/groups`)
  redirect(`/dashboard/groups`)
}

export async function updateMemberPosition(groupId: string, userId: string, newPosition: number) {
  noStore();
  const supabase = await createClient();
  const { data: { user: adminUser } } = await supabase.auth.getUser();

  if (!adminUser) return { error: 'Not authenticated' };

  // 1. Verify Admin Role
  const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', adminUser.id).single();
  const role = adminProfile?.role?.toLowerCase().trim();
  if (role !== 'owner' && role !== 'admin') {
    return { error: 'Unauthorized. Only admins can reorder members.' };
  }

  try {
    // 2. Get current member and their old position
    const { data: currentMember } = await supabase
      .from('group_members')
      .select('position')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();

    if (!currentMember) return { error: 'Member not found' };
    const oldPosition = currentMember.position;

    // 3. Check if someone is already at the new position
    const { data: occupant } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)
      .eq('position', newPosition)
      .maybeSingle();

    if (occupant && occupant.user_id !== userId) {
      // SWAP LOGIC: Use a temporary position to avoid unique constraint violation
      // a. Move occupant to temporary position
      await supabase
        .from('group_members')
        .update({ position: -999 })
        .eq('group_id', groupId)
        .eq('user_id', occupant.user_id);

      // b. Move target user to new position
      await supabase
        .from('group_members')
        .update({ position: newPosition })
        .eq('group_id', groupId)
        .eq('user_id', userId);

      // c. Move occupant to target user's old position
      await supabase
        .from('group_members')
        .update({ position: oldPosition })
        .eq('group_id', groupId)
        .eq('user_id', occupant.user_id);
    } else {
      // Regular move if no occupant
      await supabase
        .from('group_members')
        .update({ position: newPosition })
        .eq('group_id', groupId)
        .eq('user_id', userId);
    }

    // 4. Sync rotation recipients automatically
    await generateRotationSchedule(groupId);

    // 5. Get group slug for revalidation
    const { data: group } = await supabase.from('groups').select('slug').eq('id', groupId).single();
    
    if (group) {
      revalidatePath(`/admin/groups/${group.slug}`);
      revalidatePath(`/dashboard/groups/${group.slug}`);
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error updating position:', err);
    return { error: err.message };
  }
}
