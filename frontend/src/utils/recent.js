// Recently viewed properties, stored in the browser only (no account needed).
const KEY = 'hr_recent';
const MAX = 8;

export function getRecent() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

export function addRecent(p) {
  const item = { id: p.id, title: p.title, thumbnail: p.thumbnail, price: p.discount_price && p.discount_price < p.price ? p.discount_price : p.price, address: p.address };
  try {
    const list = [item, ...getRecent().filter((x) => x.id !== p.id)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}
