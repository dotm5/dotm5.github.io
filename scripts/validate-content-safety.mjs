import { lstat, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { parseDocument } from "yaml";

const root = process.cwd();
const failures = [];
const allowedUploadExtensions = new Set([
	".avif",
	".gif",
	".jpeg",
	".jpg",
	".png",
	".webp",
]);
const expectedMediaExtensions = ["avif", "gif", "jpeg", "jpg", "png", "webp"];
const maxCmsConfigBytes = 128 * 1024;
const maxMarkdownBytes = 2 * 1024 * 1024;
const maxUploadBytes = 4 * 1024 * 1024;
const maxUploadCount = 500;
const maxTotalUploadBytes = 50 * 1024 * 1024;

function addFailure(message) {
	failures.push(message);
}

function isRecord(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireRecord(value, label) {
	if (!isRecord(value)) {
		addFailure(`${label} 必须是对象`);
		return {};
	}
	return value;
}

function requireExactKeys(value, label, expectedKeys) {
	const record = requireRecord(value, label);
	const actual = Object.keys(record).sort();
	const expected = [...expectedKeys].sort();
	if (actual.join("\n") !== expected.join("\n")) {
		addFailure(
			`${label} 字段必须严格为 [${expected.join(", ")}]，实际为 [${actual.join(", ")}]`,
		);
	}
	return record;
}

function requireEqual(actual, expected, label) {
	if (actual !== expected) {
		addFailure(`${label} 必须为 ${JSON.stringify(expected)}`);
	}
}

function requireStringSet(actual, expected, label) {
	if (!Array.isArray(actual)) {
		addFailure(`${label} 必须是数组`);
		return;
	}
	const actualSorted = actual.map(String).sort();
	const expectedSorted = [...expected].sort();
	if (actualSorted.join("\n") !== expectedSorted.join("\n")) {
		addFailure(
			`${label} 必须严格为 [${expectedSorted.join(", ")}]，实际为 [${actualSorted.join(", ")}]`,
		);
	}
}

function hasControlCharacters(value) {
	return [...value].some((character) => {
		const codePoint = character.codePointAt(0) ?? 0;
		return codePoint <= 31 || codePoint === 127;
	});
}

async function validateCmsConfig() {
	const configPath = path.join(root, ".pages.yml");
	const source = await readFile(configPath, "utf8");
	if (Buffer.byteLength(source, "utf8") > maxCmsConfigBytes) {
		addFailure(".pages.yml 超过 128 KiB 安全上限");
		return;
	}

	const document = parseDocument(source, { uniqueKeys: true });
	for (const error of document.errors) {
		addFailure(`.pages.yml YAML 解析失败：${error.message}`);
	}
	if (document.errors.length > 0) {
		return;
	}

	const config = requireExactKeys(
		document.toJS({ maxAliasCount: 0 }),
		".pages.yml",
		["content", "media", "settings"],
	);

	if (!Array.isArray(config.media) || config.media.length !== 1) {
		addFailure(".pages.yml media 必须且只能包含 article_images");
	} else {
		const media = requireExactKeys(config.media[0], "media.article_images", [
			"extensions",
			"input",
			"label",
			"name",
			"output",
			"rename",
		]);
		requireEqual(media.name, "article_images", "media.name");
		requireEqual(media.input, "public/uploads", "media.input");
		requireEqual(media.output, "/uploads", "media.output");
		requireEqual(media.rename, "safe", "media.rename");
		requireStringSet(
			media.extensions,
			expectedMediaExtensions,
			"media.extensions",
		);
	}

	if (!Array.isArray(config.content) || config.content.length !== 2) {
		addFailure(".pages.yml content 必须且只能包含 posts 与 site_settings");
		return;
	}

	const contentByName = new Map(
		config.content
			.filter((entry) => isRecord(entry) && typeof entry.name === "string")
			.map((entry) => [entry.name, entry]),
	);
	requireStringSet(
		[...contentByName.keys()],
		["posts", "site_settings"],
		"content",
	);

	const posts = requireRecord(contentByName.get("posts"), "content.posts");
	requireEqual(posts.type, "collection", "content.posts.type");
	requireEqual(posts.path, "src/content/posts", "content.posts.path");
	requireEqual(posts.format, "yaml-frontmatter", "content.posts.format");
	requireEqual(posts.subfolders, true, "content.posts.subfolders");
	const postOperations = requireExactKeys(
		posts.operations,
		"content.posts.operations",
		["create", "delete", "rename"],
	);
	requireEqual(postOperations.create, true, "content.posts.operations.create");
	requireEqual(postOperations.rename, false, "content.posts.operations.rename");
	requireEqual(postOperations.delete, false, "content.posts.operations.delete");
	const filename = requireExactKeys(posts.filename, "content.posts.filename", [
		"field",
		"template",
	]);
	requireEqual(
		filename.template,
		"{year}-{month}-{day}-post.md",
		"content.posts.filename.template",
	);
	requireEqual(filename.field, "create", "content.posts.filename.field");
	requireEqual(posts.actions, undefined, "content.posts.actions");
	requireStringSet(
		Array.isArray(posts.fields)
			? posts.fields.map((field) => field.name)
			: null,
		[
			"body",
			"banner",
			"bannerPosition",
			"category",
			"coverPreset",
			"description",
			"draft",
			"image",
			"imageAlt",
			"lang",
			"published",
			"tags",
			"title",
			"updated",
		],
		"content.posts.fields",
	);

	const bodyField = Array.isArray(posts.fields)
		? posts.fields.find((field) => field.name === "body")
		: undefined;
	requireEqual(bodyField?.type, "rich-text", "content.posts.fields.body.type");
	requireEqual(
		bodyField?.options?.media,
		"article_images",
		"content.posts.fields.body.options.media",
	);
	const imageField = Array.isArray(posts.fields)
		? posts.fields.find((field) => field.name === "image")
		: undefined;
	requireEqual(imageField?.type, "image", "content.posts.fields.image.type");
	requireEqual(
		imageField?.options?.media,
		"article_images",
		"content.posts.fields.image.options.media",
	);
	const coverPresetField = Array.isArray(posts.fields)
		? posts.fields.find((field) => field.name === "coverPreset")
		: undefined;
	requireEqual(
		coverPresetField?.type,
		"select",
		"content.posts.fields.coverPreset.type",
	);
	requireStringSet(
		Array.isArray(coverPresetField?.options?.values)
			? coverPresetField.options.values.map((value) => value.name)
			: null,
		["daily", "default", "none", "notes", "technical"],
		"content.posts.fields.coverPreset.options.values",
	);
	const bannerField = Array.isArray(posts.fields)
		? posts.fields.find((field) => field.name === "banner")
		: undefined;
	requireEqual(bannerField?.type, "image", "content.posts.fields.banner.type");
	requireEqual(
		bannerField?.options?.media,
		"article_images",
		"content.posts.fields.banner.options.media",
	);
	const bannerPositionField = Array.isArray(posts.fields)
		? posts.fields.find((field) => field.name === "bannerPosition")
		: undefined;
	requireEqual(
		bannerPositionField?.type,
		"select",
		"content.posts.fields.bannerPosition.type",
	);
	requireStringSet(
		Array.isArray(bannerPositionField?.options?.values)
			? bannerPositionField.options.values.map((value) => value.name)
			: null,
		["bottom", "center", "top"],
		"content.posts.fields.bannerPosition.options.values",
	);

	const siteSettings = requireRecord(
		contentByName.get("site_settings"),
		"content.site_settings",
	);
	requireEqual(siteSettings.type, "file", "content.site_settings.type");
	requireEqual(
		siteSettings.path,
		"src/data/site.json",
		"content.site_settings.path",
	);
	requireEqual(siteSettings.format, "json", "content.site_settings.format");
	const siteOperations = requireExactKeys(
		siteSettings.operations,
		"content.site_settings.operations",
		["create", "delete", "rename"],
	);
	requireEqual(
		siteOperations.create,
		false,
		"content.site_settings.operations.create",
	);
	requireEqual(
		siteOperations.rename,
		false,
		"content.site_settings.operations.rename",
	);
	requireEqual(
		siteOperations.delete,
		false,
		"content.site_settings.operations.delete",
	);
	requireEqual(
		siteSettings.actions,
		undefined,
		"content.site_settings.actions",
	);
	requireStringSet(
		Array.isArray(siteSettings.fields)
			? siteSettings.fields.map((field) => field.name)
			: null,
		["banner", "content", "layout", "profile", "site", "theme"],
		"content.site_settings.fields",
	);

	const settings = requireExactKeys(config.settings, "settings", [
		"commit",
		"content",
		"hide",
	]);
	requireEqual(settings.hide, true, "settings.hide");
	requireEqual(settings.content?.merge, true, "settings.content.merge");
	requireEqual(settings.commit?.identity, "app", "settings.commit.identity");
}

async function walk(directory) {
	const results = [];
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		const fullPath = path.join(directory, entry.name);
		const fileStat = await lstat(fullPath);
		if (fileStat.isSymbolicLink()) {
			addFailure(`不允许符号链接：${path.relative(root, fullPath)}`);
			continue;
		}
		if (fileStat.isDirectory()) {
			results.push(...(await walk(fullPath)));
		} else if (fileStat.isFile()) {
			results.push({ fullPath, size: fileStat.size });
		} else {
			addFailure(`不允许特殊文件：${path.relative(root, fullPath)}`);
		}
	}
	return results;
}

async function validateUploads() {
	const uploadRoot = path.join(root, "public", "uploads");
	const files = await walk(uploadRoot);
	let totalBytes = 0;
	let uploadCount = 0;

	for (const file of files) {
		const relative = path
			.relative(uploadRoot, file.fullPath)
			.replace(/\\/gu, "/");
		if (relative === ".gitkeep") {
			if (file.size > 1) {
				addFailure("public/uploads/.gitkeep 必须为空");
			}
			continue;
		}

		uploadCount += 1;
		totalBytes += file.size;
		const extension = path.extname(relative).toLowerCase();
		if (!allowedUploadExtensions.has(extension)) {
			addFailure(`上传目录包含未允许的文件类型：public/uploads/${relative}`);
		}
		if (file.size > maxUploadBytes) {
			addFailure(`上传文件超过 4 MiB：public/uploads/${relative}`);
		}
		if (hasControlCharacters(relative)) {
			addFailure(`上传路径包含控制字符：public/uploads/${relative}`);
		}
	}

	if (uploadCount > maxUploadCount) {
		addFailure(`上传文件数量超过 ${maxUploadCount} 个`);
	}
	if (totalBytes > maxTotalUploadBytes) {
		addFailure("上传目录总大小超过 50 MiB");
	}
}

function stripCodeBlocks(markdown) {
	const lines = markdown.split(/\r?\n/u);
	let fenceCharacter = "";
	let fenceLength = 0;
	const visibleLines = [];

	for (const line of lines) {
		const fence = line.match(/^ {0,3}(`{3,}|~{3,})/u)?.[1];
		if (fence) {
			if (fenceCharacter === "") {
				fenceCharacter = fence[0];
				fenceLength = fence.length;
			} else if (fence[0] === fenceCharacter && fence.length >= fenceLength) {
				fenceCharacter = "";
				fenceLength = 0;
			}
			visibleLines.push("");
			continue;
		}
		visibleLines.push(fenceCharacter === "" ? line : "");
	}

	return visibleLines.join("\n").replace(/`[^`\n]*`/gu, "");
}

async function validateMarkdown() {
	const postsRoot = path.join(root, "src", "content", "posts");
	const files = (await walk(postsRoot)).filter(({ fullPath }) =>
		/\.md$/iu.test(fullPath),
	);
	const forbiddenPatterns = [
		{
			label: "可执行或嵌入式 HTML 标签",
			pattern:
				/<\s*(?:script|iframe|object|embed|form|input|button|textarea|select|meta|base|link|style|svg)\b/iu,
		},
		{ label: "HTML 事件处理器", pattern: /\bon[a-z]+\s*=/iu },
		{ label: "脚本 URL", pattern: /\b(?:javascript|vbscript)\s*:/iu },
		{ label: "data URL", pattern: /\bdata\s*:/iu },
	];

	for (const file of files) {
		const relative = path.relative(root, file.fullPath);
		if (file.size > maxMarkdownBytes) {
			addFailure(`Markdown 文件超过 2 MiB：${relative}`);
			continue;
		}
		const source = stripCodeBlocks(await readFile(file.fullPath, "utf8"));
		for (const forbidden of forbiddenPatterns) {
			if (forbidden.pattern.test(source)) {
				addFailure(`${relative} 包含${forbidden.label}`);
			}
		}
	}
}

await validateCmsConfig();
await validateUploads();
await validateMarkdown();

if (failures.length > 0) {
	console.error("内容安全验证失败：");
	for (const failure of failures) {
		console.error(`- ${failure}`);
	}
	process.exit(1);
}

console.log(
	"内容安全验证通过：CMS 路径与权限白名单、Markdown 主动内容、上传类型及体积均符合约束。",
);
