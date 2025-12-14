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
  Search, ArrowLeft, MoreVertical, Check, Paperclip, Smile, Mic, Shield, Key, Lock, Image as ImageIcon, X, Edit2, Save, Trash2
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
    // Dynamic Favicon
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
        // Ensure current user exists in DB
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
    <div className="h-[100dvh] w-screen flex flex-col items-center justify-center" style={{backgroundColor: THEME.bg}}>
       <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
       <div className="mt-8 text-blue-500 font-bold tracking-widest text-sm">SECURE CHAT</div>
    </div>
  );

  return (
    <div className="h-[100dvh] font-sans overflow-hidden" style={{backgroundColor: THEME.bg, color: THEME.text}}>
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
  const [confirmObj, setConfirmObj] = useState(null);

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
      const res = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
      setConfirmObj(res);
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
      await confirmObj.confirm(otp);
    } catch (err) {
      setError("Invalid Code");
    }
    setLoading(false);
  };

  return (
    <div className="relative min-h-[100dvh] flex flex-col" style={{backgroundColor: THEME.bg}}>
      <div className="w-full h-[150px] md:h-[220px] bg-blue-600 absolute top-0 z-0">
         <div className="max-w-[1000px] mx-auto p-4 md:p-8 flex items-center gap-3 text-white">
            <Shield className="w-6 h-6 md:w-8 md:h-8" />
            <span className="font-bold text-lg tracking-wide">SECURE CHAT</span>
         </div>
      </div>

      <div className="relative z-10 flex justify-center pt-8 md:pt-12 px-4 h-full flex-1">
        <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-[900px] h-[calc(100dvh-60px)] md:h-[70vh] flex flex-col md:flex-row overflow-hidden border border-slate-700">
           {/* Left Form Side */}
           <div className="flex-1 p-6 md:p-12 flex flex-col items-center justify-center bg-slate-800 text-white">
              <h1 className="text-2xl md:text-3xl font-light mb-2 text-white">
                {step === 'PHONE' ? 'Welcome Back' : 'Verify Identity'}
              </h1>
              <p className="text-slate-400 mb-8 text-sm text-center">
                {step === 'PHONE' ? 'Sign in to access your private messages.' : 'Enter the code sent to your device.'}
              </p>

              {error && <div className="text-red-400 mb-4 text-sm bg-red-900/20 p-2 w-full text-center rounded border border-red-900">{error}</div>}

              {step === 'PHONE' ? (
                <form onSubmit={sendOtp} className="w-full max-w-xs space-y-6">
                   <div>
                     <label className="block text-xs text-blue-400 font-bold mb-2 uppercase tracking-wider">Phone Number</label>
                     <input 
                       value={phone}
                       onChange={e => setPhone(e.target.value)}
                       className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-lg text-white focus:border-blue-500 focus:outline-none transition-colors"
                       placeholder="+91 83697 77252"
                     />
                   </div>
                   <div id="recaptcha-container"></div>
                   <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded shadow-lg shadow-blue-900/50 transition-all">
                     {loading ? "SENDING..." : "CONTINUE"}
                   </button>
                </form>
              ) : (
                <form onSubmit={verifyOtp} className="w-full max-w-xs space-y-6">
                   <div>
                     <label className="block text-xs text-blue-400 font-bold mb-2 uppercase tracking-wider">Security Code</label>
                     <input 
                       value={otp}
                       onChange={e => setOtp(e.target.value)}
                       className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-center text-3xl tracking-[0.5em] text-white focus:border-blue-500 focus:outline-none transition-colors"
                       placeholder="------"
                       maxLength={6}
                     />
                   </div>
                   <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded shadow-lg shadow-blue-900/50 transition-all">
                     {loading ? "UNLOCKING..." : "VERIFY"}
                   </button>
                   <button type="button" onClick={() => setStep('PHONE')} className="w-full text-blue-400 text-sm hover:underline">
                     Wrong Number?
                   </button>
                </form>
              )}
           </div>

           {/* Right Info Side (Desktop Only) */}
           <div className="hidden md:flex flex-1 bg-slate-900 items-center justify-center p-10 border-l border-slate-700 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px'}}></div>
              <div className="text-center space-y-6 relative z-10">
                  <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock size={40} className="text-blue-400"/>
                  </div>
                  <h3 className="font-bold text-xl text-white">Private & Secure</h3>
                  <p className="text-slate-400 text-sm max-w-[250px] mx-auto leading-relaxed">
                      Your messages are stored securely. Connect with friends using only your phone number.
                  </p>
              </div>
           </div>
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
  const [contacts, setContacts] = useState({}); // Stores saved names
  const [showNewChat, setShowNewChat] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');

  const myPhone = user.phoneNumber.replace(/\s/g, '');

  // 1. Listen for Saved Contacts (Naming feature)
  useEffect(() => {
    const contactsRef = collection(db, 'artifacts', APP_ID, 'users', myPhone, 'saved_contacts');
    const unsubscribe = onSnapshot(contactsRef, (snapshot) => {
        const newContacts = {};
        snapshot.docs.forEach(doc => {
            newContacts[doc.id] = doc.data().name;
        });
        setContacts(newContacts);
    });
    return () => unsubscribe();
  }, [myPhone]);

  // 2. List registered users
  useEffect(() => {
    const usersRef = collection(db, 'artifacts', APP_ID, 'users');
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
        const users = snapshot.docs
            .map(d => d.data())
            .filter(u => u.phoneNumber !== myPhone);
        setChatsList(users);
        setFilteredChats(users); 
    });
    return () => unsubscribe();
  }, [myPhone]);

  const handleSidebarSearch = (e) => {
      const term = e.target.value.toLowerCase();
      setSidebarSearch(term);
      // Filter by Phone OR Saved Name
      if (term === '') {
          setFilteredChats(chatsList);
      } else {
          setFilteredChats(chatsList.filter(u => {
             const name = contacts[u.phoneNumber] || '';
             return u.phoneNumber.includes(term) || name.toLowerCase().includes(term);
          }));
      }
  };

  const startDirectChat = () => {
      const phone = sidebarSearch.replace(/\s/g, '');
      if (phone.length < 5) return;
      setActiveChat({
          phoneNumber: phone,
          isNew: true
      });
      setSidebarSearch('');
      setFilteredChats(chatsList);
  };

  return (
    <div className="flex h-[100dvh] max-w-[1700px] mx-auto shadow-2xl overflow-hidden relative border border-slate-700" style={{backgroundColor: THEME.bg}}>
      
      {/* --- LEFT SIDEBAR --- */}
      <div className={`w-full md:w-[400px] bg-slate-900 border-r border-slate-700 flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Header */}
        <div className="h-[70px] bg-slate-800 flex items-center justify-between px-6 shrink-0 border-b border-slate-700">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center overflow-hidden cursor-pointer shadow-lg shadow-blue-500/20">
               <User className="text-white" size={20} />
             </div>
             <span className="font-bold text-white tracking-wide">SecureChat</span>
           </div>
           
           <div className="flex gap-4 text-slate-400">
             <button title="New Chat" onClick={() => setShowNewChat(true)} className="hover:text-blue-400 transition-colors">
                 <MessageCircle size={22} />
             </button>
             <button title="Logout" onClick={() => signOut(auth)} className="hover:text-red-400 transition-colors">
                 <LogOut size={22} />
             </button>
           </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 shrink-0">
           <div className="bg-slate-800 rounded-lg flex items-center px-4 py-3 border border-slate-700 focus-within:border-blue-500 transition-colors">
              <Search size={18} className="text-slate-400 mr-3"/>
              <input 
                value={sidebarSearch}
                onChange={handleSidebarSearch}
                placeholder="Search name or number..." 
                className="bg-transparent text-sm w-full outline-none text-white placeholder-slate-500" 
              />
           </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-2">
          {filteredChats.length === 0 && (
             <div className="mt-8 text-center text-slate-500 text-sm flex flex-col items-center px-4">
                <span className="mb-2">No users found.</span>
                {sidebarSearch.length > 5 && (
                    <button onClick={startDirectChat} className="mt-4 w-full text-blue-400 text-sm border border-blue-500/30 bg-blue-500/10 px-4 py-3 rounded-lg hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center gap-2">
                        <MessageCircle size={16} />
                        Start Chat with {sidebarSearch}
                    </button>
                )}
             </div>
          )}
          {filteredChats.map(u => (
            <div 
                key={u.uid || u.phoneNumber} 
                onClick={() => setActiveChat(u)} 
                className={`flex items-center gap-4 p-4 mb-1 rounded-xl cursor-pointer hover:bg-slate-800 transition-all ${activeChat?.phoneNumber === u.phoneNumber ? 'bg-slate-800 border-l-4 border-blue-500' : 'border-l-4 border-transparent'}`}
            >
               <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden shrink-0 text-slate-300 font-bold border border-slate-600">
                 {/* Show Initials if name exists, else last 2 digits */}
                 {contacts[u.phoneNumber] ? contacts[u.phoneNumber][0].toUpperCase() : u.phoneNumber.slice(-2)}
               </div>
               <div className="flex-1 min-w-0">
                 <div className="flex justify-between items-center mb-1">
                   <h4 className="text-white font-medium truncate text-base">
                       {/* Display Saved Name OR Phone Number */}
                       {contacts[u.phoneNumber] || u.phoneNumber}
                   </h4>
                   <span className="text-xs text-slate-500">Online</span>
                 </div>
                 <p className="text-sm text-slate-400 truncate flex items-center gap-1">
                   <Lock size={10} /> Encrypted message
                 </p>
               </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- RIGHT CHAT AREA --- */}
      <div className={`flex-1 flex-col bg-slate-900 h-full relative ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
        {activeChat ? (
            <ChatWindow 
               currentUser={user} 
               chatPartner={activeChat} 
               contacts={contacts}
               onBack={() => setActiveChat(null)} 
            />
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center border-l border-slate-800 relative overflow-hidden">
               <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'radial-gradient(blue 1px, transparent 0)', backgroundSize: '40px 40px'}}></div>
               <div className="text-center text-slate-400 max-w-[500px] relative z-10 p-8">
                  <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/20">
                      <Shield size={40} className="text-white"/>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">SecureChat Web</h1>
                  <p className="text-sm leading-relaxed mb-6 text-slate-300">
                     Select a chat on the left or search for a number to start messaging.
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-full text-xs text-blue-400 font-medium border border-slate-700">
                     <Lock size={12}/> End-to-end Encrypted
                  </div>
               </div>
            </div>
        )}
      </div>

      {/* --- NEW CHAT MODAL --- */}
      {showNewChat && (
         <NewChatModal 
            onClose={() => setShowNewChat(false)} 
            onSelect={(u) => { setActiveChat(u); setShowNewChat(false); }}
            myPhone={myPhone} 
            contacts={contacts}
        />
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
    
    // Naming Feature States
    const [isEditingName, setIsEditingName] = useState(false);
    const [editName, setEditName] = useState('');

    const scrollRef = useRef(null);
    const fileInputRef = useRef(null);

    const myPhone = currentUser.phoneNumber.replace(/\s/g, '');
    
    // Determine IDs and Names
    let chatId, displayName;
    
    if (chatPartner.isRoom) {
        chatId = `secret_room_${chatPartner.roomId}`;
        displayName = chatPartner.phoneNumber; 
    } else {
        const theirPhone = chatPartner.phoneNumber.replace(/\s/g, '');
        chatId = [myPhone, theirPhone].sort().join('_');
        // Use Saved Contact Name OR Phone Number
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

        // 1. Send Message
        await addDoc(collection(db, 'artifacts', APP_ID, 'chats', chatId, 'messages'), {
            text,
            type: 'text',
            senderPhone: myPhone,
            createdAt: serverTimestamp()
        });

        // 2. PERSISTENCE FIX: Ensure the chat partner exists in the 'users' list
        // If this is a new number, create a placeholder so they appear in sidebar
        if (!chatPartner.isRoom && chatPartner.isNew) {
             const theirPhone = chatPartner.phoneNumber.replace(/\s/g, '');
             // Use update to avoid overwriting real user data if they just signed up
             await setDoc(doc(db, 'artifacts', APP_ID, 'users', theirPhone), {
                 phoneNumber: theirPhone,
                 // We don't have their UID yet, but we save the phone so it lists in sidebar
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
            alert("Please select an image smaller than 500KB");
            return;
        }
        const reader = new FileReader();
        setSending(true);
        reader.onload = async (event) => {
            const base64String = event.target.result;
            try {
                await addDoc(collection(db, 'artifacts', APP_ID, 'chats', chatId, 'messages'), {
                    image: base64String,
                    type: 'image',
                    senderPhone: myPhone,
                    createdAt: serverTimestamp()
                });
            } catch (err) { console.error(err); }
            setSending(false);
        };
        reader.readAsDataURL(file);
    };

    // Save Contact Logic
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
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="md:hidden text-slate-400 hover:text-white p-2 -ml-2"><ArrowLeft /></button>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border ${chatPartner.isRoom ? 'bg-purple-600 border-purple-500' : 'bg-blue-600 border-blue-500'}`}>
                        {chatPartner.isRoom ? <Key className="text-white" size={20} /> : <User className="text-white" size={20} />}
                    </div>
                    
                    {/* Editable Name Area */}
                    <div>
                        {isEditingName && !chatPartner.isRoom ? (
                            <div className="flex items-center gap-2">
                                <input 
                                    autoFocus
                                    className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-sm outline-none focus:border-blue-500"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    placeholder="Enter Name"
                                />
                                <button onClick={handleSaveContact} className="text-blue-400 hover:text-blue-300"><Save size={18}/></button>
                                <button onClick={() => setIsEditingName(false)} className="text-slate-400 hover:text-red-400"><X size={18}/></button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 group">
                                <h3 className="text-white font-bold text-base">{displayName}</h3>
                                {!chatPartner.isRoom && (
                                    <button 
                                        onClick={() => { setEditName(displayName); setIsEditingName(true); }}
                                        className="text-slate-600 group-hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100"
                                        title="Rename Contact"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                )}
                            </div>
                        )}
                        <p className="text-xs text-blue-400 flex items-center gap-1">
                            {chatPartner.isRoom ? 'Hidden Channel' : 'Secure Connection'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 md:px-[10%] space-y-2 z-10 relative custom-scrollbar bg-slate-900">
                 {messages.map((msg) => {
                     const isMe = msg.senderPhone === myPhone;
                     return (
                         <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} relative z-10 mb-4 group animate-in fade-in slide-in-from-bottom-2`}>
                             <div className={`
                                max-w-[85%] md:max-w-[65%] rounded-2xl p-3 px-4 text-[15px] shadow-md relative border
                                ${isMe 
                                    ? 'bg-blue-600 text-white rounded-tr-sm border-blue-500' 
                                    : 'bg-slate-800 text-slate-200 rounded-tl-sm border-slate-700'}
                             `}>
                                 {msg.type === 'image' ? (
                                    <div className="mb-1 rounded-lg overflow-hidden">
                                        <img src={msg.image} alt="attachment" className="max-w-full h-auto" />
                                    </div>
                                 ) : (
                                    <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                                 )}

                                 <div className={`text-[10px] mt-1 flex items-center justify-end gap-2 ${isMe ? 'text-blue-200' : 'text-slate-500'}`}>
                                    {msg.createdAt?.toDate().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12: true})}
                                    {isMe && <Check size={12} strokeWidth={3}/>}
                                    
                                    {/* DELETE BUTTON */}
                                    {isMe && (
                                        <button 
                                            onClick={() => deleteMessage(msg.id)} 
                                            className="ml-2 text-white/50 hover:text-red-300 transition-colors"
                                            title="Delete Message"
                                        >
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
            <form onSubmit={sendMessage} className="bg-slate-800 px-4 py-4 flex items-center gap-3 z-20 shrink-0 border-t border-slate-700">
                <input 
                    type="file" 
                    accept="image/*" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileSelect}
                />
                <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-full hover:bg-slate-700 text-slate-400 hover:text-blue-400 transition-colors"
                >
                    {sending ? <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div> : <Paperclip size={22} />}
                </button>

                <div className="flex-1 bg-slate-900 rounded-xl flex items-center py-3 px-4 mx-2 border border-slate-700 focus-within:border-blue-500 transition-colors">
                    <input 
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      className="flex-1 bg-transparent text-white outline-none text-[15px] placeholder-slate-500"
                      placeholder="Type a secure message..."
                    />
                </div>
                <button type="submit" className={`p-3 rounded-full transition-all ${input.trim() ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-slate-700 text-slate-500'}`}>
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
            onSelect({
                isRoom: true,
                roomId: secretKey.toLowerCase().replace(/\s/g, '-'),
                phoneNumber: `Secret Room: ${secretKey}`
            });
            return;
        }

        setSearching(true);
        setResult(null);
        
        const formattedSearch = search.replace(/\s/g, '');
        if(formattedSearch === myPhone) {
            setResult('SELF'); 
            setSearching(false);
            return;
        }

        try {
            const userDoc = await getDoc(doc(db, 'artifacts', APP_ID, 'users', formattedSearch));
            if (userDoc.exists()) {
                setResult(userDoc.data());
            } else {
                setResult({ phoneNumber: formattedSearch, isNew: true });
            }
        } catch (err) { console.error(err); }
        setSearching(false);
    }

    return (
        <div className="absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-start justify-center pt-20" onClick={onClose}>
            <div className="bg-slate-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-slate-700 animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="bg-slate-900 p-5 flex items-center justify-between border-b border-slate-700">
                    <h2 className="font-bold text-lg text-white">New Connection</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"><X size={20}/></button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-700 bg-slate-800/50">
                    <button 
                        onClick={() => { setActiveTab('PHONE'); setResult(null); }}
                        className={`flex-1 py-4 text-sm font-bold transition-all ${activeTab === 'PHONE' ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-800' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        PHONE NUMBER
                    </button>
                    <button 
                        onClick={() => { setActiveTab('KEY'); setResult(null); }}
                        className={`flex-1 py-4 text-sm font-bold transition-all ${activeTab === 'KEY' ? 'text-purple-400 border-b-2 border-purple-400 bg-slate-800' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        SECRET KEY
                    </button>
                </div>

                <div className="p-6">
                    <form onSubmit={handleSearch} className="mb-4">
                        <label className="block text-xs text-slate-400 font-bold mb-3 uppercase tracking-wider">
                            {activeTab === 'PHONE' ? 'Enter Mobile Number' : 'Enter Shared Room Key'}
                        </label>
                        
                        <div className="flex gap-3">
                             {activeTab === 'PHONE' ? (
                                 <input value={search} onChange={e => setSearch(e.target.value)} 
                                    className="flex-1 bg-slate-900 rounded-xl p-3 text-white outline-none border border-slate-700 focus:border-blue-500 transition-colors" 
                                    placeholder="+91 91526 65022"
                                 />
                             ) : (
                                 <input value={secretKey} onChange={e => setSecretKey(e.target.value)} 
                                    className="flex-1 bg-slate-900 rounded-xl p-3 text-white outline-none border border-slate-700 focus:border-purple-500 transition-colors" 
                                    placeholder="e.g. project-alpha"
                                 />
                             )}
                             
                             <button className={`${activeTab === 'KEY' ? 'bg-purple-600 hover:bg-purple-500' : 'bg-blue-600 hover:bg-blue-500'} px-6 rounded-xl text-white font-bold transition-all shadow-lg`}>
                                 {activeTab === 'KEY' ? <ArrowLeft className="rotate-180" size={20}/> : (searching ? "..." : <Search size={20}/>)}
                             </button>
                        </div>
                    </form>
                    
                    {/* Results */}
                    {activeTab === 'PHONE' && result === 'SELF' && <div className="text-red-400 text-sm text-center bg-red-900/10 p-2 rounded">You cannot chat with yourself.</div>}
                    
                    {activeTab === 'PHONE' && result && result !== 'SELF' && (
                        <div onClick={() => onSelect(result)} className="flex items-center gap-4 p-4 hover:bg-slate-700 cursor-pointer rounded-xl bg-slate-750 border border-slate-700 transition-all group">
                             <div className="w-12 h-12 rounded-full bg-slate-600 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                 <User size={24}/>
                             </div>
                             <div>
                                 <div className="text-white font-bold text-lg">
                                     {contacts && contacts[result.phoneNumber] ? contacts[result.phoneNumber] : result.phoneNumber}
                                 </div>
                                 <div className="text-xs text-blue-400">
                                    {result.isNew ? "Not registered yet (Invite)" : "Verified User"}
                                 </div>
                             </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}