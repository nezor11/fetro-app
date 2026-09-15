import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
import { useAuth } from './AuthContext';

/**
 * Context reactivo para favoritos. Vive por encima del navegador (en
 * App.tsx, dentro de AuthProvider) porque cualquier pantalla de detalle
 * puede marcar/desmarcar, y FavoritesScreen debe enterarse
 * inmediatamente.
 *
 * Los favoritos se cargan y guardan **por usuario** (ver
 * `services/favorites.ts`): al cambiar el `user.id` del AuthContext se
 * recarga la lista; sin usuario la lista está vacía y no se persiste.
 *
 * El patrón: todas las operaciones devuelven promesas que se resuelven
 * cuando AsyncStorage ha persistido. El `favorites` del state se
 * actualiza con el nuevo array antes de esperar al `saveFavorites`
 * (optimistic update) — así la UI no espera al disco.
 */

interface FavoritesContextValue {
  favorites: Favorite[];
  /**
   * `true` mientras se lee el storage tras un cambio de usuario. Útil
   * para no parpadear "vacío → cargado" en la FavoritesScreen.
   */
  isLoading: boolean;
  /** Comprueba si un recurso está en favoritos (lookup O(n), suficiente). */
  isFavorite: (kind: FavoriteKind, id: string) => boolean;
  /** Añade si no estaba, elimina si estaba. Devuelve el nuevo estado. */
  toggleFavorite: (fav: Omit<Favorite, 'addedAt'>) => Promise<boolean>;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Copia siempre actual de la lista, para que dos toggles seguidos
  // (doble tap) no trabajen sobre la misma closure y se pisen.
  const favoritesRef = useRef<Favorite[]>([]);

  const commit = useCallback((next: Favorite[]) => {
    favoritesRef.current = next;
    setFavorites(next);
  }, []);

  // Carga (o vaciado) cada vez que cambia el usuario. El flag `active`
  // descarta la respuesta si el usuario volvió a cambiar antes de que
  // AsyncStorage contestara.
  useEffect(() => {
    let active = true;
    if (userId === null) {
      commit([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    loadFavorites(userId).then((list) => {
      if (!active) return;
      commit(list);
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [userId, commit]);

  const isFavorite = useCallback(
    (kind: FavoriteKind, id: string) => isInList(favorites, kind, id),
    [favorites]
  );

  const toggleFavorite = useCallback(
    async (fav: Omit<Favorite, 'addedAt'>): Promise<boolean> => {
      const current = favoritesRef.current;
      const currently = isInList(current, fav.kind, fav.id);
      const next = currently
        ? removeFromList(current, fav.kind, fav.id)
        : addToList(current, fav);
      commit(next);
      if (userId !== null) {
        await saveFavorites(userId, next);
      }
      return !currently;
    },
    [userId, commit]
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
