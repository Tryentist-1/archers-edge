#!/usr/bin/env node

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Test patterns for quick iteration
const testPatterns = {
  'profile': 'src/components/__tests__/ProfileManagement.test.jsx',
  'auth': 'src/contexts/__tests__/AuthContext.test.jsx',
  'firebase': 'src/services/__tests__/firebaseService.test.js',
  'all': 'src/**/*.test.{js,jsx}',
};

const testType = process.argv[2] || 'all';
const pattern = testPatterns[testType];

if (!pattern) {
  console.error('Invalid test type. Available types:', Object.keys(testPatterns).join(', '));
  process.exit(1);
}

console.log(`Running ${testType} tests...`);
console.log(`Pattern: ${pattern}`);

try {
  execSync(`npx vitest run ${pattern} --reporter=verbose`, {
    cwd: projectRoot,
    stdio: 'inherit',
  });
  console.log('\n✅ All tests passed!');
} catch (error) {
  console.error('\n❌ Some tests failed.');
  process.exit(1);
} 