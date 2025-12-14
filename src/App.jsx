import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  onAuthStateChanged, 
  signOut
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  deleteDoc,
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  setDoc,
  doc,
  getDoc
} from 'firebase/firestore';
import { 
  Send, LogOut, MessageCircle, User, 
  Search, ArrowLeft, MoreVertical, Check, Paperclip, Smile, Mic, Shield, Key, Lock, Image as ImageIcon, X, Edit2, Save, Trash2, Settings, Info, Github, Linkedin, Heart
} from 'lucide-react';

/**
 * ------------------------------------------------------------------
 * FIREBASE CONFIGURATION
 * ------------------------------------------------------------------
 */
const firebaseConfig = {
  apiKey: "AIzaSyBG0SzKRNkv_UACFsJr_7RBq6O4klxAkCU",
  authDomain: "mychatapp-38b03.firebaseapp.com",
  projectId: "mychatapp-38b03",
  storageBucket: "mychatapp-38b03.firebasestorage.app",
  messagingSenderId: "621496495450",
  appId: "1:621496495450:web:7f260e2d74eabff5eb1763"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const APP_ID = 'secure-chat-v1'; 

// --- THEME COLORS ---
const THEME = {
    bg: '#0f172a',        // Dark Blue/Slate background
    sidebar: '#1e293b',   // Slightly lighter slate
    header: '#334155',    // Header color
    primary: '#3b82f6',   // Bright Blue (Brand Color)
    msgOut: '#2563eb',    // Sent message bubble
    msgIn: '#334155',     // Received message bubble
    text: '#f1f5f9',      // Main text
    textSec: '#94a3b8'    // Secondary text
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. SYSTEM SETUP
  useEffect(() => {
    document.title = "SecureChat";
    if (!document.getElementById('tailwind-script')) {
      const script = document.createElement('script');
      script.id = 'tailwind-script';
      script.src = "https://cdn.tailwindcss.com";
      document.head.appendChild(script);
    }
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = 'https://cdn-icons-png.flaticon.com/512/1320/1320457.png'; 
    document.body.style.backgroundColor = THEME.bg;
    document.body.style.margin = '0';
  }, []);

  // 2. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const cleanPhone = currentUser.phoneNumber.replace(/\s/g, '');
        await setDoc(doc(db, 'artifacts', APP_ID, 'users', cleanPhone), {
          uid: currentUser.uid,
          phoneNumber: cleanPhone,
          lastSeen: serverTimestamp()
        }, { merge: true });
      }
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return (
    <div className="h-[100dvh] w-screen flex flex-col items-center justify-center bg-slate-900 text-white">
       <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
       <div className="mt-8 text-blue-500 font-bold tracking-widest text-sm">SECURE CHAT</div>
    </div>
  );

  return (
    <div className="h-[100dvh] font-sans overflow-hidden bg-slate-900 text-slate-100">
      {!user ? <LoginScreen /> : <MainInterface user={user} />}
    </div>
  );
}

/**
 * ------------------------------------------------------------------
 * COMPONENT: LOGIN SCREEN
 * ------------------------------------------------------------------
 */
