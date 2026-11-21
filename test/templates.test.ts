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
      `import type { Request, Response } from "express";

const createUser = async (_req: Request, _res: Response) => {
  throw new Error("Not implemented");
};

const getUsers = async (_req: Request, _res: Response) => {
  throw new Error("Not implemented");
};

const getUserById = async (_req: Request, _res: Response) => {
  throw new Error("Not implemented");
};

const updateUser = async (_req: Request, _res: Response) => {
  throw new Error("Not implemented");
};

const deleteUser = async (_req: Request, _res: Response) => {
  throw new Error("Not implemented");
};

export const userController = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};
`,
    );
  });

  it("renders typed service functions", () => {
    equal(
      contentOf(render("user"), "user.service.ts"),
      `import type { IUser } from "./user.interface.js";

const createUser = async (payload: IUser) => {
  throw new Error("Not implemented");
};

const getUsers = async () => {
  throw new Error("Not implemented");
};

const getUserById = async (id: string) => {
  throw new Error("Not implemented");
};

const updateUser = async (id: string, payload: IUser) => {
  throw new Error("Not implemented");
};

const deleteUser = async (id: string) => {
  throw new Error("Not implemented");
};

export const userService = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};
`,
    );
  });

  it("renders typed repository functions", () => {
    equal(
      contentOf(render("user"), "user.repository.ts"),
      `import type { IUser } from "./user.interface.js";

const create = async (payload: IUser) => {
  throw new Error("Not implemented");
};

const findAll = async () => {
  throw new Error("Not implemented");
};

const findById = async (id: string) => {
  throw new Error("Not implemented");
};

const update = async (id: string, payload: IUser) => {
  throw new Error("Not implemented");
};

const deleteById = async (id: string) => {
  throw new Error("Not implemented");
};

export const userRepository = {
  create,
  findAll,
  findById,
  update,
  deleteById,
};
`,
    );
  });

  it("renders the Express router with CRUD routes", () => {
    equal(
      contentOf(render("user"), "user.route.ts"),
      `import type { Router } from "express";
import express from "express";
import { userController } from "./user.controller.js";

export const userRouter: Router = express.Router();

userRouter.post("/", userController.createUser);
userRouter.get("/", userController.getUsers);
userRouter.get("/:id", userController.getUserById);
userRouter.patch("/:id", userController.updateUser);
userRouter.delete("/:id", userController.deleteUser);
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
    match(controller, /import type \{ Request, Response \} from "express";/);
    match(controller, /const createBlogPost = async \(_req: Request, _res: Response\)/);
    match(controller, /export const blogPostController = \{/);

    const service = contentOf(files, "blog-post.service.ts");
    match(service, /import type \{ IBlogPost \} from "\.\/blog-post\.interface\.js";/);
    match(service, /const getBlogPosts = async \(\)/);
    match(service, /export const blogPostService = \{/);
    equal(service.includes("Promise"), false);

    const repository = contentOf(files, "blog-post.repository.ts");
    match(repository, /const findAll = async \(\)/);
    match(repository, /export const blogPostRepository = \{/);
    equal(repository.includes("Promise"), false);

    const route = contentOf(files, "blog-post.route.ts");
    match(route, /import \{ blogPostController \} from "\.\/blog-post\.controller\.js";/);
    match(route, /import type \{ Router \} from "express";/);
    match(route, /import express from "express";/);
    match(route, /export const blogPostRouter: Router = express\.Router\(\);/);
    match(route, /blogPostRouter\.post\("\/", blogPostController\.createBlogPost\);/);
  });
});
