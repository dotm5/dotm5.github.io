import rss from "@astrojs/rss";
import { getSortedPosts } from "@utils/content-utils";
import { url } from "@utils/url-utils";
import type { APIContext } from "astro";
import { siteConfig } from "@/config";
import { resolvePostAsset } from "../utils/post-assets";
import { renderRssContent } from "../utils/rss-content";

export async function GET(context: APIContext) {
	const blog = await getSortedPosts({ includeDaily: false });
	const site = context.site ?? new URL("https://dotm5.github.io");

	return rss({
		title: siteConfig.title,
		description: siteConfig.subtitle || "No description",
		site,
		items: blog.map((post) => {
			const content =
				typeof post.body === "string" ? post.body : String(post.body || "");
			const link = url(`/posts/${post.slug}/`);
			return {
				title: post.data.title,
				pubDate: post.data.published,
				description: post.data.description || "",
				link,
				content: renderRssContent(content, new URL(link, site), (source) =>
					resolvePostAsset(source, post.id),
				),
			};
		}),
		customData: `<language>${siteConfig.lang}</language>`,
	});
}
