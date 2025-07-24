# Conventional Commit

Creates a git commit using Conventional Commits specification.

## Usage

```
/git commit [type] [description]
```

## Parameters

- `type` (required): The type of change
  - `feat`: A new feature (MINOR version)
  - `fix`: A bug fix (PATCH version)
  - `docs`: Documentation only changes
  - `style`: Changes that do not affect the meaning of the code (formatting, etc.)
  - `refactor`: A code change that neither fixes a bug nor adds a feature
  - `perf`: A code change that improves performance
  - `test`: Adding missing tests or correcting existing tests
  - `build`: Changes that affect the build system or external dependencies
  - `ci`: Changes to CI configuration files and scripts
  - `chore`: Other changes that don't modify src or test files
- `description` (required): Short description of the change

## Commit Message Format

The command creates commits following this format:
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Examples

```bash
/git commit feat "add user authentication"
/git commit fix "resolve memory leak in data processing" 
/git commit docs "update installation instructions"
/git commit refactor "simplify error handling logic"
/git commit perf "optimize database queries"
```

## Best Practices

### Commit Message Language
- All commit messages must be written in English.

### Multiple Commits - MANDATORY APPROACH
**🚨 CRITICAL: Multiple focused commits are REQUIRED, not optional.** Single large commits are strongly discouraged and should be avoided in almost all cases.

**Benefits of multiple commits:**
- Code review clarity
- Git history readability  
- Easier debugging and rollbacks
- Better understanding of change evolution
- Improved collaboration and conflict resolution
- Granular revert capabilities

**⚠️ ALWAYS split commits when changes involve:**
- Different file types (code vs docs vs config)
- Multiple unrelated features or fixes
- Refactoring + new functionality
- Different logical components
- Setup/configuration changes + implementation
- Bug fixes + feature additions
- Tests + implementation code

**Example of REQUIRED commit separation:**
```bash
/git commit refactor "extract user validation logic"
/git commit feat "add email notification system" 
/git commit docs "update API documentation for notifications"
/git commit test "add tests for notification service"
```

**❌ AVOID single large commits like:** `feat: add notification system with refactoring and docs`

**✅ Even small changes should be separated by concern:**
```bash
/git commit fix "correct validation error message"
/git commit docs "update error handling documentation"
```

### When Single Commits Are Acceptable
Single commits are ONLY acceptable when:
- Making a single, isolated change that cannot be meaningfully split
- Fixing a single typo or minor documentation update
- Making a pure refactoring change with no functional modifications

