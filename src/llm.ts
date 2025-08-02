import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";

function fetchCommitMessageStyle(): string {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  // 目的のファイルへの絶対パスを生成
  const commitMessageStylePath = join(
    __dirname,
    "commit_message_style.md",
  );
  const commitMessageStyle = readFileSync(commitMessageStylePath, "utf8");

  return commitMessageStyle;
}

export function createPrompt(
  diff: string,
  files: string[]
): string {
  const commitMessageStyle = fetchCommitMessageStyle();
  const prompt = `
[what to do]
あなたはコードのコミットメッセージを生成するAIです。
あなたは、与えられたコードの変更内容を要約し、適切なコミットメッセージを生成してください。

[diff]
${diff}

[commit message style]
${commitMessageStyle}

[output format]
desctiption about the changes in the last revision.
\`\`\`json
{
  "revisions_descriptions": [
		"revision 0's description",
		"revision 1's description",
		...
	],
	"files": {
    ${files.map((file) => `"${file}": <revision index>`).join(",\n")}
		...
	}
}
\`\`\`

[notice]
+ あなたはgitを実行する権限はないので自身でgitを実行しないでください。

think
`;

  return prompt;
}

export type Revision = {
  commit_message: string;
  files: string[];
};

type Output = {
  revisions_descriptions: string[];
  files: Record<string, number>;
};

export function generateSplitedRevisions(
  prompt: string,
) {

  const result = spawnSync("claude", ["-p"], {
    input: prompt,
  });

  if (result.error) {
    throw result.error;
  }
  const rawString = result.stdout.toString().trim();

  const match = rawString.match(/```json([\s\S]*?)```/);
  if (!match) {
    console.error("No JSON block found in the response.");
    console.log("prompt:", prompt);
    console.log("rawString:", rawString);
    throw new Error("No JSON block found in the response.");
  }

  const targetString = match[1]!.trim();
  const typed_output: Output = JSON.parse(targetString);

  const revisions: Revision[] = [];
  for (const [
    index,
    description,
  ] of typed_output.revisions_descriptions.entries()) {
    const files = Object.entries(typed_output.files)
      .filter(([, value]) => value === index)
      .map(([key]) => key);

    // if (files.length === 0) {
    //   console.error(`No files found for revision ${index + 1}`);
    //   exit(1);
    // }

    revisions.push({
      commit_message: description,
      files,
    });
  }

  return revisions;
}
