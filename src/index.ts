#!/usr/bin/env node

import { parseArguments } from "./arguments.js";
import { generateResource } from "./generator.js";
import { relative, sep } from "node:path";

const usage = `xcg - Express CRUD Generator

Usage:
  xcg <resource>

Resource names:
  Lowercase letters, numbers, and single hyphens
  Examples: user, blog-post`;

function fail(message: string, includeUsage: boolean): void {
  console.error(message);

  if (includeUsage) {
    console.error();
    console.error(usage);
  }

  process.exitCode = 1;
}

async function main(argv: readonly string[]): Promise<void> {
  const parsed = parseArguments(argv);

  if (parsed.kind === "help") {
    console.log(usage);
    return;
  }

  if (parsed.kind === "error") {
    fail(parsed.message, true);
    return;
  }

  const projectRoot = process.cwd();
  const spinnerFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let spinnerFrame = 0;
  let spinnerTimer: ReturnType<typeof setInterval> | undefined;
  let spinnerLabel = `Creating ${parsed.resource} module`;

  const isInteractive = process.stdout.isTTY === true;

  const renderSpinner = (): void => {
    if (isInteractive) {
      process.stdout.write(
        `\r\x1b[2K${spinnerFrames[spinnerFrame]} ${spinnerLabel}`,
      );
      spinnerFrame = (spinnerFrame + 1) % spinnerFrames.length;
    }
  };

  const stopSpinner = (): void => {
    if (spinnerTimer !== undefined) {
      clearInterval(spinnerTimer);
      spinnerTimer = undefined;
    }

    if (isInteractive) {
      process.stdout.write("\r\x1b[2K\x1b[?25h");
    }
  };

  if (isInteractive) {
    process.stdout.write("\x1b[?25l");
    renderSpinner();
    spinnerTimer = setInterval(renderSpinner, 80);
  } else {
    console.log(`◌ ${spinnerLabel}`);
  }

  const result = await generateResource({
    projectRoot,
    resource: parsed.resource,
    onFileStart: (filename) => {
      spinnerLabel = `Creating ${filename}`;

      if (!isInteractive) {
        console.log(`◌ ${spinnerLabel}`);
      } else {
        renderSpinner();
      }
    },
  });

  stopSpinner();

  if (!result.ok) {
    fail(result.message, false);
    return;
  }

  const outputDirectory = relative(projectRoot, result.outputDirectory)
    .split(sep)
    .join("/");
  const filenamePrefix = parsed.resource;
  const orderedFiles = [
    `${filenamePrefix}.route.ts`,
    `${filenamePrefix}.interface.ts`,
    `${filenamePrefix}.controller.ts`,
    `${filenamePrefix}.service.ts`,
    `${filenamePrefix}.repository.ts`,
  ];

  console.log(`✔ Resource name: ${parsed.resource}`);
  console.log(`✔ Created ${outputDirectory}/`);

  for (const filename of orderedFiles) {
    console.log(`✔ Created ${filename}`);
  }

  console.log();
  console.log(`✨ ${parsed.resource} module generated successfully!`);
}

try {
  await main(process.argv.slice(2));
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to generate module: ${message}`);
  process.exitCode = 1;
}
