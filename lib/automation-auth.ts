import { Receiver } from "@upstash/qstash";

import { appEnv, hasQStashConfig } from "@/lib/env";

async function isQStashAuthorized(request: Request) {
  const signature = request.headers.get("upstash-signature");
  if (!signature || !hasQStashConfig()) {
    return false;
  }

  try {
    const receiver = new Receiver({
      currentSigningKey: appEnv.qstashCurrentSigningKey,
      nextSigningKey: appEnv.qstashNextSigningKey,
    });

    return await receiver.verify({
      signature,
      body: await request.clone().text(),
      url: request.url,
      upstashRegion: request.headers.get("upstash-region") ?? undefined,
    });
  } catch {
    return false;
  }
}

export async function isAutomationAuthorized(request: Request) {
  if (await isQStashAuthorized(request)) {
    return true;
  }

  if (!appEnv.automationToken) {
    return true;
  }

  const headerToken = request.headers.get("x-tradelock-automation-token");
  const url = new URL(request.url);
  const queryToken = url.searchParams.get("token");

  return headerToken === appEnv.automationToken || queryToken === appEnv.automationToken;
}
