import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { env } from "~/env";
import { db } from "~/server/db";
import { username } from "better-auth/plugins"
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const auth = betterAuth({
	database: prismaAdapter(db, {
		provider: "postgresql",
	}),
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID as string,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
		},
		github: {
			clientId: env.GITHUB_CLIENT_ID,
			clientSecret: env.GITHUB_CLIENT_SECRET,
		},
	},
	rateLimit: {
		storage: "database",
		modelName: "RateLimit",
		enabled:true, //disable in dev mode
		window: 60,
		max: 100,//temp
	},
	plugins: [nextCookies(), username()],
});
