var CFG={key:'fsf',time:'08:12',todayShort:'Tue 3 Nov',url:'app.example/admin',themes:['bw','hb'],
 guide:{colourNote:'Each business sets two colours; everything else is shared. A theme switch changes these colours, the logo and the business name, never layout or wording. Job records flows show their own sample business (Demo Property Care, or Riverside Renovations in the second theme).',
  type:[['Screen title','Enquiries',26,'700'],['Bar title','Schedule',19,'700'],['Card title','Oak floor, kitchen',17,'700'],['Body','Wants it done before Christmas.',16,'400'],['Secondary','5 Oak Lawn, Naas',14,'400'],['Small, hints','Leave blank to use the customer\'s address',13,'400'],['Label','CUSTOMER',12,'700, uppercase, +0.05em']],
  pills:[['To do','grey'],['In progress','amber','clock'],['Completed','green','check'],['Extra work','red','flag'],['Added to invoice','green','check'],['Before','grey','cam'],['Progress','blue','cam'],['Completion','green','cam']],
  patterns:['<b>Navigation:</b> Home tiles, then a back arrow in the top bar. No tab bar. Each feature registers its own tiles, so a business only sees what it has switched on. A business with only job records opens straight on the jobs list.','<b>Sheets:</b> anything that asks "are you sure" or needs one more detail opens from the bottom on phones and centred on tablets.','<b>Data states:</b> loading shows placeholder cards in the shape of the real thing; failed loads say why, offer "Try again", and say nothing saved is lost; empty states say what will appear and offer the first action.','<b>Offline:</b> lists show the last copy and when it was saved. Photos queue and retry by themselves.','<b>Upgrades:</b> modules are switched on by the platform team. A module that\'s off doesn\'t appear at all, so there are no locked teasers.','<b>Prices:</b> only the owner ever sees money. Owner-only screens carry an "Owner only" tag in the bar. Job records and extra work have no prices at all.','<b>Job records:</b> one page per job with customer, instructions, who\'s on it, photos by stage (Before, Progress, Completion), a dated updates feed and extra work. Extra work keeps a red tag until it\'s ticked "Added to invoice".'],
  copy:['Write from the user\'s side: "Book the work", not "Create booking". Buttons say what happens; the toast confirms it ("Booking saved").','No jargon on client screens: "Sign-offs", not "approvals workflow"; "Not going ahead", not "lost".','Both brand colours must reach 4.5 : 1 with white text; the admin refuses to save anything less.','Every update shows who posted it and when, like "Adam · Tue 20 Oct, 10:12".']}};
var TODAY='2026-11-03';
/* ================= brands (themes) ================= */
var BRANDS={
 bw:{id:'bw',label:'Brightwood',name:'Brightwood Flooring',pdf:'Brightwood Flooring Ltd',init:'BF',main:'#1F5F8B',mainDk:'#174A6C',accent:'#A84B12',tint:'#E8F0F6',logoR:'14px'},
 hb:{id:'hb',label:'Harbour',name:'Harbour Build',pdf:'Harbour Build Ltd',init:'HB',main:'#2E6B3A',mainDk:'#22522C',accent:'#7A3E9D',tint:'#E7F1E9',logoR:'28px'}
};
/* ================= sample data (Tue 3 Nov 2026 is "today") ================= */
var PEOPLE={sean:{n:'Seán',full:'Seán Fahy'},ciara:{n:'Ciara',full:'Ciara Dunne'},dara:{n:'Dara',full:'Dara Quinn'}};
var PKEYS=['sean','ciara','dara'];
function B(id,date,s,e,who,job,place,cust,phone,jk){return {id:id,date:date,start:s,end:e,who:who,job:job,place:place,cust:cust,phone:phone,jk:jk||''};}
var BOOKINGS=[
 B('b01','2026-10-26','08:30','17:00',['sean'],'Carpet, landing','3 Hazel Close, Kill','Gerry Byrne','086 410 2290'),
 B('b02','2026-10-27','08:00','17:00',['dara'],'LVT, hallway','12 Main Street, Newbridge','Fiona Hayes','087 330 7781'),
 B('b03','2026-10-28','09:00','15:00',['ciara'],'Vinyl, bathroom','8 Station Road, Sallins','Joan Kearney','085 902 1144'),
 B('b11','2026-11-02','08:30','16:30',['sean'],'Laminate, 2 bedrooms','11 Moat View, Clane','Mark Doyle','087 551 2093'),
 B('b12','2026-11-02','08:00','12:00',['ciara'],'Carpet, stairs','5 Oak Lawn, Naas','Eileen Ward','086 228 4410'),
 B('b13','2026-11-02','13:00','17:00',['ciara'],'Vinyl, bathroom','4 Canal View, Sallins','Joan Kearney','085 902 1144'),
 B('b14','2026-11-02','09:00','15:00',['dara'],'Tiles, utility','41 Ard Rí, Kildare','Peter Quinlan','087 812 3390'),
 B('b21','2026-11-03','08:30','16:30',['sean','ciara'],'Oak floor, kitchen','14 Elm Park, Naas','Maeve Dolan','087 643 1120','maeve'),
 B('b22','2026-11-03','09:00','13:00',['dara'],'LVT, hallway','9 Ashfield, Newbridge','Hugh Brennan','085 774 3019'),
 B('b23','2026-11-03','14:00','17:30',['dara'],'Carpet, box room','2 Hazel Close, Kill','Rita Moran','087 118 5562'),
 B('b31','2026-11-04','08:30','16:30',['sean'],'Oak floor, kitchen (day 2)','14 Elm Park, Naas','Maeve Dolan','087 643 1120','maeve'),
 B('b32','2026-11-04','08:00','11:00',['ciara'],'Laminate repair','6 Barrow Lane, Athy','Colm Duffy','086 901 3374'),
 B('b33','2026-11-04','12:00','17:00',['ciara','dara'],'Engineered wood, hall','30 Riverside, Newbridge','Ann Foley','087 290 6615'),
 B('b34','2026-11-04','08:30','11:30',['dara'],'Carpet, landing','1 Church View, Kilcullen','Sheila Roche','085 664 0021'),
 B('b41','2026-11-05','08:00','16:00',['sean','dara'],'LVT, kitchen and utility','17 Green Road, Kildare','Paul Kinsella','087 702 8846'),
 B('b42','2026-11-05','09:00','13:00',['ciara'],'Vinyl, en-suite','8 Station Road, Sallins','Joan Kearney','085 902 1144'),
 B('b43','2026-11-05','14:00','17:00',['ciara'],'Door bars and trims','5 Oak Lawn, Naas','Eileen Ward','086 228 4410'),
 B('b51','2026-11-06','08:30','14:30',['sean'],'Carpet, 3 bedrooms','25 Beech Grove, Naas','Lisa Brady','086 337 9081'),
 B('b52','2026-11-06','08:00','12:00',['ciara'],'Tiles, porch','11 Moat View, Clane','Mark Doyle','087 551 2093'),
 B('b53','2026-11-06','09:00','17:00',['dara'],'Solid wood, sitting room','4 Mill Road, Kill','Dermot Hayes','087 455 2310'),
 B('b61','2026-11-09','08:30','12:30',['sean'],'Carpet, stairs and landing','18 The Paddocks, Athy','Kevin Ryan','089 201 6650'),
 B('b62','2026-11-10','09:00','13:00',['sean'],'Carpet, box room','7 Rose Hill, Kill','Úna Fox','086 513 7728'),
 B('b63','2026-11-10','08:00','12:00',['dara'],'Vinyl, bathroom','22 Castle View, Clane','Noel Byrne','087 640 2219'),
 B('b64','2026-11-12','09:00','15:00',['ciara'],'Tiles, en-suite','2 Mill Lane, Sallins','Niamh Gallagher','087 663 0188')
];
var JOBINFO={maeve:{notes:'Two dogs in the house. Customer is moving the fridge the night before. Lift the old tiles first.',hours:14,rooms:[{name:'Kitchen',l:4.5,w:3.6,ft:'Solid wood'},{name:'Hallway',l:5.0,w:1.2,ft:'Solid wood'}],photos:['Kitchen','Kitchen','Hallway','Back door']}};
var ENQ=[
 {id:'e1',cust:'Aoife Kelly',what:'Carpet, 3 bedrooms',phone:'087 214 5590',email:'',addr:'22 Willow Grove, Naas',src:'Phone call',when:'Mon 2 Nov, 09:14',stage:'new',details:'Wants a quote before the end of the month.'},
 {id:'e2',cust:'Brian Doyle',what:'Laminate, sitting room',phone:'085 330 1182',email:'brian.doyle@example.ie',addr:'3 Main Street, Kilcullen',src:'Website',when:'Sun 1 Nov, 21:40',stage:'new',details:''},
 {id:'e3',cust:'Sinéad Murphy',what:'Engineered wood, hall and stairs',phone:'086 774 2031',email:'',addr:'9 Abbey Court, Newbridge',src:'Referral',when:'Thu 29 Oct',stage:'viewing',viewing:'Wed 4 Nov, 10:00',details:'Referred by Ann Foley.'},
 {id:'e4',cust:'Tom Walsh',what:'LVT, kitchen and utility',phone:'083 512 9907',email:'tom.walsh@example.ie',addr:'41 Ard Rí, Kildare',src:'Email',when:'Fri 30 Oct',stage:'viewing',viewing:'Thu 5 Nov, 14:30',details:''},
 {id:'e5',cust:'Orla Byrne',what:'Oak floor, kitchen and dining',phone:'087 990 4412',email:'orla.byrne@example.ie',addr:'6 Rathmore Road, Naas',src:'Walk-in',when:'Tue 27 Oct, 15:20',stage:'measured',viewing:'Fri 30 Oct, 10:00',rooms:3,details:'Wants it done before Christmas. Has two dogs, so asked about scratch-resistant finishes.'},
 {id:'e6',cust:'Declan Byrne',what:'Carpet, stairs and landing',phone:'',email:'declan.b@example.ie',addr:'14 Abbeylands, Clane',src:'Social media',when:'Mon 26 Oct',stage:'quoted',viewing:'Wed 28 Oct, 17:00',rooms:2,quote:'Quote sent Fri 30 Oct',details:''},
 {id:'e7',cust:'Maeve Dolan',what:'Oak floor, kitchen and hallway',phone:'087 643 1120',email:'',addr:'14 Elm Park, Naas',src:'Referral',when:'Mon 12 Oct',stage:'booked',viewing:'Thu 15 Oct, 11:00',rooms:2,work:'Tue 3 Nov, 08:30',details:''},
 {id:'e8',cust:'Kevin Ryan',what:'Carpet, stairs and landing',phone:'089 201 6650',email:'',addr:'18 The Paddocks, Athy',src:'Social media',when:'Mon 19 Oct',stage:'booked',viewing:'Wed 21 Oct, 09:30',rooms:2,work:'Mon 9 Nov, 08:30',details:''},
 {id:'e9',cust:'Niamh Gallagher',what:'Tiles, en-suite',phone:'087 663 0188',email:'',addr:'2 Mill Lane, Sallins',src:'Phone call',when:'Wed 21 Oct',stage:'booked',viewing:'Fri 23 Oct, 12:00',rooms:1,work:'Thu 12 Nov, 09:00',details:''},
 {id:'e10',cust:'Ronan Lynch',what:'Laminate, bedroom',phone:'086 300 4471',email:'',addr:'5 Grove Park, Naas',src:'Website',when:'Tue 20 Oct',stage:'lost',reason:'Went with someone else.',details:''}
];
var STAGES=[['new','New','Arrange a viewing','#FDF1E8','#8A3D0E'],['viewing','Viewing booked','','#E8F0F6','#1F5F8B'],['measured','Measured','Ready to quote','#FFF4D6','#6B4700'],['quoted','Quoted','Waiting to hear back','#F3EAF8','#5B2C77'],['booked','Work booked','','#E6F4EA','#116329'],['lost','Not going ahead','','#F0F2F4','#59636E']];
function stageOf(id){for(var i=0;i<STAGES.length;i++)if(STAGES[i][0]===id)return STAGES[i];return STAGES[0];}
var CUSTOMERS=[{id:'c1',name:'Orla Byrne',phone:'087 990 4412',email:'orla.byrne@example.ie',addr:'6 Rathmore Road, Naas'},{id:'c2',name:'Declan Byrne',phone:'',email:'declan.b@example.ie',addr:'14 Abbeylands, Clane'},{id:'c3',name:'Aoife Kelly',phone:'087 214 5590',email:'',addr:'22 Willow Grove, Naas'},{id:'c4',name:'Tom Walsh',phone:'083 512 9907',email:'tom.walsh@example.ie',addr:'41 Ard Rí, Kildare'}];
var SOURCES=['Phone call','Email','Website','Walk-in','Referral','Social media','Other'];
var FLOORS=['Laminate','Engineered wood','Solid wood','Vinyl / LVT','Carpet','Tiles'];
var ROOMS_ORLA=[{name:'Kitchen',l:'5.6',w:'3.2',a:'',ft:'Solid wood',notes:'Fridge to be moved'},{name:'Dining room',l:'4.2',w:'3.5',a:'',ft:'Solid wood',notes:'Step down from kitchen'},{name:'Utility',l:'',w:'',a:'8.6',ft:'Vinyl / LVT',notes:'Odd shape'}];
function roomArea(r){var l=parseFloat(r.l),w=parseFloat(r.w);if(l>0&&w>0)return l*w;var a=parseFloat(r.a);return a>0?a:0;}
var PRICES=[
 {id:'p1',grp:'Floors',name:'Laminate',unit:'m²',price:32},{id:'p2',grp:'Floors',name:'Engineered wood',unit:'m²',price:52},{id:'p3',grp:'Floors',name:'Solid wood',unit:'m²',price:58},{id:'p4',grp:'Floors',name:'Vinyl / LVT',unit:'m²',price:42},{id:'p5',grp:'Floors',name:'Carpet',unit:'m²',price:28},{id:'p6',grp:'Floors',name:'Tiles',unit:'m²',price:48},
 {id:'p7',grp:'Extras',name:'Underlay',unit:'m²',price:6},{id:'p8',grp:'Extras',name:'Door bar',unit:'each',price:18},{id:'p9',grp:'Extras',name:'Lift and remove old floor',unit:'each',price:250},{id:'p10',grp:'Labour',name:'Labour',unit:'hour',price:47.5}
];
function priceOf(list,name){for(var i=0;i<list.length;i++)if(list[i].name===name)return list[i].price;return null;}
/* Timesheets */
function E(date,s,e,brk,job,type){return {date:date,start:s,end:e,brk:brk,job:job,type:type||'Fitting'};}
function entH(x){var a=mins(x.start),b=mins(x.end);if(a==null||b==null||b<=a)return 0;return (b-a-(+x.brk||0))/60;}
var MYWEEK=[E('2026-11-02','08:30','16:30',30,'Laminate, 2 bedrooms')];
var WEEKS={
 dara:{week:'2026-10-26',sent:'Fri 17:05',days:[E('2026-10-26','08:00','17:30',30,'LVT, hallway'),E('2026-10-27','08:00','17:00',30,'LVT, hallway'),E('2026-10-28','07:30','17:30',30,'Tiles, utility'),E('2026-10-29','08:00','17:00',30,'Tiles, utility'),E('2026-10-30','08:00','17:30',30,'Carpet, landing')]},
 sean:{week:'2026-10-26',sent:'Fri 16:40',days:[E('2026-10-26','08:00','16:30',30,'Carpet, landing'),E('2026-10-27','08:00','16:30',30,'Carpet, landing'),E('2026-10-28','08:00','16:30',30,'Laminate, 2 bedrooms'),E('2026-10-29','08:00','16:30',30,'Laminate, 2 bedrooms'),E('2026-10-30','08:00','16:30',30,'Laminate, 2 bedrooms')]},
 ciara:{week:'2026-10-26',sent:'Sat 09:12',days:[E('2026-10-26','08:30','16:30',30,'Vinyl, bathroom'),E('2026-10-27','08:30','16:30',30,'Vinyl, bathroom'),E('2026-10-28','08:30','16:30',30,'Vinyl, bathroom'),E('2026-10-29','08:30','16:30',30,'Carpet, stairs'),E('2026-10-30','08:30','16:30',30,'Carpet, stairs')]}
};
var OT_WEEK=39;
function weekTotal(p){return WEEKS[p].days.reduce(function(s,x){return s+entH(x);},0);}
/* Admin */
var BIZ=[{id:'bw',name:'Brightwood Flooring',tz:'Europe/Dublin',delivery:'Shared app',mods:{Scheduling:true,Flooring:true,Timesheets:true},main:'#1F5F8B',accent:'#A84B12',logo:true,pdf:'Brightwood Flooring Ltd'},
 {id:'hb',name:'Harbour Build',tz:'Europe/Dublin',delivery:'Own app',mods:{Scheduling:true,Flooring:false,Timesheets:true},main:'#2E6B3A',accent:'#7A3E9D',logo:true,pdf:'Harbour Build Ltd',people:14,owner:'Joe Keane'},
 {id:'ce',name:'Corrib Electrical',tz:'Europe/Dublin',delivery:'Shared app',mods:{Scheduling:false,Flooring:false,Timesheets:false},main:'',accent:'',logo:false,pdf:'',people:0}];
var BIZPEOPLE={bw:[{n:'Pat Nolan',e:'pat@brightwood.example',role:'Owner',st:'Last signed in today, 08:12'},{n:'Seán Fahy',e:'seanf@brightwood.example',role:'Fitter',st:'Last signed in Mon 2 Nov'},{n:'Ciara Dunne',e:'ciara.d@brightwood.example',role:'Fitter',st:'invited',inv:'19 Oct'},{n:'Dara Quinn',e:'dara.q@brightwood.example',role:'Fitter',st:'Last signed in Fri 30 Oct'},{n:'Liam Walsh',e:'liam.w@brightwood.example',role:'Fitter',st:'off',off:'12 Oct'}],hb:[],ce:[]};
var HIST={bw:[['Mon 2 Nov, 10:41','Alex','changed the main colour','#2A6FA0 → #1F5F8B'],['Mon 19 Oct, 16:05','Alex','invited Ciara Dunne as Fitter',''],['Mon 19 Oct, 15:58','Alex','switched on Timesheets','How staff log time: Start and finish · Who signs off: Manager'],['Mon 12 Oct, 09:20','Sam','deactivated Liam Walsh',''],['Fri 9 Oct, 14:02','Sam','set the job title for Worker','(standard) → Fitter'],['Fri 9 Oct, 13:55','Sam','created the business','']],hb:[['Thu 1 Oct, 11:20','Sam','created the business','']],ce:[['Mon 2 Nov, 15:30','Alex','created the business','']]};

/* ================= screen helpers ================= */
function badge(stg){var s=stageOf(stg);return '<span class="ap-badge" style="background:'+s[3]+';color:'+s[4]+'">'+esc(s[1])+'</span>';}
function bookingsOf(st){var add=st.added||[];var rm=st.removed||{};var base=BOOKINGS;
 if(st.fresh){base=st.freshBookings?BOOKINGS.filter(function(b){return st.freshBookings.indexOf(b.id)>=0;}):[];}
 return base.concat(add).filter(function(b){return !rm[b.id];});}
function allEnq(st){var base=st.fresh?[]:ENQ;var list=base.concat(st.created||[]);var ov=st.stg||{};return list.map(function(e){var x=clone(e);if(ov[e.id])x.stage=ov[e.id];return x;});}
function findEnq(st,id){var l=allEnq(st);for(var i=0;i<l.length;i++)if(l[i].id===id)return l[i];return l[0]||null;}

/* ================= screens ================= */
var S={};

S.signin=function(ctx){var st=ctx.st,b=ctx.b;
 var err=st.err?'<div class="ap-alert bad" role="alert">'+ic('alert',20)+'<div><b>'+esc(st.err)+'</b></div></div>':'';
 var body='<div class="ap-scroll" style="padding-top:calc(var(--sa-top) + 40px);gap:22px">'+
 '<div style="display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center"><div class="ap-logo on-light" style="width:76px;height:76px;font-size:28px">'+b.init+'</div><b style="font-size:22px">'+esc(b.name)+'</b><span class="ap-m">Sign in to see your jobs</span></div>'+
 '<form class="ap-card" style="gap:14px;padding:18px" data-noop="1">'+field(uid(ctx,'em'),'Email',st.email!=null?st.email:'pat@brightwood.example',{path:'email',type:'email'})+field(uid(ctx,'pw'),'Password',st.pw!=null?st.pw:'',{path:'pw',type:'password'})+err+
 '<button type="button" class="ap-btn lg" data-act="signin">Sign in</button></form>'+
 '<p class="ap-m" style="text-align:center;margin-top:auto">New here? Your manager sends you an invite by email.</p></div>';
 return {body:body,status:'dk'};};

S.setpw=function(ctx){var st=ctx.st,b=ctx.b;var who=st.role==='fitter'?'Seán':'Pat';var email=st.role==='fitter'?'seanf@brightwood.example':'pat@brightwood.example';
 if(st.mode==='expired'){return {status:'dk',body:'<div class="ap-scroll" style="padding-top:calc(var(--sa-top) + 60px);justify-content:center">'+'<div class="ap-card" style="align-items:center;text-align:center;gap:12px;padding:24px">'+ic('clock',48,'#9A6700')+'<b style="font-size:21px">This invite link has expired</b><p class="ap-m" style="font-size:15px">Invite links work for 24 hours. Ask the person who invited you to send a new one. Your account is safe.</p><button type="button" class="ap-btn sec block" data-act="replace" data-arg="signin">Go to sign in</button></div></div>'};}
 var err=st.err?'<div class="ap-alert bad" role="alert">'+ic('alert',20)+'<div><b>'+esc(st.err)+'</b></div></div>':'';
 return {status:'dk',body:'<div class="ap-scroll" style="padding-top:calc(var(--sa-top) + 24px);gap:20px">'+
 '<div style="display:flex;align-items:center;gap:12px"><div class="ap-logo on-light" style="width:52px;height:52px;font-size:19px">'+b.init+'</div><b style="font-size:18px">'+esc(b.name)+'</b></div>'+
 '<div><h1 style="margin:0 0 6px;font-size:26px">Welcome, '+who+'</h1><p class="ap-m" style="font-size:16px">Pick a password to finish setting up your account. You\'ll sign in with '+esc(email)+'.</p></div>'+
 '<form class="ap-card" style="gap:14px;padding:18px">'+field(uid(ctx,'p1'),'New password',st.p1||'',{path:'p1',type:'password',hint:'At least 8 letters or numbers.'})+field(uid(ctx,'p2'),'Type it again',st.p2||'',{path:'p2',type:'password'})+err+
 '<button type="button" class="ap-btn lg" data-act="setpw">Save and sign in</button></form></div>'};};

S.notsetup=function(ctx){return {status:'dk',body:'<div class="ap-scroll" style="justify-content:center;padding-top:var(--sa-top)"><div class="ap-card" style="align-items:center;text-align:center;gap:12px;padding:24px">'+ic('alert',48,'#9A6700')+'<b style="font-size:21px">Your account isn\'t set up yet</b><p class="ap-m" style="font-size:15px">You\'re signed in as ciara@example.ie, but you haven\'t been added to a business. Ask your manager to check your invite, then sign in again.</p><button type="button" class="ap-btn sec block" data-act="replace" data-arg="signin">Sign out</button></div></div>'};};

