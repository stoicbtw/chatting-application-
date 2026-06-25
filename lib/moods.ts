// Preset moods you can set for yourself. Shown next to your name.
export const MOODS: { emoji: string; label: string }[] = [
  { emoji: "😊", label: "happy" },
  { emoji: "🥰", label: "in love" },
  { emoji: "😴", label: "sleepy" },
  { emoji: "🥺", label: "miss you" },
  { emoji: "😋", label: "hungry" },
  { emoji: "🤔", label: "thinking" },
  { emoji: "😎", label: "chilling" },
  { emoji: "😭", label: "emotional" },
  { emoji: "🤒", label: "not great" },
  { emoji: "😤", label: "grumpy" },
  { emoji: "🥳", label: "excited" },
  { emoji: "🧠", label: "busy" },
  { emoji: "☕", label: "need coffee" },
  { emoji: "🎮", label: "gaming" },
  { emoji: "📚", label: "studying" },
  { emoji: "🫠", label: "melting" },
];

// Avatar emojis you can pick as your "face"
export const AVATARS = [
  "🐰","🐱","🐶","🐻","🐼","🐨","🦊","🐹","🐸","🐯","🦁","🐮","🐷","🐵","🐧","🐤",
  "🦄","🐙","🦋","🐝","🐢","🦦","🦝","🐲","🌸","🌷","🍓","🍑","🌙","⭐","☁️","🍙",
];

// Pet evolves with XP (1 xp per message you send)
export const PET_STAGES = [
  { at: 0,   emoji: "🥚", title: "egg" },
  { at: 10,  emoji: "🐣", title: "hatchling" },
  { at: 40,  emoji: "🐤", title: "baby" },
  { at: 100, emoji: "🐥", title: "fluffy" },
  { at: 250, emoji: "🐔", title: "grown" },
  { at: 500, emoji: "🦄", title: "magical" },
  { at: 1000,emoji: "🐉", title: "legendary" },
];

export function petStage(xp: number) {
  let stage = PET_STAGES[0];
  for (const s of PET_STAGES) if (xp >= s.at) stage = s;
  const next = PET_STAGES.find((s) => s.at > xp);
  return { ...stage, next, xp };
}
