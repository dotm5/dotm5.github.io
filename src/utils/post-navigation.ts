import { isDailyCategory } from "../constants/constants.ts";

type NavigablePost = {
	slug: string;
	data: { title: string; category?: string | null };
};

// Keep the route order, with independent navigation chains for each audience.
export function withPostNavigation<T extends NavigablePost>(posts: T[]) {
	const result = posts.map((post) => ({
		...post,
		data: {
			...post.data,
			nextSlug: "",
			nextTitle: "",
			prevSlug: "",
			prevTitle: "",
		},
	}));
	const groups = [
		result.filter((post) => !isDailyCategory(post.data.category)),
		result.filter((post) => isDailyCategory(post.data.category)),
	];
	for (const group of groups) {
		group.forEach((post, index) => {
			const next = group[index - 1];
			const prev = group[index + 1];
			post.data.nextSlug = next?.slug ?? "";
			post.data.nextTitle = next?.data.title ?? "";
			post.data.prevSlug = prev?.slug ?? "";
			post.data.prevTitle = prev?.data.title ?? "";
		});
	}
	return result;
}
