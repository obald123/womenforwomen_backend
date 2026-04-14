import sanitizeHtml from "sanitize-html";

export function sanitizeContent(html: string) {
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "img",
      "h1",
      "h2",
      "h3",
      "u",
      "s",
      "b",
      "i",
      "em",
      "strong",
      "blockquote",
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ["src", "alt"],
      a: ["href", "name", "target", "rel"],
    },
  });
}
