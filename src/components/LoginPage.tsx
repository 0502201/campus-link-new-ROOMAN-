import React, { useState } from 'react';
import {
  GraduationCap,
  Building2,
  UserCheck,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Fingerprint,
  Lock,
  Mail,
  UserPlus,
  LogIn,
  AlertCircle
} from 'lucide-react';
import { UserRole } from '../types';
import { useAuth, PRESET_ACCOUNTS, UserAccount } from '../context/AuthContext';

interface LoginPageProps {
  onLoginSuccess?: (role: UserRole) => void;
  onLogin?: (role: UserRole, userDetails?: any) => void;
  onCancel?: () => void;
  isModal?: boolean;
  initialRole?: UserRole;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onLogin,
  onCancel,
  isModal = false,
  initialRole = 'TPO'
}) => {
  const { user, login, register, switchRole, registeredUsers } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');

  // Sign In inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register inputs
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regTitle, setRegTitle] = useState('');
  const [regOrg, setRegOrg] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const demoAccounts = PRESET_ACCOUNTS;

  const roleMeta: Record<
    UserRole,
    {
      title: string;
      badge: string;
      description: string;
      icon: React.ElementType;
      color: string;
      features: string[];
    }
  > = {
    TPO: {
      title: 'Training & Placement Lead (TPO)',
      badge: 'Institutional Command',
      description: 'Oversee placement drives, resolve venue and schedule conflicts, verify offer letters, and audit student APAAR credits.',
      icon: ShieldCheck,
      color: 'from-indigo-600 to-blue-700',
      features: [
        'Full Institutional Analytics & Department Placement Metrics',
        'Direct Access to Student APAAR & Academic Bank of Credits',
        'AI Conflict Resolver for Venue & Exam Collisions',
        'Offer Letter, KYC & Joining Verification Workflow'
      ]
    },
    Recruiter: {
      title: 'Head of Campus Talent Acquisition',
      badge: 'Corporate Partner',
      description: 'Post and parse JDs with Gemini, conduct Placement Pre-Talks (PPT), review explainable candidate fit rankings, and release offers.',
      icon: Building2,
      color: 'from-blue-600 to-cyan-700',
      features: [
        'Gemini-Powered Unstructured JD Analyzer & Cutoff Generator',
        'Schedule & Host Placement Pre-Talks (PPT) with Attendance Tracking',
        'Review Candidate Portfolios: Resumes, Projects, and Internships',
        'Explainable AI Fit Ranking & One-Click Shortlisting'
      ]
    },
    Student: {
      title: 'B.E. Computer Science (2026 Batch)',
      badge: 'Student Portal',
      description: 'Access your official APAAR Digital Card, track credits, polish your resume with AI ATS Scorer, register for Pre-Talks, and become placement ready.',
      icon: GraduationCap,
      color: 'from-emerald-600 to-teal-700',
      features: [
        'Official APAAR / ABC ID Digital Card with DigiLocker Verified Credits',
        '"Make Me Placement Ready" AI Accelerator & Mock Interviews',
        'Placement Pre-Talks (PPT) Attendance & Drive Registration',
        'ATS Resume Optimizer & Offer Letter Tracking'
      ]
    },
    Coordinator: {
      title: 'Department Placement Coordinator (CSE)',
      badge: 'Faculty Coordinator',
      description: 'Monitor branch batch readiness, track student attendance in pre-talks, verify internship certificates, and manage at-risk remedial clinics.',
      icon: UserCheck,
      color: 'from-purple-600 to-indigo-700',
      features: [
        'Branch-Wise Student Placement Readiness Dashboard',
        'Verify Student Internships & Value-Added Programs',
        'Audit Pre-Placement Talk Attendance & Eligibility Waivers',
        'Assign Mentors in Rooman Remedial Clinics for At-Risk Students'
      ]
    }
  };

  const handleQuickLogin = (roleToLogin: UserRole) => {
    setErrorMessage(null);
    login(roleToLogin);
    if (onLoginSuccess) {
      onLoginSuccess(roleToLogin);
    }
    if (onLogin) {
      onLogin(roleToLogin, demoAccounts[roleToLogin]);
    }
  };

  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Look for matching user in registered users
    const matched = registeredUsers.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (matched) {
      login(matched.role, matched);
      if (onLoginSuccess) onLoginSuccess(matched.role);
      if (onLogin) onLogin(matched.role, matched);
      return;
    }

    // If custom email typed without match, allow login with selected role
    if (email.trim()) {
      const preset = demoAccounts[selectedRole];
      const customUser: UserAccount = {
        ...preset,
        name: email.split('@')[0],
        email: email.trim(),
        role: selectedRole
      };
      login(selectedRole, customUser);
      if (onLoginSuccess) onLoginSuccess(selectedRole);
      if (onLogin) onLogin(selectedRole, customUser);
      return;
    }

    // Otherwise use preset
    const preset = demoAccounts[selectedRole];
    login(selectedRole, preset);
    if (onLoginSuccess) onLoginSuccess(selectedRole);
    if (onLogin) onLogin(selectedRole, preset);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!regName.trim() || !regEmail.trim()) {
      setErrorMessage('Please provide your full name and institutional email');
      return;
    }

    const preset = demoAccounts[selectedRole];
    const newAccount: Omit<UserAccount, 'id'> = {
      name: regName.trim(),
      email: regEmail.trim(),
      role: selectedRole,
      title: regTitle.trim() || preset.title,
      org: regOrg.trim() || preset.org,
      badge: preset.badge
    };

    const res = await register(newAccount, regPassword);
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to create user account');
      return;
    }

    setSuccessMessage(`Account created for ${selectedRole}! Logging you in...`);
    setTimeout(() => {
      if (onLoginSuccess) onLoginSuccess(selectedRole);
      if (onLogin) onLogin(selectedRole, newAccount);
    }, 600);
  };

  const currentMeta = roleMeta[selectedRole];
  const IconComponent = currentMeta.icon;

  return (
    <div
      id="login-page-container"
      className={`${
        isModal
          ? 'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm p-2 sm:p-4 md:p-6 overflow-y-auto'
          : 'min-h-[85vh] flex flex-col justify-center py-6 px-3 sm:px-6 lg:px-8'
      }`}
    >
      <div
        id="login-card-wrapper"
        className="w-full max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* Header Ribbon */}
        <div className="bg-slate-900 dark:bg-slate-950 text-white px-4 sm:px-6 py-3 sm:py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-md shrink-0">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-black tracking-tight text-white">
                  CAMPUS<span className="text-indigo-400">LINK</span>
                </h1>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center">
                  <Sparkles className="w-2.5 h-2.5 mr-1 text-indigo-300" />
                  Role-Based Auth Guard
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Role-Based Access Control • TPO, Recruiter, Student &amp; Coordinator Enclaves
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            {/* Active user status pill */}
            {user && (
              <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Active: <strong>{user.role}</strong> ({user.name.split(' ')[0]})</span>
              </div>
            )}

            {isModal && onCancel && (
              <button
                onClick={onCancel}
                className="text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-800 transition cursor-pointer font-medium text-xs"
              >
                ✕ Close
              </button>
            )}
          </div>
        </div>

        {/* Role Selection Tabs */}
        <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 p-2.5 sm:px-6 shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              1. Choose Destination Role
            </span>
            <div className="flex items-center space-x-1 text-xs">
              <button
                type="button"
                onClick={() => setAuthMode('signin')}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                  authMode === 'signin'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                  authMode === 'register'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
            {(['TPO', 'Recruiter', 'Student', 'Coordinator'] as UserRole[]).map((role) => {
              const meta = roleMeta[role];
              const RoleIcon = meta.icon;
              const isSelected = selectedRole === role;
              return (
                <button
                  key={role}
                  id={`role-btn-${role.toLowerCase()}`}
                  onClick={() => {
                    setSelectedRole(role);
                    setEmail(demoAccounts[role].email);
                  }}
                  className={`flex items-center space-x-2 p-2 sm:p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white dark:bg-slate-800 border-indigo-600 dark:border-indigo-500 shadow-md ring-2 ring-indigo-500/20 text-slate-900 dark:text-white'
                      : 'bg-white/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div
                    className={`h-7 w-7 rounded-lg flex items-center justify-center text-white shrink-0 ${
                      isSelected ? `bg-gradient-to-tr ${meta.color}` : 'bg-slate-400 dark:bg-slate-700'
                    }`}
                  >
                    <RoleIcon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">
                      {role === 'TPO'
                        ? 'T&P Lead'
                        : role === 'Coordinator'
                        ? 'Coordinator'
                        : role}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{meta.badge}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Split Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800 flex-1 min-h-0 overflow-hidden">
          {/* Role Feature Overview (Left Column) */}
          <div className="lg:col-span-7 p-4 sm:p-5 lg:p-6 bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950 overflow-y-auto max-h-[calc(92vh-150px)]">
            <div className="flex items-center space-x-3 mb-3">
              <div
                className={`h-9 w-9 rounded-xl bg-gradient-to-tr ${currentMeta.color} text-white flex items-center justify-center shadow-md shrink-0`}
              >
                <IconComponent className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-800">
                  {currentMeta.badge}
                </span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{currentMeta.title}</h2>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3 sm:mb-4">
              {currentMeta.description}
            </p>

            <div className="space-y-2 mb-4">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Role Privileges &amp; Visible Modules
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentMeta.features.map((feat, idx) => (
                  <div
                    key={idx}
                    className="flex items-start space-x-2 p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-xs text-slate-700 dark:text-slate-200"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="font-medium text-[11px] leading-tight">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick 1-Click Sandbox Test Preset */}
            <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <p className="text-xs font-semibold text-indigo-900 dark:text-indigo-200">
                  Default Verified Preset: <span className="font-bold">{demoAccounts[selectedRole].name}</span>
                </p>
                <p className="text-[11px] text-indigo-700 dark:text-indigo-300">{demoAccounts[selectedRole].email}</p>
              </div>

              <button
                id="quick-login-btn"
                onClick={() => handleQuickLogin(selectedRole)}
                className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition active:scale-95 shrink-0 cursor-pointer"
              >
                <span>1-Click Launch as {selectedRole}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </button>
            </div>
          </div>

          {/* Form Login / Register (Right Column) */}
          <div className="lg:col-span-5 p-4 sm:p-5 lg:p-6 bg-white dark:bg-slate-900 flex flex-col justify-between overflow-y-auto max-h-[calc(92vh-150px)]">
            <div>
              <div className="mb-5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  {authMode === 'signin' ? `Sign In as ${selectedRole}` : `Register New ${selectedRole} Account`}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {authMode === 'signin'
                    ? 'Enter verified credentials or use the 1-click test button on the left.'
                    : 'Set up an institutional role profile with full RBAC access.'}
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {authMode === 'signin' ? (
                <form onSubmit={handleSignInSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Institutional Email / User ID
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={demoAccounts[selectedRole].email}
                        className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                      Default preset: {demoAccounts[selectedRole].email}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Password / Security PIN
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setEmail(demoAccounts[selectedRole].email);
                          setPassword('password123');
                        }}
                        className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        Autofill test credentials
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                      (Pass-key check enabled • Any password accepted in preview)
                    </span>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      id="submit-login-form-btn"
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 shadow-md transition active:scale-98 flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Authenticate as {selectedRole}</span>
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Full Legal / Academic Name
                    </label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Rahul Verma"
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Institutional Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="e.g. rahul.verma@rooman.edu"
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Designation / Batch
                      </label>
                      <input
                        type="text"
                        value={regTitle}
                        onChange={(e) => setRegTitle(e.target.value)}
                        placeholder="e.g. B.E. CSE"
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        College / Company
                      </label>
                      <input
                        type="text"
                        value={regOrg}
                        onChange={(e) => setRegOrg(e.target.value)}
                        placeholder="e.g. Rooman Tech"
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Create Password / PIN
                    </label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition active:scale-98 flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Create &amp; Enter as {selectedRole}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* APAAR National Academic Depository Badge */}
            <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center space-x-3 text-slate-500 dark:text-slate-400">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <Fingerprint className="w-4 h-4" />
              </div>
              <div className="text-[11px] leading-tight">
                <p className="font-semibold text-slate-800 dark:text-slate-200">APAAR &amp; ABC Integrated</p>
                <p className="text-slate-500 dark:text-slate-400">DigiLocker Academic Bank of Credits Synchronized</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
