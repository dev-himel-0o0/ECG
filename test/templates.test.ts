import { describe, it } from "node:test";
import { deepEqual, equal, match } from "node:assert/strict";

import { parseResourceName } from "../src/naming.js";
import { renderResourceTemplates } from "../src/templates.js";
import type { TemplateFile } from "../src/templates.js";

function render(slug: string): readonly TemplateFile[] {
  const parsed = parseResourceName(slug);

  if (!parsed.ok) {
    throw new Error(parsed.message);
  }

  return renderResourceTemplates(parsed.value);
}

function contentOf(files: readonly TemplateFile[], filename: string): string {
  const file = files.find((candidate) => candidate.filename === filename);

  if (file === undefined) {
    throw new Error(`Missing template file: ${filename}`);
  }

  return file.content;
}

describe("renderResourceTemplates", () => {
  it("renders exactly the five files for a resource", () => {
    deepEqual(
      render("user").map((file) => file.filename),
      [
        "user.interface.ts",
        "user.controller.ts",
        "user.service.ts",
        "user.repository.ts",
        "user.route.ts",
      ],
    );
  });

  it("renders the empty resource interface", () => {
    equal(
      contentOf(render("user"), "user.interface.ts"),
      `export interface IUser {}\n`,
    );
  });

  it("renders typed controller handlers", () => {
    equal(
      contentOf(render("user"), "user.controller.ts"),
      `import type { RequestHandler } from "express";

export const createUser: RequestHandler = async (_req, _res) => {
  throw new Error("Not implemented");
};

export const getUsers: RequestHandler = async (_req, _res) => {
  throw new Error("Not implemented");
};

export const getUserById: RequestHandler = async (_req, _res) => {
  throw new Error("Not implemented");
};

export const updateUser: RequestHandler = async (_req, _res) => {
  throw new Error("Not implemented");
};

export const deleteUser: RequestHandler = async (_req, _res) => {
  throw new Error("Not implemented");
};
`,
    );
  });

  it("renders typed service functions", () => {
    equal(
      contentOf(render("user"), "user.service.ts"),
      `import type { IUser } from "./user.interface.js";

export const createUser = async (payload: IUser): Promise<IUser> => {
  throw new Error("Not implemented");
};

export const getUsers = async (): Promise<IUser[]> => {
  throw new Error("Not implemented");
};

export const getUserById = async (id: string): Promise<IUser | null> => {
  throw new Error("Not implemented");
};

export const updateUser = async (id: string, payload: IUser): Promise<IUser | null> => {
  throw new Error("Not implemented");
};

export const deleteUser = async (id: string): Promise<void> => {
  throw new Error("Not implemented");
};
`,
    );
  });

  it("renders typed repository functions", () => {
    equal(
      contentOf(render("user"), "user.repository.ts"),
      `import type { IUser } from "./user.interface.js";

export const create = async (payload: IUser): Promise<IUser> => {
  throw new Error("Not implemented");
};

export const findAll = async (): Promise<IUser[]> => {
  throw new Error("Not implemented");
};

export const findById = async (id: string): Promise<IUser | null> => {
  throw new Error("Not implemented");
};

export const update = async (id: string, payload: IUser): Promise<IUser | null> => {
  throw new Error("Not implemented");
};

export const deleteById = async (id: string): Promise<void> => {
  throw new Error("Not implemented");
};
`,
    );
  });

  it("renders the Express router with CRUD routes", () => {
    equal(
      contentOf(render("user"), "user.route.ts"),
      `import type { Router } from "express";
import express from "express";

import {
  createUser,
  deleteUser,
  getUserById,
  getUsers,
  updateUser,
} from "./user.controller.js";

export const userRouter: Router = express.Router();

userRouter.post("/", createUser);
userRouter.get("/", getUsers);
userRouter.get("/:id", getUserById);
userRouter.patch("/:id", updateUser);
userRouter.delete("/:id", deleteUser);
`,
    );
  });

  it("uses only Not implemented bodies in controller, service, and repository", () => {
    const files = render("user");

    for (const filename of [
      "user.controller.ts",
      "user.service.ts",
      "user.repository.ts",
    ]) {
      const content = contentOf(files, filename);
      equal(content.split(`throw new Error("Not implemented");`).length - 1, 5);
    }
  });

  it("contains no explicit any or comments", () => {
    for (const file of render("user")) {
      equal(/\bany\b/.test(file.content), false);
      equal(file.content.includes("//"), false);
      equal(file.content.includes("/*"), false);
    }
  });

  it("renders consistent kebab-case naming", () => {
    const files = render("blog-post");

    deepEqual(
      files.map((file) => file.filename),
      [
        "blog-post.interface.ts",
        "blog-post.controller.ts",
        "blog-post.service.ts",
        "blog-post.repository.ts",
        "blog-post.route.ts",
      ],
    );

    equal(
      contentOf(files, "blog-post.interface.ts"),
      `export interface IBlogPost {}\n`,
    );

    const controller = contentOf(files, "blog-post.controller.ts");
    match(controller, /export const createBlogPost: RequestHandler/);
    match(controller, /export const getBlogPosts: RequestHandler/);
    match(controller, /export const getBlogPostById: RequestHandler/);
    match(controller, /export const updateBlogPost: RequestHandler/);
    match(controller, /export const deleteBlogPost: RequestHandler/);

    const service = contentOf(files, "blog-post.service.ts");
    match(service, /import type \{ IBlogPost \} from "\.\/blog-post\.interface\.js";/);
    match(service, /export const getBlogPosts = async \(\): Promise<IBlogPost\[\]>/);

    const repository = contentOf(files, "blog-post.repository.ts");
    match(repository, /export const findAll = async \(\): Promise<IBlogPost\[\]>/);

    const route = contentOf(files, "blog-post.route.ts");
    match(route, /from "\.\/blog-post\.controller\.js";/);
    match(route, /import type \{ Router \} from "express";/);
    match(route, /import express from "express";/);
    match(route, /export const blogPostRouter: Router = express\.Router\(\);/);
  });
});
