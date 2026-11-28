# dev-xcg

**A lightweight CLI for scaffolding Express.js CRUD modules in TypeScript.**

`dev-xcg` creates a complete, convention-based module under `src/modules/<resource>/` so you can start implementing business logic instead of repeatedly creating the same files.

[![npm version](https://img.shields.io/npm/v/dev-xcg.svg)](https://www.npmjs.com/package/dev-xcg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Usage

No installation is required. `npx` runs the latest published version without installing it globally or adding it to your project's dependencies.

Run the CLI from the root of the project where CRUD modules should be generated:

```bash
npx dev-xcg blog-post
```

This creates:

```text
src/modules/blog-post/
├── blog-post.interface.ts
├── blog-post.controller.ts
├── blog-post.service.ts
├── blog-post.repository.ts
└── blog-post.route.ts
```

Display CLI help with:

```bash
npx dev-xcg --help
# or
npx dev-xcg -h
```

## Generated Module

For `blog-post`, `dev-xcg` creates the following interface, functions, and routes:

| Layer      | Exports                                                                                                           |
| ---------- | ----------------------------------------------------------------------------------------------------------------- |
| Interface  | `IBlogPost`                                                                                                       |
| Controller | `blogPostController` with `createBlogPost`, `getBlogPosts`, `getBlogPostById`, `updateBlogPost`, `deleteBlogPost` |
| Service    | `blogPostService` with `createBlogPost`, `getBlogPosts`, `getBlogPostById`, `updateBlogPost`, `deleteBlogPost`    |
| Repository | `blogPostRepository` with `create`, `findAll`, `findById`, `update`, `deleteById`                                 |
| Route      | Typed `Router` instance exported as `blogPostRouter`                                                              |

The generated router declares these relative paths:

| Method   | Path   | Controller        |
| -------- | ------ | ----------------- |
| `POST`   | `/`    | `createBlogPost`  |
| `GET`    | `/`    | `getBlogPosts`    |
| `GET`    | `/:id` | `getBlogPostById` |
| `PATCH`  | `/:id` | `updateBlogPost`  |
| `DELETE` | `/:id` | `deleteBlogPost`  |

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

- A missing resource directory is created only after validation and preflight checks
- An existing resource directory is reused, and only missing generated files are created
- Existing generated files and unrelated files are never overwritten
- Generated-file paths that are not regular files are rejected
- Files are written exclusively with the `wx` flag
- Directories and files created during a failed generation are removed, while pre-existing directories and files are preserved

## Features

- Generates five TypeScript files with matching names and imports
- Generates typed Express controller, service, and repository objects
- Uses relative Express router paths
- Produces consistent CRUD naming and service/repository contracts
- Validates resource names before writing files
- Generates missing files in existing module directories
- Never overwrites existing generated files
- Cleans up partial output when generation fails
- Has no runtime dependencies

## Requirements

- Node.js 20 or newer
- An Express + TypeScript project

## Contributing

Contributions are welcome. Keep changes focused, follow the existing TypeScript conventions, add or update tests for behavior changes, and run `npm run typecheck` and `npm test` before opening a pull request.

## License

MIT © [Shahadat Himel](https://github.com/dev-himel-0o0)
