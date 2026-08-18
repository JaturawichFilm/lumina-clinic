import React, { useState } from 'react';
import Swal from 'sweetalert2';
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
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return; // Prevent double clicks

        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                lineId: profile.userId,
                displayName: profile.displayName
            };

            const response = await fetch('https://lumina-clinic-iota.vercel.app/api/appointments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                Swal.fire({
                    title: 'ขอบคุณที่ไว้วางใจ!',
                    text: 'ระบบได้รับข้อมูลการจองของคุณเรียบร้อยแล้ว แอดมินจะติดต่อกลับเพื่อยืนยันคิวผ่านทาง LINE อีกครั้งนะครับ',
                    icon: 'success',
                    confirmButtonText: 'ปิดหน้าต่าง',
                    confirmButtonColor: '#381E57', // Lumina Purple
                    background: '#FBFBF9',
                    backdrop: `rgba(34, 18, 57, 0.4)`
                }).then(() => {
                    // Reset form state to empty
                    setFormData({
                        service: '',
                        date: '',
                        time: '',
                        phone: '',
                        lineId: profile.userId,
                        displayName: profile.displayName
                    });

                    if (window.liff && window.liff.isInClient()) {
                        window.liff.closeWindow();
                    } else {
                        console.log('Tested in browser, form submitted successfully!');
                    }
                });
            } else {
                const errorData = await response.json().catch(() => ({}));
                Swal.fire({
                    title: 'เกิดข้อผิดพลาด',
                    text: errorData.details || errorData.error || '500 Internal Server Error',
                    icon: 'error',
                    confirmButtonText: 'ลองใหม่อีกครั้ง',
                    confirmButtonColor: '#CFA65B'
                });
            }
        } catch (err) {
            console.error(err);
            Swal.fire({
                title: 'ไม่สามารถเชื่อมต่อได้',
                text: 'กรุณาตรวจสอบอินเทอร์เน็ตของท่านแล้วลองอีกครั้ง',
                icon: 'warning',
                confirmButtonText: 'เข้าใจแล้ว',
                confirmButtonColor: '#CFA65B'
            });
        } finally {
            setIsSubmitting(false);
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

            <button type="submit" className={`submit-btn ${isSubmitting ? 'submitting' : ''}`} disabled={isSubmitting}>
                {isSubmitting ? 'กำลังส่งข้อมูลจองคิว...' : 'ยืนยันการจองคิว'}
            </button>
            <p className="note-text">*ข้อมูลบัญชี LINE ของท่านจะถูกอ้างอิงอัตโนมัติ ไม่ต้องกรอกเพิ่มเติม</p>
        </form>
    );
}

export default BookingForm;
