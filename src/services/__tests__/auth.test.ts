import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { getStoredAuth, clearAuth, validateCookie } from '../auth';
import { postPlugin, SessionExpiredError } from '../pluginApi';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: jest.fn(async (k: string) => store.get(k) ?? null),
    setItemAsync: jest.fn(async (k: string, v: string) => void store.set(k, v)),
    deleteItemAsync: jest.fn(async (k: string) => void store.delete(k)),
    __store: store,
  };
});

jest.mock('../pluginApi', () => {
  const actual = jest.requireActual('../pluginApi');
  return { ...actual, postPlugin: jest.fn() };
});

const mockedPost = postPlugin as jest.Mock;
const secureStore = (SecureStore as unknown as { __store: Map<string, string> }).__store;
const user = { id: 1, email: 'a@b.c', username: 'a', displayname: 'A' };

const validOk = () => mockedPost.mockResolvedValue({ status: 'ok', valid: true });

beforeEach(async () => {
  await AsyncStorage.clear();
  secureStore.clear();
  mockedPost.mockReset();
});

describe('validateCookie', () => {
  it('valid cuando el servidor lo confirma', async () => {
    validOk();
    await expect(validateCookie('c')).resolves.toBe('valid');
  });

  it('invalid si el servidor responde que no, o lanza SessionExpiredError', async () => {
    mockedPost.mockResolvedValue({ status: 'ok', valid: false });
    await expect(validateCookie('c')).resolves.toBe('invalid');
    mockedPost.mockRejectedValue(new SessionExpiredError());
    await expect(validateCookie('c')).resolves.toBe('invalid');
  });

  it('unreachable ante fallo de red o respuesta inesperada', async () => {
    mockedPost.mockRejectedValue(new Error('boom'));
    await expect(validateCookie('c')).resolves.toBe('unreachable');
  });
});

describe('getStoredAuth', () => {
  it('sin sesión guardada devuelve null y no consulta al servidor', async () => {
    await expect(getStoredAuth()).resolves.toEqual({ auth: null, expired: false });
    expect(mockedPost).not.toHaveBeenCalled();
  });

  it('recupera la sesión de SecureStore', async () => {
    secureStore.set('fetro_auth_cookie', 'sec');
    await AsyncStorage.setItem('@fetro_auth_user', JSON.stringify(user));
    validOk();
    await expect(getStoredAuth()).resolves.toEqual({
      auth: { cookie: 'sec', user },
      expired: false,
    });
  });

  it('migra la cookie antigua de AsyncStorage a SecureStore', async () => {
    await AsyncStorage.setItem('@fetro_auth_cookie', 'legacy');
    await AsyncStorage.setItem('@fetro_auth_user', JSON.stringify(user));
    validOk();

    const result = await getStoredAuth();
    expect(result.auth?.cookie).toBe('legacy');
    expect(secureStore.get('fetro_auth_cookie')).toBe('legacy');
    await expect(AsyncStorage.getItem('@fetro_auth_cookie')).resolves.toBeNull();
  });

  it('marca expired y limpia todo si el servidor rechaza la cookie', async () => {
    secureStore.set('fetro_auth_cookie', 'old');
    await AsyncStorage.setItem('@fetro_auth_user', JSON.stringify(user));
    mockedPost.mockRejectedValue(new SessionExpiredError());

    await expect(getStoredAuth()).resolves.toEqual({ auth: null, expired: true });
    expect(secureStore.has('fetro_auth_cookie')).toBe(false);
    await expect(AsyncStorage.getItem('@fetro_auth_user')).resolves.toBeNull();
  });

  it('conserva la sesión si no hay red', async () => {
    secureStore.set('fetro_auth_cookie', 'sec');
    await AsyncStorage.setItem('@fetro_auth_user', JSON.stringify(user));
    mockedPost.mockRejectedValue(new Error('Network Error'));

    await expect(getStoredAuth()).resolves.toEqual({
      auth: { cookie: 'sec', user },
      expired: false,
    });
  });

  it('descarta datos de usuario corruptos', async () => {
    secureStore.set('fetro_auth_cookie', 'sec');
    await AsyncStorage.setItem('@fetro_auth_user', '{bad');
    await expect(getStoredAuth()).resolves.toEqual({ auth: null, expired: false });
    expect(secureStore.has('fetro_auth_cookie')).toBe(false);
  });
});

describe('clearAuth', () => {
  it('borra cookie (ambas claves) y usuario', async () => {
    secureStore.set('fetro_auth_cookie', 'sec');
    await AsyncStorage.setItem('@fetro_auth_cookie', 'legacy');
    await AsyncStorage.setItem('@fetro_auth_user', '{}');
    await clearAuth();
    expect(secureStore.size).toBe(0);
    await expect(AsyncStorage.getItem('@fetro_auth_cookie')).resolves.toBeNull();
    await expect(AsyncStorage.getItem('@fetro_auth_user')).resolves.toBeNull();
  });
});
