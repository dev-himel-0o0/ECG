import { describe, it } from "node:test";
import { equal } from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

interface PackageManifest {
  name: string;
  version: string;
}

interface PackageLock {
  name: string;
  version: string;
  packages: Record<string, { name?: string; version?: string } | undefined>;
}

async function readJson<T>(filename: string): Promise<T> {
  const contents = await readFile(join(process.cwd(), filename), "utf8");

  return JSON.parse(contents) as T;
}

describe("package version consistency", () => {
  it("keeps package-lock.json in sync with package.json", async () => {
    const manifest = await readJson<PackageManifest>("package.json");
    const lockfile = await readJson<PackageLock>("package-lock.json");
    const rootPackage = lockfile.packages[""];

    equal(lockfile.name, manifest.name);
    equal(lockfile.version, manifest.version);
    equal(rootPackage?.name, manifest.name);
    equal(rootPackage?.version, manifest.version);
  });
});
