const images = import.meta.glob<ImageMetadata>(
	"/src/content/posts/**/*.{avif,gif,jpeg,jpg,png,svg,webp}",
	{ eager: true, import: "default" },
);

// Markdown bundle paths refer to source files; their deployed URLs are hashed.
export function resolvePostAsset(source: string, postId: string): string {
	if (!source || /^(?:\/|[a-z][a-z\d+.-]*:)/i.test(source)) return source;
	const sourceUrl = new URL(
		source,
		new URL(postId, "file:///src/content/posts/"),
	);
	const image = images[decodeURIComponent(sourceUrl.pathname)];
	return image ? `${image.src}${sourceUrl.search}${sourceUrl.hash}` : source;
}
