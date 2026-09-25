"use client";

import {
  Cloud,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Database,
  ExternalLink,
  FileText,
  Gauge,
  Globe2,
  HeartPulse,
  Menu,
  Network,
  Plus,
  RefreshCw,
  Route,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  Users,
  X,
  Pencil,
  LogOut
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { api, DNSRecord, HostedZone } from "../lib/api";

const recordTypes = ["A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA"];

type Page = "zones" | "dashboard" | "traffic" | "health" | "resolver" | "profiles";

export default function Route53Console() {
  const [page, setPage] = useState<Page>("zones");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<{ email: string; name: string } | null>(null);
  const [loginEmail, setLoginEmail] = useState("admin@example.com");
  const [loginPassword, setLoginPassword] = useState("password");
  const [zones, setZones] = useState<HostedZone[]>([]);
  const [zonePage, setZonePage] = useState(1);
  const [zonePages, setZonePages] = useState(1);
  const [zoneTotal, setZoneTotal] = useState(0);
  const [selectedZone, setSelectedZone] = useState<HostedZone | null>(null);
  const [records, setRecords] = useState<DNSRecord[]>([]);
  const [recordPage, setRecordPage] = useState(1);
  const [recordPages, setRecordPages] = useState(1);
  const [recordTotal, setRecordTotal] = useState(0);
  const [zoneSearch, setZoneSearch] = useState("");
  const [recordSearch, setRecordSearch] = useState("");
  const [recordFilter, setRecordFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [zoneModal, setZoneModal] = useState(false);
  const [recordModal, setRecordModal] = useState(false);
  const [editingZone, setEditingZone] = useState<HostedZone | null>(null);
  const [editingRecord, setEditingRecord] = useState<DNSRecord | null>(null);

  const [zoneForm, setZoneForm] = useState({
    name: "",
    type: "Public",
    comment: "",
    private_zone: false
  });

  const [recordForm, setRecordForm] = useState({
    name: "",
    type: "A",
    ttl: 300,
    value: "",
    routing_policy: "Simple"
  });

  useEffect(() => {
    api.me().then(setUser).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (user) loadZones();
  }, [user, zoneSearch, zonePage]);

  useEffect(() => {
    if (selectedZone) loadRecords(selectedZone.id);
  }, [selectedZone, recordSearch, recordFilter, recordPage]);

  async function loadZones() {
    try {
      setLoading(true);
      const data = await api.zones(zoneSearch, zonePage);
      setZones(data.items); setZonePages(data.pages); setZoneTotal(data.total);
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function loadRecords(zoneId: number) {
    try {
      setLoading(true);
      const data = await api.records(zoneId, recordSearch, recordFilter, recordPage);
      setRecords(data.items); setRecordPages(data.pages); setRecordTotal(data.total);
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function notify(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  }

  async function login(e: FormEvent) {
    e.preventDefault();
    try {
      const loggedIn = await api.login(loginEmail, loginPassword);
      setUser(loggedIn);
    } catch (e) {
      notify((e as Error).message);
    }
  }

  async function logout() {
    await api.logout();
    setUser(null);
    setSelectedZone(null);
  }

  function openCreateZone() {
    setEditingZone(null);
    setZoneForm({ name: "", type: "Public", comment: "", private_zone: false });
    setZoneModal(true);
  }

  function openEditZone(zone: HostedZone) {
    setEditingZone(zone);
    setZoneForm({
      name: zone.name,
      type: zone.type,
      comment: zone.comment,
      private_zone: zone.private_zone
    });
    setZoneModal(true);
  }

  async function saveZone(e: FormEvent) {
    e.preventDefault();
    try {
      if (editingZone) {
        await api.updateZone(editingZone.id, zoneForm);
        notify("Hosted zone updated.");
      } else {
        await api.createZone(zoneForm);
        notify("Hosted zone created.");
      }
      setZoneModal(false);
      setZonePage(1);
      await loadZones();
    } catch (e) {
      notify((e as Error).message);
    }
  }

  async function deleteZone(zone: HostedZone) {
    if (!confirm(`Delete hosted zone "${zone.name}"?`)) return;
    try {
      await api.deleteZone(zone.id);
      if (selectedZone?.id === zone.id) setSelectedZone(null);
      notify("Hosted zone deleted.");
      loadZones();
    } catch (e) {
      notify((e as Error).message);
    }
  }

  function openCreateRecord() {
    setEditingRecord(null);
    setRecordForm({
      name: selectedZone?.name || "",
      type: "A",
      ttl: 300,
      value: "",
      routing_policy: "Simple"
    });
    setRecordModal(true);
  }

  function openEditRecord(record: DNSRecord) {
    setEditingRecord(record);
    setRecordForm({
      name: record.name,
      type: record.type,
      ttl: record.ttl,
      value: record.value,
      routing_policy: record.routing_policy
    });
    setRecordModal(true);
  }

  async function saveRecord(e: FormEvent) {
    e.preventDefault();
    if (!selectedZone) return;
    try {
      if (editingRecord) {
        await api.updateRecord(editingRecord.id, recordForm);
        notify("Record updated.");
      } else {
        await api.createRecord(selectedZone.id, recordForm);
        notify("Record created.");
      }
      setRecordModal(false);
      setRecordPage(1);
      await loadRecords(selectedZone.id);
      await loadZones();
    } catch (e) {
      notify((e as Error).message);
    }
  }

  async function deleteRecord(record: DNSRecord) {
    if (!confirm(`Delete ${record.name} ${record.type} record?`)) return;
    try {
      await api.deleteRecord(record.id);
      notify("Record deleted.");
      if (selectedZone) await loadRecords(selectedZone.id);
      await loadZones();
    } catch (e) {
      notify((e as Error).message);
    }
  }

  if (!user) {
    return (
      <main className="login-page">
        <div className="login-card">
          <div className="login-brand">
            <div className="aws-mark">aws</div>
            <div>
              <strong>Route 53</strong>
              <span>DNS management console</span>
            </div>
          </div>
          <h1>Sign in</h1>
          <p className="muted">Use the mocked account to access this assignment.</p>
          <form onSubmit={login} className="stack">
            <label>Email<input value={loginEmail} onChange={e => setLoginEmail(e.target.value)} /></label>
            <label>Password<input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} /></label>
            <button className="primary wide">Sign in</button>
          </form>
          <div className="login-note">Demo: admin@example.com / password</div>
        </div>
      </main>
    );
  }

  const nav = [
    { id: "dashboard" as Page, label: "Dashboard", icon: Gauge },
    { id: "zones" as Page, label: "Hosted zones", icon: Globe2 },
    { id: "traffic" as Page, label: "Traffic policies", icon: Route },
    { id: "health" as Page, label: "Health checks", icon: HeartPulse },
    { id: "resolver" as Page, label: "Resolver", icon: Network },
    { id: "profiles" as Page, label: "Profiles", icon: Users }
  ];

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="icon-button" onClick={() => setSidebarOpen(!sidebarOpen)}><Menu size={20}/></button>
        <div className="top-brand"><div className="aws-mark">aws</div><span>Route 53</span></div>
        <div className="top-spacer"/>
        <button className="top-link"><CircleHelp size={17}/> Help</button>
        <button className="top-link"><Settings size={17}/> Settings</button>
        <button className="account" onClick={logout}>{user.name}<ChevronDown size={15}/></button>
      </header>

      <div className="body-shell">
        {sidebarOpen && (
          <aside className="sidebar">
            <div className="service-title">Route 53</div>
            <div className="nav-group">
              {nav.map(item => {
                const Icon = item.icon;
                return (
                  <button key={item.id} className={`nav-item ${page === item.id ? "active" : ""}`} onClick={() => {setPage(item.id); setSelectedZone(null);}}>
                    <Icon size={17}/><span>{item.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="sidebar-bottom">
              <div className="nav-item"><ShieldCheck size={17}/> Security</div>
              <div className="nav-item"><FileText size={17}/> Documentation</div>
              <button className="nav-item" onClick={logout}><LogOut size={17}/> Sign out</button>
            </div>
          </aside>
        )}

        <main className="content">
          {notice && <div className="toast">{notice}</div>}

          {page === "dashboard" ? (
            <Dashboard zones={zoneTotal} />
          ) : page !== "zones" ? (
            <ComingSoon page={page}/>
          ) : selectedZone ? (
            <RecordPage
              zone={selectedZone}
              records={records}
              search={recordSearch}
              setSearch={setRecordSearch}
              filter={recordFilter}
              setFilter={setRecordFilter}
              loading={loading}
              onBack={() => setSelectedZone(null)}
              onCreate={openCreateRecord}
              onEdit={openEditRecord}
              onDelete={deleteRecord}
              onRefresh={() => loadRecords(selectedZone.id)}
              page={recordPage} pages={recordPages} total={recordTotal} setPage={setRecordPage}
            />
          ) : (
            <ZonesPage
              zones={zones}
              search={zoneSearch}
              setSearch={setZoneSearch}
              loading={loading}
              onCreate={openCreateZone}
              onEdit={openEditZone}
              onDelete={deleteZone}
              onSelect={setSelectedZone}
              onRefresh={loadZones}
              page={zonePage} pages={zonePages} total={zoneTotal} setPage={setZonePage}
            />
          )}
        </main>
      </div>

      {zoneModal && (
        <Modal title={editingZone ? "Edit hosted zone" : "Create hosted zone"} onClose={() => setZoneModal(false)}>
          <form onSubmit={saveZone} className="stack">
            <label>Domain name<input required placeholder="example.com" value={zoneForm.name} onChange={e => setZoneForm({...zoneForm, name:e.target.value})}/></label>
            <label>Type<select value={zoneForm.type} onChange={e => setZoneForm({...zoneForm, type:e.target.value})}><option>Public</option><option>Private</option></select></label>
            <label>Comment<textarea rows={3} value={zoneForm.comment} onChange={e => setZoneForm({...zoneForm, comment:e.target.value})}/></label>
            <label className="checkbox"><input type="checkbox" checked={zoneForm.private_zone} onChange={e => setZoneForm({...zoneForm, private_zone:e.target.checked})}/> Private hosted zone</label>
            <div className="modal-actions"><button type="button" onClick={() => setZoneModal(false)} className="secondary">Cancel</button><button className="primary">{editingZone ? "Save changes" : "Create hosted zone"}</button></div>
          </form>
        </Modal>
      )}

      {recordModal && (
        <Modal title={editingRecord ? "Edit record" : "Create record"} onClose={() => setRecordModal(false)}>
          <form onSubmit={saveRecord} className="stack">
            <label>Record name<input required value={recordForm.name} onChange={e => setRecordForm({...recordForm, name:e.target.value})}/></label>
            <div className="form-row">
              <label>Record type<select value={recordForm.type} onChange={e => setRecordForm({...recordForm, type:e.target.value})}>{recordTypes.map(t=><option key={t}>{t}</option>)}</select></label>
              <label>TTL (seconds)<input type="number" min="0" value={recordForm.ttl} onChange={e => setRecordForm({...recordForm, ttl:Number(e.target.value)})}/></label>
            </div>
            <label>Value<textarea required rows={5} value={recordForm.value} onChange={e => setRecordForm({...recordForm, value:e.target.value})}/></label>
            <label>Routing policy<select value={recordForm.routing_policy} onChange={e => setRecordForm({...recordForm, routing_policy:e.target.value})}><option>Simple</option><option>Weighted</option><option>Latency</option><option>Failover</option><option>Geolocation</option></select></label>
            <div className="modal-actions"><button type="button" onClick={() => setRecordModal(false)} className="secondary">Cancel</button><button className="primary">{editingRecord ? "Save changes" : "Create record"}</button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function ZonesPage(props: {
  zones: HostedZone[];
  search: string;
  setSearch: (v: string) => void;
  loading: boolean;
  onCreate: () => void;
  onEdit: (z: HostedZone) => void;
  onDelete: (z: HostedZone) => void;
  onSelect: (z: HostedZone) => void;
  onRefresh: () => void;
  page:number; pages:number; total:number; setPage:(n:number)=>void;
}) {
  return (
    <>
      <div className="breadcrumb">Route 53 <ChevronRight size={15}/> Hosted zones</div>
      <div className="page-heading">
        <div><h1>Hosted zones</h1><p>Manage the DNS zones for your domains.</p></div>
        <button className="primary" onClick={props.onCreate}><Plus size={17}/> Create hosted zone</button>
      </div>

      <section className="panel">
        <div className="panel-toolbar">
          <div className="searchbox"><Search size={17}/><input placeholder="Find hosted zones" value={props.search} onChange={e=>props.setSearch(e.target.value)}/></div>
          <button className="icon-button bordered" title="Refresh" onClick={props.onRefresh}><RefreshCw size={17}/></button>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Hosted zone name</th><th>Type</th><th>Records</th><th>Comment</th><th>Actions</th></tr></thead>
            <tbody>
              {props.zones.map(zone => (
                <tr key={zone.id}>
                  <td><button className="link-button" onClick={()=>props.onSelect(zone)}>{zone.name}</button></td>
                  <td><span className="pill">{zone.type}</span></td>
                  <td>{zone.record_count}</td>
                  <td>{zone.comment || <span className="muted">—</span>}</td>
                  <td><div className="row-actions"><button className="mini-button" onClick={()=>props.onEdit(zone)}><Pencil size={14}/></button><button className="mini-button danger" onClick={()=>props.onDelete(zone)}><Trash2 size={14}/></button></div></td>
                </tr>
              ))}
              {!props.zones.length && <tr><td colSpan={5} className="empty">{props.loading ? "Loading..." : "No hosted zones found."}</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="table-footer"><span>{props.total} hosted zone{props.total === 1 ? "" : "s"}</span><div><button disabled={props.page===1} onClick={()=>props.setPage(props.page-1)}>‹</button> Page {props.page} of {props.pages} <button disabled={props.page===props.pages} onClick={()=>props.setPage(props.page+1)}>›</button></div></div>
      </section>
    </>
  );
}

function RecordPage(props: {
  zone: HostedZone;
  records: DNSRecord[];
  search: string;
  setSearch: (v:string)=>void;
  filter: string;
  setFilter: (v:string)=>void;
  loading: boolean;
  onBack: ()=>void;
  onCreate: ()=>void;
  onEdit: (r:DNSRecord)=>void;
  onDelete: (r:DNSRecord)=>void;
  onRefresh: ()=>void;
  page:number; pages:number; total:number; setPage:(n:number)=>void;
}) {
  return (
    <>
      <div className="breadcrumb"><button className="crumb-button" onClick={props.onBack}>Hosted zones</button><ChevronRight size={15}/>{props.zone.name}</div>
      <div className="page-heading">
        <div><h1>{props.zone.name}</h1><p>DNS records for this hosted zone.</p></div>
        <button className="secondary" onClick={async()=>{const data=await api.exportZone(props.zone.id); const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=`${props.zone.name}-hosted-zone.json`; a.click(); URL.revokeObjectURL(url)}}><FileText size={16}/> Export JSON</button><button className="primary" onClick={props.onCreate}><Plus size={17}/> Create record</button>
      </div>
      <section className="panel">
        <div className="panel-toolbar">
          <div className="searchbox"><Search size={17}/><input placeholder="Search records" value={props.search} onChange={e=>props.setSearch(e.target.value)}/></div>
          <select className="filter" value={props.filter} onChange={e=>props.setFilter(e.target.value)}><option value="">All record types</option>{recordTypes.map(t=><option key={t}>{t}</option>)}</select>
          <button className="icon-button bordered" onClick={props.onRefresh}><RefreshCw size={17}/></button>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Record name</th><th>Type</th><th>TTL</th><th>Value</th><th>Routing</th><th>Actions</th></tr></thead>
            <tbody>
              {props.records.map(record => (
                <tr key={record.id}>
                  <td>{record.name}</td>
                  <td><span className="pill blue">{record.type}</span></td>
                  <td>{record.ttl}</td>
                  <td className="value-cell">{record.value}</td>
                  <td>{record.routing_policy}</td>
                  <td><div className="row-actions"><button className="mini-button" onClick={()=>props.onEdit(record)}><Pencil size={14}/></button><button className="mini-button danger" onClick={()=>props.onDelete(record)}><Trash2 size={14}/></button></div></td>
                </tr>
              ))}
              {!props.records.length && <tr><td colSpan={6} className="empty">{props.loading ? "Loading..." : "No DNS records found."}</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="table-footer"><span>{props.total} record{props.total === 1 ? "" : "s"}</span><div><button disabled={props.page===1} onClick={()=>props.setPage(props.page-1)}>‹</button> Page {props.page} of {props.pages} <button disabled={props.page===props.pages} onClick={()=>props.setPage(props.page+1)}>›</button></div></div>
      </section>
    </>
  );
}

function Dashboard({zones}:{zones:number}) {
  return <div>
    <div className="breadcrumb">Route 53 <ChevronRight size={15}/> Dashboard</div>
    <div className="page-heading"><div><h1>Dashboard</h1><p>Overview of the Route 53 clone environment.</p></div></div>
    <div className="dashboard-grid">
      <div className="dashboard-card"><Globe2 size={22}/><span>Hosted zones</span><strong>{zones}</strong><small>Stored in SQLite</small></div>
      <div className="dashboard-card"><ShieldCheck size={22}/><span>Authentication</span><strong>Active</strong><small>Mock session</small></div>
      <div className="dashboard-card"><Network size={22}/><span>Backend API</span><strong>Online</strong><small>FastAPI</small></div>
      <div className="dashboard-card"><Database size={22}/><span>Database</span><strong>SQLite</strong><small>Persistent local storage</small></div>
    </div>
    <section className="panel dashboard-info"><h2>Route 53 clone</h2><p>This dashboard is mocked as permitted by the assignment. Hosted zones and DNS records are fully persisted and manageable through the console.</p></section>
  </div>;
}

function ComingSoon({page}:{page:Page}) {
  const labels:Record<Page,string> = {dashboard:"Dashboard", zones:"Hosted zones", traffic:"Traffic policies", health:"Health checks", resolver:"Resolver", profiles:"Profiles"};
  return <div className="coming"><Cloud size={54}/><h1>{labels[page]}</h1><p>This section is available as a Route 53 style placeholder.</p><span>Coming soon</span></div>;
}

function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}) {
  return <div className="modal-backdrop"><div className="modal"><div className="modal-header"><h2>{title}</h2><button className="icon-button" onClick={onClose}><X size={19}/></button></div><div className="modal-body">{children}</div></div></div>;
}
