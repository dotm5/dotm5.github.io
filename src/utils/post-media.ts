import { readdirSync } from "node:fs";
import path from "node:path";

export type BannerPosition = "top" | "center" | "bottom";

export type PostMediaInput = {
	image?: string | null;
	coverPreset?: string | null;
	banner?: string | null;
	bannerPosition?: string | null;
};

export type PostMediaFallbacks = {
	cover: string;
	banner: string;
	bannerPosition: BannerPosition;
};

export type ResolvedPostMedia = {
	cover: string;
	banner: string;
	bannerPosition: BannerPosition;
	hasCustomBanner: boolean;
};

const imageExtensions = new Set([
	".avif",
	".gif",
	".jpeg",
	".jpg",
	".png",
	".webp",
]);

const presetPrefixes: Record<string, string[]> = {
	default: ["default-cover-"],
	daily: ["daily-cover-", "default-cover-"],
	notes: ["notes-cover-", "default-cover-"],
	technical: ["technical-cover-", "default-cover-"],
};

const publicCoverCache = new Map<string, string[]>();

function normalize(value: string | null | undefined): string {
	return typeof value === "string" ? value.trim() : "";
}

function stableHash(value: string): number {
	let hash = 2166136261;
	for (const character of value) {
		hash ^= character.codePointAt(0) ?? 0;
		hash = Math.imul(hash, 16777619);
	}
	return hash >>> 0;
}

function collectImages(
	directory: string,
	relativeDirectory = "",
): Array<{ relativePath: string; name: string }> {
	try {
		return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
			const relativePath = path.join(relativeDirectory, entry.name);
			const absolutePath = path.join(directory, entry.name);
			if (entry.isDirectory()) {
				return collectImages(absolutePath, relativePath);
			}
			if (
				!entry.isFile() ||
				!imageExtensions.has(path.extname(entry.name).toLowerCase())
			) {
				return [];
			}
			return [{ relativePath, name: entry.name.toLowerCase() }];
		});
	} catch {
		return [];
	}
}

function getPublicCoverCandidates(preset: string): string[] {
	const normalizedPreset = presetPrefixes[preset] ? preset : "default";
	const cached = publicCoverCache.get(normalizedPreset);
	if (cached) return cached;

	const uploadsDirectory = path.join(process.cwd(), "public", "uploads");
	const prefixes = presetPrefixes[normalizedPreset];
	const candidates = collectImages(uploadsDirectory)
		.filter(({ name }) => prefixes.some((prefix) => name.startsWith(prefix)))
		.sort((a, b) => a.relativePath.localeCompare(b.relativePath, "en"))
		.map(
			({ relativePath }) =>
				`/uploads/${relativePath.split(path.sep).join("/")}`,
		);

	publicCoverCache.set(normalizedPreset, candidates);
	return candidates;
}

function resolveCoverPreset(
	preset: string,
	slug: string,
	fallback: string,
): string {
	if (preset === "none") return "";

	const candidates = getPublicCoverCandidates(preset);
	if (candidates.length > 0) {
		return candidates[stableHash(`${preset}:${slug}`) % candidates.length];
	}

	return fallback;
}

export function resolvePostBanner(
	input: Pick<PostMediaInput, "banner">,
	fallback: string,
): { banner: string; hasCustomBanner: boolean } {
	const rawBanner = normalize(input.banner);
	return {
		banner: rawBanner || fallback,
		hasCustomBanner: rawBanner.length > 0,
	};
}

export function resolveBannerPosition(
	value: string | null | undefined,
	fallback: BannerPosition,
): BannerPosition {
	return value === "top" || value === "center" || value === "bottom"
		? value
		: fallback;
}

export function resolvePostMedia(
	input: PostMediaInput,
	slug: string,
	fallbacks: PostMediaFallbacks,
): ResolvedPostMedia {
	const rawImage = normalize(input.image);
	const coverPreset = normalize(input.coverPreset);
	const cover =
		rawImage ||
		resolveCoverPreset(coverPreset || "default", slug, fallbacks.cover);
	const banner = resolvePostBanner(input, fallbacks.banner);

	return {
		cover,
		banner: banner.banner,
		bannerPosition: resolveBannerPosition(
			input.bannerPosition,
			fallbacks.bannerPosition,
		),
		hasCustomBanner: banner.hasCustomBanner,
	};
}
