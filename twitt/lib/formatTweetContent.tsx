export const formatTweetContent = (content: string) => {
  const parts = content.split(/(\s)/);
  return parts.map((word, i) => {
    if (word.startsWith("#")) return (
      <span key={i} style={{ color: "#1d9bf0", cursor: "pointer" }}
        onClick={e => { e.stopPropagation(); }}>
        {word}
      </span>
    );
    if (word.startsWith("@")) return (
      <span key={i} style={{ color: "#1d9bf0", cursor: "pointer" }}
        onClick={e => { e.stopPropagation(); }}>
        {word}
      </span>
    );
    return word;
  });
};