S.home=function(ctx){var st=ctx.st,b=ctx.b;var role=st.role||'owner';
 var nm=role==='fitter'?'Seán Fahy · Fitter':'Pat Nolan · Owner';
 var head='<header class="ap-bar" style="padding-bottom:18px"><div class="ap-bar-in" style="gap:14px;padding:8px 8px 0"><div class="ap-logo">'+b.init+'</div><div class="ttl" style="padding:0"><h1>'+esc(b.name)+'</h1><div class="ap-sub" style="font-size:15px">'+nm+'</div></div></div></header>';
 var tiles='';function tile(go,icon,t,d,badgeTxt,grey){tiles+='<button type="button" class="ap-tile" data-act="go" data-arg="'+go+'"><span class="ic'+(grey?' grey':'')+'">'+ic(icon,22)+'</span><span class="t"><b>'+t+'</b><span>'+d+'</span></span>'+(badgeTxt?'<span class="ap-cnt">'+badgeTxt+'</span>':'')+'</button>';}
 var inner='';
 if(role==='owner'){
  var newCount=allEnq(st).filter(function(e){return e.stage==='new';}).length;var wait=st.fresh?0:PKEYS.filter(function(p){return !(st.approved||{})[p];}).length;
  if(st.fresh){inner+='<div class="ap-card"><h2 class="ap-h">Getting started</h2>'+
   '<button type="button" class="ap-row" data-act="go" data-arg="prices"><span class="ap-av">1</span><span class="t"><b>Add your prices</b><span class="m">Floors, extras and labour, used on every quote</span></span><span class="chev">›</span></button>'+
   '<button type="button" class="ap-row" data-act="go" data-arg="newenq"><span class="ap-av">2</span><span class="t"><b>Log your first enquiry</b><span class="m">Who got in touch and what they want</span></span><span class="chev">›</span></button>'+
   '<button type="button" class="ap-row" data-act="go" data-arg="schedule"><span class="ap-av">3</span><span class="t"><b>Book your first job</b><span class="m">Your fitters see it on their phones straight away</span></span><span class="chev">›</span></button></div>';}
  tile('enquiries','msg','Enquiries',"New work coming in, and what's next",(!st.fresh&&newCount)?newCount:'');
  tile('viewings','house','Viewings','Measure rooms and take photos');
  tile('schedule','cal','Schedule',"Who's going where this week");
  tile('prices','tag','Prices','Price list and what goes on every quote');
  tile('signoffs','check','Sign-offs','Timesheets waiting for you',wait||'');
  tile('export','clock','Hours & export','Totals and files for payroll');
  tile('settings','gear','Settings','How each feature works for you',0,true);
 } else {
  var mine=bookingsOf(st).filter(function(x){return x.who.indexOf('sean')>=0&&x.date===TODAY;}).sort(function(a,c){return mins(a.start)-mins(c.start);});
  if(mine.length){var j=mine[0];inner+='<div class="ap-card"><span class="ap-h" style="color:var(--accent)">Today · '+dayLabel(TODAY)+'</span><span class="ap-big">'+j.start+'–'+j.end+' '+esc(j.job)+'</span><span class="ap-m">'+esc(j.place)+'</span><button type="button" class="ap-btn" data-act="go" data-arg="jobsheet" data-set="bk='+j.id+'">Open job sheet</button></div>';}
  else inner+='<div class="ap-card"><span class="ap-h">Today · '+dayLabel(TODAY)+'</span><span class="ap-m">Nothing booked for you today.</span></div>';
  tile('myjobs','list','My jobs','Your next two weeks');
  tile('hours','clock','My hours','Clock in, and send in your week');
  tile('settings','gear','Settings','See how things are set up',0,true);
 }
 inner+=tiles+'<button type="button" class="ap-btn sec" style="margin-top:8px" data-act="replace" data-arg="signin">Sign out</button>';
 return {body:head+'<div class="ap-scroll" style="gap:10px">'+inner+'</div>'};};

S.enquiries=function(ctx){var st=ctx.st;var filter=st.filter||'open';
 var right='<button type="button" class="ap-btn acc sm" data-act="go" data-arg="newenq" style="margin-right:6px">+ New</button>';
 var chips='<div class="ap-chips" style="padding:0 6px 12px">'+chip('Open',filter==='open','data-act="set" data-arg="filter=open"','on-bar')+chip('All',filter==='all','data-act="set" data-arg="filter=all"','on-bar')+'</div>';
 var o={right:right,below:chips};
 if(st.mode==='loading')return page(ctx,'Enquiries',loadingInner(3),o);
 if(st.mode==='error')return page(ctx,'Enquiries',errorInner('your enquiries'),o);
 var list=allEnq(st);
 if(!list.length)return page(ctx,'Enquiries',emptyBox('msg','No enquiries yet','When someone gets in touch, add them here so nothing gets lost.','<button type="button" class="ap-btn" data-act="go" data-arg="newenq">+ New enquiry</button>'),o);
 var h='';var hidden=0;
 STAGES.forEach(function(s){var rows=list.filter(function(e){return e.stage===s[0];});if(!rows.length)return;
  if(filter==='open'&&s[0]==='lost'){hidden+=rows.length;return;}
  h+='<div class="ap-grp"><h2>'+s[1]+'</h2><span class="ap-cnt'+((s[0]==='new'||s[0]==='measured')?'':' n')+'">'+rows.length+'</span>'+(s[2]?'<span class="ap-m">'+s[2]+'</span>':'')+'</div><div class="ap-list two">';
  rows.forEach(function(e){var d='';if(e.stage==='viewing')d='Viewing '+e.viewing;else if(e.stage==='measured')d='Viewed '+e.viewing.split(',')[0]+' · '+e.rooms+' rooms';else if(e.stage==='quoted')d=e.quote||'Quote sent';else if(e.stage==='booked')d='Work '+e.work;else if(e.stage==='lost')d=e.reason||'';
   h+='<button type="button" class="ap-row" data-act="go" data-arg="enq" data-set="enqId='+e.id+'"><span class="t"><b>'+esc(e.cust)+' · '+esc(e.what)+'</b><span class="m">'+esc([e.phone||e.email,e.addr].filter(Boolean).join(' · '))+'</span><span class="m">'+esc(e.src)+' · '+esc(e.when)+'</span>'+(d?'<span class="d">'+esc(d)+'</span>':'')+'</span><span class="chev">›</span></button>';});
  h+='</div>';});
 if(hidden)h+='<p class="ap-m">'+hidden+' not going ahead '+(hidden===1?'is':'are')+' hidden. <button type="button" class="ap-btn sec sm" data-act="set" data-arg="filter=all">Show all</button></p>';
 return page(ctx,'Enquiries',h,o);};

S.newenq=function(ctx){var st=ctx.st;var q=st.q||'';var probs=[];
 var picked=null;CUSTOMERS.forEach(function(c){if(c.id===st.cust)picked=c;});
 if(!picked&&!st.newCust)probs.push('Pick a customer, or add a new one.');
 if(st.newCust&&!(st.nc&&st.nc.name))probs.push("Add the customer's name.");
 if(st.newCust&&!(st.nc&&(st.nc.phone||st.nc.email)))probs.push('Add a phone number or an email for the customer.');
 if(!st.what)probs.push('Add what the customer wants.');
 var results='';if(!st.newCust&&!picked&&q.length>=2&&!st.fresh){var qq=q.toLowerCase(),qd=q.replace(/\D/g,'');CUSTOMERS.forEach(function(c){if(c.name.toLowerCase().indexOf(qq)>=0||(qd&&c.phone.replace(/\D/g,'').indexOf(qd)>=0)||c.email.indexOf(qq)>=0)results+='<button type="button" class="ap-row" data-act="set" data-arg="cust='+c.id+'"><span class="t"><b>'+esc(c.name)+'</b><span class="m">'+esc([c.phone||c.email,c.addr].join(' · '))+'</span></span></button>';});if(!results)results='<p class="ap-m">No customers match "'+esc(q)+'".</p>';}
 var c1='<div class="ap-card"><h2 class="ap-big" style="font-size:17px">1 · Customer</h2>';
 if(picked)c1+='<div class="ap-row sel" style="cursor:default"><span class="t"><b>'+esc(picked.name)+'</b><span class="m">'+esc([picked.phone||picked.email,picked.addr].join(' · '))+'</span></span><button type="button" class="ap-btn sec sm" data-act="set" data-arg="cust=">Change</button></div>';
 else if(st.newCust){var nc=st.nc||{};c1+=field(uid(ctx,'ncn'),'Name',nc.name||'',{path:'nc.name'})+'<div class="ap-g2">'+field(uid(ctx,'ncp'),'Phone',nc.phone||'',{path:'nc.phone',mode:'tel'})+field(uid(ctx,'nce'),'Email',nc.email||'',{path:'nc.email',type:'email'})+'</div>'+field(uid(ctx,'nca'),'Address',nc.addr||'',{path:'nc.addr'})+field(uid(ctx,'ncx'),'Notes',nc.notes||'',{path:'nc.notes'})+'<span class="ap-hint">A phone number or an email is needed.</span><button type="button" class="ap-btn sec sm" data-act="set" data-arg="newCust=false">Find an existing customer instead</button>';}
 else c1+='<div class="ap-f"><label for="'+uid(ctx,'q')+'">Find a customer</label><input class="ap-in" id="'+uid(ctx,'q')+'" data-bind-r="q" value="'+esc(q)+'" placeholder="Name, phone or email"><span class="ap-hint">Search by name, phone or email</span></div>'+results+'<button type="button" class="ap-btn dash" data-act="set" data-arg="newCust=true">+ New customer</button>';
 c1+='</div>';
 var c2='<div class="ap-card"><h2 class="ap-big" style="font-size:17px">2 · The job</h2>'+field(uid(ctx,'w'),'What they want',st.what||'',{path:'what',ph:'e.g. Oak floor, kitchen',bad:st.tried&&!st.what})+field(uid(ctx,'ad'),'Site address',st.addr||'',{path:'addr',ph:picked?picked.addr:'',hint:"Leave blank to use the customer's address"})+
  '<div class="ap-f"><span class="ap-lb">How they got in touch</span><div class="ap-chips">'+SOURCES.map(function(s){return chip(s,(st.src||'Phone call')===s,'data-act="set" data-arg="src='+s+'"');}).join('')+'</div></div>'+
  '<div class="ap-f"><label for="'+uid(ctx,'dt')+'">Details</label><textarea class="ap-in" id="'+uid(ctx,'dt')+'" data-bind="details">'+esc(st.details||'')+'</textarea></div></div>';
 var c3='<div class="ap-col"><div class="ap-card"><h2 class="ap-big" style="font-size:17px">3 · Viewing <span class="ap-m" style="font-weight:400;display:inline">(optional)</span></h2><div class="ap-g2">'+field(uid(ctx,'vd'),'Day',st.vday||'',{path:'vday',ph:'e.g. Wed 4 Nov'})+field(uid(ctx,'vt'),'Time',st.vtime||'',{path:'vtime',ph:'e.g. 11:30'})+'</div><span class="ap-hint">Leave blank if you haven\'t arranged it yet.</span></div>'+
  (st.tried&&probs.length?'<div class="ap-alert bad" role="alert">'+ic('alert',20)+'<div><b>Before you save:</b><ul style="margin:0;padding-left:18px">'+probs.map(function(p){return '<li>'+esc(p)+'</li>';}).join('')+'</ul></div></div>':'')+
  '<button type="button" class="ap-btn lg" data-act="saveEnq">Save enquiry</button></div>';
 return page(ctx,'New enquiry','<div class="ap-cols c3">'+c1+c2+c3+'</div>');};

S.enq=function(ctx){var st=ctx.st;var e=findEnq(st,st.enqId);if(!e)return page(ctx,'Enquiry',emptyBox('msg','Enquiry not found','It may have been removed.'));
 var rooms=(st.rooms?st.rooms.length:e.rooms)||0;
 var sum='<div class="ap-card">'+badge(e.stage)+'<span class="ap-big" style="font-size:21px">'+esc(e.what)+'</span><span class="ap-m">'+esc(e.src)+' · '+esc(e.when)+'</span>'+(e.details?'<span style="font-size:15px">'+esc(e.details)+'</span>':'')+'<span class="ap-m">Site: '+esc(e.addr)+(e.addr?' (customer\'s address)':'')+'</span>'+(e.stage==='lost'&&(st.lostReason||e.reason)?'<span class="ap-m">Reason: '+esc(st.lostReason||e.reason)+'</span>':'')+'</div>';
 var cust='<div class="ap-card"><h2 class="ap-h">Customer</h2><span class="ap-big">'+esc(e.cust)+'</span><span class="ap-m">'+esc([e.phone,e.email].filter(Boolean).join(' · '))+'<br>'+esc(e.addr)+'</span><div class="ap-btns">'+(e.phone?'<button type="button" class="ap-btn sm">Call '+esc(e.phone)+'</button>':'')+(e.email?'<button type="button" class="ap-btn sec sm">Email</button>':'')+'<button type="button" class="ap-btn sec sm">Edit</button></div></div>';
 var view='<div class="ap-card"><h2 class="ap-h">Viewing</h2>';
 if(e.viewing){view+='<span style="font-size:17px;font-weight:600">'+esc(e.viewing)+'</span>'+(rooms?'<span class="ap-m">'+rooms+' rooms measured</span><button type="button" class="ap-btn sec" data-act="go" data-arg="viewing">Open viewing ('+rooms+' rooms)</button>':'<button type="button" class="ap-btn" data-act="go" data-arg="viewing">Start the viewing</button>');}
 else view+='<span class="ap-m">No viewing arranged yet.</span><button type="button" class="ap-btn sec" data-act="go" data-arg="viewing">Set a viewing time</button>';
 view+='</div>';
 var next='<div class="ap-card"><h2 class="ap-h">Next</h2>';
 if(e.stage==='lost')next+='<button type="button" class="ap-btn sec" data-act="reopen">Reopen</button>';
 else{
  if(e.stage==='measured')next+='<button type="button" class="ap-btn lg" data-act="go" data-arg="quote">Make a quote</button>';
  if(e.stage==='measured'||e.stage==='quoted'||e.stage==='viewing'||e.stage==='new')next+='<button type="button" class="ap-btn '+(e.stage==='measured'?'sec':'')+'" data-act="go" data-arg="booking" data-set="bkInit=work">Book the work</button>';
  if(e.stage==='booked')next+='<span class="ap-m">Work booked for '+esc(e.work)+'.</span><button type="button" class="ap-btn sec" data-act="go" data-arg="schedule">Open the schedule</button>';
  next+='<button type="button" class="ap-btn dano" data-act="sheet" data-arg="lost">Not going ahead</button>';}
 next+='</div>';
 var ov='';if(st.sheet==='lost')ov=sheet('<h2>Not going ahead?</h2><p class="ap-m" style="font-size:15px">'+esc(e.cust)+' moves to "Not going ahead". You can reopen it later.</p>'+field(uid(ctx,'why'),'Reason (optional)',st.why||'',{path:'why',ph:'e.g. went with someone else'})+'<div class="ap-btns"><button type="button" class="ap-btn dan" data-act="markLost">Mark as not going ahead</button><button type="button" class="ap-btn sec" data-act="close">Keep it open</button></div>','Not going ahead');
 return page(ctx,e.cust,'<div class="ap-cols"><div class="ap-col">'+sum+cust+'</div><div class="ap-col">'+view+next+'</div></div>',{overlay:ov});};

S.viewings=function(ctx){var st=ctx.st;var list=allEnq(st).filter(function(e){return e.stage!=='lost';});
 var form='<div class="ap-card"><label class="ap-lb" for="'+uid(ctx,'nj')+'">New job</label><div style="display:flex;gap:8px"><input class="ap-in" id="'+uid(ctx,'nj')+'" data-bind="nj" value="'+esc(st.nj||'')+'" placeholder="e.g. Carpet, back bedroom"><button type="button" class="ap-btn" data-act="addJob">Add</button></div></div>';
 var jobs=(st.jobs||[]).map(function(j){return '<button type="button" class="ap-row" data-act="go" data-arg="viewing" data-set="vJob='+esc(j)+'"><span class="t"><b>'+esc(j)+'</b><span class="m">No customer yet</span></span><span class="ap-badge" style="background:#F0F2F4;color:#59636E">No viewing yet</span></button>';}).join('');
 if(!list.length&&!jobs)return page(ctx,'Viewings',form+emptyBox('house','No viewings yet','Add a job above, or start from an enquiry. Rooms and photos you take at the house are kept with the job.'));
 var rows=list.map(function(e){var t,bg,fg;if(e.rooms){t=(e.viewing||'').split(',')[0]+' · '+e.rooms+' rooms';bg='#E6F4EA';fg='#116329';}else if(e.viewing){t='Viewing '+e.viewing.split(',')[0];bg=ctx.b.tint;fg=ctx.b.main;}else{t='No viewing yet';bg='#F0F2F4';fg='#59636E';}
  return '<button type="button" class="ap-row" data-act="go" data-arg="viewing" data-set="enqId='+e.id+'"><span class="t"><b>'+esc(e.what)+'</b><span class="m">'+esc(e.cust)+' · '+esc(e.addr.split(', ').pop())+'</span></span><span class="ap-badge" style="background:'+bg+';color:'+fg+'">'+esc(t)+'</span></button>';}).join('');
 return page(ctx,'Viewings',form+jobs+rows);};

S.viewing=function(ctx){var st=ctx.st;var e=findEnq(st,st.enqId||'e5');
 if(!st.rooms)st.rooms=(e&&e.id==='e5'&&!st.fresh)?clone(ROOMS_ORLA):[];
 if(!st.photos)st.photos=(e&&e.id==='e5'&&!st.fresh)?[{l:'Kitchen',w:0},{l:'Kitchen',w:0},{l:'Dining',w:0},{l:'Doorway',w:0},{l:'Utility',w:1},{l:'Utility',w:1}]:[];
 var total=st.rooms.reduce(function(s,r){return s+roomArea(r);},0);
 var det='<div class="ap-card"><div class="ap-g3">'+field(uid(ctx,'vd'),'Viewing',st.vwhen!=null?st.vwhen:(e&&e.viewing)||'',{path:'vwhen',ph:'Day and time'})+field(uid(ctx,'hr'),'Hours the job will take',st.vhours!=null?st.vhours:(st.rooms.length?'8':''),{path:'vhours',mode:'decimal'})+field(uid(ctx,'nt'),'Notes',st.vnotes!=null?st.vnotes:(st.rooms.length?'Remove old tiles first':''),{path:'vnotes'})+'</div></div>';
 var rooms='<div class="ap-card"><div style="display:flex;align-items:baseline;gap:8px"><h2 class="ap-h" style="flex:1">Rooms</h2><span style="font-size:17px;font-weight:700" class="ap-num">Total '+m2(total)+'</span></div>';
 if(!st.rooms.length&&st.edit==null)rooms+='<p class="ap-m">No rooms yet. Add each room you measure, with its size and the floor they want.</p>';
 st.rooms.forEach(function(r,i){if(String(st.edit)===String(i))rooms+=roomEditor(ctx);else{var hasLW=parseFloat(r.l)>0&&parseFloat(r.w)>0;rooms+='<button type="button" class="ap-row" style="min-height:56px" data-act="editRoom" data-arg="'+i+'"><span class="t"><b>'+esc(r.name)+' · '+m2(roomArea(r))+'</b><span class="m">'+esc([hasLW?(r.l+' × '+r.w+' m'):'Area typed in',r.ft,r.notes].filter(Boolean).join(' · '))+'</span></span><span class="chev">›</span></button>';}});
 if(st.edit==='new')rooms+=roomEditor(ctx);
 if(st.edit==null)rooms+='<button type="button" class="ap-btn sec" data-act="editRoom" data-arg="new">+ Add room</button>';
 rooms+='</div>';
 var waiting=st.photos.filter(function(p){return p.w;}).length;
 var ph='<div class="ap-card"><h2 class="ap-h">Viewing photos</h2><div class="ap-btns"><button type="button" class="ap-btn" data-act="addPhoto">'+ic('cam',18)+'Take photo</button><button type="button" class="ap-btn sec" data-act="addPhoto">Choose photos</button></div>';
 if(st.photos.length){ph+='<div class="ap-photos">'+st.photos.map(function(p){return '<div class="ap-ph'+(p.w?' wait':'')+'"><svg class="pic" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.6" aria-hidden="true">'+IC.img+'</svg>'+(p.w?'<span class="wt">'+ic('wait',11)+'Waiting</span>':'')+'<span class="lab">'+esc(p.l)+'</span></div>';}).join('')+'</div>';}
 else ph+='<p class="ap-m">No photos yet. Photos are made smaller on the phone before they upload.</p>';
 if(waiting)ph+='<div class="ap-alert warn">'+ic('nosig',20)+'<div><span><b>'+waiting+' photo'+(waiting>1?'s':'')+' waiting to upload.</b> No signal? It will keep trying.</span><button type="button" class="ap-btn sec sm" style="align-self:flex-start" data-act="retryUpload">Try again now</button></div></div>';
 else if(st.uploadedNow)ph+='<div class="ap-alert ok">'+ic('check',20)+'<div><b>All photos uploaded.</b></div></div>';
 ph+='</div>';
 var title=e?('Viewing · '+e.what):'Viewing';var sub=e?(e.cust+' · '+e.addr):'';
 return page(ctx,title,'<div class="ap-cols wide"><div class="ap-col">'+det+rooms+'</div><div class="ap-col">'+ph+'</div></div>',{sub:sub,right:'<span style="font-size:14px;display:flex;gap:4px;align-items:center;padding-right:6px">'+ic('check',16)+'Saved</span>'});};
function roomEditor(ctx){var st=ctx.st;var d=st.draft||{};var a=roomArea(d);
 return '<div style="border:2px solid var(--main);border-radius:10px;padding:12px;display:flex;flex-direction:column;gap:10px" data-roomed="1">'+
  field(uid(ctx,'rn'),'Room name',d.name||'',{path:'draft.name',ph:'e.g. Kitchen'})+
  '<div class="ap-g3">'+field(uid(ctx,'rl'),'Length (m)',d.l||'',{path:'draft.l',mode:'decimal',live:'area'})+field(uid(ctx,'rw'),'Width (m)',d.w||'',{path:'draft.w',mode:'decimal',live:'area'})+field(uid(ctx,'ra'),'Or area (m²)',d.a||'',{path:'draft.a',mode:'decimal',live:'area',ph:'odd shapes'})+'</div>'+
  '<span style="font-size:15px;font-weight:700;color:var(--main)" class="ap-num" data-out="area">Area: '+m2(a)+'</span>'+
  '<div class="ap-chips">'+FLOORS.map(function(f){return chip(f,d.ft===f,'data-act="set" data-arg="draft.ft='+f+'"');}).join('')+chip('Other…',d.ft&&FLOORS.indexOf(d.ft)<0,'data-act="set" data-arg="draft.ft=Other"')+'</div>'+
  field(uid(ctx,'rx'),'Notes',d.notes||'',{path:'draft.notes'})+
  (st.roomErr?'<span class="ap-err">'+ic('alert',14)+esc(st.roomErr)+'</span>':'')+
  '<div class="ap-btns"><button type="button" class="ap-btn sm" data-act="saveRoom">Save room</button><button type="button" class="ap-btn sec sm" data-act="set" data-arg="edit=null;roomErr=">Cancel</button>'+(st.edit!=='new'?'<button type="button" class="ap-btn dano sm" data-act="removeRoom">Remove</button>':'')+'</div></div>';}

S.schedule=function(ctx){var st=ctx.st;var wk=st.week||'2026-11-02';var person=st.person||'all';
 var nav='<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><button type="button" class="ap-btn sec sm" data-act="set" data-arg="week='+addDays(wk,-7)+'">‹ Previous</button><b style="font-size:17px;flex:1;text-align:center;min-width:140px">Week of '+dayLabel(wk)+'</b><button type="button" class="ap-btn sec sm" data-act="set" data-arg="week='+addDays(wk,7)+'">Next ›</button></div>'+
 '<div class="ap-chips">'+chip('Everyone',person==='all','data-act="set" data-arg="person=all"')+PKEYS.map(function(p){return chip(PEOPLE[p].n,person===p,'data-act="set" data-arg="person='+p+'"');}).join('')+'</div>';
 var right='<span style="font-size:13px;display:flex;gap:6px;align-items:center;padding-right:8px">'+(st.mode==='offline'?ic('nosig',15)+'Offline':'<span style="width:8px;height:8px;border-radius:4px;background:#7EE2A8;display:inline-block"></span>Live')+'</span>';
 if(st.mode==='loading')return page(ctx,'Schedule',nav+loadingInner(3),{right:right});
 var bks=bookingsOf(st).filter(function(b){return person==='all'||b.who.indexOf(person)>=0;});
 var days='';var any=0;
 for(var i=0;i<5;i++){var k=addDays(wk,i);var list=bks.filter(function(b){return b.date===k;}).sort(function(a,c){return mins(a.start)-mins(c.start);});any+=list.length;
  days+='<div class="ap-day'+(k===TODAY?' today':'')+'"><div class="ap-dh"><b>'+dayLabel(k)+'</b>'+(k===TODAY?'<span class="ap-tag">Today</span>':'')+'<span class="ap-m" style="font-size:13px">'+(list.length?list.length+' job'+(list.length>1?'s':''):'Nothing booked')+'</span></div>'+
  list.map(function(b){return '<button type="button" class="ap-bk'+(b.isNew?' new':'')+'" data-act="go" data-arg="booking" data-set="bkInit='+b.id+'"><b class="ap-num">'+b.start+'–'+b.end+' '+esc(b.job)+'</b><span>'+esc(b.who.map(function(p){return PEOPLE[p].n;}).join(', '))+' · '+esc(b.place.split(', ').pop())+'</span></button>';}).join('')+
  '<button type="button" class="ap-btn dash sm" data-act="go" data-arg="booking" data-set="bkInit=new;bkDay='+k+'">+ Add</button></div>';}
 var top='';if(st.mode==='offline')top='<div class="ap-alert warn">'+ic('nosig',20)+'<div><span><b>No signal.</b> Showing the schedule from 08:12. It updates by itself when you\'re back online.</span></div></div>';
 if(!any&&st.fresh)top+='<div class="ap-alert info">'+ic('cal',20)+'<div><span><b>Nothing booked yet.</b> Tap "+ Add" on a day to book your first job. Fitters see it on their phones straight away.</span></div></div>';
 return page(ctx,'Schedule',nav+top+'<div class="ap-cols c5">'+days+'</div>',{right:right});};

