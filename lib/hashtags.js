export function extractHashtags(text = "") {
  const matches = text.match(/#[\p{L}\p{N}_]+/gu) || [];
  const tags = matches.map((tag) => tag.slice(1).toLowerCase());
  return [...new Set(tags)];
}
