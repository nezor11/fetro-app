import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Favorite,
  FavoriteKind,
  addToList,
  isInList,
  loadFavorites,
  removeFromList,
  saveFavorites,
} from '../services/favorites';

/**
 * Context reactivo para favoritos. Vive por encima del navegador (en
 * App.tsx, al nivel del QueryClientProvider) porque cualquier pantalla
 * de detalle puede marcar/desmarcar, y FavoritesScreen debe enterarse
 * inmediatamente.
 *
 * El patrón: todas las operaciones devuelven promesas que se resuelven
 * cuando AsyncStorage ha persistido. El `favorites` del state se
 * actualiza con el nuevo array antes de esperar al `saveFavorites`
 * (optimistic update) — así la UI no espera al disco.
 */

interface FavoritesContextValue {
  favorites: Favorite[];
  /**
   * `true` mientras se lee el storage en el montaje. Útil para no
   * parpadear "vacío → cargado" en la FavoritesScreen al arrancar.
   */
  isLoading: boolean;
  /** Comprueba si un recurso está en favoritos (lookup O(n), suficiente). */
  isFavorite: (kind: FavoriteKind, id: string) => boolean;
  /** Añade si no estaba, elimina si estaba. Devuelve el nuevo estado. */
  toggleFavorite: (fav: Omit<Favorite, 'addedAt'>) => Promise<boolean>;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carga inicial desde AsyncStorage. Solo se ejecuta una vez en el
  // montaje del provider, al inicio de la app.
  useEffect(() => {
    loadFavorites().then((list) => {
      setFavorites(list);
      setIsLoading(false);
    });
  }, []);

  const isFavorite = useCallback(
    (kind: FavoriteKind, id: string) => isInList(favorites, kind, id),
    [favorites]
  );

  const toggleFavorite = useCallback(
    async (fav: Omit<Favorite, 'addedAt'>): Promise<boolean> => {
      const currently = isInList(favorites, fav.kind, fav.id);
      const next = currently
        ? removeFromList(favorites, fav.kind, fav.id)
        : addToList(favorites, fav);
      setFavorites(next);
      await saveFavorites(next);
      return !currently;
    },
    [favorites]
  );

  const value = useMemo(
    () => ({ favorites, isLoading, isFavorite, toggleFavorite }),
    [favorites, isLoading, isFavorite, toggleFavorite]
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return ctx;
}
