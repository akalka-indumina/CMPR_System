import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { h } from './lib/h';
import { CM } from './components/complaints/ComplaintModal';
import { Modal } from './components/ui/Primitives';
import { Login } from './features/auth/Login';
import { Register } from './features/auth/Register';
import { RegistrationStatus } from './features/auth/RegistrationStatus';
import { B1, B2, NAV, PORTAL_OF, RL, TODAY } from './lib/constants';
import {
 initializeSharedAppData,
 loadAppData,
 loadSharedAppData,
 persistAppData,
 persistSharedAppData,
 saveSharedRegistrationDocuments,
} from './lib/appData';
import { createUniqueId } from './lib/helpers';
import { PAGES } from './routes/pages';
import { Ic } from './components/ui/Icon';
import { NotificationPanel } from './features/shared/Notifications';

const THEME_STORAGE_KEY = 'pcms-demo-theme-v1';
const CITIZEN_SESSION_KEY = 'pcms-citizen-session-v1';
const STAFF_SESSION_KEY = 'pcms-staff-session-v1';
const getRolePath = (role,page) => role==='citizen'?`/citizen/${page}`:`/${PORTAL_OF[role]}/${role}/${page}`;
const getRoleHome = role => getRolePath(role,NAV[role][0][0]);
const getLoginPath = () => '/';
const getInitialTheme = () => {
 if (typeof window === 'undefined') return 'dark';
 try {
  return window.localStorage.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark';
 } catch (error) {
  console.warn('Theme preference could not be read; using dark mode.', error);
  return 'dark';
 }
};

