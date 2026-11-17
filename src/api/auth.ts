import { refreshCsrf, request } from './client';

export const loginRequest = async (email: string, password: string) => {
  await refreshCsrf();
  await request('/user/auth/login/', {
    method: 'POST',
    body: { email, password },
    skipUnauthorizedEvent: true,
  });
  await refreshCsrf();
};

export const logoutRequest = async () => {
  await request('/user/auth/logout/', { method: 'POST', skipUnauthorizedEvent: true });
};
