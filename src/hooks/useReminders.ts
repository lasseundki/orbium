import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { ScheduledReminder } from '../types/index';

export function useReminders(uid: string | null) {
  const [reminders, setReminders] = useState<ScheduledReminder[]>([]);

  useEffect(() => {
    if (!uid) { setReminders([]); return; }
    const q = query(collection(db, 'users', uid, 'scheduledReminders'), orderBy('dueDate', 'asc'));
    const unsub = onSnapshot(q, snap => {
      setReminders(snap.docs.map(d => ({ id: d.id, ...d.data() } as ScheduledReminder)));
    });
    return unsub;
  }, [uid]);

  async function addManualReminder(uid: string, data: Omit<ScheduledReminder, 'id'>) {
    await addDoc(collection(db, 'users', uid, 'scheduledReminders'), data);
  }

  async function setStatus(uid: string, id: string, status: 'erledigt' | 'uebersprungen' | 'offen') {
    await updateDoc(doc(db, 'users', uid, 'scheduledReminders', id), {
      status,
      completedAt: status === 'erledigt' ? Date.now() : null,
    });
  }

  async function deleteReminder(uid: string, id: string) {
    await deleteDoc(doc(db, 'users', uid, 'scheduledReminders', id));
  }

  return { reminders, addManualReminder, setStatus, deleteReminder };
}
