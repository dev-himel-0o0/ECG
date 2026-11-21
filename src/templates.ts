import { toCamelCase, toPluralPascalCase } from "./naming.js";
import type { ResourceName } from "./naming.js";

export interface TemplateFile {
  readonly filename: string;
  readonly content: string;
}

function renderInterface(resource: ResourceName): string {
  return `export interface I${resource.pascalCase} {}\n`;
}

function renderController(resource: ResourceName): string {
  const entity = resource.functionPrefix;
  const collection = toPluralPascalCase(entity);

  return `import type { RequestHandler } from "express";

export const create${entity}: RequestHandler = async (_req, _res) => {
  throw new Error("Not implemented");
};

export const get${collection}: RequestHandler = async (_req, _res) => {
  throw new Error("Not implemented");
};

export const get${entity}ById: RequestHandler = async (_req, _res) => {
  throw new Error("Not implemented");
};

export const update${entity}: RequestHandler = async (_req, _res) => {
  throw new Error("Not implemented");
};

export const delete${entity}: RequestHandler = async (_req, _res) => {
  throw new Error("Not implemented");
};
`;
}

function renderService(resource: ResourceName): string {
  const entity = resource.functionPrefix;
  const collection = toPluralPascalCase(entity);
  const interfaceName = `I${resource.pascalCase}`;

  return `import type { ${interfaceName} } from "./${resource.filenamePrefix}.interface.js";

export const create${entity} = async (payload: ${interfaceName}): Promise<${interfaceName}> => {
  throw new Error("Not implemented");
};

export const get${collection} = async (): Promise<${interfaceName}[]> => {
  throw new Error("Not implemented");
};

export const get${entity}ById = async (id: string): Promise<${interfaceName} | null> => {
  throw new Error("Not implemented");
};

export const update${entity} = async (id: string, payload: ${interfaceName}): Promise<${interfaceName} | null> => {
  throw new Error("Not implemented");
};

export const delete${entity} = async (id: string): Promise<void> => {
  throw new Error("Not implemented");
};
`;
}

function renderRepository(resource: ResourceName): string {
  const interfaceName = `I${resource.pascalCase}`;

  return `import type { ${interfaceName} } from "./${resource.filenamePrefix}.interface.js";

export const create = async (payload: ${interfaceName}): Promise<${interfaceName}> => {
  throw new Error("Not implemented");
};

export const findAll = async (): Promise<${interfaceName}[]> => {
  throw new Error("Not implemented");
};

export const findById = async (id: string): Promise<${interfaceName} | null> => {
  throw new Error("Not implemented");
};

export const update = async (id: string, payload: ${interfaceName}): Promise<${interfaceName} | null> => {
  throw new Error("Not implemented");
};

export const deleteById = async (id: string): Promise<void> => {
  throw new Error("Not implemented");
};
`;
}

function renderRoute(resource: ResourceName): string {
  const entity = resource.functionPrefix;
  const collection = toPluralPascalCase(entity);
  const routerName = `${toCamelCase(entity)}Router`;

  return `import { Router } from "express";

import {
  create${entity},
  delete${entity},
  get${entity}ById,
  get${collection},
  update${entity},
} from "./${resource.filenamePrefix}.controller.js";

export const ${routerName} = Router();

${routerName}.post("/", create${entity});
${routerName}.get("/", get${collection});
${routerName}.get("/:id", get${entity}ById);
${routerName}.patch("/:id", update${entity});
${routerName}.delete("/:id", delete${entity});
`;
}

export function renderResourceTemplates(
  resource: ResourceName,
): readonly TemplateFile[] {
  return [
    {
      filename: `${resource.filenamePrefix}.interface.ts`,
      content: renderInterface(resource),
    },
    {
      filename: `${resource.filenamePrefix}.controller.ts`,
      content: renderController(resource),
    },
    {
      filename: `${resource.filenamePrefix}.service.ts`,
      content: renderService(resource),
    },
    {
      filename: `${resource.filenamePrefix}.repository.ts`,
      content: renderRepository(resource),
    },
    {
      filename: `${resource.filenamePrefix}.route.ts`,
      content: renderRoute(resource),
    },
  ];
}
