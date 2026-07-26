import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const slug = process.argv[2]?.trim();
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

if (!slug || !slugPattern.test(slug)) {
	console.error(
		"用法：pnpm new-post:dir <ascii-kebab-case-slug>，例如 pnpm new-post:dir shader-notes",
	);
	process.exit(1);
}

const targetDir = path.join("src", "content", "posts", slug);
const targetFile = path.join(targetDir, "index.md");

if (existsSync(targetFile)) {
	console.error(`文章已存在：${targetFile}`);
	process.exit(1);
}

const date = new Intl.DateTimeFormat("en-CA", {
	timeZone: "Asia/Singapore",
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
}).format(new Date());

const frontmatter = `---
title: "${slug}"
published: ${date}
description: ""
image: ""
imageAlt: ""
tags: []
category: "Notes"
draft: true
lang: "zh_CN"
---

在这里开始写作。
`;

await mkdir(path.join(targetDir, "images"), { recursive: true });
await writeFile(targetFile, frontmatter, "utf8");

console.log(`已创建草稿：${targetFile}`);
