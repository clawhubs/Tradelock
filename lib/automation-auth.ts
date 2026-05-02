import { appEnv } from "@/lib/env";

export function isAutomationAuthorized(request: Request) {
  if (!appEnv.automationToken) {
    return true;
  }

  const headerToken = request.headers.get("x-tradelock-automation-token");
  const url = new URL(request.url);
  const queryToken = url.searchParams.get("token");

  return headerToken === appEnv.automationToken || queryToken === appEnv.automationToken;
}
