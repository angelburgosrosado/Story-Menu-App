# Contributing to Story.Menu

Thank you for contributing to Story.Menu! This guide will help you get started.

## Development Setup

```bash
# Clone the repository
git clone https://github.com/angelburgosrosado/Story-Menu-App.git
cd Story-Menu-App

# Run setup script (installs dependencies, configures hooks)
bash scripts/setup.sh

# Or manually:
npm install
npm run dev
```

## Development Workflow

### 1. Create a Branch
```bash
git checkout -b feat/my-feature
# or
git checkout -b fix/my-bugfix
```

### 2. Make Changes
- Write code following the style guide below
- Add tests for new features
- Update documentation if needed

### 3. Run Checks
```bash
# Lint
npm run lint

# Format
npm run format

# Test
npm test

# Type check
npx tsc --noEmit
```

### 4. Commit
```bash
git add .
git commit -m "feat: add new feature

- Description of change 1
- Description of change 2

Closes #123"
```

### 5. Push and Create PR
```bash
git push origin feat/my-feature
```

Then create a Pull Request on GitHub.

## Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples
```bash
git commit -m "feat(api): add subscription management endpoint"
git commit -m "fix(webhook): handle missing receipt email"
git commit -m "docs(readme): update deployment instructions"
git commit -m "refactor(routes): extract admin settings to separate file"
```

## Code Style

### TypeScript/JavaScript
- Use TypeScript for all new code
- Prefer `const` over `let`
- Use async/await over callbacks
- Add types for function parameters and return values

### React
- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks

### Files
- Use camelCase for files: `myComponent.tsx`
- Use PascalCase for React components: `MyComponent.tsx`
- Group related files in directories

## Testing

### Unit Tests
```bash
npm test
```

### Test Structure
```typescript
describe('Feature', () => {
    it('should do something', async () => {
        // Arrange
        const input = 'test';
        
        // Act
        const result = await myFunction(input);
        
        // Assert
        expect(result).toBe('expected');
    });
});
```

## Project Structure

```
├── api/              # Backend routes
├── middleware/        # Express middleware
├── routes/           # Extracted route modules
├── tests/            # Test files
├── *.tsx             # React components
├── server.ts         # Express server
└── db.ts             # Database connection
```

## Pull Request Guidelines

### Title
Use the same format as commit messages:
```
feat(api): add user subscription endpoint
```

### Description
- What does this PR do?
- Why is this change needed?
- How to test it?
- Any breaking changes?

### Checklist
- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] No hardcoded secrets
- [ ] All tests pass
- [ ] Lint passes

## Review Process

1. **Automated Checks** — CI runs lint, tests, type check
2. **Code Review** — At least one approval required
3. **Merge** — Squash and merge to main

## Getting Help

- Check existing documentation in `/docs`
- Search GitHub Issues
- Ask in the team chat

## License

By contributing, you agree that your contributions will be licensed under the Apache-2.0 License.
