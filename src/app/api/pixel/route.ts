import { db } from "~/server/db"
import { z } from "zod";
import { env } from "~/env"
import { auth } from "~/lib/auth"
import { headers } from "next/headers";
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "~/server/redis";

const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "60 s"),
})

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

    if (user.role != "admin") {

        return Response.json({
            error: "Access denied"
        },
            { status: 404 })
    }



    const data = await req.json()
    const deleteSchema = z.object({
        x: z.number().min(0).max(env.WIDTH),
        y: z.number().min(0).max(env.HEIGHT)
    })
    const parsedData = deleteSchema.safeParse(data)
    if (!parsedData.success) {
        return Response.json({
            error: parsedData.error.issues
        },
            {
                status: 400
            })

    }
    const { x, y } = parsedData.data

    const pixel = await db.pixel.findFirst({ where: { x: x, y: y, isActive: true } })

    if (!pixel) {

        return Response.json({
            error: "Pixel not found"
        },
            { status: 404 })
    }

    await db.pixel.update({
        where: { id: pixel.id },
        data: { isDeleted: true, isActive: false }
    })
}

///update pixel
export async function PATCH(req: Request) {

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


    if (user.isBanned) {

        return Response.json({
            error: "Access denied"
        },
            { status: 404 })
    }

    const identifier = user.id;
    const { success, pending, limit, remaining } = await ratelimit.limit(identifier);
    if (!success) {
        
        const res =  Response.json({
            message: ``
        }, {
            status: 429
        })

        
    }



    const data = req.json()
    const updatedPixel = z.object({
        x: z.number().min(0).max(env.WIDTH),
        y: z.number().min(0).max(env.HEIGHT),
        color: z.string().startsWith('#').length(7)
    })

    const parsedData = updatedPixel.safeParse(data)

    if (!parsedData.success) {
        return Response.json({
            error: parsedData.error.issues
        },
            {
                status: 400
            })
    }

    const { x, y, color } = parsedData.data

    const pixel = await db.pixel.findFirst({ where: { x: x, y: y, isActive: true } })

    if (!pixel) {

        return Response.json({
            error: "Pixel not found"
        },
            { status: 404 })
    }
    await db.pixel.updateMany({
        where: { x: x, y: x },
        data: { isActive: false }
    })

    await db.pixel.create({
        data: { x: x, y: y, color: color, user_id: user.id } //lool
    })

    return Response.json({
        message: "Pixel updated successfully",
    },
        {
            status: 200
        })

}

