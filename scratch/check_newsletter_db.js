const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkNewsletter() {
  console.log('Checking subscribers...');
  const { data: subscribers, error: subError } = await supabase
    .from('subscribers')
    .select('*');
  
  if (subError) {
    console.error('Error fetching subscribers:', subError);
  } else {
    console.log(`Found ${subscribers.length} subscribers.`);
    console.log('Subscribers:', subscribers.map(s => s.email).join(', '));
  }

  console.log('\nChecking newsletter drafts/history...');
  const { data: newsletters, error: nlError } = await supabase
    .from('newsletters')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (nlError) {
    console.error('Error fetching newsletters:', nlError);
  } else {
    console.log(`Found ${newsletters.length} recent newsletters.`);
    newsletters.forEach(nl => {
      console.log(`- [${nl.created_at}] Subject: ${nl.subject}, Status: ${nl.status}`);
    });
  }
}

checkNewsletter();
