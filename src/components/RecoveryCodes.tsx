import React, { useState } from 'react';
import { apiFetch } from '@/lib/api';

interface Props {}

export const RecoveryCodes: React.FC<Props> = () => {
  const [codes, setCodes] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async (): Promise<void> => {
    setError(null);
    try {
      const res = (await apiFetch({ path: '/mfa/recovery/generate', method: 'POST' })) as { recovery_codes: string[] };
      setCodes(res.recovery_codes);
    } catch (e: any) {
      setError(e?.message || 'Failed to generate recovery codes');
    }
  };

  const download = (): void => {
    if (!codes) return;
    const blob = new Blob([codes.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'smartcare-recovery-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h3>Recovery Codes</h3>
      {!codes && <button onClick={generate}>Generate Recovery Codes</button>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {codes && (
        <div>
          <p>These codes are shown only once. Store them in a safe place.</p>
          <ul>
            {codes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <button onClick={download}>Download</button>
        </div>
      )}
    </div>
  );
};

export default RecoveryCodes;
