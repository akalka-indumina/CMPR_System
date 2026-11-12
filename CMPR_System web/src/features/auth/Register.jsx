import { useEffect, useState } from 'react';
import { h } from '../../lib/h';
import { Fld, Sel } from '../../components/ui/Primitives';
import { B1, B2, INP } from '../../lib/constants';
import { createUniqueId } from '../../lib/helpers';
import { hashPassword } from '../../lib/credentials';
import { nextRegistrationReference } from '../../lib/registration';

const NIC_PATTERN = /^(?:\d{9}[VX]|\d{12})$/;
const IMAGE_SIZE_LIMIT = 5 * 1024 * 1024;
const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png'];

const createForm = application => ({
  fullName: application?.fullName || '',
  nic: application?.nic || '',
  dateOfBirth: application?.dateOfBirth || '',
  gender: application?.gender || '',
  email: application?.email || '',
  mobile: application?.mobile || '',
  address: application?.address || '',
  district: application?.district || '',
  documentType: application?.documentType || 'NIC',
  password: '',
  confirmPassword: '',
});

export function Register({ go, toast, users, applications, stations, previousApplication, onSubmit }) {
  const [form, setForm] = useState(() => createForm(previousApplication));
  const [errors, setErrors] = useState({});
  const [images, setImages] = useState({});
  const [previews, setPreviews] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const districts = [...new Set(stations.map(station => station.district))];
  const imageSlots = form.documentType === 'NIC'
    ? [['front', 'NIC Front Side Image'], ['back', 'NIC Back Side Image']]
    : [['licence', 'Driving Licence Image']];

  useEffect(() => {
    const urls = Object.fromEntries(Object.entries(images).map(([slot, file]) => [slot, URL.createObjectURL(file)]));
    setPreviews(urls);
    return () => Object.values(urls).forEach(url => URL.revokeObjectURL(url));
  }, [images]);

  const setField = key => event => {
    setForm(current => ({ ...current, [key]: event.target.value }));
    setErrors(current => ({ ...current, [key]: '' }));
  };

  const changeDocumentType = type => {
    setForm(current => ({ ...current, documentType: type }));
    setImages({});
    setErrors({});
  };

  const selectImage = (slot, event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const extension = file.name.split('.').pop()?.toLowerCase();
    const formatValid = ['jpg', 'jpeg', 'png'].includes(extension)
      && (!file.type || IMAGE_MIME_TYPES.includes(file.type.toLowerCase()));
    const key = `image_${slot}`;
    if (!formatValid || file.size > IMAGE_SIZE_LIMIT) {
      setImages(current => {
        const next = { ...current };
        delete next[slot];
        return next;
      });
      setErrors(current => ({
        ...current,
        [key]: !formatValid ? 'Choose a JPG, JPEG, or PNG image.' : 'Each image must be 5 MB or smaller.',
      }));
      return;
    }
    setImages(current => ({ ...current, [slot]: file }));
    setErrors(current => ({ ...current, [key]: '' }));
  };

  const removeImage = slot => {
    setImages(current => {
      const next = { ...current };
      delete next[slot];
      return next;
    });
    setErrors(current => ({ ...current, [`image_${slot}`]: '' }));
  };

  const submit = async () => {
    const nextErrors = {};
    const email = form.email.trim().toLowerCase();
    const nic = form.nic.trim().toUpperCase();
    const required = ['fullName', 'nic', 'dateOfBirth', 'gender', 'email', 'mobile', 'address', 'district', 'password', 'confirmPassword'];
    required.forEach(key => {
      if (!form[key].trim()) nextErrors[key] = 'Required';
    });
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = 'Enter a valid email address.';
    if (form.nic && !NIC_PATTERN.test(nic)) nextErrors.nic = 'Use 9 digits + V/X or 12 digits.';
    if (form.dateOfBirth && (
      Number.isNaN(new Date(`${form.dateOfBirth}T00:00:00`).getTime())
      || form.dateOfBirth > new Date().toISOString().slice(0, 10)
    )) nextErrors.dateOfBirth = 'Enter a valid date that is not in the future.';
    if (form.mobile && !/^\+?[\d\s()-]{7,20}$/.test(form.mobile.trim())) nextErrors.mobile = 'Enter a valid mobile number.';
    if (form.password && form.password.length < 8) nextErrors.password = 'Use at least 8 characters.';
    if (form.password !== form.confirmPassword) nextErrors.confirmPassword = 'Passwords do not match.';
    imageSlots.forEach(([slot]) => {
      if (!images[slot]) nextErrors[`image_${slot}`] = 'This image is required.';
    });

    const allUsers = [users.admin, users.station, users.officer, users.citizen, ...(users.citizens || [])];
    const activeApplications = applications.filter(application => (
      ['Pending Review', 'Resubmitted'].includes(application.status)
      && application.id !== previousApplication?.id
    ));
    if (email && [...allUsers.map(user => user.email), ...activeApplications.map(application => application.email)]
      .some(value => value.trim().toLowerCase() === email)) {
      nextErrors.email = 'An application or account already uses this email.';
    }
    const savedCitizens = [users.citizen, ...(users.citizens || [])];
    const duplicateCitizenNic = nic && savedCitizens.some(user => user.nic && user.nic.trim().toUpperCase() === nic);
    if (duplicateCitizenNic) {
      nextErrors.nic = 'An approved Citizen account already uses this NIC.';
    } else if (nic && activeApplications.some(application => (
      application.nic.trim().toUpperCase() === nic
    ))) {
      nextErrors.nic = 'An active application already uses this NIC.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast('Please correct the highlighted fields.', 'err');
      return;
    }

    setSubmitting(true);
    try {
      const { passwordSalt, passwordHash } = await hashPassword(form.password);
      const submittedAt = new Date().toISOString();
      const applicantId = previousApplication?.applicantId || createUniqueId('APPL');
      const status = previousApplication ? 'Resubmitted' : 'Pending Review';
      const referenceNumber = nextRegistrationReference(applications);
      const id = createUniqueId('APP');
      const reviewHistory = [
        ...(previousApplication?.reviewHistory || []),
        {
          status,
          at: submittedAt,
          actorId: applicantId,
          actorName: form.fullName.trim(),
          note: previousApplication ? 'Corrected application resubmitted.' : 'Application submitted for review.',
        },
      ];
      const application = {
        id,
        referenceNumber,
        applicantId,
        fullName: form.fullName.trim(),
        nic,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        email,
        mobile: form.mobile.trim(),
        address: form.address.trim(),
        district: form.district,
        documentType: form.documentType,
        documentSlots: imageSlots.map(([slot]) => slot),
        submittedAt,
        status,
        reviewHistory,
        previousApplicationId: previousApplication?.id || '',
        rejectionReason: '',
        reviewedById: '',
        reviewedByName: '',
        reviewedAt: '',
        passwordSalt,
        passwordHash,
      };
      onSubmit(application, images);
      toast('Application submitted. Your identity verification is under review.');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not submit the application.', 'err');
    } finally {
      setSubmitting(false);
    }
  };

  return h`<div className="min-h-screen flex items-center justify-center p-4"><div className="w-full max-w-3xl bg-cd border border-bd rounded-xl p-6 space-y-4">
    <div><h1 className="font-bold text-lg">Citizen registration</h1><p className="text-mu text-xs mt-1">Frontend demo only. Use fictional information; submitted text is stored in this browser. Identity images are temporary and are not saved.</p></div>
    ${previousApplication&&h`<div className="rounded-lg border border-orange-500/40 bg-orange-500/10 p-3 text-sm"><b className="text-orange-400">Previous rejection:</b> ${previousApplication.rejectionReason}</div>`}
    <div><h2 className="font-semibold text-sm mb-3">Personal Information</h2><div className="grid sm:grid-cols-2 gap-3">
      <${Fld} l="Full Name" err=${errors.fullName}><input className=${INP} value=${form.fullName} onChange=${setField('fullName')}/><//>
      <${Fld} l="NIC Number" err=${errors.nic}><input className=${INP} value=${form.nic} onChange=${setField('nic')}/><//>
      <${Fld} l="Date of Birth" err=${errors.dateOfBirth}><input type="date" className=${INP} value=${form.dateOfBirth} onChange=${setField('dateOfBirth')}/><//>
      <${Fld} l="Gender" err=${errors.gender}><${Sel} v=${form.gender} set=${value=>{setForm(current=>({...current,gender:value}));setErrors(current=>({...current,gender:''}))}} opts=${['Female','Male','Other','Prefer not to say']} ph="Select gender"/><//>
      <${Fld} l="Email Address" err=${errors.email}><input type="email" className=${INP} value=${form.email} onChange=${setField('email')}/><//>
      <${Fld} l="Mobile Number" err=${errors.mobile}><input type="tel" className=${INP} value=${form.mobile} onChange=${setField('mobile')}/><//>
      <div className="sm:col-span-2"><${Fld} l="Residential Address" err=${errors.address}><textarea rows="2" className=${INP} value=${form.address} onChange=${setField('address')}></textarea><//></div>
      <${Fld} l="District" err=${errors.district}><${Sel} v=${form.district} set=${value=>{setForm(current=>({...current,district:value}));setErrors(current=>({...current,district:''}))}} opts=${districts} ph="Select district"/><//>
    </div></div>
    <div><h2 className="font-semibold text-sm mb-3">Identity Document Information</h2><div className="grid sm:grid-cols-2 gap-3">
      <${Fld} l="Document Type"><${Sel} v=${form.documentType} set=${changeDocumentType} opts=${['NIC','Driving Licence']}/><//>
      ${imageSlots.map(([slot,label])=>h`<div key=${slot} className="sm:col-span-2"><${Fld} l=${label} err=${errors['image_'+slot]}><input type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" className=${INP} onChange=${event=>selectImage(slot,event)}/><//>${images[slot]&&h`<div className="mt-2 flex items-center gap-3"><img src=${previews[slot]} alt=${label+' preview'} className="h-24 max-w-40 rounded border border-bd object-contain"/><span className="text-xs text-mu truncate">${images[slot].name}</span><button type="button" className=${B2} onClick=${()=>removeImage(slot)}>Remove</button></div>`}</div>`)}
      <p className="sm:col-span-2 text-xs text-mu">JPG, JPEG, or PNG only; maximum 5 MB per image. Do not upload real identity documents.</p>
    </div></div>
    <div><h2 className="font-semibold text-sm mb-3">Account Information</h2><div className="grid sm:grid-cols-2 gap-3">
      <${Fld} l="Password" err=${errors.password}><input type="password" className=${INP} value=${form.password} onChange=${setField('password')}/><//>
      <${Fld} l="Confirm Password" err=${errors.confirmPassword}><input type="password" className=${INP} value=${form.confirmPassword} onChange=${setField('confirmPassword')}/><//>
    </div></div>
    <div className="flex flex-wrap gap-2 justify-end"><button className=${B2} onClick=${()=>go('login')}>Back to sign in</button><button className=${B1} disabled=${submitting} onClick=${submit}>${submitting?'Submitting...':'Submit for verification'}</button></div>
    <p className="text-xs text-mu">Secure identity-document storage and verification require a protected backend. This demo keeps uploaded images in temporary browser memory only.</p>
  </div></div>`;
}
