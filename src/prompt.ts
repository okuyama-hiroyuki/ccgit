import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

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