function bkState(st){if(st.bk&&st.bk._for===st.bkInit+'|'+(st.bkDay||''))return st.bk;
 var init=st.bkInit||'work';var bk;
 if(init==='work'){var e=findEnq(st,st.enqId||'e5');bk={job:e?(e.what+' · '+e.cust):'',place:e?e.addr:'',cust:e?e.cust:'',phone:e?e.phone:'',date:'2026-11-10',start:'08:30',end:'16:30',who:['sean','ciara'],notes:'Two dogs in the house. Customer moving the fridge the night before.',editing:null};}
 else if(init==='new'){bk={job:'',place:'',cust:'',phone:'',date:st.bkDay||TODAY,start:'08:30',end:'16:30',who:[],notes:'',editing:null};}
 else{var f=null;bookingsOf(st).forEach(function(b){if(b.id===init)f=b;});if(!f)f=BOOKINGS[0];bk={job:f.job+' · '+f.cust,place:f.place,cust:f.cust,phone:f.phone,date:f.date,start:f.start,end:f.end,who:f.who.slice(),notes:'',editing:f.id};}
 bk._for=init+'|'+(st.bkDay||'');st.bk=bk;return bk;}
function clashes(st,bk){var out=[];var a=mins(bk.start),z=mins(bk.end);if(a==null||z==null||z<=a)return out;
 bookingsOf(st).forEach(function(b){if(b.id===bk.editing||b.date!==bk.date)return;var s=mins(b.start),e=mins(b.end);if(s<z&&a<e){b.who.forEach(function(p){if(bk.who.indexOf(p)>=0)out.push({p:p,b:b});});}});return out;}
S.booking=function(ctx){var st=ctx.st;var bk=bkState(st);var cl=clashes(st,bk);var a=mins(bk.start),z=mins(bk.end);
 var probs=[];if(!bk.job)probs.push('Pick a job.');if(a==null||z==null)probs.push('Type times like 08:30.');else if(z<=a)probs.push('Finish must be after start.');if(!bk.who.length)probs.push('Pick who is going.');
 var clashP={};cl.forEach(function(c){clashP[c.p]=1;});
 var recent=['Oak floor, kitchen and dining · Orla Byrne','Carpet, stairs · Declan Byrne','Tiles, en-suite · Niamh Gallagher'];if(bk.job&&recent.indexOf(bk.job)<0)recent.unshift(bk.job);
 var days=[];for(var i=0;i<14;i++){var k=addDays('2026-11-02',i);var D=dt(k).getUTCDay();if(D!==0&&D!==6)days.push(k);}if(days.indexOf(bk.date)<0)days.unshift(bk.date);
 var left='<div class="ap-card" style="gap:14px"><div class="ap-f"><span class="ap-lb">Job</span><div class="ap-chips">'+recent.map(function(j){return chip(j,bk.job===j,'data-act="bkJob" data-arg="'+esc(j)+'"');}).join('')+chip('+ Add a new job',false,'data-act="bkJob" data-arg=""')+'</div></div>'+
  '<div class="ap-g3"><div class="ap-f"><label for="'+uid(ctx,'d')+'">Day</label><select class="ap-in" id="'+uid(ctx,'d')+'" data-bind-r="bk.date">'+days.map(function(k){return '<option value="'+k+'"'+(k===bk.date?' selected':'')+'>'+dayLabel(k)+'</option>';}).join('')+'</select></div>'+field(uid(ctx,'s'),'Start',bk.start,{path:'bk.start',r:1,mode:'numeric'})+field(uid(ctx,'e'),'Finish',bk.end,{path:'bk.end',r:1,mode:'numeric'})+'</div>'+
  '<div class="ap-f"><span class="ap-lb">Who\'s going</span><div class="ap-chips">'+PKEYS.map(function(p){return chip(PEOPLE[p].n,bk.who.indexOf(p)>=0,'data-act="bkWho" data-arg="'+p+'"',clashP[p]?'bad':'');}).join('')+'</div></div>'+
  cl.map(function(c){return '<div class="ap-alert bad" role="alert">'+ic('alert',20)+'<div><b>Clash: '+esc(PEOPLE[c.p].n)+' already booked '+c.b.start+'–'+c.b.end+'.</b><span>'+esc(c.b.job)+', '+esc(c.b.place.split(', ').pop())+'. Change the times or take '+esc(PEOPLE[c.p].n)+' off this booking.</span></div></div>';}).join('')+
  '<div class="ap-f"><label for="'+uid(ctx,'n')+'">Notes for the job sheet</label><textarea class="ap-in" id="'+uid(ctx,'n')+'" data-bind="bk.notes">'+esc(bk.notes)+'</textarea></div>'+
  (probs.length&&st.tried?'<div class="ap-alert bad">'+ic('alert',20)+'<div>'+probs.map(esc).join('<br>')+'</div></div>':'')+
  '<div class="ap-btns" style="align-items:center"><button type="button" class="ap-btn lg" data-act="saveBooking"'+((cl.length||st.mode==='saving')?' disabled':'')+'>'+(st.mode==='saving'?'Saving…':'Save')+'</button>'+(cl.length?'<span class="ap-m" style="flex:1 1 100%">Fix the clash to save.</span>':'')+(bk.editing?'<button type="button" class="ap-btn dano" data-act="sheet" data-arg="cancelBk">Cancel this booking</button>':'')+'</div></div>';
 var on=bookingsOf(st).filter(function(b){return b.date===bk.date&&b.id!==bk.editing;}).sort(function(x,y){return mins(x.start)-mins(y.start);});
 var right='<div class="ap-card"><h2 class="ap-h">Already on '+dayLabel(bk.date)+'</h2>'+(on.length?on.map(function(b){var hit=cl.some(function(c){return c.b.id===b.id;});return '<div class="ap-bk" style="cursor:default'+(hit?';border-color:var(--n-danger);background:#FFF5F5':'')+'"><b class="ap-num">'+b.start+'–'+b.end+' '+esc(b.job)+'</b><span>'+esc(b.who.map(function(p){return PEOPLE[p].n;}).join(', '))+' · '+esc(b.place)+'</span></div>';}).join(''):'<p class="ap-m">Nothing else booked that day.</p>')+'</div>';
 var ov='';if(st.sheet==='cancelBk')ov=sheet('<h2>Cancel this booking?</h2><p class="ap-m" style="font-size:15px">It comes off the schedule and off '+esc(bk.who.map(function(p){return PEOPLE[p].n;}).join(' and '))+'\'s phones.</p><div class="ap-btns"><button type="button" class="ap-btn dan" data-act="cancelBooking">Cancel booking</button><button type="button" class="ap-btn sec" data-act="close">Keep it</button></div>','Cancel booking');
 return page(ctx,bk.editing?'Edit booking':'Book the work','<div class="ap-cols wide">'+left+right+'</div>',{overlay:ov});};

function quoteLines(st){var rooms=st.qrooms||ROOMS_ORLA;var pl=st.pl||PRICES;var lines=[];var wood=0;
 rooms.forEach(function(r){var q=r1(roomArea(r));if(/wood|Laminate/.test(r.ft))wood+=roomArea(r);var p=st.qp&&st.qp[r.name]!=null?parseFloat(st.qp[r.name]):priceOf(pl,r.ft);lines.push({k:r.name,item:r.name,kind:r.ft,qty:q,unit:'m²',price:p});});
 var ex=[['Underlay','Extra',r1(wood),'m²',priceOf(pl,'Underlay')],['Door bars','Extra',3,'each',priceOf(pl,'Door bar')],['Lift and remove old tiles','Extra',1,'each',priceOf(pl,'Lift and remove old floor')],['Labour','8 hours',8,'hour',priceOf(pl,'Labour')]];
 ex.forEach(function(x){var p=st.qp&&st.qp[x[0]]!=null?parseFloat(st.qp[x[0]]):x[4];lines.push({k:x[0],item:x[0],kind:x[1],qty:x[2],unit:x[3],price:p});});
 (st.qextra||[]).forEach(function(x){lines.push(x);});
 lines.forEach(function(l){l.amt=(l.price!=null&&!isNaN(l.price))?r2(l.qty*l.price):0;});return lines;}
function quoteTotals(st){var lines=quoteLines(st);var sub=r2(lines.reduce(function(s,l){return s+l.amt;},0));var rate=st.vat==null?13.5:parseFloat(st.vat);var vat=r2(sub*rate/100);return {lines:lines,sub:sub,rate:rate,vat:vat,total:r2(sub+vat)};}
S.quote=function(ctx){var st=ctx.st;var t=quoteTotals(st);var status=st.qstatus||'draft';var locked=status!=='draft';var num='Q-00'+(st.qnum||42);
 var rows='<div class="ap-tr h" style="grid-template-columns:minmax(0,2fr) minmax(0,1.2fr) 74px 96px 96px"><span>Item</span><span>Type</span><span class="r">Qty</span><span class="r">Price</span><span class="r">Amount</span></div>'+
 t.lines.map(function(l,i){return '<div class="ap-tr" style="grid-template-columns:minmax(0,2fr) minmax(0,1.2fr) 74px 96px 96px"><b>'+esc(l.item)+'</b><span class="ap-m" style="font-size:13px">'+esc(l.kind)+'</span><span class="r">'+(l.unit==='m²'?fh(l.qty)+' m²':l.qty)+'</span>'+(locked?'<span class="r">'+eur(l.price)+'</span>':'<input class="ap-in ap-num" style="min-height:44px;text-align:right;padding:0 8px" aria-label="'+esc(l.item)+' price in euro" id="'+uid(ctx,'qp'+i)+'" data-bind-r="qp.'+esc(l.k)+'" value="'+(l.price!=null?l.price.toFixed(2):'')+'" inputmode="decimal">')+'<span class="r">'+eur(l.amt)+'</span></div>';}).join('');
 var left='<div class="ap-card"><div style="overflow-x:auto"><div style="min-width:520px">'+rows+'</div></div>'+(locked?'':'<div class="ap-chips" style="padding-top:6px"><button type="button" class="ap-btn sec sm" data-act="addQLine">+ Other line</button></div>')+'</div>';
 var vatChips='<div class="ap-chips">'+[['0','No VAT'],['13.5','13.5%'],['23','23%']].map(function(v){return chip(v[1],String(t.rate)===v[0],locked?'disabled':'data-act="set" data-arg="vat='+v[0]+'"');}).join('')+'</div>';
 var sum='<div class="ap-card"><div class="ap-f"><span class="ap-lb">VAT</span>'+vatChips+'</div><div style="display:flex;justify-content:space-between" class="ap-num"><span>Subtotal</span><span>'+eur(t.sub)+'</span></div><div style="display:flex;justify-content:space-between" class="ap-num"><span>VAT '+(t.rate?fh(t.rate).replace('.0','')+'%':'(none)')+'</span><span>'+eur(t.vat)+'</span></div><div style="display:flex;justify-content:space-between;border-top:1px solid var(--n-line);padding-top:10px;font-size:21px;font-weight:700" class="ap-num"><span>Total</span><span>'+eur(t.total)+'</span></div><span class="ap-hint">Valid until Wed 2 Dec. Room sizes come from the viewing.</span></div>';
 var act='';
 if(status==='draft')act='<button type="button" class="ap-btn lg" data-act="sheet" data-arg="share">Make PDF and share</button><span class="ap-hint">The PDF is saved on the job. Only you can see it.</span>';
 else if(status==='sent')act='<div class="ap-alert info">'+ic('send',20)+'<div><b>'+num+' sent '+dayLabel(TODAY)+'.</b><span>It can\'t be changed now. Make a new version if something changes.</span></div></div><div class="ap-btns"><button type="button" class="ap-btn ok" data-act="set" data-arg="qstatus=accepted;stg.e5=quoted">Customer accepted</button><button type="button" class="ap-btn dano" data-act="set" data-arg="qstatus=declined">Customer declined</button></div><div class="ap-btns"><button type="button" class="ap-btn sec sm" data-act="sheet" data-arg="pdf">Open saved PDF</button><button type="button" class="ap-btn sec sm" data-act="newVersion">Make a new version</button></div>';
 else if(status==='accepted')act='<div class="ap-alert ok">'+ic('check',20)+'<div><b>Accepted. Time to book the work.</b></div></div><button type="button" class="ap-btn lg" data-act="go" data-arg="booking" data-set="bkInit=work">Book the work</button>';
 else act='<div class="ap-alert grey">'+ic('alert',20)+'<div><b>Declined.</b><span>The enquiry moves to "Not going ahead" if you mark it there.</span></div></div><button type="button" class="ap-btn sec" data-act="newVersion">Make a new version</button>';
 var right='<div class="ap-col">'+sum+'<div class="ap-card">'+act+'</div></div>';
 var ov='';
 if(st.sheet==='share'||st.sheet==='pdf')ov=sheet('<h2>'+(st.sheet==='share'?'Share '+num:num+' (saved PDF)')+'</h2>'+a4(ctx,t,num)+(st.sheet==='share'?'<p class="ap-m">Pick how to send it. The quote is marked as sent.</p><div class="ap-btns"><button type="button" class="ap-btn" data-act="shareQuote">WhatsApp</button><button type="button" class="ap-btn sec" data-act="shareQuote">Email</button><button type="button" class="ap-btn sec" data-act="shareQuote">More…</button></div>':'')+'<button type="button" class="ap-btn sec" data-act="close">Close</button>','Quote PDF');
 return page(ctx,'Quote '+num,'<div class="ap-cols wide">'+left+right+'</div>',{sub:'Orla Byrne · Oak floor, kitchen and dining',right:'<span class="ap-lock">'+ic('lock',14)+'Owner only</span>',overlay:ov});};
function a4(ctx,t,num){var b=ctx.b;return '<div class="ap-a4" style="width:300px;align-self:center"><div style="display:flex;gap:8px;align-items:flex-start"><div style="width:26px;height:26px;border-radius:6px;background:var(--main);color:#fff;font-weight:800;font-size:10px;display:flex;align-items:center;justify-content:center">'+b.init+'</div><div style="flex:1"><b style="font-size:11px">'+esc(b.pdf)+'</b><br>Unit 4, Canal Business Park, Naas · 045 879 220</div><b style="font-size:14px;color:var(--main)">Quote</b></div><div>For Orla Byrne, 6 Rathmore Road, Naas · '+num+' · 2 Nov 2026</div>'+
 t.lines.map(function(l){return '<div style="display:flex;justify-content:space-between;border-bottom:1px solid #E4E8EC;padding:2px 0"><span>'+esc(l.item)+'</span><span class="ap-num">'+eur(l.amt)+'</span></div>';}).join('')+
 '<div style="align-self:flex-end;text-align:right" class="ap-num">Subtotal '+eur(t.sub)+'<br>VAT '+eur(t.vat)+'<br><b style="font-size:12px">Total '+eur(t.total)+'</b></div><div style="margin-top:auto;color:#59636E">Valid until Wed 2 Dec 2026. Payment due on completion.</div></div>';}

S.prices=function(ctx){var st=ctx.st;if(!st.pl)st.pl=st.fresh?[]:clone(PRICES);
 var groups={Floors:'per m²',Extras:'',Labour:'per hour'};var h='';
 var form='<div class="ap-card"><h2 class="ap-h">Add a price</h2>'+field(uid(ctx,'pn'),'Name',st.np&&st.np.name||'',{path:'np.name',ph:'e.g. Solid wood'})+'<div class="ap-f"><span class="ap-lb">Group</span><div class="ap-chips">'+['Floors','Extras','Labour'].map(function(g){return chip(g,(st.np&&st.np.grp||'Floors')===g,'data-act="set" data-arg="np.grp='+g+'"');}).join('')+'</div></div><div class="ap-f"><span class="ap-lb">Charged</span><div class="ap-chips">'+['m²','each','hour','metre'].map(function(u){return chip('per '+u,(st.np&&st.np.unit||'m²')===u,'data-act="set" data-arg="np.unit='+u+'"');}).join('')+'</div></div>'+field(uid(ctx,'pp'),'Price (€, before VAT)',st.np&&st.np.price||'',{path:'np.price',mode:'decimal'})+(st.pErr?'<span class="ap-err">'+ic('alert',14)+esc(st.pErr)+'</span>':'')+'<button type="button" class="ap-btn" data-act="addPrice">Add to price list</button></div>';
 if(!st.pl.length)h+=emptyBox('tag','No prices yet','Add what you charge for each floor, the extras and labour. New quotes are filled in from this list.');
 ['Floors','Extras','Labour'].forEach(function(g){var items=st.pl.filter(function(p){return p.grp===g;});if(!items.length)return;h+='<div class="ap-card"><h2 class="ap-h">'+g+'</h2>'+items.map(function(p){return '<div class="ap-tr" style="grid-template-columns:minmax(0,1fr) auto"><span>'+esc(p.name)+' <span class="ap-m" style="display:inline">per '+esc(p.unit)+'</span></span><b class="ap-num">'+eur(p.price)+'</b></div>';}).join('')+'</div>';});
 var prof='<div class="ap-card"><h2 class="ap-h">On every quote</h2>'+(st.fresh?'<div class="ap-g2">'+field(uid(ctx,'qph'),'Phone','',{path:'prof.phone'})+field(uid(ctx,'qem'),'Email','',{path:'prof.email',type:'email'})+'</div>'+field(uid(ctx,'qad'),'Address','',{path:'prof.addr'})+field(uid(ctx,'qvn'),'VAT number','',{path:'prof.vatno',hint:'Leave blank if you\'re not VAT registered'})+'<div class="ap-f"><span class="ap-lb">Usual VAT</span><div class="ap-chips">'+chip('No VAT',false,'')+chip('13.5%',true,'')+chip('23%',false,'')+'</div></div>'+field(uid(ctx,'qvd'),'Quotes are valid for (days)','30',{path:'prof.days',mode:'numeric'}):'<span class="ap-m">045 879 220 · hello@brightwood.example<br>Unit 4, Canal Business Park, Naas<br>VAT no. IE 1234567T · usually 13.5% · valid 30 days</span><button type="button" class="ap-btn sec sm">Edit</button>')+'</div>';
 return page(ctx,'Prices','<div class="ap-cols"><div class="ap-col">'+h+'</div><div class="ap-col">'+form+prof+'</div></div>',{right:'<span class="ap-lock">'+ic('lock',14)+'Owner only</span>'});};

S.myjobs=function(ctx){var st=ctx.st;var end=addDays(TODAY,13);
 var mine=bookingsOf(st).filter(function(b){return b.who.indexOf('sean')>=0&&b.date>=TODAY&&b.date<=end;}).sort(function(a,c){return a.date<c.date?-1:a.date>c.date?1:mins(a.start)-mins(c.start);});
 if(st.mode==='loading')return page(ctx,'My jobs',loadingInner(4));
 if(!mine.length)return page(ctx,'My jobs',emptyBox('cal','No jobs booked for you yet','When the office books you on a job, it shows up here with the address and the job sheet.'));
 var h='';var last='';mine.forEach(function(b){if(b.date!==last){h+='<h2 class="ap-grp" style="font-size:14px;color:var(--n-muted);margin:6px 0 0">'+dayLabel(b.date)+(b.date===TODAY?' <span class="ap-tag">Today</span>':'')+'</h2>';last=b.date;}
  var others=b.who.filter(function(p){return p!=='sean';}).map(function(p){return PEOPLE[p].n;});
  h+='<button type="button" class="ap-row" data-act="go" data-arg="jobsheet" data-set="bk='+b.id+'"><span class="t"><b style="color:var(--main)" class="ap-num">'+b.start+'–'+b.end+'</b><b style="font-size:16px">'+esc(b.job)+'</b><span class="m">'+esc(b.place)+(others.length?' · with '+esc(others.join(', ')):'')+'</span></span><span class="chev">›</span></button>';});
 return page(ctx,'My jobs',h,{sub:'Next 2 weeks'});};

S.jobsheet=function(ctx){var st=ctx.st;var b=null;bookingsOf(st).forEach(function(x){if(x.id===(st.bk||'b21'))b=x;});if(!b)b=BOOKINGS[7];
 if(st.mode==='loading')return page(ctx,b.job,loadingInner(4),{sub:dayLabel(b.date)});
 if(st.mode==='error')return page(ctx,b.job,errorInner('this job sheet'),{sub:dayLabel(b.date)});
 var info=JOBINFO[b.jk]||{notes:'',rooms:[],photos:[],hours:0};var photos=st.mode==='nophotos'?[]:info.photos;
 var others=b.who.filter(function(p){return p!=='sean';}).map(function(p){return PEOPLE[p].n;});
 var h='<div class="ap-card"><h2 class="ap-h">Where</h2><b style="font-size:16px">'+esc(b.place)+'</b><button type="button" class="ap-btn sec">Open in maps</button></div>'+
  '<div class="ap-card"><h2 class="ap-h">Customer</h2><div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><b style="font-size:16px;flex:1">'+esc(b.cust)+'</b><button type="button" class="ap-btn sec sm">Call '+esc(b.phone)+'</button></div></div>'+
  '<div class="ap-card"><h2 class="ap-h">Notes</h2><span style="font-size:15px">'+esc(info.notes||'No notes for this job.')+'</span></div>';
 if(info.rooms.length){var tot=info.rooms.reduce(function(s,r){return s+r.l*r.w;},0);h+='<div class="ap-card"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px"><h2 class="ap-h">Rooms</h2><b class="ap-num" style="font-size:14px">'+m2(tot)+' · about '+info.hours+' hours</b></div>'+info.rooms.map(function(r){return '<div style="display:flex;justify-content:space-between;gap:8px;font-size:14px"><b>'+esc(r.name)+' · '+m2(r.l*r.w)+'</b><span class="ap-m">'+r.l.toFixed(1)+' × '+r.w.toFixed(1)+' m · '+esc(r.ft)+'</span></div>';}).join('')+'</div>';}
 h+='<div class="ap-card"><h2 class="ap-h">Photos</h2>'+(photos.length?'<div class="ap-photos four">'+photos.map(function(p,i){return '<button type="button" class="ap-ph" style="aspect-ratio:1" aria-label="Open photo: '+esc(p)+'" data-act="sheet" data-arg="photo" data-set="phI='+i+'"><svg class="pic" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.6" aria-hidden="true">'+IC.img+'</svg></button>';}).join('')+'</div>':'<p class="ap-m">No photos from the viewing for this job.</p>')+'</div>';
 var ov='';if(st.sheet==='photo'){var i=+st.phI||0;ov='<div class="ap-viewer" role="dialog" aria-modal="true" aria-label="Photo viewer"><div style="display:flex;align-items:center;gap:10px;min-height:48px"><span style="flex:1;font-size:15px">'+esc(photos[i])+' · '+(i+1)+' of '+photos.length+'</span><button type="button" class="ap-ib" style="background:rgba(255,255,255,.16);border-radius:24px;min-width:48px;min-height:48px" data-act="close" aria-label="Close">×</button></div><div style="flex:1;display:flex;align-items:center;justify-content:center"><div role="img" aria-label="Viewing photo: '+esc(photos[i])+'" style="width:100%;aspect-ratio:4/3;background:#7E8C97;display:flex;align-items:center;justify-content:center">'+ic('img',56,'#E4E8EC')+'</div></div><div style="display:flex;justify-content:space-between;align-items:center"><button type="button" class="ap-ib" style="background:rgba(255,255,255,.16);border-radius:24px;min-width:48px;min-height:48px" aria-label="Previous photo" data-act="set" data-arg="phI='+((i+photos.length-1)%photos.length)+'">‹</button><span style="font-size:13px;color:#C5CDD4">Taken at the viewing</span><button type="button" class="ap-ib" style="background:rgba(255,255,255,.16);border-radius:24px;min-width:48px;min-height:48px" aria-label="Next photo" data-act="set" data-arg="phI='+((i+1)%photos.length)+'">›</button></div></div>';}
 return page(ctx,b.job,h,{sub:dayLabel(b.date)+' · '+b.start+'–'+b.end+(others.length?' · with '+others.join(', '):''),overlay:ov});};

