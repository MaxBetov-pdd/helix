import re

with open('frontend/src/lib/stores/navMetrics.ts', 'r') as f:
    content = f.read()

# Remove import
content = re.sub(r"import\s*\{\s*createPoller.*?'\$lib/utils/polling';\n", "", content)

# Remove poller vars
content = re.sub(r"let poller:\s*Poller\s*\|\s*null\s*=\s*null;\n", "", content)
content = re.sub(r"const POLL_MS = \d+;\n", "", content)

# Remove poller functions
content = re.sub(r"function startFallbackPoller\(\)[\s\S]*?function syncPollerWithWs\(\)[\s\S]*?\}\n\n", "", content)

# Update startNavMetricsPolling
content = content.replace("syncPollerWithWs();", "")

# Update wsConnectedHandler
content = content.replace("wsConnectedHandler = () => {\n\t\t\tvoid refreshNavMetrics();\n\t\t};", "wsConnectedHandler = () => {\n\t\t\tvoid refreshNavMetrics();\n\t\t};")

# Remove wsDisconnectedHandler usage completely
content = re.sub(r"let wsDisconnectedHandler.*?\n", "", content)
content = re.sub(r"if \(typeof window !== 'undefined' && !wsDisconnectedHandler\) \{[\s\S]*?\}\n", "", content)
content = re.sub(r"if \(typeof window !== 'undefined' && wsDisconnectedHandler\) \{[\s\S]*?\}\n", "", content)
content = content.replace("stopFallbackPoller();\n\t", "")

with open('frontend/src/lib/stores/navMetrics.ts', 'w') as f:
    f.write(content)
