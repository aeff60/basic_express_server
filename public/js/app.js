// Global variables
let currentUser = null;
let authToken = localStorage.getItem('authToken');
let currentAttendance = null;
let isOnBreak = false;
let clockInterval = null;
const API_BASE = 'http://localhost:3000/api';

// Utility functions
function showSection(sectionId) {
    const sections = ['welcomeSection', 'loginSection', 'registerSection', 'attendanceSection', 'timesheetSection', 'profileSection'];
    sections.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.classList.remove('section-visible', 'section-flex');
            element.classList.add('section-hidden');
            
            if (id === sectionId) {
                element.classList.remove('section-hidden');
                element.classList.add('section-visible');
                
                // Force display style for auth sections
                if (id === 'loginSection' || id === 'registerSection') {
                    element.style.display = 'flex';
                }
            } else {
                // Explicitly hide other sections
                if (id === 'loginSection' || id === 'registerSection') {
                    element.style.display = 'none';
                }
            }
        }
    });
}

function showLoading(show = true) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        if (show) {
            overlay.classList.remove('hidden');
            overlay.classList.add('flex-visible');
        } else {
            overlay.classList.remove('flex-visible');
            overlay.classList.add('hidden');
        }
    }
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.classList.remove('hidden');
        element.classList.add('visible');
        setTimeout(() => {
            element.classList.remove('visible');
            element.classList.add('hidden');
        }, 5000);
    }
}

function showSuccess(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.classList.remove('hidden');
        element.classList.add('visible');
        setTimeout(() => {
            element.classList.remove('visible');
            element.classList.add('hidden');
        }, 5000);
    }
}

function updateNavigation() {
    const navLinks = document.getElementById('navLinks');
    const userNavLinks = document.getElementById('userNavLinks');
    
    if (authToken && currentUser) {
        navLinks.classList.add('hidden');
        userNavLinks.classList.remove('hidden');
        userNavLinks.classList.add('flex-visible');
    } else {
        navLinks.classList.remove('hidden');
        navLinks.classList.add('flex-visible');
        userNavLinks.classList.add('hidden');
        userNavLinks.classList.remove('flex-visible');
    }
}

// API functions
async function apiCall(endpoint, options = {}) {
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        ...options
    };

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'เกิดข้อผิดพลาด');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Authentication functions
function showLogin() {
    showSection('loginSection');
}

function showRegister() {
    showSection('registerSection');
}

async function handleLogin(event) {
    event.preventDefault();
    showLoading(true);
    
    const employeeId = document.getElementById('loginEmployeeId').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await apiCall('/login', {
            method: 'POST',
            body: JSON.stringify({ employeeId, password })
        });
        
        authToken = response.token;
        currentUser = response.user;
        localStorage.setItem('authToken', authToken);
        
        updateNavigation();
        showAttendance();
        showStatusMessage('เข้าสู่ระบบสำเร็จ!', 'success');
        
        // Start real-time clock
        startClock();
        
        // Load today's attendance
        loadTodayAttendance();
        
    } catch (error) {
        showError('loginError', error.message);
    } finally {
        showLoading(false);
    }
}

