export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { BackupService } = await import("./services/BackupService");
      BackupService.initScheduler();
    } catch (err) {
      console.error("[Instrumentation] Failed to initialize automated backup scheduler:", err);
    }
  }
}
