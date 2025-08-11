import { execSync, spawnSync } from "node:child_process";
import { exit } from "node:process";
import type { Revision } from "./llm.js";

export function getDescription(changeId: string): string {
  const result = spawnSync(
    "jj",
    ["show", "--no-patch", "-r", changeId, "-T", "description"],
    { encoding: "utf-8" },
  );
  const description = result.stdout.toString().trim();
  if (description) {
    throw new Error(`Description found for change ID: ${changeId}`);
  }
  return description;
}

export function getDiff(changeId: string): string {
  const result = spawnSync(
    "jj",
    ["diff", "-r", changeId],
    { encoding: "utf-8" },
  );
  const diff = result.stdout.toString().trim();
  if (!diff) {
    throw new Error(`No diff found for change ID: ${changeId}`);
  }
  return diff;
}

export function getPreviousChangeId(): string {
  const result = spawnSync(
    "jj",
    ["show", "--no-patch", "-r", "@-", "-T", "change_id"],
    { encoding: "utf-8" },
  );
  const changeId = result.stdout.toString().trim();
  if (!changeId) {
    throw new Error("No previous change ID found.");
  }
  return changeId;
}

export const getTargetFiles = (changeId: string): string[] => {
  const result = spawnSync(
    "jj",
    ["show", "--no-patch", "-r", changeId, "-T", "diff.summary()"],
    { encoding: "utf-8" },
  );
  const lines = result.stdout.toString().trim().split("\n");

  const targetFiles: Set<string> = new Set();
  for (const line of lines) {
    if (!line || line.trim() === "") {
      continue;
    }

    const type = line[0] as "M" | "A" | "D" | "R" | "C";
    const file = line.slice(2).trim();

    switch (type) {
      case "M": // Modified
      case "A": // Added
      case "D": // Deleted
        targetFiles.add(file);
        break;
      case "C": // Copied
      case "R": // Renamed
        const [oldName, newName] = line
          .slice(1, -1)
          .split(" => ")
          .map((s) => s.trim());
        targetFiles.add(oldName!);
        targetFiles.add(newName!);
        break;
      default:
        return type satisfies never;
    }
  }

  return [...targetFiles];
};

export function splitRevisions(changeId: string, revisions: Revision[]) {
  for (const revision of revisions) {
    spawnSync(
      "jj",
      [
        "split",
        ...revision.files,
        "-r",
        changeId,
        "--insert-before",
        changeId,
        "-m",
        revision.commit_message,
      ],
      { stdio: "ignore" },
    );
  }
}

export function abandonRevision(changeId: string) {
  const remainingFiles = getTargetFiles(changeId);
  if (remainingFiles.length > 0) {
    let message = "Some files were not included in any revision:\n";
    for (const file of remainingFiles) {
      message += `- ${file}\n`;
    }
    console.error(message);
    exit(1);
  }

  spawnSync("jj", ["abandon", changeId], { stdio: "ignore" });
}
