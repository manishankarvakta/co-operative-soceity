import { DashboardService } from "../../../../services/DashboardService";

export async function GET(request: Request) {
  const responseStream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const sendStats = async () => {
        try {
          const stats = await DashboardService.getDashboardStats();
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(stats)}\n\n`));
        } catch (err) {
          console.error("SSE send statistics exception:", err);
        }
      };

      // Send initial dashboard data
      await sendStats();

      // Poll database / cache every 5 seconds to push updates
      const intervalId = setInterval(async () => {
        try {
          await sendStats();
        } catch (err) {
          clearInterval(intervalId);
          controller.close();
        }
      }, 5000);

      // Clean up on stream abort (e.g. client page navigated away or closed)
      request.signal.addEventListener("abort", () => {
        clearInterval(intervalId);
        controller.close();
      });
    }
  });

  return new Response(responseStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive"
    }
  });
}
