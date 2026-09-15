import axios from 'axios';
import {
  postPlugin,
  SessionExpiredError,
  setSessionInvalidHandler,
  isNetworkError,
} from '../pluginApi';

jest.mock('axios', () => {
  const post = jest.fn();
  class AxiosError extends Error {
    response?: unknown;
    constructor(message: string, response?: unknown) {
      super(message);
      this.response = response;
    }
  }
  return { __esModule: true, default: { post }, AxiosError, post };
});

const mockedPost = (axios as unknown as { post: jest.Mock }).post;

describe('postPlugin', () => {
  beforeEach(() => {
    mockedPost.mockReset();
    setSessionInvalidHandler(null);
  });

  it('envía POST form-urlencoded con insecure=cool y omite nulos', async () => {
    mockedPost.mockResolvedValue({ data: { status: 'ok' } });

    await postPlugin('/api/user/x/', { cookie: 'abc', page: 2, empty: null, u: undefined });

    expect(mockedPost).toHaveBeenCalledTimes(1);
    const [url, body, config] = mockedPost.mock.calls[0];
    expect(url).toMatch(/\/api\/user\/x\/$/);
    expect(new URLSearchParams(body).get('insecure')).toBe('cool');
    expect(new URLSearchParams(body).get('cookie')).toBe('abc');
    expect(new URLSearchParams(body).get('page')).toBe('2');
    expect(new URLSearchParams(body).has('empty')).toBe(false);
    expect(new URLSearchParams(body).has('u')).toBe(false);
    expect(config.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
  });

  it('lanza SessionExpiredError y avisa al handler ante "Invalid cookie"', async () => {
    mockedPost.mockResolvedValue({
      data: { status: 'error', error: 'Invalid cookie. Use the `generate_auth_cookie` method.' },
    });
    const handler = jest.fn();
    setSessionInvalidHandler(handler);

    await expect(postPlugin('/api/user/x/', { cookie: 'abc' })).rejects.toBeInstanceOf(
      SessionExpiredError
    );
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('no trata como sesión caducada un error si la petición no llevaba cookie', async () => {
    const data = { status: 'error', error: 'Invalid cookie' };
    mockedPost.mockResolvedValue({ data });
    const handler = jest.fn();
    setSessionInvalidHandler(handler);

    await expect(postPlugin('/api/user/x/', { email: 'a@b.c' })).resolves.toEqual(data);
    expect(handler).not.toHaveBeenCalled();
  });

  it('devuelve otros errores del backend sin lanzar', async () => {
    const data = { status: 'error', error: 'Wrong password' };
    mockedPost.mockResolvedValue({ data });
    await expect(postPlugin('/api/user/x/', { cookie: 'abc' })).resolves.toEqual(data);
  });
});

describe('isNetworkError', () => {
  const { AxiosError } = jest.requireMock('axios');

  it('true para AxiosError sin response', () => {
    expect(isNetworkError(new AxiosError('timeout'))).toBe(true);
  });

  it('false para AxiosError con response o errores normales', () => {
    expect(isNetworkError(new AxiosError('500', { status: 500 }))).toBe(false);
    expect(isNetworkError(new Error('x'))).toBe(false);
  });
});
