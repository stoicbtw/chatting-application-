// Curated, lightweight emoji set for the picker (no heavy dependency).
// Grouped + searchable by keyword.

export type EmojiGroup = { name: string; icon: string; emojis: string[] };

export const EMOJI_GROUPS: EmojiGroup[] = [
  {
    name: "Smileys",
    icon: "😊",
    emojis: [
      "😀","😁","😂","🤣","😊","😇","🙂","🙃","😉","😌","😍","🥰","😘","😗","😙","😚",
      "😋","😛","😝","🤪","🤩","🥳","😎","🤓","🧐","🤗","🤭","🫢","🤫","🤔","🫡","🤥",
      "😶","😐","😑","😬","🙄","😯","😴","🤤","😪","😵","🥴","🤐","🥺","😢","😭","😤",
      "😠","🤯","😳","🥵","🥶","😱","😨","😰","😥","😓","🤧","🤒","🤕","🤢","🤮","😈",
    ],
  },
  {
    name: "Love",
    icon: "💖",
    emojis: [
      "❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖",
      "💘","💝","💟","💌","😻","🥰","😍","😘","💋","🫶","🤗","💐","🌹","🌷","🌸","💍",
    ],
  },
  {
    name: "Cute",
    icon: "🐰",
    emojis: [
      "🐰","🐱","🐶","🐻","🐼","🐨","🦊","🐹","🐭","🐤","🐥","🐧","🦄","🐳","🐙","🦋",
      "🌈","⭐","🌟","✨","💫","☁️","🌙","🍓","🍰","🧁","🍩","🍪","🍡","🍵","🧸","🎀",
      "🌻","🍀","🌼","🐝","🪐","🫧","🩷","🪻","🦦","🐣",
    ],
  },
  {
    name: "Hands",
    icon: "👋",
    emojis: [
      "👋","🤚","✋","🖐️","👌","🤌","🤏","✌️","🤞","🫰","🤟","🤘","👈","👉","👆","👇",
      "👍","👎","✊","👊","🤛","🤜","👏","🙌","👐","🤲","🙏","💪","🫶","🤝","✍️",
    ],
  },
  {
    name: "Fun",
    icon: "🎉",
    emojis: [
      "🎉","🎊","🥳","🎈","🎁","🎀","🪅","🎆","🎇","🪩","🍾","🥂","🍻","🎮","🎲","🧩",
      "🎵","🎶","🎤","🎧","🔥","💥","💯","✅","❌","❓","❗","💤","💢","💦","🫧","🌊",
    ],
  },
];

export const QUICK_REACTIONS = ["❤️", "😂", "🥰", "😮", "😢", "🔥", "👍", "🎉"];

export function searchEmoji(query: string): string[] {
  const q = query.trim().toLowerCase();
  const all = EMOJI_GROUPS.flatMap((g) => g.emojis);
  if (!q) return all;
  // tiny keyword map for common searches
  const map: Record<string, string[]> = {
    heart: ["❤️","🧡","💛","💚","💙","💜","🩷","💕","💖","💗","💓","💞"],
    love: ["🥰","😍","😘","💕","💖","🫶","💌"],
    cry: ["😭","😢","🥺","😥"],
    laugh: ["😂","🤣","😆","😹"],
    cat: ["🐱","😻","😸"],
    dog: ["🐶","🐕"],
    sad: ["😢","😭","🥺","😔"],
    happy: ["😀","😁","😊","🥰","😄"],
    star: ["⭐","🌟","✨","💫"],
    bunny: ["🐰","🐇"],
    food: ["🍓","🍰","🧁","🍩","🍪","🍡","🍵"],
  };
  const matched = new Set<string>();
  for (const [k, v] of Object.entries(map)) if (k.includes(q)) v.forEach((e) => matched.add(e));
  return matched.size ? [...matched] : all;
}
