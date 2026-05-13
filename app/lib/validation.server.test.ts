import { describe, expect, it } from "vitest";

import {
  ValidationError,
  readBool,
  readEnum,
  readNullableInt,
  readSafeFormData,
  readString,
  readStringArray,
  toActionFailure,
} from "./validation.server";

function makeFormData(entries: Array<[string, string]>): FormData {
  const fd = new FormData();
  for (const [key, value] of entries) fd.append(key, value);
  return fd;
}

describe("readString", () => {
  it("returns trimmed value by default", () => {
    const fd = makeFormData([["name", "  hello  "]]);
    expect(readString(fd, "name")).toBe("hello");
  });

  it("respects trim: false", () => {
    const fd = makeFormData([["name", " hello "]]);
    expect(readString(fd, "name", { trim: false })).toBe(" hello ");
  });

  it("lowercases when asked", () => {
    const fd = makeFormData([["email", "Foo@Bar.COM"]]);
    expect(readString(fd, "email", { toLowerCase: true })).toBe("foo@bar.com");
  });

  it("throws when required field is empty", () => {
    const fd = makeFormData([]);
    expect(() => readString(fd, "name", { required: true })).toThrowError(
      ValidationError,
    );
  });

  it("throws when value below min length", () => {
    const fd = makeFormData([["name", "ab"]]);
    expect(() => readString(fd, "name", { min: 3 })).toThrowError(
      ValidationError,
    );
  });

  it("does not throw on min when value is empty (non-required)", () => {
    const fd = makeFormData([]);
    expect(readString(fd, "name", { min: 3 })).toBe("");
  });

  it("truncates to max", () => {
    const fd = makeFormData([["name", "abcdef"]]);
    expect(readString(fd, "name", { max: 3 })).toBe("abc");
  });
});

describe("readEnum", () => {
  const allowed = ["approved", "review", "hold"] as const;

  it("returns valid enum value", () => {
    const fd = makeFormData([["decision", "approved"]]);
    expect(readEnum(fd, "decision", allowed)).toBe("approved");
  });

  it("returns default when not in allowed list", () => {
    const fd = makeFormData([["decision", "weird"]]);
    expect(readEnum(fd, "decision", allowed, { default: "review" })).toBe(
      "review",
    );
  });

  it("returns null when missing and not required", () => {
    const fd = makeFormData([]);
    expect(readEnum(fd, "decision", allowed)).toBeNull();
  });

  it("throws when required and value invalid", () => {
    const fd = makeFormData([["decision", "weird"]]);
    expect(() =>
      readEnum(fd, "decision", allowed, { required: true }),
    ).toThrowError(ValidationError);
  });
});

describe("readNullableInt", () => {
  it("returns null when empty", () => {
    const fd = makeFormData([["count", ""]]);
    expect(readNullableInt(fd, "count")).toBeNull();
  });

  it("returns null when key is missing", () => {
    const fd = makeFormData([]);
    expect(readNullableInt(fd, "count")).toBeNull();
  });

  it("rounds floats", () => {
    const fd = makeFormData([["count", "2.7"]]);
    expect(readNullableInt(fd, "count")).toBe(3);
  });

  it("clamps to min and max", () => {
    const fd = makeFormData([["count", "1000"]]);
    expect(readNullableInt(fd, "count", { min: 0, max: 50 })).toBe(50);
  });

  it("throws on non-numeric", () => {
    const fd = makeFormData([["count", "abc"]]);
    expect(() => readNullableInt(fd, "count")).toThrowError(ValidationError);
  });
});

describe("readBool", () => {
  it("recognizes truthy strings", () => {
    expect(readBool(makeFormData([["flag", "true"]]), "flag")).toBe(true);
    expect(readBool(makeFormData([["flag", "1"]]), "flag")).toBe(true);
    expect(readBool(makeFormData([["flag", "on"]]), "flag")).toBe(true);
    expect(readBool(makeFormData([["flag", "TRUE"]]), "flag")).toBe(true);
  });

  it("falsy strings or missing return default", () => {
    expect(readBool(makeFormData([["flag", "false"]]), "flag")).toBe(false);
    expect(readBool(makeFormData([]), "flag")).toBe(false);
    expect(readBool(makeFormData([]), "flag", { default: true })).toBe(true);
  });
});

describe("readStringArray", () => {
  it("returns trimmed non-empty values", () => {
    const fd = makeFormData([
      ["tag", "alpha"],
      ["tag", " "],
      ["tag", "beta  "],
    ]);
    expect(readStringArray(fd, "tag")).toEqual(["alpha", "beta"]);
  });

  it("respects max count", () => {
    const fd = makeFormData([
      ["tag", "a"],
      ["tag", "b"],
      ["tag", "c"],
    ]);
    expect(readStringArray(fd, "tag", { max: 2 })).toEqual(["a", "b"]);
  });

  it("filters items longer than itemMax", () => {
    const fd = makeFormData([
      ["tag", "ok"],
      ["tag", "way too long"],
    ]);
    expect(readStringArray(fd, "tag", { itemMax: 3 })).toEqual(["ok"]);
  });
});

describe("toActionFailure", () => {
  it("preserves message and fieldErrors from ValidationError", () => {
    const err = new ValidationError("nope", { field: "Required" });
    const fail = toActionFailure(err);
    expect(fail).toEqual({
      ok: false,
      error: "nope",
      fieldErrors: { field: "Required" },
    });
  });

  it("uses plain Error message", () => {
    expect(toActionFailure(new Error("boom"))).toEqual({
      ok: false,
      error: "boom",
      fieldErrors: undefined,
    });
  });

  it("falls back to generic message for unknown errors", () => {
    expect(toActionFailure("string")).toEqual({
      ok: false,
      error: "Unexpected server error.",
      fieldErrors: undefined,
    });
  });
});

describe("readSafeFormData", () => {
  it("returns parsed FormData when within limits", async () => {
    const body = new URLSearchParams({ name: "x" }).toString();
    const request = new Request("http://localhost/x", {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    const fd = await readSafeFormData(request);
    expect(fd.get("name")).toBe("x");
  });

  it("throws when content-length exceeds cap", async () => {
    const body = "x";
    const request = new Request("http://localhost/x", {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": String(2_000_000),
      },
    });
    await expect(readSafeFormData(request)).rejects.toBeInstanceOf(
      ValidationError,
    );
  });
});
