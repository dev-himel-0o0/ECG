import { describe, it } from "node:test";
import { deepEqual, equal, match } from "node:assert/strict";

import {
  parseResourceName,
  toCamelCase,
  toPluralPascalCase,
} from "../src/naming.js";

describe("parseResourceName", () => {
  it("converts a lowercase identifier", () => {
    deepEqual(parseResourceName("user"), {
      ok: true,
      value: {
        slug: "user",
        directory: "user",
        filenamePrefix: "user",
        pascalCase: "User",
        functionPrefix: "User",
      },
    });
  });

  it("converts a lowercase kebab-case name", () => {
    deepEqual(parseResourceName("blog-post"), {
      ok: true,
      value: {
        slug: "blog-post",
        directory: "blog-post",
        filenamePrefix: "blog-post",
        pascalCase: "BlogPost",
        functionPrefix: "BlogPost",
      },
    });
  });

  it("keeps digits in place while converting to PascalCase", () => {
    const result = parseResourceName("post2-draft3");

    equal(result.ok, true);
    if (result.ok) {
      equal(result.value.pascalCase, "Post2Draft3");
      equal(result.value.functionPrefix, "Post2Draft3");
    }
  });

  const invalidNames = [
    "",
    "User",
    "USER",
    "user profile",
    "user\tprofile",
    "user_profile",
    "user.post",
    "user/profile",
    "user\\profile",
    "../user",
    "user/../admin",
    "-user",
    "user-",
    "user--post",
    "2user",
    "user-2fa",
  ];

  for (const name of invalidNames) {
    it(`rejects ${JSON.stringify(name)}`, () => {
      const result = parseResourceName(name);

      equal(result.ok, false);
      if (!result.ok) {
        match(result.message, /resource name/i);
      }
    });
  }

  it("explains why uppercase input is invalid", () => {
    const result = parseResourceName("User");

    equal(result.ok, false);
    if (!result.ok) {
      match(result.message, /lowercase/i);
    }
  });

  it("explains why path traversal input is invalid", () => {
    const result = parseResourceName("../user");

    equal(result.ok, false);
    if (!result.ok) {
      match(result.message, /path separators|traversal/i);
    }
  });
});

describe("toCamelCase", () => {
  it("lowercases the first character", () => {
    equal(toCamelCase("User"), "user");
    equal(toCamelCase("BlogPost"), "blogPost");
  });
});

describe("toPluralPascalCase", () => {
  it("pluralizes regular and kebab-derived names", () => {
    equal(toPluralPascalCase("User"), "Users");
    equal(toPluralPascalCase("BlogPost"), "BlogPosts");
  });

  it("handles common plural endings", () => {
    equal(toPluralPascalCase("Category"), "Categories");
    equal(toPluralPascalCase("Box"), "Boxes");
    equal(toPluralPascalCase("Status"), "Statuses");
  });
});
