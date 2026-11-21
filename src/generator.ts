import { lstat, mkdir, open, rm, rmdir, stat } from "node:fs/promises";
import type { Stats } from "node:fs";
import { join, resolve } from "node:path";

import { parseResourceName } from "./naming.js";
import type { ResourceName } from "./naming.js";
import { renderResourceTemplates } from "./templates.js";

export type ExclusiveFileWriter = (
  filePath: string,
  content: string,
) => Promise<void>;

export interface GenerateResourceOptions {
  readonly projectRoot: string;
  readonly resource: string;
  readonly fileWriter?: ExclusiveFileWriter;
}

export type GenerationResult =
  | {
      readonly ok: true;
      readonly outputDirectory: string;
      readonly files: readonly string[];
    }
  | {
      readonly ok: false;
      readonly message: string;
    };

interface GenerationPaths {
  readonly srcDirectory: string;
  readonly moduleDirectory: string;
  readonly resourceDirectory: string;
  readonly files: readonly string[];
}

function hasErrorCode(error: unknown, expectedCode: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === expectedCode
  );
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

async function statIfExists(path: string): Promise<Stats | undefined> {
  try {
    return await stat(path);
  } catch (error) {
    if (hasErrorCode(error, "ENOENT")) {
      return undefined;
    }

    throw error;
  }
}

async function lstatIfExists(path: string): Promise<Stats | undefined> {
  try {
    return await lstat(path);
  } catch (error) {
    if (hasErrorCode(error, "ENOENT")) {
      return undefined;
    }

    throw error;
  }
}

async function writeExclusiveFile(
  filePath: string,
  content: string,
): Promise<void> {
  const handle = await open(filePath, "wx");

  try {
    await handle.writeFile(content, "utf8");
    await handle.close();
  } catch (error) {
    await handle.close().catch(() => undefined);
    await rm(filePath, { force: true }).catch(() => undefined);
    throw error;
  }
}

async function createDirectory(directory: string): Promise<boolean> {
  try {
    await mkdir(directory);
    return true;
  } catch (error) {
    if (hasErrorCode(error, "EEXIST")) {
      const directoryStats = await stat(directory);

      if (directoryStats.isDirectory()) {
        return false;
      }

      throw new Error(`${directory} exists and is not a directory.`);
    }

    throw error;
  }
}

async function preflight(paths: GenerationPaths): Promise<string | undefined> {
  const srcStats = await statIfExists(paths.srcDirectory);

  if (srcStats !== undefined && !srcStats.isDirectory()) {
    return `${paths.srcDirectory} exists and is not a directory.`;
  }

  const moduleStats = await statIfExists(paths.moduleDirectory);

  if (moduleStats !== undefined && !moduleStats.isDirectory()) {
    return `${paths.moduleDirectory} exists and is not a directory.`;
  }

  if ((await lstatIfExists(paths.resourceDirectory)) !== undefined) {
    return `Resource directory already exists: ${paths.resourceDirectory}. Refusing to overwrite.`;
  }

  for (const filePath of paths.files) {
    if ((await lstatIfExists(filePath)) !== undefined) {
      return `Refusing to overwrite existing file: ${filePath}`;
    }
  }

  return undefined;
}

async function cleanup(
  files: readonly string[],
  directories: readonly string[],
): Promise<void> {
  for (const filePath of [...files].reverse()) {
    try {
      await rm(filePath, { force: true });
    } catch {
      continue;
    }
  }

  for (const directory of [...directories].reverse()) {
    try {
      await rmdir(directory);
    } catch {
      continue;
    }
  }
}

export async function generateResource(
  options: GenerateResourceOptions,
): Promise<GenerationResult> {
  const parsedResource = parseResourceName(options.resource);

  if (!parsedResource.ok) {
    return { ok: false, message: parsedResource.message };
  }

  const resource: ResourceName = parsedResource.value;
  const projectRoot = resolve(options.projectRoot);
  const templates = renderResourceTemplates(resource);
  const resourceDirectory = join(
    projectRoot,
    "src",
    "module",
    resource.directory,
  );
  const paths: GenerationPaths = {
    srcDirectory: join(projectRoot, "src"),
    moduleDirectory: join(projectRoot, "src", "module"),
    resourceDirectory,
    files: templates.map((template) =>
      join(resourceDirectory, template.filename),
    ),
  };
  const createdDirectories: string[] = [];
  const createdFiles: string[] = [];
  const writeFileExclusive = options.fileWriter ?? writeExclusiveFile;

  try {
    const conflict = await preflight(paths);

    if (conflict !== undefined) {
      return { ok: false, message: conflict };
    }

    if (await createDirectory(paths.srcDirectory)) {
      createdDirectories.push(paths.srcDirectory);
    }

    if (await createDirectory(paths.moduleDirectory)) {
      createdDirectories.push(paths.moduleDirectory);
    }

    if (!(await createDirectory(paths.resourceDirectory))) {
      throw new Error(
        `Resource directory already exists: ${paths.resourceDirectory}. Refusing to overwrite.`,
      );
    }

    createdDirectories.push(paths.resourceDirectory);

    for (const template of templates) {
      const filePath = join(paths.resourceDirectory, template.filename);

      try {
        await writeFileExclusive(filePath, template.content);
      } catch (error) {
        if (hasErrorCode(error, "EEXIST")) {
          throw new Error(`Refusing to overwrite existing file: ${filePath}`);
        }

        throw error;
      }

      createdFiles.push(filePath);
    }

    return {
      ok: true,
      outputDirectory: paths.resourceDirectory,
      files: templates.map((template) => template.filename),
    };
  } catch (error) {
    await cleanup(createdFiles, createdDirectories);
    return {
      ok: false,
      message: `Failed to generate module: ${errorMessage(error)}`,
    };
  }
}
