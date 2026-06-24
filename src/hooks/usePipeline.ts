import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Pipeline } from '../types/index';
import { triggerSequences } from '../lib/sequences';

export function usePipeline(uid: string | null) {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);

  useEffect(() => {
    if (!uid) { setPipelines([]); return; }
    const q = query(collection(db, 'users', uid, 'pipeline'), orderBy('updatedAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setPipelines(snap.docs.map(d => ({ id: d.id, ...d.data() } as Pipeline)));
    });
    return unsub;
  }, [uid]);

  async function upsertPipeline(
    uid: string, contactId: string, project: string, stage: string,
    contactCategories: string[], notes?: string
  ): Promise<number> {
    const col = collection(db, 'users', uid, 'pipeline');
    const q = query(col, where('contactId', '==', contactId), where('project', '==', project));
    const snap = await getDocs(q);
    const now = Date.now();

    let oldStage: string | undefined;
    if (!snap.empty) {
      const existing = snap.docs[0];
      oldStage = (existing.data() as Pipeline).stage;
      await updateDoc(doc(db, 'users', uid, 'pipeline', existing.id), {
        stage, notes: notes ?? null, updatedAt: now,
        ...(stage !== oldStage ? { stageChangedAt: now } : {}),
      });
    } else {
      await addDoc(col, { contactId, project, stage, notes: notes ?? null, stageChangedAt: now, updatedAt: now });
    }

    if (stage !== oldStage) {
      return triggerSequences({ uid, contactId, triggerType: 'stage_change', triggerValue: stage, project, contactCategories });
    }
    return 0;
  }

  async function moveCard(uid: string, pipelineId: string, newStage: string, contactCategories: string[], project: string): Promise<number> {
    const existing = pipelines.find(p => p.id === pipelineId);
    if (!existing || existing.stage === newStage) return 0;
    const now = Date.now();
    await updateDoc(doc(db, 'users', uid, 'pipeline', pipelineId), { stage: newStage, stageChangedAt: now, updatedAt: now });
    return triggerSequences({ uid, contactId: existing.contactId, triggerType: 'stage_change', triggerValue: newStage, project, contactCategories });
  }

  return { pipelines, upsertPipeline, moveCard };
}
