import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const KEY = 'hr_compare';
export const MAX_COMPARE = 3;
const CompareContext = createContext(null);
export const useCompare = () => useContext(CompareContext);

const read = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
};

/** Up to 3 property ids kept in localStorage for the /compare page. */
export function CompareProvider({ children }) {
  const [ids, setIds] = useState(read);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(ids));
    } catch {
      /* storage full or blocked */
    }
  }, [ids]);

  const has = (id) => ids.includes(id);
  const toggle = useCallback((id) => {
    let full = false;
    setIds((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id);
      if (cur.length >= MAX_COMPARE) {
        full = true;
        return cur;
      }
      return [...cur, id];
    });
    return !full;
  }, []);
  const remove = (id) => setIds((cur) => cur.filter((x) => x !== id));
  const clear = () => setIds([]);

  return <CompareContext.Provider value={{ ids, has, toggle, remove, clear }}>{children}</CompareContext.Provider>;
}
