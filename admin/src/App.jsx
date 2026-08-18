import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, Users, CalendarDays, RefreshCw,
    CheckCircle2, Clock, Undo2, Check, X, PhoneCall, UserSquare2,
    Menu
} from 'lucide-react';

const API_BASE = 'https://lumina-clinic-iota.vercel.app';
const HEADERS = { 'ngrok-skip-browser-warning': 'true' };

const serviceNames = {
    surgery: 'ศัลยกรรมตกแต่ง',
    skin: 'แผนกผิวพรรณ / เลเซอร์',
    dental: 'ทันตกรรม',
    consult: 'ปรึกษาแพทย์ทั่วไป'
};

function App() {
    const [page, setPage] = useState('dashboard');
    const [leads, setLeads] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const fetchData = async (showLoader = true) => {
        if (showLoader) setLoading(true);
        try {
            const [leadsRes, apptRes] = await Promise.all([
                fetch(`${API_BASE}/api/leads`, { headers: HEADERS }),
                fetch(`${API_BASE}/api/appointments`, { headers: HEADERS })
            ]);
            setLeads(await leadsRes.json());
            setAppointments(await apptRes.json());
        } catch (e) {
            console.error('Error fetching data:', e);
        }
        if (showLoader) setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isMobileMenuOpen]);

    const updateAppointmentStatus = async (id, status) => {
        // Optimistic UI Update
        const previousAppointments = [...appointments];
        setAppointments(prev => prev.map(appt => appt.id === id ? { ...appt, status } : appt));

        try {
            await fetch(`${API_BASE}/api/appointments/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', ...HEADERS },
                body: JSON.stringify({ status })
            });
            fetchData(false); // Sync in background without loader
        } catch (e) {
            console.error('Error updating status:', e);
            setAppointments(previousAppointments); // Rollback on error
            alert('เกิดข้อผิดพลาดในการปรับสถานะ กรุณาลองใหม่อีกครั้ง');
        }
    };

    const updateLeadStatus = async (id, status) => {
        // Optimistic UI Update
        const previousLeads = [...leads];
        setLeads(prev => prev.map(lead => lead.id === id ? { ...lead, status } : lead));

        try {
            await fetch(`${API_BASE}/api/leads/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', ...HEADERS },
                body: JSON.stringify({ status })
            });
            fetchData(false); // Sync in background without loader
        } catch (e) {
            console.error('Error updating lead:', e);
            setLeads(previousLeads); // Rollback on error
            alert('เกิดข้อผิดพลาดในการปรับสถานะ กรุณาลองใหม่อีกครั้ง');
        }
    };

    const pendingCount = appointments.filter(a => a.status === 'PENDING').length;
    const confirmedCount = appointments.filter(a => a.status === 'CONFIRMED').length;

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('th-TH', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    const navigateTo = (path) => {
        setPage(path);
        setIsMobileMenuOpen(false);
    };

    return (
        <div className="app-container">
            {/* Mobile Top Bar */}
            <header className="mobile-header">
                <div className="mobile-brand">
                    <CalendarDays size={20} color="#CFA65B" />
                    <h2>Lumina Admin</h2>
                </div>
                <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    {isMobileMenuOpen ? <X size={24} color="#CFA65B" /> : <Menu size={24} color="#CFA65B" />}
                </button>
            </header>

            {/* Sidebar Overlay for Mobile */}
            {isMobileMenuOpen && (
                <div className="sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>
            )}

            {/* Sidebar */}
            <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
                <div className="sidebar-brand">
                    <div className="brand-icon"><CalendarDays size={18} color="#fff" strokeWidth={2.5} /></div>
                    <h1>Lumina Clinic<span>Admin Dashboard</span></h1>
                </div>
                <nav className="sidebar-nav">
                    <button className={`nav-item ${page === 'dashboard' ? 'active' : ''}`} onClick={() => navigateTo('dashboard')}>
                        <span className="nav-icon"><LayoutDashboard size={16} /></span> Dashboard
                    </button>
                    <button className={`nav-item ${page === 'leads' ? 'active' : ''}`} onClick={() => navigateTo('leads')}>
                        <span className="nav-icon"><Users size={16} /></span> Leads
                        <span className="nav-badge">{leads.length}</span>
                    </button>
                    <button className={`nav-item ${page === 'appointments' ? 'active' : ''}`} onClick={() => navigateTo('appointments')}>
                        <span className="nav-icon"><CalendarDays size={16} /></span> นัดหมาย
                        {pendingCount > 0 && <span className="nav-badge">{pendingCount}</span>}
                    </button>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                {page === 'dashboard' && (
                    <>
                        <div className="page-header">
                            <div>
                                <h2>Dashboard</h2>
                                <p className="subtitle">ภาพรวมระบบจองคิวคลินิกลูมิน่า</p>
                            </div>
                            <button className="btn btn-status" onClick={fetchData}><RefreshCw size={12} /> รีเฟรชข้อมูล</button>
                        </div>

                        <div className="stats-row">
                            <div className="stat-card">
                                <div className="stat-icon purple"><Users size={22} color="#4A2870" /></div>
                                <div className="stat-info">
                                    <h3>{leads.length}</h3>
                                    <p>Leads ทั้งหมด</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon gold"><CalendarDays size={22} color="#CFA65B" /></div>
                                <div className="stat-info">
                                    <h3>{appointments.length}</h3>
                                    <p>นัดหมายทั้งหมด</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon green"><CheckCircle2 size={22} color="#1E8651" /></div>
                                <div className="stat-info">
                                    <h3>{confirmedCount}</h3>
                                    <p>ยืนยันแล้ว</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon red"><Clock size={22} color="#C67812" /></div>
                                <div className="stat-info">
                                    <h3>{pendingCount}</h3>
                                    <p>รอดำเนินการ</p>
                                </div>
                            </div>
                        </div>

                        {/* Recent Appointments Table */}
                        <div className="table-container">
                            <div className="table-header">
                                <h3>นัดหมายล่าสุด</h3>
                                <span className="table-count">{appointments.length} รายการ</span>
                            </div>
                            {loading ? (
                                <div className="loading-state"><div className="spinner"></div><p>กำลังโหลดข้อมูล...</p></div>
                            ) : appointments.length === 0 ? (
                                <div className="empty-state"><CalendarDays className="empty-icon" /><p>ยังไม่มีข้อมูลนัดหมาย</p></div>
                            ) : (
                                <>
                                    {/* Desktop Table View */}
                                    <div className="desktop-only-table table-responsive">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>ลูกค้า</th>
                                                    <th>แผนก</th>
                                                    <th>วันที่</th>
                                                    <th>เวลา</th>
                                                    <th>เบอร์โทร</th>
                                                    <th>สถานะ</th>
                                                    <th>จัดการ</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {appointments.map(appt => (
                                                    <tr key={appt.id}>
                                                        <td>
                                                            <div className="profile-cell">
                                                                {appt.lead?.pictureUrl ? <img src={appt.lead.pictureUrl} alt="" /> : <UserSquare2 size={30} color="#CFA65B" />}
                                                                <div>
                                                                    <div className="name">{appt.lead?.displayName || '-'}</div>
                                                                    <div className="line-id">{appt.lead?.lineId?.slice(0, 10)}...</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>{serviceNames[appt.service] || appt.service}</td>
                                                        <td>{formatDate(appt.date)}</td>
                                                        <td>{appt.time || '-'}</td>
                                                        <td>{appt.phone || '-'}</td>
                                                        <td><span className={`status-badge ${appt.status.toLowerCase()}`}>{appt.status}</span></td>
                                                        <td>
                                                            <div className="action-buttons">
                                                                {appt.status === 'PENDING' && (
                                                                    <>
                                                                        <button className="btn btn-confirm" onClick={() => updateAppointmentStatus(appt.id, 'CONFIRMED')}><Check size={12} /> ยืนยัน</button>
                                                                        <button className="btn btn-cancel" onClick={() => updateAppointmentStatus(appt.id, 'CANCELLED')}><X size={12} /> ยกเลิก</button>
                                                                    </>
                                                                )}
                                                                {appt.status === 'CONFIRMED' && (
                                                                    <button className="btn btn-cancel" onClick={() => updateAppointmentStatus(appt.id, 'CANCELLED')}><X size={12} /> ยกเลิก</button>
                                                                )}
                                                                {appt.status === 'CANCELLED' && (
                                                                    <button className="btn btn-confirm" onClick={() => updateAppointmentStatus(appt.id, 'PENDING')}><Undo2 size={12} /> คืนสถานะ</button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mobile Card View */}
                                    <div className="mobile-only-cards">
                                        {appointments.map(appt => (
                                            <div className="data-card" key={`mobile-${appt.id}`}>
                                                <div className="data-card-header">
                                                    <div className="profile-cell">
                                                        {appt.lead?.pictureUrl ? <img src={appt.lead.pictureUrl} alt="" /> : <UserSquare2 size={30} color="#CFA65B" />}
                                                        <div>
                                                            <div className="name">{appt.lead?.displayName || '-'}</div>
                                                            <div className="line-id">{appt.lead?.lineId?.slice(0, 10)}...</div>
                                                        </div>
                                                    </div>
                                                    <span className={`status-badge ${appt.status.toLowerCase()}`}>{appt.status}</span>
                                                </div>
                                                <div className="data-card-body">
                                                    <p><strong>แผนก:</strong> {serviceNames[appt.service] || appt.service}</p>
                                                    <p><strong>วันที่:</strong> {formatDate(appt.date)}</p>
                                                    <p><strong>เวลา:</strong> {appt.time || '-'}</p>
                                                    <p><strong>เบอร์โทร:</strong> {appt.phone || '-'}</p>
                                                </div>
                                                <div className="data-card-actions action-buttons">
                                                    {appt.status === 'PENDING' && (
                                                        <>
                                                            <button className="btn btn-confirm" onClick={() => updateAppointmentStatus(appt.id, 'CONFIRMED')}><Check size={12} /> ยืนยัน</button>
                                                            <button className="btn btn-cancel" onClick={() => updateAppointmentStatus(appt.id, 'CANCELLED')}><X size={12} /> ยกเลิก</button>
                                                        </>
                                                    )}
                                                    {appt.status === 'CONFIRMED' && (
                                                        <button className="btn btn-cancel" onClick={() => updateAppointmentStatus(appt.id, 'CANCELLED')}><X size={12} /> ยกเลิก</button>
                                                    )}
                                                    {appt.status === 'CANCELLED' && (
                                                        <button className="btn btn-confirm" onClick={() => updateAppointmentStatus(appt.id, 'PENDING')}><Undo2 size={12} /> คืนสถานะ</button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </>
                )}

                {page === 'leads' && (
                    <>
                        <div className="page-header">
                            <div>
                                <h2>Leads Management</h2>
                                <p className="subtitle">รายชื่อผู้ที่เพิ่มเพื่อนกับ LINE OA</p>
                            </div>
                            <button className="btn btn-status" onClick={fetchData}><RefreshCw size={12} /> รีเฟรชข้อมูล</button>
                        </div>
                        <div className="table-container">
                            <div className="table-header">
                                <h3>รายชื่อ Leads</h3>
                                <span className="table-count">{leads.length} คน</span>
                            </div>
                            {loading ? (
                                <div className="loading-state"><div className="spinner"></div><p>กำลังโหลดข้อมูล...</p></div>
                            ) : leads.length === 0 ? (
                                <div className="empty-state"><Users className="empty-icon" /><p>ยังไม่มี Leads</p></div>
                            ) : (
                                <>
                                    {/* Desktop Table View */}
                                    <div className="desktop-only-table table-responsive">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>โปรไฟล์</th>
                                                    <th>สถานะ</th>
                                                    <th>จำนวนนัดหมาย</th>
                                                    <th>วันที่เพิ่มเพื่อน</th>
                                                    <th>จัดการ</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {leads.map(lead => (
                                                    <tr key={lead.id}>
                                                        <td>
                                                            <div className="profile-cell">
                                                                {lead.pictureUrl ? <img src={lead.pictureUrl} alt="" /> : <UserSquare2 size={30} color="#CFA65B" />}
                                                                <div>
                                                                    <div className="name">{lead.displayName}</div>
                                                                    <div className="line-id">{lead.lineId.slice(0, 12)}...</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td><span className={`status-badge ${lead.status.toLowerCase()}`}>{lead.status}</span></td>
                                                        <td>{lead.appointments?.length || 0} คิว</td>
                                                        <td>{formatDate(lead.createdAt)}</td>
                                                        <td>
                                                            <div className="action-buttons">
                                                                {lead.status === 'NEW' && (
                                                                    <button className="btn btn-confirm" onClick={() => updateLeadStatus(lead.id, 'CONTACTED')}><PhoneCall size={12} /> ติดต่อแล้ว</button>
                                                                )}
                                                                {lead.status === 'CONTACTED' && (
                                                                    <button className="btn btn-confirm" onClick={() => updateLeadStatus(lead.id, 'CLOSED')}><Check size={12} /> ปิดการขาย</button>
                                                                )}
                                                                {lead.status === 'CLOSED' && (
                                                                    <button className="btn btn-status" onClick={() => updateLeadStatus(lead.id, 'NEW')}><Undo2 size={12} /> รีเซ็ต</button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mobile Card View */}
                                    <div className="mobile-only-cards">
                                        {leads.map(lead => (
                                            <div className="data-card" key={`mobile-${lead.id}`}>
                                                <div className="data-card-header">
                                                    <div className="profile-cell">
                                                        {lead.pictureUrl ? <img src={lead.pictureUrl} alt="" /> : <UserSquare2 size={30} color="#CFA65B" />}
                                                        <div>
                                                            <div className="name">{lead.displayName}</div>
                                                            <div className="line-id">{lead.lineId.slice(0, 12)}...</div>
                                                        </div>
                                                    </div>
                                                    <span className={`status-badge ${lead.status.toLowerCase()}`}>{lead.status}</span>
                                                </div>
                                                <div className="data-card-body">
                                                    <p><strong>จำนวนนัดหมาย:</strong> {lead.appointments?.length || 0} คิว</p>
                                                    <p><strong>วันที่เพิ่มเพื่อน:</strong> {formatDate(lead.createdAt)}</p>
                                                </div>
                                                <div className="data-card-actions action-buttons">
                                                    {lead.status === 'NEW' && (
                                                        <button className="btn btn-confirm" onClick={() => updateLeadStatus(lead.id, 'CONTACTED')}><PhoneCall size={12} /> ติดต่อแล้ว</button>
                                                    )}
                                                    {lead.status === 'CONTACTED' && (
                                                        <button className="btn btn-confirm" onClick={() => updateLeadStatus(lead.id, 'CLOSED')}><Check size={12} /> ปิดการขาย</button>
                                                    )}
                                                    {lead.status === 'CLOSED' && (
                                                        <button className="btn btn-status" onClick={() => updateLeadStatus(lead.id, 'NEW')}><Undo2 size={12} /> รีเซ็ต</button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </>
                )}

                {page === 'appointments' && (
                    <>
                        <div className="page-header">
                            <div>
                                <h2>Appointments</h2>
                                <p className="subtitle">รายการนัดหมายทั้งหมดในระบบ</p>
                            </div>
                            <button className="btn btn-status" onClick={fetchData}><RefreshCw size={12} /> รีเฟรชข้อมูล</button>
                        </div>
                        <div className="table-container">
                            <div className="table-header">
                                <h3>รายการนัดหมาย</h3>
                                <span className="table-count">{appointments.length} รายการ</span>
                            </div>
                            {loading ? (
                                <div className="loading-state"><div className="spinner"></div><p>กำลังโหลดข้อมูล...</p></div>
                            ) : appointments.length === 0 ? (
                                <div className="empty-state"><CalendarDays className="empty-icon" /><p>ยังไม่มีนัดหมาย</p></div>
                            ) : (
                                <>
                                    {/* Desktop Table View */}
                                    <div className="desktop-only-table table-responsive">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>ลูกค้า</th>
                                                    <th>แผนก</th>
                                                    <th>วันที่</th>
                                                    <th>เวลา</th>
                                                    <th>เบอร์โทร</th>
                                                    <th>สถานะ</th>
                                                    <th>จัดการ</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {appointments.map(appt => (
                                                    <tr key={appt.id}>
                                                        <td>
                                                            <div className="profile-cell">
                                                                {appt.lead?.pictureUrl ? <img src={appt.lead.pictureUrl} alt="" /> : <UserSquare2 size={30} color="#CFA65B" />}
                                                                <div>
                                                                    <div className="name">{appt.lead?.displayName || '-'}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>{serviceNames[appt.service] || appt.service}</td>
                                                        <td>{formatDate(appt.date)}</td>
                                                        <td>{appt.time || '-'}</td>
                                                        <td>{appt.phone || '-'}</td>
                                                        <td><span className={`status-badge ${appt.status.toLowerCase()}`}>{appt.status}</span></td>
                                                        <td>
                                                            <div className="action-buttons">
                                                                {appt.status === 'PENDING' && (
                                                                    <>
                                                                        <button className="btn btn-confirm" onClick={() => updateAppointmentStatus(appt.id, 'CONFIRMED')}><Check size={12} /> ยืนยัน</button>
                                                                        <button className="btn btn-cancel" onClick={() => updateAppointmentStatus(appt.id, 'CANCELLED')}><X size={12} /> ยกเลิก</button>
                                                                    </>
                                                                )}
                                                                {appt.status === 'CONFIRMED' && (
                                                                    <button className="btn btn-cancel" onClick={() => updateAppointmentStatus(appt.id, 'CANCELLED')}><X size={12} /> ยกเลิก</button>
                                                                )}
                                                                {appt.status === 'CANCELLED' && (
                                                                    <button className="btn btn-confirm" onClick={() => updateAppointmentStatus(appt.id, 'PENDING')}><Undo2 size={12} /> คืนสถานะ</button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mobile Card View */}
                                    <div className="mobile-only-cards">
                                        {appointments.map(appt => (
                                            <div className="data-card" key={`mobile-page-${appt.id}`}>
                                                <div className="data-card-header">
                                                    <div className="profile-cell">
                                                        {appt.lead?.pictureUrl ? <img src={appt.lead.pictureUrl} alt="" /> : <UserSquare2 size={30} color="#CFA65B" />}
                                                        <div>
                                                            <div className="name">{appt.lead?.displayName || '-'}</div>
                                                        </div>
                                                    </div>
                                                    <span className={`status-badge ${appt.status.toLowerCase()}`}>{appt.status}</span>
                                                </div>
                                                <div className="data-card-body">
                                                    <p><strong>แผนก:</strong> {serviceNames[appt.service] || appt.service}</p>
                                                    <p><strong>วันที่:</strong> {formatDate(appt.date)}</p>
                                                    <p><strong>เวลา:</strong> {appt.time || '-'}</p>
                                                    <p><strong>เบอร์โทร:</strong> {appt.phone || '-'}</p>
                                                </div>
                                                <div className="data-card-actions action-buttons">
                                                    {appt.status === 'PENDING' && (
                                                        <>
                                                            <button className="btn btn-confirm" onClick={() => updateAppointmentStatus(appt.id, 'CONFIRMED')}><Check size={12} /> ยืนยัน</button>
                                                            <button className="btn btn-cancel" onClick={() => updateAppointmentStatus(appt.id, 'CANCELLED')}><X size={12} /> ยกเลิก</button>
                                                        </>
                                                    )}
                                                    {appt.status === 'CONFIRMED' && (
                                                        <button className="btn btn-cancel" onClick={() => updateAppointmentStatus(appt.id, 'CANCELLED')}><X size={12} /> ยกเลิก</button>
                                                    )}
                                                    {appt.status === 'CANCELLED' && (
                                                        <button className="btn btn-confirm" onClick={() => updateAppointmentStatus(appt.id, 'PENDING')}><Undo2 size={12} /> คืนสถานะ</button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}

export default App;
