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
        // Consider whether cleanup failures should fail the test suite
      }
    } else {
      // Fallback cleanup by email if userId wasn't set
      console.warn('UserId not set, attempting cleanup by email');
      // Add email-based cleanup if supported by your setup
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
    expect(authResult).not.toBeNull();
    if (!authResult) {
      throw new Error('Login failed - authResult is null');
    }

    expect(authResult.user).toBeDefined();
    expect(authResult.user.id).toBe(userId);

    // Verify hook state is updated
    expect(result.current.user).toBeDefined();
    expect(result.current.user?.id).toBe(userId);
  });
  it('should log out a user', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.logout();
  it('should update a user profile', async () => {
    const { result } = renderHook(() => useAuth());

    let loginResult: any;
    await act(async () => {
      loginResult = await result.current.login({ email: testEmail, password: testPassword });
    });

    expect(loginResult).toBeDefined();
    expect(loginResult.user).toBeDefined();

    const newName = 'Updated Test User';
    await act(async () => {
      await result.current.updateProfile({ name: newName });
    });

    // Verify hook state is updated
    expect(result.current.user).toBeDefined();

    // Verify that the profile was updated
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    expect(profileError).toBeNull();
    expect(profile).toBeDefined();
    expect(profile.name).toBe(newName);
  });      .single();

    expect(profileError).toBeNull();
    expect(profile).toBeDefined();
    expect(profile.name).toBe(newName);
  });
});
