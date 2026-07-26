import rawSiteSettings from "../data/site.json";

const supportedLanguages = [
	"en",
	"zh_CN",
	"zh_TW",
	"ja",
	"ko",
	"es",
	"th",
	"vi",
	"tr",
	"id",
] as const;
const bannerPositions = ["top", "center", "bottom"] as const;
const layoutWidths = ["compact", "balanced", "wide"] as const;
const cornerStyles = ["compact", "soft", "round"] as const;
const surfaceStyles = ["solid", "glass"] as const;

type SupportedLanguage = (typeof supportedLanguages)[number];
type BannerPosition = (typeof bannerPositions)[number];
type LayoutWidth = (typeof layoutWidths)[number];
type CornerStyle = (typeof cornerStyles)[number];
type SurfaceStyle = (typeof surfaceStyles)[number];
type UnknownRecord = Record<string, unknown>;

export type SiteSettings = {
	site: {
		title: string;
		subtitle: string;
		language: SupportedLanguage;
	};
	profile: {
		name: string;
		bio: string;
		githubUrl: string;
	};
	theme: {
		hue: number;
		fixed: boolean;
	};
	banner: {
		enabled: boolean;
		position: BannerPosition;
	};
	content: {
		tableOfContents: boolean;
		tocDepth: 1 | 2 | 3;
	};
	layout: {
		width: LayoutWidth;
		corners: CornerStyle;
		surface: SurfaceStyle;
	};
};

function fail(path: string, message: string): never {
	throw new Error(`站点设置无效（${path}）：${message}`);
}

function expectRecord(value: unknown, path: string): UnknownRecord {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		fail(path, "必须是对象");
	}
	return value as UnknownRecord;
}

function expectExactKeys(
	value: UnknownRecord,
	path: string,
	keys: readonly string[],
): void {
	const expected = new Set(keys);
	const unexpected = Object.keys(value).filter((key) => !expected.has(key));
	if (unexpected.length > 0) {
		fail(path, `包含未授权字段：${unexpected.join(", ")}`);
	}
	for (const key of keys) {
		if (!(key in value)) {
			fail(path, `缺少字段 ${key}`);
		}
	}
}

function expectString(
	value: unknown,
	path: string,
	minLength: number,
	maxLength: number,
): string {
	if (typeof value !== "string") {
		fail(path, "必须是字符串");
	}
	const normalized = value.trim();
	if (
		normalized.length < minLength ||
		normalized.length > maxLength ||
		[...normalized].some((character) => {
			const codePoint = character.codePointAt(0) ?? 0;
			return codePoint <= 31 || codePoint === 127;
		})
	) {
		fail(path, `长度必须为 ${minLength}-${maxLength}，且不能包含控制字符`);
	}
	return normalized;
}

function expectBoolean(value: unknown, path: string): boolean {
	if (typeof value !== "boolean") {
		fail(path, "必须是 true 或 false");
	}
	return value;
}

function expectInteger(
	value: unknown,
	path: string,
	minimum: number,
	maximum: number,
): number {
	if (
		typeof value !== "number" ||
		!Number.isInteger(value) ||
		value < minimum ||
		value > maximum
	) {
		fail(path, `必须是 ${minimum}-${maximum} 之间的整数`);
	}
	return value;
}

function expectEnum<T extends string>(
	value: unknown,
	path: string,
	allowed: readonly T[],
): T {
	if (typeof value !== "string" || !allowed.includes(value as T)) {
		fail(path, `只允许：${allowed.join(", ")}`);
	}
	return value as T;
}

function expectGitHubProfile(value: unknown): string {
	const profileUrl = expectString(value, "profile.githubUrl", 19, 100);
	let parsed: URL;
	try {
		parsed = new URL(profileUrl);
	} catch {
		return fail("profile.githubUrl", "必须是有效的 HTTPS GitHub 个人主页");
	}
	if (
		parsed.protocol !== "https:" ||
		parsed.hostname !== "github.com" ||
		!/^\/[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})\/?$/u.test(parsed.pathname) ||
		parsed.search !== "" ||
		parsed.hash !== "" ||
		parsed.username !== "" ||
		parsed.password !== ""
	) {
		fail("profile.githubUrl", "只允许 https://github.com/<用户名>");
	}
	return profileUrl.replace(/\/$/u, "");
}

