// Minimal test fixtures for generic SaaS template
export const FIXTURES = {
  users: {
    alice: {
      email: 'alice@example.com',
      name: 'Alice User',
    },
    bob: {
      email: 'bob@example.com',
      name: 'Bob User',
    },
  },
  sessions: {
    aliceSession: {
      token: 'test-session-token-alice',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // +24h
    },
    bobSession: {
      token: 'test-session-token-bob',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // +24h
    },
    expiredSession: {
      token: 'test-session-expired',
      expiresAt: new Date(Date.now() - 1000), // Already expired
    },
  },
  accounts: {
    aliceAccount: {
      accountId: 'alice@example.com',
      providerId: 'credential',
      password: '$2a$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1u', // 'password123'
    },
    bobAccount: {
      accountId: 'bob@example.com',
      providerId: 'credential',
      password: '$2a$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1u', // 'password123'
    },
  },
}
