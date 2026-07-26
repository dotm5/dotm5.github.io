import type {
	ExpressiveCodeConfig,
	LicenseConfig,
	NavBarConfig,
	ProfileConfig,
	SiteConfig,
} from "./types/config";
import { siteSettings } from "./config/site-settings";
import { LinkPreset } from "./types/config";

export const siteConfig: SiteConfig = {
	title: siteSettings.site.title,
	subtitle: siteSettings.site.subtitle,
	lang: siteSettings.site.language,
	themeColor: {
		hue: siteSettings.theme.hue,
		fixed: siteSettings.theme.fixed,
	},
	banner: {
		enable: siteSettings.banner.enabled,
		src: "/branding/banner.svg", // Relative to /public because the path starts with '/'
		position: siteSettings.banner.position,
		credit: {
			enable: false, // Display the credit text of the banner image
			text: "", // Credit text to be displayed
			url: "", // (Optional) URL link to the original artwork or artist's page
		},
	},
	toc: {
		enable: siteSettings.content.tableOfContents,
		depth: siteSettings.content.tocDepth,
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
	name: siteSettings.profile.name,
	bio: siteSettings.profile.bio,
	links: [
		{
			name: "GitHub",
			icon: "fa6-brands:github",
			url: siteSettings.profile.githubUrl,
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
