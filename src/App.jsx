import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, onSnapshot, writeBatch } from 'firebase/firestore';
import { 
  Search, Settings, RadioTower, Database, X, UploadCloud, Loader2, 
  ChevronRight, MapPin, TowerControl, Users, 
  Building2, Zap, ShieldCheck, 
  Copy, ExternalLink, Activity, CheckCircle2, Flame, MapPinned, Wrench, BatteryCharging,
  Navigation, Info as InfoIcon
} from 'lucide-react';

// REEMPLAZA CON TUS DATOS DE FIREBASE
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
  const [activeTab, setActiveTab] = useState('general');

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 font-sans">
      <header className="flex justify-between items-center mb-10 pb-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="bg-amber-500 p-3 rounded-2xl text-black"><RadioTower size={24} /></div>
          <h1 className="text-xl font-black uppercase italic">Fercho <span className="text-amber-500">Master</span></h1>
        </div>
        <button onClick={() => setShowAdmin(!showAdmin)} className="p-2 bg-slate-900 rounded-xl"><Settings /></button>
      </header>

      <main>
        {!showAdmin ? (
          <div className="space-y-6">
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600" />
              <input 
                type="text"
                placeholder="BUSCAR SITIO..."
                className="w-full bg-slate-900/50 border-2 border-white/5 rounded-3xl py-5 pl-16 pr-8 text-lg font-black uppercase italic focus:border-amber-500 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {filteredItems.length > 0 && (
                <div className="absolute top-full left-0 w-full mt-2 bg-slate-900 rounded-2xl shadow-2xl z-50">
                  {filteredItems.map(item => (
                    <button key={item.id} onClick={() => { setSelectedSite(item); setSearchTerm(''); }} className="w-full px-8 py-4 flex justify-between hover:bg-amber-500 group">
                      <span className="font-black group-hover:text-black uppercase italic">{item.Nombre}</span>
                      <ChevronRight className="group-hover:text-black" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedSite && (
              <div className="bg-slate-900 rounded-[2rem] overflow-hidden border border-white/10">
                <div className="p-8 bg-amber-500 text-black">
                  <h2 className="text-4xl font-black uppercase italic">{selectedSite.Nombre}</h2>
                  <p className="font-bold opacity-70">{selectedSite['Código'] || selectedSite.Codigo}</p>
                </div>
                <div className="p-8">
                  <p className="text-sm font-bold text-slate-500 mb-2">DIRECCIÓN</p>
                  <p className="text-xl font-black uppercase">{selectedSite.Dirección || 'S/D'}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-900 p-10 rounded-[2rem] text-center border border-white/10">
            <h2 className="text-amber-500 font-black mb-4 uppercase italic">Panel de Carga</h2>
            <p className="text-xs text-slate-500">Usa este panel para subir tu archivo CSV con los datos de los sitios.</p>
          </div>
        )}
      </main>
    </div>
  );
}
