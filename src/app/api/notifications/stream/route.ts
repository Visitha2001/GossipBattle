import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { sseEmitter } from "@/lib/eventEmitter";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  
  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  let decoded: any;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || "");
  } catch (e) {
    return new Response("Invalid token", { status: 401 });
  }

  const userId = decoded.userId;

  const stream = new ReadableStream({
    start(controller) {
      const listener = (eventUserId: string, notificationData: any) => {
        if (eventUserId === userId) {
          const data = `data: ${JSON.stringify(notificationData)}\n\n`;
          controller.enqueue(new TextEncoder().encode(data));
        }
      };

      sseEmitter.on("notification", listener);

      req.signal.addEventListener("abort", () => {
        sseEmitter.off("notification", listener);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
