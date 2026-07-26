import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const dist = path.join(root, "dist");
const failures = [];

async function exists(relativePath) {
	try {
		await stat(path.join(dist, relativePath));
		return true;
	} catch {
		return false;
	}
}

async function requirePath(relativePath) {
	if (!(await exists(relativePath))) {
		failures.push(`缺少构建产物：dist/${relativePath}`);
	}
}

async function walk(directory) {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const fullPath = path.join(directory, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await walk(fullPath)));
		} else {
			files.push(fullPath);
		}
	}
	return files;
}

const requiredPaths = [
	"index.html",
	path.join("archive", "index.html"),
	path.join("about", "index.html"),
	path.join("projects", "index.html"),
	"404.html",
	"rss.xml",
	"robots.txt",
	path.join("pagefind", "pagefind.js"),
	path.join("posts", "site-launch", "index.html"),
];

for (const requiredPath of requiredPaths) {
	await requirePath(requiredPath);
}

const rootFiles = await readdir(dist).catch(() => []);
if (!rootFiles.some((file) => /^sitemap(?:-index)?\.xml$/.test(file))) {
	failures.push("缺少 sitemap XML 输出");
}

if (await exists(path.join("posts", "style-sandbox", "index.html"))) {
	failures.push("draft 文章 style-sandbox 被意外发布");
}

const files = await walk(dist).catch(() => []);
const htmlFiles = files.filter((file) => file.endsWith(".html"));
const postPages = htmlFiles.filter((file) =>
	file.includes(`${path.sep}posts${path.sep}`),
);

if (postPages.length < 1) {
	failures.push("生产构建中没有已发布文章");
}

const textExtensions = new Set([".html", ".xml", ".txt", ".js", ".json"]);
const textFiles = files.filter((file) =>
	textExtensions.has(path.extname(file).toLowerCase()),
);

const forbiddenIdentity = [
	/Fuwari Demo Site/i,
	/Lorem Ipsum/i,
	/fuwari\.vercel\.app/i,
	/twitter\.com(?!\/intent)/i,
	/store\.steampowered\.com/i,
];
const forbiddenSecrets = [
	/TODO_SECRET/,
	/-----BEGIN (?:RSA |OPENSSH |EC |DSA )?PRIVATE KEY-----/,
	/\bgh[pousr]_[A-Za-z0-9]{30,}\b/,
	/\bsk-[A-Za-z0-9]{20,}\b/,
];

for (const file of textFiles) {
	const content = await readFile(file, "utf8");
	const relative = path.relative(root, file);
	for (const pattern of [...forbiddenIdentity, ...forbiddenSecrets]) {
		if (pattern.test(content)) {
			failures.push(`在 ${relative} 中发现禁止内容：${pattern}`);
		}
	}
	if (file.endsWith(".html") && /<img\b[^>]*\bsrc=(?:""|'')/i.test(content)) {
		failures.push(`在 ${relative} 中发现空图片地址`);
	}
}

if (failures.length > 0) {
	console.error("静态产物验证失败：");
	for (const failure of failures) {
		console.error(`- ${failure}`);
	}
	process.exit(1);
}

console.log(
	`静态产物验证通过：${htmlFiles.length} 个 HTML 页面，${postPages.length} 篇已发布文章，Pagefind / RSS / Sitemap / robots / 404 均存在。`,
);
