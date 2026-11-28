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

      const expectedDirectory = join(projectRoot, "src", "modules", "user");
      equal(result.outputDirectory, expectedDirectory);
      equal(result.directoryCreated, true);
      deepEqual([...result.createdFiles].sort(), expectedFiles);
      deepEqual(result.skippedFiles, []);

      const entries = await readdir(expectedDirectory);
      deepEqual(entries.sort(), expectedFiles);
      deepEqual(await readdir(join(projectRoot, "src")), ["modules"]);

      equal(
        await readFile(join(expectedDirectory, "user.interface.ts"), "utf8"),
        "export interface IUser {}\n",
      );
    });
  });

  it("reuses an existing src/modules directory", async () => {
    await withTempRoot(async (projectRoot) => {
      const modulesDirectory = join(projectRoot, "src", "modules");
      await mkdir(modulesDirectory, { recursive: true });
      await writeFile(join(modulesDirectory, "keep.txt"), "keep\n", "utf8");

      const result = await generateResource({
        projectRoot,
        resource: "user",
      });

      equal(result.ok, true);
      if (!result.ok) {
        return;
      }

      equal(await readFile(join(modulesDirectory, "keep.txt"), "utf8"), "keep\n");
      deepEqual((await readdir(result.outputDirectory)).sort(), expectedFiles);
      equal(result.directoryCreated, true);
      deepEqual([...result.createdFiles].sort(), expectedFiles);
      deepEqual(result.skippedFiles, []);
    });
  });

  it("generates into an existing resource directory and preserves unrelated files", async () => {
    await withTempRoot(async (projectRoot) => {
      const resourceDirectory = join(projectRoot, "src", "modules", "user");
      await mkdir(resourceDirectory, { recursive: true });
      await writeFile(
        join(resourceDirectory, "notes.txt"),
        "existing notes\n",
        "utf8",
      );

      const result = await generateResource({
        projectRoot,
        resource: "user",
      });

      equal(result.ok, true);
      if (!result.ok) {
        return;
      }

      deepEqual(
        (await readdir(resourceDirectory)).sort(),
        [...expectedFiles, "notes.txt"].sort(),
      );
      equal(result.directoryCreated, false);
      deepEqual([...result.createdFiles].sort(), expectedFiles);
      deepEqual(result.skippedFiles, []);
      equal(
        await readFile(join(resourceDirectory, "notes.txt"), "utf8"),
        "existing notes\n",
      );
      equal(
        await readFile(join(resourceDirectory, "user.interface.ts"), "utf8"),
        "export interface IUser {}\n",
      );
    });
  });

  it("creates missing files and preserves existing generated files", async () => {
    await withTempRoot(async (projectRoot) => {
      const resourceDirectory = join(projectRoot, "src", "modules", "user");
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

      equal(result.ok, true);
      if (!result.ok) {
        return;
      }

      equal(result.directoryCreated, false);
      deepEqual(
        [...result.createdFiles].sort(),
        expectedFiles.filter((filename) => filename !== "user.interface.ts"),
      );
      deepEqual(result.skippedFiles, ["user.interface.ts"]);
      deepEqual(
        (await readdir(resourceDirectory)).sort(),
        [...expectedFiles, "notes.txt"].sort(),
      );
      equal(
        await readFile(join(resourceDirectory, "user.interface.ts"), "utf8"),
        "existing interface\n",
      );
      equal(
        await readFile(join(resourceDirectory, "notes.txt"), "utf8"),
        "existing notes\n",
      );
      match(
        await readFile(join(resourceDirectory, "user.service.ts"), "utf8"),
        /export const userService = \{/,
      );
    });
  });

  it("leaves a complete module unchanged", async () => {
    await withTempRoot(async (projectRoot) => {
      const resourceDirectory = join(projectRoot, "src", "modules", "user");
      await mkdir(resourceDirectory, { recursive: true });

      for (const filename of expectedFiles) {
        await writeFile(
          join(resourceDirectory, filename),
          `existing ${filename}\n`,
          "utf8",
        );
      }

      const result = await generateResource({
        projectRoot,
        resource: "user",
      });

      equal(result.ok, true);
      if (!result.ok) {
        return;
      }

      equal(result.directoryCreated, false);
      deepEqual(result.createdFiles, []);
      deepEqual([...result.skippedFiles].sort(), expectedFiles);

      for (const filename of expectedFiles) {
        equal(
          await readFile(join(resourceDirectory, filename), "utf8"),
          `existing ${filename}\n`,
        );
      }
    });
  });

  it("rejects a generated file path that is not a regular file", async () => {
    await withTempRoot(async (projectRoot) => {
      const resourceDirectory = join(projectRoot, "src", "modules", "user");
      await mkdir(join(resourceDirectory, "user.interface.ts"), {
        recursive: true,
      });

      const result = await generateResource({
        projectRoot,
        resource: "user",
      });

      equal(result.ok, false);
      if (!result.ok) {
        match(result.message, /refusing to overwrite existing path/i);
      }

      deepEqual(await readdir(resourceDirectory), ["user.interface.ts"]);
    });
  });

  it("rejects a resource path that is not a directory", async () => {
    await withTempRoot(async (projectRoot) => {
      const modulesDirectory = join(projectRoot, "src", "modules");
      await mkdir(modulesDirectory, { recursive: true });
      const resourcePath = join(modulesDirectory, "user");
      await writeFile(resourcePath, "not a directory\n", "utf8");

      const result = await generateResource({
        projectRoot,
        resource: "user",
      });

      equal(result.ok, false);
      if (!result.ok) {
        match(result.message, /not a directory/i);
      }

      equal(await readFile(resourcePath, "utf8"), "not a directory\n");
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

  it("preserves an existing resource directory when a write fails", async () => {
    await withTempRoot(async (projectRoot) => {
      const resourceDirectory = join(projectRoot, "src", "modules", "user");
      await mkdir(resourceDirectory, { recursive: true });
      await writeFile(
        join(resourceDirectory, "notes.txt"),
        "existing notes\n",
        "utf8",
      );
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

      deepEqual(await readdir(resourceDirectory), ["notes.txt"]);
      equal(
        await readFile(join(resourceDirectory, "notes.txt"), "utf8"),
        "existing notes\n",
      );
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
