// Real facts about Jagrit, in his words where possible. Designs may rephrase
// and pick, but should not invent facts beyond these.

export const person = {
  name: "Jagrit Gumber",
  first: "Jagrit",
  // His own line. The headline idea.
  line: "Turning into a better learner every day.",
  // His own line. Belongs near the close/footer.
  close: "If you tell me I'm wrong, I don't want to be right.",
  voice: "Bold, first person, opinionated, inspiring more than safe.",
  open: "Open to talk, always.",
  mail: "gumberjagrit@gmail.com",
  github: "https://github.com/JagritGumber",
  site: "https://jagritgumber.com",
  obsessed: ["TypeScript", "Rust", "Python"],
  // He will never leave game development and pixel art.
  loves: ["game development", "pixel art", "clean, fluid, animated UI"],
};

export type Work = {
  id: "chiki" | "autterly" | "wss";
  title: string;
  what: string;
  line: string;
  detail: string;
  status: string;
  url?: string;
};

export const works: Work[] = [
  {
    id: "chiki",
    title: "Chiki",
    what: "A puzzle game",
    line: "Knock pieces through each other until the board is quiet.",
    detail: "A jam game about collisions that should be illegal. Fourth overall at SoloDevelopment Jam #6.",
    status: "Shipped",
  },
  {
    id: "autterly",
    title: "Autterly",
    what: "A phone assistant",
    line: "Your phone should already know what you meant.",
    detail: "An agent that lives on the device: memory, tools, opens the app, plays the music, sorts the junk. The loop stays on the phone.",
    status: "Building",
  },
  {
    id: "wss",
    title: "World's Smallest Studio",
    what: "A studio",
    line: "A small house for the things I refuse to make ugly.",
    detail: "The studio I build my apps under. Apps should match. Progress should be visible. If a sign-in feels cheap, it is wrong.",
    status: "Building",
    url: "https://worldssmalleststudio.com",
  },
];

// PLACEHOLDER opinions, drafted from what he said in conversation. He will
// replace them with his own. Short, first person, unhedged.
export const opinions = [
  "If a sign-in feels cheap, the whole product is cheap.",
  "Motion is information. If it moves, it should tell you something.",
  "A portfolio that only says what I can do for you is a resume in a costume.",
  "Games taught me more about software than software did.",
  "Pixels are a constraint, not a nostalgia.",
];
