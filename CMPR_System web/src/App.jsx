import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { h } from './lib/h';
import { CM } from './components/complaints/ComplaintModal';
import { Modal } from './components/ui/Primitives';
import { ACC0 } from './data/accounts';
import { AUD0 } from './data/audit';
import { CMP0 } from './data/complaints';
import { OFF0 } from './data/officers';
import { STN } from './data/stations';
import { U0 } from './data/users';
import { Login } from './features/auth/Login';
import { Landing } from './features/auth/Landing';
import { Register } from './features/auth/Register';
import { B1, B2, NAV, PORTALS, PORTAL_OF, RL, TODAY } from './lib/constants';
import { PAGES } from './routes/pages';
import { Ic } from './components/ui/Icon';

export default function App(){const nav=useNavigate(),{pathname}=useLocation(),parts=pathname.split('/').filter(Boolean),portal=parts[0],role=parts[1],page=parts[2],PT=PORTALS[portal],view=!PT?'landing':role=='login'?'login':role=='register'&&portal=='public'?'register':PT.roles.includes(role)&&NAV[role].some(x=>x[0]==page)?'app':'login';
 const[C,setC]=useState(CMP0),[OFF,setOFF]=useState(OFF0),[ACC,setACC]=useState(ACC0),[STNS,setSTN]=useState(STN),[U,setU]=useState(U0),[m,setM]=useState(null),[tt,stt]=useState(null),[cf,scf]=useState(null),[sb,ssb]=useState(false);
 const[N,setN]=useState([{id:1,role:'citizen',m:'Complaint CMP-2026-0102 was assigned to an officer.',read:false},{id:2,role:'citizen',m:'Your complaint CMP-2026-0103 is under review.',read:false},{id:3,role:'station',m:'New complaint CMP-2026-0105 received.',read:false},{id:4,role:'station',m:'Investigation completed on CMP-2026-0107. Review required.',read:false},{id:5,role:'officer',m:'CMP-2026-0102 assigned to you.',read:false},{id:6,role:'admin',m:'Monthly report is ready.',read:true}]);
 const go0=r=>{const[a,b]=r.split('-');nav(a=='landing'?'/':a=='login'?'/'+(b||portal||'staff')+'/login':a=='register'?'/public/register':'/'+PORTAL_OF[a]+'/'+a+'/'+b);ssb(false);setM(null)};const ok=view=='app';
 const toast=(m,t)=>{stt({m,t});setTimeout(()=>stt(null),2600)};const notify=(r,m)=>setN(n=>[{id:Date.now()+Math.random(),role:r,m,read:false},...n]);
 const act=(id,s,n,x={},to)=>{setC(cs=>cs.map(c=>c.id==id?{...c,...x,status:s,hist:[...c.hist,[s,TODAY,n]]}:c));notify('citizen',id+' is now: '+s);to&&notify(to,id+' needs attention: '+s)};
 const wrap=h2=>h`<div>${h2}${tt&&h`<div className=${'fixed bottom-4 right-4 z-[60] px-4 py-2 rounded-lg text-sm shadow-lg '+(tt.t=='err'?'bg-red-600':'bg-green-600')+' text-white'}>${tt.m}</div>`}${cf&&h`<${Modal} t="Please confirm" close=${()=>scf(null)} w="max-w-sm"><p className="text-sm mb-4">${cf.m}</p><div className="flex justify-end gap-2"><button className=${B2} onClick=${()=>scf(null)}>Cancel</button><button className=${B1} onClick=${()=>{const f=cf.f;scf(null);f()}}>Confirm</button></div><//>`}</div>`;
 if(view=='landing')return wrap(h`<${Landing} go=${go0}/>`);
 if(view=='register')return wrap(h`<${Register} go=${go0} toast=${toast}/>`);
 if(!ok)return wrap(h`<${Login} portal=${PT?portal:'staff'} go=${go0}/>`);
 const user=U[role],S={role,user,C,setC,OFF,setOFF,ACC,setACC,STN:STNS,setSTN,AUD:AUD0,N,setN,U,setU,setM,toast,notify,act,ask:(m,f)=>scf({m,f}),go:p=>go0(role+'-'+p)};
 const P=PAGES[role][page],unread=N.filter(n=>n.role==role&&!n.read).length;
 return wrap(h`<div className="min-h-screen flex">${sb&&h`<div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick=${()=>ssb(false)}></div>`}
 <aside className=${'fixed lg:sticky top-0 h-screen z-40 w-64 shrink-0 bg-sb border-r border-bd flex flex-col transition-transform '+(sb?'':'-translate-x-full lg:translate-x-0')}><div className="p-4 flex items-center gap-2 border-b border-bd"><div className="w-8 h-8 rounded-lg bg-pr flex items-center justify-center"><${Ic} n="shield" s=${18}/></div><div className="text-xs font-semibold leading-tight">Police Complaint<br/>Management System</div></div><nav className="flex-1 overflow-y-auto p-2 space-y-1">${NAV[role].map(([k,l,i])=>h`<button key=${k} onClick=${()=>S.go(k)} className=${'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left '+(k==page?'bg-pr text-white':'text-mu hover:bg-ip hover:text-tx')}><${Ic} n=${i}/>${l}</button>`)}</nav><button onClick=${()=>go0('login')} className="m-2 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-mu hover:bg-ip"><${Ic} n="logout"/>Logout</button></aside>
 <div className="flex-1 min-w-0"><header className="sticky top-0 z-20 bg-bg/90 backdrop-blur border-b border-bd flex items-center justify-between px-4 py-3"><div className="flex items-center gap-3"><button className="lg:hidden p-1" onClick=${()=>ssb(true)}><${Ic} n="menu"/></button><div className="text-sm"><b>${user.name}</b> <span className="text-mu">\u00b7 ${RL[role]}</span></div></div><button className="relative p-2" onClick=${()=>S.go('notifs'==page||NAV[role].some(x=>x[0]=='notifs')?'notifs':page)}><${Ic} n="bell"/>${unread>0&&h`<span className="absolute -top-0.5 -right-0.5 bg-pr text-[10px] rounded-full w-4 h-4 flex items-center justify-center">${unread}</span>`}</button></header><main className="p-4 lg:p-6"><${P} S=${S}/></main></div>${m&&h`<${CM} S=${S} id=${m}/>`}</div>`)}
