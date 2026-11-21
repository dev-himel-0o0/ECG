# dev-xcg

**A lightweight CLI for scaffolding Express.js CRUD modules in TypeScript.**

`dev-xcg` creates a complete, convention-based module under `src/module/<resource>/` so you can start implementing business logic instead of repeatedly creating the same files.

[![npm version](https://img.shields.io/npm/v/dev-xcg.svg)](https://www.npmjs.com/package/dev-xcg)
[![license](https://img.shields.io/npm/l/dev-xcg.svg)](https://www.npmjs.com/package/dev-xcg)

## Features

- Generates five TypeScript files with matching names and imports
- Generates typed Express controller, service, and repository objects
- Uses relative Express router paths
- Produces consistent CRUD naming and service/repository contracts
- Validates resource names before writing files
- Refuses to overwrite existing modules
- Cleans up partial output when generation fails
- Has no runtime dependencies

## Requirements

- Node.js 20 or newer
- An Express + TypeScript project

## Installation

Run `dev-xcg` once with `npx`:

```bash
npx dev-xcg <resource>
```

Or install it globally:

```bash
npm install --global dev-xcg
```

You can also add it as a development dependency:

```bash
npm install --save-dev dev-xcg
```

## Usage

Run the CLI from the root of the project where CRUD modules should be generated:

```bash
dev-xcg blog-post
```

This creates:

```text
src/module/blog-post/
├── blog-post.interface.ts
├── blog-post.controller.ts
├── blog-post.service.ts
├── blog-post.repository.ts
└── blog-post.route.ts
```

Display CLI help with:

```bash
dev-xcg --help
# or
dev-xcg -h
```

## Generated Module

For `blog-post`, `dev-xcg` creates the following interface, functions, and routes:

| Layer | Exports |
|-------|---------|
| Interface | `IBlogPost` |
| Controller | `blogPostController` with `createBlogPost`, `getBlogPosts`, `getBlogPostById`, `updateBlogPost`, `deleteBlogPost` |
| Service | `blogPostService` with `createBlogPost`, `getBlogPosts`, `getBlogPostById`, `updateBlogPost`, `deleteBlogPost` |
| Repository | `blogPostRepository` with `create`, `findAll`, `findById`, `update`, `deleteById` |
| Route | Typed `Router` instance exported as `blogPostRouter` |

The generated router declares these relative paths:

| Method | Path | Controller |
|--------|------|------------|
| `POST` | `/` | `createBlogPost` |
| `GET` | `/` | `getBlogPosts` |
| `GET` | `/:id` | `getBlogPostById` |
| `PATCH` | `/:id` | `updateBlogPost` |
| `DELETE` | `/:id` | `deleteBlogPost` |

The generated service, repository, and controller methods are empty implementation stubs. Add the appropriate application logic as needed.

## Resource Name Rules

Resource names must use lowercase kebab-case:

- Valid: `user`, `blog-post`, `product2`
- Invalid: `User`, `blog_post`, `blog post`, `-blog-post`, `blog--post`

Names must also satisfy these constraints:

- Exactly one resource argument
- Lowercase letters and digits only, with single hyphens between segments
- No spaces, underscores, path separators, or traversal sequences

## Safe Generation

`dev-xcg` is intentionally conservative:

- A resource directory is created only after validation and preflight checks
- Existing modules and files are never overwritten
- Files are written exclusively with the `wx` flag
- Directories and files created during a failed generation are removed

## Development

Clone the repository and install dependencies:

```bash
git clone https://github.com/dev-himel-0o0/dev-xcg.git
cd dev-xcg
npm install
```

Build the CLI:

```bash
npm run build
```

Run the strict typecheck:

```bash
npm run typecheck
```

Build and run the test suite:

```bash
npm test
```

The tests cover argument parsing, resource naming, template rendering, filesystem generation, CLI integration, and generated TypeScript code.

Run one compiled test suite directly when useful:

```bash
node --test dist-test/test/naming.test.js
```

## Publishing

Publishing is manual and should be performed from a clean `main` branch.

1. Update the package version in `package.json`.
2. Build and validate the package:

   ```bash
   npm run typecheck
   npm test
   npm run build
   npm pack
   ```

3. Inspect the generated `.tgz` contents and test the packed CLI if necessary.
4. Publish with:

   ```bash
   npm publish
   ```

The npm package contains the compiled `dist/` directory. The package has no runtime dependencies and requires Node.js 20 or newer.

## Contributing

Contributions are welcome. Keep changes focused, follow the existing TypeScript conventions, add or update tests for behavior changes, and run `npm run typecheck` and `npm test` before opening a pull request.

## License

MIT © [Shahadat Himel](https://github.com/dev-himel-0o0)
