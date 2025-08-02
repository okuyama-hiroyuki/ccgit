import { execSync } from "child_process";
import { warn } from "console";
import type { Revision } from "./llm.js";

export const getTargetFiles = (): string[] => {
  const sumamry = execSync("jj show --no-patch -r @- -T 'diff.summary()'");
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
  revisions: Revision[],
) {

  for (const revision of revisions) {
    console.log(`${revision.commit_message}`);
    for (const file of revision.files) {
      console.log(`- ${file}`);
    }
  }

  for (const revision of revisions) {
    execSync(
      `jj split ${revision.files.join(" ")} -r @- -m "${revision.commit_message}"`,
      {
        stdio: "ignore",
      },
    );
  }
}

export function abadanRevision() {
  const remainingFiles = getTargetFiles();
  if (remainingFiles.length > 0) {
    let message = "Some files were not included in any revision:\n";
    for (const file of remainingFiles) {
      message += `- ${file}\n`;
    }
    throw new Error(message);
  }

  execSync("jj abandon @-", {
    stdio: "ignore",
  });
}
