import { describe, it } from "node:test";
import { deepEqual, equal, match } from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
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

describe("dev-xcg CLI", () => {
  it("generates a module relative to the current working directory", async () => {
    await withTempRoot(async (projectRoot) => {
      const result = runCli(projectRoot, ["user"]);

      equal(result.status, 0);
      match(result.stdout, /Resource name: user/);
      match(result.stdout, /Created src\/modules\/user\//);
      match(result.stdout, /Creating user module/);
      match(result.stdout, /Created user\.route\.ts/);
      match(result.stdout, /Created user\.interface\.ts/);
      match(result.stdout, /Created user\.controller\.ts/);
      match(result.stdout, /Created user\.service\.ts/);
      match(result.stdout, /Created user\.repository\.ts/);
      match(result.stdout, /✨ user module generated successfully!/);

      for (const filename of expectedFiles) {
        match(result.stdout, new RegExp(filename.replaceAll(".", "\\.")));
      }

      const resourceDirectory = join(projectRoot, "src", "modules", "user");
      deepEqual((await readdir(resourceDirectory)).sort(), expectedFiles);
    });
  });

  it("generates into an existing empty module directory", async () => {
    await withTempRoot(async (projectRoot) => {
      const resourceDirectory = join(projectRoot, "src", "modules", "user");
      await mkdir(resourceDirectory, { recursive: true });

      const result = runCli(projectRoot, ["user"]);

      equal(result.status, 0);
      match(result.stdout, /Using src\/modules\/user\//);
      match(result.stdout, /✨ user module generated successfully!/);
      deepEqual((await readdir(resourceDirectory)).sort(), expectedFiles);
    });
  });

  it("creates missing files without overwriting existing generated files", async () => {
    await withTempRoot(async (projectRoot) => {
      const first = runCli(projectRoot, ["user"]);
      equal(first.status, 0);

      const resourceDirectory = join(projectRoot, "src", "modules", "user");
      const interfacePath = join(resourceDirectory, "user.interface.ts");
      await writeFile(interfacePath, "existing interface\n", "utf8");
      await rm(join(resourceDirectory, "user.service.ts"));

      const second = runCli(projectRoot, ["user"]);
      equal(second.status, 0);
      match(second.stdout, /Using src\/modules\/user\//);
      match(second.stdout, /Created user\.service\.ts/);
      match(second.stdout, /Kept existing user\.interface\.ts/);
      match(second.stdout, /✨ user module generated successfully!/);

      equal(await readFile(interfacePath, "utf8"), "existing interface\n");
      deepEqual((await readdir(resourceDirectory)).sort(), expectedFiles);
    });
  });

  it("leaves a complete module unchanged", async () => {
    await withTempRoot(async (projectRoot) => {
      const first = runCli(projectRoot, ["user"]);
      equal(first.status, 0);

      const resourceDirectory = join(projectRoot, "src", "modules", "user");
      const interfacePath = join(resourceDirectory, "user.interface.ts");
      await writeFile(interfacePath, "existing interface\n", "utf8");

      const second = runCli(projectRoot, ["user"]);
      equal(second.status, 0);
      match(second.stdout, /Using src\/modules\/user\//);
      match(second.stdout, /Kept existing user\.interface\.ts/);
      match(second.stdout, /✨ user module is already complete!/);

      equal(await readFile(interfacePath, "utf8"), "existing interface\n");
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
