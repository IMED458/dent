import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { db, setAuditUser, audit, useLive } from './db';
import type { Role, User } from './types';
import { userName } from './utils';

interface SessionCtx {
  user: User | null;
  users: User[];
  ready: boolean;
  login: (u: User) => void;
  logout: () => void;
  can: (perm: Perm) => boolean;
}

export type Perm = 'clinical' | 'sign' | 'admin' | 'finance' | 'register';

const PERMS: Record<Role, Perm[]> = {
  admin: ['clinical', 'sign', 'admin', 'finance', 'register'],
  doctor: ['clinical', 'sign', 'finance', 'register'],
  assistant: ['clinical', 'register'],
  registrar: ['register', 'finance'],
};

const Ctx = createContext<SessionCtx>(null as any);
export const useSession = () => useContext(Ctx);

const KEY = 'dent-session';

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const usersRaw = useLive(() => db.users.toArray(), []);
  const users = usersRaw || [];
  const ready = usersRaw !== undefined;
  const [userId, setUserId] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(KEY);
    } catch {
      return null;
    }
  });
  const user = users.find((u) => u.id === userId && u.active) || null;

  useEffect(() => {
    setAuditUser(user ? { id: user.id, name: userName(user) } : null);
  }, [user]);

  const login = useCallback((u: User) => {
    setUserId(u.id);
    setAuditUser({ id: u.id, name: userName(u) });
    try {
      sessionStorage.setItem(KEY, u.id);
    } catch {}
    audit('LOGIN', 'User', u.id, 'სისტემაში შესვლა');
  }, []);

  const logout = useCallback(() => {
    if (userId) audit('LOGOUT', 'User', userId, 'სისტემიდან გასვლა');
    setUserId(null);
    try {
      sessionStorage.removeItem(KEY);
    } catch {}
  }, [userId]);

  const can = useCallback((p: Perm) => (user ? PERMS[user.role].includes(p) : false), [user]);

  return <Ctx.Provider value={{ user, users, ready, login, logout, can }}>{children}</Ctx.Provider>;
}
