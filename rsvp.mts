import type { Config, Context } from "@netlify/functions";
import { db } from "../../db/index.js";
import { rsvps } from "../../db/schema.js";
import { desc } from "drizzle-orm";

const DASHBOARD_PASSWORD = "SafSal2026!";

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export default async (req: Request, context: Context) => {
  if (req.method === "POST") {
    let body: { name?: unknown; side?: unknown; response?: unknown };
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "Invalid request body." }, { status: 400 });
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const side = body.side === "groom" || body.side === "bride" ? body.side : "";
    const response =
      body.response === "attending" || body.response === "not_attending" ? body.response : "";

    if (!name || !side || !response) {
      return Response.json(
        { error: "Name, side, and response are all required." },
        { status: 400 },
      );
    }

    if (name.length > 120) {
      return Response.json({ error: "Name is too long." }, { status: 400 });
    }

    const [created] = await db
      .insert(rsvps)
      .values({ name, side, response })
      .returning();

    return Response.json(
      {
        id: created.id,
        name: created.name,
        side: created.side,
        response: created.response,
        dateTime: formatDateTime(created.createdAt),
      },
      { status: 201 },
    );
  }

  if (req.method === "GET") {
    const password = req.headers.get("x-dashboard-password") ?? "";
    if (password !== DASHBOARD_PASSWORD) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const all = await db.select().from(rsvps).orderBy(desc(rsvps.createdAt));

    const groom = all
      .filter((row) => row.side === "groom")
      .map((row) => ({
        name: row.name,
        dateTime: formatDateTime(row.createdAt),
        response: row.response,
      }));

    const bride = all
      .filter((row) => row.side === "bride")
      .map((row) => ({
        name: row.name,
        dateTime: formatDateTime(row.createdAt),
        response: row.response,
      }));

    const counts = {
      attending: all.filter((row) => row.response === "attending").length,
      notAttending: all.filter((row) => row.response === "not_attending").length,
    };

    return Response.json({ groom, bride, counts });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config: Config = {
  path: "/api/rsvp",
};
