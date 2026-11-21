import { test } from "node:test";
import { equal } from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { parseResourceName } from "../src/naming.js";
import { renderResourceTemplates } from "../src/templates.js";

test("generated templates type-check with Express in strict mode", async () => {
  const projectRoot = process.cwd();
  const fixtureRoot = await mkdtemp(
    join(projectRoot, "dist-test", ".typecheck-"),
  );

  try {
    for (const slug of ["user", "blog-post"]) {
      const parsed = parseResourceName(slug);

      if (!parsed.ok) {
        throw new Error(parsed.message);
      }

      const resourceDirectory = join(fixtureRoot, parsed.value.directory);
      await mkdir(resourceDirectory, { recursive: true });

      for (const file of renderResourceTemplates(parsed.value)) {
        await writeFile(
          join(resourceDirectory, file.filename),
          file.content,
          "utf8",
        );
      }
    }

    const tsconfigPath = join(fixtureRoot, "tsconfig.json");
    await writeFile(
      tsconfigPath,
      JSON.stringify(
        {
          compilerOptions: {
            target: "ES2022",
            module: "ESNext",
            moduleResolution: "Bundler",
            strict: true,
            noEmit: true,
            noUnusedLocals: true,
            verbatimModuleSyntax: true,
            skipLibCheck: true,
          },
          include: ["**/*.ts"],
        },
        null,
        2,
      ),
      "utf8",
    );

    const tscPath = join(
      projectRoot,
      "node_modules",
      "typescript",
      "bin",
      "tsc",
    );
    const result = spawnSync(
      process.execPath,
      [tscPath, "--project", tsconfigPath],
      {
        cwd: projectRoot,
        encoding: "utf8",
      },
    );

    if (result.error !== undefined) {
      throw result.error;
    }

    const output = [result.stdout, result.stderr]
      .filter((part) => part.length > 0)
      .join("\n");

    equal(result.status, 0, output);
  } finally {
    await rm(fixtureRoot, { recursive: true, force: true });
  }
});
