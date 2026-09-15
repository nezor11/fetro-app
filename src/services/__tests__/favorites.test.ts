import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Favorite,
  addToList,
  removeFromList,
  isInList,
  loadFavorites,
  saveFavorites,
} from '../favorites';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const fav = (kind: Favorite['kind'], id: string, addedAt = 1): Favorite => ({
  kind,
  id,
  addedAt,
  title: `${kind} ${id}`,
});

beforeEach(() => AsyncStorage.clear());

describe('operaciones puras sobre la lista', () => {
  it('addToList pone el nuevo al principio y sustituye duplicados', () => {
    const list = [fav('post', '1'), fav('post', '2')];
    const next = addToList(list, { kind: 'post', id: '2', title: 'nuevo' });
    expect(next).toHaveLength(2);
    expect(next[0]).toMatchObject({ id: '2', title: 'nuevo' });
    expect(next[0].addedAt).toBeGreaterThan(1);
    expect(next[1].id).toBe('1');
  });

  it('removeFromList solo quita la combinación kind+id', () => {
    const list = [fav('post', '1'), fav('product', '1')];
    const next = removeFromList(list, 'post', '1');
    expect(next).toEqual([list[1]]);
  });

  it('isInList distingue kind', () => {
    const list = [fav('post', '1')];
    expect(isInList(list, 'post', '1')).toBe(true);
    expect(isInList(list, 'product', '1')).toBe(false);
  });
});

describe('loadFavorites', () => {
  it('devuelve [] si no hay nada guardado', async () => {
    await expect(loadFavorites(7)).resolves.toEqual([]);
  });

  it('persiste y recupera por usuario', async () => {
    await saveFavorites(7, [fav('post', '1')]);
    await saveFavorites(8, [fav('post', '2')]);
    await expect(loadFavorites(7)).resolves.toEqual([fav('post', '1')]);
    await expect(loadFavorites(8)).resolves.toEqual([fav('post', '2')]);
  });

  it('ignora JSON corrupto y entradas con kind desconocido', async () => {
    await AsyncStorage.setItem('@fetro_favorites:7', '{not json');
    await expect(loadFavorites(7)).resolves.toEqual([]);

    await AsyncStorage.setItem(
      '@fetro_favorites:7',
      JSON.stringify([fav('post', '1'), { kind: 'alien', id: 'x' }, null, 'str'])
    );
    await expect(loadFavorites(7)).resolves.toEqual([fav('post', '1')]);
  });

  it('hereda la clave antigua una sola vez y la borra', async () => {
    await AsyncStorage.setItem('@fetro_favorites', JSON.stringify([fav('training', '9')]));

    await expect(loadFavorites(7)).resolves.toEqual([fav('training', '9')]);
    await expect(AsyncStorage.getItem('@fetro_favorites')).resolves.toBeNull();
    // Otro usuario del mismo dispositivo ya no la hereda.
    await expect(loadFavorites(8)).resolves.toEqual([]);
  });
});
