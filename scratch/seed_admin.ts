import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createAdmin() {
  console.log('Creating admin user...')
  
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'admin@admin.com',
    password: 'admin123',
    email_confirm: true,
    user_metadata: { 
      role: 'owner', 
      full_name: 'Platform Owner' 
    }
  })

  if (error) {
    if (error.message.includes('already registered')) {
      console.log('User already exists. Updating role to owner...')
      // If user exists, find them and update profile
      const { data: users } = await supabase.auth.admin.listUsers()
      const user = users.users.find(u => u.email === 'admin@admin.com')
      if (user) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ role: 'owner' })
          .eq('id', user.id)
        
        if (updateError) {
          console.error('Error updating profile:', updateError)
        } else {
          console.log('Successfully promoted existing user to owner.')
        }
      }
    } else {
      console.error('Error creating user:', error.message)
    }
  } else {
    console.log('Successfully created admin user:', data.user.id)
  }
}

createAdmin()
