# xcg

**A lightweight CLI for scaffolding Express.js CRUD modules in TypeScript.**

`xcg` creates a complete, convention-based module under `src/module/<resource>/` so you can start implementing business logic instead of repeatedly creating the same files.

[![npm version](https://img.shields.io/npm/v/xcg.svg)](https://www.npmjs.com/package/xcg)
[![license](https://img.shields.io/npm/l/xcg.svg)](https://www.npmjs.com/package/xcg)

## Features

- Generates five TypeScript files with matching names and imports
- Supports an Express 5-style `RequestHandler` controller
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

Run `xcg` once with `npx`:

```bash
npx xcg <resource>
```

Or install it globally:

```bash
npm install --global xcg
```

You can also add it as a development dependency:

```bash
npm install --save-dev xcg
```

## Usage

Run the CLI from the root of the project where CRUD modules should be generated:

```bash
xcg blog-post
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
xcg --help
# or
xcg -h
```

## Generated Module

For `blog-post`, `xcg` creates the following interface, functions, and routes:

| Layer | Exports |
|-------|---------|
| Interface | `IBlogPost` |
| Controller | `createBlogPost`, `getBlogPosts`, `getBlogPostById`, `updateBlogPost`, `deleteBlogPost` |
| Service | `createBlogPost`, `getBlogPosts`, `getBlogPostById`, `updateBlogPost`, `deleteBlogPost` |
| Repository | `create`, `findAll`, `findById`, `update`, `deleteById` |
| Route | `Router` instance exported as `blogPostRouter` |

The generated router declares these relative paths:

| Method | Path | Controller |
|--------|------|------------|
| `POST` | `/` | `createBlogPost` |
| `GET` | `/` | `getBlogPosts` |
| `GET` | `/:id` | `getBlogPostById` |
| `PATCH` | `/:id` | `updateBlogPost` |
| `DELETE` | `/:id` | `deleteBlogPost` |

The generated service, repository, and controller methods are implementation stubs. Replace each `Not implemented` error with the appropriate application logic.

## Resource Name Rules

Resource names must use lowercase kebab-case:

- Valid: `user`, `blog-post`, `product2`
- Invalid: `User`, `blog_post`, `blog post`, `-blog-post`, `blog--post`

Names must also satisfy these constraints:

- Exactly one resource argument
- Lowercase letters and digits only, with single hyphens between segments
- No spaces, underscores, path separators, or traversal sequences

## Safe Generation

`xcg` is intentionally conservative:

- A resource directory is created only after validation and preflight checks
- Existing modules and files are never overwritten
- Files are written exclusively with the `wx` flag
- Directories and files created during a failed generation are removed

## Development

Clone the repository and install dependencies:

```bash
git clone https://github.com/dev-himel-0o0/xcg.git
cd xcg
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
