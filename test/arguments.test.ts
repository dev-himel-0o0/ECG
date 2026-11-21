import { describe, it } from "node:test";
import { deepEqual, equal, match } from "node:assert/strict";

import { parseArguments } from "../src/arguments.js";

describe("parseArguments", () => {
  it("accepts exactly one lowercase resource name", () => {
    deepEqual(parseArguments(["user"]), {
      kind: "resource",
      resource: "user",
    });
  });

  it("accepts exactly one kebab-case resource name", () => {
    deepEqual(parseArguments(["blog-post"]), {
      kind: "resource",
      resource: "blog-post",
    });
  });

  it("rejects a missing resource name", () => {
    const result = parseArguments([]);

    equal(result.kind, "error");
    if (result.kind === "error") {
      match(result.message, /missing resource name/i);
    }
  });

  it("rejects additional arguments", () => {
    const result = parseArguments(["user", "extra"]);

    equal(result.kind, "error");
    if (result.kind === "error") {
      match(result.message, /exactly one resource name/i);
      match(result.message, /received 2/i);
    }
  });

  it("does not treat help combined with a resource as help", () => {
    const result = parseArguments(["user", "--help"]);

    equal(result.kind, "error");
  });

  it("recognizes help when it is the only argument", () => {
    deepEqual(parseArguments(["--help"]), { kind: "help" });
    deepEqual(parseArguments(["-h"]), { kind: "help" });
  });

  it("leaves resource-name validation to the naming utility", () => {
    deepEqual(parseArguments(["User"]), {
      kind: "resource",
      resource: "User",
    });
  });
});
