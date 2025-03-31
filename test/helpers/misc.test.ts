import { describe, it, expect, vi } from "vitest";
import {
  flattenObject,
  getCurrentDateInfo,
} from "../../src-lambda/helpers/misc";

describe("flattenObject", () => {
  it("flattens a nested object into dot notation keys", () => {
    const nested = { hey: { there: "world", people: [1, 2, { dave: true }] } };
    const expected = {
      "hey.there": "world",
      "hey.people": [1, 2, { dave: true }],
    };

    const result = flattenObject(nested);
    expect(result).toEqual(expected);
  });

  it("returns an empty object when given an empty object", () => {
    expect(flattenObject({})).toEqual({});
  });

  it("flattens objects with multiple levels of nesting", () => {
    const input = {
      a: {
        b: { c: 123, d: "test" },
        e: null,
      },
      f: undefined,
    };

    const expected = {
      "a.b.c": 123,
      "a.b.d": "test",
      "a.e": null,
      f: undefined,
    };

    expect(flattenObject(input)).toEqual(expected);
  });

  it("preserves arrays intact", () => {
    const input = {
      arr: [{ nested: 1 }, { nested: 2 }],
    };

    const expected = {
      arr: [{ nested: 1 }, { nested: 2 }],
    };

    expect(flattenObject(input)).toEqual(expected);
  });
});

describe("getCurrentDateInfo", () => {
  it("returns a DateTimeInfo object with expected structure and values", () => {
    // Freeze time to a fixed date for predictable tests.
    const fixedDate = new Date("2025-03-28T17:06:22.458Z");
    vi.useFakeTimers();
    vi.setSystemTime(fixedDate);

    const info = getCurrentDateInfo();

    // The iso_string and unix_timestamp should directly match our fixed date.
    expect(info.iso_string).toBe(fixedDate.toISOString());
    expect(info.unix_timestamp).toBe(Math.floor(fixedDate.getTime() / 1000));

    // Check that the object contains all required keys with proper types.
    expect(typeof info.year).toBe("number");
    expect(typeof info.month).toBe("number");
    expect(typeof info.day).toBe("number");
    expect(typeof info.hour).toBe("number");
    expect(typeof info.minute).toBe("number");
    expect(typeof info.second).toBe("number");
    expect(typeof info.millisecond).toBe("number");
    expect(typeof info.day_of_week).toBe("string");
    expect(typeof info.day_of_week_short).toBe("string");
    expect(typeof info.day_of_year).toBe("number");
    expect(typeof info.week_of_year).toBe("number");
    expect(typeof info.month_name).toBe("string");
    expect(typeof info.month_name_short).toBe("string");
    expect(typeof info.quarter).toBe("number");
    expect(typeof info.is_leap_year).toBe("boolean");
    expect(typeof info.timezone).toBe("string");
    expect(typeof info.timezone_name).toBe("string");
    expect(typeof info.timezone_offset).toBe("number");
    expect(typeof info.is_dst).toBe("boolean");

    // Clean up fake timers
    vi.useRealTimers();
  });
});
