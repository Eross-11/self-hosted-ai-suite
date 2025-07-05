import { describe, it, expect, afterAll } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { supabase } from './lib/supabaseClient';
import { useAuth } from './hooks/useAuth';

// Helper function to generate a random email
const generateRandomEmail = () => {
  const randomString = Math.random().toString(36).substring(2, 15);
  return `testuser_${randomString}@example.com`;
};

describe('Authentication and Profile Flow', () => {
  const testEmail = generateRandomEmail();
  const testPassword = 'password123';
  const testName = 'Test User';
  let userId: string;

  afterAll(async () => {
    // Clean up the test user
    if (userId) {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) {
        console.error('Error cleaning up test user:', error);
      }
    }
  });

  it('should register a new user and create a profile', async () => {
    const { result } = renderHook(() => useAuth());

    let authResult: any;
    await act(async () => {
      authResult = await result.current.register(testEmail, testPassword, testName);
    });

    expect(authResult).toBeDefined();
    expect(authResult.user).toBeDefined();
    expect(authResult.user.email).toBe(testEmail);
    userId = authResult.user.id;

    // Verify that the profile was created
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    expect(profileError).toBeNull();
    expect(profile).toBeDefined();
    expect(profile).toHaveProperty('name', testName);
  });
  it('should log in an existing user', async () => {
    const { result } = renderHook(() => useAuth());

    let authResult: any;
    await act(async () => {
      authResult = await result.current.login({ email: testEmail, password: testPassword });
    });

    expect(authResult).toBeDefined();
    if (!authResult) return;

    expect(authResult.user).toBeDefined();
    expect(authResult.user.id).toBe(userId);
  });

  it('should log out a user', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.logout();
    });

    const { data: { session } } = await supabase.auth.getSession();
    expect(session).toBeNull();
  });

  it('should update a user profile', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login({ email: testEmail, password: testPassword });
    });

    const newName = 'Updated Test User';
    await act(async () => {
      await result.current.updateProfile({ name: newName });
    });

    // Verify that the profile was updated
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    expect(profileError).toBeNull();
    expect(profile).toBeDefined();
    expect(profile.name).toBe(newName);
  });
});
