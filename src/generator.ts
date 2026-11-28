import { lstat, mkdir, open, rm, rmdir, stat } from "node:fs/promises";
import type { Stats } from "node:fs";
import { basename, join, resolve } from "node:path";

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
  readonly onFileStart?: (filename: string) => void;
}

export type GenerationResult =
  | {
      readonly ok: true;
      readonly outputDirectory: string;
      readonly directoryCreated: boolean;
      readonly createdFiles: readonly string[];
      readonly skippedFiles: readonly string[];
    }
  | {
      readonly ok: false;
      readonly message: string;
    };

interface GenerationPaths {
  readonly srcDirectory: string;
  readonly modulesDirectory: string;
  readonly resourceDirectory: string;
  readonly files: readonly string[];
}

type PreflightResult =
  | {
      readonly ok: true;
      readonly skippedFiles: readonly string[];
    }
  | {
      readonly ok: false;
      readonly message: string;
    };

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

async function preflight(paths: GenerationPaths): Promise<PreflightResult> {
  const srcStats = await statIfExists(paths.srcDirectory);

  if (srcStats !== undefined && !srcStats.isDirectory()) {
    return {
      ok: false,
      message: `${paths.srcDirectory} exists and is not a directory.`,
    };
  }

  const modulesStats = await statIfExists(paths.modulesDirectory);

  if (modulesStats !== undefined && !modulesStats.isDirectory()) {
    return {
      ok: false,
      message: `${paths.modulesDirectory} exists and is not a directory.`,
    };
  }

  const resourceStats = await lstatIfExists(paths.resourceDirectory);

  if (resourceStats !== undefined && !resourceStats.isDirectory()) {
    return {
      ok: false,
      message: `${paths.resourceDirectory} exists and is not a directory.`,
    };
  }

  const skippedFiles: string[] = [];

  for (const filePath of paths.files) {
    const fileStats = await lstatIfExists(filePath);

    if (fileStats === undefined) {
      continue;
    }

    if (!fileStats.isFile()) {
      return {
        ok: false,
        message: `Refusing to overwrite existing path: ${filePath}`,
      };
    }

    skippedFiles.push(filePath);
  }

  return { ok: true, skippedFiles };
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
    "modules",
    resource.directory,
  );
  const paths: GenerationPaths = {
    srcDirectory: join(projectRoot, "src"),
    modulesDirectory: join(projectRoot, "src", "modules"),
    resourceDirectory,
    files: templates.map((template) =>
      join(resourceDirectory, template.filename),
    ),
  };
  const createdDirectories: string[] = [];
  const createdFiles: string[] = [];
  const createdFilenames: string[] = [];
  let directoryCreated = false;
  const writeFileExclusive = options.fileWriter ?? writeExclusiveFile;

  try {
    const preflightResult = await preflight(paths);

    if (!preflightResult.ok) {
      return { ok: false, message: preflightResult.message };
    }

    const skippedFilePaths = new Set(preflightResult.skippedFiles);
    const skippedFilenames = preflightResult.skippedFiles.map((filePath) =>
      basename(filePath),
    );

    if (await createDirectory(paths.srcDirectory)) {
      createdDirectories.push(paths.srcDirectory);
    }

    if (await createDirectory(paths.modulesDirectory)) {
      createdDirectories.push(paths.modulesDirectory);
    }

    if (await createDirectory(paths.resourceDirectory)) {
      createdDirectories.push(paths.resourceDirectory);
      directoryCreated = true;
    }

    for (const template of templates) {
      const filePath = join(paths.resourceDirectory, template.filename);

      if (skippedFilePaths.has(filePath)) {
        continue;
      }

      options.onFileStart?.(template.filename);

      try {
        await writeFileExclusive(filePath, template.content);
      } catch (error) {
        if (hasErrorCode(error, "EEXIST")) {
          skippedFilePaths.add(filePath);
          skippedFilenames.push(template.filename);
          continue;
        }

        throw error;
      }

      createdFiles.push(filePath);
      createdFilenames.push(template.filename);
    }

    return {
      ok: true,
      outputDirectory: paths.resourceDirectory,
      directoryCreated,
      createdFiles: createdFilenames,
      skippedFiles: skippedFilenames,
    };
  } catch (error) {
    await cleanup(createdFiles, createdDirectories);
    return {
      ok: false,
      message: `Failed to generate module: ${errorMessage(error)}`,
    };
  }
}
