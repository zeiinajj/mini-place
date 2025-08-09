import { db } from "~/server/db"
import { z } from "zod";
import { env } from "~/env"
import { auth } from "~/lib/auth"
import { headers } from "next/headers";
import { Session } from "inspector/promises";
import { username } from "better-auth/plugins";
import { datetime } from "node_modules/zod/v4/core/regexes.cjs";

export async function DELETE(req: Request) {
    const session = await auth.api.getSession({
        headers: await headers()
    })



    if (!session) {
        return Response.json({
            error: "You're not logged in"
        },
            { status: 401 }
        )
    }

    const user = await db.user.findFirst({ where: { id: session.user.id } })

    //

    if (!user) {

        return Response.json({
            error: "User not found"
        },
            { status: 404 })
    }

    if (user.role != "user") {

        return Response.json({
            error: "Access denied"
        },
            { status: 404 })
    }
    const data = await req.json()
    const deletedUser = z.object({
        username: z.string()
    })

    const parsedData = deletedUser.safeParse(data)
    if (!parsedData.success) {
        return Response.json({
            error: parsedData.error.issues
        },
            {
                status: 400
            })

    }

    const { username } = parsedData.data

    const bannedUser = await db.user.findFirst({ where: { username: username } })


    if (!bannedUser) {

        return Response.json({
            error: "User not found"
        },
            { status: 404 })
    }

    await db.pixel.updateMany({
        where: { user_id: bannedUser.id },
        data: { isActive: false }
    })

    await db.user.update({
        where: { id: bannedUser.id },
        data: { isBanned: true, bannedAt: new Date() }
    })

    return Response.json({
        message: "User banned"
    },
        {
            status: 200
        })

}