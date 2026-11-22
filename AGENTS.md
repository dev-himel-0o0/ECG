# dev-xcg — Express CRUD Generator

This file provides repository-specific guidance for contributors and AI coding assistants.

## Project Purpose

`dev-xcg` is a Node.js CLI that generates TypeScript Express CRUD modules.

A command such as:

```bash
dev-xcg blog-post
```

generates five files in `src/modules/blog-post/`:

- `blog-post.interface.ts`
- `blog-post.controller.ts`
- `blog-post.service.ts`
- `blog-post.repository.ts`
- `blog-post.route.ts`

The package is ESM-only, has no runtime dependencies, and supports Node.js 20 or newer.

## Repository Layout

| Path | Responsibility |
|------|----------------|
| `src/arguments.ts` | Parses exactly one resource argument and `-h`/`--help` |
| `src/naming.ts` | Validates resource names and computes generated identifiers |
| `src/templates.ts` | Renders interface, controller, service, repository, and route templates |
| `src/generator.ts` | Performs preflight checks, exclusive writes, and failure cleanup |
| `src/index.ts` | CLI entry point and process output |
| `test/*.test.ts` | Unit, integration, and generated-code typecheck coverage |
| `dist/` | Built CLI package output; ignored by Git |
| `dist-test/` | Compiled test output; ignored by Git |

The executable entry is `src/index.ts`, compiled to `dist/index.js` with a Node shebang.

## Required Toolchain

Use npm scripts rather than invoking ad hoc TypeScript commands:

| Command | Purpose |
|---------|---------|
| `npm run build` | Compile `src/` into `dist/` |
| `npm run build:test` | Compile tests and source into `dist-test/` |
| `npm run typecheck` | Strictly typecheck source and tests without emitting |
| `npm test` | Compile tests and run the Node test runner |
| `npm pack` | Build a local publishable `.tgz` package |

Validation order for a change is:

1. `npm run typecheck`
2. `npm test`
3. `npm run build`
4. `npm pack` when publishing behavior or package contents must be verified

Run a single compiled test suite with:

```bash
node --test dist-test/test/naming.test.js
```

## Naming and Output Conventions

- Resource names are lowercase kebab-case: `user`, `blog-post`, `product2`, `product-review`
- The resource directory and filename prefix use the same slug
- PascalCase resource names are computed from the slug: `blog-post` becomes `BlogPost`
- Controller and service CRUD names use `createX`, `getXs`, `getXById`, `updateX`, and `deleteX`
- Repository exports use `create`, `findAll`, `findById`, `update`, and `deleteById`
- Routes are relative to the mounted router: `POST /`, `GET /`, `GET /:id`, `PATCH /:id`, and `DELETE /:id`
- Generated Express imports use NodeNext-compatible `.js` suffixes
- Generated controller, service, and repository methods start as empty async implementation stubs

## Validation Rules

Keep resource validation centralized in `src/naming.ts`. Reject:

- Empty names
- Uppercase characters
- Spaces or underscores
- Path separators
- `..` traversal sequences
- Leading or trailing hyphens
- Consecutive hyphens
- Digits at the beginning
- Names that do not match lowercase kebab-case

Do not add filesystem path components from raw user input outside the validated naming flow.

## Generation Safety

Generation must remain non-destructive and transactional:

- Preflight the source, module, and resource paths
- Reject an existing resource directory or file
- Never overwrite files
- Use exclusive `wx` writes
- Track created directories and files
- Remove partial output when generation fails
- Preserve the project directory on validation errors

Any change to this behavior must include regression coverage in `test/generator.test.ts` or `test/cli.test.ts`.

## Code and Testing Guidelines

- Use strict TypeScript and preserve ESM/NodeNext module behavior
- Prefer small, pure helpers for naming and template logic
- Keep CLI output concise and deterministic
- Return structured results from generator APIs instead of relying on thrown control flow
- Add or update tests alongside behavior changes
- Use Node's built-in test runner and `node:assert/strict`
- Use temporary directories for filesystem and CLI tests
- Compile tests before running a direct suite from `dist-test/`
- Do not add runtime dependencies without a documented, necessary reason

Relevant test areas:

- `test/arguments.test.ts`: CLI argument parsing
- `test/naming.test.ts`: validation and identifier conversion
- `test/templates.test.ts`: exact generated template output
- `test/templates-typecheck.test.ts`: compilation of generated Express TypeScript
- `test/generator.test.ts`: filesystem safety and cleanup
- `test/cli.test.ts`: process exit codes and CLI integration
- `test/version.test.ts`: package and lockfile version consistency

## Package and Publishing

The package metadata is in `package.json`:

- Package name: `dev-xcg`
- CLI binary: `dev-xcg` -> `./dist/index.js`
- Published files: `dist`, `README.md`, and `LICENSE`
- License: MIT
- Repository: `dev-himel-0o0/dev-xcg`

Publishing is manual. Do not add a publish step to CI without an explicit security and release process.

Before publishing:

1. Start from a clean branch with the intended version committed in `package.json` and `package-lock.json`.
2. Run `npm run typecheck`.
3. Run `npm test`.
4. Run `npm run build`.
5. Run `npm pack` and inspect the tarball contents.
6. Verify the CLI from the packed artifact if needed.
7. Publish with `npm publish`.
8. Create and push an annotated tag for the published version:
   ```bash
   git tag -a v<version> -m "dev-xcg <version>"
   git push origin v<version>
   ```

Do not document or implement `--dry-run` or automated publishing unless the release process is intentionally changed.
