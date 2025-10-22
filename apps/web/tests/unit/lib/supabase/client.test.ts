import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the Supabase SSR package
const mockClient = {
  supabaseUrl: 'https://test.supabase.co',
  supabaseKey: 'test-anon-key',
  auth: {
    signIn: vi.fn(),
    signOut: vi.fn(),
    getUser: vi.fn(),
  },
  from: vi.fn(),
};

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(() => mockClient),
}));

// Mock environment variables
vi.mock('process', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  },
}));

describe('Supabase Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a client with correct configuration', async () => {
    const { createClient } = await import('@/lib/supabase/client');
    const client = createClient();

    expect(client).toBeDefined();
    expect(client.supabaseUrl).toBe('https://test.supabase.co');
    expect(client.supabaseKey).toBe('test-anon-key');
  });

  it('should have auth methods available', async () => {
    const { createClient } = await import('@/lib/supabase/client');
    const client = createClient();

    expect(client.auth).toBeDefined();
    expect(typeof client.auth.signIn).toBe('function');
    expect(typeof client.auth.signOut).toBe('function');
    expect(typeof client.auth.getUser).toBe('function');
  });

  it('should have database methods available', async () => {
    const { createClient } = await import('@/lib/supabase/client');
    const client = createClient();

    expect(client.from).toBeDefined();
    expect(typeof client.from).toBe('function');
  });
});
