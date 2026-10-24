export const environment = {
  production: true,
  // Production: the built files are served by the same nginx that proxies
  // /api/ to Spring Boot, so the API is same-origin and the URL stays empty.
  apiBaseUrl: '',
};
