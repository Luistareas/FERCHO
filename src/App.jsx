import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, onSnapshot, writeBatch } from 'firebase/firestore';
import { 
  Search, Settings, RadioTower, Database, X, UploadCloud, Loader2, 
  ChevronRight, MapPin, Copy, ExternalLink, Activity, CheckCircle2, Flame, Info as InfoIcon
} from 'lucide-react';

// REEMPLAZA ESTOS DATOS CON TUS CREDENCIALES DE FIREBASE SI LAS TIENES
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROYECTO_ID",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};

const APP_ID = 'fercho-master-v4'; 
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdmin, setShowAdmin] = useState(false);
  const [selectedSite, setSelectedSite] = useState(null);
  const [importStatus, setImportStatus] = useState({ loading: false, progress: 0, total: 0 });

  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(collection(db, 'artifacts', APP_ID, 'public', 'data', 'sites'), (snap) => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [user]);

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return [];
    return items.filter(i => 
      (i.Nombre || "").toLowerCase().includes(term) || 
      (i['Código'] || i.Codigo || "").toLowerCase().includes(term)
    ).slice(0, 10);
  }, [items, searchTerm]);

  const handleCSVImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (re) => {
      const text = re.target.result;
      const lines = text.split(/\r?\n/).filter(line => line.trim());
      if (lines.length < 2) return;
      const separator = lines[0].includes(';') ? ';' : ',';
      const headers = lines[0].split(separator).map(h => h.trim());
      const rows = lines.slice(1);
      setImportStatus({ loading: true, progress: 0, total: rows.length });
      
      for (let i = 0; i < rows.length; i += 100) {
        const batch = writeBatch(db);
        rows.slice(i, i + 100).forEach(row => {
          const values = row.split(separator);
          const entry = {};
          headers.forEach((h, idx) => { if (h) entry[h] = values[idx]; });
          const siteCode = entry['Código'] || entry['Codigo'];
          if (siteCode) {
            const safeId = siteCode.toString().trim().replace(/[^a-zA-Z0-9]/g, '_');
            batch.set(doc(db, 'artifacts', APP_ID, 'public', 'data', 'sites', safeId), entry);
          }
        });
        await batch.commit();
        setImportStatus(prev => ({ ...prev, progress: Math.min(i + 100, rows.length) }));
      }
      setImportStatus({ loading: false, progress: 0, total: 0 });
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 font-sans">
      <header className="max-w-4xl mx-auto flex justify-between items-center mb-10 pb-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="bg-amber-500 p-3 rounded-2xl text-black"><RadioTower size={24} /></div>
          <h1 className="text-xl font-black uppercase italic">Fercho <span className="text-amber-500">Master Tool</span></h1>
        </div>
        <button onClick={() => setShowAdmin(!showAdmin)} className="p-2 bg-slate-900 rounded-xl hover:bg-amber-500 hover:text-black transition-colors">
          {showAdmin ? <X /> : <Settings />}
        </button>
      </header>

      <main className="max-w-4xl mx-auto">
        {!showAdmin ? (
          <div className="space-y-6">
            <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600" />
              <input 
                type="text"
                placeholder="BUSCAR CÓDIGO O NOMBRE DEL SITIO..."
                className="w-full bg-slate-900/50 border-2 border-white/5 rounded-3xl py-6 pl-16 pr-8 text-xl font-black uppercase italic focus:border-amber-500 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setSelectedSite(null); }}
              />
              {filteredItems.length > 0 && !selectedSite && (
                <div className="absolute top-full left-0 w-full mt-2 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
                  {filteredItems.map(item => (
                    <button key={item.id} onClick={() => { setSelectedSite(item); setSearchTerm(''); }} className="w-full px-8 py-4 flex justify-between items-center hover:bg-amber-500 group transition-colors">
                      <span className="font-black group-hover:text-black uppercase italic text-lg">{item.Nombre}</span>
                      <ChevronRight className="group-hover:text-black" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedSite && (
              <div className="bg-slate-900 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl animate-in fade-in zoom-in-95">
                <div className="p-8 bg-gradient-to-r from-amber-500 to-orange-500 text-black">
                  <h2 className="text-4xl font-black uppercase italic leading-tight">{selectedSite.Nombre}</h2>
                  <p className="text-xl font-bold opacity-80">{selectedSite['Código'] || selectedSite.Codigo}</p>
                </div>
                <div className="p-8 grid gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-950 rounded-2xl">
                            <p className="text-[9px] font-black text-slate-500 uppercase mb-1 tracking-widest">Dirección</p>
                            <p className="font-bold uppercase">{selectedSite.Dirección || '---'}</p>
                        </div>
                        <div className="p-4 bg-slate-950 rounded-2xl">
                            <p className="text-[9px] font-black text-slate-500 uppercase mb-1 tracking-widest">Distrito / Departamento</p>
                            <p className="font-bold uppercase">{selectedSite.Distrito} - {selectedSite.Departamento}</p>
                        </div>
                    </div>
                </div>
                <div className="p-6 bg-slate-950/50 text-center">
                    <button onClick={() => setSelectedSite(null)} className="px-8 py-2 bg-slate-800 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">Cerrar Detalle</button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-900 p-10 rounded-[2.5rem] border border-white/10 shadow-2xl">
            <h2 className="text-2xl font-black uppercase italic text-amber-500 mb-6 flex items-center gap-3"><Database /> Panel de Datos</h2>
            <div className="grid md:grid-cols-2 gap-6">
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-3xl p-10 hover:border-amber-500 hover:bg-amber-500/5 cursor-pointer transition-all">
                    {importStatus.loading ? (
                        <Loader2 className="animate-spin text-amber-500" size={32} />
                    ) : (
                        <>
                            <UploadCloud size={40} className="mb-4 text-slate-600" />
                            <p className="text-[10px] font-black uppercase text-slate-400">Cargar Archivo CSV</p>
                        </>
                    )}
                    <input type="file" className="hidden" accept=".csv" onChange={handleCSVImport} disabled={importStatus.loading} />
                </label>
                <div className="bg-slate-950 p-10 rounded-3xl text-center flex flex-col justify-center">
                    <p className="text-5xl font-black text-white mb-2">{items.length}</p>
                    <p className="text-[10px] font-black uppercase text-emerald-500">Sitios en Base de Datos</p>
                </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
