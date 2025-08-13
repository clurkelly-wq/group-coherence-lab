
// Netlify Function: QRNG proxy with CORS headers
// Tries AQN (with key), then ANU Legacy, then NIST, then local PRNG.
// Returns { data: [uint16], source: '...' }

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const AQN_KEY = "FMmavwbCJW3JcvPNkEda77EiuiyhrVZe2nUQbF20";

function corsHeaders(){
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders(), body: '' };
  }

  const len = Math.min(1024, Math.max(1, parseInt((event.queryStringParameters && event.queryStringParameters.len) || '16', 10)));
  // Try AQN
  try{
    const r = await fetch(`https://api.quantumnumbers.anu.edu.au/random?length=${len}&type=uint16`, { headers: { 'x-api-key': AQN_KEY } });
    if(r.ok){
      const j = await r.json();
      const arr = (j.data || j).map(x => x & 0xFFFF);
      return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify({ data: arr, source: 'ANU AQN' }) };
    }
  }catch(e){ /* fall through */ }

  // Try ANU Legacy
  try{
    const r = await fetch(`https://qrng.anu.edu.au/API/jsonI.php?length=${len}&type=uint16`);
    if(r.ok){
      const j = await r.json();
      if(j.success){
        const arr = (j.data||[]).map(x => x & 0xFFFF);
        return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify({ data: arr, source: 'ANU Legacy' }) };
      }
    }
  }catch(e){ /* fall through */ }

  // Try NIST Beacon
  try{
    const r = await fetch("https://beacon.nist.gov/beacon/2.0/pulse/last");
    if(r.ok){
      const j = await r.json();
      let hex = j.pulse && j.pulse.outputValue || '';
      while (hex.length < len*4) hex += hex;
      const out = [];
      for(let i=0;i<len;i++){ out.push(parseInt(hex.slice(i*4, i*4+4), 16) & 0xFFFF); }
      return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify({ data: out, source: 'NIST Beacon' }) };
    }
  }catch(e){ /* fall through */ }

  // Local PRNG fallback
  const out = Array.from({length: len}, () => Math.floor(Math.random()*65536)&0xFFFF);
  return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify({ data: out, source: 'Local PRNG' }) };
};
