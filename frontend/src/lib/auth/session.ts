import type { ExternalUserResponse, InternalUserResponse } from "@/types/api";

export type AccessMode = "interno" | "externo";

export type LoginSession = {
  accessMode: AccessMode;
  identifier: string;
  displayName: string;
  isInternalAdmin: boolean;
  loggedAt: string;
  expiresAt: string;
  externalUser?: ExternalUserResponse | null;
  internalUser?: InternalUserResponse | null;
};

export type SessionUserContext = {
  accessMode: AccessMode;
  identifier: string;
  displayName: string;
  isInternalAdmin: boolean;
  externalUser?: ExternalUserResponse | null;
  internalUser?: InternalUserResponse | null;
};

export const AUTH_TOKEN_COOKIE_NAME = "central-eventos-api-token";
export const SESSION_COOKIE_NAME = "central-eventos-session";
export const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 8;
