import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // ── Departments ──────────────────────────────────────────────────────────────

  const departments = await Promise.all([
    prisma.department.upsert({
      where: { name: 'Engineering' },
      update: {},
      create: { name: 'Engineering' },
    }),
    prisma.department.upsert({
      where: { name: 'Human Resources' },
      update: {},
      create: { name: 'Human Resources' },
    }),
    prisma.department.upsert({
      where: { name: 'Finance' },
      update: {},
      create: { name: 'Finance' },
    }),
    prisma.department.upsert({
      where: { name: 'Marketing' },
      update: {},
      create: { name: 'Marketing' },
    }),
    prisma.department.upsert({
      where: { name: 'Product' },
      update: {},
      create: { name: 'Product' },
    }),
  ]);

  const [engineering, hr, finance, marketing, product] = departments;
  console.log(`✅ Upserted ${departments.length} departments`);

  // ── Admin user ────────────────────────────────────────────────────────────────

  const adminPassword = await bcrypt.hash('Admin@1234', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@hrportal.com' },
    update: {},
    create: {
      name: 'HR Admin',
      email: 'admin@hrportal.com',
      password: adminPassword,
      role: 'admin',
    },
  });
  console.log(`✅ Admin user: admin@hrportal.com / Admin@1234`);

  // ── Employee users ────────────────────────────────────────────────────────────

  const employeePassword = await bcrypt.hash('Password@1234', 12);

  const employeeUsers = await Promise.all([
    prisma.user.upsert({
      where: { email: 'avery.morgan@company.com' },
      update: {},
      create: { name: 'Avery Morgan', email: 'avery.morgan@company.com', password: employeePassword, role: 'employee' },
    }),
    prisma.user.upsert({
      where: { email: 'jordan.blake@company.com' },
      update: {},
      create: { name: 'Jordan Blake', email: 'jordan.blake@company.com', password: employeePassword, role: 'employee' },
    }),
    prisma.user.upsert({
      where: { email: 'sam.rivera@company.com' },
      update: {},
      create: { name: 'Sam Rivera', email: 'sam.rivera@company.com', password: employeePassword, role: 'employee' },
    }),
    prisma.user.upsert({
      where: { email: 'taylor.kim@company.com' },
      update: {},
      create: { name: 'Taylor Kim', email: 'taylor.kim@company.com', password: employeePassword, role: 'employee' },
    }),
    prisma.user.upsert({
      where: { email: 'riley.chen@company.com' },
      update: {},
      create: { name: 'Riley Chen', email: 'riley.chen@company.com', password: employeePassword, role: 'employee' },
    }),
    prisma.user.upsert({
      where: { email: 'casey.patel@company.com' },
      update: {},
      create: { name: 'Casey Patel', email: 'casey.patel@company.com', password: employeePassword, role: 'employee' },
    }),
  ]);
  console.log(`✅ Created ${employeeUsers.length} employee users`);

  // ── Employee profiles ─────────────────────────────────────────────────────────

  const employeeProfiles = await Promise.all([
    prisma.employee.upsert({
      where: { email: 'avery.morgan@company.com' },
      update: {},
      create: {
        name: 'Avery Morgan',
        email: 'avery.morgan@company.com',
        title: 'Senior Software Engineer',
        salary: new Prisma.Decimal(95000),
        status: 'active',
        start_date: new Date('2022-03-15'),
        department_id: engineering.id,
        user_id: employeeUsers[0].id,
      },
    }),
    prisma.employee.upsert({
      where: { email: 'jordan.blake@company.com' },
      update: {},
      create: {
        name: 'Jordan Blake',
        email: 'jordan.blake@company.com',
        title: 'HR Manager',
        salary: new Prisma.Decimal(78000),
        status: 'active',
        start_date: new Date('2021-07-01'),
        department_id: hr.id,
        user_id: employeeUsers[1].id,
      },
    }),
    prisma.employee.upsert({
      where: { email: 'sam.rivera@company.com' },
      update: {},
      create: {
        name: 'Sam Rivera',
        email: 'sam.rivera@company.com',
        title: 'Financial Analyst',
        salary: new Prisma.Decimal(72000),
        status: 'active',
        start_date: new Date('2023-01-10'),
        department_id: finance.id,
        user_id: employeeUsers[2].id,
      },
    }),
    prisma.employee.upsert({
      where: { email: 'taylor.kim@company.com' },
      update: {},
      create: {
        name: 'Taylor Kim',
        email: 'taylor.kim@company.com',
        title: 'Marketing Specialist',
        salary: new Prisma.Decimal(68000),
        status: 'active',
        start_date: new Date('2022-11-01'),
        department_id: marketing.id,
        user_id: employeeUsers[3].id,
      },
    }),
    prisma.employee.upsert({
      where: { email: 'riley.chen@company.com' },
      update: {},
      create: {
        name: 'Riley Chen',
        email: 'riley.chen@company.com',
        title: 'Product Manager',
        salary: new Prisma.Decimal(105000),
        status: 'active',
        start_date: new Date('2020-05-20'),
        department_id: product.id,
        user_id: employeeUsers[4].id,
      },
    }),
    prisma.employee.upsert({
      where: { email: 'casey.patel@company.com' },
      update: {},
      create: {
        name: 'Casey Patel',
        email: 'casey.patel@company.com',
        title: 'Junior Developer',
        salary: new Prisma.Decimal(58000),
        status: 'active',
        start_date: new Date('2024-02-01'),
        department_id: engineering.id,
        user_id: employeeUsers[5].id,
      },
    }),
  ]);
  console.log(`✅ Created ${employeeProfiles.length} employee profiles`);

  // ── Leave requests ────────────────────────────────────────────────────────────

  await prisma.leaveRequest.createMany({
    skipDuplicates: true,
    data: [
      {
        employee_id: employeeProfiles[0].id,
        leave_type: 'annual_leave',
        start_date: new Date('2025-08-01'),
        end_date: new Date('2025-08-07'),
        reason: 'Family vacation',
        status: 'pending',
      },
      {
        employee_id: employeeProfiles[1].id,
        leave_type: 'sick_leave',
        start_date: new Date('2025-07-15'),
        end_date: new Date('2025-07-16'),
        reason: 'Medical appointment',
        status: 'approved',
        approved_by_user_id: adminUser.id,
        admin_comment: 'Approved. Get well soon.',
      },
      {
        employee_id: employeeProfiles[2].id,
        leave_type: 'emergency_leave',
        start_date: new Date('2025-07-20'),
        end_date: new Date('2025-07-22'),
        reason: 'Family emergency',
        status: 'pending',
      },
    ],
  });
  console.log('✅ Created sample leave requests');

  // ── Attendance records (today + last 7 days) ──────────────────────────────────

  const now = new Date();
  for (let i = 0; i < 5; i++) {
    const workDate = new Date(now);
    workDate.setDate(now.getDate() - i);
    workDate.setUTCHours(0, 0, 0, 0);

    // Skip weekends
    const dayOfWeek = workDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    for (const employee of employeeProfiles.slice(0, 4)) {
      const checkIn = new Date(workDate);
      checkIn.setHours(8 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 30), 0, 0);

      const checkOut = new Date(workDate);
      checkOut.setHours(17 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 30), 0, 0);

      await prisma.attendance.upsert({
        where: {
          employee_id_work_date: {
            employee_id: employee.id,
            work_date: workDate,
          },
        },
        update: {},
        create: {
          employee_id: employee.id,
          work_date: workDate,
          check_in_at: checkIn,
          check_out_at: i === 0 ? undefined : checkOut,
          status: checkIn.getHours() > 9 ? 'late' : 'present',
        },
      });
    }
  }
  console.log('✅ Created attendance records');

  // ── Notifications ─────────────────────────────────────────────────────────────

  await prisma.notification.createMany({
    skipDuplicates: true,
    data: [
      {
        type: 'announcement',
        title: 'Welcome to HR Portal!',
        message: 'We are excited to launch our new HR management system. Please explore all features.',
        is_published: true,
        published_at: new Date(),
        created_by_user_id: adminUser.id,
      },
      {
        type: 'holiday',
        title: 'Public Holiday Notice',
        message: 'The office will be closed on July 4th for Independence Day.',
        is_published: true,
        published_at: new Date(),
        created_by_user_id: adminUser.id,
      },
      {
        type: 'policy_update',
        title: 'Updated Leave Policy',
        message: 'Our leave policy has been updated. Annual leave is now 20 days per year.',
        is_published: true,
        published_at: new Date(),
        created_by_user_id: adminUser.id,
      },
    ],
  });
  console.log('✅ Created notifications');

  // ── Jobs ──────────────────────────────────────────────────────────────────────

  const jobs = await Promise.all([
    prisma.job.upsert({
      where: { id: 'seed-job-001-0000-0000-000000000001' },
      update: {},
      create: {
        id: 'seed-job-001-0000-0000-000000000001',
        title: 'Full Stack Developer',
        description: 'We are looking for a Full Stack Developer proficient in React and Node.js to join our engineering team.',
        location: 'Remote',
        department_id: engineering.id,
        status: 'open',
        opened_at: new Date(),
      },
    }),
    prisma.job.upsert({
      where: { id: 'seed-job-002-0000-0000-000000000002' },
      update: {},
      create: {
        id: 'seed-job-002-0000-0000-000000000002',
        title: 'Product Designer',
        description: 'Looking for a creative Product Designer to craft exceptional user experiences.',
        location: 'New York, NY',
        department_id: product.id,
        status: 'open',
        opened_at: new Date(),
      },
    }),
  ]);
  console.log('✅ Created job postings');

  // ── Candidates ────────────────────────────────────────────────────────────────

  await prisma.candidate.createMany({
    skipDuplicates: true,
    data: [
      {
        job_id: jobs[0].id,
        name: 'Alex Turner',
        email: 'alex.turner@email.com',
        phone: '+1-555-0101',
        status: 'screening',
        notes: 'Strong React skills. Schedule technical interview.',
      },
      {
        job_id: jobs[0].id,
        name: 'Morgan Lee',
        email: 'morgan.lee@email.com',
        phone: '+1-555-0102',
        status: 'applied',
      },
      {
        job_id: jobs[1].id,
        name: 'Jamie Wilson',
        email: 'jamie.wilson@email.com',
        phone: '+1-555-0103',
        status: 'interview_scheduled',
        interview_at: new Date('2025-08-10T14:00:00Z'),
        notes: 'Great portfolio. Final round interview.',
      },
    ],
  });
  console.log('✅ Created candidates\n');

  console.log('─────────────────────────────────────────');
  console.log('🎉 Seeding complete!\n');
  console.log('Login credentials:');
  console.log('  Admin   : admin@hrportal.com     / Admin@1234');
  console.log('  Employee: avery.morgan@company.com / Password@1234');
  console.log('─────────────────────────────────────────\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
