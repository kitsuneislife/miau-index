# Contributing to Miau-Index

Thank you for your interest in contributing to Miau-Index! This document provides guidelines and instructions for contributing.

## 🚀 Getting Started

### Prerequisites
- Node.js >= 16.0.0
- npm or yarn
- Git

### Setup Development Environment

1. Fork and clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/miau-index.git
cd miau-index
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Run tests:
```bash
npm test
```

## 📝 Development Workflow

### Branch Naming
- Feature: `feature/description`
- Bug fix: `fix/description`
- Documentation: `docs/description`
- Refactor: `refactor/description`

### Code Style
We use ESLint and Prettier for code formatting:

```bash
# Check linting
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Check formatting
npm run format:check

# Auto-format code
npm run format
```

### Testing
- Write tests for all new features
- Maintain or improve test coverage
- Run tests before committing:

```bash
npm test
npm run test:watch  # Watch mode for development
```

### Commit Messages
Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Examples:
```
feat: add torrent quality filtering
fix: correct episode number extraction
docs: update README with new examples
```

## 🏗️ Project Structure

```
miau-index/
├── src/
│   ├── models/          # Data models
│   ├── services/        # Business logic
│   ├── providers/       # External API integrations
│   ├── repositories/    # Data persistence
│   ├── utils/          # Utility functions
│   └── index.ts        # Main entry point
├── tests/              # Test files
├── examples/           # Usage examples
└── docs/              # Documentation
```

## 🐛 Reporting Bugs

When reporting bugs, please include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (Node version, OS)
- Code samples if applicable

## 💡 Suggesting Features

Feature suggestions are welcome! Please:
- Check if the feature already exists
- Clearly describe the use case
- Explain why it would be useful
- Provide examples if possible

## 🔍 Code Review Process

1. All changes require a pull request
2. PRs must pass all tests
3. Code must follow style guidelines
4. Documentation must be updated if needed
5. At least one maintainer approval required

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Questions?

Feel free to open an issue for any questions or concerns.

Thank you for contributing to Miau-Index! 🐱
