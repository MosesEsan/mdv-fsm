/* ===== MDC Electrical — Timesheets configured for logging visits against customers (today is Tue 20 Oct 2026) ===== */
var MDC=(function(){
var TODAY='2026-10-20';
var CFG={key:'mdc',time:'17:42',todayShort:'Tue 20 Oct',url:'app.example/timesheets'};
var BRANDS={
 mdc:{id:'mdc',label:'MDC Electrical (placeholder brand)',name:'MDC Electrical',init:'MD',main:'#1F6F8B',mainDk:'#175A71',accent:'#965800',tint:'#E2EFF4',logoR:'14px'}};
var PEOPLE={martin:{n:'Martin',role:'Owner'},jack:{n:'Jack',role:'Apprentice'},michael:{n:'Michael',role:'Accounts Administrator'}};
var CUST={c1:'Harbourside Hotel',c2:'The Granary Hotel',c3:'Oakfield Nursing Home',c4:"Brennan's Bar"};
function V(id,u,c,d,s,f,w,m,by){return {id:id,u:u,c:c,d:d,s:s,f:f,w:w,m:m||[],by:by||u};}
var VISITS=[
 V('e1','martin','c1','2026-10-02','08:00','10:30','Repaired car park lighting column 4',[['Photocell',1,'each'],['LED lamp',1,'each']]),
 V('e2','jack','c1','2026-10-07','09:00','12:00','Replaced 12 downlights in reception with LED',[['LED downlight',12,'each']]),
 V('e3','martin','c3','2026-10-09','13:00','15:30','Installed call bell in room 7',[['Call point',1,'each']]),
 V('e4','martin','c2','2026-10-13','08:00','12:00','New supply for coffee machine',[['6mm T&E cable',15,'m'],['MCB 32A',1,'each']]),
 V('e5','jack','c4','2026-10-14','16:00','18:00','Replaced broken socket in lounge',[['Double socket',1,'each']]),
 V('e6','martin','c1','2026-10-15','08:30','11:00','Fire alarm fault, replaced detector on level 2',[['Optical smoke detector',1,'each']]),
 V('e7','jack','c1','2026-10-16','08:00','09:30','Swapped emergency light test key switch',[['Key switch',1,'each']],'martin'),
 V('e8','martin','c2','2026-10-20','08:00','11:30','Fault-found tripping kitchen circuit, replaced RCBO',[['RCBO 32A',1,'each']]),
 V('e9','jack','c3','2026-10-20','09:00','12:15','PAT testing, 36 items',[])];
function mins(t){var p=String(t||'').split(':');return (+p[0])*60+(+p[1]||0);}
function hrs(v){return (mins(v.f)-mins(v.s))/60;}
function fh2(h){return (Math.round(h*100)/100).toFixed(2);}
function me(st){return st.who||'martin';}
function visits(st){var l=VISITS.concat(st.added||[]).map(clone);var fx=st.fixes||{};l.forEach(function(v){if(fx[v.id]){Object.keys(fx[v.id]).forEach(function(k){v[k]=fx[v.id][k];});}});return l;}
function mine(st){var w=me(st);var l=visits(st);return w==='jack'?l.filter(function(v){return v.u==='jack';}):l;}
function visit(st,id){var l=visits(st);for(var i=0;i<l.length;i++)if(l[i].id===id)return l[i];return l[0];}
function matsText(v){return v.m.length?v.m.map(function(x){return x[2]==='m'?x[1]+' m '+x[0]:x[1]+' × '+x[0];}).join(', '):'—';}
function corrected(v){return v.by&&v.by!==v.u?PEOPLE[v.by].n:null;}
function visitRow(v,o){o=o||{};var fix=corrected(v);return '<button type="button" class="ap-row" data-act="go" data-arg="'+(o.to||'visit')+'" data-set="vid='+v.id+'"><span class="t"><b>'+esc(CUST[v.c])+'</b><span class="m">'+(o.day?dayLabel(v.d)+' · ':'')+v.s+'–'+v.f+' · '+fh2(hrs(v))+' h'+(o.who?' · '+PEOPLE[v.u].n:'')+'</span><span class="m">'+esc(v.w)+'</span>'+(fix?'<span style="margin-top:4px">'+pill('Corrected by '+fix,'amber','note')+'</span>':'')+'</span><span class="chev">›</span></button>';}

var S={};
S.today=function(ctx){var st=ctx.st;var w=me(st);var l=visits(st);var my=l.filter(function(v){return v.u===w&&v.d===TODAY;});var wk=l.filter(function(v){return v.u===w&&v.d>='2026-10-19';});
 var h='<div class="ap-card" style="flex-direction:row;gap:24px"><div style="display:flex;flex-direction:column"><span class="ap-h">Today</span><b style="font-size:24px">'+fh2(my.reduce(function(a,v){return a+hrs(v);},0))+' h</b></div><div style="display:flex;flex-direction:column"><span class="ap-h">This week</span><b style="font-size:24px">'+fh2(wk.reduce(function(a,v){return a+hrs(v);},0))+' h</b></div></div>'+
 '<button type="button" class="ap-btn lg" data-act="go" data-arg="log" data-set="fd=">'+ic('plus',18)+'Log a visit</button>'+
 '<h2 class="ap-h" style="margin-top:6px">Your visits today</h2>'+(my.length?my.map(function(v){return visitRow(v);}).join(''):emptyBox('clock','Nothing logged today','Tap Log a visit when you finish a job.'));
 if(w==='martin'){var j=l.filter(function(v){return v.u==='jack'&&v.d===TODAY;});h+='<h2 class="ap-h" style="margin-top:6px">Jack today</h2>'+(j.length?j.map(function(v){return visitRow(v);}).join(''):'<p class="ap-m">Jack hasn’t logged anything today.</p>');}
 h+='<div class="ap-btns"><button type="button" class="ap-btn sec" data-act="go" data-arg="entries">'+ic('list',18)+(w==='martin'?'All entries':'My entries')+'</button></div>';
 return page(ctx,'Today',h,{sub:PEOPLE[w].n+' · '+PEOPLE[w].role,back:false});};

S.log=function(ctx){var st=ctx.st;var d=st.fd||(st.fd={c:'',d:TODAY,s:'13:00',f:'15:45',w:'',m:[],nc:''});var e=st.errs||{};
 var hh=(d.s&&d.f&&mins(d.f)>mins(d.s))?fh2((mins(d.f)-mins(d.s))/60)+' h':'—';
 var err=function(k){return e[k]?'<span class="ap-err">'+ic('alert',14)+esc(e[k])+'</span>':'';};
 var h='<div class="ap-f"><span class="ap-lb">Date</span><div class="ap-chips">'+chip('Today',d.d===TODAY,'data-act="set" data-arg="fd.d='+TODAY+'"')+chip('Yesterday',d.d==='2026-10-19','data-act="set" data-arg="fd.d=2026-10-19"')+'</div></div>'+
 '<div class="ap-f"><span class="ap-lb">Customer</span><div class="ap-chips">'+['c1','c2','c3','c4'].map(function(k){return chip(CUST[k],d.c===k&&!d.nc,'data-act="set" data-arg="fd.c='+k+';fd.nc="');}).join('')+'</div>'+(st.addingCust?field(uid(ctx,'nc'),'New customer name',d.nc,{path:'fd.nc'}):'<button type="button" class="ap-btn sec sm" style="align-self:flex-start" data-act="set" data-arg="addingCust=true;fd.c=">'+ic('plus',16)+'New customer</button>')+err('c')+'</div>'+
 '<div class="ap-g2">'+field(uid(ctx,'s'),'Start',d.s,{path:'fd.s',type:'time',live:'hrs'})+field(uid(ctx,'f'),'Finish',d.f,{path:'fd.f',type:'time',live:'hrs'})+'</div>'+
 '<div class="ap-alert info" style="justify-content:space-between"><span>Hours</span><b data-hours style="font-size:18px">'+hh+'</b></div>'+err('t')+
 field(uid(ctx,'w'),'Work done',d.w,{path:'fd.w',area:1,ph:'e.g. Replaced 4 emergency lights, 2nd floor',bad:!!e.w})+err('w')+
 '<div class="ap-f"><span class="ap-lb">Materials (optional)</span>'+d.m.map(function(x,i){return '<div style="display:grid;grid-template-columns:minmax(0,1fr) 70px 86px 44px;gap:6px">'+'<input class="ap-in" aria-label="Item" data-bind="fd.m.'+i+'.0" value="'+esc(x[0])+'" placeholder="Item"><input class="ap-in'+(e['m'+i]?' bad':'')+'" aria-label="Quantity" inputmode="decimal" data-bind="fd.m.'+i+'.1" value="'+esc(x[1])+'" placeholder="Qty"><div class="ap-chips" style="flex-wrap:nowrap">'+chip('each',x[2]!=='m','data-act="set" data-arg="fd.m.'+i+'.2=each"')+chip('m',x[2]==='m','data-act="set" data-arg="fd.m.'+i+'.2=m"')+'</div><button type="button" class="ap-ib" aria-label="Remove" data-act="rmMat" data-arg="'+i+'">×</button></div>'+err('m'+i);}).join('')+
 '<button type="button" class="ap-btn sec sm" style="align-self:flex-start" data-act="addMat">'+ic('plus',16)+'Add material</button><span class="ap-hint">“each” needs a whole number; metres allow up to 2 decimals, e.g. 12.5.</span></div>'+
 '<button type="button" class="ap-btn lg" data-act="saveVisit">'+(st.editing?'Save correction':'Save visit')+'</button>';
 return page(ctx,st.editing?(st.editing==='own'?'Edit visit':'Correct Jack’s visit'):'Log a visit',h,{sub:st.editing==='fix'?'Marked “Corrected by Martin” when saved':null});};

S.saved=function(ctx){var st=ctx.st;var v=visit(st,st.vid);
 var h='<div class="ap-card" style="align-items:center;text-align:center;gap:10px;padding:26px">'+ic('check',48,'#1A7F37')+'<b style="font-size:21px">Visit saved</b><span class="ap-m" style="font-size:15px">'+esc(CUST[v.c])+' · '+dayLabel(v.d)+'<br>'+v.s+'–'+v.f+' · '+fh2(hrs(v))+' h</span><span class="ap-m">'+esc(matsText(v))+'</span></div>'+
 '<button type="button" class="ap-btn lg" data-act="replace" data-arg="today">Done</button><div class="ap-btns"><button type="button" class="ap-btn sec" data-act="go" data-arg="log" data-set="fd=">Log another visit</button><button type="button" class="ap-btn sec" data-act="go" data-arg="visit">View visit</button></div>';
 return page(ctx,'Visit saved',h,{back:false});};

S.entries=function(ctx){var st=ctx.st;var w=me(st);var fu=st.fu||'all',fc=st.fc||'all';
 var l=mine(st).filter(function(v){return (fu==='all'||v.u===fu)&&(fc==='all'||v.c===fc);}).sort(function(a,b){return a.d<b.d?1:a.d>b.d?-1:mins(b.s)-mins(a.s);});
 var tot=l.reduce(function(a,v){return a+hrs(v);},0);
 var h='<div class="ap-chips">'+chip('October 2026',true,'')+chip('September',false,'')+'</div>'+
 (w==='martin'?'<div class="ap-chips">'+chip('Everyone',fu==='all','data-act="set" data-arg="fu=all"')+chip('Martin',fu==='martin','data-act="set" data-arg="fu=martin"')+chip('Jack',fu==='jack','data-act="set" data-arg="fu=jack"')+'</div>':'')+
 '<div class="ap-chips">'+chip('All customers',fc==='all','data-act="set" data-arg="fc=all"')+['c1','c2','c3','c4'].map(function(k){return chip(CUST[k],fc===k,'data-act="set" data-arg="fc='+k+'"');}).join('')+'</div>'+
 '<div class="ap-card" style="flex-direction:row;gap:24px"><div style="display:flex;flex-direction:column"><span class="ap-h">Visits</span><b style="font-size:20px">'+l.length+'</b></div><div style="display:flex;flex-direction:column"><span class="ap-h">Hours</span><b style="font-size:20px">'+fh2(tot)+'</b></div></div>';
 var last='';l.forEach(function(v){if(v.d!==last){h+='<h2 class="ap-h" style="margin-top:6px">'+dayLabel(v.d)+'</h2>';last=v.d;}h+=visitRow(v,{who:w==='martin'});});
 if(!l.length)h+=emptyBox('list','No visits here','Try another month or customer.');
 return page(ctx,w==='martin'?'All entries':'My entries',h);};

S.visit=function(ctx){var st=ctx.st;var v=visit(st,st.vid);var w=me(st);var fix=corrected(v);var can=w==='martin'||v.u===w;
 var h='<div class="ap-card"><b style="font-size:18px">'+esc(CUST[v.c])+'</b><span class="ap-m">'+dayLabel(v.d)+' · logged by '+PEOPLE[v.u].n+' ('+PEOPLE[v.u].role+')</span>'+(fix?'<span style="margin-top:4px">'+pill('Corrected by '+fix,'amber','note')+'</span>':'')+'</div>'+
 '<div class="ap-g2"><div class="ap-stat"><span>Time</span><b style="font-size:16px">'+v.s+'–'+v.f+'</b></div><div class="ap-stat"><span>Hours</span><b>'+fh2(hrs(v))+'</b></div></div>'+
 '<div class="ap-card"><span class="ap-h">Work done</span><span style="font-size:15px">'+esc(v.w)+'</span><span class="ap-h" style="margin-top:6px">Materials</span><span style="font-size:15px">'+esc(matsText(v))+'</span></div>';
 if(can)h+='<button type="button" class="ap-btn" data-act="startEdit">'+(v.u===w?'Edit':'Correct entry')+'</button><button type="button" class="ap-btn sec dan" data-act="sheet" data-arg="del">Delete visit</button>';
 var ov=st.sheet==='del'?sheet('<h2>Delete this visit?</h2><p class="ap-m" style="font-size:15px">It disappears from the monthly report too.</p><div class="ap-btns"><button type="button" class="ap-btn dan" data-act="delVisit">Yes, delete</button><button type="button" class="ap-btn sec" data-act="close">Keep it</button></div>','Delete visit'):'';
 return page(ctx,'Visit',h,{overlay:ov});};

/* ---- office dashboard (web) ---- */
var NAV=[['report','Monthly reports'],['wentries','All entries']];
function who(st){return st.as==='martin'?'Martin · Owner':'Michael · Accounts Administrator';}
function table(rows,o){o=o||{};var th='padding:9px 10px;text-align:left;border-bottom:1px solid var(--n-line);font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:var(--n-muted)';var td='padding:9px 10px;border-bottom:1px solid var(--n-line);vertical-align:top;font-size:14px';
 return '<div class="ap-card" style="padding:0;overflow:auto"><table style="border-collapse:collapse;width:100%;min-width:760px"><thead><tr><th style="'+th+'">Date</th>'+(o.cust?'<th style="'+th+'">Customer</th>':'')+'<th style="'+th+'">Worker</th><th style="'+th+'">Work done</th><th style="'+th+'">Time</th><th style="'+th+';text-align:right">Hours</th><th style="'+th+'">Materials</th></tr></thead><tbody>'+
 rows.map(function(v){var fix=corrected(v);return '<tr data-act="go" data-arg="wvisit" data-set="vid='+v.id+'" style="cursor:pointer"><td style="'+td+';white-space:nowrap">'+dayLabel(v.d)+'</td>'+(o.cust?'<td style="'+td+'">'+esc(CUST[v.c])+'</td>':'')+'<td style="'+td+'">'+PEOPLE[v.u].n+(fix?'<br>'+pill('Corrected','amber'):'')+'</td><td style="'+td+'">'+esc(v.w)+'</td><td style="'+td+';white-space:nowrap">'+v.s+'–'+v.f+'</td><td style="'+td+';text-align:right;font-variant-numeric:tabular-nums">'+fh2(hrs(v))+'</td><td style="'+td+';color:var(--n-muted)">'+esc(matsText(v))+'</td></tr>';}).join('')+
 (o.total!=null?'<tr><td colspan="'+(o.cust?5:4)+'" style="'+td+';text-align:right;font-weight:700">Total hours</td><td style="'+td+';text-align:right;font-weight:700">'+fh2(o.total)+'</td><td style="'+td+'"></td></tr>':'')+'</tbody></table></div>';}
S.report=function(ctx){var st=ctx.st;var c=st.rc||'c1';var l=visits(st).filter(function(v){return v.c===c;}).sort(function(a,b){return a.d<b.d?-1:a.d>b.d?1:mins(a.s)-mins(b.s);});
 var tot=l.reduce(function(a,v){return a+hrs(v);},0);var by={};l.forEach(function(v){by[v.u]=(by[v.u]||0)+hrs(v);});
 var mats={};l.forEach(function(v){v.m.forEach(function(x){var k=x[0]+'|'+x[2];mats[k]=mats[k]||{n:x[0],u:x[2],q:0};mats[k].q+=+x[1];});});
 var h='<div class="ap-chips">'+['c1','c2','c3','c4'].map(function(k){return chip(CUST[k],c===k,'data-act="set" data-arg="rc='+k+'"');}).join('')+'</div>'+
 '<div class="ap-chips">'+chip('October 2026',true,'')+chip('September 2026',false,'')+'<span style="flex:1"></span><button type="button" class="ap-btn sm" data-act="toast" data-arg="PDF downloaded: MDC-Timesheet_'+CUST[c].replace(/[^A-Za-z]+/g,'-')+'_2026-10.pdf">'+ic('doc',16)+'Download PDF</button><button type="button" class="ap-btn sec sm" data-act="toast" data-arg="Spreadsheet downloaded (CSV)">Download CSV</button><button type="button" class="ap-btn sec sm" data-act="toast" data-arg="Print dialog opened">Print</button></div>'+
 '<div class="ap-card" style="flex-direction:row;gap:36px;flex-wrap:wrap"><div style="display:flex;flex-direction:column"><span class="ap-h">Visits</span><b style="font-size:20px">'+l.length+'</b></div><div style="display:flex;flex-direction:column"><span class="ap-h">Total hours</span><b style="font-size:20px">'+fh2(tot)+'</b></div><div style="display:flex;flex-direction:column"><span class="ap-h">Worked</span><b style="font-size:16px">'+Object.keys(by).map(function(u){return PEOPLE[u].n+' '+fh2(by[u])+' h';}).join(', ')+'</b></div></div>'+
 (l.length?table(l,{total:tot}):emptyBox('doc','No visits this month','Visits logged for this customer show here.'))+
 '<h2 class="ap-h" style="margin-top:8px">Materials used this month</h2><div class="ap-card" style="max-width:420px">'+(Object.keys(mats).length?Object.keys(mats).sort().map(function(k){var x=mats[k];return '<div style="display:flex;justify-content:space-between"><span>'+esc(x.n)+'</span><b>'+(x.u==='m'?x.q+' m':x.q+' each')+'</b></div>';}).join(''):'<span class="ap-m">No materials logged.</span>')+'</div>';
 return webPage(ctx,NAV,'report','Monthly report',h,{who:who(st),sub:CUST[c]+' · October 2026'});};
S.wentries=function(ctx){var st=ctx.st;var fu=st.fu||'all';var l=visits(st).filter(function(v){return fu==='all'||v.u===fu;}).sort(function(a,b){return a.d<b.d?1:-1;});
 var h='<div class="ap-chips">'+chip('Everyone',fu==='all','data-act="set" data-arg="fu=all"')+chip('Martin',fu==='martin','data-act="set" data-arg="fu=martin"')+chip('Jack',fu==='jack','data-act="set" data-arg="fu=jack"')+'<span class="ap-m" style="margin-left:8px">October 2026 · all customers</span></div>'+table(l,{cust:true});
 return webPage(ctx,NAV,'wentries','All entries',h,{who:who(st)});};
S.wvisit=function(ctx){var st=ctx.st;var v=visit(st,st.vid);var fix=corrected(v);var owner=st.as==='martin';
 var h='<div class="ap-split"><div class="ap-card"><b style="font-size:18px">'+esc(CUST[v.c])+'</b><span class="ap-m">'+dayLabel(v.d)+' · '+v.s+'–'+v.f+' · '+fh2(hrs(v))+' h · logged by '+PEOPLE[v.u].n+'</span>'+(fix?pill('Corrected by '+fix,'amber','note'):'')+'<span class="ap-h" style="margin-top:8px">Work done</span><span>'+esc(v.w)+'</span><span class="ap-h" style="margin-top:8px">Materials</span><span>'+esc(matsText(v))+'</span></div>'+
 '<div class="ap-card">'+(owner?'<button type="button" class="ap-btn" data-act="toast" data-arg="Opens the correction form">Correct entry</button><button type="button" class="ap-btn sec dan" data-act="toast" data-arg="Asks to confirm, then deletes">Delete</button>':'<div class="ap-alert grey">'+ic('lock',20)+'<div><b>Read only</b><span>Accounts can view, download and print, but not change visits.</span></div></div>')+'<button type="button" class="ap-btn sec" data-act="nav" data-arg="report" data-set="rc='+v.c+'">Open the monthly report</button></div></div>';
 return webPage(ctx,NAV,'wentries','Visit',h,{who:who(st)});};

function check2(d){var e={};if(!d.c&&!String(d.nc||'').trim())e.c='Choose a customer, or add a new one.';if(mins(d.f)<=mins(d.s))e.t='Finish time must be after the start time.';else if(mins(d.f)-mins(d.s)>960)e.t='That’s over 16 hours. Check the times.';if(!String(d.w||'').trim())e.w='Add a short note of the work done.';
 d.m.forEach(function(x,i){var raw=String(x[1]).trim().replace(',','.');if(!x[0]&&!raw)return;if(!x[0]){e['m'+i]='Add the item name.';return;}if(!/^\d+(\.\d+)?$/.test(raw)){e['m'+i]=raw.charAt(0)==='-'?'Quantity can’t be negative.':'Quantity must be a number, e.g. 3 or 12.5.';return;}var q=+raw;if(q<=0)e['m'+i]='Quantity must be more than 0.';else if(x[2]!=='m'&&q%1)e['m'+i]='Items counted “each” need a whole number.';else if(x[2]==='m'&&!/^\d+(\.\d{1,2})?$/.test(raw))e['m'+i]='Use up to 2 decimal places for metres.';});return e;}
var ACT={
 addMat:function(st){st.fd.m.push(['','','each']);},
 rmMat:function(st,a){st.fd.m.splice(+a,1);},
 startEdit:function(st,a,inst){var v=visit(st,st.vid);st.fd={c:v.c,d:v.d,s:v.s,f:v.f,w:v.w,m:v.m.map(function(x){return x.slice();}),nc:''};st.editing=v.u===me(st)?'own':'fix';st.errs=null;inst.stack.push('log');},
 saveVisit:function(st,a,inst){var d=st.fd;var e=check2(d);if(Object.keys(e).length){st.errs=e;return;}st.errs=null;var cid=d.c;if(String(d.nc||'').trim()){cid='c1';}
  var rec={c:cid,d:d.d,s:d.s,f:d.f,w:d.w.trim(),m:d.m.filter(function(x){return x[0];}).map(function(x){return [x[0],+String(x[1]).replace(',','.'),x[2]==='m'?'m':'each'];})};
  if(st.editing){st.fixes=st.fixes||{};var by=me(st);rec.by=by;st.fixes[st.vid]=rec;var was=st.editing;st.editing=null;inst.stack.pop();if(was==='fix')st.toast='Saved · marked “Corrected by Martin”';return;}
  var id='n'+((st.added||[]).length+1);rec.id=id;rec.u=me(st);rec.by=me(st);st.added=(st.added||[]).concat([rec]);st.vid=id;inst.stack=['saved'];},
 delVisit:function(st,a,inst){st.sheet=null;inst.stack.pop();st.toast='Visit deleted';}
};
var LIVE={hrs:function(st,dev){var d=st.fd;var out=dev.querySelector('[data-hours]');if(out)out.textContent=(d.s&&d.f&&mins(d.f)>mins(d.s))?fh2((mins(d.f)-mins(d.s))/60)+' h':'—';}};

function st_(s,dev,t,how,note,init,stack){return {s:s,dev:dev||'phone',t:t,how:how,note:note,init:init||{},stack:stack};}
var FLOWS=[
 {id:'mdc-log',title:'MDC: Log a visit',summary:'Replaces the email after each job. Jack picks the customer, checks the times (hours work out as he types), says what he did and adds any materials. A clear "Visit saved" confirms it.',starts:['Today','Log a visit'],next:'mdc-review',steps:[
  st_('today','phone','Today','Jack opens the app after a visit.','Hours today and this week, today’s visits, and one big action. No weekly send-in: sign-off is off for MDC.',{who:'jack'}),
  st_('log','phone','Log a visit','Taps "Log a visit".','Today is preselected; regular customers are chips; finish defaults to now. Hours work out live. Materials are optional.',{who:'jack',fd:{c:'c1',d:TODAY,s:'13:00',f:'15:45',w:'Replaced 3 emergency lights, stairwell B',m:[['Emergency bulkhead LED','3','each'],['2.5mm T&E cable','12.5','m']],nc:''}},['today','log']),
  st_('log','phone','Quantity problems','Types 1.5 sockets and -3 m of cable.','Checked in the app and again by the database: more than 0, whole numbers for "each", up to 2 decimals for metres.',{who:'jack',fd:{c:'c1',d:TODAY,s:'13:00',f:'15:45',w:'Replaced sockets',m:[['Double socket','1.5','each'],['2.5mm T&E cable','-3','m']],nc:''},errs:{m0:'Items counted “each” need a whole number.',m1:'Quantity can’t be negative.'}},['today','log']),
  st_('saved','phone','Visit saved','Taps "Save visit".','A green tick and a summary of what was saved. Done, Log another, or View.',{who:'jack',added:[{id:'n1',u:'jack',by:'jack',c:'c1',d:TODAY,s:'13:00',f:'15:45',w:'Replaced 3 emergency lights, stairwell B',m:[['Emergency bulkhead LED',3,'each'],['2.5mm T&E cable',12.5,'m']]}],vid:'n1'})]},
 {id:'mdc-review',title:'MDC: Owner reviews and corrects',summary:'Martin sees everyone’s visits, filters to Jack and corrects a time. The visit is marked "Corrected by Martin".',starts:['Today','All entries'],next:'mdc-report',steps:[
  st_('entries','phone','All entries, filtered to Jack','Martin taps All entries, then Jack.','Grouped by day with the month’s total. Filters for worker and customer.',{who:'martin',fu:'jack'},['today','entries']),
  st_('log','phone','Correct Jack’s visit','Opens a visit and taps "Correct entry".','The same form. Saving records the change, with who made it.',{who:'martin',vid:'e2',editing:'fix',fd:{c:'c1',d:'2026-10-07',s:'09:00',f:'12:30',w:'Replaced 12 downlights in reception with LED',m:[['LED downlight','12','each']],nc:''}},['entries','visit','log']),
  st_('visit','phone','Marked as corrected','After saving.','Everyone sees "Corrected by Martin" on the visit and in the report.',{who:'martin',vid:'e7'},['entries','visit']),
  st_('entries','phone','Jack’s view','Jack opens My entries.','Only his own visits. He can edit them; he can’t see Martin’s.',{who:'jack'},['today','entries'])]},
 {id:'mdc-report',title:'MDC: Monthly report for invoicing',summary:'Replaces pulling emails together at month end. Accounts picks a customer and month, checks the visits, hours and materials, then downloads the PDF or CSV, or prints.',starts:['Office dashboard','Monthly reports'],next:'',steps:[
  st_('report','desktop','Customer and month','Michael opens Monthly reports on the office computer.','One line per visit, total hours, hours per worker and materials totals. PDF (A4, headings repeat on every page, no visit split across pages, page numbers), CSV, Print.',{as:'michael',rc:'c1'}),
  st_('wentries','desktop','All entries','Clicks All entries.','Every visit for the month; filter by worker. "Corrected" shows where Martin changed something.',{as:'michael'}),
  st_('wvisit','desktop','A visit, read only','Clicks a row.','Accounts can view, download and print, never change. Enforced by the database, not just this screen.',{as:'michael',vid:'e7'},['wentries','wvisit']),
  st_('wvisit','desktop','The owner’s view of the same visit','Martin on the dashboard.','Correct or delete, and jump to the report.',{as:'martin',vid:'e7'},['wentries','wvisit'])]}
];
FLOWS.forEach(function(f){f.ns='mdc';f.brandMap={bw:'mdc',hb:'mdc'};});
return {S:S,ACT:ACT,LIVE:LIVE,CFG:CFG,BRANDS:BRANDS,FLOWS:FLOWS};})();
NS.mdc=MDC;
(function(){Object.keys(MDC.BRANDS).forEach(function(k){BRANDS[k]=MDC.BRANDS[k];});
 FLOWS.push.apply(FLOWS,MDC.FLOWS);
 JOURNEYS.push({id:'mdc',label:'MDC Electrical',desc:'Timesheets set up for an electrical contractor: visits logged against customers on the phone, the owner reviewing and correcting, and a customer-by-month report for invoicing on the office computer. Placeholder brand.',flows:MDC.FLOWS.map(function(f){return f.id;})});
 PLANNED.push('MDC: report header (logo, VAT number, order number), units beyond each/metres, locking a month once invoiced, working with no signal');
})();
