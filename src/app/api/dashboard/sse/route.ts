import { DashboardService } from "@/services/DashboardService";

export async function GET(request: Request) {
  const responseStream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let intervalId: NodeJS.Timeout;

      const sendStats = async () => {
        try {
          const stats = await DashboardService.getDashboardStats();
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(stats)}\n\n`));
          return true;
        } catch (err) {
          console.error("SSE send statistics exception:", err);
          clearInterval(intervalId);
          try {
            controller.close();
          } catch (_) {}
          return false;
        }
      };

      // Send initial dashboard data
      await sendStats();

      // Poll database / cache every 5 seconds to push updates
      intervalId = setInterval(async () => {
        const success = await sendStats();
        if (!success) {
          clearInterval(intervalId);
        }
      }, 5000);

      // Clean up on stream abort (e.g. client page navigated away or closed)
      request.signal.addEventListener("abort", () => {
        clearInterval(intervalId);
        try {
          controller.close();
        } catch (_) {}
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
