import React, { useState, useEffect } from 'react'
import liff from '@line/liff'
import BookingForm from './BookingForm'
import { CalendarDays } from 'lucide-react'

function App() {
    const [profile, setProfile] = useState(null);
    const [isLiffReady, setIsLiffReady] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        liff.init({ liffId: '2011149025-lfmrq2LY' })
            .then(() => {
                if (!liff.isLoggedIn()) {
                    liff.login();
                } else {
                    return liff.getProfile();
                }
            })
            .then((profileData) => {
                if (profileData) {
                    setProfile(profileData);
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
                {isLiffReady && profile && <BookingForm profile={profile} />}
            </main>
        </div>
    )
}

export default App
