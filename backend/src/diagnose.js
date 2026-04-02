/**
 * Run this to diagnose Railway startup issues:
 * node src/diagnose.js
 */

console.log('\n🔍 VitaPlate Startup Diagnostics\n');

// Check required env vars
const required = [
  'DATABASE_URL',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ANTHROPIC_API_KEY',
];

const optional = [
  'REDIS_URL',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'RESEND_API_KEY',
  'FRONTEND_URL',
  'PORT',
];

let missing = 0;
console.log('Required environment variables:');
for (const key of required) {
  const val = process.env[key];
  if (val) {
    console.log(`  ✅ ${key} = ${val.substring(0, 20)}...`);
  } else {
    console.log(`  ❌ ${key} = MISSING`);
    missing++;
  }
}

console.log('\nOptional environment variables:');
for (const key of optional) {
  const val = process.env[key];
  console.log(`  ${val ? '✅' : '⚠️ '} ${key} = ${val ? val.substring(0, 20) + '...' : 'not set'}`);
}

if (missing > 0) {
  console.log(`\n❌ ${missing} required variables missing — server will fail to start`);
  console.log('   Add them in Railway → your service → Variables tab\n');
} else {
  console.log('\n✅ All required variables present\n');
}

// Test DB connection
console.log('Testing database connection...');
import('./lib/prisma.js').then(async ({ prisma }) => {
  try {
    await prisma.$connect();
    await prisma.$executeRaw`SELECT 1`;
    console.log('✅ Database connected successfully\n');
    await prisma.$disconnect();
  } catch (err) {
    console.log(`❌ Database connection failed: ${err.message}\n`);
    console.log('   Check your DATABASE_URL and that the Postgres service is running\n');
  }
}).catch(err => {
  console.log(`❌ Prisma import failed: ${err.message}\n`);
});
