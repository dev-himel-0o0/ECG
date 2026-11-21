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
  const objectName = `${toCamelCase(entity)}Controller`;

  return `import type { Request, Response } from "express";

const create${entity} = async (req: Request, res: Response) => {};

const get${collection} = async (req: Request, res: Response) => {};

const get${entity}ById = async (req: Request, res: Response) => {};

const update${entity} = async (req: Request, res: Response) => {};

const delete${entity} = async (req: Request, res: Response) => {};

export const ${objectName} = {
  create${entity},
  get${collection},
  get${entity}ById,
  update${entity},
  delete${entity},
};
`;
}

function renderService(resource: ResourceName): string {
  const entity = resource.functionPrefix;
  const collection = toPluralPascalCase(entity);
  const interfaceName = `I${resource.pascalCase}`;
  const objectName = `${toCamelCase(entity)}Service`;

  return `import type { ${interfaceName} } from "./${resource.filenamePrefix}.interface.js";

const create${entity} = async (payload: ${interfaceName}) => {};

const get${collection} = async () => {};

const get${entity}ById = async (id: string) => {};

const update${entity} = async (id: string, payload: ${interfaceName}) => {};

const delete${entity} = async (id: string) => {};

export const ${objectName} = {
  create${entity},
  get${collection},
  get${entity}ById,
  update${entity},
  delete${entity},
};
`;
}

function renderRepository(resource: ResourceName): string {
  const interfaceName = `I${resource.pascalCase}`;
  const objectName = `${toCamelCase(resource.functionPrefix)}Repository`;

  return `import type { ${interfaceName} } from "./${resource.filenamePrefix}.interface.js";

const create = async (payload: ${interfaceName}) => {};

const findAll = async () => {};

const findById = async (id: string) => {};

const update = async (id: string, payload: ${interfaceName}) => {};

const deleteById = async (id: string) => {};

export const ${objectName} = {
  create,
  findAll,
  findById,
  update,
  deleteById,
};
`;
}

function renderRoute(resource: ResourceName): string {
  const entity = resource.functionPrefix;
  const collection = toPluralPascalCase(entity);
  const routerName = `${toCamelCase(entity)}Router`;
  const controllerName = `${toCamelCase(entity)}Controller`;

  return `import type { Router } from "express";
import express from "express";
import { ${controllerName} } from "./${resource.filenamePrefix}.controller.js";

export const ${routerName}: Router = express.Router();

${routerName}.post("/", ${controllerName}.create${entity});
${routerName}.get("/", ${controllerName}.get${collection});
${routerName}.get("/:id", ${controllerName}.get${entity}ById);
${routerName}.patch("/:id", ${controllerName}.update${entity});
${routerName}.delete("/:id", ${controllerName}.delete${entity});
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