function myEntries(st){if(!st.ents)st.ents=st.fresh?[]:clone(MYWEEK);return st.ents;}
S.hours=function(ctx){var st=ctx.st;var ents=myEntries(st);var wk='2026-11-02';var clock=st.clockIn===undefined?(st.fresh?null:'08:22'):st.clockIn;var status=st.wstatus||'draft';
 var total=ents.reduce(function(s,x){return s+entH(x);},0);
 var stat={draft:['Not sent yet','#F0F2F4','#59636E'],sent:['Waiting for sign-off','#FFF4D6','#6B4700'],back:['Sent back','#FFEBE9','#82071E'],approved:['Signed off','#E6F4EA','#116329']}[status];
 var h='<div style="display:flex;align-items:center;gap:8px"><button type="button" class="ap-btn sec sm" aria-label="Previous week">‹</button><b style="flex:1;text-align:center">Week of '+dayLabel(wk)+'</b><button type="button" class="ap-btn sec sm" aria-label="Next week">›</button></div>'+
 '<div class="ap-card" style="flex-direction:row;align-items:center"><div style="flex:1"><span class="ap-m">This week</span><div style="font-size:28px;font-weight:700" class="ap-num">'+fh(total)+' hours</div></div><span class="ap-badge" style="background:'+stat[1]+';color:'+stat[2]+';align-self:center">'+stat[0]+'</span></div>';
 if(status==='back')h+='<div class="ap-alert bad">'+ic('alert',20)+'<div><b>Pat sent this week back.</b><span>"Thursday is missing." Fix it and send it in again.</span></div></div>';
 if(status==='approved')h+='<div class="ap-alert ok">'+ic('lock',20)+'<div><b>Signed off by Pat on Mon 9 Nov.</b><span>This week is locked. Ask Pat if something needs to change.</span></div></div>';
 if(status==='draft'){if(clock)h+='<div class="ap-alert info" style="flex-direction:column"><div style="flex-direction:row;align-items:center;gap:8px">'+ic('clock',18)+'<b>Clocked in at '+clock+'</b><span class="ap-m" style="margin-left:auto">Oak floor, kitchen</span></div><button type="button" class="ap-btn lg" style="width:100%" data-act="clockOut">Clock out</button></div>';
  else h+='<div class="ap-card"><span class="ap-m">Starting work?</span><button type="button" class="ap-btn lg" data-act="clockIn">Clock in</button></div>';}
 for(var i=0;i<5;i++){(function(k){var de=ents.filter(function(x){return x.date===k;});var hh=de.reduce(function(s,x){return s+entH(x);},0);var fut=k>TODAY;var sub=de.length?(de.length>1?de.length+' entries':de[0].job):(k===TODAY&&clock?'Clocked in':(fut?'Not yet':'Nothing logged'));
  h+='<button type="button" class="ap-row" '+(fut?'disabled style="opacity:.6;cursor:default"':'data-act="go" data-arg="tsday" data-set="day='+k+'"')+'><span class="t"><b>'+dayLabel(k)+'</b><span class="m"'+(!de.length&&!fut&&!(k===TODAY&&clock)?' style="color:#9A6700"':'')+'>'+esc(sub)+'</span></span><span class="end">'+(de.length?fh(hh):'–')+'</span></button>';})(addDays(wk,i));}
 if(status==='draft'||status==='back')h+='<button type="button" class="ap-btn acc lg" data-act="sheet" data-arg="send"'+(total?'':' disabled')+'>Send in my week</button>'+(total?'':'<span class="ap-hint" style="text-align:center">Log some time first.</span>');
 var ov='';if(st.sheet==='send')ov=sheet('<h2>Send in your week?</h2><p class="ap-m" style="font-size:15px">'+fh(total)+' hours for the week of '+dayLabel(wk)+'. After you send it, only your manager can change it, or send it back to you.</p>'+(clock?'<div class="ap-alert warn">'+ic('clock',20)+'<div><span>You\'re still clocked in. That time isn\'t included until you clock out.</span></div></div>':'')+'<div class="ap-btns"><button type="button" class="ap-btn" data-act="sendWeek">Send in</button><button type="button" class="ap-btn sec" data-act="close">Not yet</button></div>','Send in week');
 return page(ctx,'My hours',h,{overlay:ov});};
S.tsday=function(ctx){var st=ctx.st;var k=st.day||'2026-11-02';var de=myEntries(st).filter(function(x){return x.date===k;});var hh=de.reduce(function(s,x){return s+entH(x);},0);
 var h=de.map(function(x){return '<div class="ap-card"><div style="display:flex;justify-content:space-between;font-size:16px;font-weight:700" class="ap-num"><span>'+x.start+'–'+x.end+'</span><span>'+fh(entH(x))+' h</span></div><span class="ap-m">'+esc(x.job)+'</span><span class="ap-m">'+esc(x.type)+' · '+(+x.brk?x.brk+' min break':'no break')+'</span></div>';}).join('');
 if(!de.length)h+=emptyBox('clock','Nothing logged for this day','Add the time you worked, or clock in and out from My hours.');
 h+='<button type="button" class="ap-btn dash lg" data-act="go" data-arg="tsentry">+ Add time</button><p class="ap-hint" style="text-align:center">You can change entries until you send in your week.</p>';
 return page(ctx,dayLabel(k),h,{right:'<b class="ap-num" style="padding-right:8px">'+fh(hh)+' hours</b>'});};
S.tsentry=function(ctx){var st=ctx.st;var d=st.te||(st.te={start:'',end:'',brk:'30',job:'Oak floor, kitchen',type:'Fitting'});var k=st.day||TODAY;var tmp={start:d.start,end:d.end,brk:d.brk};var hh=entH(tmp);
 var h='<div class="ap-seg" role="group" aria-label="How to enter time"><button type="button" aria-pressed="true">Start and finish</button><button type="button" aria-pressed="false" disabled title="Set by your manager">Total hours</button></div>'+
 '<div class="ap-g2">'+field(uid(ctx,'s'),'Start',d.start,{path:'te.start',ph:'08:00',live:'tsdur',mode:'numeric'})+field(uid(ctx,'e'),'Finish',d.end,{path:'te.end',ph:'16:30',live:'tsdur',mode:'numeric'})+'</div>'+
 field(uid(ctx,'b'),'Break (minutes)',d.brk,{path:'te.brk',live:'tsdur',mode:'numeric'})+'<span class="ap-hint ap-num" data-out="tsdur">'+(hh?'That\'s '+fh(hh)+' hours of work.':'Type a start and finish, like 08:00.')+'</span>'+
 '<div class="ap-f"><span class="ap-lb">Job</span><div class="ap-chips">'+['Oak floor, kitchen','Laminate, 2 bedrooms','LVT, kitchen and utility'].map(function(j){return chip(j,d.job===j,'data-act="set" data-arg="te.job='+j+'"');}).join('')+'</div></div>'+
 '<div class="ap-f"><span class="ap-lb">Type of work</span><div class="ap-chips">'+['Fitting','Prep and lifting','Travel','Yard'].map(function(j){return chip(j,d.type===j,'data-act="set" data-arg="te.type='+j+'"');}).join('')+'</div></div>'+
 (st.teErr?'<span class="ap-err">'+ic('alert',14)+esc(st.teErr)+'</span>':'')+'<button type="button" class="ap-btn lg" data-act="saveEntry">Save</button>';
 return page(ctx,'Add time · '+dayLabel(k),h);};
S.signoffs=function(ctx){var st=ctx.st;var ap=st.approved||{};var back=st.sentBack||{};
 var wait=PKEYS.filter(function(p){return !ap[p]&&!back[p];});
 var h='<h2 class="ap-grp" style="font-size:14px;color:var(--n-muted);margin:0">Waiting for you · '+wait.length+'</h2>';
 if(!wait.length)h+='<div class="ap-alert ok">'+ic('check',20)+'<div><b>All caught up.</b><span>Every week that was sent in is signed off.</span></div></div>';
 wait.forEach(function(p){var t=weekTotal(p);h+='<button type="button" class="ap-row" data-act="go" data-arg="review" data-set="rv='+p+'"><span class="ap-av">'+initials(PEOPLE[p].full)+'</span><span class="t"><b>'+esc(PEOPLE[p].full)+'</b><span class="m">Week of '+dayLabel(WEEKS[p].week)+' · sent '+esc(WEEKS[p].sent)+'</span></span><span class="end"'+(t>OT_WEEK?' style="color:#9A6700"':'')+'>'+fh(t)+(t>OT_WEEK?' '+ic('clock',14):'')+'</span></button>';});
 var done=PKEYS.filter(function(p){return ap[p];});if(done.length)h+='<h2 class="ap-grp" style="font-size:14px;color:var(--n-muted)">Signed off · '+done.length+'</h2>'+done.map(function(p){return '<div class="ap-row" style="cursor:default"><span class="ap-av">'+initials(PEOPLE[p].full)+'</span><span class="t"><b>'+esc(PEOPLE[p].full)+'</b><span class="m">'+ic('check',12)+' Signed off just now</span></span><span class="end">'+fh(weekTotal(p))+'</span></div>';}).join('');
 var bk=PKEYS.filter(function(p){return back[p];}).map(function(p){return {p:p,why:back[p],t:fh(weekTotal(p))};});
 bk.push({p:'sean',why:'Thursday is missing',t:'32.0',wk:'Mon 19 Oct',fixed:1});
 h+='<h2 class="ap-grp" style="font-size:14px;color:var(--n-muted)">Sent back · '+bk.length+'</h2>'+bk.map(function(x){return '<div class="ap-row" style="cursor:default"><span class="ap-av">'+initials(PEOPLE[x.p].full)+'</span><span class="t"><b>'+esc(PEOPLE[x.p].full)+'</b><span class="m">Week of '+(x.wk||dayLabel(WEEKS[x.p].week))+' · "'+esc(x.why)+'"</span></span><span class="end">'+x.t+'</span></div>';}).join('');
 return page(ctx,'Sign-offs',h);};
S.review=function(ctx){var st=ctx.st;var p=st.rv||'dara';var w=WEEKS[p];var t=weekTotal(p);var norm=Math.min(t,OT_WEEK),ot=Math.max(0,t-OT_WEEK);
 var h='<div class="ap-g3"><div class="ap-stat"><span>Total</span><b>'+fh(t)+'</b></div><div class="ap-stat"><span>Normal</span><b>'+fh(norm)+'</b></div><div class="ap-stat"'+(ot?' style="background:#FFF8E5;border-color:#E8CF8A"':'')+'><span'+(ot?' style="color:#5C3D00"':'')+'>Overtime</span><b'+(ot?' style="color:#5C3D00"':'')+'>'+fh(ot)+'</b></div></div>'+
 '<div class="ap-card" style="gap:0;padding:4px 14px">'+w.days.map(function(x){return '<div class="ap-tr" style="grid-template-columns:minmax(0,1fr) auto"><span><b>'+dayLabel(x.date)+'</b><br><span class="ap-m" style="font-size:13px">'+x.start+'–'+x.end+' · '+x.brk+' min break · '+esc(x.job)+'</span></span><b>'+fh(entH(x))+'</b></div>';}).join('')+'</div>'+
 '<span class="ap-hint">Overtime counts after '+OT_WEEK+' hours a week.</span><button type="button" class="ap-btn ok lg" data-act="approve">'+ic('check',18)+'Approve week</button><button type="button" class="ap-btn dano" data-act="sheet" data-arg="sendback">Send back</button>';
 var ov='';if(st.sheet==='sendback')ov=sheet('<h2>Send back to '+esc(PEOPLE[p].n)+'</h2>'+field(uid(ctx,'why'),'Reason (needed)',st.why||'',{path:'why',live:'needwhy',ph:'e.g. Wednesday looks long, can you check?'})+'<span class="ap-hint">'+esc(PEOPLE[p].n)+' sees this on their phone.</span><div class="ap-btns"><button type="button" class="ap-btn dan" data-act="sendBack" data-need="why"'+(st.why?'':' disabled')+'>Send back</button><button type="button" class="ap-btn sec" data-act="close">Cancel</button></div>','Send back');
 return page(ctx,PEOPLE[p].full,h,{sub:'Week of '+dayLabel(w.week),overlay:ov});};
S.export=function(ctx){var st=ctx.st;var grp=st.grp||'person';var only=!!st.only;var ap=st.approved||{};
 var people=PKEYS.filter(function(p){return !only||ap[p];});
 var rows=[];if(grp==='person')people.forEach(function(p){var t=weekTotal(p);rows.push([PEOPLE[p].full,Math.min(t,OT_WEEK),Math.max(0,t-OT_WEEK)]);});
 else if(grp==='job'){var m={};people.forEach(function(p){WEEKS[p].days.forEach(function(x){m[x.job]=(m[x.job]||0)+entH(x);});});Object.keys(m).sort().forEach(function(j){rows.push([j,m[j],null]);});}
 else{var tt=0,oo=0;people.forEach(function(p){var t=weekTotal(p);tt+=Math.min(t,OT_WEEK);oo+=Math.max(0,t-OT_WEEK);});if(people.length)rows.push(['Week of 26 Oct',tt,oo]);}
 var tn=rows.reduce(function(s,r){return s+r[1];},0),to=rows.reduce(function(s,r){return s+(r[2]||0);},0);
 var cols=grp==='job'?'minmax(0,1fr) 70px':'minmax(0,1fr) 64px 64px';
 var tbl='<div class="ap-card" style="gap:0;padding:6px 14px"><div class="ap-tr h" style="grid-template-columns:'+cols+'"><span>Mon 26 Oct – Sun 1 Nov</span>'+(grp==='job'?'<span class="r">Hours</span>':'<span class="r">Normal</span><span class="r">Over</span>')+'</div>'+
 (rows.length?rows.map(function(r){return '<div class="ap-tr" style="grid-template-columns:'+cols+'"><b>'+esc(r[0])+'</b><span class="r">'+fh(r[1])+'</span>'+(grp==='job'?'':'<span class="r">'+fh(r[2])+'</span>')+'</div>';}).join('')+'<div class="ap-tr" style="grid-template-columns:'+cols+'"><b>Total</b><b class="r">'+fh(tn)+'</b>'+(grp==='job'?'':'<b class="r">'+fh(to)+'</b>')+'</div>':'<p class="ap-m" style="padding:10px 0">No signed-off weeks in this period yet. Sign them off first, or turn off "Only signed-off".</p>')+'</div>';
 var notSigned=PKEYS.filter(function(p){return !ap[p];}).length;
 var ex=(st.exports||[]).concat([['hours-19-oct.csv','Mon 26 Oct'],['hours-12-oct.pdf','Mon 19 Oct']]);
 var h='<div class="ap-f"><span class="ap-lb">Period</span><div class="ap-chips">'+['This week','Last week','Last 4 weeks','This month','Last month','Custom'].map(function(x){return chip(x,x==='Last week',x==='Last week'?'':'disabled title="Sample shows last week only"');}).join('')+'</div></div>'+
 '<div class="ap-f"><span class="ap-lb">Totals by</span><div class="ap-chips">'+[['person','Person'],['job','Job'],['week','Week']].map(function(x){return chip(x[1],grp===x[0],'data-act="set" data-arg="grp='+x[0]+'"');}).join('')+'</div></div>'+
 '<div class="ap-swrow"><button type="button" class="ap-tg" aria-pressed="'+only+'" aria-label="Only signed-off weeks" data-act="toggle" data-arg="only"></button><span><b style="font-size:15px">Only signed-off weeks</b><br><span class="ap-hint">'+(notSigned?notSigned+' week'+(notSigned>1?'s':'')+' in this period not signed off yet':'Every week in this period is signed off')+'</span></span></div>'+tbl+
 '<div class="ap-btns"><button type="button" class="ap-btn" data-act="doExport" data-arg="csv"'+(rows.length?'':' disabled')+'>Export CSV</button><button type="button" class="ap-btn sec" data-act="doExport" data-arg="pdf"'+(rows.length?'':' disabled')+'>Export PDF</button></div>'+
 '<div class="ap-card"><h2 class="ap-h">Earlier exports</h2>'+ex.map(function(x){return '<div class="ap-tr" style="grid-template-columns:minmax(0,1fr) auto auto"><b style="overflow-wrap:anywhere">'+esc(x[0])+'</b><span class="ap-m" style="font-size:13px">'+esc(x[1])+'</span><button type="button" class="ap-btn sec sm">Open</button></div>';}).join('')+'</div>';
 return page(ctx,'Hours & export',h);};
S.settings=function(ctx){var st=ctx.st;var owner=(st.role||'owner')==='owner';var dis=owner?'':'disabled';
 function q(label,key,opts,def){var v=st[key]||def;return '<div class="ap-f"><span class="ap-lb">'+label+'</span><div class="ap-chips">'+opts.map(function(o){return chip(o,v===o,owner?'data-act="set" data-arg="'+key+'='+o+'"':'disabled');}).join('')+'</div></div>';}
 var h=(owner?'':'<div class="ap-alert grey">'+ic('lock',20)+'<div><span>Only the owner can change these. You can see how things are set up.</span></div></div>')+
 '<div class="ap-card" style="gap:14px"><h2 class="ap-big" style="font-size:17px">Hours (timesheets)</h2>'+q('How staff log time','sMode',['Start and finish','Total hours','Clock in and out'],'Start and finish')+q('Breaks','sBrk',['Not tracked','Taken off automatically','Staff enter them'],'Taken off automatically')+
 ((st.sBrk||'Taken off automatically')==='Taken off automatically'?'<div class="ap-swrow"><input class="ap-in ap-num" style="width:90px;text-align:center" aria-label="Break minutes" id="'+uid(ctx,'bm')+'" value="'+esc(st.sBm||'30')+'" data-bind="sBm" '+dis+'><span>minutes taken off each day</span></div>':'')+
 q('Who signs off timesheets','sWho',['No one','Manager','Supervisor'],'Manager')+'<div class="ap-swrow"><button type="button" class="ap-tg" aria-pressed="'+(st.sJob!==false)+'" aria-label="Hours must be linked to a job" '+(owner?'data-act="toggleOff" data-arg="sJob"':'disabled')+'></button><span><b style="font-size:15px">Hours must be linked to a job</b><br><span class="ap-hint">Staff pick a job for every entry</span></span></div>'+
 '<div class="ap-swrow"><input class="ap-in ap-num" style="width:90px;text-align:center" aria-label="Overtime after hours a week" id="'+uid(ctx,'ot')+'" value="'+esc(st.sOt||'39')+'" data-bind="sOt" '+dis+'><span>Overtime after this many hours a week</span></div></div>'+
 '<div class="ap-card" style="gap:14px"><h2 class="ap-big" style="font-size:17px">Schedule</h2>'+q('Week starts on','sWk',['Monday','Sunday'],'Monday')+'<span class="ap-hint">Can\'t change once timesheets exist, as it would split weeks.</span></div>';
 return page(ctx,'Settings',h,{right:owner?'<span style="font-size:13px;padding-right:8px">Saves as you go</span>':''});};

/* ---------- admin (desktop web) ---------- */
function adminPage(ctx,crumb,inner,ov){return {body:'<header class="ap-adm"><b>Platform admin</b>'+(crumb?'<button type="button" class="ap-btn sm" style="background:transparent;border-color:#59636E;color:#E4E8EC" data-act="back">‹ '+crumb+'</button>':'<span class="x">Businesses</span>')+'<span class="x" style="margin-left:auto">admin@platform.example · Sign out</span></header><div class="ap-scroll"><div class="ap-wrap">'+inner+'</div></div>',overlay:ov||''};}
function bizList(st){var l=clone(BIZ);(st.newBiz||[]).forEach(function(b){l.push(b);});return l;}
function bizPeople(st,id){var base=clone(BIZPEOPLE[id]||[]);return base.concat((st.invited||{})[id]||[]);}
S.adminList=function(ctx){var st=ctx.st;var h='<h1 style="margin:0;font-size:26px">Businesses</h1><div class="ap-card" style="gap:0;padding:4px 18px">';
 bizList(st).forEach(function(b,i){var ppl=bizPeople(st,b.id).filter(function(p){return p.st!=='off'&&p.st!=='invited';});var own=null;bizPeople(st,b.id).forEach(function(p){if(p.role==='Owner'&&p.st!=='invited')own=p.n;});if(!own&&b.owner)own=b.owner;var cnt=b.people!=null?b.people:ppl.length;var mods=Object.keys(b.mods).filter(function(m){return b.mods[m];});
  h+='<button type="button" class="ap-row" style="border:0;border-top:'+(i?'1px solid var(--n-line)':'0')+';border-radius:0;padding:14px 0;flex-wrap:wrap;gap:6px 18px" data-act="go" data-arg="adminBiz" data-set="biz='+b.id+';tab=details"><span class="t" style="flex:1 1 220px"><b style="font-size:16px">'+esc(b.name)+'</b><span class="m">'+esc(b.tz)+' · '+esc(b.delivery)+'</span></span><span class="ap-m" style="font-size:14px">'+cnt+' '+(cnt===1?'person':'people')+(own?' · Owner: '+esc(own):'')+'</span>'+
  (own?'<span class="ap-chips" style="gap:6px">'+(mods.length?mods.map(function(m){return '<span class="ap-badge" style="background:#F0F2F4;color:#1F2328">'+m+'</span>';}).join(''):'<span class="ap-m">No modules on</span>')+'</span>':'<span class="ap-err" style="font-size:14px">'+ic('alert',16)+'No owner yet</span>')+'</button>';});
 h+='</div><form class="ap-card" style="gap:14px"><h2 style="margin:0;font-size:18px">Add a business</h2><div class="ap-g3">'+field(uid(ctx,'bn'),'Business name',st.bn||'',{path:'bn',ph:'e.g. Shannon Tiling'})+field(uid(ctx,'tz'),'Time zone','Europe/Dublin',{path:'btz'})+'<div class="ap-f"><span class="ap-lb">How they get the app</span><div class="ap-chips">'+['Shared app','Own app'].map(function(d){return chip(d,(st.bd||'Shared app')===d,'data-act="set" data-arg="bd='+d+'"');}).join('')+'</div></div></div>'+(st.bErr?'<span class="ap-err">'+ic('alert',14)+esc(st.bErr)+'</span>':'')+'<div><button type="button" class="ap-btn dk" data-act="addBiz">Add business</button></div></form>';
 return adminPage(ctx,'',h);};
