import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Contact } from '../types/index';
import { triggerSequences } from '../lib/sequences';

export function useContacts(uid: string | null) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) { setContacts([]); setLoading(false); return; }
    const q = query(collection(db, 'users', uid, 'contacts'), orderBy('updatedAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setContacts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Contact)));
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  async function addContact(uid: string, data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = Date.now();
    const ref = await addDoc(collection(db, 'users', uid, 'contacts'), {
      ...data,
      createdAt: now,
      updatedAt: now,
      statusChangedAt: now,
    });
    await triggerSequences({
      uid, contactId: ref.id,
      triggerType: 'status_change', triggerValue: data.status,
      contactCategories: data.category,
    });
    return ref.id;
  }

  async function updateContact(uid: string, id: string, data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    await updateDoc(doc(db, 'users', uid, 'contacts', id), { ...data, updatedAt: Date.now() });
  }

  async function updateStatus(uid: string, id: string, newStatus: Contact['status'], categories: string[]): Promise<number> {
    await updateDoc(doc(db, 'users', uid, 'contacts', id), {
      status: newStatus, statusChangedAt: Date.now(), updatedAt: Date.now(),
    });
    return triggerSequences({
      uid, contactId: id,
      triggerType: 'status_change', triggerValue: newStatus,
      contactCategories: categories,
    });
  }

  async function deleteContact(uid: string, id: string): Promise<void> {
    await deleteDoc(doc(db, 'users', uid, 'contacts', id));
  }

  return { contacts, loading, addContact, updateContact, updateStatus, deleteContact };
}
