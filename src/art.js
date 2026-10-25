// Shaded illustrations (gradients, no outlines) used as halftone sources.
// Tone drives dot size, so the gradients are what give the dot field its volume.

const wrap = (inner) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 200 200">${inner}</svg>`;

const rg = (id, cx, cy, r, stops) =>
  `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops
    .map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`)
    .join("")}</radialGradient>`;
const lg = (id, stops, x2 = 1, y2 = 0) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops
    .map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`)
    .join("")}</linearGradient>`;

const PEAR = "M100 12C142 12 166 70 166 122C166 166 138 190 100 190C62 190 34 166 34 122C34 70 58 12 100 12Z";
const FLESH = "M100 28C134 28 152 76 152 122C152 156 130 174 100 174C70 174 48 156 48 122C48 76 66 28 100 28Z";

const oliveTones = {
  green: ["#E4EE92", "#8BA832", "#3F5C18"],
  black: ["#9A86A3", "#43304A", "#150D19"],
};
const glassTones = {
  green: ["#5FA070", "#2B6A40", "#12301F"],
  amber: ["#F2C060", "#C07C1C", "#6B3F08"],
};

const arts = {
  avocado: () => `
    <defs>
      ${rg("s", ".38", ".3", ".85", [[0, "#7DB04C"], [0.6, "#3F7028"], [1, "#274A1B"]])}
      ${rg("f", ".5", ".62", ".6", [[0, "#FBF8C4"], [0.55, "#DCE585"], [1, "#9CBB4E"]])}
      ${rg("p", ".36", ".3", ".85", [[0, "#D89C66"], [0.55, "#955A33"], [1, "#4E2B17"]])}
    </defs>
    <path d="${PEAR}" fill="url(#s)"/>
    <path d="${FLESH}" fill="url(#f)"/>
    <circle cx="100" cy="128" r="34" fill="url(#p)"/>
    <ellipse cx="88" cy="114" rx="9" ry="12" fill="#fff" fill-opacity=".38"/>`,

  avocadoWhole: () => `
    <defs>
      ${rg("s", ".34", ".28", ".9", [[0, "#9ACB62"], [0.45, "#4C8030"], [1, "#1E3A14"]])}
    </defs>
    <path d="M96 10Q100 0 108 4" stroke="#6B4A24" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="${PEAR}" fill="url(#s)"/>
    <ellipse cx="78" cy="70" rx="14" ry="26" fill="#fff" fill-opacity=".3" transform="rotate(-14 78 70)"/>`,

  olive: (v = "green") => {
    const [a, b, c] = oliveTones[v] || oliveTones.green;
    return `
    <defs>${rg("o", ".36", ".3", ".85", [[0, a], [0.5, b], [1, c]])}</defs>
    <g transform="rotate(26 100 104)">
      <path d="M100 38Q106 18 126 12" stroke="#6B7A2A" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M118 16Q132 4 146 14Q132 26 118 16Z" fill="#6E9B30"/>
      <ellipse cx="100" cy="106" rx="50" ry="68" fill="url(#o)"/>
      <ellipse cx="100" cy="166" rx="13" ry="8" fill="#C8432B"/>
      <ellipse cx="80" cy="76" rx="8" ry="22" fill="#fff" fill-opacity="${v === "black" ? 0.45 : 0.5}"/>
    </g>`;
  },

  lemon: () => `
    <defs>${rg("l", ".38", ".32", ".85", [[0, "#FFF6A0"], [0.5, "#F6CE2A"], [1, "#B88400"]])}</defs>
    <g transform="rotate(-24 100 100)">
      <path d="M16 100Q28 96 38 90C58 36 142 36 162 90Q172 96 184 100Q172 104 162 110C142 164 58 164 38 110Q28 104 16 100Z" fill="url(#l)"/>
      <path d="M62 66Q82 52 108 54" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="7" stroke-linecap="round"/>
      <path d="M100 52Q100 28 124 22Q126 46 100 52Z" fill="#6E9B30"/>
    </g>`,

  lemonSlice: () => {
    let wedges = "";
    for (let i = 0; i < 9; i++) {
      const a0 = (i / 9) * Math.PI * 2 + 0.06, a1 = ((i + 1) / 9) * Math.PI * 2 - 0.06;
      const p = (a, r) => `${100 + Math.cos(a) * r} ${100 + Math.sin(a) * r}`;
      wedges += `<path d="M${p(a0, 9)}L${p(a0, 66)}A66 66 0 0 1 ${p(a1, 66)}L${p(a1, 9)}Z" fill="${i % 2 ? "#F7DA55" : "#FBE981"}"/>`;
    }
    return `
    <defs>${rg("r", ".5", ".5", ".5", [[0.86, "#F0B820"], [1, "#B88400"]])}</defs>
    <circle cx="100" cy="100" r="88" fill="url(#r)"/>
    <circle cx="100" cy="100" r="76" fill="#FFF7C8"/>
    ${wedges}
    <circle cx="100" cy="100" r="8" fill="#FFF7C8"/>`;
  },

  bottle: (v = "green") => {
    const [a, b, c] = glassTones[v] || glassTones.green;
    return `
    <defs>${lg("g", [[0, c], [0.3, a], [0.55, b], [1, c]])}</defs>
    <rect x="86" y="8" width="28" height="26" rx="6" fill="#D9A441"/>
    <path d="M90 34H110V58C110 72 140 80 140 112V176Q140 192 124 192H76Q60 192 60 176V112C60 80 90 72 90 58Z" fill="url(#g)"/>
    <rect x="68" y="104" width="64" height="54" rx="5" fill="#F3ECD2"/>
    <path d="M84 138Q100 116 116 138Q100 150 84 138Z" fill="#6E9B30"/>
    <rect x="78" y="146" width="44" height="3" fill="#15130C" fill-opacity=".7"/>
    <rect x="86" y="152" width="28" height="2.5" fill="#15130C" fill-opacity=".45"/>
    <path d="M72 66V96M72 168V180" stroke="#fff" stroke-opacity=".5" stroke-width="6" stroke-linecap="round"/>`;
  },
};

export const artSVG = (type, variant) => wrap(arts[type](variant));