function LoginScreen() {
  const [phone, setPhone] = useState('+91');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('PHONE');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible', 
        'callback': () => {}
      });
    }
  };

  const sendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const formattedPhone = phone.replace(/\s/g, '');
    try {
      setupRecaptcha();
      await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
      setStep('OTP');
    } catch (err) {
      console.error(err);
      setError("Login Failed. Use Test Numbers (+91 8369777252).");
    }
    setLoading(false);
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await window.confirmationResult.confirm(otp);
    } catch (err) {
      setError("Invalid Code");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-[#0f172a] p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[10%] right-[10%] w-[30%] h-[30%] bg-purple-600/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden relative z-10">
        <div className="bg-slate-900/50 p-8 flex flex-col items-center border-b border-slate-700">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-lg mb-4">
                <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide">SecureChat</h1>
            <p className="text-blue-400 text-xs font-medium mt-1 uppercase tracking-widest">End-to-End Encrypted</p>
        </div>

        <div className="p-8">
            {error && (
                <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm text-center">
                    {error}
                </div>
            )}

            {step === 'PHONE' ? (
                <form onSubmit={sendOtp} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Phone Number</label>
                        <input 
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            placeholder="+91 99999 99999"
                        />
                    </div>
                    <div id="recaptcha-container"></div>
                    <button 
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Sending OTP..." : "Get Started"}
                    </button>
                </form>
            ) : (
                <form onSubmit={verifyOtp} className="space-y-6">
                    <div className="text-center mb-6">
                        <p className="text-slate-400 text-sm">Enter the code sent to <br/><span className="text-white font-medium">{phone}</span></p>
                    </div>
                    <div className="space-y-2">
                        <input 
                            value={otp}
                            onChange={e => setOtp(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-center text-3xl tracking-[0.5em] text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            placeholder="------"
                            maxLength={6}
                        />
                    </div>
                    <button 
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                        {loading ? "Verifying..." : "Verify & Login"}
                    </button>
                    <button 
                        type="button"
                        onClick={() => setStep('PHONE')}
                        className="w-full text-sm text-slate-400 hover:text-white transition-colors"
                    >
                        Change Phone Number
                    </button>
                </form>
            )}
        </div>
      </div>
    </div>
  );
}

/**
 * ------------------------------------------------------------------
 * COMPONENT: MAIN INTERFACE
 * ------------------------------------------------------------------
 */
function MainInterface({ user }) {
  const [activeChat, setActiveChat] = useState(null);
  const [chatsList, setChatsList] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [contacts, setContacts] = useState({});
  
  // UI States
  const [showNewChat, setShowNewChat] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  
  const [sidebarSearch, setSidebarSearch] = useState('');
  const menuRef = useRef(null);

  const myPhone = user.phoneNumber.replace(/\s/g, '');

  useEffect(() => {
    const contactsRef = collection(db, 'artifacts', APP_ID, 'users', myPhone, 'saved_contacts');
    const unsubscribe = onSnapshot(contactsRef, (snapshot) => {
        const newContacts = {};
        snapshot.docs.forEach(doc => { newContacts[doc.id] = doc.data().name; });
        setContacts(newContacts);
    });
    return () => unsubscribe();
  }, [myPhone]);

  useEffect(() => {
    const usersRef = collection(db, 'artifacts', APP_ID, 'users');
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
        const users = snapshot.docs.map(d => d.data()).filter(u => u.phoneNumber !== myPhone);
        setChatsList(users);
        setFilteredChats(users); 
    });
    return () => unsubscribe();
  }, [myPhone]);

  useEffect(() => {
      const handleClickOutside = (event) => {
          if (menuRef.current && !menuRef.current.contains(event.target)) {
              setShowMenu(false);
          }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSidebarSearch = (e) => {
      const term = e.target.value.toLowerCase();
      setSidebarSearch(term);
      if (term === '') { setFilteredChats(chatsList); } 
      else {
          setFilteredChats(chatsList.filter(u => {
             const name = contacts[u.phoneNumber] || '';
             return u.phoneNumber.includes(term) || name.toLowerCase().includes(term);
          }));
      }
  };

  const startDirectChat = () => {
      const phone = sidebarSearch.replace(/\s/g, '');
      if (phone.length < 5) return;
      setActiveChat({ phoneNumber: phone, isNew: true });
      setSidebarSearch('');
      setFilteredChats(chatsList);
  };

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-[#0f172a]">
      
      {/* --- LEFT SIDEBAR --- */}
      <div className={`w-full md:w-[400px] bg-slate-900 border-r border-slate-700 flex flex-col h-full ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Header */}
        <div className="h-[70px] bg-slate-800 flex items-center justify-between px-4 md:px-6 shrink-0 border-b border-slate-700 relative">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center overflow-hidden shadow-lg shadow-blue-500/20">
               <User className="text-white" size={20} />
             </div>
             <span className="font-bold text-white tracking-wide text-lg">SecureChat</span>
           </div>
           
           <div className="flex gap-2 text-slate-400 relative" ref={menuRef}>
             <button title="New Chat" onClick={() => setShowNewChat(true)} className="hover:text-blue-400 transition-colors p-2 rounded-full hover:bg-slate-700">
                 <MessageCircle size={22} />
             </button>
             <button title="Menu" onClick={() => setShowMenu(!showMenu)} className={`hover:text-white transition-colors p-2 rounded-full hover:bg-slate-700 ${showMenu ? 'text-white bg-slate-700' : ''}`}>
                 <MoreVertical size={22} />
             </button>

             {/* DROPDOWN MENU */}
             {showMenu && (
                 <div className="absolute right-0 top-12 w-48 bg-slate-800 rounded-xl shadow-2xl border border-slate-600 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                     <button onClick={() => { setShowNewChat(true); setShowMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-3">
                         <MessageCircle size={16} /> New Chat
                     </button>
                     <button onClick={() => { setShowSettings(true); setShowMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-3">
                         <Settings size={16} /> Settings
                     </button>
                     <button onClick={() => { setShowAbout(true); setShowMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-3">
                         <Info size={16} /> About Developer
                     </button>
                     <div className="h-px bg-slate-700 my-1"></div>
                     <button onClick={() => signOut(auth)} className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-900/20 flex items-center gap-3">
                         <LogOut size={16} /> Logout
                     </button>
                 </div>
             )}
           </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 shrink-0">
           <div className="bg-slate-800 rounded-xl flex items-center px-4 py-3 border border-slate-700 focus-within:border-blue-500 transition-colors">
              <Search size={18} className="text-slate-400 mr-3"/>
              <input 
                value={sidebarSearch}
                onChange={handleSidebarSearch}
                placeholder="Search..." 
                className="bg-transparent text-base w-full outline-none text-white placeholder-slate-500" 
              />
           </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-safe">
          {filteredChats.length === 0 && (
             <div className="mt-8 text-center text-slate-500 text-sm flex flex-col items-center px-4">
                <span className="mb-2">No users found.</span>
                {sidebarSearch.length > 5 && (
                    <button onClick={startDirectChat} className="mt-4 w-full text-blue-400 text-sm border border-blue-500/30 bg-blue-500/10 px-4 py-3 rounded-lg hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center gap-2">
                        <MessageCircle size={16} />
                        Chat with {sidebarSearch}
                    </button>
                )}
             </div>
          )}
          {filteredChats.map(u => (
            <div 
                key={u.uid || u.phoneNumber} 
                onClick={() => setActiveChat(u)} 
                className={`flex items-center gap-4 p-4 mb-2 rounded-xl cursor-pointer active:scale-[0.98] transition-all ${activeChat?.phoneNumber === u.phoneNumber ? 'bg-slate-800 border-l-4 border-blue-500' : 'border-l-4 border-transparent hover:bg-slate-800/50'}`}
            >
               <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden shrink-0 text-slate-300 font-bold border border-slate-600">
                 {contacts[u.phoneNumber] ? contacts[u.phoneNumber][0].toUpperCase() : u.phoneNumber.slice(-2)}
               </div>
               <div className="flex-1 min-w-0">
                 <div className="flex justify-between items-center mb-1">
                   <h4 className="text-white font-medium truncate text-base">
                       {contacts[u.phoneNumber] || u.phoneNumber}
                   </h4>
                   <span className="text-xs text-slate-500">Online</span>
                 </div>
                 <p className="text-sm text-slate-400 truncate flex items-center gap-1">
                   <Lock size={12} className="text-blue-500/50" /> Encrypted message
                 </p>
               </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- RIGHT CHAT AREA --- */}
      <div className={`flex-1 flex-col bg-slate-900 h-full relative ${!activeChat ? 'hidden md:flex' : 'flex'} w-full`}>
        {activeChat ? (
            <ChatWindow 
               currentUser={user} 
               chatPartner={activeChat} 
               contacts={contacts}
               onBack={() => setActiveChat(null)} 
            />
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center border-l border-slate-800 relative overflow-hidden bg-slate-900">
               <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'radial-gradient(blue 1px, transparent 0)', backgroundSize: '40px 40px'}}></div>
               <div className="text-center text-slate-400 max-w-[500px] relative z-10 p-8">
                  <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/20 ring-1 ring-blue-500/30">
                      <Shield size={40} className="text-blue-500"/>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">SecureChat Web</h1>
                  <p className="text-sm leading-relaxed mb-6 text-slate-400">
                     Select a chat on the left to start messaging. <br/>Your conversations are secure.
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-full text-xs text-blue-400 font-medium border border-slate-700">
                     <Lock size={12}/> End-to-end Encrypted
                  </div>
               </div>
            </div>
        )}
      </div>

      {/* --- MODALS --- */}
      {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} onSelect={(u) => { setActiveChat(u); setShowNewChat(false); }} myPhone={myPhone} contacts={contacts} />}
      
      {showSettings && (
          <div className="absolute inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowSettings(false)}>
              <div className="bg-slate-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-slate-700 animate-in fade-in zoom-in" onClick={e => e.stopPropagation()}>
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Settings className="text-blue-500"/> Settings</h2>
                  <div className="space-y-4">
                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                          <label className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Your Phone Number</label>
                          <div className="text-white font-mono text-lg">{myPhone}</div>
                      </div>
                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                          <label className="text-xs text-slate-500 uppercase tracking-wider block mb-1">App Version</label>
                          <div className="text-white">v1.0.0 (Secure Build)</div>
                      </div>
                  </div>
                  <button onClick={() => setShowSettings(false)} className="mt-6 w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-bold transition-colors">Close</button>
              </div>
          </div>
      )}

      {showAbout && (
          <div className="absolute inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAbout(false)}>
              <div className="bg-slate-800 w-full max-w-sm rounded-2xl p-8 shadow-2xl border border-slate-700 animate-in fade-in zoom-in text-center" onClick={e => e.stopPropagation()}>
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
                      <Shield className="w-8 h-8 text-white"/>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-1">SecureChat</h2>
                  <p className="text-slate-400 text-sm mb-6">Designed for privacy. Built for speed.</p>
                  
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 mb-6">
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Developed By</p>
                      <h3 className="text-lg font-bold text-white">Priyanshu Tiwari</h3>
                      <div className="flex justify-center gap-4 mt-4">
                          <a href="#" className="text-slate-400 hover:text-white transition-colors"><Github size={20}/></a>
                          <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors"><Linkedin size={20}/></a>
                      </div>
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                      Made with <Heart size={12} className="text-red-500 fill-red-500"/> in React & Firebase
                  </div>
                  <button onClick={() => setShowAbout(false)} className="mt-6 w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold transition-colors">Awesome!</button>
              </div>
          </div>
      )}
    </div>
  );
}

/**
 * ------------------------------------------------------------------
 * COMPONENT: ACTIVE CHAT WINDOW
 * ------------------------------------------------------------------
 */
function ChatWindow({ currentUser, chatPartner, contacts, onBack }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [editName, setEditName] = useState('');

    const scrollRef = useRef(null);
    const fileInputRef = useRef(null);

    const myPhone = currentUser.phoneNumber.replace(/\s/g, '');
    
    let chatId, displayName;
    
    if (chatPartner.isRoom) {
        chatId = `secret_room_${chatPartner.roomId}`;
        displayName = chatPartner.phoneNumber; 
    } else {
        const theirPhone = chatPartner.phoneNumber.replace(/\s/g, '');
        chatId = [myPhone, theirPhone].sort().join('_');
        displayName = contacts[theirPhone] || chatPartner.phoneNumber;
    }

    useEffect(() => {
        const msgsRef = collection(db, 'artifacts', APP_ID, 'chats', chatId, 'messages');
        const q = query(msgsRef, orderBy('createdAt', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setMessages(snapshot.docs.map(d => ({id: d.id, ...d.data()})));
            setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'auto' }), 100);
        });
        return () => unsubscribe();
    }, [chatId]);

    const sendMessage = async (e) => {
        e?.preventDefault();
        if(!input.trim()) return;
        const text = input;
        setInput('');

        await addDoc(collection(db, 'artifacts', APP_ID, 'chats', chatId, 'messages'), {
            text,
            type: 'text',
            senderPhone: myPhone,
            createdAt: serverTimestamp()
        });

        if (!chatPartner.isRoom && chatPartner.isNew) {
             const theirPhone = chatPartner.phoneNumber.replace(/\s/g, '');
             await setDoc(doc(db, 'artifacts', APP_ID, 'users', theirPhone), {
                 phoneNumber: theirPhone,
             }, { merge: true });
        }
    };

    const deleteMessage = async (msgId) => {
        if(!confirm("Delete this message?")) return;
        try {
            await deleteDoc(doc(db, 'artifacts', APP_ID, 'chats', chatId, 'messages', msgId));
        } catch(err) {
            console.error(err);
        }
    }

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 500 * 1024) {
            alert("Image too large (Max 500KB)");
            return;
        }
        const reader = new FileReader();
        setSending(true);
        reader.onload = async (event) => {
            try {
                await addDoc(collection(db, 'artifacts', APP_ID, 'chats', chatId, 'messages'), {
                    image: event.target.result,
                    type: 'image',
                    senderPhone: myPhone,
                    createdAt: serverTimestamp()
                });
            } catch (err) { console.error(err); }
            setSending(false);
        };
        reader.readAsDataURL(file);
    };

    const handleSaveContact = async () => {
        if (!editName.trim()) return;
        const targetPhone = chatPartner.phoneNumber.replace(/\s/g, '');
        await setDoc(doc(db, 'artifacts', APP_ID, 'users', myPhone, 'saved_contacts', targetPhone), {
            name: editName
        });
        setIsEditingName(false);
    };

    return (
        <div className="flex-1 flex flex-col bg-slate-900 h-full relative w-full">
            {/* Header */}
            <div className="h-[70px] bg-slate-800 flex items-center px-4 md:px-6 justify-between z-20 shadow-lg border-b border-slate-700 shrink-0">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button onClick={onBack} className="md:hidden text-slate-400 hover:text-white p-2 -ml-2 rounded-full active:bg-slate-700"><ArrowLeft /></button>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border shrink-0 ${chatPartner.isRoom ? 'bg-purple-600 border-purple-500' : 'bg-blue-600 border-blue-500'}`}>
                        {chatPartner.isRoom ? <Key className="text-white" size={20} /> : <User className="text-white" size={20} />}
                    </div>
                    
                    <div className="min-w-0 flex-1">
                        {isEditingName && !chatPartner.isRoom ? (
                            <div className="flex items-center gap-2">
                                <input 
                                    autoFocus
                                    className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-sm outline-none focus:border-blue-500 w-full"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    placeholder="Name"
                                />
                                <button onClick={handleSaveContact} className="text-blue-400 p-1"><Save size={18}/></button>
                                <button onClick={() => setIsEditingName(false)} className="text-slate-400 p-1"><X size={18}/></button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => { if(!chatPartner.isRoom) { setEditName(displayName); setIsEditingName(true); } }}>
                                <h3 className="text-white font-bold text-base truncate">{displayName}</h3>
                                {!chatPartner.isRoom && <Edit2 size={14} className="text-slate-600 opacity-50" />}
                            </div>
                        )}
                        <p className="text-xs text-blue-400 flex items-center gap-1 truncate">
                            {chatPartner.isRoom ? 'Hidden Channel' : 'Secure Connection'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 z-10 relative custom-scrollbar bg-slate-900 pb-20">
                 {messages.map((msg) => {
                     const isMe = msg.senderPhone === myPhone;
                     return (
                         <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group animate-in fade-in slide-in-from-bottom-2`}>
                             <div className={`
                                max-w-[85%] rounded-2xl p-3 px-4 text-[15px] shadow-sm relative border
                                ${isMe 
                                    ? 'bg-blue-600 text-white rounded-tr-sm border-blue-500' 
                                    : 'bg-slate-800 text-slate-200 rounded-tl-sm border-slate-700'}
                             `}>
                                 {msg.type === 'image' ? (
                                    <img src={msg.image} alt="attachment" className="max-w-full h-auto rounded-lg" />
                                 ) : (
                                    <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                                 )}

                                 <div className={`text-[10px] mt-1 flex items-center justify-end gap-2 ${isMe ? 'text-blue-200' : 'text-slate-500'}`}>
                                    {msg.createdAt?.toDate().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12: true})}
                                    {isMe && <Check size={12} strokeWidth={3}/>}
                                    {isMe && (
                                        <button onClick={() => deleteMessage(msg.id)} className="text-white/40 hover:text-red-300">
                                            <Trash2 size={12} />
                                        </button>
                                    )}
                                 </div>
                             </div>
                         </div>
                     )
                 })}
                 <div ref={scrollRef}></div>
            </div>

            {/* Input Area */}
            <form onSubmit={sendMessage} className="bg-slate-800 p-3 flex items-center gap-2 z-20 shrink-0 border-t border-slate-700 pb-safe">
                <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileSelect}/>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 rounded-full bg-slate-700 text-slate-400 active:scale-95">
                    {sending ? <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div> : <Paperclip size={20} />}
                </button>

                <div className="flex-1 bg-slate-900 rounded-full flex items-center px-4 py-2 border border-slate-700 focus-within:border-blue-500 transition-colors">
                    <input 
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      className="flex-1 bg-transparent text-white outline-none text-base placeholder-slate-500"
                      placeholder="Message..."
                    />
                </div>
                <button type="submit" className={`p-3 rounded-full transition-all ${input.trim() ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-700 text-slate-500'}`}>
                    <Send size={20} className={input.trim() ? "translate-x-0.5" : ""} />
                </button>
            </form>
        </div>
    )
}

/**
 * ------------------------------------------------------------------
 * COMPONENT: NEW CHAT MODAL
 * ------------------------------------------------------------------
 */
function NewChatModal({ onClose, onSelect, myPhone, contacts }) {
    const [search, setSearch] = useState('+91');
    const [secretKey, setSecretKey] = useState('');
    const [activeTab, setActiveTab] = useState('PHONE'); 
    const [result, setResult] = useState(null);
    const [searching, setSearching] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (activeTab === 'KEY') {
            if (!secretKey.trim()) return;
            onSelect({ isRoom: true, roomId: secretKey.toLowerCase().replace(/\s/g, '-'), phoneNumber: `Secret Room: ${secretKey}` });
            return;
        }
        setSearching(true);
        setResult(null);
        const formattedSearch = search.replace(/\s/g, '');
        if(formattedSearch === myPhone) { setResult('SELF'); setSearching(false); return; }

        try {
            const userDoc = await getDoc(doc(db, 'artifacts', APP_ID, 'users', formattedSearch));
            if (userDoc.exists()) { setResult(userDoc.data()); } 
            else { setResult({ phoneNumber: formattedSearch, isNew: true }); }
        } catch (err) { console.error(err); }
        setSearching(false);
    }

    return (
        <div className="absolute inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-slate-800 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border border-slate-700 animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                <div className="bg-slate-900 p-4 flex items-center justify-between border-b border-slate-700">
                    <h2 className="font-bold text-lg text-white">New Chat</h2>
                    <button onClick={onClose} className="p-1 rounded-full bg-slate-800 text-slate-400"><X size={20}/></button>
                </div>
                <div className="flex border-b border-slate-700 bg-slate-800">
                    <button onClick={() => { setActiveTab('PHONE'); setResult(null); }} className={`flex-1 py-3 text-sm font-bold ${activeTab === 'PHONE' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-500'}`}>PHONE</button>
                    <button onClick={() => { setActiveTab('KEY'); setResult(null); }} className={`flex-1 py-3 text-sm font-bold ${activeTab === 'KEY' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-500'}`}>SECRET KEY</button>
                </div>
                <div className="p-6">
                    <form onSubmit={handleSearch} className="mb-4 space-y-4">
                        <div className="flex gap-2">
                             {activeTab === 'PHONE' ? (
                                 <input value={search} onChange={e => setSearch(e.target.value)} className="flex-1 bg-slate-900 rounded-lg p-3 text-white outline-none border border-slate-700 focus:border-blue-500" placeholder="+91..."/>
                             ) : (
                                 <input value={secretKey} onChange={e => setSecretKey(e.target.value)} className="flex-1 bg-slate-900 rounded-lg p-3 text-white outline-none border border-slate-700 focus:border-purple-500" placeholder="Room Key..."/>
                             )}
                             <button className="bg-blue-600 px-4 rounded-lg text-white"><Search size={20}/></button>
                        </div>
                    </form>
                    {activeTab === 'PHONE' && result && result !== 'SELF' && (
                        <div onClick={() => onSelect(result)} className="flex items-center gap-4 p-3 bg-slate-700/50 rounded-xl cursor-pointer border border-slate-600">
                             <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white"><User size={20}/></div>
                             <div>
                                 <div className="text-white font-bold">{contacts && contacts[result.phoneNumber] ? contacts[result.phoneNumber] : result.phoneNumber}</div>
                                 <div className="text-xs text-blue-400">{result.isNew ? "Invite User" : "Found"}</div>
                             </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}