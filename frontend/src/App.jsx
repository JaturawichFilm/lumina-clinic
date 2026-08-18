import React, { useState, useEffect } from 'react'
import liff from '@line/liff'
import BookingForm from './BookingForm'
import { CalendarDays } from 'lucide-react'

function App() {
    const [profile, setProfile] = useState(null);
    const [isFriend, setIsFriend] = useState(null);
    const [isLiffReady, setIsLiffReady] = useState(false);
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
                    <div className="add-friend-card">
                        <div className="add-friend-icon">⚠️</div>
                        <h2 className="add-friend-title">กรุณาเพิ่มเพื่อนก่อนทำรายการ</h2>
                        <p className="add-friend-text">
                            เพื่อให้ระบบสามารถส่งข้อความ<br />แจ้งเตือนสถานะคิวหาท่านได้<br /><br />กรุณากดแอดเพื่อนกับทาง<br /><strong style={{ fontWeight: '500', color: 'var(--purple-dark)' }}>Lumina Clinic</strong> ก่อนนะครับ
                        </p>
                        <button
                            onClick={() => window.location.href = "https://line.me/R/ti/p/@210npahy"}
                            className="add-friend-btn"
                        >
                            คลิกที่นี่เพื่อเพิ่มเพื่อน (Add Friend)
                        </button>
                    </div>
                )}

                {isLiffReady && isFriend === true && profile && <BookingForm profile={profile} />}
            </main>
        </div>
    )
}

export default App
