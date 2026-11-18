import { h } from '../../lib/h';
import { Ic } from '../../components/ui/Icon';
import { B2 } from '../../lib/constants';

export function NotificationPanel({ S, onClose }) {
  const visible = notification => notification.role === S.role
    && (!notification.userId || notification.userId === S.user.id);
  const notifications = S.N.filter(visible);
  const unreadCount = notifications.filter(notification => !notification.read).length;

  const markRead = id => S.setN(current => current.map(notification => (
    notification.id === id ? { ...notification, read: true } : notification
  )));
  const markAllRead = () => {
    S.setN(current => current.map(notification => (
      visible(notification) ? { ...notification, read: true } : notification
    )));
    S.toast('All notifications marked as read.');
  };

  return h`<section id="notification-panel" role="dialog" aria-label="Notifications" className="absolute right-0 top-full mt-2 z-50 w-80 max-w-[calc(100vw-1.5rem)] overflow-hidden bg-cd border border-bd rounded-xl shadow-xl">
    <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-bd">
      <div><h2 className="text-sm font-semibold">Notifications</h2><p className="text-xs text-mu mt-0.5">${unreadCount} unread</p></div>
      <div className="flex items-center gap-2"><button type="button" className=${B2} disabled=${unreadCount===0} onClick=${markAllRead}>Mark all read</button><button type="button" aria-label="Close notifications" className="p-1 text-mu hover:text-tx" onClick=${onClose}><${Ic} n="x" s=${16}/></button></div>
    </header>
    <div className="max-h-[min(65vh,28rem)] overflow-y-auto divide-y divide-bd">
      ${notifications.length ? notifications.map(notification=>h`<div key=${notification.id} className=${'flex items-start gap-2 px-4 py-3 '+(notification.read?'':'bg-pr/5')}>
        <span className=${'mt-1.5 w-2 h-2 rounded-full shrink-0 '+(notification.read?'bg-transparent':'bg-pr')}></span>
        <p className=${'flex-1 text-xs leading-relaxed '+(notification.read?'text-mu':'text-tx')}>${notification.m}</p>
        ${!notification.read&&h`<button type="button" className="text-[11px] text-pr hover:underline shrink-0" onClick=${()=>markRead(notification.id)}>Mark read</button>`}
      </div>`):h`<p className="px-4 py-8 text-center text-xs text-mu">You are all caught up.</p>`}
    </div>
  </section>`;
}