function validateSiteSettings(value: unknown): SiteSettings {
	const root = expectRecord(value, "root");
	expectExactKeys(root, "root", [
		"site",
		"profile",
		"theme",
		"banner",
		"content",
		"layout",
	]);

	const site = expectRecord(root.site, "site");
	expectExactKeys(site, "site", ["title", "subtitle", "language"]);
	const profile = expectRecord(root.profile, "profile");
	expectExactKeys(profile, "profile", ["name", "bio", "githubUrl"]);
	const theme = expectRecord(root.theme, "theme");
	expectExactKeys(theme, "theme", ["hue", "fixed"]);
	const banner = expectRecord(root.banner, "banner");
	expectExactKeys(banner, "banner", ["enabled", "position"]);
	const content = expectRecord(root.content, "content");
	expectExactKeys(content, "content", ["tableOfContents", "tocDepth"]);
	const layout = expectRecord(root.layout, "layout");
	expectExactKeys(layout, "layout", ["width", "corners", "surface"]);

	const tocDepth = expectInteger(content.tocDepth, "content.tocDepth", 1, 3);

	return {
		site: {
			title: expectString(site.title, "site.title", 1, 60),
			subtitle: expectString(site.subtitle, "site.subtitle", 1, 120),
			language: expectEnum(site.language, "site.language", supportedLanguages),
		},
		profile: {
			name: expectString(profile.name, "profile.name", 1, 40),
			bio: expectString(profile.bio, "profile.bio", 1, 240),
			githubUrl: expectGitHubProfile(profile.githubUrl),
		},
		theme: {
			hue: expectInteger(theme.hue, "theme.hue", 0, 360),
			fixed: expectBoolean(theme.fixed, "theme.fixed"),
		},
		banner: {
			enabled: expectBoolean(banner.enabled, "banner.enabled"),
			position: expectEnum(banner.position, "banner.position", bannerPositions),
		},
		content: {
			tableOfContents: expectBoolean(
				content.tableOfContents,
				"content.tableOfContents",
			),
			tocDepth: tocDepth as 1 | 2 | 3,
		},
		layout: {
			width: expectEnum(layout.width, "layout.width", layoutWidths),
			corners: expectEnum(layout.corners, "layout.corners", cornerStyles),
			surface: expectEnum(layout.surface, "layout.surface", surfaceStyles),
		},
	};
}

export const siteSettings = validateSiteSettings(rawSiteSettings);

const pageWidths: Record<LayoutWidth, number> = {
	compact: 68,
	balanced: 75,
	wide: 84,
};
const cardRadii: Record<CornerStyle, number> = {
	compact: 0.5,
	soft: 0.75,
	round: 1,
};
const cardSurfaces: Record<
	SurfaceStyle,
	{
		blurPx: number;
		backgroundLight: string;
		backgroundDark: string;
		shadowLight: string;
		shadowDark: string;
	}
> = {
	solid: {
		blurPx: 0,
		backgroundLight: "rgb(255 250 240)",
		backgroundDark: "rgb(40 33 35)",
		shadowLight: "0 16px 50px rgb(77 57 37 / 0.08)",
		shadowDark: "0 18px 55px rgb(0 0 0 / 0.24)",
	},
	glass: {
		blurPx: 12,
		backgroundLight: "rgb(255 250 240 / 0.91)",
		backgroundDark: "rgb(40 33 35 / 0.91)",
		shadowLight: "0 16px 50px rgb(77 57 37 / 0.08)",
		shadowDark: "0 18px 55px rgb(0 0 0 / 0.24)",
	},
};

const surface = cardSurfaces[siteSettings.layout.surface];

export const appearanceConfig = {
	pageWidthRem: pageWidths[siteSettings.layout.width],
	cardRadiusRem: cardRadii[siteSettings.layout.corners],
	cardBlurPx: surface.blurPx,
	cardBackgroundLight: surface.backgroundLight,
	cardBackgroundDark: surface.backgroundDark,
	cardShadowLight: surface.shadowLight,
	cardShadowDark: surface.shadowDark,
};
