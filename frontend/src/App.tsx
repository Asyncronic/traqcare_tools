import React, { useMemo, useState } from 'react'

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-800/60 bg-neutral-950/80 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400" />
          <div className="text-lg font-semibold tracking-tight">TraqCare Tools</div>
          <span className="ml-2 rounded-full border border-neutral-800 px-2 py-0.5 text-xs text-neutral-400">Modern Utilities</span>
        </div>
        <nav className="text-sm text-neutral-400">
          <a href="#tcp" className="hover:text-neutral-200">TCP</a>
          <span className="mx-3 opacity-40">•</span>
          <a href="#udp" className="hover:text-neutral-200">UDP</a>
          <span className="mx-3 opacity-40">•</span>
          <a href="#api" className="hover:text-neutral-200">API</a>
          <span className="mx-3 opacity-40">•</span>
          <a href="#fcm" className="hover:text-neutral-200">FCM</a>
          <span className="mx-3 opacity-40">•</span>
          <a href="#about" className="hover:text-neutral-200">About</a>
        </nav>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-neutral-800 bg-gradient-to-b from-neutral-900 to-neutral-950 p-8 md:p-12 mt-8">
      <div className="max-w-2xl">
        <h1 className="text-3xl md:text-5xl font-semibold leading-tight tracking-tight">
          Run diagnostics. Send packets. Ship push.
        </h1>
        <p className="mt-4 text-neutral-400 md:text-lg">
          A focused toolbox for IoT & fleet teams: TCP/UDP clients to send Hex/ASCII to your device servers,
          an API tester for HTTP requests, and a Firebase Cloud Messaging sender for quick notification tests.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Badge>Hex / ASCII</Badge>
          <Badge>Same connection</Badge>
          <Badge>TLS-ready (via backend)</Badge>
          <Badge>FCM HTTP v1</Badge>
        </div>
      </div>
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-blue-600/20 to-cyan-400/10 blur-2xl" />
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-neutral-800/60 py-10 text-center text-sm text-neutral-500">
      <div className="mx-auto max-w-6xl px-4">
        © {new Date().getFullYear()} TraqCare Tools — Built for quick testing. Do not paste secrets client-side.
      </div>
    </footer>
  )
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1 text-xs text-neutral-300">
      {children}
    </span>
  )
}

function Card({ title, subtitle, children, id }: { title: string; subtitle?: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="mt-8 rounded-3xl border border-neutral-800 bg-neutral-950 p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-neutral-400">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm text-neutral-300">{label}</span>
      {children}
    </label>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "w-full rounded-xl border border-neutral-800 bg-neutral-900/70 px-3 py-2",
        "text-sm text-neutral-100 placeholder:text-neutral-500",
        "focus:outline-none focus:ring-2 focus:ring-blue-500/40",
        props.className || "",
      ].join(" ")}
    />
  )
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={[
        "w-full rounded-xl border border-neutral-800 bg-neutral-900/70 px-3 py-2",
        "text-sm text-neutral-100 placeholder:text-neutral-500",
        "focus:outline-none focus:ring-2 focus:ring-blue-500/40",
        "min-h-[120px]",
        props.className || "",
      ].join(" ")}
    />
  )
}

function Button({ children, loading, ...props }: { children: React.ReactNode; loading?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={[
        "rounded-xl px-4 py-2 text-sm font-medium",
        "bg-blue-600 enabled:hover:bg-blue-500 disabled:opacity-50",
        "focus:outline-none focus:ring-2 focus:ring-blue-500/40",
        props.className || "",
      ].join(" ")}
    >
      {loading ? "Please wait…" : children}
    </button>
  )
}

function Tabs({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(0);
  const items = React.Children.toArray(children) as React.ReactElement[];
  return (
    <div className="mt-10">
      <div className="flex flex-wrap gap-2">
        {items.map((item: any, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={[
              "rounded-full border px-4 py-2 text-sm",
              active === i
                ? "border-blue-600 bg-blue-600/10 text-blue-300"
                : "border-neutral-800 bg-neutral-900 text-neutral-300 hover:bg-neutral-800/60",
            ].join(" ")}
          >
            {item.props.label}
          </button>
        ))}
      </div>
      <div className="mt-6">{items[active]}</div>
    </div>
  )
}

function Tab({ children }: { label: string; children: React.ReactNode }) {
  return <div>{children}</div>
}

function Copyable({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1000);
        } catch { }
      }}
      className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1 text-xs text-neutral-300 hover:bg-neutral-800"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  )
}

