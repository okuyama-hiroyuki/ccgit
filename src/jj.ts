import { execSync } from "child_process";
import type { Revision } from "./llm.js";
import { exit } from "process";

export function getDescription(changeId: string): string {
  const output = execSync(`jj show --no-patch -r ${changeId} -T description`);
  const description = output.toString().trim();
  if (description) {
    throw new Error(`Description found for change ID: ${changeId}`);
  }
  return description;
}

export function getDiff(changeId: string): string {
  const output = execSync(`jj diff -r ${changeId}`);
  const diff = output.toString().trim();
  if (!diff) {
    throw new Error(`No diff found for change ID: ${changeId}`);
  }
  return diff;
}

export function getPreviousChangeId(): string {
  const output = execSync("jj show --no-patch -r @- -T change_id");
  const changeId = output.toString().trim();
  if (!changeId) {
    throw new Error("No previous change ID found.");
  }
  return changeId;
}

export const getTargetFiles = (changeId: string): string[] => {
  const sumamry = execSync(`jj show --no-patch -r ${changeId} -T 'diff.summary()'`);
  const lines = sumamry.toString().trim().split("\n");

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
      case "C": // Copied
        targetFiles.add(file);
        break;
      case "R": // Renamed
        const [oldName, newName] = line.slice(1, -1).split(" => ").map(s => s.trim());
        targetFiles.add(oldName!);
        targetFiles.add(newName!);
        break;
      default:
        return type satisfies never;
    }
  }

  return [...targetFiles];
}

export function splitRevisions(
  changeId: string,
  revisions: Revision[],
) {
  for (const revision of revisions) {
    execSync(
      `jj split ${revision.files.map(file => `root-file:${file}`).join(" ")} -r ${changeId} --insert-before ${changeId} -m "${revision.commit_message}"`,
      {
        stdio: "ignore",
      },
    );
  }
}

export function abadonRevision(changeId: string) {
  const remainingFiles = getTargetFiles(changeId);
  if (remainingFiles.length > 0) {
    let message = "Some files were not included in any revision:\n";
    for (const file of remainingFiles) {
      message += `- ${file}\n`;
    }
    console.error(message);
    exit(1);
  }

  execSync(`jj abandon ${changeId}`, {
    stdio: "ignore",
  });
}
