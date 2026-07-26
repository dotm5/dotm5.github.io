export type AccentName = "rose" | "leaf" | "sky" | "sun";

const accentKeywords: Record<AccentName, readonly string[]> = {
	rose: ["blender", "art", "creative", "创作", "艺术", "设计"],
	sky: ["shader", "rendering", "render", "ue", "unreal", "渲染"],
	leaf: ["ai", "tools", "tool", "projects", "project", "工具", "项目"],
	sun: ["notes", "note", "review", "pending", "笔记", "复盘", "待整理"],
};

function normalize(value: string): string {
	return value.trim().toLocaleLowerCase("en-US");
}

function matchesKeyword(candidate: string, keyword: string): boolean {
	const isShortLatinKeyword = /^[a-z]{1,3}$/u.test(keyword);
	if (!isShortLatinKeyword) return candidate.includes(keyword);

	const words = candidate.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
	return words.some(
		(word) =>
			word === keyword ||
			(keyword === "ue" && /^ue\d*$/u.test(word)) ||
			(keyword === "ai" && /^ai\d*$/u.test(word)),
	);
}

export function getAccentForPost(
	category: string | null | undefined,
	tags: readonly string[] = [],
): AccentName {
	const candidates = [category ?? "", ...tags].map(normalize).filter(Boolean);

	for (const accent of ["rose", "sky", "leaf", "sun"] as const) {
		if (
			candidates.some((candidate) =>
				accentKeywords[accent].some((keyword) =>
					matchesKeyword(candidate, keyword),
				),
			)
		) {
			return accent;
		}
	}

	return "rose";
}
