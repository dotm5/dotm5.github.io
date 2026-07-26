import type {
	ExpressiveCodeConfig,
	LicenseConfig,
	NavBarConfig,
	ProfileConfig,
	SiteConfig,
} from "./types/config";
import { LinkPreset } from "./types/config";

export const siteConfig: SiteConfig = {
	title: "图形与创作笔记",
	subtitle: "Blender · Rendering · Shader · AI",
	lang: "zh_CN", // Language code, e.g. 'en', 'zh_CN', 'ja', etc.
	themeColor: {
		hue: 235, // Blue-violet accent for the site identity
		fixed: true, // Keep the first-release palette consistent
	},
	banner: {
		enable: true,
		src: "/branding/banner.svg", // Relative to /public because the path starts with '/'
		position: "center", // Equivalent to object-position, only supports 'top', 'center', 'bottom'. 'center' by default
		credit: {
			enable: false, // Display the credit text of the banner image
			text: "", // Credit text to be displayed
			url: "", // (Optional) URL link to the original artwork or artist's page
		},
	},
	toc: {
		enable: true, // Display the table of contents on the right side of the post
		depth: 2, // Maximum heading depth to show in the table, from 1 to 3
	},
	favicon: [
		{
			src: "/favicon/favicon.svg",
			sizes: "any",
		},
		{
			src: "/favicon/favicon-32x32.png",
			sizes: "32x32",
		},
	],
};

export const navBarConfig: NavBarConfig = {
	links: [
		LinkPreset.Home,
		LinkPreset.Archive,
		LinkPreset.Projects,
		LinkPreset.About,
	],
};

export const profileConfig: ProfileConfig = {
	avatar: "/branding/avatar.svg",
	name: "Tao",
	bio: "记录三维创作、实时渲染、Shader、AI 与个人工具实验。",
	links: [
		{
			name: "GitHub",
			icon: "fa6-brands:github",
			url: "https://github.com/dotm5",
		},
	],
};

export const licenseConfig: LicenseConfig = {
	enable: false,
	name: "All Rights Reserved",
	url: "",
};

export const expressiveCodeConfig: ExpressiveCodeConfig = {
	// Note: Some styles (such as background color) are being overridden, see the astro.config.mjs file.
	// Please select a dark theme, as this blog theme currently only supports dark background color
	theme: "github-dark",
};