S.adminBiz=function(ctx){var st=ctx.st;var bl=bizList(st);var b=bl[0];bl.forEach(function(x){if(x.id===st.biz)b=x;});var tab=st.tab||'details';
 var tabs=[['details','Details'],['branding','Branding'],['titles','Job titles'],['modules','Modules'],['people','People'],['history','History']];
 var h='<h1 style="margin:0;font-size:26px">'+esc(b.name)+'</h1><div class="ap-chips" role="tablist">'+tabs.map(function(t){return chip(t[1],tab===t[0],'role="tab" aria-selected="'+(tab===t[0])+'" data-act="set" data-arg="tab='+t[0]+'"','tab');}).join('')+'</div>';
 if(tab==='details')h+='<div class="ap-card" style="gap:14px"><div class="ap-g2">'+field(uid(ctx,'n'),'Business name',b.name,{path:'x.n'})+field(uid(ctx,'tz'),'Time zone',b.tz,{path:'x.tz'})+'</div><div class="ap-f"><span class="ap-lb">Business ID</span><code style="font-size:14px;color:#59636E;overflow-wrap:anywhere">3f2a9c1e-7b40-4d1a-9e2f-'+(b.id==='bw'?'8c6b5a4d3e21':b.id==='hb'?'1d0e7a90b5c4':'52a9e1c3f708')+'</code><span class="ap-hint">Used to lock an own-brand app to this business. Can\'t be changed.</span></div><div><button type="button" class="ap-btn dk">Save changes</button></div></div>';
 else if(tab==='branding'){var mk='main_'+b.id,ak='acc_'+b.id;var mainV=st[mk]!=null?st[mk]:b.main,accV=st[ak]!=null?st[ak]:b.accent;var rm=ratio(mainV,'#FFFFFF'),ra=ratio(accV,'#FFFFFF');
  function crow(id,label,val,key,r){var ok=r!=null&&r>=4.5;return '<div class="ap-f"><label for="'+uid(ctx,id)+'">'+label+'</label><div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><span style="width:44px;height:44px;border-radius:8px;border:1px solid var(--n-line);background:'+(r!=null?esc(val):'#fff')+';flex:none"></span><input class="ap-in'+(r!=null&&!ok?' bad':'')+'" style="max-width:150px;font-family:ui-monospace,monospace" id="'+uid(ctx,id)+'" data-bind-r="'+key+'" value="'+esc(val)+'" placeholder="#1F5F8B">'+(r==null?'<span class="ap-m">'+(val?'Use a colour like #1F5F8B':'Not set yet')+'</span>':(ok?'<span style="color:var(--n-ok);font-weight:600;font-size:14px;display:inline-flex;gap:4px;align-items:center">'+ic('check',15)+fh(r)+' : 1 with white text, good</span>':'<span class="ap-err" style="font-size:14px">'+ic('alert',15)+fh(r)+' : 1, too light</span>'))+'</div>'+(r!=null&&!ok?'<span class="ap-err" style="font-weight:500">White text on this colour is hard to read. Pick a darker shade (it needs 4.5 : 1).</span>':'')+'</div>';}
  var allOk=rm!=null&&rm>=4.5&&ra!=null&&ra>=4.5;var pm=rm!=null?mainV:'#59636E',pa=ra!=null?accV:'#59636E';
  h+='<div class="ap-cols" style="grid-template-columns:minmax(0,1.6fr) minmax(0,1fr)"><div class="ap-card" style="gap:14px"><div class="ap-f"><span class="ap-lb">Logo</span><div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">'+((b.logo||st['logo_'+b.id])?'<div class="ap-logo on-light" style="width:64px;height:64px;background:'+esc(pm)+'">'+initials(b.name)+'</div>':'<div style="width:64px;height:64px;border-radius:14px;border:1px dashed var(--n-muted);display:flex;align-items:center;justify-content:center;font-size:12px;color:#59636E">No logo</div>')+'<button type="button" class="ap-btn sec sm" data-act="set" data-arg="logo_'+b.id+'=true">Upload a '+((b.logo||st['logo_'+b.id])?'new ':'')+'logo</button><span class="ap-hint">PNG or JPG, square works best</span></div></div>'+
  crow('c1','Main colour',mainV,mk,rm)+crow('c2','Accent colour',accV,ak,ra)+field(uid(ctx,'pdf'),'Name on documents',b.pdf||'',{path:'pdf_'+b.id,ph:'e.g. '+b.name+' Ltd',hint:'Shown on quotes and other PDFs'})+
  '<div class="ap-btns" style="align-items:center"><button type="button" class="ap-btn dk" style="flex:0 0 auto" data-act="saveBranding"'+(allOk?'':' disabled')+'>Save branding</button>'+(allOk?'':'<span class="ap-m">Both colours need to pass before you can save.</span>')+'</div></div>'+
  '<div class="ap-card" style="gap:12px"><span class="ap-lb">Preview</span><div style="background:'+esc(pm)+';color:#fff;border-radius:10px;padding:12px 14px;font-weight:700">'+esc(b.name)+'</div><button type="button" class="ap-btn" style="background:'+esc(pm)+';border-color:'+esc(pm)+'">Main button</button><div class="ap-chips"><span class="ap-chip" style="background:'+esc(pm)+';border-color:'+esc(pm)+';color:#fff">Selected</span><span class="ap-chip">Not selected</span></div><div style="display:flex;gap:8px;align-items:center"><span class="ap-tag" style="background:'+esc(pa)+'">Today</span><span class="ap-cnt" style="background:'+esc(pa)+'">3</span><span class="ap-m">Accent</span></div></div></div>';}
 else if(tab==='titles'){h+='<div class="ap-card" style="gap:12px"><p class="ap-m" style="font-size:15px">These change the words people see, not what they can do. Leave blank to use the standard title.</p>'+[['Owner','Full access',''],['Manager','Runs the diary and sign-offs',b.id==='bw'?'Office manager':''],['Supervisor','Signs off their own crew',b.id==='bw'?'Lead fitter':b.id==='hb'?'Foreman':''],['Worker','Sees only their own jobs, no prices',b.id==='bw'?'Fitter':b.id==='hb'?'Operative':'']].map(function(r,i){return '<div class="ap-g2" style="align-items:center"><span><b>'+r[0]+'</b><br><span class="ap-hint">'+r[1]+'</span></span><input class="ap-in" aria-label="Job title for '+r[0]+'" id="'+uid(ctx,'jt'+i)+'" value="'+esc(r[2])+'" placeholder="'+r[0]+'"></div>';}).join('')+'<div><button type="button" class="ap-btn dk">Save job titles</button></div></div>';}
 else if(tab==='modules'){var mods=st['mods_'+b.id]||b.mods;var desc={Scheduling:'Week schedule, bookings, My jobs, job sheets',Flooring:'Enquiries, viewings, rooms, quotes and prices',Timesheets:'Hours, clock in and out, sign-offs, export'};
  Object.keys(desc).forEach(function(m){var on=!!mods[m];h+='<div class="ap-card"><div class="ap-swrow"><span style="flex:1"><b style="font-size:17px">'+m+'</b><br><span class="ap-m">'+desc[m]+'</span></span><button type="button" class="ap-tg" aria-pressed="'+on+'" aria-label="'+m+(on?' on':' off')+'" data-act="toggleMod" data-arg="'+m+'"></button></div>'+(m==='Timesheets'&&on?'<div style="border-top:1px solid var(--n-line);padding-top:10px;display:flex;flex-wrap:wrap;gap:12px 28px"><span class="ap-m">How staff log time: <b style="color:#1F2328">Start and finish</b></span><span class="ap-m">Who signs off: <b style="color:#1F2328">Manager</b></span><span class="ap-m">Overtime after: <b style="color:#1F2328">39 hours a week</b></span></div>':'')+'</div>';});
  h+='<div class="ap-card" style="opacity:.7"><div class="ap-swrow"><span style="flex:1"><b style="font-size:17px">Site reports</b><br><span class="ap-m">Not built yet</span></span><button type="button" class="ap-tg" aria-pressed="false" aria-label="Site reports, not built yet" disabled></button></div></div>';}
 else if(tab==='people'){var ppl=bizPeople(st,b.id);
  h+='<div class="ap-card" style="gap:0;padding:4px 18px">'+(ppl.length?ppl.map(function(p,i){var stt=p.st==='invited'?'<span style="color:#9A6700;font-weight:600">'+ic('wait',14)+' Invited '+esc(p.inv)+', not signed in yet</span>':p.st==='off'?'Deactivated '+esc(p.off):esc(p.st);return '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px 16px;padding:12px 0;border-top:'+(i?'1px solid var(--n-line)':'0')+(p.st==='off'?';opacity:.6':'')+'"><span style="flex:1 1 220px;min-width:0"><b>'+esc(p.n)+'</b><br><span class="ap-m" style="font-size:13px">'+esc(p.e)+'</span></span><span class="ap-badge" style="background:#F0F2F4;color:#1F2328;align-self:center">'+esc(p.role)+'</span><span class="ap-m" style="font-size:13px;flex:0 1 230px">'+stt+'</span>'+(p.st==='off'?'<button type="button" class="ap-btn sec sm">Reactivate</button>':(p.st==='invited'?'<button type="button" class="ap-btn sec sm" data-act="toast" data-arg="Invite sent again to '+esc(p.e)+'">Re-send invite</button>':'<button type="button" class="ap-btn sec sm">Change role</button>')+'<button type="button" class="ap-btn dano sm">Deactivate</button>')+'</div>';}).join(''):'<p class="ap-m" style="padding:14px 0">No one here yet. Invite the owner first, so they can run the business.</p>')+'</div>'+
  '<form class="ap-card" style="gap:12px"><h2 style="margin:0;font-size:18px">Invite someone</h2><div class="ap-g3">'+field(uid(ctx,'in'),'Name',st.inv_n||'',{path:'inv_n',ph:'Full name'})+field(uid(ctx,'ie'),'Email',st.inv_e||'',{path:'inv_e',type:'email',ph:'name@example.ie'})+'<div class="ap-f"><span class="ap-lb">Role</span><div class="ap-chips">'+['Owner','Manager','Fitter'].map(function(r){return chip(r,(st.inv_r||(ppl.length?'Fitter':'Owner'))===r,'data-act="set" data-arg="inv_r='+r+'"');}).join('')+'</div></div></div>'+(st.invErr?'<span class="ap-err">'+ic('alert',14)+esc(st.invErr)+'</span>':'')+'<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><button type="button" class="ap-btn dk" data-act="invite">Send invite</button><span class="ap-hint">They get an email with a link to set their password. A role change reaches their app within an hour.</span></div></form>';}
 else{var hist=(st.hist||[]).concat(HIST[b.id]||[]);h+='<div class="ap-card" style="gap:0;padding:4px 18px">'+hist.map(function(x,i){return '<div style="display:flex;flex-wrap:wrap;gap:4px 16px;padding:12px 0;border-top:'+(i?'1px solid var(--n-line)':'0')+'"><span class="ap-m" style="flex:0 0 150px;font-size:13px">'+esc(x[0])+'</span><span style="flex:1 1 300px"><b>'+esc(x[1])+'</b> '+esc(x[2])+(x[3]?'<br><span class="ap-m" style="font-size:13px">'+esc(x[3])+'</span>':'')+'</span></div>';}).join('')+'</div>';}
 return adminPage(ctx,'Businesses',h);};

/* ================= actions ================= */
var ACT={
 signin:function(st,a,inst){if(st.mode==='wrong'&&!st.err){st.err="That email and password don't match. Check them and try again.";return;}if(st.mode==='nosetup'){inst.stack.push('notsetup');return;}st.err=null;st.fresh=st.fresh;inst.stack=['home'];},
 setpw:function(st,a,inst){var p1=st.p1||'',p2=st.p2||'';if(p1.length<8){st.err='Use at least 8 letters or numbers.';return;}if(p1!==p2){st.err="The two passwords don't match.";return;}st.err=null;inst.stack=['home'];},
 saveEnq:function(st,a,inst){var picked=null;CUSTOMERS.forEach(function(c){if(c.id===st.cust)picked=c;});var nc=st.nc||{};
  var ok=(picked||(st.newCust&&nc.name&&(nc.phone||nc.email)))&&st.what;if(!ok){st.tried=true;return;}
  var c=picked||{name:nc.name,phone:nc.phone||'',email:nc.email||'',addr:nc.addr||''};var vw=(st.vday||'')+(st.vtime?', '+st.vtime:'');
  var n={id:'n'+((st.created||[]).length+1),cust:c.name,what:st.what,phone:c.phone,email:c.email,addr:st.addr||c.addr,src:st.src||'Phone call',when:'Today, 10:05',stage:vw?'viewing':'new',viewing:vw,details:st.details||''};
  st.created=(st.created||[]).concat([n]);st.enqId=n.id;st.tried=false;st.toast='Enquiry saved';inst.stack[inst.stack.length-1]='enq';},
 markLost:function(st){var id=st.enqId||'e5';st.stg=st.stg||{};st.stg[id]='lost';st.lostReason=st.why||'';st.sheet=null;st.toast='Moved to "Not going ahead"';},
 reopen:function(st){var id=st.enqId;st.stg=st.stg||{};var e=null;ENQ.concat(st.created||[]).forEach(function(x){if(x.id===id)e=x;});st.stg[id]=(e&&e.stage!=='lost')?e.stage:'new';st.toast='Reopened';},
 addJob:function(st){if(!st.nj)return;st.jobs=(st.jobs||[]).concat([st.nj]);st.nj='';},
 editRoom:function(st,a){st.roomErr='';if(a==='new'){st.edit='new';st.draft={name:'',l:'',w:'',a:'',ft:'',notes:''};}else{st.edit=a;st.draft=clone(st.rooms[+a]);}},
 saveRoom:function(st){var d=st.draft||{};if(!d.name){st.roomErr='Add a room name.';return;}if(!roomArea(d)){st.roomErr='Add the length and width, or the area.';return;}if(st.edit==='new')st.rooms.push(clone(d));else st.rooms[+st.edit]=clone(d);st.edit=null;st.draft=null;st.roomErr='';},
 removeRoom:function(st){st.rooms.splice(+st.edit,1);st.edit=null;st.draft=null;},
 addPhoto:function(st){st.photos.push({l:'New photo',w:1});st.uploadedNow=false;},
 retryUpload:function(st){if(st.mode==='offline'){st.toast='Still no signal. It will keep trying.';return;}st.photos.forEach(function(p){p.w=0;});st.uploadedNow=true;},
 bkJob:function(st,a){var bk=bkState(st);bk.job=a;if(!a)st.toast='Type the new job in the box that opens (not in this sample)';},
 bkWho:function(st,a){var bk=bkState(st);var i=bk.who.indexOf(a);if(i>=0)bk.who.splice(i,1);else bk.who.push(a);},
 saveBooking:function(st,a,inst){var bk=bkState(st);var x=mins(bk.start),z=mins(bk.end);if(!bk.job||x==null||z==null||z<=x||!bk.who.length){st.tried=true;return;}if(clashes(st,bk).length)return;
  var nb={id:'nb'+((st.added||[]).length+1),date:bk.date,start:bk.start,end:bk.end,who:bk.who.slice(),job:bk.job.split(' · ')[0],place:bk.place||'Address to follow',cust:bk.cust||'',phone:bk.phone||'',jk:'',isNew:true};
  if(bk.editing){st.removed=st.removed||{};st.removed[bk.editing]=true;}st.added=(st.added||[]).concat([nb]);st.stg=st.stg||{};if(st.bkInit==='work')st.stg[st.enqId||'e5']='booked';
  st.week=monday(bk.date);st.bk=null;st.tried=false;st.toast='Booking saved. '+bk.who.map(function(p){return PEOPLE[p].n;}).join(' and ')+' can see it now.';inst.stack=inst.stack.slice(0,-1);if(inst.stack[inst.stack.length-1]!=='schedule')inst.stack.push('schedule');},
 cancelBooking:function(st,a,inst){var bk=bkState(st);st.removed=st.removed||{};st.removed[bk.editing]=true;st.sheet=null;st.bk=null;st.toast='Booking cancelled';inst.stack.pop();if(!inst.stack.length)inst.stack=['schedule'];},
 shareQuote:function(st){st.qstatus='sent';st.sheet=null;st.stg=st.stg||{};st.stg.e5='quoted';st.toast='Saved on the job and marked as sent';},
 newVersion:function(st){st.qstatus='draft';st.qnum=(st.qnum||42)+1;st.toast='New draft made. The sent quote is kept.';},
 addQLine:function(st){st.qextra=(st.qextra||[]).concat([{k:'x'+((st.qextra||[]).length+1),item:'Skirting, refit',kind:'Other',qty:1,unit:'each',price:60}]);},
 addPrice:function(st){var np=st.np||{};var p=parseFloat(np.price);if(!np.name){st.pErr='Add a name.';return;}if(!(p>0)){st.pErr='Type a price, like 42.00.';return;}st.pl.push({id:'np'+st.pl.length,grp:np.grp||'Floors',name:np.name,unit:np.unit||'m²',price:r2(p)});st.np={};st.pErr='';st.toast='Added to your price list';},
 clockIn:function(st){st.clockIn='07:58';},
 clockOut:function(st){var ents=myEntries(st);ents.push(E(TODAY,st.clockIn||'08:22','16:52',30,'Oak floor, kitchen'));st.clockIn=null;st.toast='Clocked out. 8.0 hours added to today.';},
 sendWeek:function(st){st.wstatus='sent';st.sheet=null;st.toast='Week sent in';},
 saveEntry:function(st,a,inst){var d=st.te||{};var x=mins(d.start),z=mins(d.end);if(x==null||z==null){st.teErr='Type the start and finish like 08:00.';return;}if(z<=x){st.teErr='Finish must be after start.';return;}var k=st.day||TODAY;if(k>TODAY){st.teErr="You can't log time for a day that hasn't happened yet.";return;}
  var clash=myEntries(st).some(function(e){return e.date===k&&mins(e.start)<z&&x<mins(e.end);});if(clash){st.teErr='This overlaps time you already logged that day.';return;}
  myEntries(st).push(E(k,d.start,d.end,+d.brk||0,d.job,d.type));st.te=null;st.teErr='';st.toast='Time saved';inst.stack.pop();},
 approve:function(st,a,inst){st.approved=st.approved||{};st.approved[st.rv||'dara']=true;st.toast='Week approved';inst.stack.pop();},
 sendBack:function(st,a,inst){if(!st.why)return;st.sentBack=st.sentBack||{};st.sentBack[st.rv||'dara']=st.why;st.why='';st.sheet=null;st.toast='Sent back';inst.stack.pop();},
 doExport:function(st,a){var name='hours-26-oct.'+a;st.exports=[[name,'Today']].concat(st.exports||[]);st.toast=name+' saved. Open it from Earlier exports.';},
 toggleOff:function(st,a){st[a]=(st[a]===false);},
 addBiz:function(st){if(!st.bn){st.bErr='Add the business name.';return;}st.newBiz=(st.newBiz||[]).concat([{id:'nb'+((st.newBiz||[]).length+1),name:st.bn,tz:'Europe/Dublin',delivery:st.bd||'Shared app',mods:{Scheduling:false,Flooring:false,Timesheets:false},main:'',accent:'',logo:false,pdf:'',people:0}]);st.bn='';st.bErr='';st.toast='Business added. Next: invite the owner.';},
 toggleMod:function(st,a){var bl=bizList(st);var b=bl[0];bl.forEach(function(x){if(x.id===st.biz)b=x;});var k='mods_'+b.id;st[k]=st[k]||clone(b.mods);st[k][a]=!st[k][a];st.hist=[['Just now','You',(st[k][a]?'switched on ':'switched off ')+a,'']].concat(st.hist||[]);},
 saveBranding:function(st){st.hist=[['Just now','You','updated the branding','']].concat(st.hist||[]);st.toast='Branding saved. Apps pick it up next time they open.';},
 invite:function(st){var id=st.biz;if(!st.inv_n||!/^\S+@\S+\.\S+$/.test(st.inv_e||'')){st.invErr='Add a name and a valid email.';return;}var ppl=bizPeople(st,id);st.invited=st.invited||{};st.invited[id]=(st.invited[id]||[]).concat([{n:st.inv_n,e:st.inv_e,role:st.inv_r||(ppl.length?'Fitter':'Owner'),st:'invited',inv:'today'}]);st.hist=[['Just now','You','invited '+st.inv_n+' as '+(st.inv_r||(ppl.length?'Fitter':'Owner')),'']].concat(st.hist||[]);st.inv_n='';st.inv_e='';st.invErr='';st.toast='Invite sent';},
 toast:function(st,a){st.toast=a;},
 closeScrim:function(st,a,inst,dev,el,ev){if(ev&&ev.target===el)st.sheet=null;else return 'skip';}
};
var LIVE={
 area:function(st,dev){var out=dev.querySelector('[data-out="area"]');if(out)out.textContent='Area: '+m2(roomArea(st.draft||{}));},
 tsdur:function(st,dev){var out=dev.querySelector('[data-out="tsdur"]');var d=st.te||{};var hh=entH({start:d.start,end:d.end,brk:d.brk});if(out)out.textContent=hh?"That's "+fh(hh)+' hours of work.':'Type a start and finish, like 08:00.';},
 needwhy:function(st,dev){var b=dev.querySelector('[data-need="why"]');if(b)b.disabled=!st.why;}
};

/* ================= devices ================= */

