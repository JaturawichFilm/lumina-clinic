import React, { useState } from 'react';
import './BookingForm.css';

function BookingForm({ profile }) {
    const [formData, setFormData] = useState({
        service: '',
        date: '',
        time: '',
        phone: '',
        lineId: profile.userId,
        displayName: profile.displayName
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                lineId: profile.userId,
                displayName: profile.displayName
            };

            const response = await fetch('https://cough-congrats-crane.ngrok-free.dev/api/appointments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                alert('ระบบส่งข้อมูลการจองเรียบร้อยแล้วครับ! โปรดเช็คข้อความยืนยันใน LINE ของท่าน');
                if (window.liff && window.liff.isInClient()) {
                    window.liff.closeWindow();
                } else {
                    console.log('Tested in browser, form submitted successfully!');
                }
            } else {
                const errorData = await response.json().catch(() => ({}));
                alert('เกิดข้อผิดพลาด: ' + (errorData.details || errorData.error || '500 Internal Server Error'));
            }
        } catch (err) {
            console.error(err);
            alert('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
        }
    };

    return (
        <form className="booking-form" onSubmit={handleSubmit}>
            <div className="profile-badge">
                <img src={profile.pictureUrl} alt="profile" className="profile-img" />
                <div className="profile-info">
                    <span className="profile-greeting">ยินดีต้อนรับสู่บริการของเรา</span>
                    <span className="profile-name">คุณ {profile.displayName}</span>
                </div>
            </div>

            <div className="form-group">
                <label>บริการที่ต้องการจอง</label>
                <select name="service" value={formData.service} onChange={handleChange} required>
                    <option value="">-- กรุณาเลือกบริการ --</option>
                    <option value="surgery">ศัลยกรรมตกแต่ง (Plastic Surgery)</option>
                    <option value="skin">แผนกผิวพรรณ / เลเซอร์ (Skin & Laser)</option>
                    <option value="dental">ทันตกรรม (Dental)</option>
                    <option value="consult">ปรึกษาแพทย์ทั่วไป</option>
                </select>
            </div>

            <div className="form-group split-group">
                <div className="half-width">
                    <label>วันที่สะดวก</label>
                    <input type="date" name="date" value={formData.date} onChange={handleChange} required min={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="half-width">
                    <label>เวลา</label>
                    <input type="time" name="time" value={formData.time} onChange={handleChange} required />
                </div>
            </div>

            <div className="form-group">
                <label>เบอร์โทรศัพท์ติดต่อกลับ</label>
                <input type="tel" name="phone" placeholder="08X-XXX-XXXX" value={formData.phone} onChange={handleChange} required />
            </div>

            <button type="submit" className="submit-btn">ยืนยันการจองคิว</button>
            <p className="note-text">*ข้อมูลบัญชี LINE ของท่านจะถูกอ้างอิงอัตโนมัติ ไม่ต้องกรอกเพิ่มเติม</p>
        </form>
    );
}

export default BookingForm;