// ---------- TCP Client Tool ----------
function TcpClientTool() {
  // Load saved state from localStorage
  const loadState = <T,>(key: string, defaultValue: T): T => {
    try {
      const saved = localStorage.getItem(`tcpClient_${key}`);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [ip, setIp] = useState(() => loadState("ip", "173.212.212.92"));
  const [port, setPort] = useState(() => loadState("port", "5023"));
  const [format, setFormat] = useState<"hex" | "ascii">(() => loadState("format", "hex"));
  const [receive, setReceive] = useState(() => loadState("receive", true));
  const [timeout, setTimeoutSeconds] = useState(() => loadState("timeout", "2"));
  const [packets, setPackets] = useState<string>(() => loadState("packets", [
    "78780D01086471700328358100093F040D0A",
    "78781f121809030e1620c6027917540c4679500f142101cc00243c003e4a027fb7ac0d0a",
  ].join("\n")));
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  // Persistent connection mode
  const [persistentMode, setPersistentMode] = useState(() => loadState("persistentMode", false));
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [singlePacket, setSinglePacket] = useState("");
  const [streamEnabled, setStreamEnabled] = useState(() => loadState("streamEnabled", true));

  // For canceling requests and SSE
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const eventSourceRef = React.useRef<EventSource | null>(null);

  // Save state to localStorage whenever it changes
  React.useEffect(() => {
    localStorage.setItem("tcpClient_ip", JSON.stringify(ip));
  }, [ip]);

  React.useEffect(() => {
    localStorage.setItem("tcpClient_port", JSON.stringify(port));
  }, [port]);

  React.useEffect(() => {
    localStorage.setItem("tcpClient_format", JSON.stringify(format));
  }, [format]);

  React.useEffect(() => {
    localStorage.setItem("tcpClient_receive", JSON.stringify(receive));
  }, [receive]);

  React.useEffect(() => {
    localStorage.setItem("tcpClient_timeout", JSON.stringify(timeout));
  }, [timeout]);

  React.useEffect(() => {
    localStorage.setItem("tcpClient_packets", JSON.stringify(packets));
  }, [packets]);

  React.useEffect(() => {
    localStorage.setItem("tcpClient_persistentMode", JSON.stringify(persistentMode));
  }, [persistentMode]);

  React.useEffect(() => {
    localStorage.setItem("tcpClient_streamEnabled", JSON.stringify(streamEnabled));
  }, [streamEnabled]);

  const addLog = (line: string) => setLogs((l) => [
    `${new Date().toLocaleTimeString()} › ${line}`,
    ...l,
  ].slice(0, 400));

  // SSE streaming effect - connects to real-time data stream
  React.useEffect(() => {
    if (!sessionId || !isConnected || !streamEnabled) {
      // Close existing connection if any
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    // Create EventSource connection to stream endpoint
    const eventSource = new EventSource(`/api/tcp/stream/${sessionId}`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('SSE connection opened');
    };

    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === 'connected') {
          addLog(`🔄 Real-time streaming connected`);
        } else if (message.type === 'data') {
          // Format and display incoming data
          const resp = message.data;
          const formatHex = (hex: string) => hex.match(/.{1,2}/g)?.join(' ') || hex;

          addLog(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
          addLog(`← UNSOLICITED from server (${resp.length} bytes)`);
          addLog(`  HEX: ${formatHex(resp.hex)}`);
          if (resp.ascii && /[a-zA-Z0-9]/.test(resp.ascii)) {
            addLog(`  ASC: ${resp.ascii}`);
          }
          addLog(`  Time: ${new Date(resp.timestamp).toLocaleTimeString()}`);
          addLog('');
        }
      } catch (e) {
        console.error('Failed to parse SSE message:', e);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      eventSource.close();
      eventSourceRef.current = null;
    };

    // Cleanup on unmount or when dependencies change
    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [sessionId, isConnected, streamEnabled]);

  // Cancel any ongoing request
  const cancelRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
  };

  // Force disconnect without waiting for server
  const forceDisconnect = () => {
    addLog(`🔌 Force disconnecting...`);
    setIsConnected(false);
    setSessionId(null);
    setLoading(false);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    addLog(`✓ Disconnected locally (server connection may still be open)`);
    addLog('');
  };

  // Persistent connection functions
  async function handleConnect() {
    setLoading(true);

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();
    const timeoutId = setTimeout(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        addLog(`❌ Connection timeout after 15 seconds`);
      }
    }, 15000);

    try {
      addLog(`🔌 Connecting to ${ip}:${port}...`);
      const res = await fetch("/api/tcp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip, port, keepAlive: true }),
        signal: abortControllerRef.current.signal,
      });

      clearTimeout(timeoutId);

      let json;
      try {
        json = await res.json();
      } catch (parseError) {
        addLog(`❌ Backend error: Invalid response (is backend running?)`);
        return;
      }

      if (res.ok && json.sessionId) {
        setSessionId(json.sessionId);
        setIsConnected(true);
        addLog(`✓ Connected! Session: ${json.sessionId.substring(0, 8)}...`);
        addLog(`💡 Connection will stay open. You can send packets one at a time.`);
        if (streamEnabled) {
          addLog(`🔄 Real-time streaming enabled: server messages will appear instantly`);
        }
        addLog('');
      } else {
        addLog(`❌ Connection failed: ${json.error || 'Unknown error'}`);
      }
    } catch (e: any) {
      clearTimeout(timeoutId);
      if (e.name === 'AbortError') {
        addLog(`❌ Connection cancelled or timed out`);
      } else if (e.message?.includes('Failed to fetch') || e.message?.includes('NetworkError')) {
        addLog(`❌ Cannot connect to backend server. Is it running on port 8787?`);
      } else {
        addLog(`❌ Exception: ${e?.message || e}`);
      }
    } finally {
      abortControllerRef.current = null;
      setLoading(false);
    }
  }

  async function handleSendSingle() {
    if (!sessionId || !singlePacket.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/tcp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          data: singlePacket.trim(),
          data_format: format,
          receive_response: receive,
          timeout: Number(timeout),
        }),
      });
      const json = await res.json();

      if (res.ok) {
        const formatHex = (hex: string) => hex.match(/.{1,2}/g)?.join(' ') || hex;

        addLog(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        addLog(`→ SENT (${json.sent.length} bytes)`);
        addLog(`  HEX: ${formatHex(json.sent.hex)}`);
        if (json.sent.ascii && /[a-zA-Z0-9]/.test(json.sent.ascii)) {
          addLog(`  ASC: ${json.sent.ascii}`);
        }

        if (json.responses && json.responses.length > 0) {
          json.responses.forEach((resp: any) => {
            addLog(``);
            addLog(`← RECV Response (${resp.length} bytes)`);
            addLog(`  HEX: ${formatHex(resp.hex)}`);
            if (resp.ascii && /[a-zA-Z0-9]/.test(resp.ascii)) {
              addLog(`  ASC: ${resp.ascii}`);
            }
          });
        } else if (receive) {
          addLog(``);
          addLog(`  ⏱ No response received (timeout after ${timeout}s)`);
        }
        addLog('');

        setSinglePacket(''); // Clear input after successful send
      } else {
        addLog(`❌ Send failed: ${json.error || 'Unknown error'}`);
        if (json.error?.includes('Connection not found')) {
          setIsConnected(false);
          setSessionId(null);
        }
      }
    } catch (e: any) {
      addLog(`❌ Exception: ${e?.message || e}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect() {
    if (!sessionId) return;

    setLoading(true);

    // Create abort controller with timeout
    abortControllerRef.current = new AbortController();
    const timeoutId = setTimeout(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        addLog(`❌ Disconnect timeout - forcing local cleanup`);
      }
    }, 5000);

    try {
      addLog(`Disconnecting...`);
      const res = await fetch("/api/tcp/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
        signal: abortControllerRef.current.signal,
      });

      clearTimeout(timeoutId);

      let json;
      try {
        json = await res.json();
      } catch (parseError) {
        addLog(`⚠️ Disconnected (server may have closed connection already)`);
        setIsConnected(false);
        setSessionId(null);
        return;
      }

      if (res.ok) {
        addLog(`✓ Disconnected. Total responses: ${json.totalResponses || 0}`);
      } else {
        addLog(`⚠️ Disconnect warning: ${json.error || 'Connection may already be closed'}`);
      }
    } catch (e: any) {
      clearTimeout(timeoutId);
      if (e.name === 'AbortError') {
        addLog(`⚠️ Disconnect timeout - connection likely already closed`);
      } else {
        addLog(`⚠️ Disconnect error: ${e?.message || e}`);
      }
    } finally {
      // ALWAYS clear connection state locally, regardless of server response
      setIsConnected(false);
      setSessionId(null);
      abortControllerRef.current = null;
      setLoading(false);
      addLog(''); // blank line
    }
  }

  async function handleSend() {
    setLoading(true);
    setLogs([]);

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();
    const timeoutId = setTimeout(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        addLog(`❌ Request timeout after 30 seconds`);
      }
    }, 30000);

    try {
      const body = {
        ip,
        port: Number(port),
        data_format: format,
        receive_response: receive,
        timeout: Number(timeout),
        data_list: packets
          .split(/\r?\n/)
          .map((s) => s.trim())
          .filter(Boolean),
      };
      addLog(`Connecting to ${ip}:${port}...`);
      const res = await fetch("/api/tcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: abortControllerRef.current.signal,
      });

      clearTimeout(timeoutId);

      let json;
      try {
        json = await res.json();
      } catch (parseError) {
        addLog(`❌ Backend error: Invalid response (is backend running?)`);
        return;
      }

      if (!res.ok) {
        addLog(`❌ Error: HTTP ${res.status}`);
        if (json?.error) addLog(`Detail: ${json.error}`);

        // Show events even on error
        if (Array.isArray(json?.events)) {
          json.events.forEach((evt: any) => {
            const time = new Date(evt.timestamp).toLocaleTimeString();
            addLog(`[${time}] ${evt.type.toUpperCase()}: ${evt.message}`);
          });
        }
      } else {
        // Show summary header
        if (json?.summary) {
          addLog(`✓ Communication Complete`);
          addLog(`  Packets sent: ${json.summary.totalPacketsSent}`);
          addLog(`  Responses received: ${json.summary.totalResponsesReceived}`);
          if (json.summary.totalPacketsFailed > 0) {
            addLog(`  ⚠ Failed: ${json.summary.totalPacketsFailed}`);
          }
          addLog('');
        }

        // Show detailed results per packet
        if (Array.isArray(json?.results)) {
          json.results.forEach((result: any) => {
            const pktNum = result.packetIndex + 1;

            if (result.error) {
              addLog(`❌ Packet #${pktNum}: ${result.error}`);
              addLog(''); // blank line
              return;
            }

            // Format hex in groups of 2 for readability
            const formatHex = (hex: string) => {
              return hex.match(/.{1,2}/g)?.join(' ') || hex;
            };

            addLog(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            addLog(`→ SENT Packet #${pktNum} (${result.length} bytes)`);
            addLog(`  HEX: ${formatHex(result.sentHex)}`);
            if (result.sentAscii && /[a-zA-Z0-9]/.test(result.sentAscii)) {
              addLog(`  ASC: ${result.sentAscii}`);
            }

            if (result.responses && result.responses.length > 0) {
              result.responses.forEach((resp: any, idx: number) => {
                const prefix = result.responses.length > 1 ? `  ${idx + 1}` : '';
                addLog(``);
                addLog(`← RECV${prefix ? ` #${prefix}` : ''} Response (${resp.length} bytes)`);
                addLog(`  HEX: ${formatHex(resp.hex)}`);
                if (resp.ascii && /[a-zA-Z0-9]/.test(resp.ascii)) {
                  addLog(`  ASC: ${resp.ascii}`);
                }
              });
            } else if (receive) {
              addLog(``);
              addLog(`  ⏱ No response received (timeout after ${timeout}s)`);
            }
            addLog(''); // blank line after each packet
          });
        }

        // Show connection events for debugging
        if (Array.isArray(json?.events)) {
          const importantEvents = json.events.filter((e: any) =>
            ['connect', 'close', 'error', 'timeout'].includes(e.type)
          );
          importantEvents.forEach((evt: any) => {
            const time = new Date(evt.timestamp).toLocaleTimeString();
            const icon = evt.type === 'error' ? '❌' : evt.type === 'connect' ? '🔌' : 'ℹ️';
            addLog(`${icon} [${time}] ${evt.message}`);
          });
        }
      }
    } catch (e: any) {
      clearTimeout(timeoutId);
      if (e.name === 'AbortError') {
        addLog(`❌ Request cancelled or timed out`);
      } else if (e.message?.includes('Failed to fetch') || e.message?.includes('NetworkError')) {
        addLog(`❌ Cannot connect to backend server. Is it running on port 8787?`);
      } else {
        addLog(`❌ Exception: ${e?.message || e}`);
      }
    } finally {
      abortControllerRef.current = null;
      setLoading(false);
    }
  }

  return (
    <Card
      id="tcp"
      title="GPS Tracker TCP Client"
      subtitle="Send multiple hex/ASCII packets over the same TCP connection via a secure backend proxy."
    >
      <div className="grid gap-6">
        {/* Configuration Section */}
        <div className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Field label="Server IP / Host">
              <Input value={ip} onChange={(e) => setIp(e.target.value)} placeholder="e.g. 192.168.1.100" />
            </Field>
            <Field label="Port">
              <Input value={port} onChange={(e) => setPort(e.target.value)} placeholder="5005" />
            </Field>
            <Field label="Timeout (seconds)">
              <Input value={timeout} onChange={(e) => setTimeoutSeconds(e.target.value)} placeholder="2" />
            </Field>
            <Field label="Data format">
              <div className="flex gap-2">
                <button
                  onClick={() => setFormat("hex")}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm ${format === "hex"
                    ? "border-blue-600 bg-blue-600/10 text-blue-300"
                    : "border-neutral-800 bg-neutral-900 text-neutral-300"
                    }`}
                >
                  Hex
                </button>
                <button
                  onClick={() => setFormat("ascii")}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm ${format === "ascii"
                    ? "border-blue-600 bg-blue-600/10 text-blue-300"
                    : "border-neutral-800 bg-neutral-900 text-neutral-300"
                    }`}
                >
                  ASCII
                </button>
              </div>
            </Field>
          </div>

          {/* Mode Selection */}
          <div className="flex items-center gap-4 rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
            <div className="flex items-center gap-2">
              <input
                id="persistentMode"
                type="checkbox"
                className="h-4 w-4 rounded border-neutral-700 bg-neutral-900"
                checked={persistentMode}
                onChange={(e) => {
                  setPersistentMode(e.target.checked);
                  if (!e.target.checked && isConnected) {
                    handleDisconnect();
                  }
                }}
                disabled={isConnected}
              />
              <label htmlFor="persistentMode" className="text-sm font-medium text-neutral-300">
                Persistent Connection Mode
              </label>
              <span className="ml-2 text-xs text-neutral-500">
                {persistentMode ? '(Keep connection open, send packets individually)' : '(Send all packets at once, then close)'}
              </span>
            </div>
            {isConnected && (
              <div className="ml-auto flex items-center gap-2 rounded-lg bg-green-600/20 border border-green-600/40 px-3 py-1">
                <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-green-300 font-medium">Connected</span>
              </div>
            )}
          </div>

          {!persistentMode ? (
            // Batch Mode UI
            <>
              <Field label="Packets (one per line)">
                <Textarea
                  value={packets}
                  onChange={(e) => setPackets(e.target.value)}
                  placeholder={"7878… one per line"}
                  className="min-h-[100px]"
                />
              </Field>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    id="receive"
                    type="checkbox"
                    className="h-4 w-4 rounded border-neutral-700 bg-neutral-900"
                    checked={receive}
                    onChange={(e) => setReceive(e.target.checked)}
                  />
                  <label htmlFor="receive" className="text-sm text-neutral-300">
                    Wait for response
                  </label>
                </div>
                <div className="flex-1" />
                <button
                  onClick={() => setLogs([])}
                  className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm hover:bg-neutral-800"
                  disabled={loading}
                >
                  Clear logs
                </button>
                {loading ? (
                  <button
                    onClick={cancelRequest}
                    className="rounded-xl border border-orange-800 bg-orange-900/20 px-4 py-2 text-sm text-orange-300 hover:bg-orange-900/40"
                  >
                    Cancel
                  </button>
                ) : (
                  <Button onClick={handleSend}>Send All Packets</Button>
                )}
              </div>
            </>
          ) : (
            // Persistent Mode UI
            <>
              {!isConnected ? (
                <div className="flex items-center gap-4">
                  <div className="flex-1 text-sm text-neutral-400">
                    Click Connect to open a persistent connection. You can then send packets one at a time.
                  </div>
                  <button
                    onClick={() => setLogs([])}
                    className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm hover:bg-neutral-800"
                    disabled={loading}
                  >
                    Clear logs
                  </button>
                  {loading ? (
                    <button
                      onClick={cancelRequest}
                      className="rounded-xl border border-orange-800 bg-orange-900/20 px-4 py-2 text-sm text-orange-300 hover:bg-orange-900/40"
                    >
                      Cancel
                    </button>
                  ) : (
                    <Button onClick={handleConnect}>
                      🔌 Connect
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <Field label="Send packet (one at a time)">
                    <div className="flex gap-2">
                      <Input
                        value={singlePacket}
                        onChange={(e) => setSinglePacket(e.target.value)}
                        placeholder="Enter packet hex/ASCII..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey && singlePacket.trim()) {
                            e.preventDefault();
                            handleSendSingle();
                          }
                        }}
                        className="flex-1"
                      />
                      <Button onClick={handleSendSingle} loading={loading} disabled={!singlePacket.trim()}>
                        Send →
                      </Button>
                    </div>
                  </Field>

                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          id="receive"
                          type="checkbox"
                          className="h-4 w-4 rounded border-neutral-700 bg-neutral-900"
                          checked={receive}
                          onChange={(e) => setReceive(e.target.checked)}
                        />
                        <label htmlFor="receive" className="text-sm text-neutral-300">
                          Wait for response
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          id="streamEnabled"
                          type="checkbox"
                          className="h-4 w-4 rounded border-neutral-700 bg-neutral-900"
                          checked={streamEnabled}
                          onChange={(e) => setStreamEnabled(e.target.checked)}
                        />
                        <label htmlFor="streamEnabled" className="text-sm text-neutral-300">
                          Real-time streaming (instant server messages)
                        </label>
                      </div>
                      <div className="flex-1" />
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1" />
                      <button
                        onClick={() => setLogs([])}
                        className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm hover:bg-neutral-800"
                        disabled={loading}
                      >
                        Clear logs
                      </button>
                      {loading ? (
                        <button
                          onClick={forceDisconnect}
                          className="rounded-xl border border-orange-800 bg-orange-900/20 px-4 py-2 text-sm text-orange-300 hover:bg-orange-900/40"
                          title="Force disconnect without waiting for server"
                        >
                          Force Disconnect
                        </button>
                      ) : (
                        <button
                          onClick={handleDisconnect}
                          className="rounded-xl border border-red-800 bg-red-900/20 px-4 py-2 text-sm text-red-300 hover:bg-red-900/40"
                        >
                          Disconnect
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Logs Section - Full Width */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-base font-medium text-neutral-100">Communication Log</div>
              <div className="text-xs text-neutral-500 mt-1">Packet transmission and device responses</div>
            </div>
            <Copyable text={logs.slice().reverse().join("\n")} />
          </div>
          <div className="overflow-auto border border-neutral-800 rounded-xl bg-neutral-900/50 p-4" style={{ maxHeight: '500px', minHeight: '300px' }}>
            {logs.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-neutral-600">
                <div className="text-center">
                  <div className="text-4xl mb-2">📡</div>
                  <div>No communication yet. Send packets to see results here.</div>
                </div>
              </div>
            ) : (
              <div className="space-y-1 font-mono text-xs">
                {logs.map((l, i) => {
                  // Determine styling based on log content
                  let colorClass = 'text-neutral-400';
                  let bgClass = '';
                  let fontClass = '';

                  if (l.includes('→ SENT')) {
                    colorClass = 'text-blue-300 font-semibold';
                  } else if (l.includes('← RECV')) {
                    colorClass = 'text-green-300 font-semibold';
                  } else if (l.includes('HEX:')) {
                    colorClass = 'text-cyan-200 pl-2';
                    fontClass = 'text-[11px]';
                  } else if (l.includes('ASC:')) {
                    colorClass = 'text-purple-300 pl-2';
                    fontClass = 'text-[11px]';
                  } else if (l.includes('❌')) {
                    colorClass = 'text-red-400';
                  } else if (l.includes('✓')) {
                    colorClass = 'text-green-400 font-medium';
                  } else if (l.includes('⚠')) {
                    colorClass = 'text-yellow-400';
                  } else if (l.includes('🔌')) {
                    colorClass = 'text-blue-400';
                  } else if (l.includes('⏱')) {
                    colorClass = 'text-orange-400 pl-2';
                  } else if (l.includes('━━━')) {
                    colorClass = 'text-neutral-700';
                  }

                  return (
                    <div
                      key={i}
                      className={`leading-relaxed ${colorClass} ${bgClass} ${fontClass}`}
                    >
                      {l}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Tips Section */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 text-xs text-neutral-400">
          <div className="text-neutral-300 mb-2 font-medium">Quick Tips</div>
          <div className="grid md:grid-cols-2 gap-x-6 gap-y-2">
            <div>• Hex format: continuous string, no spaces (e.g., <code className="text-blue-400">78780D0D0A</code>)</div>
            <div>• ASCII format: plain text for protocols like <code className="text-green-400">*HQ,123,V1#</code></div>
            <div>• <strong>Batch mode:</strong> Send all packets at once, connection closes after</div>
            <div>• <strong>Persistent mode:</strong> Keep connection open, send packets one at a time</div>
            <div>• <strong>Real-time streaming:</strong> Server messages appear instantly (no polling!)</div>
            <div>• <strong>Unsolicited messages:</strong> Heartbeats and commands from server shown immediately</div>
            <div>• Responses shown in both hex and ASCII when applicable</div>
            <div>• Press Enter to quickly send a packet in persistent mode</div>
          </div>
        </div>
      </div>
    </Card>
  )
}

// ---------- UDP Client Tool ----------
function UdpClientTool() {
  // Load saved state from localStorage
  const loadState = <T,>(key: string, defaultValue: T): T => {
    try {
      const saved = localStorage.getItem(`udpClient_${key}`);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [ip, setIp] = useState(() => loadState("ip", "173.212.212.92"));
  const [port, setPort] = useState(() => loadState("port", "5023"));
  const [format, setFormat] = useState<"hex" | "ascii">(() => loadState("format", "hex"));
  const [receive, setReceive] = useState(() => loadState("receive", true));
  const [timeout, setTimeoutSeconds] = useState(() => loadState("timeout", "2"));
  const [packets, setPackets] = useState<string>(() => loadState("packets", [
    "78780D01086471700328358100093F040D0A",
    "78781f121809030e1620c6027917540c4679500f142101cc00243c003e4a027fb7ac0d0a",
  ].join("\n")));
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  // For canceling requests
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Save state to localStorage whenever it changes
  React.useEffect(() => {
    localStorage.setItem("udpClient_ip", JSON.stringify(ip));
  }, [ip]);

  React.useEffect(() => {
    localStorage.setItem("udpClient_port", JSON.stringify(port));
  }, [port]);

  React.useEffect(() => {
    localStorage.setItem("udpClient_format", JSON.stringify(format));
  }, [format]);

  React.useEffect(() => {
    localStorage.setItem("udpClient_receive", JSON.stringify(receive));
  }, [receive]);

  React.useEffect(() => {
    localStorage.setItem("udpClient_timeout", JSON.stringify(timeout));
  }, [timeout]);

  React.useEffect(() => {
    localStorage.setItem("udpClient_packets", JSON.stringify(packets));
  }, [packets]);

  const addLog = (line: string) => setLogs((l) => [
    `${new Date().toLocaleTimeString()} › ${line}`,
    ...l,
  ].slice(0, 400));

  // Cancel any ongoing request
  const cancelRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
  };

  async function handleSend() {
    setLoading(true);
    setLogs([]);

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();
    const timeoutId = setTimeout(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        addLog(`❌ Request timeout after 30 seconds`);
      }
    }, 30000);

    try {
      const body = {
        ip,
        port: Number(port),
        data_format: format,
        receive_response: receive,
        timeout: Number(timeout),
        data_list: packets
          .split(/\r?\n/)
          .map((s) => s.trim())
          .filter(Boolean),
      };
      addLog(`Sending to ${ip}:${port} via UDP...`);
      const res = await fetch("/api/udp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: abortControllerRef.current.signal,
      });

      clearTimeout(timeoutId);

      let json;
      try {
        json = await res.json();
      } catch (parseError) {
        addLog(`❌ Backend error: Invalid response (is backend running?)`);
        return;
      }

      if (!res.ok) {
        addLog(`❌ Error: HTTP ${res.status}`);
        if (json?.error) addLog(`Detail: ${json.error}`);

        // Show events even on error
        if (Array.isArray(json?.events)) {
          json.events.forEach((evt: any) => {
            const time = new Date(evt.timestamp).toLocaleTimeString();
            addLog(`[${time}] ${evt.type.toUpperCase()}: ${evt.message}`);
          });
        }
      } else {
        // Show summary header
        if (json?.summary) {
          addLog(`✓ UDP Communication Complete`);
          addLog(`  Packets sent: ${json.summary.totalPacketsSent}`);
          addLog(`  Responses received: ${json.summary.totalResponsesReceived}`);
          if (json.summary.totalPacketsFailed > 0) {
            addLog(`  ⚠ Failed: ${json.summary.totalPacketsFailed}`);
          }
          addLog('');
        }

        // Show detailed results per packet
        if (Array.isArray(json?.results)) {
          json.results.forEach((result: any) => {
            const pktNum = result.packetIndex + 1;

            if (result.error) {
              addLog(`❌ Packet #${pktNum}: ${result.error}`);
              addLog(''); // blank line
              return;
            }

            // Format hex in groups of 2 for readability
            const formatHex = (hex: string) => {
              return hex.match(/.{1,2}/g)?.join(' ') || hex;
            };

            addLog(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            addLog(`→ SENT Packet #${pktNum} (${result.length} bytes)`);
            addLog(`  HEX: ${formatHex(result.sentHex)}`);
            if (result.sentAscii && /[a-zA-Z0-9]/.test(result.sentAscii)) {
              addLog(`  ASC: ${result.sentAscii}`);
            }

            if (result.responses && result.responses.length > 0) {
              result.responses.forEach((resp: any, idx: number) => {
                const prefix = result.responses.length > 1 ? `  ${idx + 1}` : '';
                addLog(``);
                addLog(`← RECV${prefix ? ` #${prefix}` : ''} Response (${resp.length} bytes)`);
                if (resp.from) {
                  addLog(`  From: ${resp.from}`);
                }
                addLog(`  HEX: ${formatHex(resp.hex)}`);
                if (resp.ascii && /[a-zA-Z0-9]/.test(resp.ascii)) {
                  addLog(`  ASC: ${resp.ascii}`);
                }
              });
            } else if (receive) {
              addLog(``);
              addLog(`  ⏱ No response received (timeout after ${timeout}s)`);
            }
            addLog(''); // blank line after each packet
          });
        }

        // Show connection events for debugging
        if (Array.isArray(json?.events)) {
          const importantEvents = json.events.filter((e: any) =>
            ['error', 'timeout', 'complete'].includes(e.type)
          );
          importantEvents.forEach((evt: any) => {
            const time = new Date(evt.timestamp).toLocaleTimeString();
            const icon = evt.type === 'error' ? '❌' : evt.type === 'complete' ? '✓' : 'ℹ️';
            addLog(`${icon} [${time}] ${evt.message}`);
          });
        }
      }
    } catch (e: any) {
      clearTimeout(timeoutId);
      if (e.name === 'AbortError') {
        addLog(`❌ Request cancelled or timed out`);
      } else if (e.message?.includes('Failed to fetch') || e.message?.includes('NetworkError')) {
        addLog(`❌ Cannot connect to backend server. Is it running on port 8787?`);
      } else {
        addLog(`❌ Exception: ${e?.message || e}`);
      }
    } finally {
      abortControllerRef.current = null;
      setLoading(false);
    }
  }

  return (
    <Card
      id="udp"
      title="UDP Client"
      subtitle="Send UDP datagrams with hex/ASCII payload. Connectionless, ideal for stateless protocols."
    >
      <div className="grid gap-6">
        {/* Configuration Section */}
        <div className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Field label="Server IP / Host">
              <Input value={ip} onChange={(e) => setIp(e.target.value)} placeholder="e.g. 192.168.1.100" />
            </Field>
            <Field label="Port">
              <Input value={port} onChange={(e) => setPort(e.target.value)} placeholder="5005" />
            </Field>
            <Field label="Timeout (seconds)">
              <Input value={timeout} onChange={(e) => setTimeoutSeconds(e.target.value)} placeholder="2" />
            </Field>
            <Field label="Data format">
              <div className="flex gap-2">
                <button
                  onClick={() => setFormat("hex")}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm ${format === "hex"
                      ? "border-blue-600 bg-blue-600/10 text-blue-300"
                      : "border-neutral-800 bg-neutral-900 text-neutral-300"
                    }`}
                >
                  Hex
                </button>
                <button
                  onClick={() => setFormat("ascii")}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm ${format === "ascii"
                      ? "border-blue-600 bg-blue-600/10 text-blue-300"
                      : "border-neutral-800 bg-neutral-900 text-neutral-300"
                    }`}
                >
                  ASCII
                </button>
              </div>
            </Field>
          </div>

          <Field label="Packets (one per line)">
            <Textarea
              value={packets}
              onChange={(e) => setPackets(e.target.value)}
              placeholder={"7878… one per line"}
              className="min-h-[100px]"
            />
          </Field>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                id="udp-receive"
                type="checkbox"
                className="h-4 w-4 rounded border-neutral-700 bg-neutral-900"
                checked={receive}
                onChange={(e) => setReceive(e.target.checked)}
              />
              <label htmlFor="udp-receive" className="text-sm text-neutral-300">
                Wait for response
              </label>
            </div>
            <div className="flex-1" />
            <button
              onClick={() => setLogs([])}
              className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm hover:bg-neutral-800"
              disabled={loading}
            >
              Clear logs
            </button>
            {loading ? (
              <button
                onClick={cancelRequest}
                className="rounded-xl border border-orange-800 bg-orange-900/20 px-4 py-2 text-sm text-orange-300 hover:bg-orange-900/40"
              >
                Cancel
              </button>
            ) : (
              <Button onClick={handleSend}>Send All Packets</Button>
            )}
          </div>
        </div>

        {/* Logs Section - Full Width */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-base font-medium text-neutral-100">Communication Log</div>
              <div className="text-xs text-neutral-500 mt-1">UDP packet transmission and responses</div>
            </div>
            <Copyable text={logs.slice().reverse().join("\n")} />
          </div>
          <div className="overflow-auto border border-neutral-800 rounded-xl bg-neutral-900/50 p-4" style={{ maxHeight: '500px', minHeight: '300px' }}>
            {logs.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-neutral-600">
                <div className="text-center">
                  <div className="text-4xl mb-2">📡</div>
                  <div>No communication yet. Send packets to see results here.</div>
                </div>
              </div>
            ) : (
              <div className="space-y-1 font-mono text-xs">
                {logs.map((l, i) => {
                  // Determine styling based on log content
                  let colorClass = 'text-neutral-400';

                  if (l.includes('→ SENT')) {
                    colorClass = 'text-blue-300 font-semibold';
                  } else if (l.includes('← RECV')) {
                    colorClass = 'text-green-300 font-semibold';
                  } else if (l.includes('HEX:')) {
                    colorClass = 'text-cyan-200 pl-2 text-[11px]';
                  } else if (l.includes('ASC:') || l.includes('From:')) {
                    colorClass = 'text-purple-300 pl-2 text-[11px]';
                  } else if (l.includes('❌')) {
                    colorClass = 'text-red-400';
                  } else if (l.includes('✓')) {
                    colorClass = 'text-green-400 font-medium';
                  } else if (l.includes('⚠')) {
                    colorClass = 'text-yellow-400';
                  } else if (l.includes('⏱')) {
                    colorClass = 'text-orange-400 pl-2';
                  } else if (l.includes('━━━')) {
                    colorClass = 'text-neutral-700';
                  }

                  return (
                    <div key={i} className={`leading-relaxed ${colorClass}`}>
                      {l}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Tips Section */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 text-xs text-neutral-400">
          <div className="text-neutral-300 mb-2 font-medium">UDP vs TCP</div>
          <div className="grid md:grid-cols-2 gap-x-6 gap-y-2">
            <div>• <strong>UDP:</strong> Connectionless, no handshake, faster but no delivery guarantee</div>
            <div>• <strong>TCP:</strong> Connection-oriented, reliable delivery, ordered packets</div>
            <div>• UDP is ideal for real-time tracking where occasional packet loss is acceptable</div>
            <div>• Responses may come from different IP/port (shown in "From:" field)</div>
            <div>• No persistent connection mode - each packet is independent</div>
            <div>• Lower overhead than TCP, suitable for high-frequency updates</div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ---------- FCM Sender Tool ----------
function FcmSenderTool() {
  // Load saved state from localStorage
  const loadFcmState = <T,>(key: string, defaultValue: T): T => {
    try {
      const saved = localStorage.getItem(`fcm_${key}`);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [configMode, setConfigMode] = useState<"manual" | "json">(() => loadFcmState("configMode", "json"));
  const [serviceAccountJson, setServiceAccountJson] = useState(() => loadFcmState("serviceAccountJson", ""));
  const [projectId, setProjectId] = useState(() => loadFcmState("projectId", ""));
  const [deviceToken, setDeviceToken] = useState(() => loadFcmState("deviceToken", ""));
  const [title, setTitle] = useState(() => loadFcmState("title", "Test Notification"));
  const [body, setBody] = useState(() => loadFcmState("body", "This is a test message sent using FCM HTTP v1 API."));
  const [badge, setBadge] = useState(() => loadFcmState("badge", "1"));
  const [sound, setSound] = useState(() => loadFcmState("sound", "default"));
  const [mutable, setMutable] = useState(() => loadFcmState("mutable", true));
  const [contentAvailable, setContentAvailable] = useState(() => loadFcmState("contentAvailable", true));
  const [customData, setCustomData] = useState<string>(() => loadFcmState("customData", "key1=value1\nkey2=value2"));
  const [loading, setLoading] = useState(false);
  const [out, setOut] = useState<string>("");

  // Save state to localStorage
  React.useEffect(() => localStorage.setItem("fcm_configMode", JSON.stringify(configMode)), [configMode]);
  React.useEffect(() => localStorage.setItem("fcm_serviceAccountJson", JSON.stringify(serviceAccountJson)), [serviceAccountJson]);
  React.useEffect(() => localStorage.setItem("fcm_projectId", JSON.stringify(projectId)), [projectId]);
  React.useEffect(() => localStorage.setItem("fcm_deviceToken", JSON.stringify(deviceToken)), [deviceToken]);
  React.useEffect(() => localStorage.setItem("fcm_title", JSON.stringify(title)), [title]);
  React.useEffect(() => localStorage.setItem("fcm_body", JSON.stringify(body)), [body]);
  React.useEffect(() => localStorage.setItem("fcm_badge", JSON.stringify(badge)), [badge]);
  React.useEffect(() => localStorage.setItem("fcm_sound", JSON.stringify(sound)), [sound]);
  React.useEffect(() => localStorage.setItem("fcm_mutable", JSON.stringify(mutable)), [mutable]);
  React.useEffect(() => localStorage.setItem("fcm_contentAvailable", JSON.stringify(contentAvailable)), [contentAvailable]);
  React.useEffect(() => localStorage.setItem("fcm_customData", JSON.stringify(customData)), [customData]);

  const dataObject = useMemo(() => {
    const obj: Record<string, string> = {};
    customData
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .forEach((line) => {
        const ix = line.indexOf("=");
        if (ix > 0) obj[line.slice(0, ix)] = line.slice(ix + 1);
      });
    return obj;
  }, [customData]);

  async function send() {
    setLoading(true);
    setOut("");

    // Extract project_id from service account JSON if in JSON mode
    let actualProjectId = projectId;
    let serviceAccount = null;

    if (configMode === "json" && serviceAccountJson.trim()) {
      try {
        serviceAccount = JSON.parse(serviceAccountJson);
        actualProjectId = serviceAccount.project_id || projectId;
      } catch (e) {
        setOut(`❌ Invalid service account JSON: ${e instanceof Error ? e.message : String(e)}`);
        setLoading(false);
        return;
      }
    }

    if (!actualProjectId || !deviceToken) {
      setOut("❌ Project ID and Device Token are required");
      setLoading(false);
      return;
    }

    try {
      const payload: any = {
        projectId: actualProjectId,
        token: deviceToken,
        notification: { title, body },
        apns: {
          sound,
          badge: Number(badge) || 0,
          mutableContent: !!mutable,
          contentAvailable: !!contentAvailable,
        },
        data: dataObject,
      };

      // Include service account if provided (backend will use it instead of env var)
      if (serviceAccount) {
        payload.serviceAccount = serviceAccount;
      }

      const res = await fetch("/api/fcm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let json;
      try {
        json = await res.json();
      } catch (parseError) {
        setOut(`❌ Backend error: Invalid response (is backend running?)`);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setOut(`❌ HTTP ${res.status}\n` + JSON.stringify(json, null, 2));
      } else {
        setOut(`✅ Success!\n\n` + JSON.stringify(json, null, 2));
      }
    } catch (e: any) {
      if (e.message?.includes('Failed to fetch') || e.message?.includes('NetworkError')) {
        setOut(`❌ Cannot connect to backend server. Is it running on port 8787?`);
      } else {
        setOut(`❌ ${e?.message || e}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card id="fcm" title="FCM HTTP v1 Sender" subtitle="Send push notifications via your backend using a service account.">
      <div className="grid gap-6">
        {/* Configuration Mode Toggle */}
        <div className="flex items-center gap-4 rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-neutral-400">Config Mode:</span>
            <button
              onClick={() => setConfigMode("json")}
              className={`rounded-lg border px-4 py-2 text-sm ${configMode === "json"
                  ? "border-blue-600 bg-blue-600/10 text-blue-300"
                  : "border-neutral-800 bg-neutral-900 text-neutral-300 hover:bg-neutral-800"
                }`}
            >
              📋 Paste Service Account JSON
            </button>
            <button
              onClick={() => setConfigMode("manual")}
              className={`rounded-lg border px-4 py-2 text-sm ${configMode === "manual"
                  ? "border-blue-600 bg-blue-600/10 text-blue-300"
                  : "border-neutral-800 bg-neutral-900 text-neutral-300 hover:bg-neutral-800"
                }`}
            >
              ✏️ Manual Entry
            </button>
          </div>
          <div className="flex-1" />
          <span className="text-xs text-neutral-500">
            {configMode === "json"
              ? "Paste your complete service account JSON (includes credentials + project ID)"
              : "Project ID required. Backend uses GOOGLE_APPLICATION_CREDENTIALS for credentials"}
          </span>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="grid gap-4 md:col-span-2">
            {/* Service Account JSON Mode */}
            {configMode === "json" && (
              <Field label="Service Account JSON (includes project_id and credentials)">
                <Textarea
                  value={serviceAccountJson}
                  onChange={(e) => setServiceAccountJson(e.target.value)}
                  placeholder={`{\n  "type": "service_account",\n  "project_id": "your-project-id",\n  "private_key_id": "...",\n  "private_key": "...",\n  "client_email": "...",\n  "client_id": "...",\n  "auth_uri": "...",\n  "token_uri": "...",\n  "auth_provider_x509_cert_url": "...",\n  "client_x509_cert_url": "..."\n}`}
                  className="min-h-[180px] font-mono text-xs"
                />
              </Field>
            )}

            {/* Manual Mode - show project ID field */}
            {configMode === "manual" && (
              <Field label="Firebase Project ID (credentials from backend environment)">
                <Input value={projectId} onChange={(e) => setProjectId(e.target.value)} placeholder="your-project-id" />
              </Field>
            )}

            <Field label="Target Device Token">
              <Input value={deviceToken} onChange={(e) => setDeviceToken(e.target.value)} placeholder="FCM device token" />
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Title">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </Field>
              <Field label="Body">
                <Input value={body} onChange={(e) => setBody(e.target.value)} />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Field label="Badge">
                <Input value={badge} onChange={(e) => setBadge(e.target.value)} placeholder="1" />
              </Field>
              <Field label="Sound">
                <Input value={sound} onChange={(e) => setSound(e.target.value)} placeholder="default or alert.caf" />
              </Field>
              <Field label="Mutable Content?">
                <div className="flex items-center gap-2 pt-1.5">
                  <input
                    id="mutable"
                    type="checkbox"
                    className="h-4 w-4 rounded border-neutral-700 bg-neutral-900"
                    checked={mutable}
                    onChange={(e) => setMutable(e.target.checked)}
                  />
                  <label htmlFor="mutable" className="text-sm text-neutral-300">Yes</label>
                </div>
              </Field>
              <Field label="Content Available?">
                <div className="flex items-center gap-2 pt-1.5">
                  <input
                    id="contentAvailable"
                    type="checkbox"
                    className="h-4 w-4 rounded border-neutral-700 bg-neutral-900"
                    checked={contentAvailable}
                    onChange={(e) => setContentAvailable(e.target.checked)}
                  />
                  <label htmlFor="contentAvailable" className="text-sm text-neutral-300">Yes</label>
                </div>
              </Field>
            </div>

            <Field label="Custom data (key=value per line)">
              <Textarea value={customData} onChange={(e) => setCustomData(e.target.value)} />
            </Field>

            <div className="flex items-center gap-3">
              <Button onClick={send} loading={loading}>Send Notification</Button>
              <button
                onClick={() => setOut("")}
                className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm hover:bg-neutral-800"
                disabled={loading}
              >
                Clear output
              </button>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-medium text-neutral-300">Server response</div>
                {out && <Copyable text={out} />}
              </div>
              <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap break-words text-xs text-neutral-400">{out || "No response yet."}</pre>
            </div>
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 text-xs text-neutral-400">
              <div className="text-neutral-300 mb-2 font-medium">Configuration Modes</div>
              <div className="space-y-3 mb-4">
                <div className="rounded-lg border border-blue-800/50 bg-blue-900/20 p-3">
                  <div className="font-medium text-blue-300 mb-1">📋 JSON Mode (Recommended)</div>
                  <ul className="list-disc space-y-1 pl-4 text-neutral-400">
                    <li>Paste complete service account JSON from Firebase Console</li>
                    <li>Includes both credentials AND project ID</li>
                    <li>Backend authenticates using the pasted credentials</li>
                    <li>Most convenient for testing</li>
                  </ul>
                </div>
                <div className="rounded-lg border border-neutral-700/50 bg-neutral-800/20 p-3">
                  <div className="font-medium text-neutral-300 mb-1">✏️ Manual Mode</div>
                  <ul className="list-disc space-y-1 pl-4 text-neutral-400">
                    <li>You provide: Project ID only</li>
                    <li>Backend provides: Credentials from GOOGLE_APPLICATION_CREDENTIALS env variable</li>
                    <li>Requires backend setup with service account file</li>
                    <li>Good for shared/production environments</li>
                  </ul>
                </div>
              </div>
              <ul className="list-disc space-y-1 pl-4 text-neutral-400">
                <li>iOS fields map to APNs payload: <code>sound</code>, <code>badge</code>, <code>mutable-content</code>, <code>content-available</code>.</li>
                <li>Your settings are saved automatically and restored on reload.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

// ---------- API Tester Tool ----------
function ApiTesterTool() {
  const loadState = <T,>(key: string, defaultValue: T): T => {
    try {
      const saved = localStorage.getItem(`apiTester_${key}`);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [method, setMethod] = useState(() => loadState("method", "POST"));
  const [url, setUrl] = useState(() => loadState("url", "http://173.212.212.92:7000/api/pushData"));
  const [headers, setHeaders] = useState(() => loadState("headers",
    "Content-Type: application/json\nAuthorization: Bearer xxxxxxxxxxxxx"
  ));
  const [body, setBody] = useState(() => loadState("body", JSON.stringify({
    newObject: {
      deviceId: "866334070714239",
      acc: false,
      speed: 8,
      protocolName: "heartbeat",
      server_time: "2025-11-01T10:57:22Z"
    }
  }, null, 2)));
  const [timeout, setTimeout] = useState(() => loadState("timeout", "10000"));
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string>("");

  // Save state
  React.useEffect(() => localStorage.setItem("apiTester_method", JSON.stringify(method)), [method]);
  React.useEffect(() => localStorage.setItem("apiTester_url", JSON.stringify(url)), [url]);
  React.useEffect(() => localStorage.setItem("apiTester_headers", JSON.stringify(headers)), [headers]);
  React.useEffect(() => localStorage.setItem("apiTester_body", JSON.stringify(body)), [body]);
  React.useEffect(() => localStorage.setItem("apiTester_timeout", JSON.stringify(timeout)), [timeout]);

  // Auto-format JSON when body changes
  const formatJson = () => {
    try {
      const parsed = JSON.parse(body);
      const formatted = JSON.stringify(parsed, null, 2);
      setBody(formatted);
    } catch (e) {
      // If not valid JSON, leave as-is
    }
  };

  // Parse headers from text format to object
  const parseHeaders = () => {
    const headerObj: Record<string, string> = {};
    headers.split('\n').forEach(line => {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();
        if (key) headerObj[key] = value;
      }
    });
    return headerObj;
  };

  const handleSend = async () => {
    setLoading(true);
    setResponse(null);
    setError("");

    try {
      const parsedHeaders = parseHeaders();

      let parsedBody = null;
      if (['POST', 'PUT', 'PATCH'].includes(method) && body.trim()) {
        // Try to parse as JSON, otherwise use as-is
        try {
          parsedBody = JSON.parse(body);
        } catch {
          parsedBody = body;
        }
      }

      const res = await fetch("/api/http-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method,
          url,
          headers: parsedHeaders,
          body: parsedBody,
          timeout: Number(timeout) || 10000
        }),
      });

      const json = await res.json();

      if (res.ok) {
        setResponse(json);
      } else {
        setError(json.error || `HTTP ${res.status} error`);
      }
    } catch (e: any) {
      if (e.message?.includes('Failed to fetch') || e.message?.includes('NetworkError')) {
        setError('Cannot connect to backend server. Is it running on port 8787?');
      } else {
        setError(e?.message || String(e));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      id="api"
      title="API Request Tester"
      subtitle="Send HTTP requests to external APIs with custom headers and body"
    >
      <div className="grid gap-6 md:grid-cols-3">
        {/* Request Configuration - Left 2/3 */}
        <div className="grid gap-4 md:col-span-2">
          {/* Method and URL */}
          <div className="grid grid-cols-[140px_1fr] gap-4">
            <Field label="Method">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900/70 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </Field>
            <Field label="URL">
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://api.example.com/endpoint" />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Timeout (ms)">
              <Input value={timeout} onChange={(e) => setTimeout(e.target.value)} placeholder="10000" />
            </Field>
          </div>

          {/* Headers */}
          <Field label="Headers (one per line: Key: Value)">
            <Textarea
              value={headers}
              onChange={(e) => setHeaders(e.target.value)}
              placeholder="Content-Type: application/json&#10;Authorization: Bearer your-token"
              className="min-h-[100px] font-mono text-xs"
            />
          </Field>

          {/* Request Body */}
          {['POST', 'PUT', 'PATCH'].includes(method) && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-neutral-300">Request Body (JSON or plain text)</span>
                <button
                  onClick={formatJson}
                  className="text-xs rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1 text-neutral-300 hover:bg-neutral-700"
                  type="button"
                >
                  Format JSON
                </button>
              </div>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder='{"key": "value"}'
                className="min-h-[150px] font-mono text-xs"
              />
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button onClick={handleSend} loading={loading}>
              {loading ? "Sending..." : "Send Request"}
            </Button>
            <button
              onClick={() => {
                setResponse(null);
                setError("");
              }}
              className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm hover:bg-neutral-800"
              disabled={loading}
            >
              Clear Response
            </button>
          </div>
        </div>

        {/* Response Panel - Right 1/3 */}
        <div className="grid gap-4">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-medium text-neutral-300">Response</div>
              {response && <Copyable text={JSON.stringify(response.data, null, 2)} />}
            </div>

            {/* Status and Duration */}
            {response && (
              <div className="mb-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${response.ok ? 'bg-green-600/20 text-green-300 border border-green-600/40' : 'bg-red-600/20 text-red-300 border border-red-600/40'
                    }`}>
                    {response.status} {response.statusText}
                  </span>
                  <span className="text-xs text-neutral-500">{response.duration}ms</span>
                </div>
                <div className="text-xs text-neutral-500">
                  Type: <span className="text-neutral-400">{response.contentType}</span>
                </div>
              </div>
            )}

            {/* Response Body */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 max-h-[400px] overflow-auto">
              {error ? (
                <div className="text-xs text-red-400">
                  <div className="font-semibold mb-1">❌ Error</div>
                  <pre className="whitespace-pre-wrap break-words">{error}</pre>
                </div>
              ) : response ? (
                <pre className="whitespace-pre-wrap break-words text-xs text-neutral-300">
                  {typeof response.data === 'object'
                    ? JSON.stringify(response.data, null, 2)
                    : String(response.data)}
                </pre>
              ) : (
                <div className="text-center text-neutral-600 py-8">
                  <div className="text-2xl mb-2">📡</div>
                  <div className="text-xs">No response yet</div>
                </div>
              )}
            </div>
          </div>

          {/* Response Headers */}
          {response?.headers && (
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
              <div className="mb-2 text-sm font-medium text-neutral-300">Response Headers</div>
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 max-h-[200px] overflow-auto">
                <pre className="whitespace-pre-wrap break-words text-xs text-neutral-400 font-mono">
                  {Object.entries(response.headers).map(([key, value]) => (
                    `${key}: ${value}\n`
                  )).join('')}
                </pre>
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 text-xs text-neutral-400">
            <div className="text-neutral-300 mb-2 font-medium">Quick Tips</div>
            <ul className="list-disc space-y-1 pl-4">
              <li>Headers format: <code className="text-cyan-400">Key: Value</code> (one per line)</li>
              <li>JSON body is automatically parsed</li>
              <li>All requests proxied through secure backend</li>
              <li>Supports custom timeouts and CORS headers</li>
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
}

function AboutSetup() {
  return (
    <Card id="about" title="About" subtitle="How TraqCare Tools works">
      <div className="grid gap-6">
        <div>
          <h3 className="text-lg font-semibold text-neutral-200 mb-3">Architecture</h3>
          <p className="text-neutral-300 mb-4">
            TraqCare Tools is a web-based testing platform with a secure backend proxy architecture.
            The backend handles operations that browsers cannot perform directly, such as opening raw TCP sockets
            and managing OAuth authentication.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-neutral-200 mb-3">Tools</h3>
          <ul className="space-y-3 text-neutral-300">
            <li className="flex gap-3">
              <span className="text-blue-400 font-semibold">•</span>
              <div>
                <strong className="text-neutral-200">TCP Client:</strong> Test GPS trackers and IoT devices by sending hex/ASCII packets.
                Supports both batch mode (send all at once) and persistent mode (keep connection open for interactive testing with real-time streaming).
              </div>
            </li>
            <li className="flex gap-3">
              <span className="text-cyan-400 font-semibold">•</span>
              <div>
                <strong className="text-neutral-200">UDP Client:</strong> Send UDP datagrams for connectionless communication.
                Ideal for stateless protocols and high-frequency updates where occasional packet loss is acceptable.
              </div>
            </li>
            <li className="flex gap-3">
              <span className="text-purple-400 font-semibold">•</span>
              <div>
                <strong className="text-neutral-200">API Tester:</strong> Send HTTP requests to external APIs with custom headers and body.
                Supports GET, POST, PUT, PATCH, and DELETE methods with JSON or plain text payloads.
              </div>
            </li>
            <li className="flex gap-3">
              <span className="text-green-400 font-semibold">•</span>
              <div>
                <strong className="text-neutral-200">FCM Sender:</strong> Send Firebase Cloud Messaging push notifications for testing.
                Service account credentials are kept secure on the backend.
              </div>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-neutral-200 mb-3">Key Features</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
              <h4 className="text-sm font-medium text-blue-300 mb-2">Persistent Connections</h4>
              <p className="text-xs text-neutral-400">
                Maintain open TCP connections for up to 5 minutes, allowing multiple round-trip communications
                with your device or server.
              </p>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
              <h4 className="text-sm font-medium text-green-300 mb-2">State Persistence</h4>
              <p className="text-xs text-neutral-400">
                Your settings (IP, port, packets, mode) are automatically saved to localStorage
                and restored when you return.
              </p>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
              <h4 className="text-sm font-medium text-purple-300 mb-2">Real-time Logging</h4>
              <p className="text-xs text-neutral-400">
                See exactly what's sent and received with color-coded hex and ASCII display,
                including byte counts and timestamps.
              </p>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
              <h4 className="text-sm font-medium text-orange-300 mb-2">Connection Control</h4>
              <p className="text-xs text-neutral-400">
                Cancel hanging requests, force disconnect stuck connections, and set custom timeouts
                for reliable testing.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-700 bg-neutral-900/30 p-4 text-sm text-neutral-400">
          <strong className="text-neutral-300">Note:</strong> This tool is designed for testing and diagnostics.
          The backend must be running for the TCP and FCM features to work.
        </div>
      </div>
    </Card>
  )
}

export default function App() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <Header />
      <main className="mx-auto max-w-6xl px-4 pb-24">
        <Hero />
        <Tabs>
          <Tab label="TCP Client">
            <TcpClientTool />
          </Tab>
          <Tab label="UDP Client">
            <UdpClientTool />
          </Tab>
          <Tab label="API Tester">
            <ApiTesterTool />
          </Tab>
          <Tab label="FCM Sender">
            <FcmSenderTool />
          </Tab>
          <Tab label="About">
            <AboutSetup />
          </Tab>
        </Tabs>
      </main>
      <Footer />
    </div>
  )
}
