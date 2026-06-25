import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useContacts } from '../hooks/useContacts';
import { useConnections } from '../hooks/useConnections';
import type { Contact, Connection } from '../types/index';

const STATUS_COLORS: Record<string, string> = {
  lead:    '#A8A89B',
  aktiv:   '#7BA89B',
  inaktiv: '#C4B9A8',
  vip:     '#C4A46B',
};

interface GraphNode {
  id: string;
  name: string;
  status: Contact['status'];
  category: string[];
  x: number;
  y: number;
  vx: number;
  vy: number;
}

function buildLayout(contacts: Contact[], W: number, H: number): GraphNode[] {
  return contacts.map((c, i) => {
    const angle = (i / contacts.length) * 2 * Math.PI;
    const r = Math.min(W, H) * 0.32;
    return {
      id: c.id,
      name: c.name,
      status: c.status,
      category: c.category,
      x: W / 2 + r * Math.cos(angle),
      y: H / 2 + r * Math.sin(angle),
      vx: 0, vy: 0,
    };
  });
}

function runForce(nodes: GraphNode[], edges: Connection[], W: number, H: number) {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  for (let iter = 0; iter < 200; iter++) {
    const cool = 1 - iter / 200;
    // Repulsion
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = (nodes[j].x - nodes[i].x) || 0.1;
        const dy = (nodes[j].y - nodes[i].y) || 0.1;
        const d2 = dx * dx + dy * dy;
        const f = 4000 / d2;
        nodes[i].vx -= f * dx; nodes[i].vy -= f * dy;
        nodes[j].vx += f * dx; nodes[j].vy += f * dy;
      }
    }
    // Spring
    edges.forEach(e => {
      const a = nodeMap.get(e.contactAId);
      const b = nodeMap.get(e.contactBId);
      if (!a || !b) return;
      const dx = b.x - a.x; const dy = b.y - a.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const f = (d - 130) * 0.06 * cool;
      a.vx += f * dx / d; a.vy += f * dy / d;
      b.vx -= f * dx / d; b.vy -= f * dy / d;
    });
    // Gravity
    nodes.forEach(n => {
      n.vx += (W / 2 - n.x) * 0.012;
      n.vy += (H / 2 - n.y) * 0.012;
      n.x += n.vx * cool; n.y += n.vy * cool;
      n.vx *= 0.85;        n.vy *= 0.85;
      n.x = Math.max(36, Math.min(W - 36, n.x));
      n.y = Math.max(36, Math.min(H - 36, n.y));
    });
  }
  return nodes;
}

const CONNECTION_TYPES = ['Familie', 'Freunde', 'Bekannte', 'Geschäft', 'Sport', 'Schule', 'Kirche', 'Sonstiges'];

