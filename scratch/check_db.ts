import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function checkUserRole() {
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers()
  
  if (userError) {
    console.error('Auth check error:', userError)
    return
  }

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, role')
  
  if (profileError) {
    console.error('Profile check error:', profileError)
    return
  }

  console.log('Current Profiles in DB:')
  console.table(profiles)
}

checkUserRole()
