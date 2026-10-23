/* Body Clock engine: time zones, the two-process sleep model and the layover planner. No DOM here.
   Times are absolute milliseconds (UTC) everywhere; airports carry IANA time zones, so daylight saving
   is handled by the browser's own time-zone rules. */
var BC = (function(){
'use strict';
var H = 3600000, MIN = 60000;

/* ---------- time zones ---------- */
var fmts = {}, offCache = {};
function dtf(tz){
  return fmts[tz] || (fmts[tz] = new Intl.DateTimeFormat('en-US', {timeZone:tz, hourCycle:'h23',
    year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit'}));
}
/* UTC offset of a zone at a moment, in hours (São Paulo -3, London +1 in summer, 0 in winter) */
function offH(tz, ms){
  var k = tz + '|' + Math.floor(ms/(15*MIN));
  var c = offCache[k]; if(c !== undefined) return c;
  var p = {};
  dtf(tz).formatToParts(new Date(ms)).forEach(function(x){ p[x.type] = x.value; });
  var u = Date.UTC(+p.year, +p.month - 1, +p.day, (+p.hour) % 24, +p.minute, +p.second);
  var o = Math.round((u - Math.floor(ms/1000)*1000)/MIN)/60;
  offCache[k] = o;
  return o;
}
function pad(n){ return (n < 10 ? '0' : '') + n; }
function parseLocal(str){
  var m = /^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)/.exec(str || '');
  return m ? Date.UTC(+m[1], +m[2]-1, +m[3], +m[4], +m[5]) : NaN;
}
function isoUTC(ms){ var d = new Date(ms); return d.getUTCFullYear()+'-'+pad(d.getUTCMonth()+1)+'-'+pad(d.getUTCDate())+'T'+pad(d.getUTCHours())+':'+pad(d.getUTCMinutes()); }
/* wall-clock time in a zone ('2026-10-16T09:00') to an absolute moment */
function localToMs(tz, str){
  var g = parseLocal(str); if(isNaN(g)) return NaN;
  var t = g - offH(tz, g)*H;
  t = g - offH(tz, t)*H;
  return t;
}
function msToLocal(tz, ms){ return isoUTC(ms + offH(tz, ms)*H); }
var DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'], MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
var DOWL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'], MONL = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function wall(tz, ms){ return new Date(ms + offH(tz, ms)*H); }
function hm(tz, ms){ var d = wall(tz, ms); return pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()); }
function dow(tz, ms){ return DOW[wall(tz, ms).getUTCDay()]; }
function dayKey(tz, ms){ var d = wall(tz, ms); return d.getUTCFullYear()*10000 + (d.getUTCMonth()+1)*100 + d.getUTCDate(); }
function dayShort(tz, ms){ var d = wall(tz, ms); return DOW[d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' + MON[d.getUTCMonth()]; }
function dayLong(tz, ms){ var d = wall(tz, ms); return DOWL[d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' + MONL[d.getUTCMonth()]; }
function dateStr(tz, ms){ return msToLocal(tz, ms).slice(0, 10); }
function addDays(dstr, n){ var t = Date.UTC(+dstr.slice(0,4), +dstr.slice(5,7)-1, +dstr.slice(8,10)) + n*24*H; return isoUTC(t).slice(0,10); }
var abbrCache = {};
/* names the browser does not give in short form: [standard abbreviation, its offset, summer abbreviation] */
var ABBR = {'America/Sao_Paulo':['BRT',-3], 'America/Argentina/Buenos_Aires':['ART',-3], 'America/Santiago':['CLT',-4,'CLST'],
  'America/Lima':['PET',-5], 'America/Bogota':['COT',-5], 'America/Guayaquil':['ECT',-5], 'America/Montevideo':['UYT',-3],
  'Asia/Tokyo':['JST',9], 'Asia/Seoul':['KST',9], 'Asia/Kolkata':['IST',5.5], 'Asia/Singapore':['SGT',8], 'Asia/Hong_Kong':['HKT',8],
  'Asia/Bangkok':['ICT',7], 'Asia/Dubai':['GST',4], 'Asia/Qatar':['AST',3], 'Asia/Manila':['PHT',8], 'Asia/Taipei':['TST',8],
  'Australia/Sydney':['AEST',10,'AEDT'], 'Australia/Melbourne':['AEST',10,'AEDT'], 'Australia/Brisbane':['AEST',10],
  'Pacific/Auckland':['NZST',12,'NZDT'], 'Africa/Johannesburg':['SAST',2], 'Europe/Istanbul':['TRT',3]};
function zabbr(tz, ms){
  var k = tz + '|' + Math.floor(ms/(6*H)); if(abbrCache[k]) return abbrCache[k];
  if(ABBR[tz]){ var z = ABBR[tz], o0 = offH(tz, ms); return (abbrCache[k] = (o0 === z[1] || !z[2]) ? z[0] : z[2]); }
  function get(loc){
    try{ var p = new Intl.DateTimeFormat(loc, {timeZone:tz, timeZoneName:'short'}).formatToParts(new Date(ms));
      for(var i=0;i<p.length;i++) if(p[i].type === 'timeZoneName') return p[i].value; }catch(e){}
    return '';
  }
  var a = get('en-US');
  if(!/^[A-Z]{2,5}$/.test(a)) a = get('en-GB');
  if(!/^[A-Z]{2,5}$/.test(a) || a === 'GMT' && offH(tz, ms) !== 0){
    var o = offH(tz, ms), h = Math.floor(Math.abs(o)), m = Math.round((Math.abs(o) - h)*60);
    a = o === 0 ? 'UTC' : 'UTC' + (o < 0 ? '−' : '+') + h + (m ? ':' + pad(m) : '');
  }
  return (abbrCache[k] = a);
}
function hhmmToH(s){ var m = /^(\d\d):(\d\d)/.exec(s || ''); return m ? (+m[1] + (+m[2])/60) : 0; }

/* ---------- airports ---------- */
function airport(code){
  var a = AIRPORTS[String(code || '').toUpperCase()];
  return a ? {code:String(code).toUpperCase(), city:a[0], tz:a[1], lat:a[2], lon:a[3]} : null;
}

/* ---------- sun ---------- */
function sunElev(ms, lat, lon){
  var R = Math.PI/180;
  var T = (ms/86400000 + 2440587.5 - 2451545.0)/36525;
  var L0 = (280.46646 + T*(36000.76983 + T*0.0003032)) % 360;
  var Mn = 357.52911 + T*(35999.05029 - 0.0001537*T), Mr = Mn*R;
  var C = Math.sin(Mr)*(1.914602 - T*(0.004817 + 0.000014*T)) + Math.sin(2*Mr)*(0.019993 - 0.000101*T) + Math.sin(3*Mr)*0.000289;
  var om = 125.04 - 1934.136*T;
  var lam = L0 + C - 0.00569 - 0.00478*Math.sin(om*R);
  var eps = 23 + (26 + (21.448 - T*(46.815 + T*(0.00059 - T*0.001813)))/60)/60 + 0.00256*Math.cos(om*R);
  var decl = Math.asin(Math.sin(eps*R)*Math.sin(lam*R));
  var ecc = 0.016708634 - T*(0.000042037 + 0.0000001267*T);
  var yy = Math.pow(Math.tan(eps*R/2), 2), L0r = L0*R;
  var eqt = 4/R*(yy*Math.sin(2*L0r) - 2*ecc*Math.sin(Mr) + 4*ecc*yy*Math.sin(Mr)*Math.cos(2*L0r) - 0.5*yy*yy*Math.sin(4*L0r) - 1.25*ecc*ecc*Math.sin(2*Mr));
  var utcMin = ((ms/MIN) % 1440 + 1440) % 1440;
  var tst = (((utcMin + eqt + 4*lon) % 1440) + 1440) % 1440;
  var ha = (tst/4 - 180)*R, la = lat*R;
  var cz = Math.sin(la)*Math.sin(decl) + Math.cos(la)*Math.cos(decl)*Math.cos(ha);
  return 90 - Math.acos(Math.max(-1, Math.min(1, cz)))/R;
}

/* ---------- physiology (same model and constants as the classic app) ---------- */
var PAR = {
  tauRise:18.2, tauDecay:4.2, wS:0.64, wC:0.36,
  effMin:0.55, solBase:8, solRange:22,
  inMax:22, inTau:0.6, inDur0:1.8, inDurS:1.3,
  prcAmp:0.4, prcAsym:0.25, lowFrac:0.1,
  warnS:0.70
};
/* Sleep debt. Your usual night (bedtime to wake time in Settings, say 8 h) pays for a usual day (16 h),
   so each hour awake runs up 8/16 of an hour of sleep owed (R) and each hour asleep pays an hour back.
   A usual day's share (U) runs up the same way but stops at one night's worth, and sleep pays it first.
   The debt is R - U: nothing on a usual day however late it gets, naps pay it down, and staying awake
   past a usual day adds to it. Unpaid debt fades slowly (about a third left after 3 days). Each hour of
   debt costs some alertness and makes sleep come more easily. Sleep in a crew rest bunk counts at bunk
   value (lighter, more broken sleep). */
var DEBT = {alert:3, ease:0.07, max:12, bunk:0.75, tau:72};
var CW = (function(){
  function raw(p){ return -Math.cos(2*Math.PI*(p-1)/24) - 0.2*Math.cos(2*Math.PI*(p-9.5)/12); }
  var mn = 1e9, mx = -1e9, arg = 0;
  for(var i=0;i<2400;i++){ var p = i/100, v = raw(p); if(v < mn){ mn = v; arg = p; } if(v > mx) mx = v; }
  var shift = 1 - arg;
  return function(p){ return (raw(p - shift) - mn)/(mx - mn); };
})();
function todH(ms, off){ var h = ms/H + off; return ((h % 24) + 24) % 24; }
function phiOf(ms, off, m){ return (((todH(ms, off) - m) % 24) + 24) % 24; }
function prc(phi, phiC){
  var v = -PAR.prcAmp*Math.sin(2*Math.PI*(phi - phiC)/24);
  return v > 0 ? v*(1 - PAR.prcAsym) : v*(1 + PAR.prcAsym);
}
function lightLevel(elev, asleep, g){
  if(asleep) return 0;
  var f = elev >= 5 ? 1 : (elev <= -6 ? 0.2 : 0.2 + 0.8*(elev + 6)/11);
  return f*g;
}
function stepS(st, asleep, c, dtH, effMul, cf){
  cf = cf || 0;
  if(asleep){
    if(!st.prev) st.since = 0;
    var sol = (PAR.solBase + PAR.solRange*c*(1 - st.s))/60 + CAF.sol*cf;
    effMul = (effMul || 1)*(1 - CAF.eff*cf);
    if(st.since < sol) st.s = 1 - (1 - st.s)*Math.exp(-dtH/PAR.tauRise);
    else {
      var eff = (PAR.effMin + (1 - PAR.effMin)*(1 - c))*effMul;
      st.s = st.s*Math.exp(-eff*dtH/PAR.tauDecay);
    }
    st.since += dtH;
  } else st.s = 1 - (1 - st.s)*Math.exp(-dtH/PAR.tauRise);
  st.prev = asleep;
}
/* Caffeine: absorbed over about 45 minutes to its peak, half gone after 5 hours. Its effect saturates:
   cafF is 0 with none, 0.5 at about one coffee's worth (100 mg) in you, approaching 1 with a lot. */
var CAF = {ka:5, ke:Math.LN2/5, c50:100, alert:15, ease:0.6, sol:0.33, eff:0.2};
function cafMg(log, t){
  var c = 0;
  for(var i=0;i<log.length;i++){
    var d = (t - log[i].t)/H;
    if(d <= 0 || d > 36) continue;
    c += (+log[i].mg || 0)*CAF.ka/(CAF.ka - CAF.ke)*(Math.exp(-CAF.ke*d) - Math.exp(-CAF.ka*d));
  }
  return c;
}
function cafF(mg){ return mg > 0 ? mg/(mg + CAF.c50) : 0; }
function cafLog(S){ return (S && S.caf && Array.isArray(S.caf.log)) ? S.caf.log : []; }
function habitSleeping(hr, bedH, wakeH){ return bedH > wakeH ? (hr >= bedH || hr < wakeH) : (hr >= bedH && hr < wakeH); }
/* sleeps as sorted [start, end] intervals, overlapping ones joined */
/* the third value is how much the sleep is worth: 1, or DEBT.bunk for crew rest in a bunk */
function merge(list){
  var s = list.map(function(x){ return [x.a, x.b, x.kind === 'rest' ? DEBT.bunk : 1]; }).sort(function(p,q){ return p[0] - q[0]; });
  var out = [];
  s.forEach(function(iv){
    var l = out[out.length-1];
    if(l && iv[0] <= l[1]){ l[1] = Math.max(l[1], iv[1]); l[2] = Math.max(l[2], iv[2]); } else out.push([iv[0], iv[1], iv[2]]);
  });
  return out;
}
/* A planned sleep you have not logged that should have started already: you are looking at the app,
   so you are awake, and it starts now. Less than 20 minutes left and it is dropped. */
function fromNow(list, now){
  if(now == null) return list;
  var out = [];
  list.forEach(function(x){
    if(x.actual || x.open || !(x.a < now && now < x.b)){ out.push(x); return; }
    if(x.b - now < 20*MIN) return;
    var y = {}; for(var k in x) y[k] = x[k];
    y.was = x.a; y.a = now; y.late = true; out.push(y);
  });
  return out;
}

/* a time difference in hours, wrapped to -12..+12 */
function wrap12(x){ return (((x + 12) % 24) + 24) % 24 - 12; }

/* ---------- crew rest on board ----------
   Two crew are always at the controls, so crew - 2 rest at once. Breaks go by seat, most junior first:
   3 crew FB, then CPT, then FO; 4 crew FB + FC as a pair, then CPT + FO. The rest window runs from the first
   break (off + 10 minutes unless set) to 45 minutes before on, split equally; the wake-up call is 10 minutes
   before each break ends. Off and on are the schedule unless the actual off or estimated on is given (Z). */
var SEATS = {3:[['FB'], ['CPT'], ['FO']], 4:[['FB', 'FC'], ['CPT', 'FO']]};
function zNear(hhmm, ref){
  var d = isoUTC(ref).slice(0, 10), best = NaN;
  for(var k=-1;k<=1;k++){ var c = parseLocal(addDays(d, k) + 'T' + hhmm); if(!isNaN(c) && (isNaN(best) || Math.abs(c - ref) < Math.abs(best - ref))) best = c; }
  return best;
}
function crewBreaks(off, on, crew, each, start, rules){
  rules = rules || {};
  var groups = SEATS[crew]; if(!groups) return null;
  var end = on - (rules.end != null ? +rules.end : 45)*MIN, wakeB = (rules.wake != null ? +rules.wake : 10)*MIN, unit = (+rules.round === 5 ? 5 : 1)*MIN;
  var n = groups.length*(each === 2 ? 2 : 1);
  if(!(end - start >= n*15*MIN) || start < off) return {err:'The rest window is too short for ' + n + ' breaks.', off:off, on:on, start:start, end:end, breaks:[]};
  var step = (end - start)/n, bounds = [start], out = [];
  for(var k=1;k<n;k++) bounds.push(Math.round((start + k*step)/unit)*unit);
  bounds.push(end);
  for(var j=0;j<n;j++) out.push({seats:groups[j % groups.length], round:Math.floor(j/groups.length) + 1, a:bounds[j], b:bounds[j+1], wake:bounds[j+1] - wakeB});
  return {off:off, on:on, start:start, end:end, breaks:out};
}
function crewPlan(S, x){
  var r = x.r, crew = +r.crew || 0;
  if(!SEATS[crew]) return null;
  var rules = S.restRules || {}, off = r.offZ ? zNear(r.offZ, x.a) : x.a, on = r.onZ ? zNear(r.onZ, x.b) : x.b;
  var start = r.restStart ? zNear(r.restStart, off + (rules.start != null ? +rules.start : 10)*MIN) : off + (rules.start != null ? +rules.start : 10)*MIN;
  var cp = crewBreaks(off, on, crew, +r.each === 2 ? 2 : 1, start, rules);
  if(cp) cp.mine = cp.breaks.filter(function(b){ return b.seats.indexOf(r.seat) >= 0; });
  return cp;
}

/* when you must be up for a flight: the van (yours, or the usual time before departure) less time to get ready */
function vanOf(S, f){ return f.van || f.a - (+S.van || 2)*H; }
function wakeByOf(S, f){ return vanOf(S, f) - (+S.ready || 0.75)*H; }

/* ---------- trip environment ---------- */
function flightsOf(S){
  var out = [];
  (S.flights || []).forEach(function(r){
    var f = airport(r.from), t = airport(r.to);
    if(!f || !t) return;
    var a = localToMs(f.tz, r.dep), b = localToMs(t.tz, r.arr);
    if(!(b > a) || b - a > 22*H) return;
    var role = r.role || (b - a >= 5*H ? 'operate' : 'commute');
    var van = r.van ? localToMs(f.tz, r.van) : NaN;
    var x = {id:r.id, r:r, f:f, t:t, a:a, b:b, role:role, rest:role === 'operate' ? (+r.rest || 0) : 0, restWin:null, van:(van < a && van > a - 8*H) ? van : null};
    x.crewPlan = role === 'operate' ? crewPlan(S, x) : null;
    if(x.crewPlan && x.crewPlan.mine && x.crewPlan.mine.length && !(r.restUTC && r.restUTC.s && r.restUTC.e)){
      x.restWins = x.crewPlan.mine.map(function(m){ return [m.a, m.wake]; });
      x.restWin = x.restWins[0]; x.restAuto = true;
    }
    if(r.restUTC && r.restUTC.s && r.restUTC.e){
      var day = isoUTC(a).slice(0,10), s = NaN;
      for(var k=-1;k<=1 && isNaN(s);k++){
        var c = parseLocal(addDays(day, k) + 'T' + r.restUTC.s);
        if(c >= a - 30*MIN && c <= b) s = c;
      }
      if(!isNaN(s)){
        var e = parseLocal(isoUTC(s).slice(0,10) + 'T' + r.restUTC.e);
        if(e <= s) e += 24*H;
        if(e - s <= 10*H) x.restWin = [s, Math.min(e, b)];
      }
    }
    out.push(x);
  });
  return out.sort(function(p,q){ return p.a - q.a; });
}

function env(S, now){
  var home = airport(S.home) || airport('ATL');
  var F = flightsOf(S);
  var bedH = hhmmToH(S.bed), wakeH = hhmmToH(S.wake);
  var t0, t1;
  if(F.length){
    var d = dateStr(home.tz, F[0].a);
    t0 = localToMs(home.tz, d + 'T' + S.wake);
    if(F[0].a - t0 < 3*H) t0 = localToMs(home.tz, addDays(d, -1) + 'T' + S.wake);
    t1 = F[F.length-1].b + 30*H;
  } else {
    var dn = dateStr(home.tz, now);
    t0 = localToMs(home.tz, dn + 'T' + S.wake);
    if(t0 > now) t0 = localToMs(home.tz, addDays(dn, -1) + 'T' + S.wake);
    t1 = t0 + 60*H;
  }
  if(t1 - t0 > 14*24*H) t1 = t0 + 14*24*H;
  var start = F.length ? F[0].f : home;
  function locAt(t){
    var cur = start;
    for(var i=0;i<F.length;i++){
      var f = F[i];
      if(t < f.a) return {ap:cur, tz:cur.tz, lat:cur.lat, lon:cur.lon, off:offH(cur.tz, t), fl:false};
      if(t < f.b){
        var k = (t - f.a)/(f.b - f.a), dl = ((f.t.lon - f.f.lon + 540) % 360) - 180;
        var o1 = offH(f.f.tz, f.a), o2 = offH(f.t.tz, f.b);
        return {ap:null, flight:f, tz:f.f.tz, lat:f.f.lat + (f.t.lat - f.f.lat)*k, lon:f.f.lon + dl*k, off:o1 + (o2 - o1)*k, fl:true};
      }
      cur = f.t;
    }
    return {ap:cur, tz:cur.tz, lat:cur.lat, lon:cur.lon, off:offH(cur.tz, t), fl:false};
  }
  var offs = [offH(home.tz, t0)];
  F.forEach(function(f){ offs.push(offH(f.f.tz, f.a), offH(f.t.tz, f.b)); });
  return {S:S, home:home, F:F, t0:t0, t1:t1, locAt:locAt, bedH:bedH, wakeH:wakeH,
          Elo:Math.min.apply(null, offs), Ehi:Math.max.apply(null, offs), g:(S.light == null ? 50 : S.light)/100};
}

/* steady state after the usual routine at home, plus the reference light drift (cached) */
var seedCache = {};
function seedFor(E){
  var home = E.home, bedH = E.bedH, wakeH = E.wakeH, m = (((wakeH - 2.5) % 24) + 24) % 24;
  var off = offH(home.tz, E.t0);
  var key = [bedH, wakeH, home.code, E.g, dateStr(home.tz, E.t0)].join('|');
  if(seedCache[key]) return seedCache[key];
  var seed = {s:0.25, since:0, prev:false}, asl = false, sBed = 0.55;
  for(var i=0;i<2400;i++){
    var hr = (wakeH + i*0.1 + 0.05) % 24, hs = habitSleeping(hr, bedH, wakeH);
    if(hs && !asl && i > 0) sBed = seed.s;
    asl = hs;
    stepS(seed, hs, CW((((hr - m) % 24) + 24) % 24), 0.1, 1);
  }
  var day0 = localToMs(home.tz, dateStr(home.tz, E.t0) + 'T00:00'), cx = 0, cy = 0, ref = 0, j, t, h;
  for(j=0;j<240;j++){
    t = day0 + (j + 0.5)*0.1*H; h = todH(t, off);
    var w = lightLevel(sunElev(t, home.lat, home.lon), habitSleeping(h, bedH, wakeH), 1);
    var an = 2*Math.PI*(((h - m) % 24 + 24) % 24)/24; cx += w*Math.cos(an); cy += w*Math.sin(an);
  }
  var phiC = ((Math.atan2(cy, cx)*24/(2*Math.PI)) % 24 + 24) % 24;
  for(j=0;j<240;j++){
    t = day0 + (j + 0.5)*0.1*H; h = todH(t, off);
    ref += lightLevel(sunElev(t, home.lat, home.lon), habitSleeping(h, bedH, wakeH), E.g)*prc((((h - m) % 24) + 24) % 24, phiC)*0.1;
  }
  var res = {s0:seed.s, sBed:sBed, drift:ref/24, phiC:phiC, m:m,
             Pref:sBed - 0.5*CW((((bedH - m) % 24) + 24) % 24)};
  seedCache[key] = res;
  return res;
}

/* One run of the model over [E.t0, until] with the given sleeps ({a, b}).
   snapAt: also return a checkpoint of the state just before that time, so that many runs which only differ
   after it (the plans for one layover) can start from there instead of from the beginning of the trip.
   ck: a checkpoint to start from. The sleeps before the checkpoint must be the same as when it was taken. */
function run(E, sleeps, until, ck, snapAt){
  var sd = seedFor(E), m = sd.m;
  var t0 = E.t0, t1 = Math.min(E.t1, until || E.t1);
  var dtH = Math.max(0.1, (E.t1 - E.t0)/H/2000), dt = dtH*H, N = Math.ceil((t1 - t0)/dt);
  var SL = merge(sleeps), sleepLen = ((E.wakeH - E.bedH) % 24 + 24) % 24 || 8;
  var wakes = [{t:t0, dur:sleepLen, amp:null, on:t0, s0:sd.sBed}];
  SL.forEach(function(iv){ if(iv[1] > t0) wakes.push({t:iv[1], dur:(iv[1] - iv[0])/H, amp:null, on:iv[0], s0:(iv[0] <= t0 ? sd.sBed : null)}); });
  /* sleep debt starts as a usual day at home: owed what the hours since your usual wake time ran up */
  var dayH = 24 - sleepLen, rate = sleepLen/dayH, h0 = todH(t0, offH(E.home.tz, t0));
  var a0 = habitSleeping(h0, E.bedH, E.wakeH) ? 0 : ((h0 - E.wakeH) % 24 + 24) % 24;
  var dbt = {R:Math.min(a0, dayH)*rate, U:Math.min(a0, dayH)*rate}, fade = Math.exp(-dtH/DEBT.tau);
  var si = 0;
  function sleepAt(t){
    while(si < SL.length && SL[si][1] <= t) si++;
    for(var k=si;k<SL.length && SL[k][0] <= t;k++) if(t < SL[k][1]) return SL[k];
    return null;
  }
  var pts = new Array(N + 1), st = {s:sd.s0, since:0, prev:false}, Ebody = offH(E.home.tz, t0), clog = cafLog(E.S), i0 = 0;
  if(ck && ck.i <= N){
    i0 = ck.i; st = {s:ck.st.s, since:ck.st.since, prev:ck.st.prev}; Ebody = ck.Ebody; dbt = {R:ck.dbt.R, U:ck.dbt.U};
    for(var j=0;j<i0;j++) pts[j] = ck.pts[j];
    wakes.forEach(function(w){ if(ck.s0[w.on] !== undefined) w.s0 = ck.s0[w.on]; if(ck.amp[w.t] !== undefined && w.t < t0 + i0*dt) w.amp = ck.amp[w.t]; });
  }
  var snapI = snapAt != null ? Math.max(0, Math.min(N, Math.floor((snapAt - t0)/dt))) : -1, snap = null, w0 = 0;
  /* where you are and how light it is at each step does not depend on the sleeps, so it is worked out once per trip */
  var env = E.env && E.env.dt === dt ? E.env : (E.env = {dt:dt, off:[], tz:[], fl:[], lw:[], ni:[]});
  for(var e0 = env.off.length; e0 <= N; e0++){
    var te = Math.min(t0 + e0*dt, E.t1), Le = E.locAt(te), Lme = E.locAt(te + dt/2), eme = sunElev(te + dt/2, Lme.lat, Lme.lon);
    env.off.push(Le.off); env.tz.push(Le.tz); env.fl.push(Le.fl); env.lw.push(lightLevel(eme, false, E.g)); env.ni.push(eme < -0.833);
  }
  for(var i=i0;i<=N;i++){
    var t = Math.min(t0 + i*dt, t1);
    if(i === snapI){
      snap = {i:i, st:{s:st.s, since:st.since, prev:st.prev}, Ebody:Ebody, pts:pts.slice(0, i), s0:{}, amp:{}, dbt:{R:dbt.R, U:dbt.U}};
      wakes.forEach(function(w){ if(w.s0 !== null) snap.s0[w.on] = w.s0; if(w.amp !== null) snap.amp[w.t] = w.amp; });
    }
    var c = CW(phiOf(t, Ebody, m)), W = 0;
    /* grogginess after each wake-up, for up to 4 hours (older wake-ups are skipped) */
    while(w0 < wakes.length - 1 && wakes[w0].amp !== null && t - wakes[w0].t >= 4*H) w0++;
    for(var wi=w0; wi<wakes.length; wi++){
      var w = wakes[wi];
      if(w.s0 === null && t >= w.on) w.s0 = st.s;
      if(t < w.t) continue;
      if(w.amp === null){
        var tauIn = Math.max(0.4, PAR.inDur0 - PAR.inDurS*w.s0);
        w.amp = PAR.inMax*(1 - Math.exp(-w.dur/tauIn))*(0.7 + 0.3*(1 - c));
      }
      var dw = (t - w.t)/H;
      if(dw < 4) W += w.amp*Math.exp(-dw/PAR.inTau);
    }
    var mg = clog.length ? cafMg(clog, t) : 0, slp = sleepAt(t);
    var debt = Math.min(DEBT.max, dbt.R - dbt.U);
    var A0 = 100*(PAR.wS*(1 - st.s) + PAR.wC*c) + CAF.alert*cafF(mg) - DEBT.alert*debt;
    var mid = t + dt/2, sm = sleepAt(mid), asl = !!sm, phi = phiOf(mid, Ebody, m);
    pts[i] = {t:t, A:Math.max(0, Math.min(100, A0 - W)), S:st.s, cb:c, caf:mg, E:Ebody, off:env.off[i], tz:env.tz[i], fl:env.fl[i], sl:!!slp, ni:env.ni[i], debt:debt};
    stepS(st, asl, CW(phi), dtH, asl ? sm[2] : 1, clog.length ? cafF(cafMg(clog, mid)) : 0);
    if(asl){ dbt.R = Math.max(0, dbt.R - sm[2]*dtH); dbt.U = Math.max(0, dbt.U - sm[2]*dtH); }
    else { dbt.R += rate*dtH; dbt.U = Math.min(sleepLen, dbt.U + rate*dtH); }
    dbt.R = dbt.U + (dbt.R - dbt.U)*fade;
    Ebody += ((asl ? 0 : env.lw[i])*prc(phi, sd.phiC) - sd.drift)*dtH;
    Ebody = Math.max(E.Elo, Math.min(E.Ehi, Ebody));
  }
  return {t0:t0, t1:t1, dt:dt, pts:pts, Pref:sd.Pref, s0:sd.s0, ck:snap};
}
/* how easily you would fall asleep at a model point: above 0.85 easy, 0.6 to 0.85 OK, below hard */
function easeOf(R, p){ return (p.S - 0.5*p.cb)/R.Pref - CAF.ease*cafF(p.caf || 0) + DEBT.ease*(p.debt || 0); }
function gateOf(R, p){ return R.Pref*(0.6 + CAF.ease*cafF(p.caf || 0) - DEBT.ease*(p.debt || 0)) + 0.5*p.cb; }
function ptAt(R, t){ var i = Math.round((t - R.t0)/R.dt); return R.pts[Math.max(0, Math.min(R.pts.length - 1, i))]; }

/* ---------- words and colours ---------- */
function word(a){ a = Math.round(a); return a >= 55 ? 'Sharp' : a >= 40 ? 'Okay' : a >= 25 ? 'Drowsy' : 'Very tired'; }
var SCALE = [[0,[159,29,32]],[20,[196,22,28]],[30,[226,83,26]],[40,[238,138,18]],[50,[216,177,15]],[60,[125,184,67]],[70,[46,158,91]],[100,[31,122,77]]];
function color(a){
  a = Math.max(0, Math.min(100, a));
  for(var i=1;i<SCALE.length;i++){
    if(a <= SCALE[i][0]){
      var p = SCALE[i-1], q = SCALE[i], k = (a - p[0])/(q[0] - p[0]);
      return '#' + p[1].map(function(v,j){ var x = Math.round(v + (q[1][j] - v)*k).toString(16); return x.length < 2 ? '0' + x : x; }).join('');
    }
  }
  return '#1f7a4d';
}

/* ---------- sleeps the app assumes: nights at home and crew rest ---------- */
function homeNights(E){
  var S = E.S, out = [], home = E.home, F = E.F;
  var d = dateStr(home.tz, E.t0), last = dateStr(home.tz, E.t1);
  for(var n=0; n<16 && d <= last; n++, d = addDays(d, 1)){
    var a = localToMs(home.tz, d + 'T' + S.bed);
    var b = localToMs(home.tz, (E.bedH < E.wakeH ? d : addDays(d, 1)) + 'T' + S.wake);
    if(b <= E.t0 || a >= E.t1) continue;
    var L = E.locAt(a + 1), Lb = E.locAt(b - 1);
    if(L.fl || !L.ap || L.ap.code !== home.code) {
      /* back home late: sleep from an hour after landing */
      var land = F.filter(function(f){ return f.t.code === home.code && f.b > a && f.b < b - 3*H; })[0];
      if(!land) continue;
      a = land.b + H;
    }
    var dep = F.filter(function(f){ return f.a > a && wakeByOf(S, f) < b; })[0];
    if(dep) b = Math.min(b, wakeByOf(S, dep));
    if(Lb.fl && !dep) continue;
    if(b - a >= 3*H) out.push({a:a, b:b, kind:'home', label:'Sleep'});
  }
  return out;
}
function restVariants(f){
  if(f.restWin) return [f.restWin];
  if(!(f.rest > 0)) return [];
  var r = f.rest*H, lo = f.a + H, hi = f.b - 1.5*H - r;
  if(hi < lo) return [[f.a + (f.b - f.a - r)/2, f.a + (f.b - f.a + r)/2]];
  return [[lo, lo + r], [(lo + hi)/2, (lo + hi)/2 + r], [hi, hi + r]];
}
/* the crew rest you will get on a flight: your breaks from the crew plan, the times you typed, or a guess */
function assumedRests(f){
  if(f.restWins && f.restWins.length) return f.restWins.map(function(w){ return {a:w[0], b:w[1], kind:'rest', actual:false, flight:f.id, label:'Crew rest'}; });
  var one = assumedRest(f); return one ? [one] : [];
}
function assumedRest(f){
  var v = restVariants(f);
  if(!v.length) return null;
  var w = v.length === 3 ? v[1] : v[0];
  return {a:w[0], b:w[1], kind:'rest', actual:!!f.restWin, flight:f.id, label:'Crew rest'};
}

/* ---------- layovers ---------- */
function layoversOf(E){
  var S = E.S, F = E.F, out = [];
  for(var i=0;i<F.length - 1;i++){
    var a = F[i], b = F[i+1];
    if(a.t.code === E.home.code || b.a - a.b < 8*H) continue;
    var ap = a.t, id = a.id + '>' + b.id, cfg = (S.lay || {})[id] || {};
    var ws = a.b + (+S.landBed || 2)*H, duty = vanOf(S, b), we = duty - (+S.ready || 0.75)*H;
    if(we - ws < 4*H) continue;
    var lastRule = (+((S.night || {}).last) || 12)*H;
    /* crew meetup: an optional time you will be out and awake, set per layover */
    var mt = cfg.meet && cfg.meet.a < cfg.meet.b && cfg.meet.a >= a.b - H && cfg.meet.b <= we ? {ns:cfg.meet.a, ne:cfg.meet.b, lastDrink:duty - lastRule} : null;
    out.push({id:id, i:i, ap:ap, inF:a, outF:b, arr:a.b, dep:b.a, ws:ws, we:we, duty:duty, out:mt, lastDrink:duty - lastRule,
              choice:cfg.choice || null, custom:Array.isArray(cfg.custom) ? cfg.custom : null});
  }
  return out;
}

/* usual bedtime for the layover night, on the clock the balance setting picks */
function usualBeds(E, L){
  var S = E.S, w = S.balance === 'home' ? 1 : S.balance === 'local' ? 0 : 0.5, out = [];
  var d = dateStr(L.ap.tz, L.ws - 12*H);
  for(var k=0;k<7;k++, d = addDays(d, 1)){
    var bl = localToMs(L.ap.tz, d + 'T' + S.bed);
    var hb = localToMs(E.home.tz, d + 'T' + S.bed);
    while(hb - bl > 12*H) hb -= 24*H; while(bl - hb > 12*H) hb += 24*H;
    var B = bl + w*(hb - bl), len = (((E.wakeH - E.bedH) % 24) + 24) % 24 || 8;
    out.push({a:B, b:B + len*H});
  }
  return out;
}

function evalPlan(E, L, base, blocks, scoreRest, ck){
  var land = L.outF.b, sleeps = base.concat(blocks);
  if(scoreRest) sleeps = sleeps.concat(scoreRest);
  var R = run(E, sleeps, land + H, ck);
  var sum = 0, n = 0, mn = 101, ls = 0, ln = 0, fmin = 101, press = 0;
  R.pts.forEach(function(p){
    if(p.sl) return;
    if(p.t >= L.we && p.t <= land){
      sum += p.A; n++; if(p.A < mn) mn = p.A;
      if(p.t >= land - 1.5*H){ ls += p.A; ln++; }
    }
    if(p.t >= L.outF.a && p.t <= land && p.A < fmin) fmin = p.A;
    if(p.t >= L.ws && p.t < L.we && p.S > PAR.warnS) press += R.dt/H;
  });
  if(!n) return null;
  var landA = 0;
  for(var i=R.pts.length - 1;i>=0;i--){ var q = R.pts[i]; if(q.t <= land && !q.sl){ landA = q.A; break; } }
  var cost = press*0.75, ease = [], bad = false;
  blocks.forEach(function(b){
    var q = ptAt(R, b.a - R.dt), e = easeOf(R, q);
    ease.push(e);
    if(b.open) return;
    if(e < 0.2) bad = true;
    /* trying a nap that does not come costs little, so naps are penalised half as much as a main sleep */
    cost += (b.kind === 'nap' ? 12.5 : 25)*Math.max(0, 0.7 - e);
  });
  /* a crew meetup: plans that leave you less than Okay for it lose points */
  var outMin = null;
  if(L.out){
    outMin = 101;
    R.pts.forEach(function(p){ if(p.t >= L.out.ns && p.t <= L.out.ne && !p.sl && p.A < outMin) outMin = p.A; });
    if(outMin < 101) cost += 0.5*Math.max(0, 45 - outMin); else outMin = null;
  }
  var main = blocks.filter(function(b){ return b.kind === 'main' && !b.mid; })[0];
  if(main && !main.open){
    var ub = usualBeds(E, L), best = 0;
    ub.forEach(function(u){ var o = Math.max(0, Math.min(main.b, u.b) - Math.max(main.a, u.a)); if(o > best) best = o; });
    cost += 15*(1 - best/(main.b - main.a));
  }
  var score = 0.3*(sum/n) + 0.3*mn + 0.4*(ln ? ls/ln : sum/n);
  var lastWake = null;
  if(main){
    var prev = merge(sleeps.filter(function(s){ return s.b <= main.a + 1; }));
    if(prev.length) lastWake = prev[prev.length-1][1];
  }
  return {net:score - cost - (bad ? 1000 : 0), score:score, cost:cost, land:landA, fmin:fmin < 101 ? fmin : landA, mean:sum/n, min:mn,
          outMin:outMin, ease:ease, bad:bad, awakeAtBed:(main && lastWake != null) ? (main.a - lastWake)/H : null, run:R};
}

var NAMES = {none:'No nap', now:'Nap now', later:'Nap later', both:'Short nap now, nap later'};
/* Plan the rest of a layover. fx.fixed are sleeps you logged (done), fx.open is a sleep you are in now
   (no wake time yet), fx.skips are planned sleeps you said you did not take, fx.T is the moment
   from which the plan may still change (after the last thing you logged). */
function planLayover(E, L, base, fx){
  var scoreRest = assumedRests(L.outF).map(function(r){ return {a:r.a, b:r.b}; }), T = fx.T, now = fx.now;
  var ubAll = usualBeds(E, L), ub = ubAll.filter(function(u){ return u.a >= L.ws + 2*H && u.a <= L.we - 5*H; });
  var cut = L.out ? L.out.ns : (ub.length ? ub[ub.length-1].a - 4*H : L.ws + 6*H);
  var mainF = fx.fixed.filter(function(k){ return k.kind === 'main'; })[0] || null;
  var openMain = fx.open && fx.open.kind === 'main' ? fx.open : null;
  var openNap = fx.open && fx.open.kind !== 'main' ? fx.open : null;
  var refMain = mainF || openMain;
  var naps = fx.fixed.filter(function(k){ return k.kind !== 'main'; }).concat(fx.skips.filter(function(k){ return k.kind !== 'main'; }));
  var arrDecided = naps.some(function(n){ return n.a < cut; }) || (openNap && openNap.a < cut) || !!refMain || T > cut - H;
  var lateDecided = naps.some(function(n){ return n.a >= cut + 4*H && (!refMain || n.a > refMain.a); }) || (openNap && openNap.a >= cut + 4*H);
  var bedC = [];
  if(refMain) bedC = [refMain.a];
  else if(L.out){
    /* after a crew meetup: straight to bed, or at your usual bedtime that night (an hour either side) */
    var after = Math.max(L.out.ne + 0.5*H, T);
    bedC = [after];
    var un = ubAll.filter(function(u){ return u.a > after - H && u.a - after < 8*H; })[0];
    if(un) [-1, 0, 1].forEach(function(k){ var x = un.a + k*H; if(x > after + 0.25*H && x <= L.we - 5*H) bedC.push(x); });
  }
  else if(ub.length){ var B = ub[ub.length-1].a; [-1, 0, 1].forEach(function(k){ var x = B + k*H; if(x >= T && x <= L.we - 5*H) bedC.push(x); }); }
  if(!bedC.length) bedC = [Math.max(T, L.we - 9*H)];
  var hoursC = [6.5, 7, 7.5, 8, 8.5, 9.5];
  var openEnds = [null];
  if(openNap){
    openEnds = [1, 1.5, 2, 2.5, 3, 3.5].map(function(h){ return openNap.a + h*H; }).filter(function(e){ return e >= now + 15*MIN && e <= L.we; });
    if(!openEnds.length) openEnds = [Math.min(L.we, now + 15*MIN)];
  }
  var opts = {};
  /* every plan below only differs after T (or after an open nap began), so run the shared part once */
  var ckT = Math.min(T, fx.open ? fx.open.a : T) - 0.5*H, ck = run(E, base, ckT + H, null, ckT).ck;
  function consider(id, blocks){
    blocks = fromNow(blocks, now);
    var r = evalPlan(E, L, base, blocks, scoreRest, ck);
    if(!r) return;
    if(!opts[id] || r.net > opts[id].res.net) opts[id] = {id:id, blocks:blocks, res:r};
  }
  function blk(a, b, kind, open){ return {a:a, b:b, kind:kind, open:!!open}; }
  /* the other nights of a long layover: your usual night (on the balance setting's clock), cut short for the van */
  var taken = fx.fixed.concat(fx.skips, fx.open ? [{a:fx.open.a, b:Math.max(now, fx.open.a) + 4*H}] : [], L.out ? [{a:L.out.ns, b:L.out.ne}] : []);
  function midsFor(ma, mb){
    var out = [];
    ubAll.forEach(function(u){
      var b = Math.min(u.b, L.we);
      if(u.a < Math.max(T, L.ws + 2*H) || b - u.a < 4*H) return;
      if(ma != null && u.a < mb + 6*H && ma < b + 6*H) return;
      if(taken.some(function(x){ return u.a < x.b && x.a < b; })) return;
      out.push({a:u.a, b:b, kind:'main', mid:true, open:false});
    });
    return out;
  }
  openEnds.forEach(function(oe){
    var on = openNap ? blk(openNap.a, oe, 'nap', true) : null, onArr = on && openNap.a < cut;
    bedC.forEach(function(bed){
      var wakes = mainF ? [mainF.b] : hoursC.map(function(h){ return Math.min(bed + h*H, L.we); });
      wakes.filter(function(w, i, a){ return a.indexOf(w) === i; }).forEach(function(wake){
        if(!mainF && wake - bed < 4*H) return;
        if(openMain && wake < now + 20*MIN) return;
        if(onArr && bed < oe + 3*H && !refMain) return;
        var main = mainF ? null : blk(bed, wake, 'main', !!openMain);

        var mids = mainF ? midsFor(mainF.a, mainF.b) : midsFor(bed, wake);
        var firstA = mids.length ? Math.min(bed, mids[0].a) : bed, lastB = mids.reduce(function(m, x){ return Math.max(m, x.b); }, wake);
        var arrNaps = [];
        if(!arrDecided && !on){
          var s0 = Math.max(L.ws, T), napEnd = Math.min(L.out ? L.out.ns - H : firstA - 4*H, firstA - 3*H);
          [1.5, 2, 2.5, 3, 3.5].forEach(function(n){ if(s0 + n*H <= napEnd) arrNaps.push([s0, s0 + n*H]); });
        }
        var lateNaps = [];
        if(!lateDecided && !(on && !onArr)){
          [2, 3].forEach(function(endBefore){
            [2, 3].forEach(function(len){
              var e = L.we - endBefore*H, st = e - len*H;
              if(st >= lastB + 4*H && st >= T) lateNaps.push([st, e]);
            });
          });
        }
        var pre = (main ? [main] : []).concat(mids);
        var lateOpen = on && !onArr ? [on] : [];
        if(onArr){
          consider(oe - openNap.a >= 2.5*H ? 'now' : 'both', [on].concat(pre));
          lateNaps.forEach(function(ln){ consider('both', [on].concat(pre, [blk(ln[0], ln[1], 'nap')])); });
          return;
        }
        consider('none', pre.concat(lateOpen));
        arrNaps.filter(function(n){ return n[1] - n[0] >= 2.5*H; }).forEach(function(n){ consider('now', [blk(n[0], n[1], 'nap')].concat(pre)); });
        lateNaps.forEach(function(ln){ consider('later', pre.concat([blk(ln[0], ln[1], 'nap')])); });
        arrNaps.filter(function(n){ return n[1] - n[0] <= 2*H; }).forEach(function(n){
          lateNaps.forEach(function(ln){ consider('both', [blk(n[0], n[1], 'nap')].concat(pre, [blk(ln[0], ln[1], 'nap')])); });
        });
      });
    });
  });
  if(L.custom){
    var cb = fromNow(L.custom.filter(function(x){ return x.b > x.a && x.a >= T - MIN && x.a >= L.arr && x.b <= L.dep; })
      .map(function(x){ return blk(x.a, x.b, x.kind === 'nap' ? 'nap' : 'main'); }), now);
    if(cb.length || L.custom.length){ var rc = evalPlan(E, L, base, cb, scoreRest, ck); if(rc) opts.custom = {id:'custom', blocks:cb, res:rc}; }
  }
  var replan = fx.fixed.length || fx.skips.length || fx.open;
  function nameOf(k){
    if(openNap && openNap.a < cut) return k === 'now' ? 'Keep napping' : 'Short nap now, nap later';
    if(!replan && !(k === 'later' && !opts.now)) return NAMES[k];
    if(k === 'none') return mainF ? 'Skip the nap' : openMain ? 'Sleep in, no nap' : 'One long sleep, no nap';
    if(k === 'later') return mainF ? 'Nap before the van' : openMain ? 'Wake earlier, nap later' : 'Sleep, then nap before the van';
    return NAMES[k];
  }
  var list = ['custom', 'now', 'later', 'both', 'none'].filter(function(k){ return opts[k]; }).map(function(k){
    var o = opts[k];
    return {id:k, name:k === 'custom' ? 'Your plan' : nameOf(k), blocks:o.blocks, m:o.res};
  });
  var good = list.filter(function(o){ return !o.m.bad && o.id !== 'custom'; });
  var pool = good.length ? good : list;
  var sug = pool.length ? pool.reduce(function(p, q){ return q.m.net > p.m.net ? q : p; }, pool[0]) : null;
  return {options:list, suggested:sug ? sug.id : null};
}

/* ---------- the whole trip ---------- */
var cache = {key:null, val:null};
function plan(S, now, opt){
  var noCache = opt && opt.noCache;
  var key = JSON.stringify([S.home, S.bed, S.wake, S.landBed, S.van, S.ready, S.balance, S.light, S.night, S.flights, S.lay, S.actual, S.skips, cafLog(S), S.restRules]) + '|' + Math.floor(now/(5*MIN));
  if(!noCache && cache.key === key) return cache.val;
  var E = env(S, now);
  var actual = (S.actual || []).filter(function(x){ return x.a > 0; }).map(function(x){ return {id:x.id, a:x.a, b:x.b == null ? null : x.b, kind:x.kind || ((x.b || now) - x.a >= 4*H ? 'main' : 'nap'), actual:true}; });
  var skips = (S.skips || []).slice();
  var open = actual.filter(function(x){ return x.b == null; })[0] || null;
  var done = actual.filter(function(x){ return x.b != null && x.b > x.a; });
  function clash(s){ return actual.concat(skips).some(function(x){ var xb = x.b == null ? now + 12*H : x.b; return s.a < xb && x.a < s.b; }); }
  var home = fromNow(homeNights(E).filter(function(s){ return !clash(s); }), now);
  var rests = [];
  E.F.forEach(function(f){ if(f.role === 'operate') assumedRests(f).forEach(function(r){ if(!clash(r)) rests.push(r); }); });
  rests = fromNow(rests, now);
  var Ls = layoversOf(E), chosen = [];
  var inLay = function(L, x){ return x.a >= L.arr - H && x.a < L.dep; };
  Ls.forEach(function(L){
    var fixed = done.filter(function(x){ return inLay(L, x); });
    var sk = skips.filter(function(x){ return inLay(L, x); });
    var op = open && inLay(L, open) ? open : null;
    var T = L.ws;
    fixed.concat(sk).forEach(function(x){ if(x.b > T) T = x.b; });
    if(op) T = Math.max(T, now);
    L.fixed = fixed; L.skips = sk; L.open = op; L.T = T;
    var b = home.concat(rests.filter(function(r){ return r.b <= L.ws; }), done.map(function(x){ return {a:x.a, b:x.b}; }), chosen);
    var P = planLayover(E, L, b, {fixed:fixed, open:op, skips:sk, T:T, now:now});
    L.options = P.options; L.suggested = P.suggested;
    var want = L.choice || (L.custom ? 'custom' : null);
    var pick = L.options.filter(function(o){ return o.id === want; })[0] || L.options.filter(function(o){ return o.id === P.suggested; })[0];
    L.picked = pick ? pick.id : null;
    /* where the plan comes from: the app (auto), an option you picked (its times still follow changes), or times you set */
    L.src = L.picked === 'custom' ? 'yours' : (L.choice && L.picked === L.choice ? 'pick' : 'auto');
    /* times you set that no longer fit the layover (a flight or van moved) */
    L.customBroken = !!(L.custom && L.custom.some(function(x){ return !(x.b > x.a) || x.a < L.arr - H || x.b > L.we + MIN; }));
    /* is the app's own suggestion clearly better than what you chose? */
    var sugO = L.options.filter(function(o){ return o.id === P.suggested; })[0];
    L.better = null;
    if(pick && sugO && pick.id !== sugO.id && sugO.m.net - pick.m.net >= 2 && (sugO.m.land - pick.m.land >= 2 || sugO.m.fmin - pick.m.fmin >= 2))
      L.better = {id:sugO.id, name:sugO.name, land:sugO.m.land, landMine:pick.m.land, fmin:sugO.m.fmin, fminMine:pick.m.fmin};
    if(pick) pick.blocks.forEach(function(x){ chosen.push({a:x.a, b:x.b, kind:x.kind, mid:!!x.mid, lay:L.id, open:x.open, late:!!x.late, was:x.was, src:L.src, label:x.kind === 'main' ? 'Sleep' : 'Nap'}); });
  });
  /* a sleep you are in outside any layover ends at your usual length */
  var extra = [];
  if(open && !Ls.some(function(L){ return L.open === open; })){
    var len = ((((E.wakeH - E.bedH) % 24) + 24) % 24 || 8)*H;
    extra.push({a:open.a, b:Math.max(now + 15*MIN, open.a + (open.kind === 'main' ? len : 2*H)), kind:open.kind, open:true});
  }
  var logged = done.map(function(x){ return {a:x.a, b:x.b, kind:x.kind, actual:true, id:x.id, label:x.kind === 'main' ? 'Sleep' : 'Nap'}; });
  var sleeps = home.concat(rests, logged, chosen, extra).sort(function(p,q){ return p.a - q.a; });
  var R = run(E, sleeps);
  E.F.forEach(function(f){
    var mn = 101, land = null;
    R.pts.forEach(function(p){ if(p.t >= f.a && p.t <= f.b && !p.sl){ if(p.A < mn) mn = p.A; land = p.A; } });
    f.minA = mn < 101 ? mn : null; f.landA = land;
  });
  var openEnd = null;
  if(open){ var oc = sleeps.filter(function(x){ return x.open; })[0]; openEnd = oc ? oc.b : null; }
  var val = {E:E, R:R, flights:E.F, layovers:Ls, sleeps:sleeps, open:open, openEnd:openEnd};
  if(!noCache) cache = {key:key, val:val};
  return val;
}

/* ---------- changing a sleep ---------- */
/* Replace whatever is planned over [w.a, w.b] with that sleep and measure the result. Logged sleeps
   that overlap it are replaced too, so you can also ask "what if I had slept then". */
function contextFor(Pl, t, fid){
  var L = Pl.layovers.filter(function(x){ return t >= x.arr - H && t < x.dep; })[0] || null;
  var f = (fid != null ? Pl.flights.filter(function(x){ return String(x.id) === String(fid) && x.a > t; })[0] : null) ||
          Pl.flights.filter(function(x){ return x.role === 'operate' && x.a > t; })[0] || null;
  return {L:L, f:f};
}
function metricsOf(R, w, ctx, E){
  function A(t){ return ptAt(R, t).A; }
  var out = {wake15:A(w.b + 15*MIN)};
  var q = ptAt(R, w.a - R.dt); out.ease = easeOf(R, q);
  if(ctx.L) out.van = A(ctx.L.duty);
  if(ctx.f){
    var mn = 101, land = null;
    R.pts.forEach(function(p){ if(p.t >= ctx.f.a && p.t <= ctx.f.b && !p.sl){ if(p.A < mn) mn = p.A; land = p.A; } });
    out.fmin = mn < 101 ? mn : null; out.land = land;
    var sum = 0, n = 0, ls = 0, ln = 0, m2 = 101, from = ctx.L ? ctx.L.we : w.b;
    R.pts.forEach(function(p){ if(p.t >= from && p.t <= ctx.f.b && !p.sl){ sum += p.A; n++; if(p.A < m2) m2 = p.A; if(p.t >= ctx.f.b - 1.5*H){ ls += p.A; ln++; } } });
    out.score = n ? 0.3*sum/n + 0.3*m2 + 0.4*(ln ? ls/ln : sum/n) : null;
  } else {
    var s2 = 0, n2 = 0;
    R.pts.forEach(function(p){ if(p.t >= w.b + 30*MIN && p.t <= w.b + 12*H && !p.sl){ s2 += p.A; n2++; } });
    out.score = n2 ? s2/n2 : null;
  }
  return out;
}
/* A copy of the state where everything up to the sleep in question is taken as done: planned sleeps that
   end before it count as slept, and the sleep itself is logged. The planner then fills in the rest. */
function stateBefore(S, Pl, t, L, w){
  var S2 = JSON.parse(JSON.stringify(S));
  S2.actual = (S2.actual || []).filter(function(x){ return x.b != null && !(w && x.a < (w.b || w.a + H) && w.a < x.b); });
  var id = 1000;
  Pl.sleeps.forEach(function(s){ if(L && s.lay === L.id && !s.actual && !s.open && s.b <= t) S2.actual.push({id:id++, a:s.a, b:s.b, kind:s.kind === 'nap' ? 'nap' : 'main'}); });
  S2.lay = S2.lay || {};
  if(L && S2.lay[L.id]){ delete S2.lay[L.id].custom; delete S2.lay[L.id].choice; }
  return S2;
}
function stateWith(S, Pl, w, L){
  var S2 = stateBefore(S, Pl, w.a, L, w);
  S2.actual.push({id:2000, a:w.a, b:w.b == null ? null : w.b, kind:w.kind});
  return S2;
}
/* how easily you would fall asleep for the next sleep after w (before the next flight) */
function nextSleep(Pl, w, m, ctx){
  var n = Pl.sleeps.filter(function(s){ return s.a >= w.b + 30*MIN && s.kind !== 'rest' && (!ctx.f || s.a < ctx.f.a); })[0];
  if(!n) return;
  var q = ptAt(Pl.R, n.a - Pl.R.dt);
  m.nextEase = easeOf(Pl.R, q); m.nextAt = n.a; m.nextKind = n.kind === 'nap' ? 'nap' : 'main';
}
/* Take the sleep w as slept, let the planner fill in the rest of the layover, and measure the result
   against the current plan. fid: the flight to measure against (default the next operating flight). */
function whatIf(S, now, w, fid){
  var Pl = plan(S, now), ctx = contextFor(Pl, w.a, fid), base = metricsOf(Pl.R, w, ctx, Pl.E), rest = null;
  var P2 = plan(stateWith(S, Pl, w, ctx.L), Math.max(w.b, now) + MIN, {noCache:true});
  var L2 = ctx.L ? P2.layovers.filter(function(x){ return x.id === ctx.L.id; })[0] : null;
  if(L2){ var o = L2.options.filter(function(x){ return x.id === L2.picked; })[0]; if(o) rest = {name:o.name, blocks:o.blocks.filter(function(b){ return b.a >= w.b; })}; }
  var m = metricsOf(P2.R, w, ctx, P2.E);
  nextSleep(P2, w, m, ctx); nextSleep(Pl, w, base, ctx);
  return {m:m, base:base, ctx:ctx, rest:rest, P2:P2, Pl:Pl,
          wakeBy:ctx.L ? ctx.L.we : (ctx.f ? wakeByOf(S, ctx.f) : null)};
}
/* ---------- best wake-up for a bedtime ----------
   Tries wake-ups from 5 to 10 hours later (30 minutes to 3½ hours for a nap) in 30-minute steps, re-planning
   the rest of the layover for each, and keeps the one with the best alertness from the van to landing, less a
   penalty when you would struggle to fall asleep then or at your next sleep. */
function easeCost(e, kind){ return (kind === 'nap' ? 12.5 : 25)*Math.max(0, 0.7 - e); }
function findBest(S, now, o){
  var Pl = plan(S, now), kind = o.kind === 'nap' ? 'nap' : 'main';
  var steps = kind === 'nap' ? [0.5, 1, 1.5, 2, 2.5, 3, 3.5] : [5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];
  var acts = (S.actual || []).filter(function(x){ return x.b != null; });
  var ok = steps.map(function(hh){ return {a:o.a, b:o.a + hh*H}; }).filter(function(w){
    if(w.b > now && w.a < now - 2*MIN) return false;
    if(Pl.flights.some(function(f){ return w.a < f.b && f.a < w.b; })) return false;
    if(acts.some(function(x){ return w.a < x.b && x.a < w.b; })) return false;
    var L = Pl.layovers.filter(function(x){ return w.a >= x.arr - H && w.a < x.dep; })[0];
    if(L){
      if(w.a >= now && w.a < L.ws - MIN) return false;
      if(w.b > L.we + MIN) return false;
      if(L.out && w.a < L.out.ne && L.out.ns < w.b) return false;
    } else {
      var nf = Pl.flights.filter(function(f){ return f.a >= w.a; })[0];
      if(nf && w.b > wakeByOf(S, nf)) return false;
    }
    return true;
  });
  if(!ok.length) return {err:'No wake-up after that bedtime fits before you have to be up.'};
  var best = null;
  ok.forEach(function(w){
    var m = whatIf(S, now, {a:w.a, b:w.b, kind:kind}, o.fid).m;
    var net = (m.score || 0) - (w.a >= now ? easeCost(m.ease, kind) : 0) - (m.nextEase != null ? easeCost(m.nextEase, m.nextKind) : 0);
    if(!best || net > best.net) best = {a:w.a, b:w.b, net:net};
  });
  return {a:best.a, b:best.b, kind:kind, tried:ok.length};
}

/* ---------- caffeine advice ----------
   cut-off: no caffeine within cut hours (default 6) of your next sleep of 1.5 hours or more (crew rest included);
   coffee: about 45 minutes before your predicted low point on the next operating flight (or as you wake from
   crew rest if that falls in it), with what it would do to the lowest point and landing. */
var cafCache = {pl:null, val:null};
function cafAdvice(S, now){
  var Pl = plan(S, now);
  if(cafCache.pl === Pl) return cafCache.val;
  var cut = (S.caf && +S.caf.cut || 6)*H, out = {mg:cafMg(cafLog(S), now)};
  out.halfBy = out.mg > 5 ? now + 5*H : null;
  var ns = Pl.sleeps.filter(function(s){ return s.a > now && s.b - s.a >= 1.5*H && !s.actual; })[0];
  if(ns){ out.sleep = ns; out.cutoff = ns.a - cut; }
  var f = Pl.flights.filter(function(x){ return x.role === 'operate' && x.b > now; })[0];
  if(f){
    var lo = null;
    /* the low point that caffeine can help with: not the grogginess right after waking */
    var groggy = function(t){ return Pl.sleeps.some(function(sl){ return sl.b <= t && t - sl.b < 0.75*H; }); };
    Pl.R.pts.forEach(function(p){ if(p.t >= Math.max(now, f.a) && p.t <= f.b && !p.sl && !groggy(p.t) && (!lo || p.A < lo.A)) lo = p; });
    if(lo && lo.A < 50){
      var tc = lo.t - 0.75*H;
      Pl.sleeps.forEach(function(s){ if(tc >= s.a && tc < s.b) tc = s.b; });
      tc = Math.max(tc, now);
      tc = Math.round(tc/(15*MIN))*15*MIN;
      var after = Pl.sleeps.filter(function(s){ return s.a > tc && s.b - s.a >= 1.5*H; })[0];
      /* the same plan with one more coffee: a single model run is enough */
      var E2 = {}; for(var k in Pl.E) E2[k] = Pl.E[k];
      E2.S = {caf:{log:cafLog(S).concat([{t:tc, mg:100}])}};
      var R2 = run(E2, Pl.sleeps), mn2 = 101, ld2 = null;
      R2.pts.forEach(function(p){ if(p.t >= f.a && p.t <= f.b && !p.sl){ if(p.A < mn2) mn2 = p.A; ld2 = p.A; } });
      out.coffee = {t:tc, low:lo.t, lowA:lo.A, f:f, inFlight:tc >= f.a && tc < f.b, before:{min:f.minA, land:f.landA}, after:{min:mn2 < 101 ? mn2 : null, land:ld2},
                    conflict:after && after.a - tc < cut ? after : null};
    }
  }
  cafCache = {pl:Pl, val:out};
  return out;
}

/* ---------- body clock over the trip and the days after it ---------- */
var clockCache = {pl:null, val:null};
function clock(S, now){
  var Pl = plan(S, now);
  if(clockCache.pl === Pl) return clockCache.val;
  var E = Pl.E, val = null;
  if(E.F.length){
    var last = E.F[E.F.length - 1], back = last.t.code === E.home.code;
    var E2 = {}; for(var k in E) E2[k] = E[k];
    E2.env = null;
    if(back) E2.t1 = Math.min(E.t0 + 14*24*H, last.b + 7*24*H);
    var extra = back ? homeNights(E2).filter(function(n){ return n.a >= E.t1 - 12*H && !Pl.sleeps.some(function(s){ return s.a < n.b && n.a < s.b; }); }) : [];
    var R2 = run(E2, Pl.sleeps.concat(extra));
    var homeTz = E.home.tz, home = E.home;
    /* the same days spent at home on your usual nights: the trip's effect is the difference from this,
       which takes out the model's own slow drift (and daylight saving, which moves both) */
    var E3 = {}; for(var k3 in E2) E3[k3] = E2[k3];
    E3.env = null;
    E3.F = [];
    E3.locAt = function(t){ return {ap:home, tz:homeTz, lat:home.lat, lon:home.lon, off:offH(homeTz, t), fl:false}; };
    var Rb = run(E3, homeNights(E3));
    var shift = function(i){ return R2.pts[i].E - Rb.pts[Math.min(i, Rb.pts.length - 1)].E; };
    var idx = function(t){ return Math.max(0, Math.min(R2.pts.length - 1, Math.round((t - R2.t0)/R2.dt))); };
    var at = function(t){
      var i = idx(t), p = R2.pts[i], hOff = offH(homeTz, p.t), eff = hOff + shift(i);
      return {t:p.t, gap:wrap12(p.off - eff), gapHome:wrap12(-shift(i)), bodyH:(((p.t/H + eff) % 24) + 24) % 24, off:p.off, homeOff:hOff, eff:eff, fl:p.fl, tz:p.tz};
    };
    var maxGap = 0;
    R2.pts.forEach(function(p, i){ var g = Math.abs(wrap12(p.off - offH(homeTz, p.t) - shift(i))); if(g > maxGap) maxGap = g; });
    var adaptedBy = null;
    if(back){
      var i = R2.pts.length - 1;
      if(Math.abs(shift(i)) < 0.5){
        while(i > 0 && R2.pts[i-1].t >= last.b && Math.abs(shift(i-1)) < 0.5) i--;
        adaptedBy = R2.pts[i].t;
      }
    }
    val = {R:R2, E:E2, at:at, maxGap:maxGap, adaptedBy:adaptedBy, back:back, homeAt:back ? last.b : null, extra:extra};
  }
  clockCache = {pl:Pl, val:val};
  return val;
}

return {
  crewBreaks:crewBreaks, SEATS:SEATS, DEBT:DEBT, vanOf:vanOf, findBest:findBest, clock:clock, cafAdvice:cafAdvice, easeOf:easeOf, gateOf:gateOf, whatIf:whatIf,
  H:H, PAR:PAR, airport:airport, offH:offH, localToMs:localToMs, msToLocal:msToLocal, hm:hm, dow:dow, dayKey:dayKey,
  dayShort:dayShort, dayLong:dayLong, dateStr:dateStr, addDays:addDays, zabbr:zabbr, pad:pad, isoUTC:isoUTC, parseLocal:parseLocal,
  flightsOf:flightsOf, plan:plan, ptAt:ptAt, word:word, color:color, sunElev:sunElev
};
})();
