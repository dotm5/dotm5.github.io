export const PAGE_SIZE = 8;

// Daily notes are intentionally kept out of the main timeline and exposed
// through the explicit archive category filter only.
export const DAILY_CATEGORY = "日常";

export function isDailyCategory(category: string | null | undefined): boolean {
	return typeof category === "string" && category.trim() === DAILY_CATEGORY;
}

export const LIGHT_MODE = "light",
	DARK_MODE = "dark",
	AUTO_MODE = "auto";
export const DEFAULT_THEME = AUTO_MODE;

// Banner height unit: vh
export const BANNER_HEIGHT = 35;
export const BANNER_HEIGHT_EXTEND = 30;
export const BANNER_HEIGHT_HOME = BANNER_HEIGHT + BANNER_HEIGHT_EXTEND;

// The height the main panel overlaps the banner, unit: rem
export const MAIN_PANEL_OVERLAPS_BANNER_HEIGHT = 3.5;

// Page width: rem
export const PAGE_WIDTH = 75;
