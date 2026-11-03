import assert from 'node:assert';
import { registerSchema } from '../schemas/authSchemas.js';

console.log('--- RUNNING BACKEND REGISTRATION CONSENT TESTS ---');

const basePayload = {
  name: 'Test Candidate',
  workspaceName: 'Candidate Org',
  email: 'candidate@flowdesk.test',
  password: 'Password123!',
};

// 1. Valid consent true -> PASS
const validResult = registerSchema.safeParse({
  ...basePayload,
  agreeToTerms: true,
});
assert.strictEqual(validResult.success, true, 'Valid payload with agreeToTerms: true must succeed');
console.log('✓ PASS: agreeToTerms: true succeeds');

// 2. Missing consent -> FAIL
const missingResult = registerSchema.safeParse({
  ...basePayload,
});
assert.strictEqual(missingResult.success, false, 'Missing agreeToTerms must fail');
const missingMsg = missingResult.error?.issues.find(i => i.path.includes('agreeToTerms'))?.message;
assert(missingMsg?.includes('You must accept the terms'), `Expected terms error message, got: ${missingMsg}`);
console.log(`✓ PASS: Missing agreeToTerms rejected with: "${missingMsg}"`);

// 3. False consent -> FAIL
const falseResult = registerSchema.safeParse({
  ...basePayload,
  agreeToTerms: false,
});
assert.strictEqual(falseResult.success, false, 'agreeToTerms: false must fail');
const falseMsg = falseResult.error?.issues.find(i => i.path.includes('agreeToTerms'))?.message;
assert(falseMsg?.includes('You must accept the terms'), `Expected terms error message, got: ${falseMsg}`);
console.log(`✓ PASS: agreeToTerms: false rejected with: "${falseMsg}"`);

// 4. Null consent -> FAIL
const nullResult = registerSchema.safeParse({
  ...basePayload,
  agreeToTerms: null,
});
assert.strictEqual(nullResult.success, false, 'agreeToTerms: null must fail');
console.log('✓ PASS: agreeToTerms: null rejected');

// 5. String/invalid consent -> FAIL
const stringResult = registerSchema.safeParse({
  ...basePayload,
  agreeToTerms: 'yes',
});
assert.strictEqual(stringResult.success, false, 'agreeToTerms: "yes" string must fail');
console.log('✓ PASS: agreeToTerms: "yes" invalid type rejected');

console.log('--- ALL BACKEND CONSENT TESTS PASSED ---');
