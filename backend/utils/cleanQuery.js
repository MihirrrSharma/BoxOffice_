const STOP_WORDS = new Set([
  "show","me","give","suggest","recommend",
  "some","good","best","movies","movie","films",
  "please","want","to","watch","looking","for",
  "can","you","i","need","a","an","the",
  "is","are","was","were","with","like",
  "tell","about","find","get","fetch"
]);

export const cleanQuery = (text = "") => {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(" ")
    .filter((word) => word && !STOP_WORDS.has(word))
    .slice(0, 3) // limit noise
    .join(" ")
    .trim();
};