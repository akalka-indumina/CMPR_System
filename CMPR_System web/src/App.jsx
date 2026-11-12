import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { h } from './lib/h';
import { CM } from './components/complaints/ComplaintModal';
import { Modal } from './components/ui/Primitives';
import { Login } from './features/auth/Login';
import { Landing } from './features/auth/Landing';
import { Register } from './features/auth/Register';
import { RegistrationStatus } from './features/auth/RegistrationStatus';
import { B1, B2, NAV, PORTALS, PORTAL_OF, RL, TODAY } from './lib/constants';
import { loadAppData, persistAppData } from './lib/appData';
import { createUniqueId } from './lib/helpers';
import { PAGES } from './routes/pages';
import { Ic } from './components/ui/Icon';
import { NotificationPanel } from './features/shared/Notifications';

const THEME_STORAGE_KEY = 'pcms-demo-theme-v1';
const getInitialTheme = () => {
 if (typeof window === 'undefined') return 'dark';
 try {
  return window.localStorage.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark';
 } catch (error) {
  console.warn('Theme preference could not be read; using dark mode.', error);
  return 'dark';
 }
};

export default function App(){const nav=useNavigate(),{pathname,search}=useLocation(),parts=pathname.split('/').filter(Boolean),portal=parts[0],role=parts[1],page=parts[2],PT=PORTALS[portal],view=!PT?'landing':role=='login'?'login':role=='register'&&portal=='public'?'register':role=='registration-status'&&portal=='public'?'registrationStatus':PT.roles.includes(role)&&NAV[role].some(x=>x[0]==page)?'app':'login';
 const[data,setData]=useState(loadAppData),[activeUser,setActiveUser]=useState(null),[registrationDocuments,setRegistrationDocuments]=useState({}),[registrationReviewId,setRegistrationReviewId]=useState(null),[theme,setTheme]=useState(getInitialTheme),[notificationOpen,setNotificationOpen]=useState(false),[m,setM]=useState(null),[tt,stt]=useState(null),[cf,scf]=useState(null),[sb,ssb]=useState(false);
 const notificationRef=useRef(null);
 useEffect(()=>persistAppData(data),[data]);
 useEffect(()=>{if(typeof document!=='undefined')document.documentElement.dataset.theme=theme;try{window.localStorage.setItem(THEME_STORAGE_KEY,theme)}catch(error){console.warn('Theme preference could not be saved.',error)}},[theme]);
 useEffect(()=>{if(!notificationOpen)return;const closeOnOutside=event=>{if(!notificationRef.current?.contains(event.target))setNotificationOpen(false)};const closeOnEscape=event=>{if(event.key==='Escape')setNotificationOpen(false)};document.addEventListener('pointerdown',closeOnOutside);document.addEventListener('keydown',closeOnEscape);return()=>{document.removeEventListener('pointerdown',closeOnOutside);document.removeEventListener('keydown',closeOnEscape)}},[notificationOpen]);
 const setField=useCallback((key,update)=>setData(current=>{const value=typeof update=='function'?update(current[key]):update;return Object.is(value,current[key])?current:{...current,[key]:value}}),[]);
 const setC=useCallback(update=>setField('complaints',update),[setField]),setU=useCallback(update=>setField('users',update),[setField]),setACC=useCallback(update=>setField('accounts',update),[setField]),setSTN=useCallback(update=>setField('stations',update),[setField]),setOFF=useCallback(update=>setField('officers',update),[setField]),setN=useCallback(update=>setField('notifications',update),[setField]),setAUD=useCallback(update=>setField('audit',update),[setField]),setRA=useCallback(update=>setField('registrationApplications',update),[setField]);
 const setCurrentU=useCallback(update=>setField('users',current=>{const next=typeof update=='function'?update(current):update;if(activeUser?.role=='citizen'&&activeUser.id!=current.citizen.id)return{...next,citizen:current.citizen,citizens:(current.citizens||[]).map(user=>user.id==activeUser.id?next.citizen:user)};return next}),[activeUser,setField]);
 const C=data.complaints,U=data.users,ACC=data.accounts,STNS=data.stations,OFF=data.officers,N=data.notifications,AUD=data.audit,RA=data.registrationApplications;
 const go0=r=>{const[a,b]=r.split('-');if(a=='login')setActiveUser(null);nav(a=='landing'?'/':a=='login'?'/'+(b||portal||'staff')+'/login':a=='register'?'/public/register':'/'+PORTAL_OF[a]+'/'+a+'/'+b);ssb(false);setM(null);setNotificationOpen(false)};const ok=view=='app',login=user=>{setActiveUser(user);go0(user.role+'-'+NAV[user.role][0][0])};
 const toast=(m,t)=>{stt({m,t});setTimeout(()=>stt(null),2600)};const notify=(r,m,extra={})=>setN(n=>[{id:createUniqueId('NTF'),role:r,m,...extra,read:false},...n]);
 const submitRegistration=(application,files)=>{const submittedAt=application.submittedAt;setRA(current=>[application,...current]);setRegistrationDocuments(current=>({...current,[application.id]:files}));notify('admin',`New Citizen registration ${application.referenceNumber} awaits review.`);notify('citizen',`Registration application ${application.referenceNumber} submitted for review.`,{userId:application.applicantId});setAUD(current=>[{id:createUniqueId('ACT'),user:application.applicantId,userName:application.fullName,role:'Citizen Applicant',action:'Citizen registration submitted',desc:`Citizen registration submitted: ${application.referenceNumber}`,dt:submittedAt,ip:'local-demo',applicantId:application.applicantId,applicantName:application.fullName,relatedReference:application.referenceNumber,reviewedBy:''},...current]);nav('/public/registration-status/'+application.referenceNumber)};
 const act=(id,s,n,x={},to)=>{setC(cs=>cs.map(c=>c.id==id?{...c,...x,status:s,hist:[...c.hist,[s,TODAY,n]]}:c));notify('citizen',id+' is now: '+s);to&&notify(to,id+' needs attention: '+s)};
 const wrap=h2=>h`<div>${h2}${tt&&h`<div className=${'fixed bottom-4 right-4 z-[60] px-4 py-2 rounded-lg text-sm shadow-lg '+(tt.t=='err'?'bg-red-600':'bg-green-600')+' text-white'}>${tt.m}</div>`}${cf&&h`<${Modal} t="Please confirm" close=${()=>scf(null)} w="max-w-sm"><p className="text-sm mb-4">${cf.m}</p><div className="flex justify-end gap-2"><button className=${B2} onClick=${()=>scf(null)}>Cancel</button><button className=${B1} onClick=${()=>{const f=cf.f;scf(null);f()}}>Confirm</button></div><//>`}</div>`;
 const reapplyRef=new URLSearchParams(search).get('reapply'),previousApplication=RA.find(application=>application.referenceNumber===reapplyRef&&application.status==='Rejected');
 if(view=='landing')return wrap(h`<${Landing} go=${go0}/>`);
 if(view=='registrationStatus'){const application=RA.find(item=>item.referenceNumber===page);return wrap(h`<${RegistrationStatus} application=${application} onLogin=${()=>go0('login-public')} onReapply=${item=>nav('/public/register?reapply='+encodeURIComponent(item.referenceNumber))}/>`);};
 if(view=='register')return wrap(h`<${Register} go=${go0} toast=${toast} users=${U} applications=${RA} stations=${STNS} previousApplication=${previousApplication} onSubmit=${submitRegistration}/>`);
 if(!ok||role=='citizen'&&activeUser?.role!='citizen')return wrap(h`<${Login} portal=${PT?portal:'staff'} go=${go0} users=${U} applications=${RA} onLogin=${login} onStatus=${reference=>nav('/public/registration-status/'+encodeURIComponent(reference))} toast=${toast}/>`);
 const user=role=='citizen'&&activeUser?.role=='citizen'?(U.citizens||[]).find(x=>x.id==activeUser.id)||U.citizen:U[role],visibleUsers=role=='citizen'&&user.id!=U.citizen.id?{...U,citizen:user}:U,S={role,user,C,setC,OFF,setOFF,ACC,setACC,STN:STNS,setSTN,AUD,setAUD,N,setN,U:visibleUsers,setU:setCurrentU,RA,setRA,registrationDocuments,setRegistrationDocuments,registrationReviewId,setRegistrationReviewId,setM,toast,notify,act,ask:(m,f)=>scf({m,f}),go:p=>go0(role+'-'+p)};
 const P=PAGES[role][page],unread=N.filter(n=>n.role==role&&(!n.userId||n.userId==user.id)&&!n.read).length;
 return wrap(h`<div className="min-h-screen flex">${sb&&h`<div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick=${()=>ssb(false)}></div>`}
 <aside className=${'fixed lg:sticky top-0 h-screen z-40 w-64 shrink-0 bg-sb border-r border-bd flex flex-col transition-transform '+(sb?'':'-translate-x-full lg:translate-x-0')}><div className="p-4 flex items-center gap-2 border-b border-bd"><div className="w-8 h-8 rounded-lg bg-pr flex items-center justify-center"><${Ic} n="shield" s=${18}/></div><div className="text-xs font-semibold leading-tight">Police Complaint<br/>Management System</div></div><nav className="flex-1 overflow-y-auto p-2 space-y-1">${NAV[role].map(([k,l,i])=>h`<button key=${k} onClick=${()=>S.go(k)} className=${'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left '+(k==page?'bg-pr text-white':'text-mu hover:bg-ip hover:text-tx')}><${Ic} n=${i}/>${l}</button>`)}</nav><button onClick=${()=>go0('login')} className="m-2 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-mu hover:bg-ip"><${Ic} n="logout"/>Logout</button></aside>
 <div className="flex-1 min-w-0"><header className="sticky top-0 z-20 bg-bg/90 backdrop-blur border-b border-bd flex items-center justify-between px-4 py-3"><div className="flex items-center gap-3"><button className="lg:hidden p-1" onClick=${()=>ssb(true)}><${Ic} n="menu"/></button><div className="text-sm"><b>${user.name}</b> <span className="text-mu">\u00b7 ${RL[role]}</span></div></div><div className="flex items-center gap-1"><div className="relative" ref=${notificationRef}><button type="button" aria-label="Notifications" aria-expanded=${notificationOpen} aria-controls="notification-panel" title="Notifications" className="relative p-2 text-mu hover:text-tx rounded-lg hover:bg-ip" onClick=${()=>setNotificationOpen(open=>!open)}><${Ic} n="bell"/>${unread>0&&h`<span className="absolute -top-0.5 -right-0.5 bg-pr text-[10px] rounded-full w-4 h-4 flex items-center justify-center">${unread}</span>`}</button>${notificationOpen&&h`<${NotificationPanel} S=${S} onClose=${()=>setNotificationOpen(false)}/>`}</div><button type="button" aria-label=${theme==='dark'?'Switch to light mode':'Switch to dark mode'} title=${theme==='dark'?'Switch to light mode':'Switch to dark mode'} className="p-2 text-mu hover:text-tx rounded-lg hover:bg-ip" onClick=${()=>setTheme(current=>current==='dark'?'light':'dark')}><${Ic} n=${theme==='dark'?'sun':'moon'}/></button></div></header><main className="p-4 lg:p-6"><${P} S=${S}/></main></div>${m&&h`<${CM} S=${S} id=${m}/>`}</div>`)}
