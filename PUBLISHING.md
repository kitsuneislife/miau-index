# 📦 Publishing Guide

This guide explains how to publish new versions of `@kitsuneislife/miau-index` to npm.

## Prerequisites

1. **npm Account**: You need an npm account with access to the `@kitsuneislife` scope
2. **npm Login**: Run `npm login` to authenticate

## Pre-Publication Checklist

Before publishing, ensure:

- [ ] All tests pass: `npm test`
- [ ] Code is linted: `npm run lint`
- [ ] Code is formatted: `npm run format:check`
- [ ] Build succeeds: `npm run build`
- [ ] Version is bumped in `package.json`
- [ ] `CHANGELOG.md` is updated
- [ ] README is up to date
- [ ] All changes are committed

## Validation

Run the validation script to check if the package is ready:

```bash
npm run validate
```

This will verify:
- ✓ All required files exist
- ✓ package.json has all necessary fields
- ✓ Build output is present
- ✓ Optional files are included

## Version Bumping

Follow [Semantic Versioning](https://semver.org/):

- **Patch** (1.0.0 → 1.0.1): Bug fixes, small changes
  ```bash
  npm version patch
  ```

- **Minor** (1.0.0 → 1.1.0): New features, backwards compatible
  ```bash
  npm version minor
  ```

- **Major** (1.0.0 → 2.0.0): Breaking changes
  ```bash
  npm version major
  ```

This will automatically:
- Update version in `package.json`
- Create a git commit
- Create a git tag

## Publishing

### 1. Stable Release

```bash
npm publish --access public
```

### 2. Beta/Alpha Release

For pre-release versions:

```bash
# Update to beta version
npm version 1.1.0-beta.0

# Publish with beta tag
npm publish --tag beta --access public
```

Users can install with:
```bash
npm install @kitsuneislife/miau-index@beta
```

### 3. Dry Run (Test)

Test the publication without actually publishing:

```bash
npm publish --dry-run
```

## Post-Publication

After publishing:

1. **Push to GitHub**:
   ```bash
   git push origin main --tags
   ```

2. **Create GitHub Release**:
   - Go to GitHub Releases
   - Create a new release using the tag
   - Copy content from CHANGELOG.md
   - Publish the release

3. **Verify Publication**:
   - Check npm: https://www.npmjs.com/package/@kitsuneislife/miau-index
   - Test installation: `npm install @kitsuneislife/miau-index`

4. **Update Documentation**:
   - Update any version references in docs
   - Update badges in README if needed

## Troubleshooting

### Permission Denied

If you get a permission error:
```bash
npm login
npm whoami  # Verify you're logged in
```

### Version Already Exists

Cannot publish the same version twice. Bump the version:
```bash
npm version patch
```

### Build Errors

Ensure the build is clean:
```bash
rm -rf dist node_modules
npm install
npm run build
```

## Automated Publishing (CI/CD)

For automated publishing with GitHub Actions:

1. Set npm token as GitHub secret: `NPM_TOKEN`
2. Create `.github/workflows/publish.yml`
3. Workflow runs on tag push

Example workflow:
```yaml
name: Publish to npm

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm test
      - run: npm run build
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Quick Reference

```bash
# Full publishing workflow
npm test                    # Run tests
npm run build              # Build package
npm run validate           # Validate package
npm version patch          # Bump version
npm publish --access public # Publish
git push origin main --tags # Push to GitHub
```

---

**Note**: Always publish from the `main` branch with a clean working directory.
