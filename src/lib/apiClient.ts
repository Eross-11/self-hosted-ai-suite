/**
 * API Client for Nexus Platform
 *
 * This client handles communication with the backend API.
 */

import * as Sentry from '@sentry/react';
import { SpanStatus } from '@sentry/tracing';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export class ApiClient {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken(): void {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    return Sentry.startSpan(
      {
        op: 'http.client',
        name: `${options.method || 'GET'} ${endpoint}`,
        attributes: {
          url,
          method: options.method || 'GET',
        },
      },
      async (span) => {
        try {
          const response = await fetch(url, config);

          if (!response.ok) {
            if (response.status === 401) {
              // Token expired or invalid
              this.clearToken();
              throw new Error('Authentication required');
            }

            const errorData = await response.json().catch(() => ({}));
            const errorMessage =
              errorData.detail ||
              `HTTP ${response.status}: ${response.statusText}`;
            span.setStatus(SpanStatus.InternalError);
            span.setAttribute('http.status_code', response.status);
            Sentry.captureException(new Error(errorMessage));
            throw new Error(errorMessage);
          }

          span.setStatus(SpanStatus.Ok);
          span.setAttribute('http.status_code', response.status);
          return await response.json();
        } catch (error) {
          span.setStatus(SpanStatus.InternalError);
          console.error(`API request failed: ${endpoint}`, error);
          Sentry.captureException(error);

          // Enhanced error handling for connection issues
          if (error instanceof TypeError && error.message === 'Failed to fetch') {
            throw new Error(
              `Unable to connect to the API service. Please check your internet connection and try again.`,
            );
          }

          throw error;
        }
      },
    );
  }

  // Workspace methods
  async getWorkspaces(): Promise<unknown> {
    return this.request('/workspaces');
  }

  async createWorkspace(name: string): Promise<unknown> {
    return this.request('/workspaces', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async getWorkspaceDetails(workspaceId: string): Promise<unknown> {
    return this.request(`/workspaces/${workspaceId}`);
  }

  async updateWorkspace(workspaceId: string, data: unknown): Promise<unknown> {
    return this.request(`/workspaces/${workspaceId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteWorkspace(workspaceId: string): Promise<unknown> {
    return this.request(`/workspaces/${workspaceId}`, {
      method: 'DELETE',
    });
  }

  // Workspace members methods
  async getWorkspaceMembers(workspaceId: string): Promise<unknown> {
    return this.request(`/workspaces/${workspaceId}/members`);
  }

  async updateMemberRole(
    workspaceId: string,
    userId: string,
    role: string,
  ): Promise<unknown> {
    return this.request(`/workspaces/${workspaceId}/members/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  async removeMember(workspaceId: string, userId: string): Promise<unknown> {
    return this.request(`/workspaces/${workspaceId}/members/${userId}`, {
      method: 'DELETE',
    });
  }

  // Invitation methods
  async inviteUser(
    workspaceId: string,
    email: string,
    role: string,
  ): Promise<unknown> {
    return this.request(`/workspaces/${workspaceId}/invite`, {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    });
  }

  async getInvitations(workspaceId: string): Promise<unknown> {
    return this.request(`/workspaces/${workspaceId}/invitations`);
  }

  async cancelInvitation(
    workspaceId: string,
    invitationId: string,
  ): Promise<unknown> {
    return this.request(
      `/workspaces/${workspaceId}/invitations/${invitationId}`,
      {
        method: 'DELETE',
      },
    );
  }

  async acceptInvitation(token: string): Promise<unknown> {
    return this.request('/invitations/accept', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  // Billing methods
  async createCheckoutSession(
    workspaceId: string,
    planId: string,
  ): Promise<unknown> {
    return this.request('/billing/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ workspaceId, planId }),
    });
  }
}

export const apiClient = new ApiClient();
