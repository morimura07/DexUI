export default function AboutHero() {
  return (
    <div style={{
      position:'relative', width:'100%', height:'100%',
      minHeight:'460px', overflow:'hidden',
      background:'radial-gradient(ellipse at 48% 55%, #1a1408 0%, #120d05 38%, #0B0E11 70%, #0B0E11 100%)',
    }}>
      <style>{`
        @keyframes orbit1 { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes orbit2 { from{transform:rotate(120deg)} to{transform:rotate(480deg)} }
        @keyframes orbit3 { from{transform:rotate(240deg)} to{transform:rotate(600deg)} }
        @keyframes orbit4 { from{transform:rotate(60deg)} to{transform:rotate(-300deg)} }
        @keyframes phoneFloat { 0%,100%{transform:translate(-50%,-52%) perspective(1100px) rotateY(-3deg) rotateX(2deg)} 50%{transform:translate(-50%,-56%) perspective(1100px) rotateY(-3deg) rotateX(2deg)} }
        @keyframes centerGlow { 0%,100%{opacity:0.5;transform:translate(-50%,-50%) scale(1)} 50%{opacity:0.85;transform:translate(-50%,-50%) scale(1.1)} }
        @keyframes dotPulse { 0%,100%{opacity:0.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.4)} }
        @keyframes starTwinkle { 0%,100%{opacity:0.2} 50%{opacity:0.85} }
      `}</style>

      {/* Star field — warm gold/amber */}
      {[[8,12],[18,65],[32,8],[45,78],[62,20],[72,55],[85,10],[90,72],[15,40],[55,90],[78,35],[38,50]].map(([x,y],i)=>(
        <div key={i} style={{position:'absolute',left:`${x}%`,top:`${y}%`,width: i%3===0?'3px':'2px',height:i%3===0?'3px':'2px',borderRadius:'50%',background: i%4===0 ? 'rgba(255,240,210,0.85)' : 'rgba(240,200,120,0.75)',animation:`starTwinkle ${2+i*0.4}s ease-in-out ${i*0.3}s infinite`}}/>
      ))}

      {/* Center glow — gold */}
      <div style={{position:'absolute',left:'48%',top:'55%',transform:'translate(-50%,-50%)',width:'200px',height:'200px',borderRadius:'50%',background:'radial-gradient(circle,rgba(240,185,11,0.22) 0%,rgba(201,154,9,0.10) 50%,transparent 70%)',filter:'blur(22px)',animation:'centerGlow 4s ease-in-out infinite'}}/>

      {/* ── ORBIT RINGS (gold dashed) ── */}
      <div style={{position:'absolute',left:'48%',top:'55%',transform:'translate(-50%,-50%)',width:'200px',height:'200px',borderRadius:'50%',border:'1px dashed rgba(240,185,11,0.28)',pointerEvents:'none'}}>
        <div style={{position:'absolute',top:'0',left:'50%',marginLeft:'-4px',marginTop:'-4px',width:'8px',height:'8px',animation:'orbit1 8s linear infinite',transformOrigin:'4px 104px'}}>
          <div style={{width:'8px',height:'8px',borderRadius:'50%',background:'radial-gradient(circle,#fff,#F0B90B)',boxShadow:'0 0 8px #F0B90B,0 0 16px rgba(240,185,11,0.5)',animation:'dotPulse 2s ease-in-out infinite'}}/>
        </div>
      </div>

      <div style={{position:'absolute',left:'48%',top:'55%',transform:'translate(-50%,-50%)',width:'310px',height:'310px',borderRadius:'50%',border:'1px dashed rgba(240,185,11,0.20)',pointerEvents:'none'}}>
        <div style={{position:'absolute',top:'0',left:'50%',marginLeft:'-5px',marginTop:'-5px',width:'10px',height:'10px',animation:'orbit2 13s linear infinite',transformOrigin:'5px 160px'}}>
          <div style={{width:'10px',height:'10px',borderRadius:'50%',background:'radial-gradient(circle,#fff0cc,#F0B90B)',boxShadow:'0 0 10px #F0B90B,0 0 20px rgba(240,185,11,0.5)',animation:'dotPulse 3s ease-in-out 0.5s infinite'}}/>
        </div>
        <div style={{position:'absolute',top:'0',left:'50%',marginLeft:'-4px',marginTop:'-4px',width:'8px',height:'8px',animation:'orbit2 13s linear infinite',animationDelay:'-6s',transformOrigin:'4px 159px'}}>
          <div style={{width:'8px',height:'8px',borderRadius:'50%',background:'rgba(255,230,170,0.9)',boxShadow:'0 0 6px rgba(240,200,120,0.8)'}}/>
        </div>
      </div>

      <div style={{position:'absolute',left:'48%',top:'55%',transform:'translate(-50%,-50%)',width:'420px',height:'420px',borderRadius:'50%',border:'1px dashed rgba(240,185,11,0.14)',pointerEvents:'none'}}>
        <div style={{position:'absolute',top:'0',left:'50%',marginLeft:'-6px',marginTop:'-6px',width:'12px',height:'12px',animation:'orbit3 20s linear infinite',transformOrigin:'6px 216px'}}>
          <div style={{width:'12px',height:'12px',borderRadius:'50%',background:'radial-gradient(circle,#fff,#F0B90B)',boxShadow:'0 0 12px #F0B90B,0 0 25px rgba(240,185,11,0.4)'}}/>
        </div>
        <div style={{position:'absolute',top:'0',left:'50%',marginLeft:'-4px',marginTop:'-4px',width:'7px',height:'7px',animation:'orbit3 20s linear infinite',animationDelay:'-10s',transformOrigin:'3.5px 213.5px'}}>
          <div style={{width:'7px',height:'7px',borderRadius:'50%',background:'rgba(240,200,120,0.7)',boxShadow:'0 0 6px rgba(240,200,120,0.5)'}}/>
        </div>
      </div>

      <div style={{position:'absolute',left:'48%',top:'55%',transform:'translate(-50%,-50%)',width:'540px',height:'540px',borderRadius:'50%',border:'1px dashed rgba(240,185,11,0.08)',pointerEvents:'none'}}>
        <div style={{position:'absolute',top:'0',left:'50%',marginLeft:'-5px',marginTop:'-5px',width:'10px',height:'10px',animation:'orbit4 28s linear infinite',transformOrigin:'5px 275px'}}>
          <div style={{width:'10px',height:'10px',borderRadius:'50%',background:'radial-gradient(circle,#ffe6aa,#c99a09)',boxShadow:'0 0 8px rgba(240,200,120,0.6)'}}/>
        </div>
      </div>

      {/* soft gold glow bridge behind phone */}
      <div style={{position:'absolute',left:'48%',top:'50%',transform:'translate(-50%,-50%)',width:'300px',height:'420px',borderRadius:'40px',background:'radial-gradient(ellipse,rgba(240,185,11,0.10),transparent 65%)',filter:'blur(30px)',pointerEvents:'none'}}/>

      {/* ── PHONE — pulled in, larger, more frontal ── */}
      <div style={{
        position:'absolute', left:'48%', top:'50%',
        animation:'phoneFloat 5s ease-in-out infinite',
        zIndex:10,
      }}>
        <div style={{
          width:'224px', height:'448px', borderRadius:'34px',
          background:'linear-gradient(145deg,#1f1a10,#0d1117)',
          border:'2px solid rgba(240,185,11,0.22)',
          boxShadow:'0 0 0 1px rgba(255,255,255,0.04), 0 30px 80px rgba(0,0,0,0.9), 0 0 50px rgba(240,185,11,0.14)',
          overflow:'hidden', position:'relative',
        }}>
          {/* Notch */}
          <div style={{position:'absolute',top:'11px',left:'50%',transform:'translateX(-50%)',width:'60px',height:'5px',background:'#0d1117',borderRadius:'3px',zIndex:10}}/>

          {/* Screen */}
          <div style={{paddingTop:'30px',height:'100%',display:'flex',flexDirection:'column',background:'linear-gradient(180deg,#11151c 0%,#0a0f16 100%)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 16px 8px'}}>
              <span style={{fontSize:'14px',fontWeight:'800',color:'#F0B90B',letterSpacing:'0.3px'}}>SwiftSwap</span>
              <span style={{fontSize:'7.5px',fontWeight:'700',color:'#03A66D',background:'rgba(3,166,109,0.15)',padding:'2px 6px',borderRadius:'4px',border:'1px solid rgba(3,166,109,0.3)'}}>● Live</span>
            </div>

            <div style={{margin:'6px 11px 0',background:'#1E2329',borderRadius:'11px',padding:'10px 12px',border:'1px solid #2B3139'}}>
              <div style={{fontSize:'8.5px',color:'#848E9C',marginBottom:'4px',fontWeight:'600'}}>You Give</div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{fontSize:'19px',fontWeight:'800',color:'#fff'}}>1,000</div>
                <div style={{fontSize:'9.5px',fontWeight:'700',color:'#F0B90B',background:'rgba(240,185,11,0.12)',padding:'3px 8px',borderRadius:'5px'}}>UAH</div>
              </div>
              <div style={{fontSize:'7.5px',color:'#848E9C',marginTop:'2px'}}>Min: 500 · Max: 200,000</div>
            </div>

            <div style={{display:'flex',justifyContent:'center',margin:'7px 0'}}>
              <div style={{width:'26px',height:'26px',borderRadius:'50%',background:'#2B3139',border:'1px solid #363D45',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',color:'#F0B90B'}}>⇅</div>
            </div>

            <div style={{margin:'0 11px',background:'#1E2329',borderRadius:'11px',padding:'10px 12px',border:'1px solid #2B3139'}}>
              <div style={{fontSize:'8.5px',color:'#848E9C',marginBottom:'4px',fontWeight:'600'}}>You Receive</div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{fontSize:'19px',fontWeight:'800',color:'#03A66D'}}>26.34</div>
                <div style={{fontSize:'9.5px',fontWeight:'700',color:'#26A17B',background:'rgba(38,161,123,0.12)',padding:'3px 8px',borderRadius:'5px'}}>USDT</div>
              </div>
              <div style={{fontSize:'7.5px',color:'#03A66D',marginTop:'2px'}}>Rate: 37.97 UAH / 1 USDT</div>
            </div>

            <div style={{margin:'7px 11px 0',background:'#1E2329',borderRadius:'11px',padding:'9px 12px',border:'1px solid #2B3139'}}>
              <div style={{fontSize:'8.5px',color:'#848E9C',marginBottom:'2px',fontWeight:'600'}}>USDT Wallet Address</div>
              <div style={{fontSize:'7.5px',color:'#848E9C',fontFamily:'monospace'}}>TRx9K...mQ8p</div>
            </div>

            <div style={{margin:'7px 11px 0',display:'flex',flexDirection:'column',gap:'3px'}}>
              {['✓  I agree with the rules','✓  I agree with KYC/AML policy'].map((t,i)=>(
                <div key={i} style={{fontSize:'7.5px',color:'#03A66D'}}>{t}</div>
              ))}
            </div>

            {/* Button pinned to bottom for a real-app feel */}
            <div style={{margin:'auto 11px 14px',background:'linear-gradient(135deg,#F0B90B,#c99a09)',borderRadius:'10px',padding:'11px',textAlign:'center'}}>
              <div style={{fontSize:'10.5px',fontWeight:'800',color:'#000'}}>Start Exchange →</div>
            </div>
          </div>

          {/* Glare */}
          <div style={{position:'absolute',top:0,left:0,width:'35%',height:'100%',background:'linear-gradient(105deg,rgba(255,255,255,0.03) 0%,transparent 60%)',pointerEvents:'none'}}/>
        </div>

        {/* Phone glow underneath — gold */}
        <div style={{position:'absolute',bottom:'-25px',left:'50%',transform:'translateX(-50%)',width:'140px',height:'18px',background:'radial-gradient(ellipse,rgba(240,185,11,0.4),transparent)',filter:'blur(12px)'}}/>
      </div>

    </div>
  );
}