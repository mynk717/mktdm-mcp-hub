import { GlassCard } from "@/components/GlassCard";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
        MKTDM Command Center
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard>
          <h2 className="text-xl font-semibold mb-4">MCP Server Status</h2>
          <div className="space-y-2">
            <p>Research: <span className="text-green-400">Connected</span></p>
            <p>Content: <span className="text-green-400">Connected</span></p>
            <p>Auditor: <span className="text-green-400">Connected</span></p>
          </div>
        </GlassCard>
        <GlassCard>
          <h2 className="text-xl font-semibold mb-4">Token Management</h2>
          <a href="/tokens" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded inline-block">
            Manage API Keys
          </a>
        </GlassCard>
      </div>
    </div>
  );
}
