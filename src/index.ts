#!/usr/bin/env node

import { parseArguments } from "./arguments.js";
import { parseResourceName } from "./naming.js";

const usage = `ECG - Express CRUD Generator

Usage:
  ecg <resource>

Resource names:
  Lowercase letters, numbers, and single hyphens
  Examples: user, blog-post`;

function fail(message: string): void {
  console.error(message);
  console.error();
  console.error(usage);
  process.exitCode = 1;
}

function main(argv: readonly string[]): void {
  const parsed = parseArguments(argv);

  if (parsed.kind === "help") {
    console.log(usage);
    return;
  }

  if (parsed.kind === "error") {
    fail(parsed.message);
    return;
  }

  const named = parseResourceName(parsed.resource);

  if (!named.ok) {
    fail(named.message);
    return;
  }

  const resource = named.value;

  console.log(`Resource: ${resource.slug}`);
  console.log(`Directory: ${resource.directory}`);
  console.log(`Filename prefix: ${resource.filenamePrefix}`);
  console.log(`PascalCase: ${resource.pascalCase}`);
  console.log(`Function prefix: ${resource.functionPrefix}`);
  console.log();
  console.log("File generation is not implemented yet.");
}

main(process.argv.slice(2));
