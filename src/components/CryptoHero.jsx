export default function CryptoHero() {
  const COINS = [
    { symbol:'₿',  label:'BTC',  color:'#F7931A', size:115, x:48,  y:40,  delay:0,   dur:6   },
    { symbol:'Ξ',  label:'ETH',  color:'#627EEA', size:80,  x:78,  y:18,  delay:1,   dur:7   },
    { symbol:'₮',  label:'USDT', color:'#26A17B', size:68,  x:72,  y:65,  delay:2,   dur:8   },
    { symbol:'B',  label:'BNB',  color:'#F3BA2F', size:60,  x:90,  y:48,  delay:0.5, dur:6.5 },
    { symbol:'◎',  label:'SOL',  color:'#9945FF', size:54,  x:32,  y:68,  delay:1.5, dur:7.5 },
    { symbol:'✕',  label:'XRP',  color:'#346AA9', size:46,  x:60,  y:15,  delay:3,   dur:9   },
    { symbol:'◈',  label:'LTC',  color:'#BFBBBB', size:40,  x:88,  y:75,  delay:2.5, dur:5.5 },
    { symbol:'₳',  label:'ADA',  color:'#0033AD', size:44,  x:20,  y:30,  delay:1.2, dur:8   },
    { symbol:'◉',  label:'DOT',  color:'#E6007A', size:38,  x:15,  y:60,  delay:2.2, dur:6.8 },
    { symbol:'Ð',  label:'DOGE', color:'#C3A634', size:36,  x:38,  y:88,  delay:0.8, dur:7.2 },
    { symbol:'⬡',  label:'MATIC',color:'#8247E5', size:34,  x:65,  y:88,  delay:3.5, dur:6   },
    { symbol:'◆',  label:'TRX',  color:'#FF0013', size:32,  x:8,   y:45,  delay:1.8, dur:9   },
    { symbol:'☀',  label:'AVAX', color:'#E84142', size:36,  x:95,  y:28,  delay:2.8, dur:7   },
    { symbol:'⬟',  label:'LINK', color:'#2A5ADA', size:30,  x:5,   y:82,  delay:0.3, dur:8.5 },
  ];

  const LINES = [
    [48,40, 78,18], [48,40, 72,65], [48,40, 90,48], [48,40, 60,15],
    [78,18, 90,48], [78,18, 60,15], [78,18, 95,28],
    [72,65, 88,75], [72,65, 65,88], [72,65, 38,88],
    [32,68, 15,60], [32,68, 20,30], [32,68, 38,88],
    [20,30, 8,45],  [8,45,  5,82],  [15,60, 5,82],
    [90,48, 95,28], [90,48, 88,75],
  ];

  const PARTICLES = Array.from({length:35}, (_,i) => ({
    x: 3 + (i * 41 + i * i * 7) % 94,
    y: 3 + (i * 67 + i * 13) % 94,
    size: 1.5 + (i % 4) * 0.8,
    color: ['#F7931A','#627EEA','#F0B90B','#26A17B','#9945FF','#346AA9','#E6007A'][i%7],
    delay: i * 0.25,
    dur: 3 + (i % 5),
  }));

  const RINGS = [
    { x:48, y:40, r:145, color:'#F7931A', opacity:0.07 },
    { x:48, y:40, r:210, color:'#627EEA', opacity:0.05 },
    { x:48, y:40, r:280, color:'#9945FF', opacity:0.04 },
  ];

  return (
    <div style={{ position:'relative', width:'100%', height:'100%', minHeight:'380px',
      background:'radial-gradient(ellipse at 55% 45%, #0d1b3e 0%, #080f22 40%, #0B0E11 75%, #0B0E11 100%)',
      borderRadius:'0px', overflow:'hidden' }}>

      <style>{`
        ${COINS.map((c,i) => `
          @keyframes fc${i} {
            0%   { transform: translate(-50%,-50%) translateY(0px) rotate(${i%2?'-':''}3deg) scale(1); }
            100% { transform: translate(-50%,-50%) translateY(${-10-i*1.5}px) rotate(${i%2?'':'-'}5deg) scale(${1+i*0.005}); }
          }
        `).join('')}
        ${PARTICLES.map((_,i) => `
          @keyframes fp${i} {
            0%   { opacity:0.15; transform:scale(1); }
            50%  { opacity:0.7; }
            100% { opacity:0.2; transform:scale(2); }
          }
        `).join('')}
        @keyframes ringPulse {
          0%,100% { opacity:0.04; transform:translate(-50%,-50%) scale(1); }
          50%      { opacity:0.12; transform:translate(-50%,-50%) scale(1.04); }
        }
      `}</style>

      {/* Ambient glow blobs */}
      <div style={{ position:'absolute', width:'320px', height:'320px', borderRadius:'50%',
        background:'radial-gradient(circle, rgba(99,126,234,0.22) 0%, transparent 70%)',
        top:'5%', left:'25%', filter:'blur(50px)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', width:'240px', height:'240px', borderRadius:'50%',
        background:'radial-gradient(circle, rgba(247,147,26,0.15) 0%, transparent 70%)',
        top:'35%', right:'5%', filter:'blur(40px)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', width:'200px', height:'200px', borderRadius:'50%',
        background:'radial-gradient(circle, rgba(153,69,255,0.14) 0%, transparent 70%)',
        bottom:'5%', left:'20%', filter:'blur(35px)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', width:'180px', height:'180px', borderRadius:'50%',
        background:'radial-gradient(circle, rgba(230,0,122,0.1) 0%, transparent 70%)',
        top:'10%', right:'30%', filter:'blur(40px)', pointerEvents:'none' }} />

      {/* Orbit rings */}
      {RINGS.map((ring,i) => (
        <div key={`ring${i}`} style={{
          position:'absolute', left:`${ring.x}%`, top:`${ring.y}%`,
          width:`${ring.r*2}px`, height:`${ring.r*2}px`, borderRadius:'50%',
          border:`1px solid ${ring.color}`,
          opacity: ring.opacity,
          transform:'translate(-50%,-50%)',
          animation:`ringPulse ${5+i*2}s ease-in-out ${i*0.8}s infinite`,
          pointerEvents:'none',
        }} />
      ))}

      {/* Connection lines */}
      <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}
        viewBox="0 0 100 100" preserveAspectRatio="none">
        {LINES.map(([x1,y1,x2,y2], i) => {
          const fromCoin = COINS.find(c=>c.x===x1&&c.y===y1);
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={fromCoin?.color || '#627EEA'}
              strokeWidth="0.25" opacity="0.18"/>
          );
        })}
      </svg>

      {/* Particles */}
      {PARTICLES.map((p,i) => (
        <div key={`p${i}`} style={{
          position:'absolute', left:`${p.x}%`, top:`${p.y}%`,
          width:`${p.size}px`, height:`${p.size}px`,
          borderRadius:'50%', background:p.color,
          animation:`fp${i} ${p.dur}s ease-in-out ${p.delay}s infinite alternate`,
          pointerEvents:'none',
        }} />
      ))}

      {/* Coins */}
      {COINS.map((c,i) => (
        <div key={i} style={{
          position:'absolute', left:`${c.x}%`, top:`${c.y}%`,
          transform:'translate(-50%,-50%)',
          animation:`fc${i} ${c.dur}s ease-in-out ${c.delay}s infinite alternate`,
          zIndex: Math.floor(c.size/20),
        }}>
          <div style={{
            width:`${c.size}px`, height:`${c.size}px`, borderRadius:'50%',
            background:`radial-gradient(circle at 32% 32%, ${c.color}ff 0%, ${c.color}99 35%, ${c.color}33 70%, ${c.color}11 100%)`,
            boxShadow:`
              0 0 ${c.size*0.5}px ${c.color}55,
              0 0 ${c.size*0.2}px ${c.color}99,
              0 ${c.size*0.1}px ${c.size*0.3}px rgba(0,0,0,0.6),
              inset 0 2px 10px rgba(255,255,255,0.3),
              inset 0 -4px 14px rgba(0,0,0,0.5)
            `,
            border:`1.5px solid ${c.color}88`,
            display:'flex', alignItems:'center', justifyContent:'center',
            position:'relative', cursor:'pointer',
          }}>
            {/* Shine */}
            <div style={{
              position:'absolute', top:'10%', left:'15%',
              width:'38%', height:'30%', borderRadius:'50%',
              background:'radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 100%)',
              filter:'blur(3px)',
            }} />
            {/* Edge glow rim */}
            <div style={{
              position:'absolute', inset:'-2px', borderRadius:'50%',
              background:`radial-gradient(circle at 70% 70%, ${c.color}44 0%, transparent 60%)`,
            }} />
            <span style={{
              fontSize:`${c.size*0.36}px`, fontWeight:'900',
              color:'rgba(255,255,255,0.95)',
              textShadow:`0 0 14px ${c.color}, 0 2px 6px rgba(0,0,0,0.6)`,
              lineHeight:1, position:'relative', zIndex:1, fontFamily:'sans-serif',
            }}>{c.symbol}</span>
          </div>
          <div style={{
            textAlign:'center', marginTop:'5px',
            fontSize:`${Math.max(9,c.size*0.11)}px`, fontWeight:'700',
            color:c.color, textShadow:`0 0 10px ${c.color}88`,
            letterSpacing:'0.06em', opacity:0.9,
          }}>{c.label}</div>
        </div>
      ))}
    </div>
  );
}