import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import sanitizeHtml from "sanitize-html";
import { filterArchivePosts } from "../src/utils/archive-filter.ts";
import { withPostNavigation } from "../src/utils/post-navigation.ts";
import { renderRssContent } from "../src/utils/rss-content.ts";

function imagesIn(html) {
	const images = [];
	sanitizeHtml(html, {
		transformTags: {
			img: (tagName, attribs) => {
				images.push(attribs);
				return { tagName, attribs };
			},
		},
	});
	return images;
}

test("RSS images use absolute item, public and asset URLs, preserving external URLs", () => {
	const postUrl = new URL("https://example.com/blog/posts/sample/");
	const body = [
		"![bundle](./images/figure.webp)",
		"![parent](../shared/figure.png?size=2#preview)",
		"![upload](/uploads/photo.webp)",
		"![remote](https://cdn.example.com/photo.jpg)",
		"![protocol](//cdn.example.com/photo.webp)",
		"![encoded](./images/figure%20two.webp)",
		"`![code](./images/code.webp)`",
	].join("\n\n");
	const html = renderRssContent(body, postUrl, (source) =>
		source === "./images/figure.webp"
			? "/blog/_astro/figure.hash.webp"
			: source,
	);
	assert.deepEqual(
		imagesIn(html).map((image) => image.src),
		[
			"https://example.com/blog/_astro/figure.hash.webp",
			"https://example.com/blog/posts/shared/figure.png?size=2#preview",
			"https://example.com/uploads/photo.webp",
			"https://cdn.example.com/photo.jpg",
			"https://cdn.example.com/photo.webp",
			"https://example.com/blog/posts/sample/images/figure%20two.webp",
		],
	);
	assert.match(html, /<code>!\[code\]\(\.\/images\/code.webp\)<\/code>/);
});

test("RSS retains alt text and XML/sanitizer protections", () => {
	const html = renderRssContent(
		"正文\u0001\u000b\uffff\n\n![图 & 说明](./figure.webp)\n\n<script>alert(1)</script>\n\n![bad](javascript:alert(1))",
		new URL("https://example.com/posts/sample/"),
	);
	assert.equal(imagesIn(html)[0].alt, "图 & 说明");
	assert.equal(
		[...html].some((char) => [1, 11, 65535].includes(char.codePointAt(0))),
		false,
	);
	assert.doesNotMatch(html, /<script|src="javascript:/i);
});

function post(slug, category, tags = ["shared"]) {
	return { slug, data: { title: slug.toUpperCase(), category, tags } };
}

test("article navigation skips interleaved daily posts and preserves all routes", () => {
	const posts = [
		post("regular-new", "Notes"),
		post("daily-new", "日常"),
		post("regular-mid", "Rendering"),
		post("daily-old", " 日常 "),
		post("regular-old", ""),
	];
	posts[0].data.nextSlug = "stale";
	posts[4].data.prevSlug = "stale";
	const before = structuredClone(posts);
	const result = withPostNavigation(posts);
	assert.deepEqual(
		result.map((entry) => entry.slug),
		posts.map((entry) => entry.slug),
	);
	assert.deepEqual(
		result.map(({ data }) => [data.nextSlug, data.prevSlug]),
		[
			["", "regular-mid"],
			["", "daily-old"],
			["regular-new", "regular-old"],
			["daily-new", ""],
			["regular-mid", ""],
		],
	);
	assert.equal(result[2].data.nextTitle, "REGULAR-NEW");
	assert.equal(result[2].data.prevTitle, "REGULAR-OLD");
	assert.deepEqual(posts, before);
	assert.deepEqual(withPostNavigation([]), []);
	const single = withPostNavigation([post("only", "日常")])[0].data;
	assert.deepEqual(
		[single.nextSlug, single.prevSlug, single.nextTitle, single.prevTitle],
		["", "", "", ""],
	);
});

const archivePosts = [
	post("daily", "日常"),
	post("notes", " Notes "),
	post("render", "Rendering", ["render"]),
	post("uncategorized", ""),
];
const select = (params) =>
	filterArchivePosts(archivePosts, {
		tags: params.getAll("tag"),
		categories: params.getAll("category"),
		uncategorized: !!params.get("uncategorized"),
	}).map((entry) => entry.slug);

test("archive category union includes daily and ordinary posts in either query order", () => {
	for (const query of [
		"category=日常&category=Notes",
		"category=Notes&category=日常",
		"category= 日常 &category= Notes &category=Notes",
	]) {
		assert.deepEqual(select(new URLSearchParams(query)), ["daily", "notes"]);
	}
	assert.deepEqual(select(new URLSearchParams("category=日常")), ["daily"]);
	assert.deepEqual(select(new URLSearchParams("category=Notes")), ["notes"]);
});

test("archive default, tag intersection and uncategorized visibility remain deterministic", () => {
	assert.deepEqual(select(new URLSearchParams()), [
		"notes",
		"render",
		"uncategorized",
	]);
	assert.deepEqual(select(new URLSearchParams("tag=shared")), [
		"notes",
		"uncategorized",
	]);
	assert.deepEqual(
		select(new URLSearchParams("category=日常&category=Notes&tag=render")),
		[],
	);
	assert.deepEqual(
		select(
			new URLSearchParams(
				"category=日常&category=Rendering&tag=shared&tag=render",
			),
		),
		["daily", "render"],
	);
	assert.deepEqual(select(new URLSearchParams("uncategorized=true")), [
		"uncategorized",
	]);
	assert.deepEqual(select(new URLSearchParams("category=missing")), []);
	assert.deepEqual(select(new URLSearchParams("category=")), []);
});

test("cover presets prefer specialized images and use generic covers as fallback", async () => {
	const root = mkdtempSync(path.join(tmpdir(), "blog-covers-"));
	const previousDirectory = process.cwd();
	try {
		mkdirSync(path.join(root, "public/uploads"), { recursive: true });
		for (const name of ["daily-cover-01.webp", "default-cover-01.webp"]) {
			writeFileSync(path.join(root, "public/uploads", name), "fixture");
		}
		process.chdir(root);
		const { resolvePostMedia } = await import("../src/utils/post-media.ts");
		const fallback = {
			cover: "/banner.webp",
			banner: "/banner.webp",
			bannerPosition: "center",
		};
		for (let index = 0; index < 20; index++) {
			assert.equal(
				resolvePostMedia({ coverPreset: "daily" }, `slug-${index}`, fallback)
					.cover,
				"/uploads/daily-cover-01.webp",
			);
		}
		assert.equal(
			resolvePostMedia({ coverPreset: "notes" }, "slug", fallback).cover,
			"/uploads/default-cover-01.webp",
		);
		assert.equal(
			resolvePostMedia({ coverPreset: "none" }, "slug", fallback).cover,
			"",
		);
		assert.equal(
			resolvePostMedia(
				{ image: "./own.webp", coverPreset: "daily" },
				"slug",
				fallback,
			).cover,
			"./own.webp",
		);
	} finally {
		process.chdir(previousDirectory);
		rmSync(root, { recursive: true, force: true });
	}
});
