import { isDailyCategory } from "../constants/constants.ts";

type ArchivePost = {
	data: { tags: string[]; category?: string | null };
};

export function filterArchivePosts<T extends ArchivePost>(
	posts: T[],
	filters: { tags: string[]; categories: string[]; uncategorized?: boolean },
): T[] {
	const { tags, categories, uncategorized } = filters;
	return posts.filter((post) => {
		const category = post.data.category?.trim();
		const matchesCategory =
			categories.length > 0
				? !!post.data.category &&
					categories.some((selected) => selected.trim() === category)
				: !isDailyCategory(category);
		return (
			matchesCategory &&
			(tags.length === 0 || post.data.tags.some((tag) => tags.includes(tag))) &&
			(!uncategorized || !post.data.category)
		);
	});
}
