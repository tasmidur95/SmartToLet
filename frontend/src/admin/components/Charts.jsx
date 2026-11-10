import { useId } from 'react';

const fmtK = (n) => (n >= 1000 ? `${Math.round(n / 100) / 10}k`.replace('.0k', 'k') : String(Math.round(n)));

/** Round the top of the scale up to a "nice" number so the gridlines read well (e.g. 1,000 / 2,500). */
function niceMax(max) {
  if (max <= 0) return 100;
  const pow = 10 ** Math.floor(Math.log10(max));
  const n = max / pow;
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return nice * pow;
}

/**
 * Two-series line chart in plain SVG.
 * data: [{label, a, b}]  a = main line (solid, filled), b = second line (dashed)
 */
export function LineChart({ data, colorA = '#16a34a', colorB = '#94a3b8' }) {
  const id = useId().replace(/:/g, '');
  const W = 560, H = 300, L = 46, R = 16, T = 14, B = 34;
  const max = niceMax(Math.max(...data.map((d) => Math.max(d.a, d.b)), 0));
  const x = (i) => L + (data.length === 1 ? (W - L - R) / 2 : (i * (W - L - R)) / (data.length - 1));
  const y = (v) => T + (1 - v / max) * (H - T - B);
  const line = (key) => data.map((d, i) => `${i ? 'L' : 'M'}${x(i)},${y(d[key])}`).join(' ');
  const ticks = [0, 1, 2, 3, 4].map((i) => (max * i) / 4);
  const empty = data.every((d) => d.a === 0 && d.b === 0);

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Payments by month">
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={colorA} stopOpacity=".22" />
          <stop offset="1" stopColor={colorA} stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="#e5ebe8" />
          <text x={L - 8} y={y(t) + 4} textAnchor="end" className="chart-axis">{fmtK(t)}</text>
        </g>
      ))}
      {data.map((d, i) => (
        <text key={d.label + i} x={x(i)} y={H - 10} textAnchor="middle" className="chart-axis">{d.label}</text>
      ))}
      <path d={`${line('a')} L${x(data.length - 1)},${y(0)} L${x(0)},${y(0)} Z`} fill={`url(#g${id})`} />
      <path d={line('b')} fill="none" stroke={colorB} strokeWidth="2.5" strokeDasharray="6 5" strokeLinecap="round" strokeLinejoin="round" />
      <path d={line('a')} fill="none" stroke={colorA} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(d.b)} r="4" fill="#fff" stroke={colorB} strokeWidth="2"><title>{`${d.label}: pending ৳ ${d.b.toLocaleString()}`}</title></circle>
          <circle cx={x(i)} cy={y(d.a)} r="5" fill="#fff" stroke={colorA} strokeWidth="3"><title>{`${d.label}: collected ৳ ${d.a.toLocaleString()}`}</title></circle>
        </g>
      ))}
      {empty && <text x={W / 2} y={H / 2 - 10} textAnchor="middle" className="chart-empty">No payments in this period yet</text>}
    </svg>
  );
}

/** Donut chart. segments: [{label, value, color}] */
export function Donut({ segments, centerTop, centerBottom }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const R = 70, C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <svg className="donut" viewBox="0 0 200 200" role="img" aria-label="Listing status">
      <circle cx="100" cy="100" r={R} fill="none" stroke="#e8eeeb" strokeWidth="26" />
      <g transform="rotate(-90 100 100)">
        {total > 0 && segments.filter((s) => s.value > 0).map((s) => {
          const len = (s.value / total) * C;
          const el = (
            <circle key={s.label} cx="100" cy="100" r={R} fill="none" stroke={s.color} strokeWidth="26"
              strokeDasharray={`${Math.max(len - 2, 0)} ${C - Math.max(len - 2, 0)}`} strokeDashoffset={-offset}>
              <title>{`${s.label}: ${s.value}`}</title>
            </circle>
          );
          offset += len;
          return el;
        })}
      </g>
      <text x="100" y="98" textAnchor="middle" className="donut-top">{centerTop}</text>
      <text x="100" y="120" textAnchor="middle" className="donut-bottom">{centerBottom}</text>
    </svg>
  );
}
