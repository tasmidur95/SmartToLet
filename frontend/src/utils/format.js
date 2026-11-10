export const money = (n) =>
  n === null || n === undefined || n === '' ? '—' : '৳ ' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });

export const dateText = (iso) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

export const initials = (name = '') => name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

export const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='500'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#d9f2ee'/><stop offset='1' stop-color='#c7d9f5'/></linearGradient></defs><rect width='800' height='500' fill='url(#g)'/><g fill='none' stroke='#6b8fa3' stroke-width='10' stroke-linejoin='round'><path d='M300 300 V230 L400 160 L500 230 V300 Z'/><path d='M280 240 L400 145 L520 240'/></g></svg>`
  );

export const STATUS = {
  0: { label: 'Pending review', tone: 'amber' },
  1: { label: 'Published', tone: 'green' },
  2: { label: 'In progress', tone: 'blue' },
  3: { label: 'Rented', tone: 'gray' },
  4: { label: 'Cancelled', tone: 'red' },
};

/** "3 days ago" style label for a listing date. */
export function timeAgo(iso) {
  if (!iso) return '';
  const days = Math.floor((Date.now() - new Date(iso)) / 86400000);
  if (days <= 0) return 'Listed today';
  if (days === 1) return 'Listed yesterday';
  if (days < 30) return `Listed ${days} days ago`;
  if (days < 365) return `Listed ${Math.floor(days / 30)} month${days >= 60 ? 's' : ''} ago`;
  return `Listed ${Math.floor(days / 365)} year(s) ago`;
}
