import React, { useState } from 'react';
import {
  Menu,
  X,
  Search,
  Sparkles,
  Building2,
  GraduationCap,
  ShieldCheck,
  UserCheck,
  LogOut,
  ChevronDown,
  Bell,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Sun,
  Moon
} from 'lucide-react';
import { UserRole } from '../types';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  onToggleSidebar: () => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  currentUser: { name: string; email: string; title: string };
  onOpenLoginModal: () => void;
  onLogout?: () => void;
  onOpenAuditTrail?: () => void;
  onOpenSettings?: () => void;
  conflictCount: number;
  atRiskCount: number;
  onOpenQuickSearch: () => void;
  activeSectionTitle?: string;
  activeTabLabel?: string;
  onOpenLandingPage?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  userRole,
  setUserRole,
  currentUser,
  onOpenLoginModal,
  onLogout,
  onOpenAuditTrail,
  onOpenSettings,
  conflictCount,
  atRiskCount,
  onOpenQuickSearch,
  activeSectionTitle = 'Placement Operations',
  activeTabLabel = 'Dashboard',
  onOpenLandingPage
}) => {



  const { theme, toggleTheme } = useTheme();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const roleConfigs: Record<
    UserRole,
    { label: string; icon: React.ElementType; color: string; badge: string }
  > = {
    TPO: {
      label: 'T&P Lead (TPO)',
      icon: ShieldCheck,
      color: 'bg-indigo-600 text-white',
      badge: 'Institutional'
    },
    Recruiter: {
      label: 'Corporate Recruiter',
      icon: Building2,
      color: 'bg-blue-600 text-white',
      badge: 'Corporate'
    },
    Student: {
      label: 'Student Candidate',
      icon: GraduationCap,
      color: 'bg-emerald-600 text-white',
      badge: 'Candidate'
    },
    Coordinator: {
      label: 'Lead Coordinator',
      icon: UserCheck,
      color: 'bg-purple-600 text-white',
      badge: 'Coordinator'
    }
  };

  const CurrentRoleIcon = roleConfigs[userRole].icon;

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-2xs h-16 flex items-center justify-between px-4 sm:px-6 transition-colors duration-200">
      {/* Left: Hamburger menu toggle for mobile + Breadcrumb */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition lg:hidden"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb Context */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400 dark:text-slate-500 hidden sm:inline font-medium">
            {activeSectionTitle}
          </span>
          <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">/</span>
          <h1 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
            {activeTabLabel}
          </h1>
        </div>
      </div>

      {/* Right Controls: Search, System Badges, Theme Toggle, Role Switcher */}
      <div className="flex items-center space-x-2.5 sm:space-x-3">
        {/* Quick Search */}
        <button
          onClick={onOpenQuickSearch}
          className="hidden md:flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 transition"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Quick search...</span>
          <kbd className="text-[10px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-0.5 text-slate-400 dark:text-slate-400 font-mono">
            ⌘K
          </kbd>
        </button>

        {/* View Landing Page Button */}
        {onOpenLandingPage && (
          <button
            onClick={onOpenLandingPage}
            className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500/50 bg-white dark:bg-slate-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-900 dark:hover:text-indigo-200 transition text-xs font-semibold shadow-2xs"
            title="View Public Landing Page"
          >
            <span>Landing Page</span>
            <ExternalLink className="w-3 h-3 text-slate-400 dark:text-slate-500" />
          </button>
        )}

        {/* Light / Dark Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-all flex items-center justify-center shadow-2xs"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600" />
          )}
        </button>

        {/* Live System Alerts Pill */}
        {conflictCount > 0 && (
          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 rounded-xl text-xs font-bold">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>{conflictCount} Clashes</span>
          </div>
        )}

        {/* Role Switcher Pill */}
        <div className="relative">
          <button
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 p-1.5 sm:pr-3 rounded-xl transition text-left"
          >
            <div
              className={`h-7 w-7 rounded-lg flex items-center justify-center font-bold text-xs ${roleConfigs[userRole].color}`}
            >
              <CurrentRoleIcon className="w-3.5 h-3.5" />
            </div>
            <div className="hidden sm:block leading-tight">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[120px]">
                {currentUser.name}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">{roleConfigs[userRole].label}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Role Dropdown */}
          {showRoleDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-fade-in text-xs">
              <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="font-bold text-slate-900 dark:text-slate-100">{currentUser.name}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{currentUser.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded text-[10px] font-bold">
                  {roleConfigs[userRole].label}
                </span>
              </div>

              <div className="p-1.5 space-y-1">
                <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  Switch Active Role
                </span>

                {(['TPO', 'Recruiter', 'Student', 'Coordinator'] as UserRole[]).map((role) => {
                  const cfg = roleConfigs[role];
                  const Icon = cfg.icon;
                  const isSelected = userRole === role;
                  return (
                    <button
                      key={role}
                      onClick={() => {
                        setUserRole(role);
                        setShowRoleDropdown(false);
                      }}
                      className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-left transition ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-900 dark:text-indigo-200 font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      <span>{cfg.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="p-1.5 border-t border-slate-100 dark:border-slate-800 space-y-1">
                <button
                  onClick={() => {
                    setShowRoleDropdown(false);
                    onOpenLoginModal();
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl transition cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Switch Role / Re-authenticate</span>
                </button>

                {onOpenAuditTrail && (
                  <button
                    onClick={() => {
                      setShowRoleDropdown(false);
                      onOpenAuditTrail();
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                  >
                    <span>📋 View Audit Trail</span>
                  </button>
                )}

                {onOpenSettings && (
                  <button
                    onClick={() => {
                      setShowRoleDropdown(false);
                      onOpenSettings();
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                  >
                    <span>⚙ Profile &amp; Settings</span>
                  </button>
                )}

                {onLogout && (
                  <button
                    onClick={() => {
                      setShowRoleDropdown(false);
                      onLogout();
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-rose-600 dark:text-rose-400 font-bold hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
