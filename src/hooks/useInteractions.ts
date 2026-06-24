import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Interaction } from '../types/index';

export function useInteractions(uid: string | null, contactId?: string) {
  const [interactions, setInteractions] = useState<Interaction[]>([]);

  useEffect(() => {
    if (!uid) { setInteractions([]); return; }
    const col = collection(db, 'users', uid, 'interactions');
    const q = contactId
      ? query(col, where('contactId', '==', contactId), orderBy('date', 'desc'))
      : query(col, orderBy('date', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setInteractions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Interaction)));
    });
    return unsub;
  }, [uid, contactId]);

  async function addInteraction(uid: string, data: Omit<Interaction, 'id'>) {
    await addDoc(collection(db, 'users', uid, 'interactions'), data);
  }

  async function deleteInteraction(uid: string, id: string) {
    await deleteDoc(doc(db, 'users', uid, 'interactions', id));
  }

  return { interactions, addInteraction, deleteInteraction };
}
