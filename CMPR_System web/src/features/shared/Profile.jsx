
import { useState } from 'react';
import { h } from '../../lib/h';
import { Card, Fld, Pg } from '../../components/ui/Primitives';
import { B1, B2, INP } from '../../lib/constants';

export function Profile({ S }) {
  const isStation = S.role === 'station';
  const u = isStation ? (S.ACC.find(account => account.id === S.user.id) || S.user) : S.user;

  // View mode is the default
  const [editing, setEditing] = useState(false);
  const [d, setD] = useState({ ...u });

  const fields = isStation ? [
    ['id', 'Account ID'],
    ['station', 'Police Station'],
    ['district', 'District'],
    ['tel', 'Contact Number'],
    ['email', 'Email Address']
  ] : [
    ['name', 'Full Name'],
    ...(S.role === 'citizen'
      ? [
          ['identityNumber', 'Identity Document Number'],
          ...(u.district ? [['district', 'District']] : [])
        ]
      : [['id', 'Account ID']]
    ),
    ['email', 'Email Address'],
    ['tel', 'Phone Number'],
    ['addr', 'Address']
  ];

  const startEditing = () => {
    setD({ ...u });
    setEditing(true);
  };

  const cancelEditing = () => {
    setD({ ...u });
    setEditing(false);
  };

  // Upload profile photo
  const handlePhoto = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      S.toast('Please select a valid image', 'err');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      S.toast('Image must be smaller than 2 MB', 'err');
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setD(prev => ({
        ...prev,
        photo: reader.result
      }));
    };

    reader.readAsDataURL(file);
  };

  // Save changes
  const saveProfile = () => {
    if (!d.name?.trim()) {
      S.toast('Full name is required', 'err');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(d.email || '')) {
      S.toast('Enter a valid email address', 'err');
      return;
    }
    if (S.USERS.some(account => account.role !== 'station' && account.profileId !== u.id
      && account.email.toLowerCase() === d.email.trim().toLowerCase())) {
      S.toast('Another account already uses this email address', 'err');
      return;
    }

    S.setProfile({
      ...d,
      name: d.name.trim(),
      email: d.email.trim()
    });

    setEditing(false);
    S.toast('Profile updated successfully');
  };

  // Clear editable fields (not saved until Save Profile)
  const clearFields = () => {
    setD(prev => ({
      ...prev,
      name: '',
      email: '',
      tel: '',
      addr: '',
      photo: ''
    }));
  };

  const initials = (d.name || 'User')
    .split(' ')
    .filter(Boolean)
    .map(word => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const roleName = {
    citizen: 'Citizen',
    officer: 'Police Officer',
    station: 'Police Station Account',
    admin: 'System Administrator'
  };

  return h`
    <${Pg}
      t="My Profile"
      sub="View and manage your personal information"
    >
      ${
        !editing && !isStation && h`
          <button
            className=${B1}
            onClick=${startEditing}
          >
            Edit Profile
          </button>
        `
      }
    <//>

    <div className="max-w-4xl mx-auto space-y-5">

      <!-- Profile header -->
      <${Card}>
        <div className="flex flex-col sm:flex-row items-center gap-5">

          <div className="w-28 h-28 rounded-full overflow-hidden
            bg-ip border-4 border-bd flex items-center
            justify-center shrink-0">

            ${
              d.photo
                ? h`
                    <img
                      src=${d.photo}
                      alt="Profile Photo"
                      className="w-full h-full object-cover"
                    />
                  `
                : h`
                    <span className="text-3xl font-bold text-pr">
                      ${initials}
                    </span>
                  `
            }

          </div>

          <div className="text-center sm:text-left">
            <h2 className="text-xl font-bold">${d.name || 'User'}</h2>

            <p className="text-sm text-mu mt-1">
              ${roleName[S.role] || 'User'}
            </p>

            <p className="text-sm text-mu mt-1">
              ${d.id || d.identityNumber || d.nic || ''}
            </p>

            ${
              editing && h`
                <label className=${B2 + ' inline-block mt-3 cursor-pointer'}>
                  Change Profile Photo

                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange=${handlePhoto}
                  />
                </label>

                <p className="text-xs text-mu mt-1">
                  Maximum image size: 2 MB
                </p>
              `
            }
          </div>

        </div>
      <//>

      <!-- Personal details -->
      <${Card} t="Personal Information">

        ${
          editing
            ? h`
                <div className="grid sm:grid-cols-2 gap-4">

                  ${fields.map(([k, label]) => h`
                    <${Fld} key=${k} l=${label}>
                      <input
                        className=${INP}
                        type="text"
                        disabled=${k === 'id' ||
                          k === 'identityNumber' ||
                          k === 'district'}
                        value=${
                          d[k] ||
                          (k === 'identityNumber' ? d.nic : '') ||
                          ''
                        }
                        onChange=${event =>
                          setD(prev => ({
                            ...prev,
                            [k]: event.target.value
                          }))
                        }
                      />
                    <//>
                  `)}

                </div>

                <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-bd">

                  <button
                    type="button"
                    className=${B1}
                    onClick=${saveProfile}
                  >
                    Save Profile
                  </button>

                  <button
                    type="button"
                    className=${B2}
                    onClick=${cancelEditing}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className=${B2}
                    onClick=${clearFields}
                  >
                    Clear
                  </button>

                </div>
              `
            : h`
                <div className="grid sm:grid-cols-2 gap-5">

                  ${fields.map(([k, label]) => h`
                    <div key=${k}>
                      <p className="text-xs text-mu mb-1">
                        ${label}
                      </p>

                      <p className="text-sm font-medium break-words">
                        ${
                          d[k] ||
                          (k === 'identityNumber' ? d.nic : '') ||
                          'Not provided'
                        }
                      </p>
                    </div>
                  `)}

                </div>
              `
        }

      <//>

    </div>
  `;
}
