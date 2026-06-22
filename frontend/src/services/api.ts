// NexusHR API Client with LocalStorage Fallback for Resilient Demos

const BASE_URL = 'http://localhost:8080/api';

// Helper to check if backend is running (optional, we can do try-catch on requests)
export let useMock = false;

// Seed local storage with initial data if empty
const initMockDatabase = () => {
  if (!localStorage.getItem('nexushr_seeded')) {
    localStorage.setItem('nexushr_users', JSON.stringify([
      { id: 1, username: 'admin', email: 'admin@nexushr.com', password: 'admin123', roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'], active: true },
      { id: 2, username: 'sarah', email: 'sarah@nexushr.com', password: 'sarah123', roles: ['ROLE_MANAGER', 'ROLE_EMPLOYEE'], active: true },
      { id: 3, username: 'john', email: 'john.doe@nexushr.com', password: 'john123', roles: ['ROLE_EMPLOYEE'], active: true },
      { id: 4, username: 'jane', email: 'jane.smith@nexushr.com', password: 'jane123', roles: ['ROLE_EMPLOYEE'], active: true }
    ]));

    localStorage.setItem('nexushr_employees', JSON.stringify([
      { id: 1, name: 'System Administrator', email: 'admin@nexushr.com', jobTitle: 'HR Director', departmentId: 2, userId: 1, status: 'ACTIVE', performanceRating: 4.8, attritionRisk: 'LOW', engagementScore: 95, joinDate: '2023-01-15', skills: 'HR Management, Leadership, Conflict Resolution' },
      { id: 2, name: 'Sarah Connor', email: 'sarah@nexushr.com', jobTitle: 'Engineering Manager', departmentId: 1, userId: 2, status: 'ACTIVE', performanceRating: 4.5, attritionRisk: 'LOW', engagementScore: 88, joinDate: '2023-06-10', skills: 'Java, System Design, Team Leadership, Agile' },
      { id: 3, name: 'John Doe', email: 'john.doe@nexushr.com', jobTitle: 'Software Engineer', departmentId: 1, managerId: 2, userId: 3, status: 'ACTIVE', performanceRating: 4.2, attritionRisk: 'LOW', engagementScore: 85, joinDate: '2024-02-01', skills: 'Java, Spring Boot, React, SQL' },
      { id: 4, name: 'Jane Smith', email: 'jane.smith@nexushr.com', jobTitle: 'Junior Developer', departmentId: 1, managerId: 2, userId: 4, status: 'ACTIVE', performanceRating: 2.8, attritionRisk: 'HIGH', engagementScore: 45, joinDate: '2025-09-01', skills: 'HTML, CSS, JavaScript' }
    ]));

    localStorage.setItem('nexushr_departments', JSON.stringify([
      { id: 1, name: 'Engineering', managerId: 2 },
      { id: 2, name: 'Human Resources', managerId: 1 },
      { id: 3, name: 'Finance', managerId: 1 },
      { id: 4, name: 'Sales', managerId: 1 }
    ]));

    localStorage.setItem('nexushr_attendance', JSON.stringify([
      { id: 1, employeeId: 3, date: '2026-06-11', checkInTime: '2026-06-11T08:50:00', checkOutTime: '2026-06-11T17:30:00', status: 'PRESENT' },
      { id: 2, employeeId: 3, date: '2026-06-12', checkInTime: '2026-06-12T08:55:00', checkOutTime: '2026-06-12T17:40:00', status: 'PRESENT' },
      { id: 3, employeeId: 4, date: '2026-06-11', checkInTime: '2026-06-11T09:45:00', checkOutTime: '2026-06-11T18:00:00', status: 'LATE' },
      { id: 4, employeeId: 4, date: '2026-06-12', checkInTime: null, checkOutTime: null, status: 'ABSENT' }
    ]));

    localStorage.setItem('nexushr_leaves', JSON.stringify([
      { id: 1, employeeId: 3, startDate: '2026-06-20', endDate: '2026-06-22', leaveType: 'CASUAL', status: 'PENDING', reason: 'Family event' },
      { id: 2, employeeId: 4, startDate: '2026-06-05', endDate: '2026-06-06', leaveType: 'SICK', status: 'APPROVED', reason: 'Doctor appointment' }
    ]));

    localStorage.setItem('nexushr_performance', JSON.stringify([
      { id: 1, employeeId: 3, reviewerId: 2, reviewDate: '2026-05-15', goals: 'Deliver microservices components and integration tests.', rating: 4.2, feedback: 'Excellent progress on the backend modules. Very reliable and proactive.' },
      { id: 2, employeeId: 4, reviewerId: 2, reviewDate: '2026-04-10', goals: 'Complete front-end mockups and learn React state management.', rating: 2.8, feedback: 'Needs improvement on React concepts. Commits are sometimes delayed.' }
    ]));

    localStorage.setItem('nexushr_salary_configs', JSON.stringify([
      { id: 1, employeeId: 1, baseSalary: 9500.0, allowances: 1500.0, deductions: 600.0, taxRate: 0.20 },
      { id: 2, employeeId: 2, baseSalary: 8500.0, allowances: 1200.0, deductions: 500.0, taxRate: 0.18 },
      { id: 3, employeeId: 3, baseSalary: 6200.0, allowances: 800.0, deductions: 300.0, taxRate: 0.15 },
      { id: 4, employeeId: 4, baseSalary: 3800.0, allowances: 400.0, deductions: 200.0, taxRate: 0.10 }
    ]));

    localStorage.setItem('nexushr_payslips', JSON.stringify([
      { id: 1, employeeId: 3, payPeriod: 'May 2026', baseSalary: 6200.0, allowances: 800.0, deductions: 300.0, tax: 1050.0, netSalary: 5650.0, status: 'PAID', processedDate: '2026-05-28' },
      { id: 2, employeeId: 4, payPeriod: 'May 2026', baseSalary: 3800.0, allowances: 400.0, deductions: 200.0, tax: 420.0, netSalary: 3580.0, status: 'PAID', processedDate: '2026-05-28' }
    ]));

    localStorage.setItem('nexushr_seeded', 'true');
  }
};

initMockDatabase();

// Auth token helpers
const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('nexushr_token');
  return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
};

