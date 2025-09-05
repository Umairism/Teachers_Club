# Contributing to Teacher's Club

Thank you for your interest in contributing to Teacher's Club! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Issues

1. **Search existing issues** first to avoid duplicates
2. **Use issue templates** when available
3. **Provide detailed information**:
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots/videos if applicable
   - Environment details (OS, browser, version)

### Suggesting Features

1. **Check the roadmap** in README.md
2. **Open a discussion** before major features
3. **Describe the use case** and benefits
4. **Consider implementation complexity**

### Code Contributions

1. **Fork the repository**
2. **Create a feature branch**: `feature/your-feature-name`
3. **Follow coding standards** (see below)
4. **Write tests** when applicable
5. **Update documentation** if needed
6. **Submit a pull request**

## 🔧 Development Setup

```bash
# Clone your fork
git clone https://github.com/yourusername/teachers-club.git
cd teachers-club

# Install dependencies
npm install

# Start development server
npm run dev
```

## 📝 Coding Standards

### TypeScript
- Use TypeScript for all new files
- Define proper interfaces and types
- Avoid `any` type when possible

### React
- Use functional components with hooks
- Follow React best practices
- Use proper prop types

### Styling
- Use TailwindCSS utilities
- Follow the design system
- Ensure responsive design

### Git Commits
Follow [Conventional Commits](https://conventionalcommits.org/):

```
feat: add new authentication feature
fix: resolve dashboard loading issue
docs: update API documentation
style: format code with prettier
refactor: simplify user management logic
test: add unit tests for auth service
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run linting
npm run lint

# Type checking
npm run type-check
```

## 📚 Documentation

- Update README.md for significant changes
- Add JSDoc comments for complex functions
- Update type definitions when needed

## 🎯 Pull Request Process

1. **Update your branch** with latest main
2. **Ensure tests pass** and code is linted
3. **Write clear PR description**:
   - What changes were made
   - Why they were made
   - How to test them
4. **Request review** from maintainers
5. **Address feedback** promptly

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.
