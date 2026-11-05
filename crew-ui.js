/* Crew rest layout, shared by the app's Crew rest screen and the standalone calculator.
   Top to bottom: a big UTC clock, the settings (who is flying, flight times, fine tune), then the plan
   (totals, a strip of the rests, the schedule with wake-up calls). Pages wire the controls themselves:
   buttons carry data-cr="crew|slot|round|gap|each|wake|startNow|startClear" (and data-v or data-d),
   fields have ids cr-off, cr-on, cr-start, cr-end. Times are UTC (Z). */
(function(){
  'use strict';
  var MIN = 60000;
  function pad(n){ return (n < 10 ? '0' : '') + n; }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]; }); }
  function z4(ms){ var d = new Date(ms); return pad(d.getUTCHours()) + pad(d.getUTCMinutes()); }
  function hm(ms){ var m = Math.round(ms/MIN), h = Math.floor(m/60); return h + ':' + pad(m % 60); }
  function durTxt(ms){ var m = Math.round(ms/MIN), h = Math.floor(m/60); return (h ? h + ' h ' : '') + (m % 60 || !h ? (m % 60) + ' min' : '').trim(); }
  /* "2230", "22:30" or "930" to "22:30"; anything else to null */
  function parseHHMM(s){
    var d = String(s || '').replace(/\D/g, '');
    if(d.length < 3 || d.length > 4) return null;
    var h = +d.slice(0, -2), m = +d.slice(-2);
    return h < 24 && m < 60 ? pad(h) + ':' + pad(m) : null;
  }

  var CSS = [
    ':root{--cr1:#2E9E5B;--cr2:#0A66D8;--cr3:#C2378A;--cr1bg:rgba(46,158,91,.14);--cr2bg:rgba(10,102,216,.12);--cr3bg:rgba(194,55,138,.12)}',
    '@media (prefers-color-scheme: dark){:root{--cr1:#5BD08A;--cr2:#5AAEFF;--cr3:#F06BB8;--cr1bg:rgba(91,208,138,.18);--cr2bg:rgba(90,174,255,.18);--cr3bg:rgba(240,107,184,.18)}}',
    '.cr-clock{text-align:center;font-variant-numeric:tabular-nums;margin:6px 0 2px;line-height:1}',
    '.cr-clock .cr-hm{font-size:64px;font-weight:300;letter-spacing:-1px}',
    '.cr-clock .cr-ss{font-size:28px;color:var(--sec);font-weight:300}',
    '.cr-clock .cr-z{font-size:28px;color:var(--tint);font-weight:600;margin-left:4px}',
    '.cr-cap{text-align:center;font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:var(--sec);margin-top:2px}',
    '.cr-h{font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:var(--sec);font-weight:600;margin:22px 4px 8px}',
    '.cr-card{background:var(--card);border-radius:16px}',
    '.cr-seg{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:4px;background:var(--card);border-radius:14px;padding:4px}',
    '.cr-seg button{border:0;border-radius:10px;background:none;color:var(--label);font:inherit;font-size:17px;font-weight:600;min-height:44px;cursor:pointer}',
    '.cr-seg button[aria-pressed="true"]{background:var(--tint);color:#fff}',
    '.cr-hint{font-size:13px;color:var(--sec);margin:6px 4px 0}',
    '.cr-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px 12px;padding:16px}',
    '.cr-f{display:flex;flex-direction:column;gap:6px;min-width:0}',
    '.cr-l{font-size:15px;color:var(--sec);font-weight:600;min-height:28px;display:flex;align-items:center}',
    '.cr-box{display:flex;align-items:center;background:var(--fill);border-radius:12px;padding:0 12px;min-height:56px}',
    '.cr-box input{flex:1;min-width:0;border:0;background:none;color:var(--label);font:inherit;font-size:28px;font-variant-numeric:tabular-nums;padding:0;outline:none}',
    '.cr-box input::placeholder{color:var(--ter,#8A8A90)}',
    '.cr-box b{flex:1;font-size:28px;font-weight:400;font-variant-numeric:tabular-nums}',
    '.cr-box i{font-style:normal;color:var(--tint);font-weight:700;font-size:14px;letter-spacing:.06em}',
    '.cr-s{font-size:13px;color:var(--sec)}',
    '.cr-s button{border:0;background:none;color:var(--tint);font:inherit;font-weight:600;padding:0;cursor:pointer}',
    '.cr-now{border:0;border-radius:8px;background:var(--fill);color:var(--tint);font:inherit;font-size:14px;font-weight:700;padding:4px 10px;margin-left:8px;cursor:pointer}',
    '.cr-list>*+*{border-top:1px solid var(--sep)}',
    '.cr-tog,.cr-row{display:flex;align-items:center;gap:12px;width:100%;padding:12px 16px;min-height:60px;border:0;background:none;color:var(--label);font:inherit;text-align:left}',
    '.cr-tog{cursor:pointer}',
    '.cr-tog span,.cr-row>span:first-child{flex:1;display:flex;flex-direction:column;gap:2px}',
    '.cr-tog b,.cr-row b{font-size:17px;font-weight:600}',
    '.cr-tog small,.cr-row small{font-size:13px;color:var(--sec)}',
    '.cr-sw{width:51px;height:31px;border-radius:16px;background:var(--fill);position:relative;flex:none;transition:background .15s}',
    '.cr-sw::after{content:"";position:absolute;top:2px;left:2px;width:27px;height:27px;border-radius:50%;background:#fff;box-shadow:0 2px 4px rgba(0,0,0,.25);transition:left .15s}',
    '.cr-tog[aria-pressed="true"] .cr-sw{background:var(--rested,#2E9E5B)}',
    '.cr-tog[aria-pressed="true"] .cr-sw::after{left:22px}',
    '.cr-step{display:flex;align-items:center;gap:6px}',
    '.cr-step button{width:40px;height:36px;border:0;border-radius:9px;background:var(--fill);color:var(--label);font-size:20px;cursor:pointer}',
    '.cr-step output{min-width:56px;text-align:center;font-variant-numeric:tabular-nums;font-size:17px}',
    '.cr-mini{width:120px;display:grid;grid-template-columns:1fr 1fr;gap:3px;background:var(--fill);border-radius:9px;padding:2px}',
    '.cr-mini button{border:0;border-radius:7px;background:none;color:var(--label);font:inherit;font-size:15px;font-weight:600;min-height:32px;cursor:pointer}',
    '.cr-mini button[aria-pressed="true"]{background:var(--card);box-shadow:0 1px 3px rgba(0,0,0,.15)}',
    '.cr-tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:22px}',
    '.cr-tile{background:var(--card);border-radius:14px;padding:12px 12px 14px}',
    '.cr-tile small{display:block;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--sec);font-weight:600}',
    '.cr-tile b{display:block;font-size:26px;font-weight:600;font-variant-numeric:tabular-nums;margin-top:6px}',
    '.cr-tile b i{font-style:normal;font-size:13px;color:var(--sec);margin-left:2px}',
    '.cr-strip{display:flex;gap:4px;margin-top:10px}',
    '.cr-strip span{flex:1;min-width:0;text-align:center;border-radius:10px;padding:10px 0;font-weight:700;font-size:15px;border:1.5px solid}',
    '.cr-sched{padding:6px 16px}',
    '.cr-it{display:grid;grid-template-columns:44px 1fr auto;align-items:center;gap:12px;padding:12px 0;position:relative}',
    '.cr-it+.cr-it::before{content:"";position:absolute;left:21px;top:-12px;height:24px;width:2px;background:var(--sep)}',
    '.cr-dot{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:17px;border:2px solid;position:relative;z-index:1;background:var(--card)}',
    '.cr-nm b{font-size:17px;font-weight:600;display:block}',
    '.cr-nm small{font-size:14px;color:var(--sec)}',
    '.cr-nm em{font-style:normal;font-size:12px;font-weight:700;color:#fff;background:var(--tint);border-radius:6px;padding:1px 6px;margin-left:6px;vertical-align:2px}',
    '.cr-tm{font-size:20px;font-variant-numeric:tabular-nums;white-space:nowrap;text-align:right}',
    '.cr-tm i{font-style:normal;color:var(--sec);font-size:15px;margin:0 2px}',
    '.cr-tm small{display:block;font-size:13px;color:var(--sec);margin-top:2px}',
    '.cr-gap{font-size:13px;color:var(--sec);padding:0 0 0 56px;margin:-4px 0}',
    '.cr-me{font-weight:700}',
    '.cr-err{color:var(--danger);margin:12px 4px 0}',
    '@media (max-width:370px){.cr-clock .cr-hm{font-size:54px}.cr-tile b{font-size:22px}.cr-tm{font-size:18px}}'
  ].join('\n');
  function injectCSS(){
    if(document.getElementById('cr-css')) return;
    var st = document.createElement('style'); st.id = 'cr-css'; st.textContent = CSS; document.head.appendChild(st);
  }

  function clockParts(t){ var d = new Date(t); return '<span class="cr-hm">' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + '</span><span class="cr-ss">:' + pad(d.getUTCSeconds()) + '</span><span class="cr-z">Z</span>'; }
  function clockHTML(t){ return '<div class="cr-clock" data-crclock aria-label="UTC now">' + clockParts(t || Date.now()) + '</div>'; }
  var timer = null;
  function startClock(nowFn){
    clearInterval(timer);
    timer = setInterval(function(){
      var els = document.querySelectorAll('[data-crclock]'); if(!els.length) return;
      var t = nowFn ? nowFn() : Date.now();
      for(var i=0;i<els.length;i++) els[i].innerHTML = clockParts(t);
    }, 1000);
  }

  /* m: {crew, slot (null to leave out "Your rest"), off, on (HH:MM), offSub, onSub, start, end, wake (minutes),
         startSet (HH:MM or ''), autoStart (ms, off + start), round (1|5), gap (minutes), each (1|2)} */
  function settingsHTML(m){
    function seg(key, vals, cur, label){
      return '<div class="cr-seg" role="group" aria-label="' + label + '">' + vals.map(function(v){ return '<button type="button" data-cr="' + key + '" data-v="' + v[0] + '" aria-pressed="' + (cur === v[0]) + '">' + v[1] + '</button>'; }).join('') + '</div>';
    }
    function tog(key, on, t1, t2){ return '<button class="cr-tog" type="button" data-cr="' + key + '" aria-pressed="' + !!on + '"><span><b>' + t1 + '</b><small>' + t2 + '</small></span><i class="cr-sw" aria-hidden="true"></i></button>'; }
    var h = '<h2 class="cr-h">Who’s flying</h2>' + seg('crew', [[3, '3 pilots'], [4, '4 pilots']], m.crew, 'Who is flying');
    if(!m.crew) h += '<p class="cr-hint">Pick the crew for a rest plan. With 2 pilots both stay at the controls.</p>';
    if(m.slot != null && m.crew){
      var n = m.crew === 3 ? 3 : 2;
      h += '<h2 class="cr-h">Your rest</h2>' + seg('slot', [[1, 'Rest 1'], [2, 'Rest 2'], [3, 'Rest 3']].slice(0, n), m.slot, 'Your rest') +
           '<p class="cr-hint">' + (n === 3 ? 'One rests at a time. The order varies, often FB, then PF, then PM.' : 'Two rest at a time, in pairs.') + '</p>';
    }
    h += '<h2 class="cr-h">Flight times</h2><div class="cr-card cr-grid">' +
         '<label class="cr-f"><span class="cr-l">Takeoff (off)</span><span class="cr-box"><input id="cr-off" inputmode="numeric" autocomplete="off" maxlength="5" placeholder="hhmm" value="' + esc((m.off || '').replace(':', '')) + '"><i>Z</i></span><span class="cr-s">' + esc(m.offSub || '') + '</span></label>' +
         '<label class="cr-f"><span class="cr-l">Landing (on)</span><span class="cr-box"><input id="cr-on" inputmode="numeric" autocomplete="off" maxlength="5" placeholder="hhmm" value="' + esc((m.on || '').replace(':', '')) + '"><i>Z</i></span><span class="cr-s">' + esc(m.onSub || '') + '</span></label>' +
         '<div class="cr-f"><span class="cr-l">Rest begins<button class="cr-now" type="button" data-cr="startNow">Now</button></span>' +
           (m.startSet ? '<span class="cr-box"><b>' + esc(m.startSet.replace(':', '')) + '</b><i>Z</i></span><span class="cr-s"><button type="button" data-cr="startClear">Use ' + m.start + ' min after takeoff</button></span>'
                       : '<label class="cr-box"><input id="cr-start" inputmode="numeric" autocomplete="off" maxlength="5" value="' + m.start + '" aria-label="Minutes after takeoff, or a time"><i>MIN</i></label><span class="cr-s">after takeoff' + (m.autoStart ? ' · ' + z4(m.autoStart) + 'Z' : '') + '</span>') + '</div>' +
         '<label class="cr-f"><span class="cr-l">Rest ends</span><span class="cr-box"><input id="cr-end" inputmode="numeric" autocomplete="off" maxlength="3" value="' + m.end + '"><i>MIN</i></span><span class="cr-s">before landing</span></label>' +
         '</div>';
    h += '<h2 class="cr-h">Fine tune</h2><div class="cr-card cr-list">' +
         tog('round', m.round === 5, 'Round to 5 minutes', 'Times end in multiples of 5 min') +
         tog('gap', m.gap > 0, 'Gap between rests', '10 min for the crew change') +
         '<div class="cr-row"><span><b>Wake-up call</b><small>Before each rest ends</small></span><span class="cr-step"><button type="button" data-cr="wake" data-d="-5" aria-label="Less">−</button><output>' + m.wake + ' min</output><button type="button" data-cr="wake" data-d="5" aria-label="More">+</button></span></div>' +
         '<div class="cr-row"><span><b>Rests each</b><small>Two for longer flights</small></span><span class="cr-mini" role="group" aria-label="Rests each">' + [1, 2].map(function(v){ return '<button type="button" data-cr="each" data-v="' + v + '" aria-pressed="' + (m.each === v) + '">' + v + '</button>'; }).join('') + '</span></div>' +
         '</div>';
    return h;
  }

  /* cp from BC.crewBreaks; o: {mine (your rest number, or null), each} */
  function resultsHTML(cp, o){
    o = o || {};
    if(!cp) return '';
    if(cp.err) return '<p class="cr-err">' + esc(cp.err) + '</p>';
    var br = cp.breaks, total = br.reduce(function(s, x){ return s + (x.b - x.a); }, 0);
    var mn = Math.min.apply(null, br.map(function(x){ return x.b - x.a; }));
    var h = '<div class="cr-tiles">' +
            '<div class="cr-tile"><small>Flight</small><b>' + hm(cp.on - cp.off) + '<i>H</i></b></div>' +
            '<div class="cr-tile"><small>Total rest</small><b>' + hm(total) + '<i>H</i></b></div>' +
            '<div class="cr-tile"><small>Each</small><b>' + hm(mn) + '<i>H</i></b></div></div>';
    h += '<div class="cr-strip">' + br.map(function(x){ return '<span style="flex:' + (x.b - x.a) + ';color:var(--cr' + x.slot + ');background:var(--cr' + x.slot + 'bg);border-color:var(--cr' + x.slot + ')">' + x.slot + '</span>'; }).join('') + '</div>';
    h += '<h2 class="cr-h">Schedule</h2><div class="cr-card cr-sched">';
    br.forEach(function(x, j){
      if(j && cp.gap) h += '<div class="cr-gap">' + Math.round(cp.gap/MIN) + ' min crew change</div>';
      var me = o.mine != null && x.slot === o.mine;
      h += '<div class="cr-it' + (me ? ' cr-me' : '') + '"><span class="cr-dot" style="color:var(--cr' + x.slot + ');border-color:var(--cr' + x.slot + ');background:var(--cr' + x.slot + 'bg)">' + x.slot + '</span>' +
           '<span class="cr-nm"><b>' + esc(x.label) + (o.each === 2 ? ' · ' + (x.round === 1 ? '1st' : '2nd') : '') + (me ? '<em>You</em>' : '') + '</b><small>' + durTxt(x.b - x.a) + '</small></span>' +
           '<span class="cr-tm">' + z4(x.a) + '<i>→</i>' + z4(x.b) + '<i>Z</i><small>Wake-up ' + z4(x.wake) + 'Z</small></span></div>';
    });
    h += '</div><p class="cr-hint">Times in UTC. ' + (cp.gap ? 'A ' + Math.round(cp.gap/MIN) + ' min crew change between rests. ' : 'Each rest starts as the one before ends. ') + 'The wake-up call comes before each rest ends.</p>';
    return h;
  }

  window.CRUI = {injectCSS:injectCSS, clockHTML:clockHTML, startClock:startClock, settingsHTML:settingsHTML, resultsHTML:resultsHTML, parseHHMM:parseHHMM, z4:z4};
})();