export default function Network() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const uid = user!.uid;
  const { contacts } = useContacts(uid);
  const { connections, addConnection, deleteConnection } = useConnections(uid);

  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addFrom, setAddFrom] = useState('');
  const [addTo, setAddTo] = useState('');
  const [addType, setAddType] = useState(CONNECTION_TYPES[0]);
  const [addNote, setAddNote] = useState('');

  const W = 800; const H = 520;

  useEffect(() => {
    if (!contacts.length) return;
    const initial = buildLayout(contacts, W, H);
    const laid = runForce(initial, connections, W, H);
    setNodes(laid);
  }, [contacts, connections]);

  const visibleEdges = connections.filter(e =>
    !filterType || e.type === filterType
  );

  const visibleNodeIds = new Set(
    filterType
      ? visibleEdges.flatMap(e => [e.contactAId, e.contactBId])
      : contacts.map(c => c.id)
  );

  const filteredNodes = nodes.filter(n => {
    if (!visibleNodeIds.has(n.id)) return false;
    if (filterStatus && n.status !== filterStatus) return false;
    if (filterCat && !n.category.includes(filterCat)) return false;
    return true;
  });
  const filteredIds = new Set(filteredNodes.map(n => n.id));

  const selConnections = selected
    ? connections.filter(e => e.contactAId === selected || e.contactBId === selected)
    : [];
  const selNeighbors = new Set(selConnections.flatMap(e => [e.contactAId, e.contactBId]));

  const allCategories = Array.from(new Set(contacts.flatMap(c => c.category))).sort();

  async function handleAddConnection() {
    if (!addFrom || !addTo || addFrom === addTo) return;
    await addConnection(uid, { contactAId: addFrom, contactBId: addTo, type: addType, note: addNote || undefined });
    setShowAddModal(false);
    setAddFrom(''); setAddTo(''); setAddNote('');
  }

  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const contactMap = new Map(contacts.map(c => [c.id, c]));

  return (
    <div className="screen">
      <div className="screen-header">
        <h1 className="screen-title">Netzwerk</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>+ Verbindung</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <select className="select" style={{ width: 'auto', fontSize: 13 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">Alle Typen</option>
          {CONNECTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="select" style={{ width: 'auto', fontSize: 13 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Alle Status</option>
          <option value="lead">Lead</option>
          <option value="aktiv">Aktiv</option>
          <option value="inaktiv">Inaktiv</option>
          <option value="vip">VIP</option>
        </select>
        <select className="select" style={{ width: 'auto', fontSize: 13 }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="">Alle Kategorien</option>
          {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {(filterType || filterStatus || filterCat) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setFilterType(''); setFilterStatus(''); setFilterCat(''); }}>✕ Zurücksetzen</button>
        )}
      </div>

      {/* Graph */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', marginBottom: 16 }}>
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }}>
          {/* Edges */}
          {visibleEdges.map(e => {
            const a = nodeMap.get(e.contactAId);
            const b = nodeMap.get(e.contactBId);
            if (!a || !b || !filteredIds.has(a.id) || !filteredIds.has(b.id)) return null;
            const isHighlighted = !selected || selNeighbors.has(a.id) && selNeighbors.has(b.id);
            const mx = (a.x + b.x) / 2; const my = (a.y + b.y) / 2;
            return (
              <g key={e.id}>
                <line
                  x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  stroke={isHighlighted ? 'var(--color-accent)' : 'var(--color-border)'}
                  strokeWidth={isHighlighted ? 2 : 1}
                  opacity={selected && !isHighlighted ? 0.2 : 0.7}
                />
                <text x={mx} y={my - 4} textAnchor="middle" fontSize={10} fill="var(--color-text-muted)" opacity={isHighlighted ? 1 : 0.5}>
                  {e.type}
                </text>
              </g>
            );
          })}

          {/* Nodes */}
          {filteredNodes.map(n => {
            const isSelected = n.id === selected;
            const isNeighbor = selNeighbors.has(n.id);
            const dimmed = selected && !isSelected && !isNeighbor;
            const initial = n.name.charAt(0).toUpperCase();
            return (
              <g key={n.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(isSelected ? null : n.id)}>
                <circle
                  cx={n.x} cy={n.y} r={isSelected ? 28 : 22}
                  fill={STATUS_COLORS[n.status] ?? '#A8A89B'}
                  stroke={isSelected ? 'var(--color-accent-dark)' : 'white'}
                  strokeWidth={isSelected ? 3 : 2}
                  opacity={dimmed ? 0.25 : 1}
                />
                <text x={n.x} y={n.y + 5} textAnchor="middle" fontSize={isSelected ? 16 : 13} fontWeight="700" fill="white" opacity={dimmed ? 0.25 : 1}>
                  {initial}
                </text>
                <text x={n.x} y={n.y + (isSelected ? 44 : 37)} textAnchor="middle" fontSize={11} fill="var(--color-text)" opacity={dimmed ? 0.25 : 0.9}
                  style={{ fontFamily: 'var(--font-body)' }}>
                  {n.name.split(' ')[0]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected contact panel */}
      {selected && (() => {
        const contact = contactMap.get(selected);
        if (!contact) return null;
        const conns = connections.filter(e => e.contactAId === selected || e.contactBId === selected);
        return (
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: 16 }}>{contact.name}</span>
                {contact.company && <span style={{ fontSize: 13, color: 'var(--color-text-muted)', marginLeft: 8 }}>{contact.company}</span>}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-outline btn-sm" onClick={() => navigate(`/contacts/${selected}`)}>Öffnen →</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>✕</button>
              </div>
            </div>
            {conns.length > 0 && (
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 6 }}>VERBINDUNGEN</p>
                {conns.map(e => {
                  const otherId = e.contactAId === selected ? e.contactBId : e.contactAId;
                  const other = contactMap.get(otherId);
                  return (
                    <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--color-border)', fontSize: 13 }}>
                      <span className="badge badge-neutral">{e.type}</span>
                      <span style={{ flex: 1 }}>{other?.name ?? otherId}</span>
                      {e.note && <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>{e.note}</span>}
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-error)', padding: '2px 6px' }}
                        onClick={() => deleteConnection(uid, e.id)}>✕</button>
                    </div>
                  );
                })}
              </div>
            )}
            {conns.length === 0 && <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Noch keine Verbindungen</p>}
          </div>
        );
      })()}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: 'var(--color-text-muted)', padding: '4px 0' }}>
        {Object.entries(STATUS_COLORS).map(([s, c]) => (
          <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: c, display: 'inline-block' }} />
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </span>
        ))}
        <span style={{ marginLeft: 'auto' }}>Knoten klicken = Details · Doppelklick = Kontakt öffnen</span>
      </div>

      {/* Add Connection Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Verbindung hinzufügen</h2>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div>
                <label className="input-label">Person A</label>
                <select className="select" value={addFrom} onChange={e => setAddFrom(e.target.value)}>
                  <option value="">Kontakt wählen…</option>
                  {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Person B</label>
                <select className="select" value={addTo} onChange={e => setAddTo(e.target.value)}>
                  <option value="">Kontakt wählen…</option>
                  {contacts.filter(c => c.id !== addFrom).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Verbindungstyp</label>
                <select className="select" value={addType} onChange={e => setAddType(e.target.value)}>
                  {CONNECTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Notiz (optional)</label>
                <input className="input" value={addNote} onChange={e => setAddNote(e.target.value)} placeholder="z.B. Kennen sich seit 2020" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-md" onClick={() => setShowAddModal(false)}>Abbrechen</button>
              <button className="btn btn-primary btn-md" onClick={handleAddConnection} disabled={!addFrom || !addTo || addFrom === addTo}>Speichern</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
