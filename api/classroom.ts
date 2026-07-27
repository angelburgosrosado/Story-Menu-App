/**
 * Classroom/LMS Integration — Task 3.2
 * Teacher/class management for educational use.
 * Google Classroom API integration ready.
 */

import { Router, Request, Response } from 'express';
import { getFirestore } from 'firebase-admin/firestore';

const router = Router();

// ─── POST /api/classroom/create — Create a class ───────────────────────

router.post('/create', async (req: Request, res: Response) => {
    const { teacherId, className, subject, gradeLevel, maxStudents = 30 } = req.body;

    if (!teacherId || !className) {
        return res.status(400).json({ error: 'teacherId and className required' });
    }

    try {
        const db = getFirestore();
        const classCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        const classData = {
            teacherId,
            className,
            subject: subject || 'General',
            gradeLevel: gradeLevel || 'K-12',
            classCode,
            maxStudents,
            studentCount: 0,
            status: 'active',
            createdAt: new Date().toISOString(),
        };

        const docRef = await db.collection('classrooms').add(classData);

        // Add teacher as member
        await docRef.collection('members').doc(teacherId).set({
            role: 'teacher',
            joinedAt: new Date().toISOString(),
        });

        return res.json({
            success: true,
            classId: docRef.id,
            classCode,
            message: `Class created. Students join with code: ${classCode}`,
        });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

// ─── POST /api/classroom/join — Student joins a class ───────────────────

router.post('/join', async (req: Request, res: Response) => {
    const { studentId, classCode } = req.body;

    if (!studentId || !classCode) {
        return res.status(400).json({ error: 'studentId and classCode required' });
    }

    try {
        const db = getFirestore();
        const classSnap = await db.collection('classrooms')
            .where('classCode', '==', classCode.toUpperCase())
            .where('status', '==', 'active')
            .limit(1)
            .get();

        if (classSnap.empty) {
            return res.status(404).json({ error: 'Class not found or inactive' });
        }

        const classDoc = classSnap.docs[0];
        const classData = classDoc.data();

        if (classData.studentCount >= classData.maxStudents) {
            return res.status(400).json({ error: 'Class is full' });
        }

        // Add student as member
        await classDoc.ref.collection('members').doc(studentId).set({
            role: 'student',
            joinedAt: new Date().toISOString(),
        });

        // Increment student count
        await classDoc.ref.update({
            studentCount: classData.studentCount + 1,
        });

        return res.json({
            success: true,
            classId: classDoc.id,
            className: classData.className,
            teacher: classData.teacherId,
        });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

// ─── GET /api/classroom/:id — Get class details ─────────────────────────

router.get('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const db = getFirestore();
        const classSnap = await db.collection('classrooms').doc(String(id)).get();

        if (!classSnap.exists) {
            return res.status(404).json({ error: 'Class not found' });
        }

        const membersSnap = await classSnap.ref.collection('members').get();
        const members = membersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        return res.json({ id: classSnap.id, ...classSnap.data(), members });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

// ─── GET /api/classroom/:id/students — List students with progress ──────

router.get('/:id/students', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const db = getFirestore();
        const membersSnap = await db.collection('classrooms').doc(String(id))
            .collection('members')
            .where('role', '==', 'student')
            .get();

        const students = [];
        for (const memberDoc of membersSnap.docs) {
            const studentId = memberDoc.id;

            // Get student's stories
            const storiesSnap = await db.collection('users').doc(studentId)
                .collection('projects')
                .orderBy('created_at', 'desc')
                .limit(5)
                .get();

            students.push({
                id: studentId,
                ...memberDoc.data(),
                storyCount: storiesSnap.size,
                recentStories: storiesSnap.docs.map(d => ({
                    id: d.id,
                    title: d.data().title,
                    createdAt: d.data().created_at,
                })),
            });
        }

        return res.json({ data: students });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

// ─── POST /api/classroom/:id/assign — Assign a story prompt ─────────────

router.post('/:id/assign', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { teacherId, title, description, dueDate, format, genre } = req.body;

    if (!teacherId || !title) {
        return res.status(400).json({ error: 'teacherId and title required' });
    }

    try {
        const db = getFirestore();
        const classSnap = await db.collection('classrooms').doc(String(id)).get();

        if (!classSnap.exists) return res.status(404).json({ error: 'Class not found' });
        if (classSnap.data()?.teacherId !== teacherId) {
            return res.status(403).json({ error: 'Only teachers can create assignments' });
        }

        const assignment = {
            title,
            description: description || '',
            dueDate: dueDate || null,
            format: format || 'comic',
            genre: genre || '',
            status: 'active',
            createdAt: new Date().toISOString(),
            createdBy: teacherId,
        };

        const docRef = await classSnap.ref.collection('assignments').add(assignment);

        return res.json({
            success: true,
            assignmentId: docRef.id,
            message: 'Assignment created for all students',
        });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

export default router;
