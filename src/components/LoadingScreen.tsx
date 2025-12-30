import React from 'react';

export default function LoadingScreen(): JSX.Element {
  return (
    <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a'}}>
      <div style={{textAlign: 'center'}}>
        <div style={{width:48, height:48, borderRadius:9999, border:'4px solid rgba(255,255,255,0.08)', borderTopColor:'#60a5fa', animation:'spin 1s linear infinite', margin:'0 auto'}} />
        <div style={{marginTop:12, color:'#94a3b8'}}>Loading SmartCare…</div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
