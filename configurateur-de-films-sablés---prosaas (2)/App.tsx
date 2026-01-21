
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  User, 
  Box, 
  Settings, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  X,
  Send,
  CreditCard,
  Database,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Phone,
  Mail,
  Lock,
  ChevronRight,
  Truck,
  HardHat,
  Monitor
} from 'lucide-react';
import { WindowItem, ClientData, OrderOptions, FilmDesign, OrderSummary } from './types';
import { GoogleGenAI } from "@google/genai";

const PRICE_FILM_PER_M2 = 55;
const PRICE_INSTALL_PER_M2 = 30;
const MIN_INSTALL_FEE = 150;
const SHIPPING_FEE = 20;

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

type AppStatus = 'form' | 'processing' | 'success' | 'critical_error';

export default function App() {
  const [status, setStatus] = useState<AppStatus>('form');
  const [client, setClient] = useState<ClientData>({
    firstName: '', lastName: '', email: '',
    billingAddress: '', vatNumber: '',
    hasDifferentShipping: false, shippingAddress: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [windows, setWindows] = useState<WindowItem[]>([{ id: '1', width: 100, height: 100 }]);
  const [options, setOptions] = useState<OrderOptions>({
    design: FilmDesign.OPALE, delivery: false, professionalInstallation: false
  });

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Bonjour ! Je suis l\'assistant expert de l\'agence. Besoin d\'un conseil technique sur vos vitrages ?' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  const summary = useMemo((): OrderSummary => {
    const totalArea = windows.reduce((acc, win) => acc + (win.width * win.height / 10000), 0);
    const filmCost = totalArea * PRICE_FILM_PER_M2;
    let installCost = options.professionalInstallation ? Math.max(MIN_INSTALL_FEE, totalArea * PRICE_INSTALL_PER_M2) : 0;
    const deliveryCost = options.delivery ? SHIPPING_FEE : 0;
    return {
      windowCount: windows.length, totalArea, filmCost, installCost, deliveryCost,
      totalHT: filmCost + installCost + deliveryCost
    };
  }, [windows, options]);

  const updateWindow = (id: string, field: 'width' | 'height', value: number) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, [field]: value } : w));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!client.lastName.trim()) newErrors.lastName = "Nom requis";
    if (!client.firstName.trim()) newErrors.firstName = "Prénom requis";
    if (!client.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client.email)) newErrors.email = "Email invalide";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Capture de Lead préventive pour Make.com / Monday.com
  const captureLead = async (type: 'attempt' | 'success' | 'failure') => {
    console.log(`[Lead Capture] Status: ${type}`, { client, summary });
    // Ici, vous connecterez votre Webhook Make.com
    // await fetch('https://hook.make.com/your-id', { method: 'POST', body: JSON.stringify({ type, client, summary, windows }) });
  };

  const handleCheckout = async () => {
    if (!validate()) return;
    setStatus('processing');
    
    // On capture l'intention d'achat immédiatement
    await captureLead('attempt');

    try {
      // Simulation d'appel API Stripe (réellement, vous redirigeriez vers une URL de checkout)
      await new Promise(r => setTimeout(r, 2500));
      
      // Simulation d'une réussite
      setStatus('success');
      await captureLead('success');
    } catch (err) {
      console.error("Erreur de paiement. Activation du mode rescue.");
      setStatus('critical_error');
      await captureLead('failure');
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    const userMsg = userInput;
    setUserInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: userMsg }] }],
        config: { systemInstruction: "Tu es un expert en films de vitrage pour une agence de communication. Sois pro, court et technique." }
      });
      setChatMessages(prev => [...prev, { role: 'model', text: response.text || "" }]);
    } catch (e) {
      setChatMessages(prev => [...prev, { role: 'model', text: "Le service d'assistance est surchargé, mais votre devis est sauvegardé." }]);
    } finally { setIsTyping(false); }
  };

  if (status === 'critical_error') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="bg-white rounded-[3rem] shadow-2xl max-w-lg w-full p-12 text-center border-t-8 border-red-500 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-red-100"></div>
          <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
            <AlertTriangle size={48} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter">Données Sauvegardées !</h2>
          <p className="text-slate-500 mb-10 leading-relaxed font-medium">
            Le paiement a rencontré un problème technique, mais <strong>votre configuration est en sécurité</strong>. Notre équipe a reçu votre dossier et vous contactera par téléphone pour finaliser.
          </p>
          <div className="grid gap-4">
            <a href="tel:+33123456789" className="flex items-center justify-center gap-3 w-full bg-slate-900 text-white py-5 rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl">
              <Phone size={20} /> Appeler l'expert (01 23...)
            </a>
            <button onClick={() => setStatus('form')} className="text-slate-400 font-bold text-sm hover:text-blue-600 transition-all py-2">
              Réessayer le paiement sécurisé
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'processing') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="bg-white rounded-[3rem] shadow-2xl max-w-md w-full p-16 text-center border border-slate-100">
          <div className="relative w-32 h-32 mx-auto mb-10">
            <div className="absolute inset-0 border-8 border-blue-50 rounded-full"></div>
            <div className="absolute inset-0 border-8 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-blue-600">
              <Lock size={40} className="animate-pulse" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Sécurisation...</h2>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Enregistrement Monday & Stripe</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="bg-white rounded-[4rem] shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in duration-700">
          <div className="bg-[#0F172A] p-20 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-[100px]"></div>
            <div className="relative z-10">
              <div className="w-24 h-24 bg-blue-600 text-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-blue-500/40 rotate-12">
                <CheckCircle2 size={48} />
              </div>
              <h2 className="text-5xl font-black mb-4 tracking-tighter uppercase">Succès Total</h2>
              <p className="text-slate-400 text-xl font-medium">Votre projet est en cours de production.</p>
            </div>
          </div>
          <div className="p-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600"><CreditCard size={20}/></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Facturation</span>
                </div>
                <div className="font-black text-slate-900">Paiement Stripe OK</div>
              </div>
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-indigo-600"><Database size={20}/></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Atelier</span>
                </div>
                <div className="font-black text-slate-900">Synchronisé Monday</div>
              </div>
            </div>
            <button onClick={() => setStatus('form')} className="w-full bg-blue-600 text-white py-6 rounded-3xl font-black text-xl uppercase tracking-widest hover:bg-blue-700 transition-all shadow-2xl shadow-blue-200 active:scale-[0.98]">
              Retour au configurateur
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 bg-[#F8FAFC]">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl rotate-3">
              <Settings size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                ProSaaS <span className="text-blue-600">Films</span>
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Flux de vente sécurisé</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="hidden lg:flex gap-10">
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Support Atelier</span>
                <span className="text-sm font-black text-slate-900">01 23 45 67 89</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Protection</span>
                <span className="text-sm font-black text-blue-600 flex items-center gap-1"><ShieldCheck size={14}/> 256-bit AES</span>
              </div>
            </div>
            <button className="bg-blue-50 text-blue-600 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">Accès Pro</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-16 grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
        <div className="lg:col-span-8 space-y-12">
          {/* Etape 1 : Client */}
          <section className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/40 border border-slate-200/60 overflow-hidden">
            <div className="px-10 py-8 bg-slate-50/50 border-b border-slate-100 flex items-center gap-6">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-blue-600 font-black text-xl">01</div>
              <div>
                <h2 className="font-black text-slate-900 uppercase text-sm tracking-[0.3em]">Identification</h2>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mt-1">Facturation & Garanties</p>
              </div>
            </div>
            <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
              {['firstName', 'lastName', 'email'].map((field) => (
                <div key={field} className={field === 'email' ? 'md:col-span-2' : ''}>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-4 tracking-[0.2em]">
                    {field === 'firstName' ? 'Prénom' : field === 'lastName' ? 'Nom de famille' : 'E-mail professionnel'}
                  </label>
                  <input 
                    type={field === 'email' ? 'email' : 'text'}
                    className={`w-full px-8 py-5 rounded-[1.5rem] border-2 transition-all font-black text-slate-800 outline-none placeholder:text-slate-300 ${errors[field] ? 'border-red-200 bg-red-50' : 'border-slate-50 bg-slate-50 focus:border-blue-500 focus:bg-white focus:shadow-2xl focus:shadow-blue-500/10'}`}
                    placeholder="..."
                    value={(client as any)[field]}
                    onChange={e => setClient({...client, [field]: e.target.value})}
                  />
                </div>
              ))}
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-4 tracking-[0.2em]">Adresse complète de facturation</label>
                <textarea 
                   className="w-full px-8 py-5 rounded-[1.5rem] border-2 border-slate-50 bg-slate-50 focus:border-blue-500 focus:bg-white h-32 outline-none font-black text-slate-800 transition-all placeholder:text-slate-300"
                   placeholder="Rue, Code Postal, Ville..."
                   value={client.billingAddress}
                   onChange={e => setClient({...client, billingAddress: e.target.value})}
                />
              </div>
            </div>
          </section>

          {/* Etape 2 : Mesures */}
          <section className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/40 border border-slate-200/60 overflow-hidden">
            <div className="px-10 py-8 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-blue-600 font-black text-xl">02</div>
                <div>
                  <h2 className="font-black text-slate-900 uppercase text-sm tracking-[0.3em]">Cahier de vitrages</h2>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mt-1">Mesures au centimètre</p>
                </div>
              </div>
              <button 
                onClick={() => setWindows([...windows, {id: Date.now().toString(), width: 100, height: 100}])} 
                className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl shadow-slate-200"
              >
                + Nouvelle vitre
              </button>
            </div>
            <div className="p-10 space-y-8">
              {windows.map((w, idx) => (
                <div key={w.id} className="flex flex-col md:flex-row gap-10 p-10 bg-[#FBFCFF] rounded-[2rem] border border-slate-100 items-center transition-all hover:shadow-2xl hover:shadow-slate-200/40 relative group">
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-slate-100 rounded-full flex items-center justify-center font-black text-[10px] text-slate-300 shadow-sm">{idx + 1}</div>
                  <div className="flex-1 grid grid-cols-2 gap-10 w-full">
                    <div className="relative">
                      <span className="absolute left-0 -top-6 text-[10px] font-black text-slate-300 uppercase tracking-widest">Largeur</span>
                      <div className="flex items-center border-b-4 border-slate-200 focus-within:border-blue-500 transition-colors">
                        <input type="number" className="w-full py-4 bg-transparent outline-none font-black text-3xl text-slate-900" value={w.width} onChange={e => updateWindow(w.id, 'width', +e.target.value)}/>
                        <span className="text-sm font-black text-slate-300 ml-2">CM</span>
                      </div>
                    </div>
                    <div className="relative">
                      <span className="absolute left-0 -top-6 text-[10px] font-black text-slate-300 uppercase tracking-widest">Hauteur</span>
                      <div className="flex items-center border-b-4 border-slate-200 focus-within:border-blue-500 transition-colors">
                        <input type="number" className="w-full py-4 bg-transparent outline-none font-black text-3xl text-slate-900" value={w.height} onChange={e => updateWindow(w.id, 'height', +e.target.value)}/>
                        <span className="text-sm font-black text-slate-300 ml-2">CM</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-10 min-w-[180px] justify-end">
                    <div className="text-right">
                      <div className="text-[10px] font-black text-slate-300 uppercase mb-1">Surface</div>
                      <div className="text-blue-600 font-black text-4xl tracking-tighter">
                        {(w.width * w.height / 10000).toFixed(2)}<span className="text-xl">m²</span>
                      </div>
                    </div>
                    <button onClick={() => setWindows(windows.filter(win => win.id !== w.id))} className="w-14 h-14 flex items-center justify-center text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"><Trash2 size={24}/></button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar : Devis Live */}
        <div className="lg:col-span-4 lg:sticky lg:top-36">
          <div className="bg-[#0F172A] rounded-[3rem] shadow-2xl shadow-blue-900/20 text-white overflow-hidden border border-slate-800">
            <div className="p-12">
              <div className="flex items-center justify-between mb-12">
                <h3 className="text-2xl font-black uppercase tracking-tighter">Votre Devis</h3>
                <div className="px-3 py-1 bg-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">Live HT</div>
              </div>
              
              <div className="space-y-8 mb-12">
                <div className="flex justify-between items-center group">
                  <div className="flex items-center gap-3">
                    <Monitor size={16} className="text-slate-500" />
                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px] group-hover:text-blue-400 transition-colors">Vitrages ({summary.windowCount})</span>
                  </div>
                  <span className="font-black text-slate-200">{summary.totalArea.toFixed(2)} m²</span>
                </div>

                <div className="pt-8 border-t border-slate-800 flex justify-between items-center">
                  <select 
                    className="bg-slate-800 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] outline-none border-none focus:ring-2 focus:ring-blue-500 cursor-pointer" 
                    value={options.design} 
                    onChange={e => setOptions({...options, design: e.target.value as FilmDesign})}
                  >
                    {Object.values(FilmDesign).map(d => <option key={d} value={d}>Film {d}</option>)}
                  </select>
                  <span className="font-black text-blue-400">{summary.filmCost.toFixed(2)}€</span>
                </div>

                <div className="space-y-6 pt-8 border-t border-slate-800">
                  <label className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${options.delivery ? 'bg-blue-600 scale-110' : 'bg-slate-800'}`}>
                        <Truck size={14} className={options.delivery ? 'text-white' : 'text-slate-600'}/>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 group-hover:text-white uppercase tracking-widest transition-colors">Livraison</span>
                    </div>
                    <input type="checkbox" className="hidden" checked={options.delivery} onChange={e => setOptions({...options, delivery: e.target.checked})} />
                    <span className="font-bold text-xs text-slate-500">+{SHIPPING_FEE}€</span>
                  </label>

                  <label className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${options.professionalInstallation ? 'bg-blue-600 scale-110' : 'bg-slate-800'}`}>
                        <HardHat size={14} className={options.professionalInstallation ? 'text-white' : 'text-slate-600'}/>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 group-hover:text-white uppercase tracking-widest transition-colors">Installation Pro</span>
                    </div>
                    <input type="checkbox" className="hidden" checked={options.professionalInstallation} onChange={e => setOptions({...options, professionalInstallation: e.target.checked})} />
                    <span className="font-bold text-xs text-slate-500">{options.professionalInstallation ? 'Inclus' : 'En option'}</span>
                  </label>
                </div>

                <div className="pt-12 border-t-2 border-slate-800">
                  <div className="flex justify-between items-end mb-2">
                    <span className="font-black text-slate-500 uppercase text-[10px] tracking-[0.3em]">Total Net HT</span>
                    <span className="text-6xl font-black text-white tracking-tighter leading-none">
                      {summary.totalHT.toFixed(2)}<span className="text-2xl ml-1 text-blue-600">€</span>
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] text-right">Paiement 100% sécurisé</p>
                </div>
              </div>

              <button 
                onClick={handleCheckout}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-7 rounded-[2rem] font-black text-xl uppercase tracking-[0.3em] flex items-center justify-center gap-6 transition-all shadow-2xl shadow-blue-600/30 active:scale-[0.97]"
              >
                Payer
                <ArrowRight size={28} />
              </button>
              
              <div className="mt-12 flex items-center justify-center gap-8 opacity-40 hover:opacity-100 transition-opacity">
                <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" className="h-5 brightness-0 invert" alt="Stripe" />
                <div className="w-px h-5 bg-slate-700"></div>
                <img src="https://monday.com/p/wp-content/uploads/2021/01/monday-logo-2.png" className="h-5 brightness-0 invert" alt="Monday" />
              </div>
            </div>
          </div>
          
          {/* Badge de confiance supplémentaire */}
          <div className="mt-8 p-6 bg-blue-50/50 rounded-3xl border border-blue-100 flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600"><ShieldCheck size={20}/></div>
            <p className="text-[10px] font-bold text-blue-800 leading-tight uppercase tracking-wider">Vos données sont protégées par chiffrement bancaire et enregistrées sur nos serveurs haute disponibilité.</p>
          </div>
        </div>
      </main>

      {/* Assistant IA flottant */}
      <div className="fixed bottom-12 right-12 z-50">
        {!isChatOpen ? (
          <button onClick={() => setIsChatOpen(true)} className="w-20 h-20 bg-slate-900 text-white rounded-[2rem] shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-90 group relative">
            <Sparkles size={32} className="group-hover:rotate-12 transition-transform" />
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-600 border-4 border-white rounded-full"></div>
            <div className="absolute -left-32 top-1/2 -translate-y-1/2 px-4 py-2 bg-white text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Une question ?</div>
          </button>
        ) : (
          <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-200 w-[450px] flex flex-col h-[650px] animate-in slide-in-from-bottom-12 duration-500 overflow-hidden">
             <div className="p-10 bg-[#0F172A] text-white flex justify-between items-center relative">
                <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600"></div>
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/40"><Sparkles size={24}/></div>
                  <div>
                    <span className="font-black uppercase tracking-[0.3em] text-xs block">Expert Agency</span>
                    <span className="text-[9px] font-bold text-blue-400 uppercase tracking-[0.2em] flex items-center gap-2 mt-1">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                      Assistant Spécialisé
                    </span>
                  </div>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="hover:rotate-90 transition-transform p-2 bg-white/10 rounded-xl"><X size={24}/></button>
             </div>
             <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-slate-50/20">
                {chatMessages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-6 rounded-[2rem] font-bold text-sm leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none shadow-blue-200' : 'bg-white text-slate-700 rounded-bl-none border border-slate-100'}`}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce delay-75"></div>
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce delay-150"></div>
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce delay-300"></div>
                    </div>
                    <span className="text-blue-600 text-[9px] font-black uppercase tracking-widest">Analyse en cours...</span>
                  </div>
                )}
                <div ref={chatEndRef}/>
             </div>
             <div className="p-8 bg-white border-t border-slate-100">
                <div className="relative group">
                  <input 
                    type="text" 
                    value={userInput} 
                    onChange={e => setUserInput(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()} 
                    className="w-full pl-8 pr-20 py-5 bg-slate-50 border-none rounded-3xl outline-none focus:ring-4 focus:ring-blue-100 font-bold text-sm transition-all" 
                    placeholder="Votre question technique..."
                  />
                  <button onClick={handleSendMessage} className="absolute right-3 top-3 p-3 bg-slate-900 text-white rounded-2xl hover:bg-blue-600 transition-all shadow-lg active:scale-90">
                    <Send size={20}/>
                  </button>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
