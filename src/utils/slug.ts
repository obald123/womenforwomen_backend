import slugify from "slugify";

export function toSlug(text: string) {
  return slugify(text, { lower: true, strict: true, trim: true });
}