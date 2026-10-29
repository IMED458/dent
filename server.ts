import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db/database';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API ROUTE HANDLERS ---
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Dental Clinic HIS / ERP / CRM',
      country: 'Georgia',
      compliance: ['Form IV-220/ა', 'Form IV-220-1/ა', 'Form IV-220-2/ა', 'Form IV-220-3/ა', 'Form 100/ა'],
      timestamp: new Date().toISOString()
    });
  });

  // Auth / Current User Endpoint
  app.get('/api/auth/me', (req, res) => {
    res.json({
      user: db.users[0], // admin user by default
      organization: db.organization,
      branches: db.branches
    });
  });

  // Role Switcher for RBAC demonstration
  app.post('/api/auth/switch-role', (req, res) => {
    const { username } = req.body;
    const foundUser = db.users.find(u => u.username === username);
    if (foundUser) {
      db.logAudit(foundUser.username, foundUser.roles[0], 'USER_ROLE_SWITCH', 'User', foundUser.id, `მომხმარებელმა შეცვალა როლი/პროფილი: ${foundUser.position}`);
      res.json({ success: true, user: foundUser });
    } else {
      res.status(440).json({ error: 'User not found' });
    }
  });

  // Patients Endpoints
  app.get('/api/patients', (req, res) => {
    res.json({ patients: db.patients });
  });

  app.get('/api/patients/:id', (req, res) => {
    const pt = db.patients.find(p => p.id === req.params.id);
    if (pt) {
      res.json({ patient: pt });
    } else {
      res.status(404).json({ error: 'Patient not found' });
    }
  });

  app.post('/api/patients', (req, res) => {
    try {
      const newPt = db.addPatient(req.body);
      res.json({ success: true, patient: newPt });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message,
        duplicate: err.duplicate || false,
        existingPatient: err.existingPatient || null
      });
    }
  });

  app.put('/api/patients/:id', (req, res) => {
    const index = db.patients.findIndex(p => p.id === req.params.id);
    if (index !== -1) {
      db.patients[index] = { ...db.patients[index], ...req.body };
      db.logAudit('admin', 'Administrator', 'PATIENT_UPDATE', 'Patient', req.params.id, `განახლდა პაციენტის მონაცემები: ${db.patients[index].firstName} ${db.patients[index].lastName}`);
      res.json({ success: true, patient: db.patients[index] });
    } else {
      res.status(404).json({ error: 'Patient not found' });
    }
  });

  // Doctors / Employees Endpoint
  app.get('/api/doctors', (req, res) => {
    // Return users who are doctors or employees
    const doctors = db.users.filter(u => u.roles.some(r => r.includes('Dentist') || r.includes('Surgeon') || r.includes('Doctor') || r.includes('Specialist') || r.includes('Implantologist') || r.includes('Periodontist') || r.includes('Endodontist')));
    res.json({ doctors, employees: db.employees });
  });

  // Appointments Endpoints
  app.get('/api/appointments', (req, res) => {
    const { doctorId, patientId, date } = req.query;
    let list = db.appointments;
    if (doctorId) list = list.filter(a => a.doctorId === doctorId);
    if (patientId) list = list.filter(a => a.patientId === patientId);
    if (date) list = list.filter(a => a.startTime.startsWith(String(date)));
    res.json({ appointments: list });
  });

  app.post('/api/appointments', (req, res) => {
    try {
      const { patientId, patientName, patientPhone, doctorId, doctorName, branchId, chairId, startTime, endTime, serviceCategory, urgency, notes } = req.body;
      const newApt = {
        id: `apt-${Date.now()}`,
        patientId,
        patientName,
        patientPhone: patientPhone || '',
        doctorId,
        doctorName,
        branchId: branchId || 'br-vake',
        chairId: chairId || 'chair-1',
        startTime,
        endTime,
        serviceCategory: serviceCategory || 'თერაპია',
        status: 'CONFIRMED' as const,
        urgency: urgency || 'ROUTINE',
        notes: notes || ''
      };
      db.appointments.unshift(newApt);
      db.logAudit('admin', 'Registrar', 'APPOINTMENT_CREATE', 'Appointment', newApt.id, `შექმნილია ჩაწერა პაციენტისთვის: ${patientName}, ექიმი: ${doctorName}`);
      res.json({ success: true, appointment: newApt });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch('/api/appointments/:id', (req, res) => {
    const apt = db.appointments.find(a => a.id === req.params.id);
    if (apt) {
      if (req.body.status) apt.status = req.body.status;
      if (req.body.notes) apt.notes = req.body.notes;
      db.logAudit('admin', 'Registrar', 'APPOINTMENT_STATUS_UPDATE', 'Appointment', apt.id, `განახლდა ჩაწერის სტატუსი: ${apt.status}`);
      res.json({ success: true, appointment: apt });
    } else {
      res.status(404).json({ error: 'Appointment not found' });
    }
  });

  // Queue Endpoints
  app.get('/api/queue', (req, res) => {
    res.json({ queue: db.queueTickets });
  });

  app.post('/api/queue', (req, res) => {
    try {
      const { patientId, patientName, doctorName, roomName } = req.body;
      const ticketCount = db.queueTickets.length + 101;
      const newTicket = {
        id: `qt-${Date.now()}`,
        ticketNumber: `D-${ticketCount}`,
        patientId,
        patientName,
        arrivalTime: new Date().toTimeString().substring(0, 5),
        doctorName: doctorName || 'დოქტ. ნინო ყიფიანი',
        roomName: roomName || 'კაბინეტი 101',
        status: 'WAITING' as const
      };
      db.queueTickets.unshift(newTicket);
      db.logAudit('admin', 'Registrar', 'QUEUE_TICKET_ISSUE', 'QueueTicket', newTicket.id, `გაიცა რიგის ბილეთი №${newTicket.ticketNumber} პაციენტისთვის: ${patientName}`);
      res.json({ success: true, ticket: newTicket });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch('/api/queue/:id', (req, res) => {
    const ticket = db.queueTickets.find(t => t.id === req.params.id);
    if (ticket) {
      if (req.body.status) ticket.status = req.body.status;
      db.logAudit('admin', 'Registrar', 'QUEUE_TICKET_STATUS', 'QueueTicket', ticket.id, `რიგის ბილეთი №${ticket.ticketNumber} -> სტატუსი: ${ticket.status}`);
      res.json({ success: true, ticket });
    } else {
      res.status(404).json({ error: 'Ticket not found' });
    }
  });

  // Odontogram Endpoints
  app.get('/api/odontogram/:patientId', (req, res) => {
    const { patientId } = req.params;
    const history = db.odontograms.filter(o => o.patientId === patientId);
    res.json({ history, current: history[0] || null });
  });

  app.post('/api/odontogram', (req, res) => {
    const { patientId, teeth, authorName, notes } = req.body;
    const snap = db.saveOdontogram(patientId, teeth, authorName || 'დოქტ. ნინო ყიფიანი', notes);
    res.json({ success: true, odontogram: snap });
  });

  // Periodontics Endpoints
  app.get('/api/periodontology/:patientId', (req, res) => {
    const { patientId } = req.params;
    const exams = db.periodontalExams.filter(p => p.patientId === patientId);
    res.json({ exams });
  });

  // Calculations Endpoints (Form IV-220 Calculation Engine)
  app.get('/api/calculations', (req, res) => {
    res.json({ calculations: db.calculations });
  });

  app.post('/api/calculations', (req, res) => {
    try {
      const calc = db.createCalculation(req.body);
      res.json({ success: true, calculation: calc });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Cash Shift / Day Close Endpoints
  app.get('/api/day-close/current', (req, res) => {
    const openShift = db.cashShifts.find(s => s.status === 'OPEN');
    res.json({ shift: openShift || null });
  });

  app.post('/api/day-close/close', (req, res) => {
    const { shiftId, actualCountedCashGel, notes } = req.body;
    try {
      const closed = db.closeCashShift(shiftId, Number(actualCountedCashGel), notes);
      res.json({ success: true, shift: closed });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Inventory FEFO Endpoints
  app.get('/api/inventory', (req, res) => {
    res.json({ inventory: db.inventoryItems });
  });

  // Sterilization Endpoints
  app.get('/api/sterilization', (req, res) => {
    res.json({ cycles: db.sterilizationCycles });
  });

  app.post('/api/sterilization', (req, res) => {
    try {
      const cycle = db.addSterilizationCycle(req.body);
      res.json({ success: true, cycle });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Audit Logs Endpoint
  app.get('/api/audit-logs', (req, res) => {
    res.json({ auditLogs: db.auditLogs });
  });

  // Users & Staff Endpoints
  app.get('/api/users', (req, res) => {
    res.json({ users: db.users });
  });

  app.get('/api/doctors', (req, res) => {
    const doctors = db.users.filter(u =>
      u.roles.some(r => r.includes('Dentist') || r.includes('Surgeon') || r.includes('Implantologist') || r.includes('Orthodontist') || r.includes('Periodontist') || r.includes('Endodontist'))
    );
    res.json({ doctors });
  });

  app.post('/api/users', (req, res) => {
    try {
      const newUser = db.addUser(req.body);
      res.json({ success: true, user: newUser });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/doctors', (req, res) => {
    try {
      const newUser = db.addUser(req.body);
      res.json({ success: true, doctor: newUser });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // --- VITE MIDDLEWARE / STATIC SERVING ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Dental Clinic HIS Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
