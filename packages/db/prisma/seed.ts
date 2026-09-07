import { prisma } from '../src/index.js';
import { createClient } from '@supabase/supabase-js';

const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabase = createClient(
  supabaseUrl!,
  supabaseKey!
);

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Seed System Admin auth user
  console.log('Seeding System Admin auth user...');
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: 'admin@kindermanagement.edu.vn',
    password: 'Admin@Kinder2026!',
    email_confirm: true,
    user_metadata: { role: 'SYSTEM_ADMIN' }
  });

  if (authError) throw authError;
  console.log('✅ Auth user created:', authData.user.id);

  // 2. Create a demo School
  console.log('Seeding demo School...');
  const school = await prisma.school.create({
    data: {
      code: 'KMS001',
      slug: 'kinder-demo',
      name: 'Kinder Demo School',
      status: 'ACTIVE',
      phone: '024-1234-5678',
      email: 'demo@kinder.management',
      address: '123 Demo Street, Hanoi, Vietnam',
      taxCode: '0123456789',
      legalRepresentative: 'Nguyen Van Admin',
      description: 'Demo school for KinderManagement',
    }
  });
  console.log('✅ School created:', school.id);

  // 3. Create SchoolSetting for the school
  await prisma.schoolSetting.create({
    data: {
      schoolId: school.id,
      enableAttendance: true,
      enableTuition: true,
      enableHealth: true,
      enableNutrition: false,
    }
  });
  console.log('✅ SchoolSetting created');

  // 4. Seed School Admin auth user
  console.log('Seeding School Admin auth user...');
  const { data: schoolAuthData, error: schoolAuthError } = await supabase.auth.admin.createUser({
    email: 'schooladmin@kinder.demo',
    password: 'TempPass123!',
    email_confirm: true,
    user_metadata: { role: 'SCHOOL_ADMIN', schoolId: school.id }
  });

  if (schoolAuthError) throw schoolAuthError;
  console.log('✅ School Admin auth user created:', schoolAuthData.user.id);

  // 5. Create SchoolAdmin record with temporary password
  await prisma.schoolAdmin.create({
    data: {
      schoolId: school.id,
      userId: schoolAuthData.user.id,
      mustChangePass: true,
    }
  });
  console.log('✅ SchoolAdmin record created');

  // 6. Record audit logs
  await prisma.auditLog.create({
    data: {
      schoolId: school.id,
      userId: authData.user.id,
      userRole: 'SYSTEM_ADMIN',
      entityType: 'School',
      entityId: school.id,
      action: 'SCHOOL_CREATE',
      metadata: { note: 'Demo school seeded by System Admin' },
    }
  });

  await prisma.auditLog.create({
    data: {
      schoolId: school.id,
      userId: authData.user.id,
      userRole: 'SYSTEM_ADMIN',
      entityType: 'SchoolAdmin',
      entityId: schoolAuthData.user.id,
      action: 'SCHOOL_ADMIN_CREATE',
      metadata: { note: 'Initial School Admin seeded with temporary password' },
    }
  });

  console.log('✅ Audit logs recorded.');
  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
