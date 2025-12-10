export const fetchWithAuth = async (input: RequestInfo | URL, init?: RequestInit) => {
  const token = sessionStorage.getItem('control-pad-auth-token');
  const headers = new Headers(init?.headers);

  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }

  return fetch(input, {
    ...init,
    headers,
  });
};
