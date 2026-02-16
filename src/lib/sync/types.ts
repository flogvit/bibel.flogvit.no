/**
 * Shared types for sync protocol.
 */

export interface SyncChange {
  dataType: string;
  itemId: string;
  data: any;
  updatedAt: number;
  deleted?: boolean;
}

export interface SyncRequest {
  deviceId: string;
  lastSyncAt: number;
  changes: SyncChange[];
}

export interface SyncResponse {
  syncedAt: number;
  changes: SyncChange[];
}

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  pictureUrl: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
