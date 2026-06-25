import React, { useState, useEffect } from 'react';
import { 
  Users, Calendar, DollarSign, BrainCircuit, LogOut, Clock, User, Plus, Search, 
  Award, Shield, Activity, Check, X, Briefcase, Sliders, Download, AlertTriangle, ChevronRight, Send
} from 'lucide-react';

import { api, useMock } from './services/api';

// Types
interface UserSession {
  username: string;
  email: string;
  roles: string[];
  accessToken?: string;
}

interface Employee {
  id: number;
  name: string;
  email: string;
  jobTitle: string;
  departmentId: number;
  managerId?: number;
  userId?: number;
  status: string;
  performanceRating?: number;
  attritionRisk?: string;
  engagementScore?: number;
  joinDate: string;
  skills?: string;
}

interface Department {
  id: number;
  name: string;
  managerId: number;
}

interface Attendance {
  id: number;
  employeeId: number;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: string;
}

interface LeaveRequest {
  id: number;
  employeeId: number;
  startDate: string;
  endDate: string;
  leaveType: string;
  status: string;
  reason: string;
}

interface Payslip {
  id: number;
  employeeId: number;
  payPeriod: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  tax: number;
  netSalary: number;
  status: string;
  processedDate: string;
}

export default function App() {
  // Auth states
  const [user, setUser] = useState<UserSession | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRole, setSignupRole] = useState('ROLE_EMPLOYEE');
  const [authError, setAuthError] = useState('');
  const [isSignup, setIsSignup] = useState(false);

  // App active tab
  const [activeTab, setActiveTab] = useState('dashboard');

  // Backend model states
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<Employee | null>(null);
  const [aiSummary, setAiSummary] = useState<any>(null);

  // AI Chat State
  const [aiChatInput, setAiChatInput] = useState('');
  const [aiChatMessages, setAiChatMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: "Hello! I am your AI Workforce Intelligence assistant. I can analyze flight risks, suggest performance reviews, or summarize team competencies. How can I help you today?" }
  ]);
  const [isAiTyping, setIsAiTyping] = useState(false);

  const handleAiChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiChatInput.trim()) return;
    
    const newMsg = { role: 'user' as const, content: aiChatInput };
    setAiChatMessages(prev => [...prev, newMsg]);
    setAiChatInput('');
    setIsAiTyping(true);
    
    setTimeout(() => {
      let reply = "Based on current telemetry, I've updated the action board.";
      const inputLower = newMsg.content.toLowerCase();
      if (inputLower.includes('risk') || inputLower.includes('flight')) {
        reply = "I've analyzed the flight risks. Currently, 2 employees have high attrition probability due to low engagement scores and stale compensation.";
      } else if (inputLower.includes('train') || inputLower.includes('skill')) {
        reply = "I recommend full-stack leadership training for the engineering pod based on recent competency gaps.";
      } else if (inputLower.includes('promote') || inputLower.includes('perform')) {
        reply = "I have identified 3 top performers who are ready for promotion. They have consistently exceeded KPIs over the last 3 quarters.";
      }
      setAiChatMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      setIsAiTyping(false);
    }, 1200);
  };

  // Interactive states
  const [searchTerm, setSearchTerm] = useState('');
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockInRecord, setClockInRecord] = useState<Attendance | null>(null);
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [showPayslipModal, setShowPayslipModal] = useState<Payslip | null>(null);
  const [payrollPeriod, setPayrollPeriod] = useState('June 2026');

  // Form states (Add Employee)
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpTitle, setNewEmpTitle] = useState('');
  const [newEmpDept, setNewEmpDept] = useState(1);
  const [newEmpSkills, setNewEmpSkills] = useState('');

  // Form states (Leave Request)
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveType, setLeaveType] = useState('ANNUAL');
  const [leaveReason, setLeaveReason] = useState('');

  // Form states (Salary Configuration)
  const [selectedEmpForSalary, setSelectedEmpForSalary] = useState<number | null>(null);
  const [salaryBase, setSalaryBase] = useState(5000);
  const [salaryAllowances, setSalaryAllowances] = useState(1000);
  const [salaryDeductions, setSalaryDeductions] = useState(300);
  const [salaryTaxRate, setSalaryTaxRate] = useState(0.15);

  // Performance review form
  const [selectedEmpForReview, setSelectedEmpForReview] = useState<number | null>(null);
  const [reviewGoals, setReviewGoals] = useState('');
  const [reviewRating, setReviewRating] = useState(4.0);
  const [reviewFeedback, setReviewFeedback] = useState('');

  // Check login on mount
  useEffect(() => {
    const cached = localStorage.getItem('nexushr_user');
    if (cached) {
      setUser(JSON.parse(cached));
    }
  }, []);

  // Fetch data when user is loaded or activeTab changes
  useEffect(() => {
    if (user) {
      fetchAppData();
    }
  }, [user, activeTab]);

  const fetchAppData = async () => {
    try {
      // Fetch core datasets
      const empRes = await api.getEmployees();
      setEmployees(empRes.data || []);

      const deptRes = await api.getDepartments();
      setDepartments(deptRes.data || []);

      const leaveRes = await api.getAllLeaves();
      setLeaves(leaveRes.data || []);

      const attRes = await api.getAllAttendance();
      setAttendance(attRes.data || []);

      // If employee, fetch profile and check clock-in status
      const currentEmp = empRes.data?.find((e: Employee) => e.email === user?.email);
      if (currentEmp) {
        setCurrentUserProfile(currentEmp);
        const personalAtt = await api.getEmployeeAttendance(currentEmp.id);
        const todayStr = new Date().toISOString().split('T')[0];
        const todayClockIn = personalAtt.data?.find((a: Attendance) => a.date === todayStr);
        if (todayClockIn) {
          setClockInRecord(todayClockIn);
          setIsClockedIn(todayClockIn.checkOutTime === null);
        }

        // Fetch personal payslips
        const payslipRes = await api.getEmployeePayslips(currentEmp.id);
        setPayslips(payslipRes.data || []);
      }

      // If admin/manager, fetch all payslips
      if (hasRole(['ROLE_ADMIN', 'ROLE_MANAGER'])) {
        const payslipRes = await api.getAllPayslips();
        setPayslips(payslipRes.data || []);

        const aiSumRes = await api.getGlobalAiSummary();
        setAiSummary(aiSumRes.data);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const hasRole = (allowedRoles: string[]) => {
    if (!user) return false;
    return user.roles.some(role => allowedRoles.includes(role));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await api.login({ username, password });
      setUser(res.data);
      setUsername('');
      setPassword('');
    } catch (err: any) {
      setAuthError(err.message || 'Login failed');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      await api.signup({ username: signupUsername, email: signupEmail, password: signupPassword, roles: [signupRole] });
      setIsSignup(false);
      setUsername(signupUsername);
      setPassword(signupPassword);
      setAuthError('Sign up successful! Please log in.');
    } catch (err: any) {
      setAuthError(err.message || 'Signup failed');
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setCurrentUserProfile(null);
    setActiveTab('dashboard');
  };

  // Clock In/Out handlers
  const handleClockInOut = async () => {
    if (!currentUserProfile) return;
    try {
      if (!isClockedIn) {
        const res = await api.checkIn(currentUserProfile.id);
        setClockInRecord(res.data);
        setIsClockedIn(true);
      } else {
        await api.checkOut(currentUserProfile.id);
        setIsClockedIn(false);
        setClockInRecord(null);
      }
      fetchAppData();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  // Create Employee profile
  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createEmployee({
        name: newEmpName,
        email: newEmpEmail,
        jobTitle: newEmpTitle,
        departmentId: newEmpDept,
        skills: newEmpSkills,
        status: 'ACTIVE',
        performanceRating: 3.5,
        attritionRisk: 'LOW',
        engagementScore: 80,
        joinDate: new Date().toISOString().split('T')[0]
      });
      setShowAddEmpModal(false);
      setNewEmpName('');
      setNewEmpEmail('');
      setNewEmpTitle('');
      setNewEmpSkills('');
      fetchAppData();
    } catch (err: any) {
      alert(err.message || 'Failed to create employee');
    }
  };

  // Submit Leave Request
  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserProfile) return;
    try {
      await api.applyLeave({
        employeeId: currentUserProfile.id,
        startDate: leaveStart,
        endDate: leaveEnd,
        leaveType,
        reason: leaveReason
      });
      setLeaveStart('');
      setLeaveEnd('');
      setLeaveReason('');
      alert('Leave application submitted!');
      fetchAppData();
    } catch (err: any) {
      alert(err.message || 'Failed to apply leave');
    }
  };

  // Approve/Reject leave
  const handleUpdateLeave = async (id: number, status: string) => {
    try {
      await api.updateLeaveStatus(id, status);
      fetchAppData();
      // recalculate AI metrics when leaves change
      await api.triggerAiRecalculate();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Run payroll for all
  const handleRunPayroll = async () => {
    try {
      await api.runPayroll(payrollPeriod);
      alert(`Payroll successfully ran and paid for: ${payrollPeriod}`);
      fetchAppData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Update employee salary configuration
  const handleUpdateSalaryConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpForSalary) return;
    try {
      await api.updateSalaryConfig({
        employeeId: selectedEmpForSalary,
        baseSalary: salaryBase,
        allowances: salaryAllowances,
        deductions: salaryDeductions,
        taxRate: salaryTaxRate
      });
      alert('Salary configurations updated successfully!');
      setSelectedEmpForSalary(null);
      fetchAppData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Submit Performance review
  const handleSubmitPerformanceReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpForReview || !currentUserProfile) return;
    try {
      await api.submitPerformanceReview({
        employeeId: selectedEmpForReview,
        reviewerId: currentUserProfile.id,
        goals: reviewGoals,
        rating: reviewRating,
        feedback: reviewFeedback
      });
      alert('Performance review saved!');
      setSelectedEmpForReview(null);
      setReviewGoals('');
      setReviewFeedback('');
      fetchAppData();
      // recalculate AI metrics when performance rating changes
      await api.triggerAiRecalculate();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSelectEmpForSalary = async (empId: number) => {
    setSelectedEmpForSalary(empId);
    try {
      const config = await api.getSalaryConfig(empId);
      if (config.data) {
        setSalaryBase(config.data.baseSalary || 4000);
        setSalaryAllowances(config.data.allowances || 500);
        setSalaryDeductions(config.data.deductions || 200);
        setSalaryTaxRate(config.data.taxRate || 0.15);
      }
    } catch (err) {
      // Fallback defaults
      setSalaryBase(4000);
      setSalaryAllowances(500);
      setSalaryDeductions(200);
      setSalaryTaxRate(0.15);
    }
  };



  // Pre-fill log in credentials
  const demoLogin = (role: string) => {
    if (role === 'admin') {
      setUsername('admin');
      setPassword('admin123');
    } else if (role === 'manager') {
      setUsername('sarah');
      setPassword('sarah123');
    } else {
      setUsername('john');
      setPassword('john123');
    }
  };



  // Render Login / Signup Form
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white backdrop-blur-xl border border-slate-200 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#4ce071] via-[#3fc05e] to-green-600"></div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 bg-green-500/10 rounded-2xl text-[#3fc05e] mb-3">
              <BrainCircuit className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">NexusHR</h2>
            <p className="text-slate-500 mt-2 text-sm">AI-Enabled Enterprise HR & Workforce Intelligence</p>
          </div>

          {authError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-6 text-center">
              {authError}
            </div>
          )}

          {!isSignup ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wider mb-2">Username or Email</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#3fc05e] transition-colors"
                  placeholder="Enter username..." 
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wider mb-2">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#3fc05e] transition-colors"
                  placeholder="••••••••" 
                  required
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-3 bg-gradient-to-r from-[#4ce071] to-[#3fc05e] hover:from-[#3fc05e] hover:to-[#2da54c] text-slate-800 font-semibold rounded-xl shadow-lg shadow-green-500/20 transition-all active:scale-[0.98]"
              >
                Log In
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wider mb-2">Username</label>
                <input 
                  type="text" 
                  value={signupUsername}
                  onChange={(e) => setSignupUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#3fc05e] transition-colors"
                  placeholder="johndoe" 
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wider mb-2">Email Address</label>
                <input 
                  type="email" 
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#3fc05e] transition-colors"
                  placeholder="john.doe@nexushr.com" 
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wider mb-2">Password</label>
                <input 
                  type="password" 
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#3fc05e] transition-colors"
                  placeholder="••••••••" 
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wider mb-2">Role Type</label>
                <select
                  value={signupRole}
                  onChange={(e) => setSignupRole(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#3fc05e] transition-colors"
                >
                  <option value="ROLE_EMPLOYEE">Standard Employee</option>
                  <option value="ROLE_MANAGER">Department Manager</option>
                  <option value="ROLE_ADMIN">System Administrator</option>
                </select>
              </div>

              <button 
                type="submit" 
                className="w-full py-3 bg-gradient-to-r from-[#4ce071] to-[#3fc05e] hover:from-[#3fc05e] hover:to-[#2da54c] text-slate-800 font-semibold rounded-xl shadow-lg shadow-green-500/20 transition-all active:scale-[0.98]"
              >
                Sign Up Account
              </button>
            </form>
          )}

          <div className="mt-6 border-t border-slate-200 pt-6">
            <span className="block text-center text-xs text-slate-500 font-semibold mb-3">QUICK LOG IN OPTIONS</span>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => { demoLogin('admin'); setIsSignup(false); }} className="px-2 py-1.5 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 transition-all">Admin Profile</button>
              <button onClick={() => { demoLogin('manager'); setIsSignup(false); }} className="px-2 py-1.5 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 transition-all">Manager Profile</button>
              <button onClick={() => { demoLogin('employee'); setIsSignup(false); }} className="px-2 py-1.5 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 transition-all">Employee Portal</button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <button 
              onClick={() => { setIsSignup(!isSignup); setAuthError(''); }}
              className="text-xs text-[#3fc05e] hover:text-[#2da54c] font-semibold"
            >
              {isSignup ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active views content generators
  return (
    <div className="min-h-screen flex bg-slate-100">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-white/90 border-r border-slate-200 flex flex-col justify-between select-none">
        <div>
          {/* Logo */}
          <div className="p-6 flex items-center gap-3 border-b border-slate-200">
            <div>
              <span className="block font-bold text-lg text-slate-800 leading-tight">NexusHR</span>
              <span className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Workforce Intel</span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1.5">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'dashboard' 
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              <Activity className="w-5 h-5" />
              Dashboard
            </button>

            {hasRole(['ROLE_ADMIN', 'ROLE_MANAGER']) && (
              <button 
                onClick={() => setActiveTab('employees')}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'employees' 
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                <Users className="w-5 h-5" />
                Workforce Directory
              </button>
            )}

            <button 
              onClick={() => setActiveTab('leaves')}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'leaves' 
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              <Calendar className="w-5 h-5" />
              Leaves & Holidays
            </button>

            <button 
              onClick={() => setActiveTab('payroll')}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'payroll' 
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              <DollarSign className="w-5 h-5" />
              Payroll Center
            </button>

            {hasRole(['ROLE_ADMIN', 'ROLE_MANAGER']) && (
              <button 
                onClick={() => setActiveTab('ai-insights')}
                className={`w-full py-3 px-4 rounded-xl flex items-center gap-3 transition-all ${
                  activeTab === 'ai-insights' 
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <BrainCircuit className="w-5 h-5 animate-pulse text-indigo-400" />
                Workforce Intelligence
              </button>
            )}
          </nav>
        </div>

        {/* Sidebar Footer User Details */}
        <div className="p-4 border-t border-slate-200">
          <div className="bg-white p-3.5 rounded-2xl flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
              <User className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <span className="block font-semibold text-sm text-slate-800 truncate">{user.username}</span>
              <span className="block text-[10px] font-bold text-indigo-400 tracking-wider flex items-center gap-1">
                <Shield className="w-3 h-3 inline" />
                {user.roles[0].replace('ROLE_', '')}
              </span>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="w-full py-2.5 flex items-center justify-center gap-2 border border-slate-200 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 text-slate-500 font-semibold rounded-xl text-xs transition-all"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        
        {/* HEADER */}
        <header className="px-8 py-5 border-b border-slate-200 bg-white/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-extrabold text-slate-800 capitalize tracking-tight">{activeTab.replace('-', ' ')}</span>
            {useMock && (
              <span className="px-2 py-0.5 bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 text-[10px] font-bold rounded-full ml-3 tracking-wide">
                DEMO OFFLINE MODE
              </span>
            )}
          </div>
          
          {/* Biometric Simulation Widget (Employee Specific) */}
          {currentUserProfile && (
            <div className="flex items-center gap-4">
              <div className="bg-slate-100 px-4 py-2 border border-slate-300 rounded-2xl flex items-center gap-3">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-semibold text-slate-600">
                  {isClockedIn ? `Checked In: ${clockInRecord ? new Date(clockInRecord.checkInTime || '').toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Active'}` : 'Not clocked in today'}
                </span>
                <button 
                  onClick={handleClockInOut}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isClockedIn 
                      ? 'bg-red-500/15 border border-red-500/30 hover:bg-red-500/25 text-red-300' 
                      : 'bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 text-emerald-300'
                  }`}
                >
                  {isClockedIn ? 'Clock Out' : 'Clock In'}
                </button>
              </div>
            </div>
          )}
        </header>

        {/* PAGE BODY */}
        <div className="p-8">

          {/* 1. DASHBOARD VIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              
              {/* KPI Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white border border-slate-200 rounded-3xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl"></div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Headcount</span>
                    <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                  <span className="block text-4xl font-extrabold text-slate-800">{employees.length}</span>
                  <span className="block text-[10px] text-slate-500 font-bold mt-2">Active corporate directories</span>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl"></div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Avg Engagement</span>
                    <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400">
                      <BrainCircuit className="w-5 h-5" />
                    </div>
                  </div>
                  <span className="block text-4xl font-extrabold text-slate-800">
                    {aiSummary ? `${aiSummary.averageEngagement}%` : '85%'}
                  </span>
                  <span className="block text-[10px] text-purple-400 font-bold mt-2">AI Workforce Happiness Index</span>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl"></div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Flight Risk Alerts</span>
                    <div className="p-2 bg-red-500/10 rounded-xl text-red-400">
                      <AlertTriangle className="w-5 h-5 animate-pulse" />
                    </div>
                  </div>
                  <span className="block text-4xl font-extrabold text-red-400">
                    {aiSummary ? aiSummary.highRiskCount : '1'}
                  </span>
                  <span className="block text-[10px] text-red-400 font-bold mt-2">Attrition risk level high</span>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl"></div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Active Leaves</span>
                    <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                      <Calendar className="w-5 h-5" />
                    </div>
                  </div>
                  <span className="block text-4xl font-extrabold text-slate-800">
                    {leaves.filter(l => l.status === 'APPROVED').length}
                  </span>
                  <span className="block text-[10px] text-slate-500 font-bold mt-2">Approved upcoming leaves</span>
                </div>
              </div>

              {/* Attendance column */}
              <div className="grid grid-cols-1 gap-8">
                
                {/* Recent Activity Feed */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6">
                  <h3 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2.5">
                    <Activity className="w-5 h-5 text-indigo-400" />
                    Today's Attendance Status
                  </h3>
                  
                  <div className="space-y-4">
                    {attendance.filter(a => a.date === new Date().toISOString().split('T')[0] || a.id <= 4).map((att) => {
                      const emp = employees.find(e => e.id === att.employeeId);
                      return (
                        <div key={att.id} className="bg-white/60 border border-slate-200 p-4 rounded-2xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-white rounded-lg text-slate-500">
                              <Briefcase className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="block font-semibold text-sm text-slate-800">{emp ? emp.name : `Employee ID: ${att.employeeId}`}</span>
                              <span className="block text-xs text-slate-500 mt-1">
                                {att.checkInTime ? `In: ${new Date(att.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : 'Absent'}
                                {att.checkOutTime && ` | Out: ${new Date(att.checkOutTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                              </span>
                            </div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide ${
                            att.status === 'PRESENT' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : att.status === 'LATE'
                              ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {att.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                

              </div>

            </div>
          )}

          {/* 2. EMPLOYEES VIEW */}
          {activeTab === 'employees' && hasRole(['ROLE_ADMIN', 'ROLE_MANAGER']) && (
            <div className="space-y-6">
              
              {/* Toolbar */}
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-5 h-5 text-slate-500 absolute left-4 top-3.5" />
                  <input 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, title, department..."
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-300 rounded-2xl text-slate-800 focus:outline-none focus:border-indigo-500 text-sm transition-all"
                  />
                </div>
                {hasRole(['ROLE_ADMIN']) && (
                  <button 
                    onClick={() => setShowAddEmpModal(true)}
                    className="py-3 px-5 bg-[#3fc05e] hover:bg-[#2da54c] text-white rounded-2xl font-semibold flex items-center gap-2 text-sm shadow-lg shadow-green-500/20 transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    Register Employee
                  </button>
                )}
              </div>

              {/* Employees List Grid */}
              <div className="bg-white/20 border border-slate-200 rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-white/35">
                        <th className="px-6 py-4.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Employee Name</th>
                        <th className="px-6 py-4.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Job Title</th>
                        <th className="px-6 py-4.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Department</th>
                        <th className="px-6 py-4.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Skills</th>
                        <th className="px-6 py-4.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Perf Rating</th>
                        <th className="px-6 py-4.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Flight Risk</th>
                        <th className="px-6 py-4.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/40">
                      {employees.filter(emp => 
                        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        emp.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())
                      ).map(emp => {
                        const dept = departments.find(d => d.id === emp.departmentId);
                        return (
                          <tr key={emp.id} className="hover:bg-white/20 transition-colors">
                            <td className="px-6 py-4.5">
                              <span className="block font-semibold text-sm text-slate-800">{emp.name}</span>
                              <span className="block text-xs text-slate-500 mt-0.5">{emp.email}</span>
                            </td>
                            <td className="px-6 py-4.5">
                              <span className="text-sm text-slate-600 font-medium">{emp.jobTitle}</span>
                            </td>
                            <td className="px-6 py-4.5">
                              <span className="text-sm text-slate-500 font-medium">{dept ? dept.name : 'Engineering'}</span>
                            </td>
                            <td className="px-6 py-4.5">
                              <span className="text-xs text-slate-500 truncate max-w-[200px] block font-medium">
                                {emp.skills || 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4.5">
                              <div className="flex items-center gap-1.5">
                                <Award className="w-4 h-4 text-yellow-500/80" />
                                <span className="text-sm text-slate-200 font-semibold">{emp.performanceRating || '3.5'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4.5">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide ${
                                emp.attritionRisk === 'HIGH' 
                                  ? 'bg-red-500/15 text-red-300 border border-red-500/20' 
                                  : emp.attritionRisk === 'MEDIUM'
                                  ? 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/20'
                                  : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                              }`}>
                                {emp.attritionRisk || 'LOW'}
                              </span>
                            </td>
                            <td className="px-6 py-4.5 text-right space-x-2">
                              <button 
                                onClick={() => { handleSelectEmployeeAiInsights(emp.id); setActiveTab('ai-insights'); }}
                                className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/25 rounded-xl text-xs font-semibold text-indigo-300 transition-all"
                              >
                                AI Review
                              </button>
                              {hasRole(['ROLE_ADMIN']) && (
                                <button 
                                  onClick={() => handleSelectEmpForSalary(emp.id)}
                                  className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/25 rounded-xl text-xs font-semibold text-emerald-300 transition-all"
                                >
                                  Configure Salary
                                </button>
                              )}
                              {hasRole(['ROLE_MANAGER']) && emp.id !== currentUserProfile?.id && (
                                <button 
                                  onClick={() => setSelectedEmpForReview(emp.id)}
                                  className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/25 rounded-xl text-xs font-semibold text-purple-300 transition-all"
                                >
                                  Submit Review
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* 3. LEAVES VIEW */}
          {activeTab === 'leaves' && (
            <div className="space-y-8">
              
              {/* Apply leave form (Only for Employee profiles) */}
              <div>
                <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-400" />
                    Request Leave
                  </h3>

                  <form onSubmit={handleApplyLeave} className="space-y-4">
                    <div>
                      <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Leave Type</label>
                      <select 
                        value={leaveType}
                        onChange={(e) => setLeaveType(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 text-sm"
                      >
                        <option value="ANNUAL">Annual Leave</option>
                        <option value="SICK">Sick Leave</option>
                        <option value="CASUAL">Casual Leave</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Start Date</label>
                      <input 
                        type="date"
                        value={leaveStart}
                        onChange={(e) => setLeaveStart(e.target.value)}
                        onClick={(e) => { try { (e.target as HTMLInputElement).showPicker(); } catch(err) {} }}
                        className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 text-sm cursor-pointer"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">End Date</label>
                      <input 
                        type="date"
                        value={leaveEnd}
                        onChange={(e) => setLeaveEnd(e.target.value)}
                        onClick={(e) => { try { (e.target as HTMLInputElement).showPicker(); } catch(err) {} }}
                        className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 text-sm cursor-pointer"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Reason</label>
                      <textarea 
                        value={leaveReason}
                        onChange={(e) => setLeaveReason(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 text-sm"
                        placeholder="Reason for leave request..."
                        rows={3}
                        required
                      />
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-slate-800 font-semibold rounded-xl text-sm transition-all"
                    >
                      Apply Leave
                    </button>
                  </form>
                </div>
              </div>

              {/* Leaves history */}
              <div className="space-y-6">
                <div className="bg-white border border-slate-200 rounded-3xl p-6">
                  <h3 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-400" />
                    Leave Tracking Records
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/50">
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Leave Type</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Duration</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Reason</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                          {hasRole(['ROLE_ADMIN', 'ROLE_MANAGER']) && <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {leaves.map(l => {
                          const emp = employees.find(e => e.id === l.employeeId);
                          return (
                            <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                                {emp ? emp.name : `ID: ${l.employeeId}`}
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600 font-medium">{l.leaveType}</td>
                              <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                                {l.startDate} to {l.endDate}
                              </td>
                              <td className="px-6 py-4 text-xs text-slate-500 max-w-[250px] truncate">{l.reason}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide ${
                                  l.status === 'APPROVED' 
                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                                    : l.status === 'PENDING'
                                    ? 'bg-yellow-50 text-yellow-600 border border-yellow-200'
                                    : 'bg-red-50 text-red-600 border border-red-200'
                                }`}>
                                  {l.status}
                                </span>
                              </td>
                              {hasRole(['ROLE_ADMIN', 'ROLE_MANAGER']) && (
                                <td className="px-6 py-4 text-right space-x-2">
                                  {l.status === 'PENDING' && (
                                    <>
                                      <button 
                                        onClick={() => handleUpdateLeave(l.id, 'APPROVED')}
                                        className="p-1.5 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-emerald-600 transition-all shadow-sm"
                                        title="Approve"
                                      >
                                        <Check className="w-4 h-4" />
                                      </button>
                                      <button 
                                        onClick={() => handleUpdateLeave(l.id, 'REJECTED')}
                                        className="p-1.5 bg-red-50 border border-red-200 hover:bg-red-100 rounded-lg text-red-600 transition-all shadow-sm"
                                        title="Reject"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </>
                                  )}
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* 4. PAYROLL VIEW */}
          {activeTab === 'payroll' && (
            <div className="space-y-8">
              
              {/* Admin configuration bar */}
              {hasRole(['ROLE_ADMIN']) && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white rounded-2xl text-slate-500">
                      <Sliders className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-800">Execute Monthly Payroll Run</h3>
                      <p className="text-slate-500 text-xs mt-1">Process salary calculation, taxes, and automatically output digital payslips.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <input 
                      type="text"
                      value={payrollPeriod}
                      onChange={(e) => setPayrollPeriod(e.target.value)}
                      className="px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none text-sm w-36"
                    />
                    <button 
                      onClick={handleRunPayroll}
                      className="py-2.5 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-slate-800 rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/10 transition-all"
                    >
                      Run Corporate Payroll
                    </button>
                  </div>
                </div>
              )}

              {/* Payslip lists */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6">
                <h3 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-indigo-400" />
                  Processed Payslip Archive
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Employee Name</th>
                        <th className="py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Pay Period</th>
                        <th className="py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Pay</th>
                        <th className="py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Deductions</th>
                        <th className="py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Tax Paid</th>
                        <th className="py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Net Salary</th>
                        <th className="py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Invoice</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/60">
                      {payslips.filter(p => hasRole(['ROLE_ADMIN', 'ROLE_MANAGER']) ? true : p.employeeId === currentUserProfile?.id).map((payslip) => {
                        const emp = employees.find(e => e.id === payslip.employeeId);
                        const gross = payslip.baseSalary + payslip.allowances;
                        return (
                          <tr key={payslip.id}>
                            <td className="py-4 text-sm font-semibold text-slate-800">
                              {emp ? emp.name : `Employee ID: ${payslip.employeeId}`}
                            </td>
                            <td className="py-4 text-sm text-slate-600 font-medium">{payslip.payPeriod}</td>
                            <td className="py-4 text-sm text-slate-600 font-medium">${gross.toFixed(2)}</td>
                            <td className="py-4 text-sm text-slate-500 font-medium">${payslip.deductions.toFixed(2)}</td>
                            <td className="py-4 text-sm text-slate-500 font-medium">${payslip.tax.toFixed(2)}</td>
                            <td className="py-4 text-sm text-indigo-400 font-semibold">${payslip.netSalary.toFixed(2)}</td>
                            <td className="py-4">
                              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-extrabold tracking-wide rounded-full">
                                {payslip.status}
                              </span>
                            </td>
                            <td className="py-4 text-right">
                              <button 
                                onClick={() => setShowPayslipModal(payslip)}
                                className="p-1.5 bg-white border border-slate-300 hover:border-slate-700 hover:text-slate-800 rounded-lg text-slate-500 transition-all inline-flex items-center gap-1.5 text-xs font-semibold"
                              >
                                <Download className="w-3.5 h-3.5" />
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* 5. AI-POWERED WORKFORCE INTELLIGENCE VIEW */}
          {activeTab === 'ai-insights' && hasRole(['ROLE_ADMIN', 'ROLE_MANAGER']) && (
            <div className="space-y-8 h-full flex flex-col">
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-[600px]">
                
                {/* Left: Smart Action Board (Kanban Style) */}
                <div className="lg:col-span-1 space-y-6 flex flex-col">
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 flex-1 shadow-sm">
                    <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-indigo-500" />
                      Proactive Action Board
                    </h3>
                    
                    <div className="space-y-4">
                      {/* Flight Risks */}
                      <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" /> Flight Risks
                          </span>
                          <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">2 Action Items</span>
                        </div>
                        <div className="space-y-2">
                          <div className="bg-white rounded-xl p-3 shadow-sm border border-red-100/50 flex justify-between items-center cursor-pointer hover:border-red-300 transition-colors">
                            <div>
                              <span className="block text-sm font-semibold text-slate-800">Sarah Jenkins</span>
                              <span className="block text-[10px] text-slate-500">Low engagement, stale comp</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          </div>
                          <div className="bg-white rounded-xl p-3 shadow-sm border border-red-100/50 flex justify-between items-center cursor-pointer hover:border-red-300 transition-colors">
                            <div>
                              <span className="block text-sm font-semibold text-slate-800">Mike Thompson</span>
                              <span className="block text-[10px] text-slate-500">High stress, missed leave</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          </div>
                        </div>
                      </div>

                      {/* Ready for Promotion */}
                      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5" /> Promotion Candidates
                          </span>
                          <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">3 Ready</span>
                        </div>
                        <div className="space-y-2">
                          <div className="bg-white rounded-xl p-3 shadow-sm border border-emerald-100/50 flex justify-between items-center cursor-pointer hover:border-emerald-300 transition-colors">
                            <div>
                              <span className="block text-sm font-semibold text-slate-800">Emily Chen</span>
                              <span className="block text-[10px] text-slate-500">Exceeded KPIs 3 quarters</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          </div>
                        </div>
                      </div>

                      {/* Training Gaps */}
                      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5" /> Skill Gaps
                          </span>
                          <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">1 Training Needed</span>
                        </div>
                        <div className="bg-white rounded-xl p-3 shadow-sm border border-amber-100/50 flex justify-between items-center cursor-pointer hover:border-amber-300 transition-colors">
                          <div>
                            <span className="block text-sm font-semibold text-slate-800">Engineering Pod B</span>
                            <span className="block text-[10px] text-slate-500">Leadership & Management</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                {/* Right: AI Chat Interface */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col h-full">
                  
                  {/* Chat Header */}
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-inner shadow-indigo-400/20">
                      <BrainCircuit className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">Nexus AI Assistant</h3>
                      <span className="text-xs font-semibold text-indigo-500 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        Online & Analyzing
                      </span>
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50/30">
                    {aiChatMessages.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${
                          msg.role === 'user' 
                            ? 'bg-indigo-600 text-white rounded-br-none' 
                            : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    {isAiTyping && (
                      <div className="flex justify-start">
                        <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none p-4 shadow-sm flex gap-1.5 items-center">
                          <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></span>
                          <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                          <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chat Input */}
                  <div className="p-6 bg-white border-t border-slate-100">
                    <form onSubmit={handleAiChatSubmit} className="relative flex items-center">
                      <input 
                        type="text"
                        value={aiChatInput}
                        onChange={(e) => setAiChatInput(e.target.value)}
                        placeholder="Ask me anything about the workforce..."
                        className="w-full pl-5 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
                      />
                      <button 
                        type="submit"
                        disabled={!aiChatInput.trim() || isAiTyping}
                        className="absolute right-2 p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl transition-all"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                    <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 self-center mr-1">Suggestions:</span>
                      <button type="button" onClick={() => setAiChatInput('Who are the biggest flight risks?')} className="shrink-0 text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg font-medium transition-colors">Find flight risks</button>
                      <button type="button" onClick={() => setAiChatInput('Who is ready for a promotion?')} className="shrink-0 text-xs text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg font-medium transition-colors">Promotion candidates</button>
                      <button type="button" onClick={() => setAiChatInput('What skills does engineering need?')} className="shrink-0 text-xs text-amber-600 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg font-medium transition-colors">Analyze skill gaps</button>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}

        </div>
      </main>

      {/* MODAL: REGISTER EMPLOYEE */}
      {showAddEmpModal && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-300 max-w-md w-full rounded-3xl p-6 relative overflow-hidden shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              Register New Employee
            </h3>

            <form onSubmit={handleCreateEmployee} className="space-y-4">
              <div>
                <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Full Name</label>
                <input 
                  type="text"
                  value={newEmpName}
                  onChange={(e) => setNewEmpName(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 text-sm"
                  placeholder="Enter employee name..."
                  required
                />
              </div>

              <div>
                <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Corporate Email</label>
                <input 
                  type="email"
                  value={newEmpEmail}
                  onChange={(e) => setNewEmpEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 text-sm"
                  placeholder="name@nexushr.com"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Job Title</label>
                <input 
                  type="text"
                  value={newEmpTitle}
                  onChange={(e) => setNewEmpTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 text-sm"
                  placeholder="Software Engineer"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Department</label>
                <select 
                  value={newEmpDept}
                  onChange={(e) => setNewEmpDept(parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Skills (Comma-separated)</label>
                <input 
                  type="text"
                  value={newEmpSkills}
                  onChange={(e) => setNewEmpSkills(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none"
                  placeholder="Java, React, SQL..."
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowAddEmpModal(false)}
                  className="flex-1 py-3 bg-white border border-slate-300 text-slate-500 font-semibold rounded-xl text-sm transition-all hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-slate-800 font-semibold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/10"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW / DOWNLOAD PAYSLIP */}
      {showPayslipModal && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-300 max-w-lg w-full rounded-3xl p-8 relative overflow-hidden shadow-2xl space-y-6">
            
            {/* Header info */}
            <div className="text-center border-b border-slate-300 pb-5">
              <div className="inline-flex items-center gap-2 text-indigo-400 mb-2">
                <BrainCircuit className="w-5 h-5" />
                <span className="font-bold text-sm tracking-wide uppercase">NexusHR System</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-800">Salary Invoice / Payslip</h2>
              <span className="text-xs text-slate-500 mt-1 block">Pay Period: {showPayslipModal.payPeriod}</span>
            </div>

            {/* Payslip body layout */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 font-medium">Employee Reference ID</span>
                <span className="text-slate-800 font-bold">EMP-00{showPayslipModal.employeeId}</span>
              </div>

              <div className="border-t border-slate-200 pt-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-bold uppercase tracking-wider">Earnings</span>
                  <span className="text-slate-500 font-bold uppercase tracking-wider">Amount</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 font-medium">Base Salary</span>
                  <span className="text-slate-800 font-semibold">${showPayslipModal.baseSalary.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 font-medium">Allowances</span>
                  <span className="text-slate-800 font-semibold">${showPayslipModal.allowances.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-bold uppercase tracking-wider">Deductions & Tax</span>
                  <span className="text-slate-500 font-bold uppercase tracking-wider">Amount</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 font-medium">Company Deductions</span>
                  <span className="text-slate-800 font-semibold">-${showPayslipModal.deductions.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 font-medium">Income Tax</span>
                  <span className="text-slate-800 font-semibold">-${showPayslipModal.tax.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-slate-300 pt-4 flex items-center justify-between bg-indigo-500/5 p-4 rounded-2xl border border-indigo-500/10">
                <span className="text-indigo-300 text-sm font-bold">Net Disbursed Pay</span>
                <span className="text-indigo-400 text-xl font-extrabold">${showPayslipModal.netSalary.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => window.print()}
                className="flex-1 py-3 bg-white border border-slate-300 text-slate-600 font-semibold rounded-xl text-xs transition-all hover:bg-slate-200"
              >
                Print Invoice
              </button>
              <button 
                onClick={() => setShowPayslipModal(null)}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-slate-800 font-semibold rounded-xl text-xs transition-all shadow-lg"
              >
                Close Payslip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SUBMIT PERFORMANCE REVIEW */}
      {selectedEmpForReview && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-300 max-w-md w-full rounded-3xl p-6 relative overflow-hidden shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-400" />
              Submit Performance Review
            </h3>

            <form onSubmit={handleSubmitPerformanceReview} className="space-y-4">
              <div>
                <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Performance Rating (1.0 - 5.0)</label>
                <input 
                  type="number"
                  step="0.1"
                  min="1.0"
                  max="5.0"
                  value={reviewRating}
                  onChange={(e) => setReviewRating(parseFloat(e.target.value))}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Key Goals Achieved</label>
                <textarea
                  value={reviewGoals}
                  onChange={(e) => setReviewGoals(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none"
                  placeholder="Detail primary goals completed..."
                  rows={2}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Detailed Manager Feedback</label>
                <textarea
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none"
                  placeholder="Enter manager audit comments..."
                  rows={3}
                  required
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setSelectedEmpForReview(null)}
                  className="flex-1 py-3 bg-white border border-slate-300 text-slate-500 font-semibold rounded-xl text-xs hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-slate-800 font-semibold rounded-xl text-xs shadow-lg"
                >
                  Submit Performance Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIGURE SALARY */}
      {selectedEmpForSalary && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-300 max-w-md w-full rounded-3xl p-6 relative overflow-hidden shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-indigo-400" />
              Configure Salary Plan
            </h3>

            <form onSubmit={handleUpdateSalaryConfig} className="space-y-4">
              <div>
                <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Base Salary ($)</label>
                <input 
                  type="number"
                  value={salaryBase}
                  onChange={(e) => setSalaryBase(parseFloat(e.target.value))}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Corporate Allowances ($)</label>
                <input 
                  type="number"
                  value={salaryAllowances}
                  onChange={(e) => setSalaryAllowances(parseFloat(e.target.value))}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Monthly Deductions ($)</label>
                <input 
                  type="number"
                  value={salaryDeductions}
                  onChange={(e) => setSalaryDeductions(parseFloat(e.target.value))}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Income Tax Rate (e.g., 0.15 = 15%)</label>
                <input 
                  type="number"
                  step="0.01"
                  min="0.0"
                  max="1.0"
                  value={salaryTaxRate}
                  onChange={(e) => setSalaryTaxRate(parseFloat(e.target.value))}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setSelectedEmpForSalary(null)}
                  className="flex-1 py-3 bg-white border border-slate-300 text-slate-500 font-semibold rounded-xl text-xs hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-slate-800 font-semibold rounded-xl text-xs shadow-lg"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
