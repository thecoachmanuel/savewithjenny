import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { join } from 'path'

// Load .env.local
dotenv.config({ path: join(process.cwd(), '.env.local') })

async function checkConnectivity() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log('--- Connectivity Check ---')
  console.log('URL:', url)
  console.log('Key length:', key?.length || 0)

  if (!url || !key) {
    console.error('CRITICAL: Missing Supabase environment variables!')
    return
  }

  const supabase = createClient(url, key)

  try {
    console.log('Attempting basic query...')
    const { data, error } = await supabase.from('profiles').select('id').limit(1)

    if (error) {
      console.error('Supabase Query Error:', error.message)
      console.error('Details:', error)
    } else {
      console.log('SUCCESS: Connected and queried profiles successfully.')
      console.log('Data returned:', data)
    }

    console.log('\nChecking Auth API...')
    // Note: This will fail with 'fetch failed' if the network/DNS is the issue
    const response = await fetch(`${url}/auth/v1/health`, {
      headers: {
        'apikey': key
      }
    })
    
    if (response.ok) {
      console.log('SUCCESS: Auth Health check OK')
    } else {
      console.error('Auth Health check failed:', response.status, response.statusText)
    }

  } catch (err: any) {
    console.error('SYSTEM ERROR:', err.message)
    if (err.message.includes('fetch failed')) {
      console.error('EXPLANATION: The native "fetch" failed. This is usually a local network, DNS, or server-down issue.')
    }
  }
}

checkConnectivity()
