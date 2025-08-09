import { db } from "~/server/db"
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "~/server/redis";
import type { NextRequest } from "next/server";

const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(020, "60 s"),
})


export async function GET(req: NextRequest) {
    const identifier = "canvas"; //later
    const { success, pending, limit, remaining } = await ratelimit.limit(identifier);

    if (!success) {
        return Response.json({
            message: "Rate Limite exceeded"
        }, {
            status: 429
        })
    }
    const pixels = await db.pixel.findMany({ where: { isActive: true } });

    return Response.json({
        data: pixels,
        message: "pixels returned successfully",
    },
        {
            status: 200
        }
    )
}

