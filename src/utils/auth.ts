export function createAuthHeader(login:string,password:string): string {
  const authHeader = Buffer.from(`${login}:${password}`).toString('base64');

  return `Basic ${authHeader}`;
};