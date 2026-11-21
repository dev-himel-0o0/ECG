#!/usr/bin/env node

import { parseArguments } from "./arguments.js";
import { generateResource } from "./generator.js";

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

  const result = await generateResource({
    projectRoot: process.cwd(),
    resource: parsed.resource,
  });

  if (!result.ok) {
    fail(result.message, false);
    return;
  }

  console.log(
    `Generated module "${parsed.resource}" at ${result.outputDirectory}:`,
  );

  for (const file of result.files) {
    console.log(`  ${file}`);
  }
}

try {
  await main(process.argv.slice(2));
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to generate module: ${message}`);
  process.exitCode = 1;
}
