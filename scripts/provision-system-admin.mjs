const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY');
  process.exit(1);
}

const headers = {
  apikey: SUPABASE_SECRET_KEY,
  Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
  'Content-Type': 'application/json',
};

async function main() {
  const email = 'admin@kindermanagement.edu.vn';
  const password = 'Admin@Kinder2026!';

  console.log(`Checking users at ${SUPABASE_URL}/auth/v1/admin/users ...`);
  const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=100`, {
    headers,
  });

  if (!listRes.ok) {
    const txt = await listRes.text();
    console.error('List users failed:', listRes.status, txt);
    process.exit(1);
  }

  const listData = await listRes.json();
  const existing = listData.users?.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  if (existing) {
    console.log(`User ${email} found with ID: ${existing.id}. Updating password & role...`);
    const updateRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${existing.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        password,
        email_confirm: true,
        user_metadata: { full_name: 'Quản trị viên Hệ thống' },
        app_metadata: {
          role: 'SYSTEM_ADMIN',
          school_id: null,
          is_temporary_password: false,
        },
      }),
    });

    if (!updateRes.ok) {
      const txt = await updateRes.text();
      console.error('Update failed:', updateRes.status, txt);
      process.exit(1);
    }
    const updated = await updateRes.json();
    console.log('SUCCESS: System Admin account updated successfully:', updated.email);
  } else {
    console.log(`Creating user ${email}...`);
    const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: 'Quản trị viên Hệ thống' },
        app_metadata: {
          role: 'SYSTEM_ADMIN',
          school_id: null,
          is_temporary_password: false,
        },
      }),
    });

    if (!createRes.ok) {
      const txt = await createRes.text();
      console.error('Create failed:', createRes.status, txt);
      process.exit(1);
    }
    const created = await createRes.json();
    console.log('SUCCESS: System Admin account created successfully:', created.email);
  }
}

main().catch(console.error);
