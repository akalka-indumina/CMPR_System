import { useState } from 'react';
import { h } from '../../lib/h';
import { Bd } from '../../components/ui/Badge';
import { Bar, Card, Fld, Modal, Pg, Sel } from '../../components/ui/Primitives';
import { Tbl } from '../../components/ui/Table';
import { B1, B2, INP } from '../../lib/constants';
import { createUniqueId } from '../../lib/helpers';
import { hashPassword } from '../../lib/credentials';

export const CF = {
  acc: {
    t: 'Station Account',
    k: 'accounts',
    role: 'station',
    f: [
      ['id', 'Account ID'], ['name', 'Account Holder Name'], ['email', 'Email'],
      ['tel', 'Contact Number'], ['station', 'Police Station', 'stn'],
      ['pw', 'Password', 'pw'], ['pw2', 'Confirm Password', 'pw'],
      ['active', 'Account Status', 'act'],
    ],
    c: ['id', 'name', 'station', 'email'],
  },
  off: {
    t: 'Police Officer',
    k: 'officers',
    role: 'officer',
    f: [
      ['id', 'Officer ID'], ['name', 'Full Name'], ['nic', 'NIC'], ['email', 'Email'],
      ['tel', 'Contact Number'], ['rank', 'Rank', 'rank'], ['station', 'Police Station', 'stn'],
      ['pw', 'Password', 'pw'], ['pw2', 'Confirm Password', 'pw'],
      ['active', 'Account Status', 'act'],
    ],
    c: ['id', 'name', 'rank', 'station', 'tel'],
  },
};

