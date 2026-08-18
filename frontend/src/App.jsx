import React, { useState, useEffect } from 'react'
import liff from '@line/liff'
import BookingForm from './BookingForm'
import { CalendarDays } from 'lucide-react'

function App() {
    const [profile, setProfile] = useState(null);
    const [isFriend, setIsFriend] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        liff.init({ liffId: '2011149025-lfmrq2LY' })
            .then(() => {
                if (!liff.isLoggedIn()) {
                    liff.login();
                } else {
                    return Promise.all([liff.getProfile(), liff.getFriendship()]);
                }
            })
            .then((results) => {
                if (results) {
                    const [profileData, friendshipData] = results;
                    setProfile(profileData);
                    setIsFriend(friendshipData.friendFlag);
                    setIsLiffReady(true);
                }
            })
            .catch((err) => {
                console.error('LIFF Init Error:', err);
                setError('เกิดข้อผิดพลาดในการโหลดข้อมูล LINE: ' + err.message);
            });
    }, []);

    return (
        <div className="app-container">
            <header className="header">
                <div className="header-icon">
                    <CalendarDays size={24} color="#fff" />
                </div>
                <h1>Lumina Clinic</h1>
                <p>นัดหมาย / ปรึกษาแพทย์</p>
            </header>
            <main className="main-content">
                {!isLiffReady && !error && (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p style={{ marginTop: '15px' }}>กำลังเชื่อมต่อบัญชี LINE ของท่าน...</p>
                    </div>
                )}
                {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

                {isLiffReady && isFriend === false && (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>⚠️</div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.5rem' }}>กรุณาเพิ่มเพื่อนก่อนทำรายการ</h2>
                        <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                            เพื่อให้ระบบสามารถส่งข้อความแจ้งเตือนสถานะคิวหาท่านได้<br />กรุณากดแอดเพื่อนกับทาง Lumina Clinic ครับ
                        </p>
                        <button
                            onClick={() => liff.closeWindow()}
                            style={{ background: '#7e22ce', color: 'white', padding: '0.85rem 1.5rem', borderRadius: '12px', border: 'none', fontWeight: 'bold', width: '100%', fontSize: '1rem', cursor: 'pointer' }}
                        >
                            ปิดหน้านี้เพื่อกลับไปกดเพิ่มเพื่อน
                        </button>
                    </div>
                )}

                {isLiffReady && isFriend === true && profile && <BookingForm profile={profile} />}
            </main>
        </div>
    )
}

export default App
