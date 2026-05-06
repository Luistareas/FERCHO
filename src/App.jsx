import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, onSnapshot, writeBatch } from 'firebase/firestore';
import { 
  Search, Settings, RadioTower, Database, X, UploadCloud, Loader2, 
  ChevronRight, MapPin, Copy, ExternalLink, Activity, CheckCircle2, Flame, Info as InfoIcon
} from 'lucide-react';

// CONFIGURACIÓN DE FIREBASE (Asegúrate de poner tus llaves reales aquí)
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
    const initAuth = async () => {
      try { await signInAnonymously(auth); } catch (e) { console.error(e); }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(collection(db, 'artifacts', APP_ID, 'public', 'data', 'sites'), (snap) => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error(err));
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
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 font-sans selection:bg-amber-500 selection:text-black">
      <header className="max-w-4xl mx-auto flex justify-between items-center mb-10 pb-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="bg-amber-500 p-3 rounded-2xl text-black shadow-[0_0_20px_rgba(245,158,11,0.3)]">
            <RadioTower size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase italic tracking-tighter">Fercho <span className="text-amber-500">Master Tool</span></h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Base de Datos de Infraestructura</p>
          </div>
        </div>
        <button 
          onClick={() => setShowAdmin(!showAdmin)} 
          className={`p-2 rounded-xl border transition-all ${showAdmin ? 'bg-amber-500 text-black border-amber-500' : 'bg-slate-900 border-white/10 text-slate-400 hover:border-amber-500'}`}
        >
          {showAdmin ? <X size={20} /> : <Settings size={20} />}
        </button>
      </header>

      <main className="max-w-4xl mx-auto">
        {!showAdmin ? (
          <div className="space-y-6">
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-amber-500 transition-colors" />
              <input 
                type="text"
                placeholder="BUSCAR CÓDIGO O NOMBRE DEL SITIO..."
                className="w-full bg-slate-900/50 border-2 border-white/5 rounded-3xl py-6 pl-16 pr-8 text-xl font-black uppercase italic focus:border-amber-500 focus:bg-slate-900 outline-none transition-all shadow-2xl"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setSelectedSite(null); }}
              />
              {filteredItems.length > 0 && !selectedSite && (
                <div className="absolute top-full left-0 w-full mt-2 bg-slate-900 border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 overflow-hidden backdrop-blur-xl">
                  {filteredItems.map(item => (
                    <button 
                      key={item.id} 
                      onClick={() => { setSelectedSite(item); setSearchTerm(''); }} 
                      className="w-full px-8 py-4 flex justify-between items-center hover:bg-amber-500 group transition-all text-left"
                    >
                      <div>
                        <span className="font-black group-hover:text-black uppercase italic text-lg block leading-none">{item.Nombre}</span>
                        <span className="text-[10px] font-bold text-slate-500 group-hover:text-black/60 uppercase">{item['Código'] || item.Codigo}</span>
                      </div>
                      <ChevronRight className="group-hover:text-black group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedSite && (
              <div className="bg-slate-900 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                <div className="p-8 bg-gradient-to-r from-amber-500 to-orange-500 text-black relative overflow-hidden">
                  <div className="relative z-10">
                    <h2 className="text-4xl font-black uppercase italic leading-tight">{selectedSite.Nombre}</h2>
                    <p className="text-xl font-bold opacity-80 tracking-tighter">{selectedSite['Código'] || selectedSite.Codigo}</p>
                  </div>
                  <RadioTower className="absolute -right-4 -bottom-4 text-black/10" size={160} />
                </div>

                <div className="p-8 grid gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-6 bg-slate-950/50 rounded-3xl border border-white/5">
                            <p className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest flex items-center gap-2">
                                <MapPin size={12} /> Dirección Exacta
                            </p>
                            <p className="font-bold uppercase text-lg leading-snug">{selectedSite.Dirección || 'Sin Dirección Registrada'}</p>
                        </div>
                        <div className="p-6 bg-slate-950/50 rounded-3xl border border-white/5">
                            <p className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest flex items-center gap-2">
                                <Activity size={12} /> Ubicación Regional
                            </p>
                            <p className="font-bold uppercase text-lg">{selectedSite.Distrito} <span className="text-amber-500">/</span> {selectedSite.Departamento}</p>
                        </div>
                    </div>
                    
                    {/* Botón de Acciones rápidas */}
                    <div className="flex gap-3">
                        <button 
                            onClick={() => {
                                const text = `${selectedSite.Nombre} (${selectedSite['Código'] || selectedSite.Codigo})\nDirección: ${selectedSite.Dirección}\nUb: ${selectedSite.Distrito}, ${selectedSite.Departamento}`;
                                const el = document.createElement('textarea');
                                el.value = text;
                                document.body.appendChild(el);
                                el.select();
                                document.execCommand('copy');
                                document.body.removeChild(el);
                            }}
                            className="flex-1 bg-white/5 hover:bg-white/10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all"
                        >
                            <Copy size={14} /> Copiar Info
                        </button>
                    </div>
                </div>

                <div className="p-6 bg-slate-950/80 text-center border-t border-white/5">
                    <button 
                        onClick={() => setSelectedSite(null)} 
                        className="px-10 py-3 bg-slate-800 rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all"
                    >
                        Nueva Búsqueda
                    </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-900 p-10 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
                <h2 className="text-2xl font-black uppercase italic text-amber-500 mb-6 flex items-center gap-3">
                    <Database /> Gestión de la Base de Datos
                </h2>
                <div className="grid md:grid-cols-2 gap-8">
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-3xl p-12 hover:border-amber-500 hover:bg-amber-500/5 cursor-pointer transition-all group">
                        {importStatus.loading ? (
                            <div className="text-center">
                                <Loader2 className="animate-spin text-amber-500 mx-auto mb-4" size={48} />
                                <p className="text-xs font-black uppercase tracking-widest">{importStatus.progress} / {importStatus.total}</p>
                            </div>
                        ) : (
                            <>
                                <UploadCloud size={48} className="mb-4 text-slate-600 group-hover:text-amber-500 transition-colors" />
                                <p className="text-[10px] font-black uppercase text-slate-400 group-hover:text-white">Cargar Archivo CSV</p>
                                <p className="text-[8px] text-slate-600 mt-2">Separa por ";" o ","</p>
                            </>
                        )}
                        <input type="file" className="hidden" accept=".csv" onChange={handleCSVImport} disabled={importStatus.loading} />
                    </label>
                    <div className="bg-slate-950 p-12 rounded-3xl text-center flex flex-col justify-center border border-white/5">
                        <p className="text-6xl font-black text-white mb-2 tracking-tighter">{items.length}</p>
                        <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Sitios Sincronizados</p>
                    </div>
                </div>
            </div>
          </div>
        )}
      </main>
      
      <footer className="max-w-4xl mx-auto mt-20 text-center text-slate-700 text-[10px] font-bold uppercase tracking-[0.3em]">
        Sistema de Consulta Ferroviaria v4.0 • 2024
      </footer>
    </div>
  );
}
