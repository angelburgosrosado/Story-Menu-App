```markdown
# Story-Menu-App Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches the core development patterns and conventions used in the Story-Menu-App repository, a TypeScript project with no detected framework. You'll learn how to structure files, write and organize code, follow commit conventions, and implement and run tests in alignment with the repository's standards.

## Coding Conventions

### File Naming
- Use **camelCase** for file names.
  - Example: `storyMenu.ts`, `menuItemList.ts`

### Import Style
- Use **relative imports** for module references.
  - Example:
    ```typescript
    import { MenuItem } from './menuItem';
    ```

### Export Style
- Mixed usage of **default** and **named exports**.
  - Example (default export):
    ```typescript
    export default function createMenu() { ... }
    ```
  - Example (named export):
    ```typescript
    export function getMenuItems() { ... }
    ```

### Commit Messages
- Use **Conventional Commits** with the `feat` prefix for features.
  - Example:
    ```
    feat: add menu item filtering by category
    ```

## Workflows

### Add a New Feature
**Trigger:** When implementing a new functionality.
**Command:** `/add-feature`

1. Create a new TypeScript file using camelCase naming.
2. Implement the feature using relative imports for dependencies.
3. Export your functions or classes (default or named as appropriate).
4. Write or update corresponding test files (`*.test.ts`).
5. Commit your changes using a conventional commit message:
    ```
    feat: [short description of the feature]
    ```

### Run Tests
**Trigger:** When you want to verify code correctness.
**Command:** `/run-tests`

1. Locate all test files matching the `*.test.*` pattern.
2. Use the project's preferred test runner (framework unknown; check documentation or scripts).
3. Run the tests and review the output for failures.

## Testing Patterns

- Test files follow the `*.test.*` naming convention (e.g., `menuItem.test.ts`).
- The testing framework is **unknown**; refer to project documentation or scripts for details.
- Place test files alongside or near the modules they test.
- Example test file:
    ```typescript
    // menuItem.test.ts
    import { getMenuItems } from './menuItem';

    describe('getMenuItems', () => {
      it('returns all menu items', () => {
        const items = getMenuItems();
        expect(items.length).toBeGreaterThan(0);
      });
    });
    ```

## Commands
| Command        | Purpose                                  |
|----------------|------------------------------------------|
| /add-feature   | Scaffold and commit a new feature        |
| /run-tests     | Run all test files in the codebase       |
```