function st(s,dev,t,how,note,init,stack){return {s:s,dev:dev,t:t,how:how,note:note,init:init||{},stack:stack};}
var FLOWS=[
 /* ---- new user ---- */
 {id:'first-signin',title:'First sign-in',summary:'Replaces the owner being set up by hand in the database. The owner gets an invite email, picks a password, and lands on a home screen that tells him what to do first.',starts:['Invite email','Set password'],next:'first-prices',steps:[
  st('setpw','phone','Pick a password','Pat taps the link in the invite email the platform team sent.','Only two fields. Rules are shown before he types, problems after he taps Save. The link is good for 24 hours.',{role:'owner'}),
  st('home','phone','Empty home with a getting-started list','Right after saving the password.','No counts or badges yet. A three-item list points at the first jobs to do; it goes away once each one is done.',{role:'owner',fresh:true})]},
 {id:'first-prices',title:'Set up prices and quote details',summary:'Replaces typing prices into every quote. The owner fills in his price list once, plus the details printed on every quote.',starts:['Home','Getting started','Add your prices'],next:'first-enquiry',steps:[
  st('prices','tablet','Empty price list','From "Add your prices" on Home, or the Prices tile.','Owner only, and the bar says so. The empty state explains what the list is for. The add form sits beside it so the first price takes one go.',{fresh:true},['home','prices'])]},
 {id:'first-enquiry',title:'Log the first enquiry',summary:'Replaces a note on the wall planner. One screen saves the customer, what they want and the viewing time together.',starts:['Home','Enquiries'],next:'first-viewing',steps:[
  st('enquiries','tablet','No enquiries yet','First time he opens Enquiries.','Empty state with one action. The Open/All filter stays in place so the layout doesn\'t jump later.',{fresh:true},['home','enquiries']),
  st('newenq','tablet','New enquiry, blank','Taps "+ New" or "+ New enquiry".','No customers exist yet, so search is skipped and "New customer" is the obvious next tap. Tap Save to see problems listed in plain English above the button.',{fresh:true,newCust:true},['enquiries','newenq']),
  st('enq','tablet','The first enquiry','After Save.','Stage badge, how they got in touch, and the next step. With a viewing time set, it shows "Start the viewing".',{fresh:true,enqId:'n1',created:[{id:'n1',cust:'Aoife Kelly',what:'Carpet, 3 bedrooms',phone:'087 214 5590',email:'',addr:'22 Willow Grove, Naas',src:'Phone call',when:'Today, 10:05',stage:'viewing',viewing:'Thu 5 Nov, 11:00',details:''}]},['enquiries','enq'])]},
 {id:'first-viewing',title:'First viewing',summary:'Replaces measurements on the back of an envelope. Rooms, sizes and photos are kept with the job and reach the fitter\'s job sheet.',starts:['Enquiry','Start the viewing'],next:'first-booking',steps:[
  st('viewing','tablet','Empty viewing','Taps "Start the viewing" at the house.','Rooms and photos sit side by side on the tablet. Each empty area says what goes there.',{fresh:true,enqId:'n1',created:[{id:'n1',cust:'Aoife Kelly',what:'Carpet, 3 bedrooms',phone:'087 214 5590',email:'',addr:'22 Willow Grove, Naas',src:'Phone call',when:'Today, 10:05',stage:'viewing',viewing:'Thu 5 Nov, 11:00',details:''}]},['enq','viewing']),
  st('viewing','tablet','Adding the first room','Taps "+ Add room".','Length and width, or area for odd shapes. The area updates as he types. Floor types are quick-pick chips.',{fresh:true,enqId:'n1',created:[{id:'n1',cust:'Aoife Kelly',what:'Carpet, 3 bedrooms',phone:'087 214 5590',email:'',addr:'22 Willow Grove, Naas',src:'Phone call',when:'Today, 10:05',stage:'viewing',viewing:'Thu 5 Nov, 11:00',details:''}],edit:'new',draft:{name:'Front bedroom',l:'4.1',w:'3.6',a:'',ft:'Carpet',notes:''}},['enq','viewing'])]},
 {id:'first-booking',title:'Book the first job',summary:'Replaces the wall planner and the evening texts. Once a job is booked, the fitter sees it on his phone.',starts:['Home','Schedule'],next:'first-fitter',steps:[
  st('schedule','tablet','Empty week','First time he opens the Schedule.','Every day shows "Nothing booked" and a "+ Add" button. A short note explains that fitters see bookings straight away.',{fresh:true},['home','schedule']),
  st('booking','tablet','Booking form','Taps "+ Add" on a day.','Job, day, start, finish and who\'s going. Save stays available because nothing clashes yet.',{fresh:true,bkInit:'new',bkDay:'2026-11-05',bk:{job:'Carpet, 3 bedrooms · Aoife Kelly',place:'22 Willow Grove, Naas',cust:'Aoife Kelly',phone:'087 214 5590',date:'2026-11-05',start:'09:00',end:'15:00',who:['sean'],notes:'',editing:null,_for:'new|2026-11-05'}},['schedule','booking'])]},
 {id:'first-fitter',title:'Fitter\'s first day',summary:'Replaces the evening text. Seán sets a password from his invite, sees today\'s job on Home, and opens the job sheet. It has no prices.',starts:['Invite email','Set password'],next:'first-hours',steps:[
  st('setpw','phone','Pick a password','Seán taps the invite link on his phone.','Same screen as the owner\'s. Only the name changes.',{role:'fitter'}),
  st('home','phone','Fitter home','Right after saving.','Today\'s job sits at the top with one button. The fitter has fewer tiles: My jobs, My hours, Settings.',{role:'fitter',fresh:true,freshBookings:['b21']}),
  st('jobsheet','phone','Job sheet','Taps "Open job sheet".','Address with maps, customer with a call button, notes, rooms and photos. No prices anywhere, and the data rules stop prices reaching the phone at all.',{role:'fitter',fresh:true,freshBookings:['b21'],bk:'b21'},['home','jobsheet'])]},
 {id:'first-hours',title:'First week of timesheets',summary:'Replaces paper timesheets. A worker clocks in, or types start and finish, and sends the week in on Friday.',starts:['Home','My hours'],next:'first-business',steps:[
  st('hours','phone','Empty week','First time he opens My hours.','Nothing logged yet, so the big button is "Clock in". "Send in my week" stays off until there\'s time to send.',{fresh:true,role:'fitter',clockIn:null},['home','hours']),
  st('tsentry','phone','Add time by hand','From a day, taps "+ Add time".','Start, finish and break, with the hours worked out as he types. The setting decides the entry method, so "Total hours" is off here.',{fresh:true,role:'fitter',day:'2026-11-02',te:{start:'08:00',end:'16:30',brk:'30',job:'Laminate, 2 bedrooms',type:'Fitting'}},['hours','tsday','tsentry'])]},
 {id:'first-business',title:'Set up a new business',summary:'For the platform team. Replaces editing the database by hand: add the business, set its colours, then invite the owner.',starts:['Admin','Businesses'],next:'',steps:[
  st('adminList','desktop','Add a business','The team signs a new client.','The new business shows a red "No owner yet" until someone is invited.',{bn:'Shannon Tiling'}),
  st('adminBiz','desktop','Branding with nothing set','Opens the new business, Branding tab.','Both colours start empty, so Save is off. The preview uses grey until real colours are typed.',{biz:'ce',tab:'branding'},['adminList','adminBiz']),
  st('adminBiz','desktop','Invite the owner','People tab.','With no one there yet, the role defaults to Owner. The invite email opens "Set password" (see First sign-in).',{biz:'ce',tab:'people',inv_n:'Brendan Cullen',inv_e:'brendan@corrib.example'},['adminList','adminBiz'])]},
 /* ---- returning ---- */
 {id:'check-week',title:'Check the week',summary:'The owner\'s first look of the day on his phone: what\'s on, who is where, and anything new.',starts:['Home'],next:'enquiry-to-viewing',steps:[
  st('home','phone','Owner home','Opens the app in the morning.','Counts show only where something needs him: new enquiries and timesheets to sign off.',{role:'owner'}),
  st('schedule','phone','The week on a phone','Taps Schedule.','Days stack on the phone. Person chips filter to one fitter. Today has a heavier border and a "Today" tag, not colour alone.',{},['home','schedule'])]},
 {id:'enquiry-to-viewing',title:'Enquiry to viewing',summary:'A walk-in customer becomes an enquiry, gets a viewing, and is measured, all on the tablet.',starts:['Home','Enquiries'],next:'quote',steps:[
  st('enquiries','tablet','Enquiries by stage','Opens Enquiries.','Grouped by what happens next. Counts are highlighted only where he has to act (New, Measured). "Not going ahead" is hidden under Open.',{},['home','enquiries']),
  st('newenq','tablet','Find an existing customer','Taps "+ New" and types "byr".','Search matches name, phone digits or email. Picking a customer fills the site address hint.',{q:'byr'},['enquiries','newenq']),
  st('enq','tablet','Enquiry detail','Taps Orla Byrne.','Summary and customer on the left; viewing and next step on the right. "Make a quote" leads once the rooms are measured.',{enqId:'e5'},['enquiries','enq']),
  st('viewing','tablet','Viewing with photos still uploading','Taps "Open viewing (3 rooms)".','Tap a room to edit it in place. Two photos are waiting for signal; they look faded and carry a "Waiting" tag.',{enqId:'e5'},['enq','viewing'])]},
 {id:'quote',title:'Quote and share',summary:'Replaces a quote typed up in the evening. Lines come from the measured rooms and the price list. The PDF is saved on the job and shared from the phone.',starts:['Enquiry','Make a quote'],next:'book-work',steps:[
  st('quote','tablet','Draft quote','Taps "Make a quote" on a measured enquiry.','Owner only. Prices can be changed per line; VAT is a choice per quote. Totals update when a price changes.',{enqId:'e5'},['enq','quote']),
  st('quote','tablet','Make PDF and share','Taps "Make PDF and share".','Shows the A4 quote, then the share options. Sending saves the PDF on the job, for the owner only.',{enqId:'e5',sheet:'share'},['enq','quote']),
  st('quote','tablet','Sent','After sharing on WhatsApp.','A sent quote is locked. He records the answer, or makes a new version.',{enqId:'e5',qstatus:'sent'},['enq','quote'])]},
 {id:'book-work',title:'Book the work',summary:'The clash check that replaces "I think Seán is free Tuesday". The database refuses double-bookings; the form explains them first.',starts:['Enquiry','Book the work'],next:'fitter-day',steps:[
  st('booking','tablet','Clash warning','Taps "Book the work" for Orla Byrne.','Seán already has a morning job, so his chip turns red and Save is off. Tap Seán to take him off, or change the times.',{enqId:'e5',bkInit:'work'},['enq','booking']),
  st('schedule','tablet','Back on the schedule','After saving.','The new booking is highlighted, and a message confirms who can now see it.',{week:'2026-11-09',added:[{id:'nb1',date:'2026-11-10',start:'08:30',end:'16:30',who:['ciara'],job:'Oak floor, kitchen and dining',place:'6 Rathmore Road, Naas',cust:'Orla Byrne',phone:'087 990 4412',jk:'',isNew:true}],toast:'Booking saved. Ciara can see it now.'},['home','schedule'])]},
 {id:'fitter-day',title:'Fitter\'s day',summary:'Seán\'s day on his phone: the next two weeks, today\'s job sheet, and photos from the viewing.',starts:['Home'],next:'log-hours',steps:[
  st('home','phone','Fitter home','Opens the app before leaving the house.','Today\'s job and one button. Nothing else competes with it.',{role:'fitter'}),
  st('myjobs','phone','My jobs','Taps My jobs.','Next two weeks, grouped by day. Each job shows times, what it is and who else is going.',{role:'fitter'},['home','myjobs']),
  st('jobsheet','phone','Job sheet','Taps today\'s job.','Everything for the house in one scroll. Photos open full screen.',{role:'fitter',bk:'b21'},['myjobs','jobsheet']),
  st('jobsheet','phone','Photo full screen','Taps a photo.','Dark viewer with large previous, next and close buttons.',{role:'fitter',bk:'b21',sheet:'photo',phI:'0'},['myjobs','jobsheet'])]},
 {id:'log-hours',title:'Log hours and send the week',summary:'Clock in and out, check each day, and send the week in. The office sees it straight away.',starts:['Home','My hours'],next:'signoff-export',steps:[
  st('hours','phone','My hours, clocked in','Opens My hours mid-morning.','Clocked in with the job named. Days that haven\'t happened can\'t be opened.',{role:'fitter'},['home','hours']),
  st('tsday','phone','A day\'s entries','Taps Monday.','Each entry with times, break and job. "+ Add time" for anything missed.',{role:'fitter',day:'2026-11-02'},['hours','tsday']),
  st('hours','phone','Send in the week','Taps "Send in my week".','Confirms the total and warns if he\'s still clocked in.',{role:'fitter',sheet:'send'},['home','hours'])]},
 {id:'signoff-export',title:'Sign off and export hours',summary:'Replaces adding up paper timesheets. The manager approves each week, then exports totals for payroll.',starts:['Home','Sign-offs'],next:'settings',steps:[
  st('signoffs','phone','Weeks waiting','Opens Sign-offs on Monday.','Overtime shows as a clock icon and a different colour, so it isn\'t colour alone.',{},['home','signoffs']),
  st('review','phone','Week review','Taps Dara Quinn.','Totals split into normal and overtime. Sending back needs a reason, which the worker sees.',{rv:'dara'},['signoffs','review']),
  st('export','phone','Hours and export','Opens Hours & export.','Totals by person, job or week. "Only signed-off weeks" leaves out anything not approved yet.',{},['home','export'])]},
 {id:'settings',title:'Change how hours work',summary:'Each business decides how its timesheets work, without asking us.',starts:['Home','Settings'],next:'look-after-business',steps:[
  st('settings','phone','Owner settings','Taps Settings.','Choice chips and switches, grouped by feature. Changes save as he goes and reach every phone.',{role:'owner'},['home','settings'])]},
 {id:'look-after-business',title:'Look after a business',summary:'For the platform team: change a client\'s colours, switch modules, manage people and see who changed what.',starts:['Admin','Businesses'],next:'',steps:[
  st('adminList','desktop','Businesses','Opens the admin area.','One row per business, with a warning where something is missing.',{}),
  st('adminBiz','desktop','Branding with a live check','Branding tab, accent changed to a lighter orange.','Each colour shows its contrast with white text as you type. Save stays off until both pass.',{biz:'bw',tab:'branding',acc_bw:'#D9772F'},['adminList','adminBiz']),
  st('adminBiz','desktop','Modules','Modules tab.','Each module has a switch, and Timesheets lists its settings once it\'s on.',{biz:'bw',tab:'modules'},['adminList','adminBiz']),
  st('adminBiz','desktop','People','People tab.','Invited people who haven\'t signed in stand out, with a button to send the invite again.',{biz:'bw',tab:'people'},['adminList','adminBiz']),
  st('adminBiz','desktop','History','History tab.','Every admin action, with what it was before and after.',{biz:'bw',tab:'history'},['adminList','adminBiz'])]},
 /* ---- states ---- */
 {id:'states-signin',states:true,title:'Sign-in states',summary:'Every way signing in can go wrong, said plainly.',starts:['Sign in'],next:'states-enquiries',steps:[
  st('signin','phone','Wrong password','Email and password don\'t match.','The message says what happened and what to try. It never says which of the two was wrong.',{mode:'wrong',err:"That email and password don't match. Check them and try again.",pw:'password1'}),
  st('notsetup','phone','Account not set up','Signed in, but no business is attached.','Only one way out: Sign out.',{}),
  st('setpw','phone','Invite link expired','The link is more than 24 hours old.','Says what to do next and that the account is safe.',{mode:'expired',role:'fitter'})]},
 {id:'states-enquiries',states:true,title:'Enquiries states',summary:'Loading, failed, empty and "show all" for the Enquiries list.',starts:['Home','Enquiries'],next:'states-viewing',steps:[
  st('enquiries','tablet','Loading','First open, or a slow connection.','Grey placeholder cards in the shape of the real rows.',{mode:'loading'},['home','enquiries']),
  st('enquiries','tablet','Couldn\'t load','No connection on first open.','Plain-English reason, a "Try again" button, and a promise that nothing saved is lost.',{mode:'error'},['home','enquiries']),
  st('enquiries','tablet','All, including not going ahead','Taps "All".','Lost enquiries return in their own group with the reason given.',{filter:'all'},['home','enquiries'])]},
 {id:'states-viewing',states:true,title:'Viewing photo states',summary:'What happens to photos taken at a house with no signal.',starts:['Enquiry','Open viewing'],next:'states-booking',steps:[
  st('viewing','tablet','No signal, photos waiting','Photos taken with no signal.','Faded tiles with a "Waiting" tag. The app keeps trying by itself; "Try again now" is there for impatience.',{enqId:'e5',mode:'offline'},['enq','viewing']),
  st('viewing','tablet','Back online, all uploaded','Signal returns, or "Try again now" works.','Tiles go to full strength and a short success note shows.',{enqId:'e5',uploadedNow:true,photos:[{l:'Kitchen',w:0},{l:'Kitchen',w:0},{l:'Dining',w:0},{l:'Doorway',w:0},{l:'Utility',w:0},{l:'Utility',w:0}]},['enq','viewing'])]},
 {id:'states-booking',states:true,title:'Booking states',summary:'Problems the booking form catches before the database does.',starts:['Schedule','Booking'],next:'states-schedule',steps:[
  st('booking','tablet','Finish before start','Times typed the wrong way round.','Listed under the form once Save is tapped.',{bkInit:'new',bkDay:'2026-11-12',tried:true,bk:{job:'Tiles, porch · Mark Doyle',place:'11 Moat View, Clane',cust:'Mark Doyle',phone:'087 551 2093',date:'2026-11-12',start:'14:00',end:'09:00',who:['dara'],notes:'',editing:null,_for:'new|2026-11-12'}},['schedule','booking']),
  st('booking','tablet','Saving','Save tapped on a slow connection.','The button says "Saving…" and can\'t be tapped twice.',{bkInit:'new',bkDay:'2026-11-12',mode:'saving',bk:{job:'Tiles, porch · Mark Doyle',place:'11 Moat View, Clane',cust:'Mark Doyle',phone:'087 551 2093',date:'2026-11-12',start:'09:00',end:'13:00',who:['dara'],notes:'',editing:null,_for:'new|2026-11-12'}},['schedule','booking']),
  st('booking','tablet','Cancel a booking','Opens an existing booking and taps "Cancel this booking".','Asks first, and names whose phones it comes off.',{bkInit:'b22',sheet:'cancelBk'},['schedule','booking'])]},
 {id:'states-schedule',states:true,title:'Schedule states',summary:'Loading, offline, and an empty week.',starts:['Home','Schedule'],next:'states-jobsheet',steps:[
  st('schedule','phone','Loading','Opening the schedule.','Placeholders keep the week navigation in place.',{mode:'loading'},['home','schedule']),
  st('schedule','phone','Offline','No signal.','Shows the last copy and when it was saved. "Live" becomes "Offline" with an icon.',{mode:'offline'},['home','schedule']),
  st('schedule','phone','Quiet week','A week with few bookings.','Each day says "Nothing booked", so nobody wonders whether it loaded.',{week:'2026-11-16'},['home','schedule'])]},
 {id:'states-jobsheet',states:true,title:'Job sheet states',summary:'What a fitter sees when the job sheet can\'t be shown in full.',starts:['My jobs','Job sheet'],next:'states-hours',steps:[
  st('jobsheet','phone','Loading','Opening a job.','Title and day show straight away; the rest fills in.',{role:'fitter',bk:'b21',mode:'loading'},['myjobs','jobsheet']),
  st('jobsheet','phone','No photos','No photos were taken at the viewing.','Says so, rather than showing an empty box.',{role:'fitter',bk:'b21',mode:'nophotos'},['myjobs','jobsheet']),
  st('jobsheet','phone','Couldn\'t load','No connection and nothing saved on the phone.','The same plain-English message as everywhere else.',{role:'fitter',bk:'b21',mode:'error'},['myjobs','jobsheet']),
  st('myjobs','phone','No jobs booked','A new fitter with nothing booked.','Explains where jobs will come from.',{role:'fitter',fresh:true},['home','myjobs'])]},
 {id:'states-hours',states:true,title:'Timesheet states',summary:'A week after it has been sent in.',starts:['Home','My hours'],next:'states-settings',steps:[
  st('hours','phone','Waiting for sign-off','After "Send in my week".','Status badge with words. Entries can no longer be changed by the worker.',{role:'fitter',wstatus:'sent',clockIn:null},['home','hours']),
  st('hours','phone','Sent back','The manager sent it back.','The manager\'s reason sits at the top, and the send button returns.',{role:'fitter',wstatus:'back',clockIn:null},['home','hours']),
  st('hours','phone','Signed off','The manager approved the week.','Locked, with who signed it off and when.',{role:'fitter',wstatus:'approved',clockIn:null},['home','hours'])]},
 {id:'states-settings',states:true,title:'Settings, read only',summary:'Staff can see how things are set up but can\'t change them.',starts:['Home','Settings'],next:'states-admin',steps:[
  st('settings','phone','Fitter view','A fitter opens Settings.','Same layout with controls switched off, and a note saying only the owner can change them.',{role:'fitter'},['home','settings'])]},
 {id:'states-admin',states:true,title:'Admin states',summary:'Problems the admin area flags.',starts:['Admin','Businesses'],next:'',steps:[
  st('adminBiz','desktop','Colour too light','An accent that fails the contrast check.','Says why, how much it needs, and keeps Save off.',{biz:'bw',tab:'branding',acc_bw:'#E89A5C'},['adminList','adminBiz']),
  st('adminBiz','desktop','No one invited yet','A new business with no people.','Explains that the owner goes first, and the role defaults to Owner.',{biz:'ce',tab:'people'},['adminList','adminBiz'])]}
];
var JOURNEYS=[
 {id:'new',label:'New user',desc:'For someone opening the app for the first time: every first-use screen, the first enquiry through to the fitter\'s job sheet, then setting up timesheets and new businesses. No history, no counts.',flows:['first-signin','first-prices','first-enquiry','first-viewing','first-booking','first-fitter','first-hours','first-business']},
 {id:'ret',label:'Returning user',desc:'For the owner, fitters and the platform team once the app is in daily use, in the order the day runs: check the week, take enquiries, quote, book, fit, log hours, sign off.',flows:['check-week','enquiry-to-viewing','quote','book-work','fitter-day','log-hours','signoff-export','settings','look-after-business']},
 {id:'states',label:'States and edge cases',desc:'For building and testing: loading, empty, failed, offline, restored and read-only states, one flow per screen.',flows:['states-signin','states-enquiries','states-viewing','states-booking','states-schedule','states-jobsheet','states-hours','states-settings','states-admin']}
];
var PLANNED=['multi-day bookings and drag-to-move','job statuses (in progress, complete, paid)','push notifications and the evening "tomorrow\'s jobs" message','fitter completion photos and "mark complete"','payments and income reports','viewings on the schedule (open question)','site reports for construction clients'];

