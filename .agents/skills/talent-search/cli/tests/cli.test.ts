import { describe, test, expect } from "bun:test";
import { runCLI, parseJSON } from "./helpers";

function parsedStderr(stderr: string): { error?: string; code?: string } {
  try {
    return JSON.parse(stderr);
  } catch {
    return {};
  }
}

interface SearchResponse {
  meta: { count: number; page: number };
  results: Array<{ id: string; title: string; url: string; date: string | null }>;
}

describe("talent CLI flag validation", () => {
  test("--jobage non-numeric exits 1 with BAD_ARG", async () => {
    const result = await runCLI(["search", "-q", "developer", "--jobage", "foo"]);
    expect(result.exitCode).not.toBe(0);
    expect(parsedStderr(result.stderr).code).toBe("BAD_ARG");
  });

  test("--page non-numeric exits 1 with BAD_ARG", async () => {
    const result = await runCLI(["search", "-q", "developer", "--page", "abc"]);
    expect(result.exitCode).not.toBe(0);
    expect(parsedStderr(result.stderr).code).toBe("BAD_ARG");
  });

  test("--limit non-numeric exits 1 with BAD_ARG", async () => {
    const result = await runCLI(["search", "-q", "developer", "--limit", "xyz"]);
    expect(result.exitCode).not.toBe(0);
    expect(parsedStderr(result.stderr).code).toBe("BAD_ARG");
  });

  test("detail without id exits 1 with NO_ID", async () => {
    const result = await runCLI(["detail"]);
    expect(result.exitCode).not.toBe(0);
    expect(parsedStderr(result.stderr).code).toBe("NO_ID");
  });

  test("detail with unparseable id exits 1 with BAD_ID", async () => {
    const result = await runCLI(["detail", "not-an-id"]);
    expect(result.exitCode).not.toBe(0);
    expect(parsedStderr(result.stderr).code).toBe("BAD_ID");
  });

  test("unknown command exits 1 with BAD_CMD", async () => {
    const result = await runCLI(["frobnicate"]);
    expect(result.exitCode).not.toBe(0);
    expect(parsedStderr(result.stderr).code).toBe("BAD_CMD");
  });
});

describe("talent CLI live smoke test", () => {
  test("search returns real results with required fields", async () => {
    const result = await runCLI([
      "search", "-q", "software developer", "-l", "Ontario", "--limit", "5",
    ]);
    const data = parseJSON<SearchResponse>(result);
    expect(data.results.length).toBeGreaterThan(0);
    const first = data.results[0];
    expect(first.id).toMatch(/^\d+$/);
    expect(first.title.length).toBeGreaterThan(0);
    expect(first.url).toContain("ca.talent.com/view?id=");
  });

  test("detail on a live search result returns something", async () => {
    const search = await runCLI([
      "search", "-q", "software developer", "-l", "Ontario", "--limit", "1",
    ]);
    const data = parseJSON<SearchResponse>(search);
    const id = data.results[0].id;
    const detail = await runCLI(["detail", id]);
    const job = parseJSON<{ id: string; title: string }>(detail);
    expect(job.id).toBe(id);
    expect(job.title.length).toBeGreaterThan(0);
  });
});
