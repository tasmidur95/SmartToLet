import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { myApi } from '../api/index.js';
import { useAuth } from './AuthContext.jsx';

const WishlistContext = createContext(null);
export const useWishlist = () => useContext(WishlistContext);

/** Keeps the ids of saved properties so every card can show its heart state. */
export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [ids, setIds] = useState(new Set());

  useEffect(() => {
    if (!user) return setIds(new Set());
    myApi.wishlist({ per_page: 100 }).then((r) => setIds(new Set(r.data.map((p) => p.id)))).catch(() => {});
  }, [user]);

  const has = (id) => ids.has(id);

  const toggle = useCallback(
    async (id) => {
      const next = new Set(ids);
      if (ids.has(id)) {
        await myApi.wishRemove(id);
        next.delete(id);
      } else {
        await myApi.wishAdd(id);
        next.add(id);
      }
      setIds(next);
    },
    [ids]
  );

  return <WishlistContext.Provider value={{ has, toggle, count: ids.size }}>{children}</WishlistContext.Provider>;
}
