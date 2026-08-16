import type { AuthPayload } from "./services/auth";

export type ApiEnv = {
  Variables: {
    auth: AuthPayload;
  };
};
