import { describe, it } from "node:test";
import { deepEqual, equal, match } from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { join } from "node:path";

const cliPath = join(process.cwd(), "dist-test", "src", "index.js");

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
    join(process.cwd(), "dist-test", ".cli-"),
  );

  try {
    await run(projectRoot);
  } finally {
    await rm(projectRoot, { recursive: true, force: true });
  }
}

function runCli(projectRoot: string, args: readonly string[]) {
  const result = spawnSync(process.execPath, [cliPath, ...args], {
    cwd: projectRoot,
    encoding: "utf8",
  });

  if (result.error !== undefined) {
    throw result.error;
  }

  return result;
}

describe("xcg CLI", () => {
  it("generates a module relative to the current working directory", async () => {
    await withTempRoot(async (projectRoot) => {
      const result = runCli(projectRoot, ["user"]);

      equal(result.status, 0);
      match(result.stdout, /Generated module "user"/);

      for (const filename of expectedFiles) {
        match(result.stdout, new RegExp(filename.replaceAll(".", "\\.")));
      }

      const resourceDirectory = join(projectRoot, "src", "module", "user");
      deepEqual((await readdir(resourceDirectory)).sort(), expectedFiles);
    });
  });

  it("exits non-zero and preserves files when the module already exists", async () => {
    await withTempRoot(async (projectRoot) => {
      const first = runCli(projectRoot, ["user"]);
      equal(first.status, 0);

      const second = runCli(projectRoot, ["user"]);
      equal(second.status, 1);
      match(second.stderr, /resource directory already exists/i);

      const resourceDirectory = join(projectRoot, "src", "module", "user");
      deepEqual((await readdir(resourceDirectory)).sort(), expectedFiles);
    });
  });

  it("exits non-zero for an invalid resource name", async () => {
    await withTempRoot(async (projectRoot) => {
      const result = runCli(projectRoot, ["User"]);

      equal(result.status, 1);
      match(result.stderr, /must be lowercase/i);
      deepEqual(await readdir(projectRoot), []);
    });
  });
});
