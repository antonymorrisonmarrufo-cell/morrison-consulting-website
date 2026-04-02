export const CONFIG = {
  clientId: process.env.FREEAGENT_CLIENT_ID || '',
  clientSecret: process.env.FREEAGENT_CLIENT_SECRET || '',
  sandbox: process.env.FREEAGENT_SANDBOX === 'true',
  get baseUrl(): string {
    return this.sandbox
      ? 'https://api.sandbox.freeagent.com/v2'
      : 'https://api.freeagent.com/v2';
  },
  get authUrl(): string {
    return this.sandbox
      ? 'https://api.sandbox.freeagent.com/v2/approve_app'
      : 'https://api.freeagent.com/v2/approve_app';
  },
  get tokenUrl(): string {
    return this.sandbox
      ? 'https://api.sandbox.freeagent.com/v2/token_endpoint'
      : 'https://api.freeagent.com/v2/token_endpoint';
  },
  callbackPort: 8919,
  get redirectUri(): string {
    return `http://localhost:${this.callbackPort}/callback`;
  },
};
