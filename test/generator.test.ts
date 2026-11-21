import { describe, it } from "node:test";
import { deepEqual, equal, match } from "node:assert/strict";
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { join } from "node:path";

import { generateResource } from "../src/generator.js";

const expectedFiles = [
  "user.controller.ts",
  "user.interface.ts",
  "user.repository.ts",
  "user.route.ts",
  "user.service.ts",
];

async function withTempRoot(
  run: (projectRoot: string) => Promise<void>,
): Promise<void> {
  const projectRoot = await mkdtemp(
    join(process.cwd(), "dist-test", ".generator-"),
  );

  try {
    await run(projectRoot);
  } finally {
    await rm(projectRoot, { recursive: true, force: true });
  }
}

describe("generateResource", () => {
  it("generates a module when src does not exist", async () => {
    await withTempRoot(async (projectRoot) => {
      const result = await generateResource({
        projectRoot,
        resource: "user",
      });

      equal(result.ok, true);
      if (!result.ok) {
        return;
      }

      const expectedDirectory = join(projectRoot, "src", "module", "user");
      equal(result.outputDirectory, expectedDirectory);
      deepEqual([...result.files].sort(), expectedFiles);

      const entries = await readdir(expectedDirectory);
      deepEqual(entries.sort(), expectedFiles);

      equal(
        await readFile(join(expectedDirectory, "user.interface.ts"), "utf8"),
        "export interface IUser {}\n",
      );
    });
  });

  it("reuses an existing src/module directory", async () => {
    await withTempRoot(async (projectRoot) => {
      const moduleDirectory = join(projectRoot, "src", "module");
      await mkdir(moduleDirectory, { recursive: true });
      await writeFile(join(moduleDirectory, "keep.txt"), "keep\n", "utf8");

      const result = await generateResource({
        projectRoot,
        resource: "user",
      });

      equal(result.ok, true);
      if (!result.ok) {
        return;
      }

      equal(await readFile(join(moduleDirectory, "keep.txt"), "utf8"), "keep\n");
      deepEqual((await readdir(result.outputDirectory)).sort(), expectedFiles);
    });
  });

  it("rejects an existing resource directory and preserves its files", async () => {
    await withTempRoot(async (projectRoot) => {
      const resourceDirectory = join(projectRoot, "src", "module", "user");
      await mkdir(resourceDirectory, { recursive: true });
      await writeFile(
        join(resourceDirectory, "user.interface.ts"),
        "existing interface\n",
        "utf8",
      );
      await writeFile(
        join(resourceDirectory, "notes.txt"),
        "existing notes\n",
        "utf8",
      );

      const result = await generateResource({
        projectRoot,
        resource: "user",
      });

      equal(result.ok, false);
      if (!result.ok) {
        match(result.message, /resource directory already exists/i);
      }

      deepEqual(
        (await readdir(resourceDirectory)).sort(),
        ["notes.txt", "user.interface.ts"],
      );
      equal(
        await readFile(join(resourceDirectory, "user.interface.ts"), "utf8"),
        "existing interface\n",
      );
      equal(
        await readFile(join(resourceDirectory, "notes.txt"), "utf8"),
        "existing notes\n",
      );
    });
  });

  it("rejects invalid resource names before touching the filesystem", async () => {
    await withTempRoot(async (projectRoot) => {
      for (const resource of ["User", "../user", "user--profile", "user profile"]) {
        const result = await generateResource({
          projectRoot,
          resource,
        });

        equal(result.ok, false);
        if (!result.ok) {
          match(result.message, /resource name/i);
        }
      }

      deepEqual(await readdir(projectRoot), []);
    });
  });

  it("removes partial output when a write fails", async () => {
    await withTempRoot(async (projectRoot) => {
      let writeCount = 0;

      const result = await generateResource({
        projectRoot,
        resource: "user",
        fileWriter: async (filePath, content) => {
          writeCount += 1;

          if (writeCount === 3) {
            throw new Error("simulated write failure");
          }

          await writeFile(filePath, content, "utf8");
        },
      });

      equal(result.ok, false);
      if (!result.ok) {
        match(result.message, /simulated write failure/);
      }

      deepEqual(await readdir(projectRoot), []);
    });
  });

  it("handles a non-directory src path gracefully", async () => {
    await withTempRoot(async (projectRoot) => {
      await writeFile(join(projectRoot, "src"), "not a directory\n", "utf8");

      const result = await generateResource({
        projectRoot,
        resource: "user",
      });

      equal(result.ok, false);
      if (!result.ok) {
        match(result.message, /not a directory/i);
      }

      equal(
        await readFile(join(projectRoot, "src"), "utf8"),
        "not a directory\n",
      );
    });
  });
});
