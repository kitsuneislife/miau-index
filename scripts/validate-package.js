#!/usr/bin/env node

/**
 * Pre-publish validation script
 * Ensures the package is ready for publication
 */

const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'package.json',
  'README.md',
  'LICENSE',
  'dist/index.js',
  'dist/index.d.ts',
  '.npmignore',
];

const optionalFiles = [
  'CHANGELOG.md',
  'CONTRIBUTING.md',
];

console.log('🔍 Validating package for npm publication...\n');

let hasErrors = false;

// Check required files
console.log('✓ Checking required files:');
requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, '..', file));
  if (exists) {
    console.log(`  ✓ ${file}`);
  } else {
    console.error(`  ✗ ${file} - MISSING`);
    hasErrors = true;
  }
});

// Check optional files
console.log('\n✓ Checking optional files:');
optionalFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, '..', file));
  console.log(`  ${exists ? '✓' : '○'} ${file}${exists ? '' : ' - recommended'}`);
});

// Validate package.json
console.log('\n✓ Validating package.json:');
const packageJson = require('../package.json');

const requiredFields = ['name', 'version', 'description', 'main', 'types', 'license', 'keywords'];
requiredFields.forEach(field => {
  if (packageJson[field]) {
    console.log(`  ✓ ${field}: ${Array.isArray(packageJson[field]) ? packageJson[field].length + ' items' : packageJson[field]}`);
  } else {
    console.error(`  ✗ ${field} - MISSING`);
    hasErrors = true;
  }
});

// Check if dist is built
console.log('\n✓ Checking build output:');
const distFiles = fs.readdirSync(path.join(__dirname, '..', 'dist'));
console.log(`  ✓ dist/ contains ${distFiles.length} items`);

if (hasErrors) {
  console.error('\n❌ Validation failed! Please fix the errors above before publishing.\n');
  process.exit(1);
} else {
  console.log('\n✅ Package is ready for publication!\n');
  console.log('To publish:');
  console.log('  npm publish --access public');
  console.log('\nTo publish a beta version:');
  console.log('  npm publish --tag beta --access public\n');
}
