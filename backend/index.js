const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { middleware, messagingApi } = require('@line/bot-sdk');

const app = express();
const port = process.env.PORT || 3000;
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// LINE config
const config = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.LINE_CHANNEL_SECRET,
};
const { MessagingApiClient } = messagingApi;
const client = new MessagingApiClient({
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
});

// CORS Middleware
app.use(cors());

// Basic Route for Browser
app.get('/', (req, res) => {
    res.send('LINE OA Booking Backend is running!');
});

// Webhook Route
app.post('/webhook', middleware(config), async (req, res) => {
    try {
        const events = req.body.events;
        if (events.length > 0) {
            await Promise.all(events.map(handleEvent));
        }
        res.status(200).send('OK');
    } catch (err) {
        console.error(err);
        res.status(500).end();
    }
});

// Event Handler
async function handleEvent(event) {
    // If user adds the bot or unblocks it
    if (event.type === 'follow') {
        const userId = event.source.userId;
        try {
            // Get User Profile from LINE
            const profile = await client.getProfile(userId);

            // Save User to Database (Lead table)
            await prisma.lead.upsert({
                where: { lineId: userId },
                update: {
                    displayName: profile.displayName,
                    pictureUrl: profile.pictureUrl,
                    status: 'NEW'
                },
                create: {
                    lineId: userId,
                    displayName: profile.displayName,
                    pictureUrl: profile.pictureUrl,
                    status: 'NEW'
                }
            });

            // Send a welcome message
            return client.replyMessage({
                replyToken: event.replyToken,
                messages: [{
                    type: 'text',
                    text: `สวัสดีคุณ ${profile.displayName} 🙏\nยินดีต้อนรับสู่คลินิกลูมิน่าครับ\n\nสามารถกดลิงก์ด้านล่างเพื่อเข้าสู่ "ระบบจองคิว/ปรึกษาแพทย์" ได้เลยครับ 👇\nhttps://liff.line.me/2011149025-lfmrq2LY`
                }]
            });

        } catch (e) {
            console.error('Error saving lead:', e);
        }
    }

    // Basic fallback for incoming text messages
    if (event.type === 'message' && event.message.type === 'text') {
        const textMsg = event.message.text;
        if (textMsg === 'จองคิว') {
            return client.replyMessage({
                replyToken: event.replyToken,
                messages: [{
                    type: 'text',
                    text: 'รอพบกับระบบฟอร์มจองคิว (LIFF App) ใน Phase ต่อไปครับ!'
                }]
            });
        }

        return client.replyMessage({
            replyToken: event.replyToken,
            messages: [{
                type: 'text',
                text: 'ตอนนี้ระบบยังอยู่ในช่วงพัฒนานะครับ'
            }]
        });
    }
}

// API Backend to receive form data
app.post('/api/appointments', express.json(), async (req, res) => {
    try {
        const { service, date, time, phone, lineId, displayName, pictureUrl } = req.body;

        if (!lineId || !service || !date) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Get or create the Lead from lineId
        const lead = await prisma.lead.upsert({
            where: { lineId },
            update: {
                displayName: displayName || 'Unknown',
                pictureUrl: pictureUrl || null
            },
            create: {
                lineId,
                displayName: displayName || 'Unknown',
                pictureUrl: pictureUrl || null,
                status: 'NEW'
            }
        });

        const jsDate = new Date(`${date}T00:00:00.000Z`);

        const appointment = await prisma.appointment.create({
            data: {
                leadId: lead.id,
                service,
                date: jsDate,
                time,
                phone,
                status: 'PENDING'
            }
        });

        // Map service names to Thai for the message
        const serviceNames = {
            surgery: 'ศัลยกรรมตกแต่ง',
            skin: 'แผนกผิวพรรณ / เลเซอร์',
            dental: 'ทันตกรรม',
            consult: 'ปรึกษาแพทย์ทั่วไป'
        };

        const formattedDate = new Date(date).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        await client.pushMessage({
            to: lineId,
            messages: [{
                type: 'text',
                text: `✅ ได้รับข้อมูลการจองของคุณ ${displayName} แล้วครับ\n\n📌 แผนก: ${serviceNames[service] || service}\n📅 วันที่: ${formattedDate}\n⏰ เวลา: ${time}\n📞 เบอร์ติดต่อ: ${phone}\n\nเจ้าหน้าที่จะติดต่อกลับเพื่อยืนยันคิวภายใน 24 ชม. ครับ ขอบคุณครับ! 🙏`
            }]
        });

        res.status(200).json({ success: true, appointment });

    } catch (e) {
        console.error('Error creating appointment:', e);
        res.status(500).json({ error: 'Internal Server Error', details: e.message });
    }
});

// ==================== ADMIN API ROUTES ====================

// GET all leads
app.get('/api/leads', async (req, res) => {
    try {
        const leads = await prisma.lead.findMany({
            include: { appointments: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(leads);
    } catch (e) {
        console.error('Error fetching leads:', e);
        res.status(500).json({ error: e.message });
    }
});

// GET all appointments
app.get('/api/appointments', async (req, res) => {
    try {
        const appointments = await prisma.appointment.findMany({
            include: { lead: true },
            orderBy: { date: 'asc' }
        });
        res.json(appointments);
    } catch (e) {
        console.error('Error fetching appointments:', e);
        res.status(500).json({ error: e.message });
    }
});

// PATCH update appointment status
app.patch('/api/appointments/:id/status', express.json(), async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const appointment = await prisma.appointment.update({
            where: { id },
            data: { status },
            include: { lead: true }
        });

        // Send LINE notification about status change
        if (appointment.lead.lineId) {
            const statusMessages = {
                CONFIRMED: '✅ คิวของคุณได้รับการยืนยันแล้วครับ!',
                CANCELLED: '❌ คิวของคุณถูกยกเลิกแล้วครับ กรุณาจองใหม่อีกครั้ง'
            };
            if (statusMessages[status]) {
                await client.pushMessage({
                    to: appointment.lead.lineId,
                    messages: [{ type: 'text', text: statusMessages[status] }]
                });
            }
        }

        res.json(appointment);
    } catch (e) {
        console.error('Error updating appointment:', e);
        res.status(500).json({ error: e.message });
    }
});

// PATCH update lead status
app.patch('/api/leads/:id/status', express.json(), async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const lead = await prisma.lead.update({
            where: { id },
            data: { status }
        });
        res.json(lead);
    } catch (e) {
        console.error('Error updating lead:', e);
        res.status(500).json({ error: e.message });
    }
});

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
