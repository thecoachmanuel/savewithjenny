import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Missing keys' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
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
        const { data: users } = await supabase.auth.admin.listUsers()
        const user = users.users.find(u => u.email === 'admin@admin.com')
        if (user) {
          await supabase.from('profiles').update({ role: 'owner' }).eq('id', user.id)
          return NextResponse.json({ message: 'Existing user promoted to owner' })
        }
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ message: 'Admin user created successfully', userId: data.user.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
