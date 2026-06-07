export function descriptionParts(text = "") {
  const parts = [];
  const regex = /#[\p{L}\p{N}_]+/gu;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        value: text.slice(lastIndex, match.index),
      });
    }

    parts.push({
      type: "hashtag",
      value: match[0],
      tag: match[0].slice(1).toLowerCase(),
    });

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({
      type: "text",
      value: text.slice(lastIndex),
    });
  }

  return parts;
}
