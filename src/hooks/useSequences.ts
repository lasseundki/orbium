import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { ReminderSequence } from '../types/index';

export function useSequences(uid: string | null) {
  const [sequences, setSequences] = useState<ReminderSequence[]>([]);

  useEffect(() => {
    if (!uid) { setSequences([]); return; }
    const q = query(collection(db, 'users', uid, 'reminderSequences'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, snap => {
      setSequences(snap.docs.map(d => ({ id: d.id, ...d.data() } as ReminderSequence)));
    });
    return unsub;
  }, [uid]);

  async function addSequence(uid: string, data: Omit<ReminderSequence, 'id' | 'createdAt'>) {
    await addDoc(collection(db, 'users', uid, 'reminderSequences'), { ...data, createdAt: Date.now() });
  }

  async function updateSequence(uid: string, id: string, data: Partial<Omit<ReminderSequence, 'id' | 'createdAt'>>) {
    await updateDoc(doc(db, 'users', uid, 'reminderSequences', id), data);
  }

  async function deleteSequence(uid: string, id: string) {
    await deleteDoc(doc(db, 'users', uid, 'reminderSequences', id));
  }

  return { sequences, addSequence, updateSequence, deleteSequence };
}
