'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function verifyUserKYC(userId: string, isVerified: boolean, formData?: FormData): Promise<any> {
  const supabase = await createClient()
  const { data: { user: adminUser } } = await supabase.auth.getUser()

  if (!adminUser) return { error: 'Not authenticated' }

  // Check if current user is admin/owner
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', adminUser.id)
    .single()

  if (!adminProfile || !['admin', 'owner'].includes(adminProfile.role)) {
    return { error: 'Unauthorized. Admin access required.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      kyc_verified: isVerified,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)

  if (error) {
    console.error('Error verifying KYC:', error)
    return { error: error.message }
  }

  revalidatePath('/admin/kyc')
  revalidatePath('/dashboard/profile')
  return { success: true }
}

export async function updatePlatformSettings(key: string, value: any) {
  const supabase = await createClient()
  const { data: { user: adminUser } } = await supabase.auth.getUser()

  if (!adminUser) return { error: 'Not authenticated' }

  // Check if current user is admin/owner
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', adminUser.id)
    .single()

  if (!adminProfile || !['admin', 'owner'].includes(adminProfile.role)) {
    return { error: 'Unauthorized. Admin access required.' }
  }

  const { error } = await supabase
    .from('platform_settings')
    .upsert({
      key,
      value,
      updated_at: new Date().toISOString(),
      updated_by: adminUser.id
    })

  if (error) {
    console.error('Error updating platform settings:', error)
    return { error: error.message }
  }

  revalidatePath('/admin/settings')
  revalidatePath('/dashboard') // Dashboard might use these settings for max loan calcs
  return { success: true }
}

export async function updateBrandConfig(name: string, logoUrl?: string) {
  const supabase = await createClient()
  const { data: { user: adminUser } } = await supabase.auth.getUser()

  if (!adminUser) return { error: 'Not authenticated' }

  // Check if current user is admin/owner
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', adminUser.id)
    .single()

  if (!adminProfile || !['admin', 'owner'].includes(adminProfile.role)) {
    return { error: 'Unauthorized. Admin access required.' }
  }

  const { error } = await supabase
    .from('platform_settings')
    .upsert({
      key: 'brand_config',
      value: {
        site_name: name,
        logo_url: logoUrl
      },
      updated_at: new Date().toISOString(),
      updated_by: adminUser.id
    })

  if (error) {
    console.error('Error updating brand config:', error)
    return { error: error.message }
  }

  revalidatePath('/', 'layout') // Revalidate everything to show new branding
  return { success: true }
}

