// Set test environment variables before any imports
process.env.JWT_SECRET = "test-secret-key-at-least-32-characters-long";
process.env.NODE_ENV = "test";
process.env.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";
