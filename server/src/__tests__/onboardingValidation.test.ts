import assert from 'node:assert';
import { registerSchema } from '../schemas/authSchemas.js';

console.log('--- RUNNING REGISTRATION & CLEAN ONBOARDING TESTS ---');

// Test 1: Full registration payload with optional industry and preferred currency
const validRegistration = {
  name: 'Elena Rostova',
  workspaceName: 'Solaris Cloud Labs',
  industry: 'SaaS & Technology',
  currency: 'USD',
  email: 'elena@solariscloud.io',
  password: 'SecurePassword123!',
  confirmPassword: 'SecurePassword123!',
  agreeToTerms: true,
};

const parsed1 = registerSchema.safeParse(validRegistration);
assert.strictEqual(parsed1.success, true, 'Valid registration payload should parse successfully');
if (parsed1.success) {
  assert.strictEqual(parsed1.data.currency, 'USD');
  assert.strictEqual(parsed1.data.industry, 'SaaS & Technology');
}
console.log('✓ PASS: Custom currency and industry registration payload parsed cleanly');

// Test 2: Default currency fallback to INR when omitted
const payloadWithoutCurrency = {
  name: 'Devin Vance',
  workspaceName: 'Vance Logistics',
  email: 'devin@vancelogistics.in',
  password: 'SecurePassword123!',
  confirmPassword: 'SecurePassword123!',
  agreeToTerms: true,
};
const parsed2 = registerSchema.safeParse(payloadWithoutCurrency);
assert.strictEqual(parsed2.success, true);
if (parsed2.success) {
  assert.strictEqual(parsed2.data.currency, 'INR', 'Should default currency to INR');
  assert.strictEqual(parsed2.data.industry, undefined, 'Industry should be optional');
}
console.log('✓ PASS: Default currency defaults safely to INR');

// Test 3: Password mismatch rejection
const mismatchPassword = {
  ...validRegistration,
  confirmPassword: 'DifferentPassword999!',
};
const parsed3 = registerSchema.safeParse(mismatchPassword);
assert.strictEqual(parsed3.success, false, 'Should reject mismatched passwords');
console.log('✓ PASS: Password confirmation validation enforces matching passwords');

// Test 4: Rejection without terms consent
const noTerms = {
  ...validRegistration,
  agreeToTerms: false,
};
const parsed4 = registerSchema.safeParse(noTerms);
assert.strictEqual(parsed4.success, false, 'Must reject when agreeToTerms is false');
console.log('✓ PASS: Consent to terms is mandatory');

console.log('--- ALL REGISTRATION & ONBOARDING SCHEMA TESTS PASSED ---');
