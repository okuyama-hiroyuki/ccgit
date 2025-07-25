#!/usr/bin/env node

import { execSync, spawnSync } from "node:child_process";
import { exit } from "node:process";
import { quote } from "shell-quote";
import { readFileSync } from "node:fs";

const description = execSync("jj log -r @- -T description").toString().trim();
const isEmpty = ["@\n│\n~", "○\n│\n~"].includes(description);

if (!isEmpty) {
	console.log("recent division's description is not empty");
	exit(0);
}

const diff = execSync("jj show @-").toString().trim();
const commitMessageStyle = readFileSync("./docs/commit_message_style.md", "utf8");

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
[
  {
    "commit_message": "A brief summary of the changes made in this revision.",
    "files": ["file1.txt", "file2.txt"],
  },
  {
    "commit_message": "A brief summary of the changes made in this revision.",
    "files": ["file3.txt", "file4.txt"],
  },
  ...
]
\`\`\`

[notice]
+ あなたはgitを実行する権限はないので自身でgitを実行しないでください。
`;

type Revision = {
	commit_message: string;
	files: string[];
};

// const rawString = execSync(`echo ${quote([prompt])} | claude -p`)
// 	.toString()
// 	.trim();

const result = spawnSync(
	"claude",
	["-p"],
	{
		shell: true,
		input: prompt,
	});

if (result.error) {
	console.error("Error executing claude:", result.error);
	exit(1);
}
const rawString = result.stdout.toString().trim();

const match = rawString.match(/```json([\s\S]*?)```/);
if (!match) {
	console.error("No JSON block found in the response.");
	console.log("prompt:", prompt);
	console.log("rawString:", rawString);
	exit(1);
}
const targetString = match[1].trim();
const revisions: Revision[] = JSON.parse(targetString);

console.log("Revisions to be created:");
for (const revision of revisions) {
	console.log(`${revision.commit_message}: ${revision.files.join(", ")}`);
}

for (const revision of revisions) {
	execSync(
		`jj split -r @- -m "${revision.commit_message}" ${revision.files.join(" ")}`,
	);
}

execSync("jj abandon @-");