var JR=(function(){
/* ===== Job records — product screens, shown with a placeholder property-maintenance business (today is Tue 20 Oct 2026) ===== */
var TODAY='2026-10-20';
var CFG={key:'jr',time:'09:41',todayShort:'Tue 20 Oct',url:'app.example/jobs',
 guide:{colourNote:'Placeholder colours until we have the client\'s logo from his website. The second theme shows the same screens in another business\'s colours, because this is one product used by many businesses.',
  pills:[['To do','grey'],['In progress','amber','clock'],['Completed','green','check'],['Extra work','red','flag'],['Added to invoice','green','check'],['Before','grey','cam'],['Progress','blue','cam'],['Completion','green','cam']],
  patterns:['<b>One record per job:</b> customer, address, instructions, who\'s on it, photos, a dated updates feed and extra work, all on one page. It replaces the WhatsApp group.','<b>Navigation:</b> the jobs list is home. Tap a job for its page; post an update or extra work from buttons at the bottom of the page. Back arrow in the bar. No tab bar.','<b>Photos have a stage:</b> Before, Progress or Completion, picked when they\'re added. The job page filters photos by stage.','<b>Extra work stands out:</b> it has its own section and a red tag on the job until the owner or manager ticks "Added to invoice". There are no prices anywhere.','<b>Who can do what:</b> the owner and manager create jobs, assign people, change instructions and mark jobs completed. Workers see the jobs they\'re on and post updates, photos and extra work.','<b>Nothing is lost:</b> everything is stored online, so a new phone shows the full history after signing in. Photos taken with no signal wait on the phone and upload by themselves.'],
  copy:['Write from the user\'s side: "Post update", "Log extra work", "Mark as completed".','Every update shows who posted it and when, like "Adam · Tue 20 Oct, 10:12".']}};
var BRANDS={
 demo:{id:'demo',label:'Demo business',name:'Demo Property Care',init:'DP',main:'#24527A',mainDk:'#1B3F5E',accent:'#B4432A',tint:'#E6EEF5',logoR:'14px'},
 alt:{id:'alt',label:'Another business',name:'Riverside Renovations',init:'RR',main:'#3E5C2B',mainDk:'#2F4720',accent:'#8A3B8F',tint:'#EAF0E4',logoR:'28px'}};
var PEOPLE={paul:{n:'Paul',full:'Paul Walsh',role:'owner',title:'Owner'},gary:{n:'Gary',full:'Gary Nolan',role:'manager',title:'Manager'},adam:{n:'Adam',full:'Adam Byrne',role:'worker',title:'Worker'},kasia:{n:'Kasia',full:'Kasia Nowak',role:'worker',title:'Worker'},dean:{n:'Dean',full:'Dean Fox',role:'worker',title:'Worker'}};
var WORKERS=['adam','kasia','dean'];var ASSIGNABLE=['gary','adam','kasia','dean'];
var STATUS={todo:['To do','grey',''],progress:['In progress','amber','clock'],done:['Completed','green','check']};
function P(l,stage,who,at){return {l:l,stage:stage,who:who,at:at};}
var JOBS=[
 {id:'j1',title:'Bathroom renovation',cust:'Mary Collins',phone:'087 412 6610',addr:'14 Main Street, Swords',status:'progress',start:'2026-10-13',people:['gary','adam','kasia'],created:'2026-10-12',by:'paul',
  instr:'Full bathroom: strip out, new shower enclosure, tiling floor to ceiling, new vanity and toilet. Customer has chosen the grey 60×30 tiles (in the garage). Water off at the stopcock under the kitchen sink. Mary works from home, keep the hall clear.',
  photos:[P('Old bath','before','paul','2026-10-12 17:05'),P('Old tiles','before','paul','2026-10-12 17:06'),P('Window side','before','paul','2026-10-12 17:06')]},
 {id:'j2',title:'Leaking shower tray, reseal and regrout',cust:'Tom Hennessy',phone:'086 233 9014',addr:'3 Cedar Grove, Malahide',status:'todo',start:'2026-10-22',people:['dean'],created:'2026-10-19',by:'gary',instr:'Water coming through the kitchen ceiling under the en-suite. Check the tray seal and the waste first. Customer away Thursday, key in the safe (code with Gary).',photos:[P('Ceiling stain','before','gary','2026-10-19 15:40')]},
 {id:'j3',title:'Paint hall, stairs and landing',cust:'Orla Kenny',phone:'085 778 0213',addr:'27 The Avenue, Portmarnock',status:'progress',start:'2026-10-19',people:['kasia'],created:'2026-10-15',by:'paul',instr:'Walls in "Mist Grey" matt, woodwork in white satin. Paint is on site. Fill the crack above the front door first.',photos:[P('Hall','before','paul','2026-10-15 12:20')]},
 {id:'j4',title:'Replace kitchen sink tap',cust:'Declan Ward',phone:'087 901 4472',addr:'9 Seafield Road, Clontarf',status:'todo',start:'',people:[],created:'2026-10-20',by:'paul',instr:'Customer is buying the tap. Fit when it arrives.',photos:[]},
 {id:'j5',title:'Bathroom renovation',cust:'Brian and Ann Moore',phone:'086 551 3029',addr:'41 Forest Park, Swords',status:'done',start:'2026-07-21',end:'2026-08-01',people:['gary','adam'],created:'2026-07-15',by:'paul',instr:'Walk-in shower, tiled floor, wall-hung vanity.',photos:[P('Old bathroom','before','paul','2026-07-15 10:00'),P('Tiling','progress','adam','2026-07-27 13:10'),P('Finished shower','completion','gary','2026-08-01 16:20'),P('Finished vanity','completion','gary','2026-08-01 16:21')]},
 {id:'j6',title:'Ensuite bathroom refit',cust:'Siobhán Daly',phone:'085 220 8831',addr:'2 Abbey Court, Howth',status:'done',start:'2026-09-01',end:'2026-09-09',people:['gary','kasia'],created:'2026-08-25',by:'paul',instr:'Shower tray, tiling and new toilet.',photos:[P('Ensuite','before','paul','2026-08-25 11:00'),P('Finished','completion','kasia','2026-09-09 15:30')]},
 {id:'j7',title:'Fix fence panels after storm',cust:'Joe Murphy',phone:'087 330 1125',addr:'15 Strand Road, Sutton',status:'done',start:'2026-10-06',end:'2026-10-06',people:['dean'],created:'2026-10-05',by:'gary',instr:'Three panels down on the left side. Replacement panels at the builders\' merchant.',photos:[P('Fence down','before','gary','2026-10-05 09:00'),P('Fixed','completion','dean','2026-10-06 15:00')]},
 {id:'j8',title:'Bathroom tiles regrout',cust:'Helen Brady',phone:'086 404 7726',addr:'6 Church Road, Malahide',status:'done',start:'2026-05-12',end:'2026-05-13',people:['adam'],created:'2026-05-08',by:'paul',instr:'Regrout the shower walls and reseal the bath.',photos:[P('Before','before','paul','2026-05-08 10:00'),P('After','completion','adam','2026-05-13 14:00')]}
];
function U(id,job,who,at,text,photos){return {id:id,job:job,who:who,at:at,text:text,photos:photos||[]};}
var UPDATES=[
 U('u1','j1','adam','2026-10-13 16:40','Stripped out the old bath, tiles and vanity. Skip collected at 4.',[P('Stripped out','progress','adam','2026-10-13 16:40'),P('Skip','progress','adam','2026-10-13 16:41')]),
 U('u2','j1','kasia','2026-10-15 15:55','New shower tray in and first fix plumbing done. Gary checked the falls.',[P('Shower tray','progress','kasia','2026-10-15 15:55')]),
 U('u3','j1','gary','2026-10-16 09:10','Checked the floor with Paul. Customer happy with the layout. Tiling starts Monday.',[]),
 U('u4','j1','adam','2026-10-19 17:20','Walls tiled to two thirds. Floor tiles tomorrow.',[P('Wall tiles','progress','adam','2026-10-19 17:20'),P('Corner','progress','adam','2026-10-19 17:21')]),
 U('u5','j3','kasia','2026-10-19 16:30','Crack filled and sanded. First coat on the hall.',[P('Hall first coat','progress','kasia','2026-10-19 16:30')]),
 U('u6','j5','adam','2026-07-22 17:00','Strip-out done.',[]),U('u7','j5','gary','2026-08-01 16:20','All finished. Customer signed off and very happy.',[P('Finished shower','completion','gary','2026-08-01 16:20')]),
 U('u8','j7','dean','2026-10-06 15:00','Three panels replaced and posts re-set in concrete.',[P('Fixed','completion','dean','2026-10-06 15:00')]),
 U('u9','j6','kasia','2026-09-09 15:30','Finished and cleaned up.',[]),U('u10','j8','adam','2026-05-13 14:00','Regrouted and resealed.',[])
];
function X(id,job,who,at,what,why,hours,mats,photos,inv){return {id:id,job:job,who:who,at:at,what:what,why:why,hours:hours,mats:mats,photos:photos||[],inv:inv||null};}
var EXTRA=[
 X('x1','j1','adam','2026-10-14 11:30','Replaced a rotten joist under the bath','Found when the old bath came out. Floor was soft.','2',"1 length of 4×2 timber, screws",[P('Rotten joist','progress','adam','2026-10-14 11:30')]),
 X('x2','j1','kasia','2026-10-15 14:10','Moved the radiator 30 cm to the left','Customer asked on the day so the new vanity fits.','1.5','2 pipe extensions, valves',[]),
 X('x3','j5','adam','2026-07-24 12:00','Boxed in the soil pipe','Pipe was exposed once the old panel came off.','3','Plasterboard, tiles',[],'2026-08-02 by Paul')
];
var CUSTOMERS=[{name:'Mary Collins',phone:'087 412 6610',addr:'14 Main Street, Swords'},{name:'Tom Hennessy',phone:'086 233 9014',addr:'3 Cedar Grove, Malahide'},{name:'Orla Kenny',phone:'085 778 0213',addr:'27 The Avenue, Portmarnock'},{name:'Siobhán Daly',phone:'085 220 8831',addr:'2 Abbey Court, Howth'}];
/* data helpers */
function me(st){return st.who||'paul';}
function isBoss(st){var r=PEOPLE[me(st)].role;return r==='owner'||r==='manager';}
function jobsOf(st){var base=st.fresh?(st.freshJobs?JOBS.filter(function(j){return st.freshJobs.indexOf(j.id)>=0;}):[]):JOBS;var list=base.concat(st.newJobs||[]).map(clone);var ov=st.ov||{};list.forEach(function(j){var o=ov[j.id];if(!o)return;Object.keys(o).forEach(function(k){if(k==='photos')j.photos=j.photos.concat(o.photos);else j[k]=o[k];});});return list;}
function visibleJobs(st){var l=jobsOf(st);return isBoss(st)?l:l.filter(function(j){return j.people.indexOf(me(st))>=0;});}
function job(st,id){var l=jobsOf(st);for(var i=0;i<l.length;i++)if(l[i].id===id)return l[i];return l[0]||null;}
function updsOf(st,jid){var base=st.fresh?UPDATES.filter(function(u){return (st.freshJobs||[]).indexOf(u.job)>=0&&u.at>='2026-10-13';}):UPDATES;return base.concat(st.newU||[]).filter(function(u){return !jid||u.job===jid;}).sort(function(a,b){return a.at<b.at?1:-1;});}
function extraOf(st,jid){var base=st.fresh?EXTRA.filter(function(x){return (st.freshJobs||[]).indexOf(x.job)>=0;}):EXTRA;var inv=st.inv||{};return base.concat(st.newX||[]).map(function(x){var y=clone(x);if(inv[x.id])y.inv=inv[x.id];return y;}).filter(function(x){return !jid||x.job===jid;}).sort(function(a,b){return a.at<b.at?1:-1;});}
function photosOf(st,j){var p=j.photos.slice();updsOf(st,j.id).forEach(function(u){u.photos.forEach(function(x){p.push(x);});});extraOf(st,j.id).forEach(function(x){x.photos.forEach(function(y){p.push(y);});});return p;}
function openExtra(st,jid){return extraOf(st,jid).filter(function(x){return !x.inv;});}
function when(at){var d=at.slice(0,10),t=at.slice(11,16);return (d===TODAY?'Today':d===addDays(TODAY,-1)?'Yesterday':dayLabel(d))+(t?', '+t:'');}
function stPill(j){var s=STATUS[j.status];return pill(s[0],s[1],s[2]);}
function names(list){return list.map(function(p){return PEOPLE[p].n;}).join(', ');}
function nowAt(){return TODAY+' 09:41';}

/* ===== screens ===== */
var S={};
S.signin=function(ctx){var st=ctx.st;var err=st.err?'<div class="ap-alert bad" role="alert">'+ic('alert',20)+'<div><b>'+esc(st.err)+'</b></div></div>':'';
 return authScreen(ctx,{tag:'Sign in to see your jobs',inner:'<form class="ap-card" style="gap:14px;padding:18px">'+field(uid(ctx,'em'),'Email',st.email!=null?st.email:'paul@demo.example',{path:'email',type:'email'})+field(uid(ctx,'pw'),'Password',st.pw||'',{path:'pw',type:'password'})+err+'<button type="button" class="ap-btn lg" data-act="signin">Sign in</button></form><p class="ap-m" style="text-align:center">New here? You\'ll get an invite by email.</p>'});};
S.setpw=function(ctx){var st=ctx.st;var w=me(st);var err=st.err?'<div class="ap-alert bad" role="alert">'+ic('alert',20)+'<div><b>'+esc(st.err)+'</b></div></div>':'';
 return authScreen(ctx,{tag:'Welcome, '+PEOPLE[w].n+'. Pick a password to finish setting up.',inner:'<form class="ap-card" style="gap:14px;padding:18px">'+field(uid(ctx,'p1'),'New password',st.p1||'',{path:'p1',type:'password',hint:'At least 8 letters or numbers.'})+field(uid(ctx,'p2'),'Type it again',st.p2||'',{path:'p2',type:'password'})+err+'<button type="button" class="ap-btn lg" data-act="setpw">Save and sign in</button></form><p class="ap-m" style="text-align:center">You\'ll sign in with '+esc(PEOPLE[w].n.toLowerCase())+'@demo.example</p>'});};

S.jobs=function(ctx){var st=ctx.st;var b=ctx.b;var boss=isBoss(st);var f=st.f||'active';var q=(st.q||'').trim().toLowerCase();
 var head='<header class="ap-bar" style="padding-bottom:12px"><div class="ap-bar-in" style="gap:12px;padding:6px 6px 0"><div class="ap-logo" style="width:44px;height:44px;font-size:17px">'+b.init+'</div><div class="ttl" style="padding:0"><h1>Jobs</h1><div class="ap-sub">'+esc(b.name)+' · '+esc(PEOPLE[me(st)].full)+'</div></div>'+(boss?'<button type="button" class="ap-btn acc sm" style="margin-right:4px" data-act="go" data-arg="newjob">'+ic('plus',16)+'New job</button>':'')+'</div>'+
  '<div style="padding:10px 6px 0"><label class="ap-sr" for="'+uid(ctx,'q')+'">Search jobs</label><input class="ap-in" id="'+uid(ctx,'q')+'" data-bind-r="q" value="'+esc(st.q||'')+'" placeholder="Search customer, address or what was done" style="border-color:transparent"></div></header>';
 if(st.mode==='loading')return {body:head+'<div class="ap-scroll">'+loadingInner(3)+'</div>'};
 if(st.mode==='error')return {body:head+'<div class="ap-scroll">'+errorInner('your jobs')+'</div>'};
 var all=visibleJobs(st);
 var h='';
 if(!q){var xo=boss?openExtra(st):[];if(xo.length)h+='<button type="button" class="ap-alert bad" style="text-align:left;cursor:pointer;width:100%" data-act="go" data-arg="extralist">'+ic('flag',20)+'<div><b>'+xo.length+' extra work '+(xo.length===1?'entry':'entries')+' to add to invoices</b><span>Tap to see them all</span></div></button>';
  var counts={active:all.filter(function(j){return j.status!=='done';}).length,done:all.filter(function(j){return j.status==='done';}).length};
  h+='<div class="ap-chips">'+chip('Active · '+counts.active,f==='active','data-act="set" data-arg="f=active"')+chip('Completed · '+counts.done,f==='done','data-act="set" data-arg="f=done"')+'</div>';}
 var list;if(q){list=all.filter(function(j){var hay=[j.title,j.cust,j.addr,j.instr].concat(updsOf(st,j.id).map(function(u){return u.text;})).concat(extraOf(st,j.id).map(function(x){return x.what;})).join(' ').toLowerCase();return hay.indexOf(q)>=0;});}
 else list=all.filter(function(j){return f==='done'?j.status==='done':j.status!=='done';});
 list.sort(function(a,b2){if(f==='done'||q)return (b2.end||b2.start||'')>(a.end||a.start||'')?1:-1;var o={progress:0,todo:1};return o[a.status]-o[b2.status]||((a.start||'9')>(b2.start||'9')?1:-1);});
 if(q)h+='<p class="ap-m">'+list.length+' job'+(list.length===1?'':'s')+' match "'+esc(st.q)+'"</p>';
 if(!list.length){h+=q?emptyBox('list','No jobs match','Try a customer name, a street, or a word from an update.'):(f==='done'?emptyBox('check','No completed jobs yet','Finished jobs stay here with every photo and update, so you can look back any time.'):emptyBox('list',boss?'No jobs yet':'No jobs for you yet',boss?'Add your first job: the customer, the address and what needs doing.':'When you\'re added to a job, it shows up here with everything you need.',boss?'<button type="button" class="ap-btn" data-act="go" data-arg="newjob">'+ic('plus',18)+'New job</button>':''));}
 h+=list.map(function(j){var xo=openExtra(st,j.id).length;var lu=updsOf(st,j.id)[0];var sub=j.status==='done'?'Completed '+(j.end?dayLabel(j.end):''):(lu?'Last update '+when(lu.at)+' · '+PEOPLE[lu.who].n:(j.start?'Starts '+dayLabel(j.start):'No start date yet'));
  return '<button type="button" class="ap-row" data-act="go" data-arg="job" data-set="jid='+j.id+';tab=all"><span class="t"><b>'+esc(j.title)+'</b><span class="m">'+esc(j.cust)+' · '+esc(j.addr)+'</span><span class="m">'+esc(sub)+'</span><span style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">'+stPill(j)+(xo&&boss?pill(xo+' extra work','red','flag'):'')+(j.people.length?'':pill('No one assigned','grey','person'))+'</span></span><span class="chev">›</span></button>';}).join('');
 return {body:head+'<div class="ap-scroll">'+h+'</div>'};};

S.newjob=function(ctx){var st=ctx.st;var d=st.nj||(st.nj={title:'',cust:'',phone:'',addr:'',instr:'',start:'',people:[],photos:[]});var probs=[];if(!d.title)probs.push('Add what the job is.');if(!d.cust)probs.push("Add the customer's name.");if(!d.addr)probs.push('Add the address.');
 var q=(st.cq||'').toLowerCase();var res=q.length>=2&&!st.fresh?CUSTOMERS.filter(function(c){return c.name.toLowerCase().indexOf(q)>=0||c.addr.toLowerCase().indexOf(q)>=0;}):[];
 var h='<div class="ap-card" style="gap:12px">'+field(uid(ctx,'t'),'What\'s the job?',d.title,{path:'nj.title',ph:'e.g. Bathroom renovation',bad:st.tried&&!d.title})+'</div>'+
 '<div class="ap-card" style="gap:12px"><h2 class="ap-h">Customer</h2>'+(st.fresh?'':'<div class="ap-f"><label for="'+uid(ctx,'cq')+'">Find a past customer</label><input class="ap-in" id="'+uid(ctx,'cq')+'" data-bind-r="cq" value="'+esc(st.cq||'')+'" placeholder="Name or street"></div>'+res.map(function(c,i){return '<button type="button" class="ap-row" data-act="pickCust" data-arg="'+i+'"><span class="t"><b>'+esc(c.name)+'</b><span class="m">'+esc(c.addr)+'</span></span></button>';}).join(''))+
  field(uid(ctx,'c'),'Name',d.cust,{path:'nj.cust',bad:st.tried&&!d.cust})+field(uid(ctx,'p'),'Phone',d.phone,{path:'nj.phone',mode:'tel'})+field(uid(ctx,'a'),'Address',d.addr,{path:'nj.addr',bad:st.tried&&!d.addr})+'</div>'+
 '<div class="ap-card" style="gap:12px">'+field(uid(ctx,'i'),'Instructions for the team',d.instr,{path:'nj.instr',area:1,ph:'What needs doing, materials, access, anything to watch out for'})+field(uid(ctx,'s'),'Start date (optional)',d.start,{path:'nj.start',ph:'e.g. Thu 22 Oct'})+
  '<div class="ap-f"><span class="ap-lb">Who\'s on it</span><div class="ap-chips">'+ASSIGNABLE.map(function(p){return chip(PEOPLE[p].n,d.people.indexOf(p)>=0,'data-act="njWho" data-arg="'+p+'"');}).join('')+'</div><span class="ap-hint">They see the job on their phone as soon as you save.</span></div></div>'+
 '<div class="ap-card" style="gap:10px"><h2 class="ap-h">Before photos</h2>'+(d.photos.length?photoTiles(d.photos.map(function(p){return {l:p.l,w:st.mode==='offline'};})):'')+'<button type="button" class="ap-btn sec" data-act="njPhoto">'+ic('cam',18)+'Take or choose photos</button></div>'+
 (st.tried&&probs.length?'<div class="ap-alert bad" role="alert">'+ic('alert',20)+'<div><b>Before you save:</b><ul style="margin:0;padding-left:18px">'+probs.map(function(p){return '<li>'+esc(p)+'</li>';}).join('')+'</ul></div></div>':'')+
 '<button type="button" class="ap-btn lg" data-act="saveJob">Save job</button>';
 return page(ctx,'New job',h);};

S.job=function(ctx){var st=ctx.st;var j=job(st,st.jid||'j1');if(!j)return page(ctx,'Job',emptyBox('list','Job not found',''));var boss=isBoss(st);
 if(st.mode==='loading')return page(ctx,j.title,loadingInner(4),{sub:j.cust});
 var ups=updsOf(st,j.id),xs=extraOf(st,j.id),photos=photosOf(st,j);var tab=st.tab||'all';var ph=photos.filter(function(p){return tab==='all'||p.stage===tab;});
 var h='<div class="ap-card"><div style="display:flex;gap:6px;flex-wrap:wrap">'+stPill(j)+(openExtra(st,j.id).length&&boss?pill(openExtra(st,j.id).length+' extra work to invoice','red','flag'):'')+'</div><b style="font-size:16px">'+esc(j.cust)+'</b><span class="ap-m">'+esc(j.addr)+'</span><div class="ap-btns"><button type="button" class="ap-btn sec sm">'+ic('pin',16)+'Maps</button>'+(j.phone?'<button type="button" class="ap-btn sec sm">Call '+esc(j.phone)+'</button>':'')+'</div></div>'+
 '<div class="ap-card"><div style="display:flex;justify-content:space-between;align-items:center"><h2 class="ap-h">Instructions</h2>'+(boss&&j.status!=='done'?'<button type="button" class="ap-btn sec sm" data-act="set" data-arg="sheet=instr">Edit</button>':'')+'</div><span style="font-size:15px">'+esc(j.instr||'No instructions yet.')+'</span><span class="ap-m" style="font-size:13px">'+(j.start?(j.status==='done'?dateRangeJ(j):'Start '+dayLabel(j.start))+' · ':'')+(j.people.length?'On it: '+esc(names(j.people)):'No one assigned yet')+'</span>'+(boss&&j.status!=='done'?'<button type="button" class="ap-btn sec sm" style="align-self:flex-start" data-act="set" data-arg="sheet=people">'+(j.people.length?'Change who\'s on it':'Assign people')+'</button>':'')+'</div>'+
 '<div class="ap-card"><h2 class="ap-h">Photos · '+photos.length+'</h2><div class="ap-chips">'+[['all','All'],['before','Before'],['progress','Progress'],['completion','Completion']].map(function(t){var n=t[0]==='all'?photos.length:photos.filter(function(p){return p.stage===t[0];}).length;return chip(t[1]+' '+n,tab===t[0],'data-act="set" data-arg="tab='+t[0]+'"');}).join('')+'</div>'+(ph.length?photoTiles(ph.map(function(p){return {l:p.l,w:p.w};}),{act:'openPh'}):'<p class="ap-m">'+(tab==='completion'&&j.status!=='done'?'Completion photos are added when the work is finished.':'No photos here yet.')+'</p>')+'</div>'+
 '<div class="ap-card"><div style="display:flex;justify-content:space-between;align-items:center"><h2 class="ap-h">Extra work · '+xs.length+'</h2></div>'+(xs.length?xs.map(function(x){return '<button type="button" class="ap-row" data-act="go" data-arg="extra" data-set="xid='+x.id+'"><span class="t"><b>'+esc(x.what)+'</b><span class="m">'+esc(PEOPLE[x.who].n)+' · '+when(x.at)+(x.hours?' · about '+esc(x.hours)+' h':'')+'</span><span style="margin-top:4px">'+(x.inv?pill('Added to invoice','green','check'):pill('Not on an invoice yet','red','flag'))+'</span></span><span class="chev">›</span></button>';}).join(''):'<p class="ap-m">Anything done that wasn\'t in the instructions goes here, so it gets charged.</p>')+'</div>'+
 '<div class="ap-card" style="gap:0"><h2 class="ap-h" style="margin-bottom:6px">Updates · '+ups.length+'</h2>'+(ups.length?'<div class="ap-tl">'+ups.map(function(u){return '<div class="it" style="grid-template-columns:40px 1fr"><span class="ap-av">'+initials(PEOPLE[u.who].full)+'</span><div style="display:flex;flex-direction:column;gap:6px;min-width:0"><span class="ap-m" style="font-size:13px"><b style="color:#1F2328">'+esc(PEOPLE[u.who].n)+'</b> · '+when(u.at)+'</span><span style="font-size:15px">'+esc(u.text)+'</span>'+(u.photos.length?photoTiles(u.photos.map(function(p){return {l:p.l,w:p.w};}),{labels:false,square:1,four:1}):'')+'</div></div>';}).join('')+'</div>':'<p class="ap-m">No updates yet. Post the first one when work starts.</p>')+
 '<div class="ap-tl"><div class="it" style="grid-template-columns:40px 1fr"><span class="ap-av" style="background:#F0F2F4;color:#59636E">'+ic('plus',16)+'</span><span class="ap-m" style="font-size:13px;align-self:center">Job created by '+esc(PEOPLE[j.by].n)+' · '+dayLabel(j.created)+'</span></div></div></div>';
 if(j.status!=='done'&&(boss||j.people.indexOf(me(st))>=0))h+='<div class="ap-btns"><button type="button" class="ap-btn lg" data-act="go" data-arg="post">'+ic('cam',18)+'Post update</button><button type="button" class="ap-btn acc lg" data-act="go" data-arg="addextra">'+ic('flag',18)+'Log extra work</button></div>'+(boss?'<button type="button" class="ap-btn ok" data-act="sheet" data-arg="complete">'+ic('check',18)+'Mark as completed</button>':'')+(boss&&j.status==='todo'?'<button type="button" class="ap-btn sec" data-act="setStatus" data-arg="progress">Mark as in progress</button>':'');
 if(j.status==='done')h+='<div class="ap-alert ok">'+ic('check',20)+'<div><b>Completed '+(j.end?dayLabel(j.end):'')+'.</b><span>Kept here for good, with every photo and update.</span></div></div>'+(boss?'<button type="button" class="ap-btn sec" data-act="setStatus" data-arg="progress">Reopen</button>':'');
 var ov='';
 if(st.sheet==='photo'){var i=+st.phI||0;var p=ph[i]||ph[0];ov=viewer(p.l+' · '+(p.stage==='before'?'Before':p.stage==='progress'?'Progress':'Completion')+' · '+PEOPLE[p.who].n,i,ph.length,'phI='+((i+ph.length-1)%ph.length),'phI='+((i+1)%ph.length));}
 if(st.sheet==='complete'){var comp=photos.filter(function(p){return p.stage==='completion';}).length;var xo=openExtra(st,j.id).length;ov=sheet('<h2>Mark as completed?</h2>'+(comp?'<p class="ap-m" style="font-size:15px">'+comp+' completion photo'+(comp>1?'s':'')+' on the job.</p>':'<div class="ap-alert warn">'+ic('cam',20)+'<div><span><b>No completion photos yet.</b> You can still complete it, but photos help if the customer asks later.</span></div></div>')+(xo?'<div class="ap-alert bad">'+ic('flag',20)+'<div><span><b>'+xo+' extra work '+(xo===1?'entry is':'entries are')+' not on an invoice yet.</b></span></div></div>':'')+'<div class="ap-btns"><button type="button" class="ap-btn ok" data-act="complete">Mark as completed</button><button type="button" class="ap-btn sec" data-act="close">Not yet</button></div>','Mark as completed');}
 if(st.sheet==='people')ov=sheet('<h2>Who\'s on it</h2><div class="ap-chips">'+ASSIGNABLE.map(function(p){return chip(PEOPLE[p].n,j.people.indexOf(p)>=0,'data-act="toggleWho" data-arg="'+p+'"');}).join('')+'</div><span class="ap-hint">People you add see the job straight away. People you take off stop seeing it.</span><button type="button" class="ap-btn" data-act="close">Done</button>','Who\'s on it');
 if(st.sheet==='instr')ov=sheet('<h2>Edit instructions</h2><textarea class="ap-in" id="'+uid(ctx,'ei')+'" aria-label="Instructions" data-bind="insDraft" style="min-height:140px">'+esc(st.insDraft!=null?st.insDraft:j.instr)+'</textarea><div class="ap-btns"><button type="button" class="ap-btn" data-act="saveInstr">Save</button><button type="button" class="ap-btn sec" data-act="close">Cancel</button></div>','Edit instructions');
 return page(ctx,j.title,h,{sub:j.cust+' · '+j.addr.split(', ').pop(),overlay:ov});};
function dateRangeJ(j){return j.end&&j.end!==j.start?dayLabel(j.start)+' – '+dayLabel(j.end):dayLabel(j.start);}

S.post=function(ctx){var st=ctx.st;var j=job(st,st.jid||'j1');var d=st.pd||(st.pd={text:'',stage:'progress',photos:[]});
 var h='<div class="ap-f"><span class="ap-lb">Photos</span><div class="ap-chips">'+[['before','Before'],['progress','Progress'],['completion','Completion']].map(function(t){return chip(t[1],d.stage===t[0],'data-act="set" data-arg="pd.stage='+t[0]+'"');}).join('')+'</div><span class="ap-hint">'+(d.stage==='before'?'What it looked like before you started.':d.stage==='completion'?'The finished work. Take a few from different angles.':'How it\'s going today.')+'</span>'+(d.photos.length?photoTiles(d.photos.map(function(p){return {l:p.l,w:st.mode==='offline'};})):'')+'<div class="ap-btns"><button type="button" class="ap-btn" data-act="pPhoto">'+ic('cam',18)+'Take photo</button><button type="button" class="ap-btn sec" data-act="pPhoto">Choose photos</button></div></div>'+
 field(uid(ctx,'t'),'What happened',d.text,{path:'pd.text',area:1,ph:'e.g. Floor tiles down, grouting tomorrow'})+(st.tried&&!d.text&&!d.photos.length?'<span class="ap-err">'+ic('alert',14)+'Add a few words or a photo.</span>':'')+
 '<span class="ap-hint">Posted as '+esc(PEOPLE[me(st)].n)+', with today\'s date and time. Everyone on the job sees it.</span><button type="button" class="ap-btn lg" data-act="postU">'+ic('send',18)+'Post update</button>'+(st.mode==='offline'?'<div class="ap-alert warn">'+ic('nosig',20)+'<div><span><b>No signal.</b> The update and photos wait on your phone and post by themselves when you\'re back online.</span></div></div>':'');
 return page(ctx,'Post update',h,{sub:j.title+' · '+j.cust});};

S.addextra=function(ctx){var st=ctx.st;var j=job(st,st.jid||'j1');var d=st.xd||(st.xd={what:'',why:'',hours:'',mats:'',photos:[]});
 var h='<div class="ap-alert info">'+ic('flag',20)+'<div><span>Anything you did that wasn\'t in the instructions. '+esc(PEOPLE.paul.n)+' sees it and adds it to the invoice.</span></div></div>'+
 field(uid(ctx,'w'),'What did you do?',d.what,{path:'xd.what',ph:'e.g. Replaced a rotten joist under the bath',bad:st.tried&&!d.what})+field(uid(ctx,'y'),'Why? (optional)',d.why,{path:'xd.why',ph:'e.g. Floor was soft when the bath came out'})+
 '<div class="ap-g2">'+field(uid(ctx,'h'),'Roughly how long (hours)',d.hours,{path:'xd.hours',mode:'decimal',ph:'e.g. 2'})+field(uid(ctx,'m'),'Materials used',d.mats,{path:'xd.mats',ph:'e.g. Timber, screws'})+'</div>'+
 '<div class="ap-f"><span class="ap-lb">Photos</span>'+(d.photos.length?photoTiles(d.photos.map(function(p){return {l:p.l,w:false};})):'')+'<button type="button" class="ap-btn sec" data-act="xPhoto">'+ic('cam',18)+'Add photos</button></div>'+
 (st.tried&&!d.what?'<span class="ap-err">'+ic('alert',14)+'Say what you did.</span>':'')+'<button type="button" class="ap-btn acc lg" data-act="saveX">Log extra work</button>';
 return page(ctx,'Log extra work',h,{sub:j.title+' · '+j.cust});};

S.extra=function(ctx){var st=ctx.st;var x=null;extraOf(st).forEach(function(y){if(y.id===(st.xid||'x1'))x=y;});var j=job(st,x.job);var boss=isBoss(st);
 var h='<div class="ap-card"><span style="align-self:flex-start">'+(x.inv?pill('Added to invoice','green','check'):pill('Not on an invoice yet','red','flag'))+'</span><b style="font-size:18px">'+esc(x.what)+'</b>'+(x.why?'<span style="font-size:15px">'+esc(x.why)+'</span>':'')+'<span class="ap-m" style="font-size:13px">Logged by '+esc(PEOPLE[x.who].n)+' · '+when(x.at)+'</span></div>'+
 '<div class="ap-g2"><div class="ap-stat"><span>Roughly how long</span><b>'+(x.hours?esc(x.hours)+' h':'–')+'</b></div><div class="ap-stat"><span>Materials</span><b style="font-size:14px">'+esc(x.mats||'–')+'</b></div></div>'+
 (x.photos.length?'<div class="ap-card"><h2 class="ap-h">Photos</h2>'+photoTiles(x.photos.map(function(p){return {l:p.l};}))+'</div>':'')+
 (boss?(x.inv?'<div class="ap-alert ok">'+ic('check',20)+'<div><span>Added to invoice '+esc(x.inv)+'.</span></div></div><button type="button" class="ap-btn sec" data-act="uninv">Undo</button>':'<button type="button" class="ap-btn ok lg" data-act="inv">'+ic('check',18)+'Added to invoice</button><span class="ap-hint" style="text-align:center">Tick this once it\'s on the customer\'s invoice in your invoicing software.</span>'):'<span class="ap-hint">'+esc(PEOPLE.paul.n)+' ticks this off once it\'s on the invoice.</span>')+
 '<button type="button" class="ap-btn sec" data-act="go" data-arg="job" data-set="jid='+j.id+'">Open the job</button>';
 return page(ctx,'Extra work',h,{sub:j.title+' · '+j.cust});};

S.extralist=function(ctx){var st=ctx.st;var f=st.xf||'open';var xs=extraOf(st).filter(function(x){return f==='open'?!x.inv:!!x.inv;});
 var h='<div class="ap-chips">'+chip('Not on an invoice · '+extraOf(st).filter(function(x){return !x.inv;}).length,f==='open','data-act="set" data-arg="xf=open"')+chip('Added · '+extraOf(st).filter(function(x){return x.inv;}).length,f==='done','data-act="set" data-arg="xf=done"')+'</div>'+
 (xs.length?xs.map(function(x){var j=job(st,x.job);return '<button type="button" class="ap-row" data-act="go" data-arg="extra" data-set="xid='+x.id+'"><span class="t"><b>'+esc(x.what)+'</b><span class="m">'+esc(j.cust)+' · '+esc(j.title)+'</span><span class="m">'+esc(PEOPLE[x.who].n)+' · '+when(x.at)+(x.hours?' · about '+esc(x.hours)+' h':'')+'</span></span><span class="chev">›</span></button>';}).join(''):emptyBox('check',f==='open'?'All extra work is on an invoice':'Nothing added yet',f==='open'?'New extra work from the team shows here until you tick it off.':'Extra work you tick off shows here.'));
 return page(ctx,'Extra work',h,{sub:'All jobs'});};

/* ===== actions ===== */
function ovr(st,id){st.ov=st.ov||{};st.ov[id]=st.ov[id]||{};return st.ov[id];}
var ACT={
 signin:function(st,a,inst){if(st.mode==='wrong'&&!st.err){st.err="That email and password don't match. Check them and try again.";return;}st.err=null;inst.stack=['jobs'];},
 setpw:function(st,a,inst){var p1=st.p1||'',p2=st.p2||'';if(p1.length<8){st.err='Use at least 8 letters or numbers.';return;}if(p1!==p2){st.err="The two passwords don't match.";return;}st.err=null;inst.stack=['jobs'];},
 pickCust:function(st,a){var q=(st.cq||'').toLowerCase();var res=CUSTOMERS.filter(function(c){return c.name.toLowerCase().indexOf(q)>=0||c.addr.toLowerCase().indexOf(q)>=0;});var c=res[+a];if(!c)return;st.nj.cust=c.name;st.nj.phone=c.phone;st.nj.addr=c.addr;st.cq='';},
 njWho:function(st,a){var p=st.nj.people;var i=p.indexOf(a);if(i>=0)p.splice(i,1);else p.push(a);},
 njPhoto:function(st){st.nj.photos.push({l:'Before '+(st.nj.photos.length+1)});},
 saveJob:function(st,a,inst){var d=st.nj;if(!d.title||!d.cust||!d.addr){st.tried=true;return;}var id='n'+((st.newJobs||[]).length+1);st.newJobs=(st.newJobs||[]).concat([{id:id,title:d.title,cust:d.cust,phone:d.phone,addr:d.addr,status:'todo',start:/^\d{4}-/.test(d.start)?d.start:'2026-10-22',people:d.people.slice(),created:TODAY,by:me(st),instr:d.instr,photos:d.photos.map(function(p){return P(p.l,'before',me(st),nowAt());})}]);st.nj=null;st.tried=false;st.jid=id;st.tab='all';st.toast=d.people.length?'Job saved. '+names(d.people)+' can see it now.':'Job saved';inst.stack[inst.stack.length-1]='job';},
 openPh:function(st,a){st.sheet='photo';st.phI=a;},
 setStatus:function(st,a){var o=ovr(st,st.jid);o.status=a;if(a!=='done')o.end='';st.toast=a==='progress'?'Marked as in progress':'Updated';},
 complete:function(st){var o=ovr(st,st.jid);o.status='done';o.end=TODAY;st.sheet=null;st.toast='Job completed';},
 toggleWho:function(st,a){var j=job(st,st.jid);var p=j.people.slice();var i=p.indexOf(a);if(i>=0)p.splice(i,1);else p.push(a);ovr(st,st.jid).people=p;},
 saveInstr:function(st){if(st.insDraft!=null)ovr(st,st.jid).instr=st.insDraft;st.insDraft=null;st.sheet=null;st.toast='Instructions saved. Everyone on the job sees the change.';},
 pPhoto:function(st){st.pd.photos.push({l:(st.pd.stage==='completion'?'Finished ':st.pd.stage==='before'?'Before ':'Progress ')+(st.pd.photos.length+1)});},
 postU:function(st,a,inst){var d=st.pd;if(!d.text&&!d.photos.length){st.tried=true;return;}var at=nowAt();st.newU=(st.newU||[]).concat([{id:'nu'+((st.newU||[]).length+1),job:st.jid||'j1',who:me(st),at:at,text:d.text||'(photos)',photos:d.photos.map(function(p){var x=P(p.l,d.stage,me(st),at);if(st.mode==='offline')x.w=1;return x;})}]);var j=job(st,st.jid||'j1');if(j.status==='todo')ovr(st,j.id).status='progress';st.pd=null;st.tried=false;st.toast=st.mode==='offline'?'Saved on your phone. It posts when you\'re back online.':'Update posted';inst.stack.pop();},
 xPhoto:function(st){st.xd.photos.push({l:'Extra work '+(st.xd.photos.length+1)});},
 saveX:function(st,a,inst){var d=st.xd;if(!d.what){st.tried=true;return;}st.newX=(st.newX||[]).concat([{id:'nx'+((st.newX||[]).length+1),job:st.jid||'j1',who:me(st),at:nowAt(),what:d.what,why:d.why,hours:d.hours,mats:d.mats,photos:d.photos.map(function(p){return P(p.l,'progress',me(st),nowAt());}),inv:null}]);st.xd=null;st.tried=false;st.toast='Extra work logged. Paul will see it on the job.';inst.stack.pop();},
 inv:function(st){st.inv=st.inv||{};st.inv[st.xid]='today by '+PEOPLE[me(st)].n;st.toast='Marked as added to invoice';},
 uninv:function(st){st.inv=st.inv||{};st.inv[st.xid]=null;var x=null;EXTRA.forEach(function(y){if(y.id===st.xid)x=y;});if(x&&x.inv){st.inv[st.xid]=null;}}
};
/* uninv for seeded invoiced entries */
var _extraOf=extraOf;extraOf=function(st,jid){return _extraOf(st,jid).map(function(x){if(st.inv&&Object.prototype.hasOwnProperty.call(st.inv,x.id)&&st.inv[x.id]===null)x.inv=null;return x;});};
var LIVE={};

/* ===== flows ===== */
function st_(s,dev,t,how,note,init,stack){return {s:s,dev:dev||'phone',t:t,how:how,note:note,init:init||{},stack:stack};}
var DAY1=[{id:'n1',title:'Bathroom renovation',cust:'Mary Collins',phone:'087 412 6610',addr:'14 Main Street, Swords',status:'todo',start:'2026-10-22',people:['gary','adam'],created:TODAY,by:'paul',instr:'Full bathroom: strip out, new shower, tiling, new vanity and toilet. Tiles are in the garage.',photos:[P('Old bath','before','paul','2026-10-20 09:30'),P('Old tiles','before','paul','2026-10-20 09:31')]}];
var FLOWS=[
 {id:'first-signin',title:'First sign-in',summary:'The owner gets an invite email, picks a password and lands on an empty jobs list that tells him what to do first.',starts:['Invite email','Set password'],next:'first-job',steps:[
  st_('setpw','phone','Pick a password','Paul taps the invite link we send when his business is set up.','Two fields and one button. Rules are shown before he types.',{}),
  st_('jobs','phone','Empty jobs list','Right after saving the password.','One clear action: add the first job. No counts or badges yet.',{fresh:true})]},
 {id:'first-job',title:'Add the first job',summary:'Replaces the first WhatsApp message about a job. One screen holds the customer, address, instructions, who\'s on it and the before photos.',starts:['Jobs','New job'],next:'first-worker',steps:[
  st_('newjob','phone','New job, blank','Taps "New job".','What the job is, the customer, instructions, an optional start date, who\'s on it, before photos. Problems are listed only after he taps Save.',{fresh:true},['jobs','newjob']),
  st_('newjob','phone','Filled in','He fills it in at the house.','Picking people tells him they\'ll see it straight away.',{fresh:true,nj:{title:'Bathroom renovation',cust:'Mary Collins',phone:'087 412 6610',addr:'14 Main Street, Swords',instr:'Full bathroom: strip out, new shower, tiling, new vanity and toilet. Tiles are in the garage.',start:'Thu 22 Oct',people:['gary','adam'],photos:[{l:'Old bath'},{l:'Old tiles'}]}},['jobs','newjob']),
  st_('job','phone','The job page','After Save.','Everything about the job on one page. The updates feed starts with "Job created by Paul".',{fresh:true,newJobs:DAY1,jid:'n1'},['jobs','job'])]},
 {id:'first-worker',title:'A worker\'s first day',summary:'Adam sets a password from his invite and finds the job waiting, with the instructions and before photos.',starts:['Invite email','Set password'],next:'',steps:[
  st_('setpw','phone','Pick a password','Adam taps his invite link.','Same screen as the owner\'s; only the name changes.',{who:'adam'}),
  st_('jobs','phone','His jobs','After saving.','Workers see only the jobs they\'re on, with no "New job" button.',{who:'adam',fresh:true,newJobs:DAY1}),
  st_('job','phone','The job page, worker view','Taps the job.','Same page, without Edit, Assign or Mark as completed. Post update and Log extra work are at the bottom.',{who:'adam',fresh:true,newJobs:DAY1,jid:'n1'},['jobs','job'])]},
 /* returning: the demo story */
 {id:'demo-overview',title:'The jobs list',summary:'Paul\'s home screen: active jobs with the latest update, and a red note when extra work hasn\'t reached an invoice yet.',starts:['Jobs'],next:'demo-progress',steps:[
  st_('jobs','phone','Active jobs','Opens the app in the morning.','Each row shows the customer, address, last update and who posted it. Tags show status and extra work.',{}),
  st_('job','phone','A job in progress','Taps Mary Collins\'s bathroom.','Customer and address with Maps and Call, instructions, photos by stage, extra work, then the updates feed.',{jid:'j1'},['jobs','job'])]},
 {id:'demo-progress',title:'A worker posts progress',summary:'Replaces photos dropped into the WhatsApp group. The update lands on the job with who posted it and when.',starts:['Jobs','Job','Post update'],next:'demo-extra',steps:[
  st_('post','phone','Post update','Adam taps "Post update" at the end of the day.','Pick the photo stage, add photos, a few words. It\'s posted with his name and the time.',{who:'adam',jid:'j1',pd:{text:'Floor tiles down. Grouting and the vanity tomorrow.',stage:'progress',photos:[{l:'Floor tiles'},{l:'Doorway'}]}},['jobs','job','post']),
  st_('job','phone','On Paul\'s phone','A moment later, Paul opens the job.','The update is at the top of the feed; the photos are also under "Progress".',{jid:'j1',newU:[{id:'nu1',job:'j1',who:'adam',at:'2026-10-20 09:41',text:'Floor tiles down. Grouting and the vanity tomorrow.',photos:[P('Floor tiles','progress','adam','2026-10-20 09:41'),P('Doorway','progress','adam','2026-10-20 09:41')]}],tab:'progress'},['jobs','job'])]},
 {id:'demo-extra',title:'Extra work gets logged',summary:'Fixes "they forget to tell me". Workers log extra work on the job, and it stays flagged until it\'s on the invoice.',starts:['Job','Log extra work'],next:'demo-complete',steps:[
  st_('addextra','phone','Log extra work','Kasia moves a radiator the customer asked about.','What, why, roughly how long, materials and photos. No prices.',{who:'kasia',jid:'j1',xd:{what:'Moved the radiator 30 cm to the left',why:'Customer asked on the day so the new vanity fits.',hours:'1.5',mats:'2 pipe extensions, valves',photos:[{l:'Radiator'}]}},['jobs','job','addextra']),
  st_('extralist','phone','All extra work to invoice','Paul taps the red note on the jobs list.','Every entry not on an invoice yet, across all jobs.',{},['jobs','extralist']),
  st_('extra','phone','Tick it off','Taps an entry.','Once it\'s on the invoice in his own software, one tap: "Added to invoice".',{xid:'x1'},['jobs','extralist','extra'])]},
 {id:'demo-complete',title:'Finish the job',summary:'Completion photos go on the job and Paul marks it completed. It moves to Completed, with everything kept.',starts:['Job','Post update'],next:'demo-search',steps:[
  st_('post','phone','Completion photos','Last day of the job.','The "Completion" stage tells everyone these are the finished work.',{who:'gary',jid:'j1',pd:{text:'All finished and cleaned up. Customer happy.',stage:'completion',photos:[{l:'Shower'},{l:'Vanity'},{l:'Floor'}]}},['jobs','job','post']),
  st_('job','phone','Mark as completed','Paul taps "Mark as completed".','A last check: completion photos, and extra work not yet on an invoice.',{jid:'j1',sheet:'complete',newU:[{id:'nu1',job:'j1',who:'gary',at:'2026-10-20 09:41',text:'All finished and cleaned up. Customer happy.',photos:[P('Shower','completion','gary','2026-10-20 09:41'),P('Vanity','completion','gary','2026-10-20 09:41')]}]},['jobs','job'])]},
 {id:'demo-search',title:'Look back at past jobs',summary:'Replaces scrolling back through WhatsApp. Search finds any job by customer, street or words in its updates, and every photo is still there.',starts:['Jobs','Search'],next:'',steps:[
  st_('jobs','phone','Completed jobs','Taps "Completed".','Newest first, with the date it finished.',{f:'done'}),
  st_('jobs','phone','Search "bathroom"','Types in the search box.','Matches titles, customers, addresses, instructions, updates and extra work.',{q:'bathroom'}),
  st_('job','phone','A job from July','Opens Brian and Ann Moore\'s bathroom.','Before and completion photos, the updates and the extra work, as they were.',{jid:'j5',tab:'completion'},['jobs','job'])]},
 /* states */
 {id:'states-jobs',states:true,title:'Jobs list states',summary:'Loading, failed, and searches that find nothing.',starts:['Jobs'],next:'states-job',steps:[
  st_('jobs','phone','Loading','Opening the app on slow signal.','Placeholder rows in the shape of the real ones.',{mode:'loading'}),
  st_('jobs','phone','Couldn\'t load','No signal and nothing saved yet.','Says why, offers "Try again", and promises nothing saved is lost.',{mode:'error'}),
  st_('jobs','phone','No results','A search that matches nothing.','Suggests what to search for.',{q:'conservatory'}),
  st_('jobs','phone','Worker with no jobs','A worker who isn\'t on any job yet.','Says where jobs come from.',{who:'dean',fresh:true})]},
 {id:'states-job',states:true,title:'Job page states',summary:'No signal, a job with no one on it, and changing who\'s on it.',starts:['Jobs','Job'],next:'states-auth',steps:[
  st_('post','phone','No signal','Posting from a basement.','The update and photos wait on the phone and post by themselves.',{who:'adam',mode:'offline',jid:'j1',pd:{text:'Grouting done.',stage:'progress',photos:[{l:'Grout'}]}},['jobs','job','post']),
  st_('job','phone','No one assigned','A new job nobody is on yet.','The jobs list shows "No one assigned"; the page offers "Assign people".',{jid:'j4'},['jobs','job']),
  st_('job','phone','Change who\'s on it','Taps "Change who\'s on it".','Chips; people added see it straight away.',{jid:'j1',sheet:'people'},['jobs','job']),
  st_('job','phone','Photo full screen','Taps a photo.','Shows the stage and who took it.',{jid:'j1',sheet:'photo',phI:'0'},['jobs','job'])]},
 {id:'states-auth',states:true,title:'Sign-in states',summary:'Wrong password and a new phone.',starts:['Sign in'],next:'',steps:[
  st_('signin','phone','Wrong password','Email and password don\'t match.','Says what to try, without saying which one was wrong.',{mode:'wrong',err:"That email and password don't match. Check them and try again.",pw:'password'}),
  st_('signin','phone','New phone','Paul signs in on a new phone.','Everything is stored online, so the full history is there after signing in. This answers his WhatsApp worry.',{email:'paul@demo.example',pw:'xxxxxxxx'})]}
];
var JOURNEYS=[
 {id:'new',label:'New user',desc:'The owner and a worker using the app for the first time: no jobs, no history, then the first job and the first look at it from a worker\'s phone.',flows:['first-signin','first-job','first-worker']},
 {id:'ret',label:'Returning user',desc:'The demo story: one bathroom renovation from progress to completion, extra work that reaches the invoice, and finding past jobs.',flows:['demo-overview','demo-progress','demo-extra','demo-complete','demo-search']},
 {id:'states',label:'States and edge cases',desc:'Loading, failed, no signal, nothing found, nobody assigned, and signing in on a new phone.',flows:['states-jobs','states-job','states-auth']}
];
var PLANNED=['alerts when someone posts an update or extra work','a PDF or photo pack to send to a customer','team list and invites inside the app (today the platform team sends invites)','a web view for the office','scheduling, if he needs it'];

FLOWS.forEach(function(f){f.ns='jr';f.brandMap={bw:'demo',hb:'alt'};});
return {S:S,ACT:ACT,LIVE:LIVE,CFG:CFG,BRANDS:BRANDS,FLOWS:FLOWS,JOURNEYS:JOURNEYS,PLANNED:PLANNED};})();
var NS={jr:JR};
(function(){
 var B2=JR.BRANDS;Object.keys(B2).forEach(function(k){BRANDS[k]=B2[k];});
 var byId={};JR.FLOWS.forEach(function(f){byId[f.id]=f;});
 var t=function(id){return 'jobs-'+id;};
 /* one shared sign-in: the main "First sign-in" flow covers Pick a password; job records flows start after it */
 var fs=byId['first-signin'];var fj=byId['first-job'];fj.steps.unshift(fs.steps[1]);fj.starts=['Set password','Jobs'];
 fj.summary='For a business using job records. After picking a password (see First sign-in), the owner lands on an empty jobs list and adds the first job: customer, address, instructions, who\'s on it and before photos, on one screen.';
 var fw=byId['first-worker'];fw.steps.shift();fw.starts=['Set password','Jobs'];fw.summary='Adam picks a password (same screen as First sign-in) and finds the job waiting, with the instructions and before photos.';
 var drop={'first-signin':1,'states-auth':1};
 var keep=JR.FLOWS.filter(function(f){return !drop[f.id];});
 keep.forEach(function(f){f.id=t(f.id);f.title='Job records: '+f.title;if(f.next)f.next=drop[f.next]?'':t(f.next);});
 FLOWS.push.apply(FLOWS,keep);
 var add={'new':['first-job','first-worker'],'ret':['demo-overview','demo-progress','demo-extra','demo-complete','demo-search'],'states':['states-jobs','states-job']};
 JOURNEYS.forEach(function(j){var extra=(add[j.id]||[]).map(t);if(!extra.length)return;var last=flowById(j.flows[j.flows.length-1]);if(last&&!last.next)last.next=extra[0];j.flows=j.flows.concat(extra);});
 JOURNEYS[0].desc+=' Then a business using job records: the first job and a worker\'s first look at it.';
 JOURNEYS[1].desc+=' Then job records: one bathroom renovation from progress to completion, extra work that reaches the invoice, and finding past jobs.';
 JOURNEYS[2].desc+=' Job records: jobs list and job page states.';
 /* returning users sign in (forgot password is left out for now) */
 FLOWS.push({id:'sign-in',title:'Sign in',summary:'For anyone who was signed out or has a new phone. Email and password, then straight to Home with everything still there. There is no "Forgot password" yet: the owner or the platform team resends an invite.',starts:['Open the app'],next:'check-week',steps:[
  st('signin','phone','Sign in','Opens the app after signing out, or on a new phone.','Two fields and one button. In the shared app the top shows the app’s name, because the business isn’t known until he signs in; a white-label build shows the business, as here. Problems appear in a red box after he taps Sign in.',{email:'',pw:''}),
  st('signin','phone','Filled in','Types his email and password.','The password is hidden. Nothing else to choose: the account already says which business he belongs to.',{email:'pat@brightwood.example',pw:'xxxxxxxx'}),
  st('home','phone','Home, with everything there','Taps "Sign in".','Everything is stored online, so a new phone shows the full history straight away.',{role:'owner'})]});
 JOURNEYS[1].flows.unshift('sign-in');
 JR.PLANNED.forEach(function(p){PLANNED.push('job records: '+p);});
})();
