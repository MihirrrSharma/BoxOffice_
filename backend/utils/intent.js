const detectIntent = (message) => {
  const msg = message.toLowerCase();

  if (msg.includes("recommend") || msg.includes("suggest")) return "recommend";
  if (msg.includes("more")) return "more";
  if (msg.includes("like") || msg.includes("similar")) return "similar";
  if (msg.includes("actor") || msg.includes("tom cruise")) return "actor";
  if (msg.includes("genre") || msg.includes("comedy") || msg.includes("action")) return "genre";
  if (msg === "yes" || msg === "yeah") return "confirm";

  return "chat";
};

export default detectIntent;