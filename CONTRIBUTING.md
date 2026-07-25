# Contributing Guide

How to contribute to Story Menu App development.

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- Git
- Google Cloud account (for deployment)
- Stripe account (for payments)

### Local Development

```bash
# Clone the repository
git clone https://github.com/angelburgosrosado/Story-Menu-App.git
cd Story-Menu-App

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Start development server
npm run dev
```

### Environment Variables

Required for local development:

```env
PORT=3000
DATABASE_URL=postgresql://user:pass@host:5432/dbname
GEMINI_API_KEY=your_gemini_api_key
FIREBASE_SERVICE_ACCOUNT_KEY=your_firebase_credentials
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

Optional (for additional image engines):

```env
LLAMAGEN_API_KEY=your_llamagen_key
CONFYUI_API_URL=http://127.0.0.1:8188
LEONARDO_API_KEY=your_leonardo_key
```

---

## Development Workflow

### 1. Create a Branch

Always work on a feature branch, never directly on `main`:

```bash
# From main
git checkout -b feature/your-feature-name

# Or for fixes
git checkout -b fix/your-fix-name
```

### 2. Make Changes

- Follow the existing code style (ESLint + Prettier enforced)
- Write tests for new functionality
- Update documentation if needed

### 3. Commit

Use conventional commit messages:

```bash
# Format: <type>(<scope>): <description>

# Examples:
git commit -m "feat(stripe): add subscription management"
git commit -m "fix(auth): resolve token refresh race condition"
git commit -m "docs(api): update developer API v1 documentation"
git commit -m "test(stripe): add webhook signature verification tests"
```

Types:
- `feat` — New feature
- `fix` — Bug fix
- `docs` — Documentation
- `test` — Tests
- `refactor` — Code refactoring
- `chore` — Maintenance
- `ci` — CI/CD changes

### 4. Push

```bash
git push origin feature/your-feature-name
```

### 5. Create Pull Request

1. Go to GitHub repository
2. Click "New pull request"
3. Select your branch
4. Fill in PR description:
   - What does this change?
   - Why is it needed?
   - How to test it?
5. Request review from @Mike (Eng Lead) or @Mira (Project Lead)

### 6. Review & Merge

- PRs require at least one review
- All CI checks must pass
- Squash merge preferred for clean history

---

## Code Standards

### TypeScript

- Strict mode enabled
- No `any` types — use proper type definitions
- Interface over type for object shapes

### React

- Functional components only
- Hooks for state management
- React Testing Library for component tests

### Backend

- Express route handlers in separate files under `routes/`
- Middleware in `middleware/`
- Structured logging (no console.log)
- Input validation on all endpoints

### Testing

- Write tests for new features
- Target >80% coverage for critical paths
- Use mocks for external services (Gemini, Stripe, Firebase)

```bash
# Run tests
npm test

# Run specific test file
npx vitest run tests/api.test.ts

# Run with coverage
npx vitest run --coverage
```

---

## Pull Request Guidelines

### PR Title

Follow conventional commit format:
```
feat(scope): description
fix(scope): description
```

### PR Description Template

```markdown
## What
Brief description of changes.

## Why
Why this change is needed.

## How
How to test the changes.

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes (or documented in PR)
- [ ] Security review completed (if applicable)
```

### Review Checklist

For reviewers:
- [ ] Code follows style guidelines
- [ ] Tests are comprehensive
- [ ] No security vulnerabilities
- [ ] No hardcoded secrets
- [ ] Documentation is updated
- [ ] Breaking changes are documented

---

## Architecture Decisions

When making significant changes, document the decision:

1. **Context** — What problem are we solving?
2. **Decision** — What did we decide?
3. **Consequences** — What are the trade-offs?

Add to `docs/decisions/` or include in PR description.

---

## Getting Help

- **Architecture:** See [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Troubleshooting:** See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **Changelog:** See [CHANGELOG.md](./CHANGELOG.md)
- **Issues:** Open a GitHub issue
- **Discussions:** Use GitHub Discussions for questions
