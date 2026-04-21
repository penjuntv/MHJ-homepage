import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vpayqdatpqajsmalpfmq.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data, error } = await supabase.auth.admin.listUsers()
  if (error) {
    console.error(error)
  } else {
    for (const u of data.users) {
        console.log(u.email);
    }
  }
}
test()