export default function App(){
 const nav=useNavigate(),{pathname,search}=useLocation(),parts=pathname.split('/').filter(Boolean);
 const routeRoot=parts[0];
 const portal=import.meta.env.MODE==='staff'?'staff':'public';
 const role=parts[0]==='staff'||parts[0]==='public'?parts[1]:parts[0]==='citizen'?'citizen':undefined;
 const page=parts[0]==='staff'||parts[0]==='public'?parts[2]:parts[0]==='citizen'?parts[1]:undefined;
 const isPublicLogin=pathname==='/'||pathname==='/public'||pathname==='/public/login';
 const isStaffLogin=pathname==='/staff'||pathname==='/staff/login';
 const isRegister=pathname==='/register'||pathname==='/public/register';
 const statusIndex=parts[0]==='public'&&parts[1]==='registration-status'?2:parts[0]==='registration-status'?1:-1;
 const isRegistrationStatus=statusIndex>=0&&parts.length>statusIndex;
 const isDashboard=Boolean(NAV[role]?.some(item=>item[0]===page));
 const view=isPublicLogin||isStaffLogin?'login':isRegister?'register':isRegistrationStatus?'registrationStatus':isDashboard?'app':'notFound';
 const[data,setData]=useState(loadAppData),[sharedDataReady,setSharedDataReady]=useState(!import.meta.env.DEV),[activeUser,setActiveUser]=useState(null),[sessionReady,setSessionReady]=useState(false),[registrationDocuments,setRegistrationDocuments]=useState({}),[registrationReviewId,setRegistrationReviewId]=useState(null),[theme,setTheme]=useState(getInitialTheme),[notificationOpen,setNotificationOpen]=useState(false),[m,setM]=useState(null),[tt,stt]=useState(null),[cf,scf]=useState(null),[sb,ssb]=useState(false);
 const notificationRef=useRef(null);
 useEffect(()=>{
  if(!import.meta.env.DEV)return;
  let mounted=true;
  initializeSharedAppData(loadAppData(),portal).then(sharedData=>{
   if(mounted){setData(sharedData);setSharedDataReady(true)}
  }).catch(error=>{
   console.error('Shared demo data could not be initialized.',error);
   if(mounted)setSharedDataReady(true);
  });
  return()=>{mounted=false};
 },[portal]);
 useEffect(()=>{
  if(!sharedDataReady||!import.meta.env.DEV)return;
  let mounted=true,reportedError=false;
  const poll=async()=>{
   try{
    const sharedData=await loadSharedAppData();
    if(sharedData&&mounted){
     setData(current=>JSON.stringify(current)===JSON.stringify(sharedData)?current:sharedData);
    }
    reportedError=false;
   }catch(error){
    if(mounted&&!reportedError)console.error('Shared demo data could not be refreshed.',error);
    reportedError=true;
   }
  };
  const timer=window.setInterval(poll,1000);
  return()=>{mounted=false;window.clearInterval(timer)};
 },[sharedDataReady]);
 useEffect(()=>{
  if(!sharedDataReady)return;
  setSessionReady(false);
  try{
   const keys=portal==='staff'
    ?[STAFF_SESSION_KEY,CITIZEN_SESSION_KEY]
    :[CITIZEN_SESSION_KEY,STAFF_SESSION_KEY];
   let restoredUser=null;
   for(const key of keys){
    const saved=window.sessionStorage.getItem(key);
    if(!saved)continue;
    const session=JSON.parse(saved);
    const accountRole=session?.role;
    const account=accountRole==='citizen'
     ?[data.users.citizen,...(data.users.citizens||[])].find(user=>user.id===session.id&&user.status==='Approved')
     :['admin','station','officer'].includes(accountRole)&&data.users[accountRole]?.id===session?.id
      ?data.users[accountRole]:null;
    if(account&&PORTAL_OF[accountRole]===(key===STAFF_SESSION_KEY?'staff':'public')){
     restoredUser={role:accountRole,id:account.id};
     break;
    }
    window.sessionStorage.removeItem(key);
   }
   setActiveUser(restoredUser);
  }catch(error){
   console.warn('Authentication session could not be restored.',error);
   setActiveUser(null);
  }
  setSessionReady(true);
 },[portal,data.users,sharedDataReady]);
 useEffect(()=>{
  if(!sharedDataReady)return;
  if(!sessionReady)return;
  if((pathname==='/public'||pathname==='/public/login')||pathname==='/staff/login'){
   nav('/',{replace:true});
   return;
  }
  if(pathname==='/staff'){
   nav('/',{replace:true});
   return;
  }
  if(view==='register'&&portal==='staff'){
   nav('/',{replace:true});
   return;
  }
  if(view==='registrationStatus'&&portal==='staff'){
   nav('/',{replace:true});
   return;
  }
  if(view==='register'&&pathname==='/public/register'){
   nav('/register'+search,{replace:true});
   return;
  }
  if(view==='registrationStatus'&&routeRoot==='public'){
   nav('/registration-status/'+encodeURIComponent(parts[statusIndex]),{replace:true});
   return;
  }
  if(view==='notFound'){
   nav('/',{replace:true});
   return;
  }
  if(view!=='app')return;
  if(routeRoot==='public'&&role==='citizen'){
   nav(getRolePath(role,page),{replace:true});
   return;
  }
  if(activeUser?.role==='citizen'&&portal==='staff'){
   nav('/',{replace:true});
   return;
  }
  if(PORTAL_OF[role]!==portal){
   if(!activeUser)nav(getLoginPath(role),{replace:true});
   else if(activeUser.role===role)nav(getRoleHome(role),{replace:true});
   else nav(getRoleHome(activeUser.role),{replace:true});
   return;
  }
  if(!activeUser)nav(getLoginPath(role),{replace:true});
  else if(activeUser.role!==role)nav(getRoleHome(activeUser.role),{replace:true});
 },[activeUser,nav,page,pathname,portal,role,routeRoot,search,sessionReady,sharedDataReady,statusIndex,view]);
 useEffect(()=>{
  if(!sharedDataReady)return;
  persistAppData(data);
  if(import.meta.env.DEV)persistSharedAppData(data).catch(error=>console.error('Shared demo data could not be saved.',error));
 },[data,sharedDataReady]);
 useEffect(()=>{if(typeof document!=='undefined')document.documentElement.dataset.theme=theme;try{window.localStorage.setItem(THEME_STORAGE_KEY,theme)}catch(error){console.warn('Theme preference could not be saved.',error)}},[theme]);
 useEffect(()=>{if(!notificationOpen)return;const closeOnOutside=event=>{if(!notificationRef.current?.contains(event.target))setNotificationOpen(false)};const closeOnEscape=event=>{if(event.key==='Escape')setNotificationOpen(false)};document.addEventListener('pointerdown',closeOnOutside);document.addEventListener('keydown',closeOnEscape);return()=>{document.removeEventListener('pointerdown',closeOnOutside);document.removeEventListener('keydown',closeOnEscape)}},[notificationOpen]);
 const setField=useCallback((key,update)=>setData(current=>{const value=typeof update=='function'?update(current[key]):update;return Object.is(value,current[key])?current:{...current,[key]:value}}),[]);
 const setC=useCallback(update=>setField('complaints',update),[setField]),setU=useCallback(update=>setField('users',update),[setField]),setACC=useCallback(update=>setField('accounts',update),[setField]),setSTN=useCallback(update=>setField('stations',update),[setField]),setOFF=useCallback(update=>setField('officers',update),[setField]),setN=useCallback(update=>setField('notifications',update),[setField]),setAUD=useCallback(update=>setField('audit',update),[setField]),setRA=useCallback(update=>setField('registrationApplications',update),[setField]);
 const setCurrentU=useCallback(update=>setField('users',current=>{const next=typeof update=='function'?update(current):update;if(activeUser?.role=='citizen'&&activeUser.id!=current.citizen.id)return{...next,citizen:current.citizen,citizens:(current.citizens||[]).map(user=>user.id==activeUser.id?next.citizen:user)};return next}),[activeUser,setField]);
 const C=data.complaints,U=data.users,ACC=data.accounts,STNS=data.stations,OFF=data.officers,N=data.notifications,AUD=data.audit,RA=data.registrationApplications;
 const go0=r=>{const[a,b]=r.split('-');nav(a=='login'?'/':a=='register'?'/register':getRolePath(a,b));ssb(false);setM(null);setNotificationOpen(false)};
 const login=user=>{
  const key=user.role==='citizen'?CITIZEN_SESSION_KEY:STAFF_SESSION_KEY;
  try{
   window.sessionStorage.removeItem(user.role==='citizen'?STAFF_SESSION_KEY:CITIZEN_SESSION_KEY);
   window.sessionStorage.setItem(key,JSON.stringify({role:user.role,id:user.id}));
  }catch(error){
   console.error('Authentication session could not be saved.',error);
   toast('Could not establish a browser session. Please enable session storage and try again.','err');
   return;
  }
  setActiveUser(user);
  nav(getRoleHome(user.role),{replace:true});
 };
 const logout=()=>{
  const citizen=activeUser?.role==='citizen';
  try{
   window.sessionStorage.removeItem(citizen?CITIZEN_SESSION_KEY:STAFF_SESSION_KEY);
  }catch(error){
   console.error('Authentication session could not be cleared.',error);
   toast('Could not clear the browser session. Please try again.','err');
   return;
  }
  setActiveUser(null);
  nav('/',{replace:true});
 };
 const toast=(m,t)=>{stt({m,t});setTimeout(()=>stt(null),2600)};const notify=(r,m,extra={})=>setN(n=>[{id:createUniqueId('NTF'),role:r,m,...extra,read:false},...n]);
 const submitRegistration=async(application,files)=>{const submittedAt=application.submittedAt,resubmitted=Boolean(application.previousApplicationId),auditAction=resubmitted?'Citizen registration resubmitted':'Citizen registration submitted';if(import.meta.env.DEV)await saveSharedRegistrationDocuments(application.id,files);setRA(current=>[application,...current]);setRegistrationDocuments(current=>({...current,[application.id]:files}));notify('admin',`New Citizen registration ${application.referenceNumber} awaits review.`);notify('citizen',`Registration application ${application.referenceNumber} submitted for review.`,{userId:application.applicantId});setAUD(current=>[{id:createUniqueId('ACT'),user:application.applicantId,userName:application.fullName,role:'Citizen Applicant',action:auditAction,desc:`${auditAction}: ${application.referenceNumber}`,dt:submittedAt,ip:'local-demo',applicantId:application.applicantId,applicantName:application.fullName,relatedReference:application.referenceNumber,reviewedBy:''},...current]);nav('/registration-status/'+application.referenceNumber)};
 const act=(id,s,n,x={},to)=>{setC(cs=>cs.map(c=>c.id==id?{...c,...x,status:s,hist:[...c.hist,[s,TODAY,n]]}:c));notify('citizen',id+' is now: '+s);to&&notify(to,id+' needs attention: '+s)};
 const wrap=h2=>h`<div>${h2}${tt&&h`<div className=${'fixed bottom-4 right-4 z-[60] px-4 py-2 rounded-lg text-sm shadow-lg '+(tt.t=='err'?'bg-red-600':'bg-green-600')+' text-white'}>${tt.m}</div>`}${cf&&h`<${Modal} t="Please confirm" close=${()=>scf(null)} w="max-w-sm"><p className="text-sm mb-4">${cf.m}</p><div className="flex justify-end gap-2"><button className=${B2} onClick=${()=>scf(null)}>Cancel</button><button className=${B1} onClick=${()=>{const f=cf.f;scf(null);f()}}>Confirm</button></div><//>`}</div>`;
 const reapplyRef=new URLSearchParams(search).get('reapply'),previousApplication=RA.find(application=>application.referenceNumber===reapplyRef&&application.status==='Rejected');
 if(!sharedDataReady)return h`<div className="min-h-screen flex items-center justify-center text-sm text-mu">Loading portal data...</div>`;
 if(portal==='staff'&&(view==='register'||view==='registrationStatus'))return null;
 if(view==='registrationStatus'){const application=RA.find(item=>item.referenceNumber===parts[statusIndex]);return wrap(h`<${RegistrationStatus} application=${application} onLogin=${()=>go0('login-public')} onReapply=${item=>nav('/register?reapply='+encodeURIComponent(item.referenceNumber))}/>`);};
 if(view==='register')return wrap(h`<${Register} go=${go0} toast=${toast} users=${U} applications=${RA} previousApplication=${previousApplication} onSubmit=${submitRegistration}/>`); 
 if(view==='login')return wrap(h`<${Login} portal=${portal} go=${go0} users=${U} applications=${RA} onLogin=${login} onStatus=${reference=>nav('/registration-status/'+encodeURIComponent(reference))} toast=${toast}/>`); 
 if(!sessionReady||!activeUser||activeUser.role!==role||PORTAL_OF[role]!==portal)return null;
 const user=role=='citizen'&&activeUser?.role=='citizen'?(U.citizens||[]).find(x=>x.id==activeUser.id)||U.citizen:U[role],visibleUsers=role=='citizen'&&user.id!=U.citizen.id?{...U,citizen:user}:U,S={role,user,C,setC,OFF,setOFF,ACC,setACC,STN:STNS,setSTN,AUD,setAUD,N,setN,U:visibleUsers,setU:setCurrentU,RA,setRA,registrationDocuments,setRegistrationDocuments,registrationReviewId,setRegistrationReviewId,setM,toast,notify,act,ask:(m,f)=>scf({m,f}),go:p=>go0(role+'-'+p)};
 const P=PAGES[role][page],unread=N.filter(n=>n.role==role&&(!n.userId||n.userId==user.id)&&!n.read).length;
 return wrap(h`<div className="min-h-screen flex">${sb&&h`<div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick=${()=>ssb(false)}></div>`}
 <aside className=${'fixed lg:sticky top-0 h-screen z-40 w-64 shrink-0 bg-sb border-r border-bd flex flex-col transition-transform '+(sb?'':'-translate-x-full lg:translate-x-0')}><div className="p-4 flex items-center gap-2 border-b border-bd"><div className="w-8 h-8 rounded-lg bg-pr flex items-center justify-center"><${Ic} n="shield" s=${18}/></div><div className="text-xs font-semibold leading-tight">Police Complaint<br/>Management System</div></div><nav className="flex-1 overflow-y-auto p-2 space-y-1">${NAV[role].map(([k,l,i])=>h`<button key=${k} onClick=${()=>S.go(k)} className=${'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left '+(k==page?'bg-pr text-white':'text-mu hover:bg-ip hover:text-tx')}><${Ic} n=${i}/>${l}</button>`)}</nav><button onClick=${logout} className="m-2 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-mu hover:bg-ip"><${Ic} n="logout"/>Logout</button></aside>
 <div className="flex-1 min-w-0"><header className="sticky top-0 z-20 bg-bg/90 backdrop-blur border-b border-bd flex items-center justify-between px-4 py-3"><div className="flex items-center gap-3"><button className="lg:hidden p-1" onClick=${()=>ssb(true)}><${Ic} n="menu"/></button><div className="text-sm"><b>${user.name}</b> <span className="text-mu">\u00b7 ${RL[role]}</span></div></div><div className="flex items-center gap-1"><div className="relative" ref=${notificationRef}><button type="button" aria-label="Notifications" aria-expanded=${notificationOpen} aria-controls="notification-panel" title="Notifications" className="relative p-2 text-mu hover:text-tx rounded-lg hover:bg-ip" onClick=${()=>setNotificationOpen(open=>!open)}><${Ic} n="bell"/>${unread>0&&h`<span className="absolute -top-0.5 -right-0.5 bg-pr text-[10px] rounded-full w-4 h-4 flex items-center justify-center">${unread}</span>`}</button>${notificationOpen&&h`<${NotificationPanel} S=${S} onClose=${()=>setNotificationOpen(false)}/>`}</div><button type="button" aria-label=${theme==='dark'?'Switch to light mode':'Switch to dark mode'} title=${theme==='dark'?'Switch to light mode':'Switch to dark mode'} className="p-2 text-mu hover:text-tx rounded-lg hover:bg-ip" onClick=${()=>setTheme(current=>current==='dark'?'light':'dark')}><${Ic} n=${theme==='dark'?'sun':'moon'}/></button></div></header><main className="p-4 lg:p-6"><${P} S=${S}/></main></div>${m&&h`<${CM} S=${S} id=${m}/>`}</div>`)}
