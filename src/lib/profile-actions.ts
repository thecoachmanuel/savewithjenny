'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const updates: any = {
    updated_at: new Date().toISOString(),
  }

  if (formData.has('fullName')) updates.full_name = formData.get('fullName')
  if (formData.has('phone')) updates.phone = formData.get('phone')
  if (formData.has('bankName')) updates.bank_name = formData.get('bankName')
  if (formData.has('bankAccountNumber')) updates.bank_account_number = formData.get('bankAccountNumber')
  if (formData.has('bankAccountName')) updates.bank_account_name = formData.get('bankAccountName')

  // Validation for Account Number
  if (updates.bank_account_number && !/^\d{10}$/.test(updates.bank_account_number)) {
    return { error: 'Account number must be exactly 10 digits.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)

  if (error) {
    console.error('Error updating profile:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/profile')
  return { success: true }
}

export async function updateKYCURL(path: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('profiles')
    .update({
      kyc_document_url: path,
      kyc_verified: false, // Core requirement: reset to pending on new upload
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    console.error('Error updating KYC URL:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/profile')
  revalidatePath('/admin/kyc')
  return { success: true }
}
