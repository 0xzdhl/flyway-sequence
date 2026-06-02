import { oauthProvider } from "@better-auth/oauth-provider";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { jwt } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import type { DBClient } from "#/db/client.ts";
import { env } from "#/env.ts";

const HOUR = 60 * 60;
const DAY = 24 * HOUR;

const oauthScopes = [
	"openid",
	"profile",
	"email",
	"offline_access",
	"mcp:read",
	"mcp:write",
] as const;

export function createAuthServer(db: DBClient) {
	return betterAuth({
		baseURL: env.BETTER_AUTH_URL,
		database: drizzleAdapter(db, {
			provider: "sqlite",
		}),
		disabledPaths: ["/token"],
		emailAndPassword: {
			enabled: true,
		},
		socialProviders: {
			github: {
				clientId: env.GITHUB_CLIENT_ID,
				clientSecret: env.GITHUB_CLIENT_SECRET,
				scopes: ["user:email", "user:email", "read:org"],
			},
		},
		plugins: [
			jwt(),
			oauthProvider({
				loginPage: "/sign-in",
				consentPage: "/consent",
				validAudiences: [env.MCP_RESOURCE_URL],
				scopes: [...oauthScopes],
				allowDynamicClientRegistration: true,
				allowUnauthenticatedClientRegistration: true,
				clientRegistrationDefaultScopes: [
					"openid",
					"profile",
					"email",
					"mcp:read",
					"offline_access",
				],
				clientRegistrationAllowedScopes: [...oauthScopes],

				accessTokenExpiresIn: 6 * HOUR,
				refreshTokenExpiresIn: 90 * DAY,
			}),
			tanstackStartCookies(),
		],
	});
}

// For better auth schema generation
export const auth = createAuthServer({} as DBClient);
