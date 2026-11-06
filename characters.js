// ===== PLAYER CHARACTERS =====
// TO ADD A NEW AGENT: upload a full-body picture (standing, facing forward, face in the upper middle,
// like the others) and add ONE line at the end of the list, for example:
//   { code: 'NINJA', img: 'ninja.jpg' },
// That's enough - the game guesses the face/shirt/pants areas and colors automatically.
// Optional extras to fine-tune (all positions are fractions 0-1 of the picture: [left, top, width, height]):
//   face:[...]  shirt:[...]  pants:[...]   hair: 'short'|'curly'|'long'|'dreads'|'fur'|'hat'|'bald'
//   hairColor, beard (color), hat (color), skin, shoes  (colors are hex like 0x6a4020)
export const CHARACTERS = [
  { code: 'VIPER', img: 'dreads.jpg', face: [0.375, 0.15, 0.23, 0.2], shirt: [0.40, 0.385, 0.17, 0.09], pants: [0.40, 0.74, 0.07, 0.09],
    hair: 'dreads', shortSleeves: true, hairColor: 0x2a2016, skin: 0x9a6a50, shoes: 0x2a2a2a, chain: 0xd8b030 },
  { code: 'FROST', img: 'hoodie.jpg', face: [0.36, 0.121, 0.286, 0.225], shirt: [0.42, 0.37, 0.16, 0.07], pants: [0.40, 0.75, 0.07, 0.08],
    hair: 'short', hairColor: 0x6a4424, skin: 0xe0a080, shoes: 0x5a3a20, hood: 0xe8e8e8 },
  { code: 'BULLDOG', img: 'vest.jpg', face: [0.311, 0.12, 0.293, 0.243], shirt: [0.37, 0.385, 0.17, 0.07], pants: [0.36, 0.75, 0.07, 0.08],
    hair: 'curly', hairColor: 0x3a2818, skin: 0xd09070, shoes: 0x2a2a2a, sleeves: 0x3a3a3a },
  { code: 'YETI', img: 'yeti.jpg', face: [0.33, 0.13, 0.37, 0.31], shirt: [0.37, 0.585, 0.3, 0.08], pants: [0.39, 0.76, 0.08, 0.08],
    hair: 'fur', hairColor: 0xf0f0f0, skin: 0xd8b8a0, shoes: 0xe0c0a0, sleeves: 0xc8c8c0 },
  { code: 'JADE', img: 'denim.jpg', face: [0.339, 0.113, 0.332, 0.276], shirt: [0.37, 0.42, 0.25, 0.12], pants: [0.40, 0.76, 0.08, 0.08],
    hair: 'long', hairColor: 0x7a4e2c, skin: 0xe0a080, shoes: 0x5a3820 },
  { code: 'OUTLAW', img: 'cowboy.jpg', face: [0.35, 0.19, 0.26, 0.19], shirt: [0.40, 0.40, 0.16, 0.07], pants: [0.40, 0.76, 0.07, 0.08],
    hair: 'hat', hat: 0x6a4428, hairColor: 0x9a4a20, beard: 0xa8522a, skin: 0xd8a080, shoes: 0x5a3820 },
  { code: 'TARTAN', img: 'plaid.jpg', face: [0.359, 0.093, 0.276, 0.229], shirt: [0.40, 0.35, 0.19, 0.12], pants: [0.39, 0.76, 0.08, 0.08],
    hair: 'short', hairColor: 0x18140f, skin: 0xd09068, shoes: 0x1a1a1a },
];
