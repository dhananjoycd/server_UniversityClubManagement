import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { env } from "./env";
import { prisma } from "../lib/prisma";
import { sendResetPasswordEmailMessage, sendVerificationEmailMessage } from "../modules/auth/auth-mail";
import { normalizeEmailAddress } from "../modules/auth/email-normalization";

const verificationCallbackUrl = `${env.CLIENT_URL}/verify-email?status=success`;

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  basePath: "/api/v1/auth",
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: env.CLIENT_URLS,
  databaseHooks: {
    user: {
      create: {
        before: async (user) => ({
          data: user.email
            ? {
                email: normalizeEmailAddress(user.email),
              }
            : {},
        }),
      },
      update: {
        before: async (user) => ({
          data: user.email
            ? {
                email: normalizeEmailAddress(user.email),
              }
            : {},
        }),
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendResetPasswordEmailMessage({
        email: user.email,
        name: user.name,
        resetUrl: url,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: false,
    sendVerificationEmail: async ({ user, url }) => {
      const verificationUrl = new URL(url);
      verificationUrl.searchParams.set("callbackURL", verificationCallbackUrl);

      await sendVerificationEmailMessage({
        email: user.email,
        name: user.name,
        verificationUrl: verificationUrl.toString(),
      });
    },
  },
  socialProviders:
    env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          },
        }
      : undefined,
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
      updateUserInfoOnLink: true,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        input: false,
      },
    },
  },
});
