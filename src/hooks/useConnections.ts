import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import type { Connection } from '../types/index';

export function useConnections(uid: string | null) {
  const [connections, setConnections] = useState<Connection[]>([]);

  useEffect(() => {
    if (!uid) { setConnections([]); return; }
    return onSnapshot(collection(db, 'users', uid, 'connections'), snap => {
      setConnections(snap.docs.map(d => ({ id: d.id, ...d.data() } as Connection)));
    });
  }, [uid]);

  async function addConnection(uid: string, data: Omit<Connection, 'id' | 'createdAt'>) {
    await addDoc(collection(db, 'users', uid, 'connections'), { ...data, createdAt: Date.now() });
  }

  async function deleteConnection(uid: string, id: string) {
    await deleteDoc(doc(db, 'users', uid, 'connections', id));
  }

  return { connections, addConnection, deleteConnection };
}
