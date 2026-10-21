import MarkdownIt from "markdown-it";
import sanitizeHtml from "sanitize-html";

const parser = new MarkdownIt();

export function renderRssContent(
	body: string,
	postUrl: URL,
	resolveImage: (source: string) => string = (source) => source,
): string {
	const cleanedContent = body.replace(
		// biome-ignore lint/suspicious/noControlCharactersInRegex: XML 1.0 character range
		/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\uFDD0-\uFDEF\uFFFE\uFFFF]/g,
		"",
	);
	return sanitizeHtml(parser.render(cleanedContent), {
		allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
		transformTags: {
			img: (tagName, attributes) => ({
				tagName,
				attribs: {
					...attributes,
					src: new URL(resolveImage(attributes.src), postUrl).href,
				},
			}),
		},
	});
}