// Generic request wrapper that handles fallback to local storage
const request = async (path: string, options: RequestInit = {}) => {
  if (useMock) {
    return mockRequest(path, options);
  }

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired/invalid
        localStorage.removeItem('nexushr_token');
        localStorage.removeItem('nexushr_user');
      }
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || `API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    // If backend is down, log warning and failover to localStorage for seamless demo experience
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.message.includes('type')) {
      console.warn(`Backend server unreachable at ${BASE_URL}. Switching to LocalStorage database client-side fallback.`);
      useMock = true;
      return mockRequest(path, options);
    }
    throw error;
  }
};

// Mock request engine utilizing LocalStorage data
const mockRequest = (path: string, options: RequestInit = {}): any => {
  const body = options.body ? JSON.parse(options.body as string) : null;
  const method = options.method || 'GET';

  const getTable = (name: string): any[] => JSON.parse(localStorage.getItem(`nexushr_${name}`) || '[]');
  const saveTable = (name: string, data: any[]) => localStorage.setItem(`nexushr_${name}`, JSON.stringify(data));

  // 1. Auth Service Mocking
  if (path.startsWith('/auth/login')) {
    const users = getTable('users');
    const user = users.find(u => u.username === body.username || u.email === body.username);
    if (user && user.password === body.password) {
      const token = `mock-jwt-token-for-${user.username}`;
      localStorage.setItem('nexushr_token', token);
      const userDetails = { username: user.username, email: user.email, roles: user.roles };
      localStorage.setItem('nexushr_user', JSON.stringify(userDetails));
      return { success: true, message: 'Login successful', data: { accessToken: token, refreshToken: token, ...userDetails } };
    }
    throw new Error('Invalid username or password');
  }

  if (path.startsWith('/auth/signup')) {
    const users = getTable('users');
    if (users.some(u => u.username === body.username)) throw new Error('Username already exists');
    if (users.some(u => u.email === body.email)) throw new Error('Email already exists');

    const newUser = {
      id: Date.now(),
      username: body.username,
      email: body.email,
      password: body.password || 'password123',
      roles: body.roles || ['ROLE_EMPLOYEE'],
      active: true
    };
    users.push(newUser);
    saveTable('users', users);

    // Auto-create employee profile
    const employees = getTable('employees');
    const newEmp = {
      id: newUser.id,
      name: body.username.charAt(0).toUpperCase() + body.username.slice(1),
      email: body.email,
      jobTitle: 'New Hire',
      departmentId: 1,
      userId: newUser.id,
      status: 'ACTIVE',
      performanceRating: 3.0,
      attritionRisk: 'LOW',
      engagementScore: 75,
      joinDate: new Date().toISOString().split('T')[0],
      skills: 'Communication'
    };
    employees.push(newEmp);
    saveTable('employees', employees);

    return { success: true, message: 'Signup successful', data: { id: newUser.id, username: newUser.username, email: newUser.email, roles: newUser.roles, active: true } };
  }

  if (path.startsWith('/auth/me')) {
    const token = localStorage.getItem('nexushr_token');
    if (!token) throw new Error('Unauthorized');
    const username = token.replace('mock-jwt-token-for-', '');
    const users = getTable('users');
    const user = users.find(u => u.username === username);
    if (!user) throw new Error('User not found');
    return { success: true, data: { id: user.id, username: user.username, email: user.email, roles: user.roles, active: user.active } };
  }

  // 2. Employee Service Mocking
  if (path.startsWith('/employees')) {
    const employees = getTable('employees');
    if (method === 'GET') {
      const match = path.match(/\/employees\/(\d+)/);
      if (match) {
        const emp = employees.find(e => e.id === parseInt(match[1]));
        if (!emp) throw new Error('Employee not found');
        return { success: true, data: emp };
      }
      const userMatch = path.match(/\/employees\/user\/(\d+)/);
      if (userMatch) {
        const emp = employees.find(e => e.userId === parseInt(userMatch[1]));
        if (!emp) throw new Error('Employee profile not found');
        return { success: true, data: emp };
      }
      return { success: true, data: employees };
    }

    if (method === 'POST') {
      const newEmp = { ...body, id: Date.now() };
      employees.push(newEmp);
      saveTable('employees', employees);
      return { success: true, data: newEmp };
    }

    if (method === 'PUT') {
      const match = path.match(/\/employees\/(\d+)/);
      if (match) {
        const id = parseInt(match[1]);
        const index = employees.findIndex(e => e.id === id);
        if (index === -1) throw new Error('Employee not found');
        employees[index] = { ...employees[index], ...body };
        saveTable('employees', employees);
        return { success: true, data: employees[index] };
      }
    }

    if (method === 'DELETE') {
      const match = path.match(/\/employees\/(\d+)/);
      if (match) {
        const id = parseInt(match[1]);
        const updated = employees.filter(e => e.id !== id);
        saveTable('employees', updated);
        return { success: true, message: 'Deleted successfully' };
      }
    }
  }

  // 3. Departments
  if (path.startsWith('/departments')) {
    const depts = getTable('departments');
    if (method === 'GET') return { success: true, data: depts };
    if (method === 'POST') {
      const newDept = { ...body, id: Date.now() };
      depts.push(newDept);
      saveTable('departments', depts);
      return { success: true, data: newDept };
    }
  }

  // 4. Attendance
  if (path.startsWith('/attendance')) {
    const atts = getTable('attendance');
    if (path.includes('/check-in/')) {
      const empId = parseInt(path.split('/').pop() || '0');
      const today = new Date().toISOString().split('T')[0];
      if (atts.some(a => a.employeeId === empId && a.date === today)) {
        throw new Error('Already checked in today');
      }
      const newAtt = {
        id: Date.now(),
        employeeId: empId,
        date: today,
        checkInTime: new Date().toISOString(),
        checkOutTime: null,
        status: new Date().getHours() >= 9 ? 'LATE' : 'PRESENT'
      };
      atts.push(newAtt);
      saveTable('attendance', atts);
      return { success: true, data: newAtt };
    }

    if (path.includes('/check-out/')) {
      const empId = parseInt(path.split('/').pop() || '0');
      const today = new Date().toISOString().split('T')[0];
      const att = atts.find(a => a.employeeId === empId && a.date === today);
      if (!att) throw new Error('Check-in record not found for today');
      att.checkOutTime = new Date().toISOString();
      saveTable('attendance', atts);
      return { success: true, data: att };
    }

    if (path.includes('/employee/')) {
      const empId = parseInt(path.split('/').pop() || '0');
      return { success: true, data: atts.filter(a => a.employeeId === empId) };
    }

    return { success: true, data: atts };
  }

  // 5. Leaves
  if (path.startsWith('/leaves')) {
    const leaves = getTable('leaves');
    if (method === 'GET') {
      if (path.includes('/employee/')) {
        const empId = parseInt(path.split('/').pop() || '0');
        return { success: true, data: leaves.filter(l => l.employeeId === empId) };
      }
      return { success: true, data: leaves };
    }

    if (method === 'POST') {
      const newLeave = { ...body, id: Date.now(), status: 'PENDING' };
      leaves.push(newLeave);
      saveTable('leaves', leaves);
      return { success: true, data: newLeave };
    }

    if (method === 'PUT' && path.includes('/status')) {
      const id = parseInt(path.split('/')[2]);
      const leave = leaves.find(l => l.id === id);
      if (!leave) throw new Error('Leave request not found');
      leave.status = body.status;
      saveTable('leaves', leaves);
      return { success: true, data: leave };
    }
  }

  // 6. Performance Reviews
  if (path.startsWith('/performance')) {
    const revs = getTable('performance');
    if (method === 'GET') {
      if (path.includes('/employee/')) {
        const empId = parseInt(path.split('/').pop() || '0');
        return { success: true, data: revs.filter(r => r.employeeId === empId) };
      }
      return { success: true, data: revs };
    }

    if (method === 'POST') {
      const newReview = { ...body, id: Date.now(), reviewDate: new Date().toISOString().split('T')[0] };
      revs.push(newReview);
      saveTable('performance', revs);

      // Update employee rating
      const employees = getTable('employees');
      const emp = employees.find(e => e.id === body.employeeId);
      if (emp) {
        emp.performanceRating = body.rating;
        saveTable('employees', employees);
      }

      return { success: true, data: newReview };
    }
  }

  // 7. AI Insights
  if (path.startsWith('/ai-insights')) {
    if (path.includes('/employee/')) {
      const empId = parseInt(path.split('/').pop() || '0');
      const employees = getTable('employees');
      const emp = employees.find(e => e.id === empId);
      if (!emp) throw new Error('Employee not found');

      const skillsList = emp.skills ? emp.skills.split(',').map((s: string) => s.trim()) : [];
      const required = emp.jobTitle?.toLowerCase().includes('manager')
        ? ['Java', 'System Design', 'Team Leadership', 'Agile', 'Budgeting', 'Product Strategy']
        : ['Java', 'Spring Boot', 'React', 'SQL', 'Docker', 'Git'];
      const gap = required.filter(s => !skillsList.includes(s));

      return {
        success: true,
        data: {
          employeeName: emp.name,
          jobTitle: emp.jobTitle,
          engagementScore: emp.engagementScore || 75,
          attrition: {
            riskLevel: emp.attritionRisk || 'LOW',
            drivers: emp.attritionRisk === 'HIGH'
              ? ['Low Performance Score', 'Reduced Attendance Rates', 'Long Commute Interval']
              : ['Standard employee attributes'],
            recommendation: emp.attritionRisk === 'HIGH'
              ? 'Schedule an immediate career progress 1-on-1. Offer skill upgrades.'
              : 'Maintain current retention protocols.'
          },
          skills: {
            current: skillsList,
            required: required,
            gap: gap,
            trainingRecommendation: gap.length > 0
              ? `Enrol in: ${gap.map(s => s + ' Masterclass').join(', ')}`
              : 'Meets role qualifications.'
          }
        }
      };
    }

    if (path.includes('/summary')) {
      const emps = getTable('employees');
      const high = emps.filter(e => e.attritionRisk === 'HIGH').length;
      const med = emps.filter(e => e.attritionRisk === 'MEDIUM').length;
      const low = emps.filter(e => e.attritionRisk === 'LOW').length;
      const totalEngagement = emps.reduce((acc, curr) => acc + (curr.engagementScore || 75), 0);

      return {
        success: true,
        data: {
          totalEmployees: emps.length,
          highRiskCount: high,
          mediumRiskCount: med,
          lowRiskCount: low,
          averageEngagement: emps.length ? Math.round(totalEngagement / emps.length) : 75
        }
      };
    }
  }

  // 8. Payroll Services
  if (path.startsWith('/payroll')) {
    const configs = getTable('salary_configs');
    if (path.includes('/config/')) {
      const empId = parseInt(path.split('/').pop() || '0');
      const config = configs.find(c => c.employeeId === empId);
      return { success: true, data: config || { employeeId: empId, baseSalary: 3000, allowances: 200, deductions: 100, taxRate: 0.10 } };
    }

    if (path.startsWith('/payroll/config')) {
      const index = configs.findIndex(c => c.employeeId === body.employeeId);
      if (index !== -1) {
        configs[index] = { ...configs[index], ...body };
      } else {
        configs.push({ ...body, id: Date.now() });
      }
      saveTable('salary_configs', configs);
      return { success: true, data: body };
    }

    if (path.startsWith('/payroll/run')) {
      const payPeriod = body.payPeriod;
      const slips = getTable('payslips');
      const employees = getTable('employees');

      const results = employees.map(emp => {
        const config = configs.find(c => c.employeeId === emp.id) || { baseSalary: 4000, allowances: 500, deductions: 200, taxRate: 0.12 };
        const gross = config.baseSalary + config.allowances;
        const tax = gross * config.taxRate;
        const net = gross - config.deductions - tax;

        const slip = {
          id: Date.now() + Math.random(),
          employeeId: emp.id,
          payPeriod: payPeriod,
          baseSalary: config.baseSalary,
          allowances: config.allowances,
          deductions: config.deductions,
          tax: tax,
          netSalary: net,
          status: 'PAID',
          processedDate: new Date().toISOString().split('T')[0]
        };

        slips.push(slip);
        return slip;
      });

      saveTable('payslips', slips);
      return { success: true, data: results };
    }
  }

  if (path.startsWith('/payslips')) {
    const slips = getTable('payslips');
    if (path.includes('/employee/')) {
      const empId = parseInt(path.split('/').pop() || '0');
      return { success: true, data: slips.filter(s => s.employeeId === empId) };
    }
    return { success: true, data: slips };
  }

  throw new Error(`Endpoint mock not implemented: ${path}`);
};

export const api = {
  login: (credentials: any) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  signup: (userData: any) => request('/auth/signup', { method: 'POST', body: JSON.stringify(userData) }),
  logout: () => {
    localStorage.removeItem('nexushr_token');
    localStorage.removeItem('nexushr_user');
    useMock = false; // Reset fallback state
    return Promise.resolve({ success: true });
  },
  getMe: () => request('/auth/me'),

  // Employees
  getEmployees: () => request('/employees'),
  getEmployeeById: (id: number) => request(`/employees/${id}`),
  getEmployeeByUserId: (userId: number) => request(`/employees/user/${userId}`),
  createEmployee: (data: any) => request('/employees', { method: 'POST', body: JSON.stringify(data) }),
  updateEmployee: (id: number, data: any) => request(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEmployee: (id: number) => request(`/employees/${id}`, { method: 'DELETE' }),

  // Departments
  getDepartments: () => request('/departments'),
  createDepartment: (data: any) => request('/departments', { method: 'POST', body: JSON.stringify(data) }),

  // Attendance
  checkIn: (employeeId: number) => request(`/attendance/check-in/${employeeId}`, { method: 'POST' }),
  checkOut: (employeeId: number) => request(`/attendance/check-out/${employeeId}`, { method: 'POST' }),
  getEmployeeAttendance: (employeeId: number) => request(`/attendance/employee/${employeeId}`),
  getTodayAttendance: () => request('/attendance/today'),
  getAllAttendance: () => request('/attendance'),

  // Leaves
  applyLeave: (data: any) => request('/leaves', { method: 'POST', body: JSON.stringify(data) }),
  updateLeaveStatus: (id: number, status: string) => request(`/leaves/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  getEmployeeLeaves: (employeeId: number) => request(`/leaves/employee/${employeeId}`),
  getAllLeaves: () => request('/leaves'),

  // Performance Reviews
  submitPerformanceReview: (data: any) => request('/performance', { method: 'POST', body: JSON.stringify(data) }),
  getEmployeeReviews: (employeeId: number) => request(`/performance/employee/${employeeId}`),
  getAllReviews: () => request('/performance'),

  // AI Insights
  getEmployeeAiInsights: (employeeId: number) => request(`/ai-insights/employee/${employeeId}`),
  getGlobalAiSummary: () => request('/ai-insights/summary'),
  triggerAiRecalculate: () => request('/ai-insights/simulate-run', { method: 'POST' }),

  // Payroll
  getSalaryConfig: (employeeId: number) => request(`/payroll/config/${employeeId}`),
  updateSalaryConfig: (data: any) => request('/payroll/config', { method: 'POST', body: JSON.stringify(data) }),
  runPayroll: (payPeriod: string) => request('/payroll/run', { method: 'POST', body: JSON.stringify({ payPeriod }) }),
  getEmployeePayslips: (employeeId: number) => request(`/payslips/employee/${employeeId}`),
  getAllPayslips: () => request('/payslips'),
};
