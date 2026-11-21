export interface ResourceArguments {
  readonly kind: "resource";
  readonly resource: string;
}

export interface HelpArguments {
  readonly kind: "help";
}

export interface ArgumentError {
  readonly kind: "error";
  readonly message: string;
}

export type ParsedArguments = ResourceArguments | HelpArguments | ArgumentError;

export function parseArguments(argv: readonly string[]): ParsedArguments {
  const [resource, ...additional] = argv;

  if (resource === undefined) {
    return {
      kind: "error",
      message: "Missing resource name. Usage: ecg <resource>",
    };
  }

  if (additional.length > 0) {
    return {
      kind: "error",
      message: `Expected exactly one resource name, but received ${argv.length}: ${argv.join(" ")}`,
    };
  }

  if (resource === "--help" || resource === "-h") {
    return { kind: "help" };
  }

  return { kind: "resource", resource };
}
