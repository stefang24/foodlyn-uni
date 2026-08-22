const apiPort = 5166;

const resolveApiUrl = (): string => {
  if (typeof window === 'undefined') {
    return `http://localhost:${apiPort}/api`;
  }
  const host = window.location.hostname || 'localhost';
  return `http://${host}:${apiPort}/api`;
};

export const environment = {
  production: false,
  apiUrl: resolveApiUrl()
};
