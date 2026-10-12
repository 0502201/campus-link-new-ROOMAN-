import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '../types';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  org: string;
  avatar?: string;
  badge: string;
  studentId?: string; // links to StudentProfile if role === 'Student'
}

export const PRESET_ACCOUNTS: Record<UserRole, UserAccount> = {
  TPO: {
    id: 'usr-tpo-01',
    name: 'Dr. Rajesh Hegde',
    email: 'rajesh.hegde@rooman.edu',
    role: 'TPO',
    title: 'Training & Placement Lead (TPO)',
    org: 'Rooman Institute of Technology',
    badge: 'Institutional Command'
  },
  Recruiter: {
    id: 'usr-rec-01',
    name: 'Priya Sharma',
    email: 'priya.sharma@rooman.net',
    role: 'Recruiter',
    title: 'Head of Campus Talent Acquisition',
    org: 'Rooman Technologies / Partner Corporates',
    badge: 'Corporate Partner'
  },
  Student: {
    id: 'usr-std-01',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@campuslink.edu',
    role: 'Student',
    title: 'B.E. Computer Science (2026 Batch)',
    org: 'Student ID: 1RM21CS042',
    badge: 'Student Portal',
    studentId: 'std-101'
  },
  Coordinator: {
    id: 'usr-coord-01',
    name: 'Prof. Shalini Rao',
    email: 'shalini.rao@campuslink.edu',
    role: 'Coordinator',
    title: 'Department Placement Coordinator (CSE)',
    org: 'Department of Computer Science & Engineering',
    badge: 'Faculty Coordinator'
  }
};

// Default allowable tabs per role
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  TPO: [
    'tpo-command',
    'overview',
    'students',
    'placement-ready',
    'drives',
    'pre-talks',
    'matching',
    'scheduler',
    'offers',
    'at-risk',
    'notifications',
    'landing'
  ],
  Recruiter: [
    'recruiter-workspace',
    'drives',
    'pre-talks',
    'matching',
    'offers',
    'landing'
  ],
  Student: [
    'student-hub',
    'placement-ready',
    'pre-talks',
    'offers',
    'landing'
  ],
  Coordinator: [
    'coordinator-ops',
    'overview',
    'students',
    'placement-ready',
    'pre-talks',
    'at-risk',
    'notifications',
    'landing'
  ]
};

// Default tab on login for each role
export const ROLE_DEFAULT_TABS: Record<UserRole, string> = {
  TPO: 'tpo-command',
  Recruiter: 'recruiter-workspace',
  Student: 'student-hub',
  Coordinator: 'coordinator-ops'
};

export const getPermittedRolesForTab = (tabId: string): UserRole[] => {
  const roles: UserRole[] = ['TPO', 'Recruiter', 'Student', 'Coordinator'];
  return roles.filter((r) => ROLE_PERMISSIONS[r]?.includes(tabId));
};

interface AuthContextType {
  user: UserAccount | null;
  role: UserRole;
  isAuthenticated: boolean;
  login: (role: UserRole, userDetails?: Partial<UserAccount>) => void;
  logout: () => void;
  switchRole: (newRole: UserRole) => void;
  hasPermission: (tabId: string) => boolean;
  getAllowedTabs: () => string[];
  getPermittedRoles: (tabId: string) => UserRole[];
  registeredUsers: UserAccount[];
  register: (account: Omit<UserAccount, 'id'>, password?: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'campuslink_authenticated_user_v2';
const USERS_STORAGE_KEY = 'campuslink_registered_users_v2';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [registeredUsers, setRegisteredUsers] = useState<UserAccount[]>(() => {
    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // fallback
    }
    return Object.values(PRESET_ACCOUNTS);
  });

  const [user, setUser] = useState<UserAccount | null>(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // fallback
    }
    // Default to TPO on first visit
    return PRESET_ACCOUNTS.TPO;
  });

  // Sync user state to localStorage
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch {
      // ignore storage quota errors
    }
  }, [user]);

  // Sync registered users
  useEffect(() => {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(registeredUsers));
    } catch {
      // ignore
    }
  }, [registeredUsers]);

  const login = (newRole: UserRole, userDetails?: Partial<UserAccount>) => {
    const basePreset = PRESET_ACCOUNTS[newRole];
    const newUser: UserAccount = {
      ...basePreset,
      ...(userDetails || {}),
      role: newRole
    };
    setUser(newUser);
  };

  const logout = () => {
    setUser(null);
  };

  const switchRole = (newRole: UserRole) => {
    // Find if user already exists for that role in registered users
    const matched = registeredUsers.find((u) => u.role === newRole) || PRESET_ACCOUNTS[newRole];
    setUser({ ...matched });
  };

  const hasPermission = (tabId: string): boolean => {
    if (!user) return tabId === 'landing';
    const allowed = ROLE_PERMISSIONS[user.role] || [];
    return allowed.includes(tabId);
  };

  const getAllowedTabs = (): string[] => {
    if (!user) return ['landing'];
    return ROLE_PERMISSIONS[user.role] || [];
  };

  const register = async (account: Omit<UserAccount, 'id'>): Promise<{ success: boolean; error?: string }> => {
    const existing = registeredUsers.find((u) => u.email.toLowerCase() === account.email.toLowerCase());
    if (existing) {
      return { success: false, error: 'User with this institutional email already exists' };
    }
    const created: UserAccount = {
      ...account,
      id: `usr-${Date.now()}`
    };
    const updated = [...registeredUsers, created];
    setRegisteredUsers(updated);
    setUser(created);
    return { success: true };
  };

  const role: UserRole = user ? user.role : 'Student';
  const isAuthenticated = user !== null;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        login,
        logout,
        switchRole,
        hasPermission,
        getAllowedTabs,
        getPermittedRoles: getPermittedRolesForTab,
        registeredUsers,
        register
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
