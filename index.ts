#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { exit } from 'node:process';
import { quote } from 'shell-quote';
import { readFile } from 'node:fs/promises';

const description = execSync("jj log -r @- -T description").toString().trim();
const isEmpty = ["@\n│\n~", "○\n│\n~"].includes(description);

if (!isEmpty) {
  console.log("recent division's description is not empty");
  exit(0);
}

const diff = execSync("jj show @-").toString().trim();
const commitMessageStyle = readFile('./docs/commit_message_style.md', 'utf8')

const prompt = `
[what to do]
あなたはコードのコミットメッセージを生成するAIです。
あなたは、与えられたコードの変更内容を要約し、適切なコミットメッセージを生成します。

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
`

type Revision = {
  commit_message: string;
  files: string[];
}

const rawString = execSync(`claude ${quote([prompt])} -p`).toString().trim();

const match = rawString.match(/```json([\s\S]*?)```/);
if (!match) {
  throw new Error("No JSON block found in the response.");
}
const targetString = match[1].trim();
const revisions: Revision[] = JSON.parse(targetString);

console.log("Revisions to be created:");
for (const revision of revisions) {
  console.log(`${revision.commit_message}: ${revision.files.join(', ')}`);
}

for (const revision of revisions) {
  execSync(`jj split -r @- -m "${revision.commit_message}" ${revision.files.join(' ')}`);
}

const _ = execSync("jj abandon @-");
