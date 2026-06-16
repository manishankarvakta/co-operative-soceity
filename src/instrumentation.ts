export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { SchedulerService } = await import("./services/SchedulerService");
      SchedulerService.start();
    } catch (err) {
      console.error("[Instrumentation] Failed to initialize automated background scheduler:", err);
    }
  }
}
