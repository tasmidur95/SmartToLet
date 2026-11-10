// Illustrated apartment-block scene used behind the home banner (swap for a photo via .hero-photo in styles.css).
const BLOCKS = [
  { x: 560, w: 150, h: 300, c: '#e9d8c4' },
  { x: 720, w: 190, h: 360, c: '#f1f5f9' },
  { x: 920, w: 170, h: 270, c: '#d9c2a6' },
  { x: 1100, w: 200, h: 330, c: '#e8eef3' },
];

function Windows({ x, w, h, i }) {
  const cols = Math.floor(w / 34);
  const rows = Math.floor(h / 46);
  const out = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lit = (r * 7 + c * 3 + i) % 5 === 0;
      out.push(
        <rect key={`${r}-${c}`} className={lit ? 'win lit' : 'win'} x={x + 12 + c * 34} y={420 - h + 16 + r * 46} width="20" height="28" rx="2" style={{ animationDelay: `${((r + c + i) % 6) * 0.7}s` }} />
      );
    }
  }
  return out;
}

export default function HeroArt() {
  return (
    <svg className="hero-art" viewBox="0 0 1440 420" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="ha-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9bd3e6" />
          <stop offset="1" stopColor="#e6f4ea" />
        </linearGradient>
      </defs>
      <rect width="1440" height="420" fill="url(#ha-sky)" />
      <g className="cloud c1" fill="#fff" opacity=".8"><ellipse cx="300" cy="70" rx="70" ry="18" /><ellipse cx="350" cy="58" rx="45" ry="16" /></g>
      <g className="cloud c2" fill="#fff" opacity=".7"><ellipse cx="900" cy="40" rx="80" ry="18" /><ellipse cx="950" cy="30" rx="50" ry="14" /></g>
      {BLOCKS.map((b, i) => (
        <g key={b.x}>
          <rect x={b.x} y={420 - b.h} width={b.w} height={b.h} fill={b.c} />
          <rect x={b.x} y={420 - b.h} width={b.w} height="8" fill="#b08968" />
          <Windows x={b.x} w={b.w} h={b.h} i={i} />
        </g>
      ))}
      <g fill="#14532d">
        <circle cx="520" cy="360" r="70" /><circle cx="610" cy="390" r="55" />
        <circle cx="1040" cy="385" r="60" /><circle cx="1290" cy="370" r="75" /><circle cx="1400" cy="395" r="55" />
        <circle cx="40" cy="340" r="90" /><circle cx="170" cy="380" r="70" />
      </g>
      <rect y="405" width="1440" height="15" fill="#166534" />
    </svg>
  );
}
