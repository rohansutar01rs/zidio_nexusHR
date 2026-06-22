import React, { useState, useEffect } from 'react';
import { 
  Users, Calendar, DollarSign, BrainCircuit, LogOut, Clock, User, Plus, Search, 
  Award, Shield, Activity, Check, X, Briefcase, Sliders, Download, AlertTriangle, ChevronRight
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
  LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { api, useMock } from './services/api';
import LandingPage from './LandingPage';

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
  const [showLogin, setShowLogin] = useState(false);

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
  const [activeEmployeeAi, setActiveEmployeeAi] = useState<any>(null);

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

  const handleSelectEmployeeAiInsights = async (empId: number) => {
    try {
      const res = await api.getEmployeeAiInsights(empId);
      setActiveEmployeeAi(res.data);
    } catch (err) {
      console.error('Error fetching employee AI insights:', err);
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

  // Prepare Chart Data
  const attritionData = [
    { name: 'Low Risk', count: aiSummary?.lowRiskCount || 0, fill: '#10b981' },
    { name: 'Medium Risk', count: aiSummary?.mediumRiskCount || 0, fill: '#f59e0b' },
    { name: 'High Risk', count: aiSummary?.highRiskCount || 0, fill: '#ef4444' }
  ];

  const trendData = [
    { name: 'Jan', score: 72 },
    { name: 'Feb', score: 75 },
    { name: 'Mar', score: 78 },
    { name: 'Apr', score: 81 },
    { name: 'May', score: 83 },
    { name: 'Jun', score: aiSummary?.averageEngagement || 85 }
  ];

  // Render Login / Signup Form
  if (!user) {
    if (!showLogin) {
      return <LandingPage onLoginClick={() => setShowLogin(true)} />;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070A13] px-4">
        <div className="max-w-md w-full bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600"></div>
          
          <button 
            onClick={() => setShowLogin(false)}
            className="absolute top-4 right-4 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 mb-3">
              <BrainCircuit className="w-10 h-10 animate-pulse" />
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">NexusHR</h2>
            <p className="text-slate-400 mt-2 text-sm">AI-Enabled Enterprise HR & Workforce Intelligence</p>
          </div>

          {authError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-200 text-sm px-4 py-3 rounded-xl mb-6 text-center">
              {authError}
            </div>
          )}

          {!isSignup ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">Username or Email</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="Enter username..." 
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="••••••••" 
                  required
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98]"
              >
                Log In
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">Username</label>
                <input 
                  type="text" 
                  value={signupUsername}
                  onChange={(e) => setSignupUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="johndoe" 
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">Email Address</label>
                <input 
                  type="email" 
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="john.doe@nexushr.com" 
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">Password</label>
                <input 
                  type="password" 
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="••••••••" 
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">Role Type</label>
                <select
                  value={signupRole}
                  onChange={(e) => setSignupRole(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="ROLE_EMPLOYEE">Standard Employee</option>
                  <option value="ROLE_MANAGER">Department Manager</option>
                  <option value="ROLE_ADMIN">System Administrator</option>
                </select>
              </div>

              <button 
                type="submit" 
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg transition-all active:scale-[0.98]"
              >
                Sign Up Account
              </button>
            </form>
          )}

          <div className="mt-6 border-t border-slate-800/80 pt-6">
            <span className="block text-center text-xs text-slate-500 font-semibold mb-3">QUICK LOG IN OPTIONS</span>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => { demoLogin('admin'); setIsSignup(false); }} className="px-2 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg text-xs font-medium text-slate-300 hover:text-white transition-all">Admin Profile</button>
              <button onClick={() => { demoLogin('manager'); setIsSignup(false); }} className="px-2 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg text-xs font-medium text-slate-300 hover:text-white transition-all">Manager Profile</button>
              <button onClick={() => { demoLogin('employee'); setIsSignup(false); }} className="px-2 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg text-xs font-medium text-slate-300 hover:text-white transition-all">Employee Portal</button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <button 
              onClick={() => { setIsSignup(!isSignup); setAuthError(''); }}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
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
    <div className="min-h-screen flex bg-[#070A13]">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-950/80 border-r border-slate-900 flex flex-col justify-between select-none">
        <div>
          {/* Logo */}
          <div className="p-6 flex items-center gap-3 border-b border-slate-900">
            <div className="p-2 bg-indigo-600 rounded-xl text-white">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <span className="block font-bold text-lg text-white leading-tight">NexusHR</span>
              <span className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Workforce Intel</span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1.5">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'dashboard' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' 
                  : 'text-slate-400 hover:bg-slate-900/60 hover:text-white'
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
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' 
                    : 'text-slate-400 hover:bg-slate-900/60 hover:text-white'
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
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' 
                  : 'text-slate-400 hover:bg-slate-900/60 hover:text-white'
              }`}
            >
              <Calendar className="w-5 h-5" />
              Leaves & Holidays
            </button>

            <button 
              onClick={() => setActiveTab('payroll')}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'payroll' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' 
                  : 'text-slate-400 hover:bg-slate-900/60 hover:text-white'
              }`}
            >
              <DollarSign className="w-5 h-5" />
              Payroll Center
            </button>

            {hasRole(['ROLE_ADMIN', 'ROLE_MANAGER']) && (
              <button 
                onClick={() => setActiveTab('ai-insights')}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'ai-insights' 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' 
                    : 'text-slate-400 hover:bg-slate-900/60 hover:text-white'
                }`}
              >
                <BrainCircuit className="w-5 h-5 animate-pulse text-indigo-400" />
                AI Workforce Insights
              </button>
            )}
          </nav>
        </div>

        {/* Sidebar Footer User Details */}
        <div className="p-4 border-t border-slate-900">
          <div className="bg-slate-900/40 p-3.5 rounded-2xl flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
              <User className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <span className="block font-semibold text-sm text-white truncate">{user.username}</span>
              <span className="block text-[10px] font-bold text-indigo-400 tracking-wider flex items-center gap-1">
                <Shield className="w-3 h-3 inline" />
                {user.roles[0].replace('ROLE_', '')}
              </span>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="w-full py-2.5 flex items-center justify-center gap-2 border border-slate-800/80 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 text-slate-400 font-semibold rounded-xl text-xs transition-all"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        
        {/* HEADER */}
        <header className="px-8 py-5 border-b border-slate-900 bg-slate-950/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-extrabold text-white capitalize tracking-tight">{activeTab.replace('-', ' ')}</span>
            {useMock && (
              <span className="px-2 py-0.5 bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 text-[10px] font-bold rounded-full ml-3 tracking-wide">
                DEMO OFFLINE MODE
              </span>
            )}
          </div>
          
          {/* Biometric Simulation Widget (Employee Specific) */}
          {currentUserProfile && (
            <div className="flex items-center gap-4">
              <div className="bg-slate-900/80 px-4 py-2 border border-slate-800 rounded-2xl flex items-center gap-3">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-semibold text-slate-300">
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
                <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl"></div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Headcount</span>
                    <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                  <span className="block text-4xl font-extrabold text-white">{employees.length}</span>
                  <span className="block text-[10px] text-slate-500 font-bold mt-2">Active corporate directories</span>
                </div>

                <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl"></div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Avg Engagement</span>
                    <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400">
                      <BrainCircuit className="w-5 h-5" />
                    </div>
                  </div>
                  <span className="block text-4xl font-extrabold text-white">
                    {aiSummary ? `${aiSummary.averageEngagement}%` : '85%'}
                  </span>
                  <span className="block text-[10px] text-purple-400 font-bold mt-2">AI Workforce Happiness Index</span>
                </div>

                <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl"></div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Flight Risk Alerts</span>
                    <div className="p-2 bg-red-500/10 rounded-xl text-red-400">
                      <AlertTriangle className="w-5 h-5 animate-pulse" />
                    </div>
                  </div>
                  <span className="block text-4xl font-extrabold text-red-400">
                    {aiSummary ? aiSummary.highRiskCount : '1'}
                  </span>
                  <span className="block text-[10px] text-red-400 font-bold mt-2">Attrition risk level high</span>
                </div>

                <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl"></div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Active Leaves</span>
                    <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                      <Calendar className="w-5 h-5" />
                    </div>
                  </div>
                  <span className="block text-4xl font-extrabold text-white">
                    {leaves.filter(l => l.status === 'APPROVED').length}
                  </span>
                  <span className="block text-[10px] text-slate-500 font-bold mt-2">Approved upcoming leaves</span>
                </div>
              </div>

              {/* Attendance and Leaves columns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Left: Recent Activity Feed */}
                <div className="bg-slate-900/30 border border-slate-900/80 rounded-3xl p-6">
                  <h3 className="text-base font-bold text-white mb-5 flex items-center gap-2.5">
                    <Activity className="w-5 h-5 text-indigo-400" />
                    Today's Attendance Status
                  </h3>
                  
                  <div className="space-y-4">
                    {attendance.filter(a => a.date === new Date().toISOString().split('T')[0] || a.id <= 4).map((att) => {
                      const emp = employees.find(e => e.id === att.employeeId);
                      return (
                        <div key={att.id} className="bg-slate-950/40 border border-slate-900/40 p-4 rounded-2xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-slate-900 rounded-lg text-slate-400">
                              <Briefcase className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="block font-semibold text-sm text-white">{emp ? emp.name : `Employee ID: ${att.employeeId}`}</span>
                              <span className="block text-xs text-slate-400 mt-1">
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

                {/* Right: Leaves Pending Approval (Manager / Admin view) or History (Employee view) */}
                <div className="bg-slate-900/30 border border-slate-900/80 rounded-3xl p-6">
                  <h3 className="text-base font-bold text-white mb-5 flex items-center gap-2.5">
                    <Calendar className="w-5 h-5 text-indigo-400" />
                    {hasRole(['ROLE_ADMIN', 'ROLE_MANAGER']) ? 'Pending Leave Requests' : 'Your Leave Requests'}
                  </h3>

                  <div className="space-y-4">
                    {leaves.filter(l => hasRole(['ROLE_ADMIN', 'ROLE_MANAGER']) ? l.status === 'PENDING' : l.employeeId === currentUserProfile?.id).slice(0, 4).map((leave) => {
                      const emp = employees.find(e => e.id === leave.employeeId);
                      return (
                        <div key={leave.id} className="bg-slate-950/40 border border-slate-900/40 p-4 rounded-2xl">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="block font-semibold text-sm text-white">
                                {hasRole(['ROLE_ADMIN', 'ROLE_MANAGER']) ? (emp ? emp.name : `Employee ${leave.employeeId}`) : leave.leaveType}
                              </span>
                              <span className="block text-xs text-slate-400 mt-1">
                                {leave.startDate} to {leave.endDate}
                              </span>
                              <span className="block text-xs text-slate-500 italic mt-2">
                                "{leave.reason}"
                              </span>
                            </div>
                            
                            {hasRole(['ROLE_ADMIN', 'ROLE_MANAGER']) && leave.status === 'PENDING' ? (
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => handleUpdateLeave(leave.id, 'APPROVED')}
                                  className="p-1.5 bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 rounded-lg text-emerald-400 transition-all"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleUpdateLeave(leave.id, 'REJECTED')}
                                  className="p-1.5 bg-red-500/15 border border-red-500/30 hover:bg-red-500/25 rounded-lg text-red-400 transition-all"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide ${
                                leave.status === 'APPROVED' 
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                  : leave.status === 'PENDING'
                                  ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
                              }`}>
                                {leave.status}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {leaves.filter(l => hasRole(['ROLE_ADMIN', 'ROLE_MANAGER']) ? l.status === 'PENDING' : l.employeeId === currentUserProfile?.id).length === 0 && (
                      <div className="text-center py-8 text-xs text-slate-500 font-semibold">
                        No active leave requests found.
                      </div>
                    )}
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
                    className="w-full pl-12 pr-4 py-3 bg-slate-900/40 border border-slate-800 rounded-2xl text-white focus:outline-none focus:border-indigo-500 text-sm transition-all"
                  />
                </div>
                {hasRole(['ROLE_ADMIN']) && (
                  <button 
                    onClick={() => setShowAddEmpModal(true)}
                    className="py-3 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-semibold flex items-center gap-2 text-sm shadow-lg shadow-indigo-600/10 transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    Register Employee
                  </button>
                )}
              </div>

              {/* Employees List Grid */}
              <div className="bg-slate-900/20 border border-slate-900 rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-900/80 bg-slate-950/35">
                        <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Employee Name</th>
                        <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Job Title</th>
                        <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Department</th>
                        <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Skills</th>
                        <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Perf Rating</th>
                        <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Flight Risk</th>
                        <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/40">
                      {employees.filter(emp => 
                        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        emp.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())
                      ).map(emp => {
                        const dept = departments.find(d => d.id === emp.departmentId);
                        return (
                          <tr key={emp.id} className="hover:bg-slate-900/20 transition-colors">
                            <td className="px-6 py-4.5">
                              <span className="block font-semibold text-sm text-white">{emp.name}</span>
                              <span className="block text-xs text-slate-500 mt-0.5">{emp.email}</span>
                            </td>
                            <td className="px-6 py-4.5">
                              <span className="text-sm text-slate-300 font-medium">{emp.jobTitle}</span>
                            </td>
                            <td className="px-6 py-4.5">
                              <span className="text-sm text-slate-400 font-medium">{dept ? dept.name : 'Engineering'}</span>
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left column: apply leave form (Only for Employee profiles) */}
              <div className="lg:col-span-1">
                <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-400" />
                    Request Leave
                  </h3>

                  <form onSubmit={handleApplyLeave} className="space-y-4">
                    <div>
                      <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Leave Type</label>
                      <select 
                        value={leaveType}
                        onChange={(e) => setLeaveType(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 text-sm"
                      >
                        <option value="ANNUAL">Annual Leave</option>
                        <option value="SICK">Sick Leave</option>
                        <option value="CASUAL">Casual Leave</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Start Date</label>
                      <input 
                        type="date"
                        value={leaveStart}
                        onChange={(e) => setLeaveStart(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">End Date</label>
                      <input 
                        type="date"
                        value={leaveEnd}
                        onChange={(e) => setLeaveEnd(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Reason</label>
                      <textarea 
                        value={leaveReason}
                        onChange={(e) => setLeaveReason(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 text-sm"
                        placeholder="Reason for leave request..."
                        rows={3}
                        required
                      />
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm transition-all"
                    >
                      Apply Leave
                    </button>
                  </form>
                </div>
              </div>

              {/* Right column: leaves history */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6">
                  <h3 className="text-base font-bold text-white mb-5 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-400" />
                    Leave Tracking Records
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-900">
                          <th className="py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Employee</th>
                          <th className="py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Leave Type</th>
                          <th className="py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Duration</th>
                          <th className="py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Reason</th>
                          <th className="py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                          {hasRole(['ROLE_ADMIN', 'ROLE_MANAGER']) && <th className="py-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900/60">
                        {leaves.map(l => {
                          const emp = employees.find(e => e.id === l.employeeId);
                          return (
                            <tr key={l.id}>
                              <td className="py-4.5 text-sm font-semibold text-white">
                                {emp ? emp.name : `ID: ${l.employeeId}`}
                              </td>
                              <td className="py-4.5 text-sm text-slate-300 font-medium">{l.leaveType}</td>
                              <td className="py-4.5 text-sm text-slate-400 font-medium">
                                {l.startDate} to {l.endDate}
                              </td>
                              <td className="py-4.5 text-xs text-slate-400 max-w-[150px] truncate">{l.reason}</td>
                              <td className="py-4.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide ${
                                  l.status === 'APPROVED' 
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                    : l.status === 'PENDING'
                                    ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                }`}>
                                  {l.status}
                                </span>
                              </td>
                              {hasRole(['ROLE_ADMIN', 'ROLE_MANAGER']) && (
                                <td className="py-4.5 text-right space-x-1.5">
                                  {l.status === 'PENDING' && (
                                    <>
                                      <button 
                                        onClick={() => handleUpdateLeave(l.id, 'APPROVED')}
                                        className="p-1 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/25 rounded-lg text-emerald-400 transition-all"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                      </button>
                                      <button 
                                        onClick={() => handleUpdateLeave(l.id, 'REJECTED')}
                                        className="p-1 bg-red-500/10 border border-red-500/20 hover:bg-red-500/25 rounded-lg text-red-400 transition-all"
                                      >
                                        <X className="w-3.5 h-3.5" />
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
                <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-slate-950 rounded-2xl text-slate-400">
                      <Sliders className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Execute Monthly Payroll Run</h3>
                      <p className="text-slate-400 text-xs mt-1">Process salary calculation, taxes, and automatically output digital payslips.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <input 
                      type="text"
                      value={payrollPeriod}
                      onChange={(e) => setPayrollPeriod(e.target.value)}
                      className="px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none text-sm w-36"
                    />
                    <button 
                      onClick={handleRunPayroll}
                      className="py-2.5 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/10 transition-all"
                    >
                      Run Corporate Payroll
                    </button>
                  </div>
                </div>
              )}

              {/* Payslip lists */}
              <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6">
                <h3 className="text-base font-bold text-white mb-5 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-indigo-400" />
                  Processed Payslip Archive
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-900">
                        <th className="py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Employee Name</th>
                        <th className="py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Pay Period</th>
                        <th className="py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Pay</th>
                        <th className="py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Deductions</th>
                        <th className="py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Tax Paid</th>
                        <th className="py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Net Salary</th>
                        <th className="py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                        <th className="py-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Invoice</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/60">
                      {payslips.filter(p => hasRole(['ROLE_ADMIN', 'ROLE_MANAGER']) ? true : p.employeeId === currentUserProfile?.id).map((payslip) => {
                        const emp = employees.find(e => e.id === payslip.employeeId);
                        const gross = payslip.baseSalary + payslip.allowances;
                        return (
                          <tr key={payslip.id}>
                            <td className="py-4 text-sm font-semibold text-white">
                              {emp ? emp.name : `Employee ID: ${payslip.employeeId}`}
                            </td>
                            <td className="py-4 text-sm text-slate-300 font-medium">{payslip.payPeriod}</td>
                            <td className="py-4 text-sm text-slate-300 font-medium">${gross.toFixed(2)}</td>
                            <td className="py-4 text-sm text-slate-400 font-medium">${payslip.deductions.toFixed(2)}</td>
                            <td className="py-4 text-sm text-slate-400 font-medium">${payslip.tax.toFixed(2)}</td>
                            <td className="py-4 text-sm text-indigo-400 font-semibold">${payslip.netSalary.toFixed(2)}</td>
                            <td className="py-4">
                              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-extrabold tracking-wide rounded-full">
                                {payslip.status}
                              </span>
                            </td>
                            <td className="py-4 text-right">
                              <button 
                                onClick={() => setShowPayslipModal(payslip)}
                                className="p-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 hover:text-white rounded-lg text-slate-400 transition-all inline-flex items-center gap-1.5 text-xs font-semibold"
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

          {/* 5. AI WORKFORCE INSIGHTS VIEW */}
          {activeTab === 'ai-insights' && hasRole(['ROLE_ADMIN', 'ROLE_MANAGER']) && (
            <div className="space-y-8">
              
              {/* Global AI workforce analytics widgets */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 1. Attrition Risk distribution */}
                <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6">
                  <span className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">Workforce Risk Distribution</span>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={attritionData}>
                        <XAxis dataKey="name" stroke="#475569" fontSize={11} tickLine={false} />
                        <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                        <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                          {attritionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 2. Engagement trends */}
                <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6">
                  <span className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">Engagement Index Trend</span>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                        <XAxis dataKey="name" stroke="#475569" fontSize={11} tickLine={false} />
                        <YAxis domain={[40, 100]} stroke="#475569" fontSize={11} tickLine={false} />
                        <Tooltip />
                        <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Selector Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Employee List Selector */}
                <div className="lg:col-span-1 bg-slate-900/40 border border-slate-900 rounded-3xl p-6">
                  <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-400" />
                    Select Employee for AI Audit
                  </h3>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {employees.map(emp => (
                      <button 
                        key={emp.id}
                        onClick={() => handleSelectEmployeeAiInsights(emp.id)}
                        className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                          activeEmployeeAi?.employeeName === emp.name
                            ? 'bg-indigo-600/10 border-indigo-600'
                            : 'bg-slate-950/40 border-slate-900 hover:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="block font-semibold text-sm text-white">{emp.name}</span>
                          <span className="block text-[10px] text-slate-400 font-medium mt-0.5">{emp.jobTitle}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right: Detailed AI Audit Panel */}
                <div className="lg:col-span-2 bg-slate-900/40 border border-slate-900 rounded-3xl p-6">
                  {activeEmployeeAi ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
                        <div>
                          <h3 className="text-lg font-bold text-white">{activeEmployeeAi.employeeName}</h3>
                          <span className="text-xs text-slate-400 font-medium">{activeEmployeeAi.jobTitle} AI Workforce Profile</span>
                        </div>
                        <div className="bg-indigo-500/10 px-3.5 py-1.5 border border-indigo-500/20 rounded-2xl flex items-center gap-2">
                          <Activity className="w-4 h-4 text-indigo-400" />
                          <span className="text-xs font-bold text-indigo-300">Predictive Intelligence Active</span>
                        </div>
                      </div>

                      {/* Flight Risk and Engagement Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Flight Risk Alert */}
                        <div className="bg-slate-950/40 border border-slate-900/60 p-5 rounded-2xl relative overflow-hidden">
                          <span className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">Attrition Risk Evaluation</span>
                          <div className="flex items-baseline gap-2">
                            <span className={`text-3xl font-black ${
                              activeEmployeeAi.attrition.riskLevel === 'HIGH' ? 'text-red-400' : 'text-emerald-400'
                            }`}>
                              {activeEmployeeAi.attrition.riskLevel}
                            </span>
                          </div>
                          
                          <div className="mt-4 space-y-1">
                            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Identified Risk Drivers</span>
                            {activeEmployeeAi.attrition.drivers.map((driver: string, idx: number) => (
                              <span key={idx} className="text-xs text-slate-300 flex items-center gap-2">
                                <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                                {driver}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Engagement Index */}
                        <div className="bg-slate-950/40 border border-slate-900/60 p-5 rounded-2xl">
                          <span className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">Workforce Engagement Index</span>
                          <span className="text-3xl font-black text-indigo-400">{activeEmployeeAi.engagementScore}%</span>
                          <div className="w-full bg-slate-900 rounded-full h-1.5 mt-3">
                            <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${activeEmployeeAi.engagementScore}%` }}></div>
                          </div>
                          <span className="block text-[10px] text-slate-500 mt-2 font-medium">Derived from system attendance, performance history & leaves</span>
                        </div>

                      </div>

                      {/* Skill Gaps Analysis */}
                      <div className="bg-slate-950/20 border border-slate-900 p-5 rounded-2xl space-y-4">
                        <span className="block text-slate-300 text-xs font-bold uppercase tracking-wider">Roles Competency & Skill Gap Analysis</span>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Current Skills</span>
                              <div className="flex flex-wrap gap-1.5">
                                {activeEmployeeAi.skills.current.map((skill: string, idx: number) => (
                                  <span key={idx} className="px-2.5 py-1 bg-slate-900/60 border border-slate-800 rounded-lg text-xs font-medium text-slate-300">{skill}</span>
                                ))}
                              </div>
                            </div>

                            <div>
                              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Missing Target Competencies</span>
                              <div className="flex flex-wrap gap-1.5">
                                {activeEmployeeAi.skills.gap.map((skill: string, idx: number) => (
                                  <span key={idx} className="px-2.5 py-1 bg-red-500/10 border border-red-500/20 rounded-lg text-xs font-medium text-red-300">{skill}</span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Skills gap Radar chart */}
                          <div className="h-60 mt-4 bg-slate-950/20 rounded-2xl p-2 border border-slate-900">
                            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">Competency Radar Matrix</span>
                            <ResponsiveContainer width="100%" height="80%">
                              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={
                                activeEmployeeAi.skills.required.map((skill: string) => {
                                  const hasSkill = activeEmployeeAi.skills.current.includes(skill);
                                  return {
                                    subject: skill,
                                    current: hasSkill ? 100 : 0,
                                    required: 100,
                                    fullMark: 100
                                  };
                                })
                              }>
                                <PolarGrid stroke="#1e293b" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#475569' }} />
                                <Radar name="Employee" dataKey="current" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                                <Radar name="Required" dataKey="required" stroke="#ec4899" fill="#ec4899" fillOpacity={0.1} />
                                <Tooltip />
                              </RadarChart>
                            </ResponsiveContainer>
                          </div>

                        </div>

                        <div className="border-t border-slate-900/80 pt-4">
                          <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">AI Recommendation Action</span>
                          <p className="text-xs text-indigo-300 leading-relaxed font-semibold">
                            {activeEmployeeAi.attrition.recommendation}
                          </p>
                          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                            {activeEmployeeAi.skills.trainingRecommendation}
                          </p>
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="h-[400px] flex flex-col items-center justify-center text-center text-slate-500">
                      <BrainCircuit className="w-12 h-12 text-slate-600 mb-3 animate-pulse" />
                      <span className="text-xs font-bold uppercase tracking-wider">No Employee Audited</span>
                      <p className="text-xs text-slate-600 max-w-xs mt-1">Select an employee from the left panel to execute real-time AI predictive attrition and skill analysis.</p>
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

        </div>
      </main>

      {/* MODAL: REGISTER EMPLOYEE */}
      {showAddEmpModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-md w-full rounded-3xl p-6 relative overflow-hidden shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              Register New Employee
            </h3>

            <form onSubmit={handleCreateEmployee} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Full Name</label>
                <input 
                  type="text"
                  value={newEmpName}
                  onChange={(e) => setNewEmpName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 text-sm"
                  placeholder="Enter employee name..."
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Corporate Email</label>
                <input 
                  type="email"
                  value={newEmpEmail}
                  onChange={(e) => setNewEmpEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 text-sm"
                  placeholder="name@nexushr.com"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Job Title</label>
                <input 
                  type="text"
                  value={newEmpTitle}
                  onChange={(e) => setNewEmpTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 text-sm"
                  placeholder="Software Engineer"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Department</label>
                <select 
                  value={newEmpDept}
                  onChange={(e) => setNewEmpDept(parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Skills (Comma-separated)</label>
                <input 
                  type="text"
                  value={newEmpSkills}
                  onChange={(e) => setNewEmpSkills(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
                  placeholder="Java, React, SQL..."
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowAddEmpModal(false)}
                  className="flex-1 py-3 bg-slate-950 border border-slate-800 text-slate-400 font-semibold rounded-xl text-sm transition-all hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/10"
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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-lg w-full rounded-3xl p-8 relative overflow-hidden shadow-2xl space-y-6">
            
            {/* Header info */}
            <div className="text-center border-b border-slate-800 pb-5">
              <div className="inline-flex items-center gap-2 text-indigo-400 mb-2">
                <BrainCircuit className="w-5 h-5" />
                <span className="font-bold text-sm tracking-wide uppercase">NexusHR System</span>
              </div>
              <h2 className="text-xl font-extrabold text-white">Salary Invoice / Payslip</h2>
              <span className="text-xs text-slate-500 mt-1 block">Pay Period: {showPayslipModal.payPeriod}</span>
            </div>

            {/* Payslip body layout */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 font-medium">Employee Reference ID</span>
                <span className="text-white font-bold">EMP-00{showPayslipModal.employeeId}</span>
              </div>

              <div className="border-t border-slate-800/80 pt-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-bold uppercase tracking-wider">Earnings</span>
                  <span className="text-slate-500 font-bold uppercase tracking-wider">Amount</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300 font-medium">Base Salary</span>
                  <span className="text-white font-semibold">${showPayslipModal.baseSalary.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300 font-medium">Allowances</span>
                  <span className="text-white font-semibold">${showPayslipModal.allowances.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-slate-800/80 pt-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-bold uppercase tracking-wider">Deductions & Tax</span>
                  <span className="text-slate-500 font-bold uppercase tracking-wider">Amount</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300 font-medium">Company Deductions</span>
                  <span className="text-white font-semibold">-${showPayslipModal.deductions.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300 font-medium">Income Tax</span>
                  <span className="text-white font-semibold">-${showPayslipModal.tax.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-4 flex items-center justify-between bg-indigo-500/5 p-4 rounded-2xl border border-indigo-500/10">
                <span className="text-indigo-300 text-sm font-bold">Net Disbursed Pay</span>
                <span className="text-indigo-400 text-xl font-extrabold">${showPayslipModal.netSalary.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => window.print()}
                className="flex-1 py-3 bg-slate-950 border border-slate-800 text-slate-300 font-semibold rounded-xl text-xs transition-all hover:bg-slate-800"
              >
                Print Invoice
              </button>
              <button 
                onClick={() => setShowPayslipModal(null)}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition-all shadow-lg"
              >
                Close Payslip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SUBMIT PERFORMANCE REVIEW */}
      {selectedEmpForReview && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-md w-full rounded-3xl p-6 relative overflow-hidden shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-400" />
              Submit Performance Review
            </h3>

            <form onSubmit={handleSubmitPerformanceReview} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Performance Rating (1.0 - 5.0)</label>
                <input 
                  type="number"
                  step="0.1"
                  min="1.0"
                  max="5.0"
                  value={reviewRating}
                  onChange={(e) => setReviewRating(parseFloat(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Key Goals Achieved</label>
                <textarea
                  value={reviewGoals}
                  onChange={(e) => setReviewGoals(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
                  placeholder="Detail primary goals completed..."
                  rows={2}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Detailed Manager Feedback</label>
                <textarea
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
                  placeholder="Enter manager audit comments..."
                  rows={3}
                  required
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setSelectedEmpForReview(null)}
                  className="flex-1 py-3 bg-slate-950 border border-slate-800 text-slate-400 font-semibold rounded-xl text-xs hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs shadow-lg"
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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-md w-full rounded-3xl p-6 relative overflow-hidden shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-indigo-400" />
              Configure Salary Plan
            </h3>

            <form onSubmit={handleUpdateSalaryConfig} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Base Salary ($)</label>
                <input 
                  type="number"
                  value={salaryBase}
                  onChange={(e) => setSalaryBase(parseFloat(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Corporate Allowances ($)</label>
                <input 
                  type="number"
                  value={salaryAllowances}
                  onChange={(e) => setSalaryAllowances(parseFloat(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Monthly Deductions ($)</label>
                <input 
                  type="number"
                  value={salaryDeductions}
                  onChange={(e) => setSalaryDeductions(parseFloat(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Income Tax Rate (e.g., 0.15 = 15%)</label>
                <input 
                  type="number"
                  step="0.01"
                  min="0.0"
                  max="1.0"
                  value={salaryTaxRate}
                  onChange={(e) => setSalaryTaxRate(parseFloat(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setSelectedEmpForSalary(null)}
                  className="flex-1 py-3 bg-slate-950 border border-slate-800 text-slate-400 font-semibold rounded-xl text-xs hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs shadow-lg"
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
