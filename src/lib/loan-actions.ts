'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function requestLoan(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const amount = parseFloat(formData.get('amount') as string)
  const purpose = formData.get('purpose') as string
  const groupId = formData.get('groupId') as string
  
  if (!amount || amount <= 0) return { error: 'Invalid amount' }
  if (!groupId) return { error: 'Please select a thrift group' }

  // 1. Fetch Profile and Settings for Server-side validation
  const [{ data: profile }, { data: settings }] = await Promise.all([
    supabase.from('profiles').select('total_contributions').eq('id', user.id).single(),
    supabase.from('platform_settings').select('value').eq('key', 'loan_config').single()
  ])

  const maxLoanPercent = settings?.value?.max_loan_percent || 50
  const totalContributions = Number(profile?.total_contributions) || 0
  const maxEligibleAmount = totalContributions * (maxLoanPercent / 100)

  if (amount > maxEligibleAmount) {
    return { error: `Request exceeds your maximum eligible limit of ${maxEligibleAmount.toLocaleString()}` }
  }

  // 2. Check if current user is a member of the group
  const { data: membership } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return { error: 'You must be a member of the selected group to request a loan.' }
  }

  const interestRate = 5.0 // Default 5%
  const totalRepayment = amount * (1 + (interestRate / 100))
  const dueDate = new Date()
  dueDate.setMonth(dueDate.getMonth() + 1) // Default 1 month term

  const { error } = await supabase
    .from('loans')
    .insert({
      user_id: user.id,
      group_id: groupId,
      amount,
      interest_rate: interestRate,
      total_repayment: totalRepayment,
      purpose,
      due_date: dueDate.toISOString().split('T')[0],
      status: 'pending'
    })

  if (error) {
    console.error('Error requesting loan:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/loans')
  return { success: true }
}

export async function approveLoan(loanId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Check if admin/owner
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single()
  if (profile?.role !== 'owner' && profile?.role !== 'admin') {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('loans')
    .update({
      status: 'approved',
      approved_by: user?.id,
      approved_at: new Date().toISOString()
    })
    .eq('id', loanId)

  if (error) return { error: error.message }

  revalidatePath('/admin/loans')
  return { success: true }
}
