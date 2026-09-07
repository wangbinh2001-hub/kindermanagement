const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

async function testSignIn() {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'admin@kindermanagement.edu.vn',
      password: 'Admin@Kinder2026!',
    }),
  });

  const json = await res.json();
  console.log('Status:', res.status);
  console.log('Response:', JSON.stringify(json, null, 2));
}

testSignIn();
