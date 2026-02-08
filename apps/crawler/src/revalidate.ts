import { info, log, error } from "./logger.js";

export async function triggerRevalidation(): Promise<void> {
  const url = process.env.REVALIDATION_URL;
  const token = process.env.REVALIDATION_TOKEN;

  if (!url || !token) {
    log("REVALIDATION_URL or REVALIDATION_TOKEN is not set, skipping revalidation");
    return;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "x-revalidation-token": token,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      error(`Revalidation failed (${response.status}): ${body}`);
      return;
    }

    const result = await response.json();
    info(`Revalidation triggered: ${JSON.stringify(result)}`);
  } catch (err) {
    error("Failed to trigger revalidation:", err);
  }
}