export function Crud({ S, kind }) {
  const cf = CF[kind];
  const data = kind === 'acc' ? S.ACC : S.OFF;
  const setData = kind === 'acc' ? S.setACC : S.setOFF;
  const [query, setQuery] = useState('');
  const [stationFilter, setStationFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [form, setForm] = useState(null);
  const [view, setView] = useState(null);
  const [errors, setErrors] = useState({});
  const selectedStation = S.STN.find(station => station.name === stationFilter);
  const rows = data.filter(item => (
    `${item.id} ${item.name} ${item.email || ''}`.toLowerCase().includes(query.toLowerCase())
    && (!stationFilter || item.stationCode === selectedStation?.code)
    && (!activeFilter || (item.active ? 'Active' : 'Inactive') === activeFilter)
  ));

  const save = async () => {
    const values = form.data;
    const existingUser = S.USERS.find(user => user.role === cf.role && user.profileId === values.id);
    const nextErrors = {};
    for (const [key] of cf.f) {
      if (key === 'pw2') {
        if (values.pw !== values.pw2) nextErrors.pw2 = 'Passwords do not match';
      } else if (key === 'pw' && (!form.edit || !existingUser?.passwordHash) && !values.pw) {
        nextErrors.pw = 'A password is required for this account';
      } else if (!['pw', 'pw2', 'active'].includes(key) && !String(values[key] || '').trim()) {
        nextErrors[key] = 'Required';
      }
    }
    if (values.email && !/^\S+@\S+\.\S+$/.test(values.email.trim())) {
      nextErrors.email = 'Enter a valid email';
    }
    if (values.pw && values.pw.length < 8) {
      nextErrors.pw = 'Use at least 8 characters';
    }
    if (S.USERS.some(user => user.id !== existingUser?.id
      && user.email.toLowerCase() === values.email.trim().toLowerCase())) {
      nextErrors.email = 'Email is already in use';
    }
    if (!form.edit && data.some(item => item.id === values.id)) {
      nextErrors.id = 'ID already exists';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      S.toast('Please fix the highlighted fields.', 'err');
      return;
    }

    try {
      const { pw, pw2, email, ...profile } = values;
      const station = S.STN.find(item => item.name === profile.station);
      const savedProfile = { ...profile, stationCode: station?.code || profile.stationCode };
      const credentials = pw ? await hashPassword(pw) : {
        passwordSalt: existingUser.passwordSalt,
        passwordHash: existingUser.passwordHash,
      };
      const authUser = {
        id: existingUser?.id || createUniqueId('USR'),
        email: email.trim().toLowerCase(),
        ...credentials,
        role: cf.role,
        profileId: savedProfile.id,
        active: Boolean(savedProfile.active),
      };
      setData(current => form.edit
        ? current.map(item => item.id === savedProfile.id ? savedProfile : item)
        : [savedProfile, ...current]);
      S.setU(current => existingUser
        ? current.map(user => user.id === existingUser.id ? authUser : user)
        : [...current, authUser]);
      setForm(null);
      S.toast(`${cf.t}${form.edit ? ' updated' : ' created'}`);
    } catch (error) {
      console.error('Account credentials could not be saved.', error);
      S.toast(error instanceof Error ? error.message : 'Account credentials could not be saved.', 'err');
    }
  };

  const toggle = item => {
    const authUser = S.USERS.find(user => user.role === cf.role && user.profileId === item.id);
    if (!item.active && !authUser?.passwordHash) {
      S.toast('Set a password before activating this account.', 'err');
      return;
    }
    const active = !item.active;
    S.ask(`${active ? 'Activate' : 'Deactivate'} ${item.name}?`, () => {
      setData(current => current.map(value => value.id === item.id ? { ...value, active } : value));
      S.setU(current => current.map(user => (
        user.role === cf.role && user.profileId === item.id ? { ...user, active } : user
      )));
      S.toast(`${item.name}${active ? ' activated' : ' deactivated'}`);
    });
  };

  const columns = {
    id: ['ID', item => item.id, 'id'],
    name: ['Name', item => item.name, 'name'],
    station: ['Station', item => item.station, 'station'],
    email: ['Email', item => item.email],
    rank: ['Rank', item => item.rank, 'rank'],
    tel: ['Contact', item => item.tel],
  };
  const openNew = () => {
    setErrors({});
    setForm({
      edit: false,
      data: { active: true, station: S.STN[0]?.name || '', ...(kind === 'off' ? { rank: 'Constable' } : {}) },
    });
  };

  return h`
    <${Pg} t=${`${cf.t}s`} sub=${`Manage ${cf.t.toLowerCase()} records`}>
      <button className=${B1} onClick=${openNew}>+ Add ${cf.t}</button>
    <//>
    <${Card}>
      <${Bar} q=${query} sq=${setQuery}>
        <${Sel} v=${stationFilter} set=${setStationFilter} opts=${S.STN.map(station => station.name)} ph="All stations"/>
        <${Sel} v=${activeFilter} set=${setActiveFilter} opts=${['Active', 'Inactive']} ph="All statuses"/>
      <//>
      <${Tbl}
        cols=${[
          ...cf.c.map(key => columns[key]),
          ['Status', item => h`<${Bd} c=${item.active ? 'g' : 'x'} t=${item.active ? 'Active' : 'Inactive'}/>`],
          ['Actions', item => h`<div className="flex gap-1">
            <button className=${B2} onClick=${() => setView(item)}>View</button>
            <button className=${B2} onClick=${() => { setErrors({}); setForm({ edit: true, data: { ...item, pw: '', pw2: '' } }); }}>Edit</button>
            <button className=${B2} onClick=${() => toggle(item)}>${item.active ? 'Deactivate' : 'Activate'}</button>
          </div>`],
        ]}
        rows=${rows}
      />
    <//>
    ${view && h`<${Modal} t=${view.name} close=${() => setView(null)} w="max-w-md">
      <div className="space-y-2 text-sm">${Object.entries(view)
        .filter(([key]) => key !== 'stationCode')
        .map(([key, value]) => h`<div key=${key} className="flex justify-between border-b border-bd py-1">
          <span className="text-mu capitalize">${key}</span><span>${String(value)}</span>
        </div>`)}</div>
    <//>`}
    ${form && h`<${Modal} t=${`${form.edit ? 'Edit' : 'Add'} ${cf.t}`} close=${() => setForm(null)}>
      <div className="grid sm:grid-cols-2 gap-3">${cf.f.map(([key, label, type]) => h`<${Fld} key=${key} l=${label} err=${errors[key]}>
        ${type === 'stn'
          ? h`<${Sel} v=${form.data[key]} set=${value => setForm({ ...form, data: { ...form.data, [key]: value } })} opts=${S.STN.map(station => station.name)} ph="Select station"/>`
          : type === 'rank'
            ? h`<${Sel} v=${form.data[key]} set=${value => setForm({ ...form, data: { ...form.data, [key]: value } })} opts=${['Constable', 'Sergeant', 'Sub-Inspector', 'Inspector', 'OIC']} ph="Select rank"/>`
            : type === 'act'
              ? h`<${Sel} v=${form.data[key] ? 'Active' : 'Inactive'} set=${value => setForm({ ...form, data: { ...form.data, [key]: value === 'Active' } })} opts=${['Active', 'Inactive']}/>`
              : h`<input className=${INP} type=${type === 'pw' ? 'password' : 'text'} autoComplete="new-password" disabled=${form.edit && key === 'id'} value=${form.data[key] || ''} onChange=${event => setForm({ ...form, data: { ...form.data, [key]: event.target.value } })}/>`}
      <//>`)}</div>
      <div className="flex justify-end gap-2 mt-4">
        <button className=${B2} onClick=${() => setForm(null)}>Cancel</button>
        <button className=${B1} onClick=${save}>Save ${cf.t.toLowerCase()}</button>
      </div>
    <//>`}
  `;
}
