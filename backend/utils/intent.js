const detectIntent = (message) => {
  const msg = message.toLowerCase();

  // 🔥 recommendation keywords
  if (
    msg.includes("recommend") ||
    msg.includes("suggest") ||
    msg.includes("show me") ||
    msg.includes("give me") ||
    msg.includes("watch") ||
    msg.includes("movies") ||
    msg.includes("shows")
  ) {
    return "recommend";
  }

  if (msg.includes("more")) return "more";

  if (msg.includes("like") || msg.includes("similar")) return "similar";

  if (msg.includes("actor") || msg.includes("tom cruise")) return "actor";

  if (
    msg.includes("genre") ||
    msg.includes("comedy") ||
    msg.includes("action") ||
    msg.includes("fantasy") ||
    msg.includes("magic")
  ) {
    return "genre";
  }

  if (["yes", "yeah", "ok"].includes(msg.trim())) return "confirm";

  return "chat";
};

export default detectIntent;