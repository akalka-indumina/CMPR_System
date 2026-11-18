import { Menu, X, Plus, Check, Bell, User, FileText, Home, Shield, BarChart3, LogOut, Settings, Moon, Sun } from 'lucide-react';

const ICONS = { menu: Menu, x: X, plus: Plus, check: Check, bell: Bell, user: User, file: FileText, home: Home, shield: Shield, chart: BarChart3, logout: LogOut, settings: Settings, moon: Moon, sun: Sun };

export const Ic = ({ n, s = 18 }) => {
  const Icon = ICONS[n] || FileText;
  return <Icon size={s} />;
};
