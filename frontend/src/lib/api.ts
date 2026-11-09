const isProduction = process.env.NODE_ENV === 'production';
const configuredApiBase = process.env.NEXT_PUBLIC_API_URL;
const isLocalApiBase = configuredApiBase
  ? /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(configuredApiBase)
  : false;

export const API_BASE =
  (configuredApiBase && !(isProduction && isLocalApiBase)
    ? configuredApiBase
    : isProduction
      ? 'https://aumoha.onrender.com/api'
      : 'http://localhost:5001/api');
