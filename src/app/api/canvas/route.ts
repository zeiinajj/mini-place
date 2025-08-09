import { db } from "~/server/db"

export async function GET(req: Request) {
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

