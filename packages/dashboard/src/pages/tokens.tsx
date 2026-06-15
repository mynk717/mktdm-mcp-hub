import { useState } from 'react';
import { GlassCard } from "@/components/GlassCard";

export default function TokenManager() {
  const [keyName, setKeyName] = useState('');
  const [value, setValue] = useState('');
  const [message, setMessage] = useState('');

  const saveKey = async () => {
    const res = await fetch('/api/secrets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-mktdm-admin-token': 'YOUR_DEV_TOKEN' }, // Placeholder auth
      body: JSON.stringify({ keyName, value }),
    });
    if (res.ok) setMessage('Key saved successfully!');
    else setMessage('Error saving key');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Token Manager</h1>
      <GlassCard className="max-w-md">
        <div className="space-y-4">
          <input 
            placeholder="Key Name (e.g., semrush)" 
            className="w-full p-2 bg-slate-800 rounded text-white"
            onChange={(e) => setKeyName(e.target.value)}
          />
          <input 
            type="password"
            placeholder="API Key" 
            className="w-full p-2 bg-slate-800 rounded text-white"
            onChange={(e) => setValue(e.target.value)}
          />
          <button onClick={saveKey} className="bg-blue-600 px-4 py-2 rounded">Save Key</button>
          {message && <p className="mt-4 text-sm">{message}</p>}
        </div>
      </GlassCard>
    </div>
  );
}
