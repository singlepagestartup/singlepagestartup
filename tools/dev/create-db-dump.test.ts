/**
 * BDD Suite: Nightly PostgreSQL dump
 * Given tools/deployer/server/create_db_dump.sh with a stub docker on PATH that
 *       stands in for the postgres_postgres container
 * When the nightly job runs against a backup directory
 * Then the dump is readable by its owner only in a directory only the owner
 *      can enter, a failed pg_dump replaces and deletes nothing, and dumps
 *      older than the retention are deleted after a successful dump
 */
import { afterAll, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

const repositoryRoot = process.cwd();
const script = path.join(
  repositoryRoot,
  "tools/deployer/server/create_db_dump.sh",
);
const scratch = mkdtempSync(path.join(os.tmpdir(), "sps-create-db-dump-"));
const stubBin = path.join(scratch, "bin");
const dayInMilliseconds = 24 * 60 * 60 * 1000;

/**
 * The stub answers the three docker calls the script makes: the container
 * lookup, the database name and the dump itself. STUB_CONTAINER_ID empty means
 * no container runs; STUB_PG_DUMP_EXIT makes the dump print part of its output
 * and then fail, as pg_dump does when the connection drops.
 */
const stubDocker = `#!/bin/bash
echo "$*" >> "$STUB_DOCKER_CALLS"
case "$1" in
  ps)
    if [ -n "\${STUB_CONTAINER_ID:-}" ]; then echo "$STUB_CONTAINER_ID"; fi
    ;;
  exec)
    if [ "$3" = "printenv" ]; then echo "sps"; exit 0; fi
    echo "--"
    echo "-- PostgreSQL database dump"
    if [ "\${STUB_PG_DUMP_EXIT:-0}" != "0" ]; then
      echo "pg_dump: error: connection to server lost" >&2
      exit "$STUB_PG_DUMP_EXIT"
    fi
    echo "COPY public.sps_rc_identity (id, email) FROM stdin;"
    ;;
  *)
    exit 1
    ;;
esac
`;

mkdirSync(stubBin);
writeFileSync(path.join(stubBin, "docker"), stubDocker, { mode: 0o755 });

afterAll(() => {
  rmSync(scratch, { recursive: true, force: true });
});

interface IDumpRun {
  status: number | null;
  stdout: string;
  stderr: string;
  calls: string[];
}

interface IDumpRunOptions {
  backupDirectory: string;
  retentionDays?: string;
  containerId?: string;
  pgDumpExit?: number;
}

/**
 * Runs the script with the stub first on PATH. Output is redirected to files
 * rather than captured through pipes, because bun 1.3.6 loses piped child
 * output for a test file that lives in a subdirectory.
 */
function runDump(options: IDumpRunOptions): IDumpRun {
  const run = mkdtempSync(path.join(scratch, "run-"));
  const stdoutPath = path.join(run, "stdout");
  const stderrPath = path.join(run, "stderr");
  const callsPath = path.join(run, "calls");

  writeFileSync(callsPath, "");

  const environment: Record<string, string> = {
    PATH: `${stubBin}:${process.env["PATH"]}`,
    HOME: scratch,
    STUB_DOCKER_CALLS: callsPath,
    STUB_CONTAINER_ID: options.containerId ?? "postgres-container",
    STUB_PG_DUMP_EXIT: String(options.pgDumpExit ?? 0),
    DATABASE_BACKUP_DIRECTORY: options.backupDirectory,
  };

  if (options.retentionDays !== undefined) {
    environment["DATABASE_BACKUP_RETENTION_DAYS"] = options.retentionDays;
  }

  const result = spawnSync(
    "bash",
    ["-c", `bash "${script}" > "${stdoutPath}" 2> "${stderrPath}"`],
    { env: environment, stdio: "ignore" },
  );

  return {
    status: result.status,
    stdout: readFileSync(stdoutPath, "utf8"),
    stderr: readFileSync(stderrPath, "utf8"),
    calls: readFileSync(callsPath, "utf8").trim().split("\n").filter(Boolean),
  };
}

/** A backup directory as the old play created it: world-readable. */
function createBackupDirectory(): string {
  const directory = mkdtempSync(path.join(scratch, "db_backups-"));

  chmodSync(directory, 0o755);

  return directory;
}

/** A dump left by an earlier night, with the given age and file mode. */
function writeOldDump(
  directory: string,
  name: string,
  ageInDays: number,
  mode = 0o644,
): string {
  const file = path.join(directory, name);
  const modified = new Date(Date.now() - ageInDays * dayInMilliseconds);

  writeFileSync(file, "-- an earlier dump\n", { mode });
  chmodSync(file, mode);
  utimesSync(file, modified, modified);

  return file;
}

function fileMode(file: string): number {
  return statSync(file).mode & 0o777;
}

function newDumps(directory: string, existing: string[]): string[] {
  return readdirSync(directory).filter(
    (name) => name.endsWith(".dump") && !existing.includes(name),
  );
}

describe("a successful dump", () => {
  /**
   * BDD Scenario: The dump is private
   * Given a backup directory created with mode 0755 by the old play
   * When the nightly job runs against a running postgres container
   * Then one new dump holds pg_dump's output with mode 0600, the directory is
   *      0700, no temporary file remains, and the job reports the file
   */
  test("writes the dump with mode 0600 into a 0700 directory", () => {
    const directory = createBackupDirectory();
    const result = runDump({ backupDirectory: directory });
    const dumps = newDumps(directory, []);

    expect(result.status).toBe(0);
    expect(dumps).toHaveLength(1);
    expect(dumps[0]).toMatch(/^sps_\d{2}-\d{2}-\d{4}\.dump$/);

    const dump = path.join(directory, dumps[0]);

    expect(readFileSync(dump, "utf8")).toContain(
      "COPY public.sps_rc_identity (id, email) FROM stdin;",
    );
    expect(fileMode(dump)).toBe(0o600);
    expect(fileMode(directory)).toBe(0o700);
    expect(readdirSync(directory)).toEqual(dumps);
    expect(result.stdout).toContain(`wrote ${dump}`);
  });

  /**
   * BDD Scenario: The dump comes from the database container
   * Given a running postgres_postgres container
   * When the nightly job runs
   * Then pg_dump runs inside that container, so no password or host port is
   *      involved
   */
  test("runs pg_dump inside the running postgres container", () => {
    const result = runDump({ backupDirectory: createBackupDirectory() });

    expect(result.status).toBe(0);
    expect(
      result.calls.some(
        (call) =>
          call.startsWith("exec postgres-container sh -c") &&
          call.includes("pg_dump"),
      ),
    ).toBe(true);
  });

  /**
   * BDD Scenario: Dumps from before the change become private
   * Given a recent dump the old script left with mode 0644
   * When the nightly job runs
   * Then that dump is kept and becomes 0600
   */
  test("tightens dumps left by the previous script to mode 0600", () => {
    const directory = createBackupDirectory();
    const earlier = writeOldDump(directory, "sps_20-09-2000.dump", 3);

    expect(runDump({ backupDirectory: directory }).status).toBe(0);
    expect(existsSync(earlier)).toBe(true);
    expect(fileMode(earlier)).toBe(0o600);
  });

  /**
   * BDD Scenario: The default retention
   * Given dumps 3 and 20 days old and no retention setting
   * When the nightly job succeeds
   * Then the 20-day-old dump is deleted and the 3-day-old dump is kept
   */
  test("deletes dumps older than the default fourteen days", () => {
    const directory = createBackupDirectory();
    const recent = writeOldDump(directory, "sps_20-09-2000.dump", 3);
    const expired = writeOldDump(directory, "sps_03-09-2000.dump", 20);

    expect(runDump({ backupDirectory: directory }).status).toBe(0);
    expect(existsSync(recent)).toBe(true);
    expect(existsSync(expired)).toBe(false);
  });

  /**
   * BDD Scenario: A configured retention
   * Given dumps 3 and 20 days old and a retention of 2 days
   * When the nightly job succeeds
   * Then both are deleted and only the new dump remains
   */
  test("applies the configured retention in days", () => {
    const directory = createBackupDirectory();
    const earlier = ["sps_20-09-2000.dump", "sps_03-09-2000.dump"];

    writeOldDump(directory, earlier[0], 3);
    writeOldDump(directory, earlier[1], 20);

    expect(
      runDump({ backupDirectory: directory, retentionDays: "2" }).status,
    ).toBe(0);
    expect(readdirSync(directory)).toEqual(newDumps(directory, earlier));
  });

  /**
   * BDD Scenario: Pruning switched off
   * Given a 20-day-old dump and a retention of 0
   * When the nightly job succeeds
   * Then the old dump is kept
   */
  test("keeps every dump when the retention is 0", () => {
    const directory = createBackupDirectory();
    const expired = writeOldDump(directory, "sps_03-09-2000.dump", 20);

    expect(
      runDump({ backupDirectory: directory, retentionDays: "0" }).status,
    ).toBe(0);
    expect(existsSync(expired)).toBe(true);
  });
});

describe("a dump that cannot be taken", () => {
  /**
   * BDD Scenario: pg_dump fails part way
   * Given dumps 3 and 20 days old and a pg_dump that fails after printing
   *      part of its output
   * When the nightly job runs
   * Then it exits non-zero, writes no new dump and no temporary file, and
   *      deletes nothing, so the last good dumps survive
   */
  test("keeps every earlier dump and leaves no partial file when pg_dump fails", () => {
    const directory = createBackupDirectory();
    const earlier = ["sps_20-09-2000.dump", "sps_03-09-2000.dump"];

    writeOldDump(directory, earlier[0], 3);
    writeOldDump(directory, earlier[1], 20);

    const result = runDump({ backupDirectory: directory, pgDumpExit: 1 });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("pg_dump failed");
    expect(readdirSync(directory).sort()).toEqual([...earlier].sort());
  });

  /**
   * BDD Scenario: The database is not running
   * Given no running postgres_postgres container
   * When the nightly job runs
   * Then it exits non-zero and creates nothing
   */
  test("exits without writing when no postgres container runs", () => {
    const directory = path.join(scratch, "never-created");
    const result = runDump({ backupDirectory: directory, containerId: "" });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("no running postgres_postgres container");
    expect(existsSync(directory)).toBe(false);
  });

  /**
   * BDD Scenario: A retention that is not a number of days
   * Given DATABASE_BACKUP_RETENTION_DAYS set to text
   * When the nightly job runs
   * Then it exits non-zero before dumping or deleting anything
   */
  test("rejects a retention that is not a non-negative integer", () => {
    const directory = createBackupDirectory();
    const recent = writeOldDump(directory, "sps_20-09-2000.dump", 3);
    const result = runDump({
      backupDirectory: directory,
      retentionDays: "two weeks",
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("must be a non-negative integer");
    expect(readdirSync(directory)).toEqual([path.basename(recent)]);
    expect(result.calls).toEqual([]);
  });
});
