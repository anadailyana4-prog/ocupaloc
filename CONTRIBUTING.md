# Contributing to ocupaloc.ro

Thank you for your interest in contributing to ocupaloc.ro! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

Please be respectful and constructive in all interactions with other contributors.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/<your-username>/ocupaloc.git
   cd ocupaloc
   ```
3. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Set up the development environment**:
   ```bash
   pnpm install
   cp .env.example .env.local
   # Fill in your .env.local with test credentials
   pnpm run dev
   ```

## Development Workflow

### 1. Code Quality Standards

All code must pass:
- **ESLint**: `pnpm run lint`
- **TypeScript**: `pnpm run typecheck`
- **Unit tests**: `pnpm run test`
- **Build**: `pnpm run build`

Before committing, run the full quality gate:
```bash
pnpm run check:all
```

### 2. Writing Tests

- **Unit tests** go in `tests/*.test.ts` files
- **E2E tests** go in `tests/e2e/*.spec.ts` files
- Target at least 80% code coverage for business-logic files
- Use Vitest for unit tests, Playwright for E2E tests

Example unit test:
```typescript
import { describe, it, expect } from "vitest";
import { normalizePhoneNumber } from "@/lib/phone";

describe("normalizePhoneNumber", () => {
  it("converts Romanian mobile to +40 format", () => {
    expect(normalizePhoneNumber("0721234567")).toBe("+40721234567");
  });
});
```

Example E2E test:
```typescript
import { test, expect } from "@playwright/test";

test("salon owner can create a service", async ({ page }) => {
  await page.goto("/intrare");
  await page.fill("input[type=email]", process.env.PLAYWRIGHT_LOGIN_EMAIL!);
  // ... rest of test
});
```

### 3. Updating the Changelog

When making changes, update `CHANGELOG.md`:

1. Find or create an `[Unreleased]` section at the top
2. Add your changes under appropriate categories:
   - **Added**: New features
   - **Changed**: Modifications to existing functionality
   - **Deprecated**: Features to be removed in future versions
   - **Removed**: Deleted functionality
   - **Fixed**: Bug fixes
   - **Security**: Security fixes or improvements
3. Use descriptive bullet points
4. Reference issue/PR numbers: `Fix rate limiting bug (#123)`

Example:
```markdown
## [Unreleased]

### Added
- Email notifications for booking reminders (#456)

### Fixed
- Database query timeout on large bookings list (#789)
```

### 4. Commit Messages

Use clear, descriptive commit messages:
- **feat**: New feature → `feat: add email reminders for upcoming bookings`
- **fix**: Bug fix → `fix: prevent double bookings on schedule conflicts`
- **docs**: Documentation → `docs: update setup instructions`
- **style**: Code style → `style: add missing type annotations`
- **refactor**: Code refactoring → `refactor: extract rate limiting to separate module`
- **test**: Test additions → `test: add integration tests for webhook handlers`
- **chore**: Maintenance → `chore: update dependencies`

Format: `<type>: <subject>`
- Keep subject under 50 characters
- Use imperative mood ("add" not "adds")
- No period at the end

### 5. Pull Request Process

1. **Update tests** for any new functionality
2. **Run full validation**:
   ```bash
   pnpm run check:all
   ```
3. **Push your branch**:
   ```bash
   git push origin feature/your-feature-name
   ```
4. **Create a Pull Request** on GitHub with:
   - Clear description of changes
   - Reference to any related issues (#123)
   - Summary of testing performed
   - Changelog entries if applicable
5. **Address review feedback** promptly
6. **Ensure all CI checks pass** before merge

## Deployment

### Branch Protection Rules

The `main` branch is protected:
- All PRs must have passing CI checks
- Code review approval required
- Status checks must pass:
  - `Typecheck, Lint & Build` job
  - All ESLint, TypeScript, and test validations

### Production Deployment

1. Changes are automatically deployed to production when merged to `main`
2. Vercel automatically builds and deploys the `main` branch
3. Health checks run post-deployment
4. Sentry tracks errors in production

## Troubleshooting

### Tests Failing

```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Run tests with verbose output
pnpm run test -- --reporter=verbose
```

### Type Errors After Changes

```bash
# Regenerate TypeScript definitions
pnpm run typecheck
```

### Lint Errors

```bash
# Run ESLint with auto-fix
pnpm exec eslint . --fix
```

## Reporting Issues

If you find a bug:
1. Check existing issues to avoid duplicates
2. Provide a clear description
3. Include steps to reproduce
4. Include relevant environment details (Node version, OS, etc.)
5. Attach screenshots or logs if applicable

## Feature Requests

For feature requests:
1. Check existing issues and discussions
2. Provide clear use case and expected behavior
3. Include any relevant mockups or examples
4. Consider implementation complexity and maintenance burden

## Questions?

- Check [README.md](./README.md) for setup instructions
- Review existing [issues](https://github.com/anadailyana4-prog/ocupaloc/issues) and [discussions](https://github.com/anadailyana4-prog/ocupaloc/discussions)
- Ask in GitHub Discussions for general questions

## License

By contributing to this project, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing! 🙏
