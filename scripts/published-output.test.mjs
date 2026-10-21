import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { gunzipSync } from "node:zlib";
import sanitizeHtml from "sanitize-html";
import { parse } from "yaml";

const dist = path.resolve(process.env.BLOG_TEST_DIST || "dist");
const contentRoot = path.resolve("src/content/posts");

function markdownFiles(directory) {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const file = path.join(directory, entry.name);
		return entry.isDirectory()
			? markdownFiles(file)
			: /\.mdx?$/.test(file)
				? [file]
				: [];
	});
}

const posts = markdownFiles(contentRoot)
	.map((file) => {
		const markdown = readFileSync(file, "utf8");
		const data = parse(markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/)[1]);
		const slug = path
			.relative(contentRoot, file)
			.replace(/\\/g, "/")
			.replace(/(?:\/index)?\.mdx?$/, "");
		return { slug, data };
	})
	.filter((post) => post.data.draft !== true);
const isDaily = (post) => post.data.category?.trim() === "日常";

function attributesIn(html, name) {
	const result = [];
	sanitizeHtml(html, {
		transformTags: {
			[name]: (tagName, attribs) => {
				result.push(attribs);
				return { tagName, attribs };
			},
		},
	});
	return result;
}

function decodeXml(value) {
	if (value.startsWith("<![CDATA[")) return value.slice(9, -3);
	const entities = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
	return value.replace(/&(amp|lt|gt|quot|apos);/g, (_, name) => entities[name]);
}

test("production RSS includes every regular post and deployable absolute image URLs", () => {
	const feed = readFileSync(path.join(dist, "rss.xml"), "utf8");
	const items = [...feed.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(
		(match) => match[1],
	);
	assert.equal(items.length, posts.filter((post) => !isDaily(post)).length);
	const itemUrls = items.map(
		(item) =>
			new URL(decodeXml(item.match(/<link>([\s\S]*?)<\/link>/)[1])).pathname,
	);
	for (const post of posts) {
		assert.equal(
			itemUrls.includes(`/posts/${post.slug}/`),
			!isDaily(post),
			post.slug,
		);
	}
	let imageCount = 0;
	for (const item of items) {
		const itemUrl = new URL(
			decodeXml(item.match(/<link>([\s\S]*?)<\/link>/)[1]),
		);
		const html = decodeXml(
			item.match(/<content:encoded>([\s\S]*?)<\/content:encoded>/)[1],
		);
		for (const image of attributesIn(html, "img")) {
			const imageUrl = new URL(image.src);
			assert.match(imageUrl.protocol, /^https?:$/);
			if (imageUrl.origin === itemUrl.origin) {
				assert.ok(
					existsSync(path.join(dist, decodeURIComponent(imageUrl.pathname))),
					image.src,
				);
			}
			imageCount++;
		}
	}
	assert.ok(imageCount > 0, "feed must exercise published images");
});

test("every generated article route has reciprocal navigation within its own category group", () => {
	const navigation = new Map();
	for (const post of posts) {
		const html = readFileSync(
			path.join(dist, "posts", post.slug, "index.html"),
			"utf8",
		);
		if (isDaily(post))
			assert.match(html, /<body\b[^>]*data-pagefind-ignore="all"/);
		const links = [
			...html.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g),
		]
			.filter((match) => match[2].includes("article-nav-card"))
			.map((match) => match[1]);
		navigation.set(post.slug, links);
		for (const link of links) {
			const target = posts.find((entry) => link === `/posts/${entry.slug}/`);
			assert.ok(target, `${post.slug}: ${link}`);
			assert.equal(
				isDaily(target),
				isDaily(post),
				`${post.slug}: cross-group navigation`,
			);
		}
	}
	for (const post of posts) {
		for (const link of navigation.get(post.slug)) {
			const targetSlug = link.slice("/posts/".length, -1);
			assert.ok(
				navigation.get(targetSlug).includes(`/posts/${post.slug}/`),
				`${post.slug}: non-reciprocal navigation`,
			);
		}
	}
	for (const daily of [false, true]) {
		const group = posts.filter((post) => isDaily(post) === daily);
		const edgeCount = group.reduce(
			(count, post) => count + navigation.get(post.slug).length,
			0,
		);
		assert.equal(edgeCount, Math.max(0, 2 * (group.length - 1)));
	}
});

test("the published Blender index links all ten generated articles and reflects publication", () => {
	const html = readFileSync(
		path.join(dist, "posts/blender-shader-series-index/index.html"),
		"utf8",
	);
	const table = html.match(/<table\b[\s\S]*?<\/table>/)[0];
	const links = attributesIn(table, "a").map((link) => link.href);
	const slugs = [
		"from-frame-to-behavior",
		"gbuffer-as-contract",
		"face-sdf-and-ramp",
		"eye-shading-stack",
		"hair-directional-highlights",
		"cloth-fx-layers",
		"outline-as-geometry",
		"npr-to-eevee-architecture",
		"strict-fallback",
		"fixed-condition-validation",
	];
	assert.deepEqual(
		links,
		slugs.map((slug) => `/posts/${slug}/`),
	);
	for (const slug of slugs)
		assert.ok(existsSync(path.join(dist, "posts", slug, "index.html")));
	assert.match(html, /10 篇文章已于 2026 年 10 月 20 日发布/);
	assert.doesNotMatch(html, /所有文章目前都是草稿|尚未进入发布状态/);
});

test("the generated Pagefind index contains regular articles and excludes daily articles", () => {
	const fragments = path.join(dist, "pagefind/fragment");
	const indexedUrls = readdirSync(fragments)
		.filter((file) => file.endsWith(".pf_fragment"))
		.map((file) => {
			// Pagefind prefixes its compressed JSON fragments with a format signature.
			const fragment = gunzipSync(
				readFileSync(path.join(fragments, file)),
			).toString("utf8");
			return JSON.parse(fragment.slice(fragment.indexOf("{"))).url;
		})
		.filter((url) => url.startsWith("/posts/"));
	assert.deepEqual(
		new Set(indexedUrls),
		new Set(
			posts
				.filter((post) => !isDaily(post))
				.map((post) => `/posts/${post.slug}/`),
		),
	);
});

test("all generated HTML pages provide unique Swup replacement containers", () => {
	function htmlFiles(directory) {
		return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
			const file = path.join(directory, entry.name);
			return entry.isDirectory()
				? htmlFiles(file)
				: entry.name.endsWith(".html")
					? [file]
					: [];
		});
	}
	for (const file of htmlFiles(dist)) {
		const html = readFileSync(file, "utf8");
		for (const id of ["banner-wrapper", "banner-credit-wrapper", "toc"]) {
			assert.equal(
				[...html.matchAll(new RegExp(`\\bid="${id}"`, "g"))].length,
				1,
				`${file}: ${id}`,
			);
		}
	}
});
