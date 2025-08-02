import { execSync } from "child_process";

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
        const [oldName, newName] = line.slice(1, -1).split(" -> ").map(s => s.trim());
        targetFiles.add(oldName!);
        targetFiles.add(newName!);
        break;
      default:
        return type satisfies never;
    }
  }

  return [...targetFiles];
}