async function handleRegister(event) {
    event.preventDefault();
    showLoading(true);
    
    const name = document.getElementById('registerName').value;
    const employeeId = document.getElementById('registerEmployeeId').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const department = document.getElementById('registerDepartment').value;
    const position = document.getElementById('registerPosition').value;
    const salary = parseFloat(document.getElementById('registerSalary').value);
    const phone = document.getElementById('registerPhone').value;
    
    try {
        const response = await apiCall('/register', {
            method: 'POST',
            body: JSON.stringify({ 
                name, employeeId, email, password, 
                department, position, salary, phone 
            })
        });
        
        showSuccess('registerSuccess', 'ลงทะเบียนพนักงานสำเร็จ! กรุณาเข้าสู่ระบบ');
        
        // Clear form
        document.getElementById('registerForm').reset();
        
        // Show login after 2 seconds
        setTimeout(() => {
            showLogin();
        }, 2000);
        
    } catch (error) {
        showError('registerError', error.message);
    } finally {
        showLoading(false);
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    currentAttendance = null;
    isOnBreak = false;
    localStorage.removeItem('authToken');
    
    // Stop clock
    if (clockInterval) {
        clearInterval(clockInterval);
        clockInterval = null;
    }
    
    updateNavigation();
    showSection('welcomeSection');
}

// Clock functions
function startClock() {
    if (clockInterval) clearInterval(clockInterval);
    
    clockInterval = setInterval(() => {
        const now = new Date();
        document.getElementById('currentTime').textContent = now.toLocaleTimeString('th-TH');
        document.getElementById('currentDate').textContent = now.toLocaleDateString('th-TH', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }, 1000);
    
    // Initial update
    const now = new Date();
    document.getElementById('currentTime').textContent = now.toLocaleTimeString('th-TH');
    document.getElementById('currentDate').textContent = now.toLocaleDateString('th-TH', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function showStatusMessage(message, type = 'info') {
    const statusElement = document.getElementById('statusMessage');
    const statusText = document.getElementById('statusText');
    
    if (statusElement && statusText) {
        statusText.textContent = message;
        statusElement.classList.remove('hidden');
        
        // Auto hide after 3 seconds
        setTimeout(() => {
            statusElement.classList.add('hidden');
        }, 3000);
    }
}

// Attendance functions
function showAttendance() {
    showSection('attendanceSection');
    startClock();
    loadTodayAttendance();
}

function showTimesheet() {
    showSection('timesheetSection');
    initializeMonthFilter();
    loadAttendanceHistory();
    loadAttendanceStats();
}

async function loadTodayAttendance() {
    try {
        const response = await apiCall('/attendance/today');
        currentAttendance = response.attendance;
        updateAttendanceUI();
    } catch (error) {
        console.error('Error loading today attendance:', error);
        currentAttendance = null;
        updateAttendanceUI();
    }
}

function updateAttendanceUI() {
    const clockInBtn = document.getElementById('clockInBtn');
    const clockOutBtn = document.getElementById('clockOutBtn');
    const breakBtn = document.getElementById('breakBtn');
    const checkInTime = document.getElementById('checkInTime');
    const checkOutTime = document.getElementById('checkOutTime');
    const workHours = document.getElementById('workHours');
    
    if (currentAttendance) {
        if (currentAttendance.checkIn) {
            checkInTime.textContent = new Date(currentAttendance.checkIn).toLocaleTimeString('th-TH');
            clockInBtn.disabled = true;
            clockOutBtn.disabled = false;
            breakBtn.disabled = false;
            
            if (currentAttendance.breakStart && !currentAttendance.breakEnd) {
                isOnBreak = true;
                breakBtn.innerHTML = '<i class="fas fa-play"></i> กลับมาทำงาน';
            } else {
                isOnBreak = false;
                breakBtn.innerHTML = '<i class="fas fa-coffee"></i> พัก';
            }
        }
        
        if (currentAttendance.checkOut) {
            checkOutTime.textContent = new Date(currentAttendance.checkOut).toLocaleTimeString('th-TH');
            clockOutBtn.disabled = true;
            breakBtn.disabled = true;
        }
        
        workHours.textContent = `${currentAttendance.workHours || 0} ชม.`;
    } else {
        checkInTime.textContent = '-';
        checkOutTime.textContent = '-';
        workHours.textContent = '0.0 ชม.';
        clockInBtn.disabled = false;
        clockOutBtn.disabled = true;
        breakBtn.disabled = true;
    }
}

async function clockIn() {
    showLoading(true);
    
    try {
        const location = await getCurrentLocation();
        const response = await apiCall('/attendance/clock-in', {
            method: 'POST',
            body: JSON.stringify({ location })
        });
        
        currentAttendance = response.attendance;
        updateAttendanceUI();
        showStatusMessage('ลงเวลาเข้างานสำเร็จ!', 'success');
        
    } catch (error) {
        showStatusMessage('เกิดข้อผิดพลาด: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function clockOut() {
    showLoading(true);
    
    try {
        const location = await getCurrentLocation();
        const response = await apiCall('/attendance/clock-out', {
            method: 'POST',
            body: JSON.stringify({ location })
        });
        
        currentAttendance = response.attendance;
        updateAttendanceUI();
        showStatusMessage('ลงเวลาออกงานสำเร็จ!', 'success');
        
    } catch (error) {
        showStatusMessage('เกิดข้อผิดพลาด: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function toggleBreak() {
    showLoading(true);
    
    try {
        const endpoint = isOnBreak ? '/attendance/break-end' : '/attendance/break-start';
        const response = await apiCall(endpoint, {
            method: 'POST'
        });
        
        currentAttendance = response.attendance;
        updateAttendanceUI();
        
        const message = isOnBreak ? 'กลับมาทำงานแล้ว!' : 'เริ่มพักแล้ว!';
        showStatusMessage(message, 'success');
        
    } catch (error) {
        showStatusMessage('เกิดข้อผิดพลาด: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function getCurrentLocation() {
    return new Promise((resolve) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                },
                () => {
                    resolve(null);
                }
            );
        } else {
            resolve(null);
        }
    });
}

function initializeMonthFilter() {
    const monthFilter = document.getElementById('monthFilter');
    const currentDate = new Date();
    
    monthFilter.innerHTML = '<option value="">เลือกเดือน</option>';
    
    for (let i = 11; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const text = date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long' });
        
        const option = document.createElement('option');
        option.value = value;
        option.textContent = text;
        
        if (i === 0) option.selected = true;
        
        monthFilter.appendChild(option);
    }
}

async function loadAttendanceHistory() {
    showLoading(true);
    
    try {
        const monthFilter = document.getElementById('monthFilter');
        let params = '?page=1&limit=31';
        
        if (monthFilter.value) {
            const [year, month] = monthFilter.value.split('-');
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);
            params += `&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
        }
        
        const response = await apiCall(`/attendance/history${params}`);
        displayAttendanceHistory(response.attendanceHistory);
        
    } catch (error) {
        const historyElement = document.getElementById('attendanceHistory');
        historyElement.innerHTML = `
            <div class="text-center error-state">
                <i class="fas fa-exclamation-triangle error-icon"></i>
                <p>ไม่สามารถโหลดข้อมูลได้: ${error.message}</p>
            </div>
        `;
    } finally {
        showLoading(false);
    }
}

function displayAttendanceHistory(attendanceHistory) {
    const historyElement = document.getElementById('attendanceHistory');
    
    if (!attendanceHistory || attendanceHistory.length === 0) {
        historyElement.innerHTML = `
            <div class="text-center empty-state">
                <i class="fas fa-calendar-alt empty-icon"></i>
                <p class="empty-text">ไม่มีข้อมูลการเข้าออกงาน</p>
            </div>
        `;
        return;
    }
    
    historyElement.innerHTML = attendanceHistory.map(record => `
        <div class="neu-list-item">
            <div class="flex items-center gap-md">
                <div class="neu-avatar">
                    <i class="fas fa-calendar-day"></i>
                </div>
                <div style="flex: 1;">
                    <h4 class="font-bold">${new Date(record.date).toLocaleDateString('th-TH')}</h4>
                    <div class="user-details">
                        เข้า: ${record.checkIn ? new Date(record.checkIn).toLocaleTimeString('th-TH') : '-'} | 
                        ออก: ${record.checkOut ? new Date(record.checkOut).toLocaleTimeString('th-TH') : '-'} | 
                        ชั่วโมง: ${record.workHours || 0} ชม.
                    </div>
                </div>
                <div class="neu-badge ${getStatusClass(record.status)}">
                    ${getStatusText(record.status)}
                </div>
            </div>
        </div>
    `).join('');
}

function getStatusClass(status) {
    switch (status) {
        case 'present': return 'success';
        case 'late': return 'warning';
        case 'absent': return 'danger';
        case 'half-day': return 'info';
        default: return '';
    }
}

function getStatusText(status) {
    switch (status) {
        case 'present': return 'มาทำงาน';
        case 'late': return 'มาสาย';
        case 'absent': return 'ขาดงาน';
        case 'half-day': return 'ครึ่งวัน';
        case 'holiday': return 'วันหยุด';
        case 'sick-leave': return 'ลาป่วย';
        default: return status;
    }
}

async function loadAttendanceStats() {
    try {
        const monthFilter = document.getElementById('monthFilter');
        let params = '';
        
        if (monthFilter.value) {
            const [year, month] = monthFilter.value.split('-');
            params = `?year=${year}&month=${month}`;
        }
        
        const response = await apiCall(`/attendance/stats${params}`);
        displayAttendanceStats(response.stats);
        
    } catch (error) {
        console.error('Error loading attendance stats:', error);
    }
}

function displayAttendanceStats(stats) {
    document.getElementById('presentDays').textContent = `${stats.presentDays || 0} วัน`;
    document.getElementById('lateDays').textContent = `${stats.lateDays || 0} วัน`;
    document.getElementById('totalWorkHours').textContent = `${(stats.totalWorkHours || 0).toFixed(1)} ชม.`;
}

// Remove old dashboard functions as they're replaced by attendance system

// Profile functions
async function showProfile() {
    if (!currentUser) return;
    
    showSection('profileSection');
    displayProfile(currentUser);
}

function displayProfile(user) {
    document.getElementById('profileName').textContent = user.name || 'ไม่ระบุชื่อ';
    document.getElementById('profileId').textContent = `รหัสพนักงาน: ${user.employeeId}`;
    document.getElementById('profileDepartment').textContent = user.department || 'ไม่ระบุ';
    document.getElementById('profilePosition').textContent = user.position || 'ไม่ระบุ';
    
    const avatar = document.getElementById('profileAvatar');
    if (user.name) {
        avatar.innerHTML = user.name.charAt(0).toUpperCase();
    }
}

function editProfile() {
    alert('ฟีเจอร์แก้ไขโปรไฟล์จะพัฒนาในเวอร์ชันถัดไป');
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    if (authToken) {
        try {
            const tokenParts = authToken.split('.');
            const payload = JSON.parse(atob(tokenParts[1]));
            
            // Check if token is expired
            if (payload.exp && payload.exp * 1000 < Date.now()) {
                logout();
                return;
            }
            
            currentUser = {
                name: payload.name,
                userId: payload.userId,
                employeeId: payload.employeeId,
                role: payload.role,
                department: payload.department
            };
            
            updateNavigation();
            showAttendance();
            startClock();
            loadTodayAttendance();
        } catch (error) {
            console.error('Invalid token:', error);
            logout();
        }
    } else {
        showSection('welcomeSection');
    }
    
    // Bind form events
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Handle keyboard shortcuts
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            const statusMessage = document.getElementById('statusMessage');
            if (statusMessage && !statusMessage.classList.contains('hidden')) {
                statusMessage.classList.add('hidden');
            }
        }
    });
});

// Auto-refresh attendance every 60 seconds when on attendance page
setInterval(() => {
    const attendanceSection = document.getElementById('attendanceSection');
    if (attendanceSection && attendanceSection.classList.contains('section-visible') && authToken) {
        loadTodayAttendance();
    }
}, 60000);