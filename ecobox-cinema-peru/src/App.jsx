import React, { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { QrReader } from 'react-qr-reader';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, query, where, getDocs, addDoc } from 'firebase/firestore';

// ---------------------------
// Firebase init (v9 modular)
// ---------------------------
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

let app = null; let auth = null; let db = null;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.warn('Firebase init failed (check env).', e);
}

const mockMovies = [
  { id: 'm1', title: 'La comunidad verde', sessions: [{ id: 's1', time: '18:00', seats: 20 }, { id: 's2', time: '20:00', seats: 20 }] },
  { id: 'm2', title: 'Noche en el contenedor', sessions: [{ id: 's3', time: '19:30', seats: 15 }] }
];
const mockSnacks = [{ id: 'sn1', name: 'Popcorn', price: 2.5 }, { id: 'sn2', name: 'Bebida', price: 1.8 }];

export default function App(){
  const [route, setRoute] = useState('home');
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [snackCart, setSnackCart] = useState([]);
  const [events, setEvents] = useState([]);
  const [scanResult, setScanResult] = useState(null);

  useEffect(()=>{
    if (auth) {
      signInAnonymously(auth).catch(console.error);
      onAuthStateChanged(auth, u=>setUser(u));
    }
  },[]);

  async function confirmBooking(name,email){
    if (!name || cart.length===0) return alert('Nombre y asientos son obligatorios');
    const bookingId = 'b' + Date.now();
    const booking = { id: bookingId, name, email, seats: cart.length, items: cart, createdAt: new Date().toISOString(), used: [] };

    try {
      if (db) {
        await setDoc(doc(db, 'bookings', bookingId), booking);
        for (let i=0;i<cart.length;i++){
          const ticketId = `${bookingId}-A${i+1}`;
          await setDoc(doc(db, 'tickets', ticketId), { ticketId, bookingId, index: i+1, movieId: cart[i].movieId, sessionId: cart[i].sessionId, name, used: false });
        }
      }
    } catch(e){ console.warn('Firestore write failed', e); }

    const booked = { ...booking, qrData: cart.map((it,idx)=>({ ticketId: `${bookingId}-A${idx+1}`, movieId: it.movieId, sessionId: it.sessionId })) };
    setBookings(b => [booked, ...b]);
    setCart([]);
    setRoute('bookings');
  }

  async function handleScan(qrText){
    if(!qrText) return;
    setScanResult(qrText);
    let ticketId = null;
    const ticketMatch = qrText.match(/Ticket:([^|]+)/);
    if(ticketMatch) ticketId = ticketMatch[1];

    if(!ticketId) return alert('Formato de QR no reconocido');

    try{
      if(db){
        const tdoc = await getDoc(doc(db, 'tickets', ticketId));
        if(!tdoc.exists()) return alert('Ticket no existente');
        const tdata = tdoc.data();
        if(tdata.used) return alert('Ticket ya usado');
        await updateDoc(doc(db,'tickets',ticketId), { used: true, usedAt: new Date().toISOString() });
        alert('Entrada válida — marcado como usado');
      } else {
        alert('Firebase no configurado: escaneo solo en modo demo');
      }
    } catch(e){ console.error(e); alert('Error validando ticket: '+e.message); }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-teal-600 text-white p-4">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold">Ecobox Cinema Peru</h1>
          <nav className="space-x-3">
            <button onClick={()=>setRoute('home')} className={`px-3 py-1 rounded ${route==='home'?'bg-teal-800':'bg-teal-500/40'}`}>Inicio</button>
            <button onClick={()=>setRoute('cartelera')} className={`px-3 py-1 rounded ${route==='cartelera'?'bg-teal-800':'bg-teal-500/40'}`}>Cartelera</button>
            <button onClick={()=>setRoute('snacks')} className={`px-3 py-1 rounded ${route==='snacks'?'bg-teal-800':'bg-teal-500/40'}`}>Snacks</button>
            <button onClick={()=>setRoute('events')} className={`px-3 py-1 rounded ${route==='events'?'bg-teal-800':'bg-teal-500/40'}`}>Eventos</button>
            <button onClick={()=>setRoute('dashboard')} className={`px-3 py-1 rounded ${route==='dashboard'?'bg-teal-800':'bg-teal-500/40'}`}>Dashboard</button>
            <button onClick={()=>setRoute('scanner')} className={`px-3 py-1 rounded ${route==='scanner'?'bg-teal-800':'bg-teal-500/40'}`}>Escáner</button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto p-6">
        {route==='cartelera' && (
          <section>
            <h2 className="text-2xl font-bold mb-4">Cartelera</h2>
            <div className="space-y-4">
              {mockMovies.map(m=> (
                <article key={m.id} className="bg-white p-4 rounded shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold">{m.title}</div>
                      <div className="text-sm text-gray-500">{m.sessions.length} sesiones</div>
                    </div>
                    <div className="space-y-2">
                      {m.sessions.map(s=> (
                        <div key={s.id} className="flex items-center space-x-2">
                          <div className="text-sm">{s.time}</div>
                          <button onClick={()=>setCart(c=>[...c,{ movieId: m.id, sessionId: s.id }])} className="px-2 py-1 rounded bg-teal-600 text-white text-sm">Reservar</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {route==='reservas' && (
          <section>
            <h2 className="text-2xl font-bold mb-4">Finalizar Reserva</h2>
            <div className="bg-white p-4 rounded shadow max-w-xl">
              <input id="name" placeholder="Tu nombre" className="w-full mb-2 p-2 border rounded" />
              <input id="email" placeholder="Tu email" className="w-full mb-2 p-2 border rounded" />
              <div>Asientos: {cart.length}</div>
              <ul>{cart.map((c,i)=> <li key={i}>{c.movieId} — {c.sessionId}</li>)}</ul>
              <div className="mt-2 flex space-x-2">
                <button onClick={()=>{const name=document.getElementById('name').value; const email=document.getElementById('email').value; confirmBooking(name,email);}} className="px-3 py-1 bg-teal-600 text-white rounded">Confirmar</button>
                <button onClick={()=>setCart([])} className="px-3 py-1 bg-gray-200 rounded">Cancelar</button>
              </div>
            </div>
          </section>
        )}

        {route==='bookings' && (
          <section>
            <h2 className="text-2xl font-bold mb-4">Reservas</h2>
            <div className="space-y-3">
              {bookings.length===0 && <div className="bg-white p-3 rounded shadow">No tienes reservas (local demo).</div>}
              {bookings.map(b=> (
                <div key={b.id} className="bg-white p-3 rounded shadow">
                  <div className="flex justify-between items-center"><div className="font-semibold">{b.name}</div><div className="text-xs text-gray-500">{b.createdAt}</div></div>
                  <div className="mt-2">Asientos: {b.seats}</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-3">
                    {b.qrData.map((q,idx)=>{
                      const movie = mockMovies.find(m=>m.id===q.movieId);
                      const session = movie?.sessions.find(s=>s.id===q.sessionId);
                      const qrValue = `Ticket:${q.ticketId}|Pelicula:${movie?.title}|Hora:${session?.time}|Nombre:${b.name}`;
                      return (
                        <div key={idx} className="flex flex-col items-center bg-gray-50 p-2 rounded">
                          <QRCodeCanvas value={qrValue} size={110} level="H" includeMargin={true} />
                          <div className="text-xs mt-1">Asiento {q.ticketId.split('-A')[1]}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {route==='snacks' && (
          <section>
            <h2 className="text-2xl font-bold mb-4">Snacks</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {mockSnacks.map(s=> (
                <div key={s.id} className="bg-white p-4 rounded shadow">
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-sm">${s.price}</div>
                  <button onClick={()=>setSnackCart(c=>[...c,s])} className="mt-2 px-2 py-1 bg-teal-600 text-white rounded">Agregar</button>
                </div>
              ))}
            </div>
            <div className="mt-4 bg-white p-4 rounded shadow max-w-md">
              <h4 className="font-semibold">Carrito ({snackCart.length})</h4>
              <ul>{snackCart.map((s,i)=> <li key={i}>{s.name} - ${s.price}</li>)}</ul>
              <div className="mt-2 flex space-x-2"><button onClick(()=>alert('En producción -> redirigir al backend Stripe')} className="px-3 py-1 bg-teal-600 text-white rounded">Pagar snacks</button><button onClick={()=>setSnackCart([])} className="px-3 py-1 bg-gray-200 rounded">Vaciar</button></div>
            </div>
          </section>
        )}

        {route==='events' && (
          <section>
            <h2 className="text-2xl font-bold mb-4">Eventos / Aula móvil</h2>
            <EventCreator onCreate={ev=>{ setEvents(es=>[ev,...es]); if(db) addDoc(collection(db,'events'), ev); }} />
            <div className="mt-4 bg-white p-4 rounded shadow">
              <h3 className="font-semibold">Próximos</h3>
              <ul>{events.map(e=> <li key={e.title}>{e.title} — {e.date}</li>)}</ul>
            </div>
          </section>
        )}

        {route==='dashboard' && (
          <section>
            <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded shadow">
                <div>Producción solar (demo)</div>
                <div className="text-3xl font-bold mt-2">12.4 kWh</div>
              </div>
              <div className="bg-white p-4 rounded shadow">
                <div>Ahorro CO₂ (demo)</div>
                <div className="text-3xl font-bold mt-2">4.8 kg</div>
              </div>
            </div>
          </section>
        )}

        {route==='scanner' && (
          <section>
            <h2 className="text-2xl font-bold mb-4">Escáner QR</h2>
            <div className="bg-white p-4 rounded shadow max-w-md mx-auto">
              <p className="text-sm text-gray-600">Apunta la cámara al código QR del ticket.</p>
              <div className="mt-3 border rounded overflow-hidden">
                <QrReader
                  onResult={(result, error) => {
                    if (!!result) {
                      handleScan(result?.text);
                    }
                    if (!!error) {
                      // ignore continuous errors
                    }
                  }}
                  constraints={{ facingMode: 'environment' }}
                  style={{ width: '100%' }}
                />
              </div>
              <div className="mt-3 text-sm text-gray-500">Último escaneo: {scanResult || '—'}</div>
            </div>
          </section>
        )}

        {route==='home' && (
          <section>
            <h2 className="text-2xl font-bold mb-2">Bienvenido</h2>
            <p>Reserva, pide snacks y valida entradas con QR.</p>
            <div className="mt-4">
              <button onClick={()=>setRoute('cartelera')} className="px-3 py-1 bg-teal-600 text-white rounded">Ver cartelera</button>
              <button onClick={()=>setRoute('snacks')} className="ml-2 px-3 py-1 bg-teal-600 text-white rounded">Snacks</button>
            </div>
          </section>
        )}

      </main>

      <footer className="bg-gray-100 p-4 text-center text-sm">Ecobox Cinema Peru • Prototipo</footer>
    </div>
  );
}

function EventCreator({ onCreate }){
  const [title,setTitle]=useState(''); const [date,setDate]=useState(''); const [cap,setCap]=useState(20);
  return (
    <div className="bg-white p-4 rounded shadow">
      <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Título" className="w-full mb-2 p-2 border rounded" />
      <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full mb-2 p-2 border rounded" />
      <input type="number" value={cap} onChange={e=>setCap(+e.target.value)} className="w-full mb-2 p-2 border rounded" />
      <div className="flex space-x-2"><button onClick={()=>{ if(!title||!date) return alert('Obligatorio'); onCreate({ title, date, capacity: cap }); setTitle(''); setDate(''); setCap(20); }} className="px-3 py-1 bg-teal-600 text-white rounded">Crear</button></div>
    </div>
  );
}
