import { useState } from 'react';
import { h } from '../../lib/h';
import { Fld } from '../../components/ui/Primitives';
import { B1, B2, INP } from '../../lib/constants';

export function Register({go,toast}){const E={n:'',nic:'',e:'',p:'',a:'',pw:'',c:''},[f,sf]=useState(E),[er,ser]=useState({});const s=k=>e=>sf({...f,[k]:e.target.value});const L=[['n','Full name'],['nic','NIC number'],['e','Email'],['p','Phone number'],['a','Address'],['pw','Password'],['c','Confirm password']];
 const sub=()=>{const e={};L.forEach(([k])=>!f[k].trim()&&(e[k]='Required'));if(f.e&&!/^\S+@\S+\.\S+$/.test(f.e))e.e='Invalid email';if(f.nic&&!/^(\d{9}[VvXx]|\d{12})$/.test(f.nic))e.nic='Use 9 digits + V or 12 digits';if(f.pw&&f.pw.length<8)e.pw='At least 8 characters';if(f.pw!=f.c)e.c='Passwords do not match';ser(e);if(Object.keys(e).length)return toast('Please fix the highlighted fields','err');toast('Registration successful. Sign in to continue.');go('login')};
 return h`<div className="min-h-screen flex items-center justify-center p-4"><div className="w-full max-w-lg bg-cd border border-bd rounded-xl p-6"><h1 className="font-bold text-lg mb-4">Citizen registration</h1><div className="grid sm:grid-cols-2 gap-3">${L.map(([k,l])=>h`<${Fld} key=${k} l=${l} err=${er[k]}><input className=${INP} type=${k=='pw'||k=='c'?'password':'text'} value=${f[k]} onChange=${s(k)}/><//>`)}</div><div className="flex gap-2 mt-4"><button className=${B1} onClick=${sub}>Register</button><button className=${B2} onClick=${()=>go('login')}>Back to sign in</button></div></div></div>`}
