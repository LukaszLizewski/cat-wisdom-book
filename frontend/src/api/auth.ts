import { apiClient } from './client';
import type { AuthResponse } from '../types';

export interface LoginPayload {
  profileName: string;
  pin: string;
}

export interface CreateProfilePayload {
  profileName: string;
  pin: string;
}

export interface ChangePinPayload {
  currentPin: string;
  newPin: string;
}

export function login(payload: LoginPayload): Promise<AuthResponse> {
  return apiClient.post<AuthResponse>('/auth/login', payload, false);
}

export function createProfile(payload: CreateProfilePayload): Promise<AuthResponse> {
  return apiClient.post<AuthResponse>('/profiles', payload, false);
}

export function changePin(payload: ChangePinPayload): Promise<void> {
  return apiClient.post<void>('/auth/change-pin', payload);
}
