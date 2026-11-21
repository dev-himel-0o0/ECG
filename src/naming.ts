export interface ResourceName {
  readonly slug: string;
  readonly directory: string;
  readonly filenamePrefix: string;
  readonly pascalCase: string;
  readonly functionPrefix: string;
}

export type ResourceNameResult =
  | { readonly ok: true; readonly value: ResourceName }
  | { readonly ok: false; readonly message: string };

const RESOURCE_NAME_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z][a-z0-9]*)*$/;

function invalidResourceNameMessage(input: string): string {
  if (input.length === 0) {
    return "Resource name must not be empty.";
  }

  if (input.includes("/") || input.includes("\\") || input.includes("..")) {
    return `Resource name "${input}" must not contain path separators or traversal sequences.`;
  }

  if (input !== input.toLowerCase()) {
    return `Resource name "${input}" must be lowercase.`;
  }

  if (/\s/.test(input)) {
    return `Resource name "${input}" must not contain spaces.`;
  }

  return `Invalid resource name "${input}". Use lowercase letters, numbers, and single hyphens (for example "user" or "blog-post").`;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function toCamelCase(value: string): string {
  return value.charAt(0).toLowerCase() + value.slice(1);
}

export function toPluralPascalCase(value: string): string {
  if (/[^aeiou]y$/i.test(value)) {
    return `${value.slice(0, -1)}ies`;
  }

  if (/(?:s|x|z|ch|sh)$/i.test(value)) {
    return `${value}es`;
  }

  return `${value}s`;
}

export function parseResourceName(input: string): ResourceNameResult {
  if (!RESOURCE_NAME_PATTERN.test(input)) {
    return { ok: false, message: invalidResourceNameMessage(input) };
  }

  const pascalCase = input.split("-").map(capitalize).join("");

  return {
    ok: true,
    value: {
      slug: input,
      directory: input,
      filenamePrefix: input,
      pascalCase,
      functionPrefix: pascalCase,
    },
  };
}
