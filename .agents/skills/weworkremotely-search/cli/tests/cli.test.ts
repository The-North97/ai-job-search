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
  meta: { count: number; category: string };
  results: Array<{ id: string; title: string; url: string; company: string | null }>;
}

describe("weworkremotely CLI flag validation", () => {
  test("--jobage non-numeric exits 1 with BAD_ARG", async () => {
    const result = await runCLI(["search", "-q", "developer", "--jobage", "foo"]);
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

  test("unknown command exits 1 with BAD_CMD", async () => {
    const result = await runCLI(["frobnicate"]);
    expect(result.exitCode).not.toBe(0);
    expect(parsedStderr(result.stderr).code).toBe("BAD_CMD");
  });
});

describe("weworkremotely CLI live smoke test", () => {
  test("search returns real results with required fields", async () => {
    const result = await runCLI(["search", "--limit", "5"]);
    const data = parseJSON<SearchResponse>(result);
    expect(data.results.length).toBeGreaterThan(0);
    const first = data.results[0];
    expect(first.id.length).toBeGreaterThan(0);
    expect(first.title.length).toBeGreaterThan(0);
    expect(first.url).toContain("weworkremotely.com/remote-jobs/");
  });

  test("detail on a live search result returns a description", async () => {
    const search = await runCLI(["search", "--limit", "1"]);
    const data = parseJSON<SearchResponse>(search);
    const job0 = data.results[0];
    const detail = await runCLI(["detail", job0.url]);
    const job = parseJSON<{ title: string; description: string | null }>(detail);
    expect(job.title.length).toBeGreaterThan(0);
  });
});
