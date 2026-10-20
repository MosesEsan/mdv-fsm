/* ===== engine: helpers ===== */
var esc=function(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');};
var clone=function(o){return JSON.parse(JSON.stringify(o||{}));};
var DOW=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
var MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
var MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
function dt(k){var p=k.split('-').map(Number);return new Date(Date.UTC(p[0],p[1]-1,p[2]));}
function dkey(D){return D.toISOString().slice(0,10);}
function addDays(k,n){var D=dt(k);D.setUTCDate(D.getUTCDate()+n);return dkey(D);}
function dayLabel(k){var D=dt(k);return DOW[D.getUTCDay()]+' '+D.getUTCDate()+' '+MON[D.getUTCMonth()];}
function shortDay(k){var D=dt(k);return D.getUTCDate()+' '+MON[D.getUTCMonth()];}
function dow(k){return DOW[dt(k).getUTCDay()];}
function monday(k){var D=dt(k);var w=(D.getUTCDay()+6)%7;return addDays(k,-w);}
function monthKey(k){return k.slice(0,7);}
function monthLabel(m){var p=m.split('-');return MONTHS[+p[1]-1]+' '+p[0];}
function addMonths(m,n){var p=m.split('-').map(Number);var d=new Date(Date.UTC(p[0],p[1]-1+n,1));return d.toISOString().slice(0,7);}
function mins(t){var m=/^(\d{1,2}):(\d{2})$/.exec(String(t||'').trim());if(!m)return null;var h=+m[1],mi=+m[2];if(h>23||mi>59)return null;return h*60+mi;}
function r2(n){return Math.round(n*100)/100;}
function r1(n){return Math.round(n*10)/10;}
function fh(n){n=r2(n);return (n%1===0)?n.toFixed(1):String(n);}
function eur(n){return '€'+r2(n).toLocaleString('en-IE',{minimumFractionDigits:2,maximumFractionDigits:2});}
function eur0(n){return '€'+Math.round(n).toLocaleString('en-IE');}
function m2(n){return r1(n).toFixed(1)+' m²';}
function initials(n){return String(n).split(' ').map(function(x){return x[0]||'';}).join('').slice(0,2).toUpperCase();}
function setPath(o,p,v){var a=p.split('.');var t=o;for(var i=0;i<a.length-1;i++){if(t[a[i]]==null||typeof t[a[i]]!=='object')t[a[i]]={};t=t[a[i]];}t[a[a.length-1]]=v;}
function getPath(o,p){return p.split('.').reduce(function(t,k){return t==null?undefined:t[k];},o);}
function conv(v){if(v==='true')return true;if(v==='false')return false;if(v==='null')return null;return v;}
function applySet(st,s){String(s).split(';').forEach(function(pair){if(!pair)return;var i=pair.indexOf('=');if(i<0)return;setPath(st,pair.slice(0,i),conv(pair.slice(i+1)));});}
function lum(hex){var m=/^#?([0-9a-f]{6})$/i.exec(String(hex||'').trim());if(!m)return null;var n=parseInt(m[1],16);var c=[n>>16&255,n>>8&255,n&255].map(function(v){v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);});return .2126*c[0]+.7152*c[1]+.0722*c[2];}
function ratio(a,b){var A=lum(a),B=lum(b);if(A==null||B==null)return null;var hi=Math.max(A,B),lo=Math.min(A,B);return (hi+0.05)/(lo+0.05);}
function spanH(s,e,brk){var a=mins(s),b=mins(e);if(a==null||b==null||b<=a)return 0;return (b-a-(+brk||0))/60;}
var IC={
 msg:'<path d="M4 4h16v12H8l-4 4z"/>', house:'<path d="M3 21h18M5 21V9l7-5 7 5v12"/><path d="M9 21v-6h6v6"/>', cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
 list:'<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>', clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
 tag:'<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/>', check:'<path d="M5 12l5 5L20 7"/>', alert:'<circle cx="12" cy="12" r="10"/><path d="M12 7v6M12 17h.01"/>',
 nosig:'<path d="M2 8.5a15 15 0 0 1 20 0M5 12a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0M12 19h.01M3 3l18 18"/>', cam:'<path d="M4 7h3l2-3h6l2 3h3v13H4z"/><circle cx="12" cy="13" r="4"/>',
 img:'<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/>', lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
 wait:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5h4"/>', up:'<path d="M12 19V5M5 12l7-7 7 7"/>', send:'<path d="M4 12l16-8-6 16-3-7z"/>', doc:'<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/>', person:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>', people:'<circle cx="9" cy="8" r="3.5"/><path d="M2 20c1-3.5 3.5-5 7-5s6 1.5 7 5"/><path d="M16 4a3.5 3.5 0 0 1 0 7M18 15c2 .6 3.3 2.2 4 5"/>', back:'<path d="M15 5l-7 7 7 7"/>',
 euro:'<path d="M18 7a6 6 0 1 0 0 10"/><path d="M4 10h9M4 14h9"/>', home:'<path d="M3 11l9-7 9 7v10H3z"/>', plus:'<path d="M12 5v14M5 12h14"/>', pin:'<path d="M12 21s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>', note:'<path d="M5 3h10l4 4v14H5z"/><path d="M9 12h6M9 16h6"/>', truck:'<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>', bolt:'<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>', box:'<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>', download:'<path d="M12 4v12M6 10l6 6 6-6M4 20h16"/>', mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>', flag:'<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>'
};
function ic(n,s,c){s=s||20;return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke="'+(c||'currentColor')+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(IC[n]||'')+'</svg>';}
function brandVars(b){return '--main:'+b.main+';--mainDk:'+b.mainDk+';--accent:'+b.accent+';--tint:'+b.tint+';--logo-r:'+b.logoR+';';}
/* ===== engine: screen helpers ===== */
function bar(ctx,title,o){o=o||{};var back=o.back!==false&&ctx.inst.stack.length>1;
 return '<header class="ap-bar"><div class="ap-bar-in">'+(back?'<button type="button" class="ap-ib" data-act="back" aria-label="Back">'+ic('back',24)+'</button>':'')+
 '<div class="ttl"><h1>'+esc(title)+'</h1>'+(o.sub?'<div class="ap-sub">'+esc(o.sub)+'</div>':'')+'</div>'+(o.right||'')+'</div>'+(o.below||'')+'</header>';}
function page(ctx,title,inner,o){o=o||{};return {body:bar(ctx,title,o)+'<div class="ap-scroll">'+inner+'</div>',overlay:o.overlay||'',status:o.status||''};}
function webPage(ctx,nav,active,title,inner,o){o=o||{};var b=ctx.b;
 var head='<header class="ap-web"><div class="nm"><div class="ap-logo">'+b.init+'</div><span>'+esc(b.name)+'</span></div><nav aria-label="Main">'+nav.map(function(n){return '<button type="button" data-act="nav" data-arg="'+n[0]+'"'+(n[0]===active?' aria-current="page"':'')+'>'+esc(n[1])+(n[2]?' <span class="ap-cnt">'+n[2]+'</span>':'')+'</button>';}).join('')+'</nav><span class="who">'+esc(o.who||'')+'</span></header>';
 var back=ctx.inst.stack.length>1&&o.back!==false?'<button type="button" class="ap-btn sec sm" style="align-self:flex-start" data-act="back">'+ic('back',16)+'Back</button>':'';
 var ph='<div class="ap-ph1"><h1>'+esc(title)+(o.sub?'<span class="s">'+esc(o.sub)+'</span>':'')+'</h1>'+(o.right||'')+'</div>';
 return {body:head+'<div class="ap-scroll"><div class="ap-wrap wide">'+back+ph+inner+'</div></div>',overlay:o.overlay||''};}
function loadingInner(n){var h='<div aria-busy="true" style="display:flex;flex-direction:column;gap:12px"><span class="ap-sr">Loading</span>';for(var i=0;i<(n||3);i++)h+='<div class="ap-card"><div class="ap-sk" style="height:16px;width:45%"></div><div class="ap-sk" style="height:12px"></div><div class="ap-sk" style="height:12px;width:70%"></div></div>';return h+'<p class="ap-m" style="text-align:center">Getting the latest…</p></div>';}
function errorInner(what){return '<div class="ap-alert bad" role="alert">'+ic('alert',20)+'<div><b>Couldn\'t load '+esc(what)+'</b><span>It looks like there\'s no internet right now. Check your signal and try again. Nothing you saved has been lost.</span><button type="button" class="ap-btn sec sm" style="align-self:flex-start" data-act="set" data-arg="mode=">Try again</button></div></div>';}
function emptyBox(icon,title,text,btn){return '<div class="ap-empty">'+ic(icon,40,'#59636E')+'<b>'+esc(title)+'</b><p>'+esc(text)+'</p>'+(btn||'')+'</div>';}
function chip(label,pressed,attrs,cls){return '<button type="button" class="ap-chip'+(cls?' '+cls:'')+'" aria-pressed="'+(pressed?'true':'false')+'" '+(attrs||'')+'>'+esc(label)+'</button>';}
function field(id,label,val,o){o=o||{};var bind=o.r?'data-bind-r':'data-bind';var tag=o.area?'textarea':'input';
 var attrs='class="ap-in'+(o.bad?' bad':'')+'" id="'+id+'" '+bind+'="'+o.path+'"'+(o.ph?' placeholder="'+esc(o.ph)+'"':'')+(o.type?' type="'+o.type+'"':'')+(o.live?' data-live="'+o.live+'"':'')+(o.mode?' inputmode="'+o.mode+'"':'')+(o.dis?' disabled':'');
 return '<div class="ap-f"><label for="'+id+'">'+esc(label)+'</label>'+(o.area?'<textarea '+attrs+'>'+esc(val)+'</textarea>':'<input '+attrs+' value="'+esc(val)+'">')+(o.hint?'<span class="ap-hint">'+esc(o.hint)+'</span>':'')+(o.err?'<span class="ap-err">'+ic('alert',14)+esc(o.err)+'</span>':'')+'</div>';}
function sheet(inner,label){return '<div class="ap-scrim" data-act="closeScrim"><div class="ap-sheet" role="dialog" aria-modal="true" aria-label="'+esc(label)+'"><div class="ap-grab"></div>'+inner+'</div></div>';}
function uid(ctx,s){return ctx.inst.id.replace(/[^a-z0-9]/gi,'')+'-'+s;}
function pill(txt,cls,icon){return '<span class="ap-pill '+(cls||'grey')+'">'+(icon?ic(icon,12):'')+esc(txt)+'</span>';}
function photoTiles(list,o){o=o||{};return '<div class="ap-photos'+(o.four?' four':'')+'">'+list.map(function(p,i){var l=typeof p==='string'?p:p.l;var w=typeof p==='object'&&p.w;return '<'+(o.act?'button type="button" data-act="'+o.act+'" data-arg="'+i+'" aria-label="Open photo: '+esc(l)+'"':'div')+' class="ap-ph'+(w?' wait':'')+'"'+(o.square?' style="aspect-ratio:1"':'')+'><svg class="pic" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.6" aria-hidden="true">'+IC.img+'</svg>'+(w?'<span class="wt">'+ic('wait',11)+'Waiting</span>':'')+(o.labels!==false?'<span class="lab">'+esc(l)+'</span>':'')+'</'+(o.act?'button':'div')+'>';}).join('')+'</div>';}
function viewer(label,i,n,prevArg,nextArg){return '<div class="ap-viewer" role="dialog" aria-modal="true" aria-label="Photo viewer"><div style="display:flex;align-items:center;gap:10px;min-height:48px"><span style="flex:1;font-size:15px">'+esc(label)+' · '+(i+1)+' of '+n+'</span><button type="button" class="ap-ib" style="background:rgba(255,255,255,.16);border-radius:24px;min-width:48px;min-height:48px" data-act="close" aria-label="Close">×</button></div><div style="flex:1;display:flex;align-items:center;justify-content:center"><div role="img" aria-label="Photo: '+esc(label)+'" style="width:100%;aspect-ratio:4/3;background:#7E8C97;display:flex;align-items:center;justify-content:center">'+ic('img',56,'#E4E8EC')+'</div></div><div style="display:flex;justify-content:space-between;align-items:center"><button type="button" class="ap-ib" style="background:rgba(255,255,255,.16);border-radius:24px;min-width:48px;min-height:48px" aria-label="Previous photo" data-act="set" data-arg="'+prevArg+'">‹</button><span style="font-size:13px;color:#C5CDD4">Swipe or use the arrows</span><button type="button" class="ap-ib" style="background:rgba(255,255,255,.16);border-radius:24px;min-width:48px;min-height:48px" aria-label="Next photo" data-act="set" data-arg="'+nextArg+'">›</button></div></div>';}
function authScreen(ctx,o){var b=ctx.b;return {status:'dk',body:'<div class="ap-scroll" style="padding-top:calc(var(--sa-top) + 36px);gap:22px">'+
 '<div style="display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center"><div class="ap-logo on-light" style="width:76px;height:76px;font-size:28px">'+b.init+'</div><b style="font-size:22px">'+esc(b.name)+'</b><span class="ap-m">'+esc(o.tag)+'</span></div>'+o.inner+'</div>'};}
function check(label,on,attrs,sub){return '<button type="button" class="ap-check" role="checkbox" aria-checked="'+(on?'true':'false')+'" '+(attrs||'')+'><span class="bx">'+(on?ic('check',16,'#fff'):'')+'</span><span class="t"><b>'+esc(label)+'</b>'+(sub?'<span>'+esc(sub)+'</span>':'')+'</span></button>';}
