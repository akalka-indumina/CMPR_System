import { useState } from 'react';
import { h } from '../../lib/h';
import { Card, Fld, Pg } from '../../components/ui/Primitives';
import { B1, B2, INP } from '../../lib/constants';

export function Profile({S}){const u=S.user,[e,se]=useState(false),[d,sd2]=useState(u);const F=[['name','Full name'],...(S.role=='citizen'?[['nic','NIC']]:[['id','ID']]),['email','Email'],['tel','Phone number'],['addr','Address']];return h`<${Pg} t="Profile"><button className=${e?B2:B1} onClick=${()=>{se(!e);sd2(u)}}>${e?'Cancel':'Edit profile'}</button><//><${Card}><div className="grid sm:grid-cols-2 gap-3">${F.map(([k,l])=>h`<${Fld} key=${k} l=${l}><input className=${INP} disabled=${!e||k=='id'||k=='nic'} value=${d[k]||''} onChange=${x=>sd2({...d,[k]:x.target.value})}/><//>`)}</div>${e&&h`<button className=${B1+' mt-4'} onClick=${()=>!/^\S+@\S+\.\S+$/.test(d.email)||!d.name.trim()?S.toast('Enter a valid name and email','err'):(S.setU({...S.U,[S.role]:d}),se(false),S.toast('Profile updated'))}>Save profile</button>`}<//>`}
