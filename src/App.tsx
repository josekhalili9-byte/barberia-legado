import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Scissors, MapPin, Phone, Clock, Calendar, User, Star, ChevronRight, Lock, X, Plus, Trash2, Menu, Sun, Moon, Check, CalendarPlus, Save, LogOut } from 'lucide-react';
import { collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc, query, orderBy, getDocs } from 'firebase/firestore';
import { db, auth, loginWithGoogle, logout } from './firebase';

// --- Initial Data ---
const initialServices = [
  { id: 1, name: 'Corte de Cabello', description: 'Corte clásico o moderno con asesoría de imagen.', price: 350 },
  { id: 2, name: 'Corte + Barba', description: 'El servicio completo para un look impecable.', price: 550 },
  { id: 3, name: 'Arreglo de Barba', description: 'Perfilado, recorte y ritual de toalla caliente.', price: 250 },
  { id: 4, name: 'Estilo Personalizado', description: 'Diseño de imagen, mascarilla y peinado premium.', price: 700 },
];

const initialGallery = [
  'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&q=80&w=600&h=400',
  'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=600&h=400',
  'https://images.unsplash.com/photo-1593702275687-f8b402bf1fb5?auto=format&fit=crop&q=80&w=600&h=400',
  'https://images.unsplash.com/photo-1587515053748-0e3658215985?auto=format&fit=crop&q=80&w=600&h=400',
  'https://images.unsplash.com/photo-1534294228306-bd54eb9a7ba8?auto=format&fit=crop&q=80&w=600&h=400',
  'https://images.unsplash.com/photo-1599839619722-39751411ea63?auto=format&fit=crop&q=80&w=600&h=400',
];

const initialReviews = [
  { id: 1, name: 'Carlos M.', rating: 5, comment: 'Excelente servicio, el corte quedó perfecto y la atención de primera.', date: '2026-03-10' },
  { id: 2, name: 'Alejandro G.', rating: 5, comment: 'El arreglo de barba es un ritual increíble. Muy recomendado el lugar.', date: '2026-03-12' },
  { id: 3, name: 'Fernando R.', rating: 4, comment: 'Muy buen ambiente y música. Me gustó mucho el resultado.', date: '2026-03-15' },
];

// --- Animation Variants ---
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
};

export default function App() {
  // --- State ---
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [services, setServices] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Admin State
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [adminTab, setAdminTab] = useState('citas'); // citas, servicios, galeria, reseñas
  const [adminMessage, setAdminMessage] = useState('');

  // Reservation Form State
  const [resName, setResName] = useState('');
  const [resService, setResService] = useState('');
  const [resDate, setResDate] = useState('');
  const [resTime, setResTime] = useState('');
  const [resSuccess, setResSuccess] = useState(false);
  const [resError, setResError] = useState('');
  const [confirmedAppt, setConfirmedAppt] = useState<{name: string, service: string, date: string, time: string} | null>(null);

  // Review Form State
  const [revName, setRevName] = useState('');
  const [revRating, setRevRating] = useState(5);
  const [revComment, setRevComment] = useState('');
  const [revSuccess, setRevSuccess] = useState(false);
  const [revError, setRevError] = useState('');

  // File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Effects ---
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user && user.email === 'josekhalili9@gmail.com') {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    });

    const unsubServices = onSnapshot(query(collection(db, 'services'), orderBy('order')), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setServices(data.length > 0 ? data : initialServices);
    });
    const unsubGallery = onSnapshot(query(collection(db, 'gallery'), orderBy('createdAt', 'desc')), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, url: doc.data().url }));
      setGallery(data.length > 0 ? data : initialGallery.map((url, i) => ({ id: i.toString(), url })));
    });
    const unsubReviews = onSnapshot(query(collection(db, 'reviews'), orderBy('createdAt', 'desc')), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReviews(data.length > 0 ? data : initialReviews);
    });

    return () => {
      unsubscribeAuth();
      unsubServices();
      unsubGallery();
      unsubReviews();
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const unsubAppointments = onSnapshot(query(collection(db, 'appointments'), orderBy('createdAt', 'desc')), (snapshot) => {
        setAppointments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return unsubAppointments;
    } else {
      setAppointments([]);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- Handlers ---
  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const seedDatabase = async () => {
    try {
      const servicesSnap = await getDocs(collection(db, 'services'));
      if (servicesSnap.empty) {
        for (let i = 0; i < initialServices.length; i++) {
          await addDoc(collection(db, 'services'), { ...initialServices[i], order: i });
        }
      }
      const gallerySnap = await getDocs(collection(db, 'gallery'));
      if (gallerySnap.empty) {
        for (let i = 0; i < initialGallery.length; i++) {
          await addDoc(collection(db, 'gallery'), { url: initialGallery[i], createdAt: Date.now() - i });
        }
      }
      const reviewsSnap = await getDocs(collection(db, 'reviews'));
      if (reviewsSnap.empty) {
        for (let i = 0; i < initialReviews.length; i++) {
          await addDoc(collection(db, 'reviews'), { ...initialReviews[i], createdAt: Date.now() - i });
        }
      }
      setAdminMessage('Base de datos inicializada.');
      setTimeout(() => setAdminMessage(''), 3000);
    } catch (error) {
      console.error("Error seeding database:", error);
    }
  };

  const handleReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    setResError('');
    try {
      const newAppt = {
        name: resName,
        service: resService,
        date: resDate,
        time: resTime,
        status: 'pending',
        createdAt: Date.now()
      };
      await addDoc(collection(db, 'appointments'), newAppt);
      setConfirmedAppt(newAppt as any);
      setResSuccess(true);
      setResName('');
      setResService('');
      setResDate('');
      setResTime('');
    } catch (error) {
      console.error("Error al reservar:", error);
      setResError("Hubo un error al procesar tu reserva. Inténtalo de nuevo.");
    }
  };

  const generateCalendarLink = (appt: {service: string, date: string, time: string}) => {
    const start = new Date(`${appt.date}T${appt.time}`);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // Assume 1 hour duration
    
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d\d\d/g, '');
    };

    const text = encodeURIComponent(`Cita en Legado 1940: ${appt.service}`);
    const details = encodeURIComponent(`Servicio: ${appt.service}\n\nTe esperamos en Legado 1940.`);
    const location = encodeURIComponent('Bosques de la Reforma 1813, Lomas de Vista Hermosa, Cuajimalpa de Morelos, 05100 Ciudad de México, CDMX');
    const dates = `${formatDate(start)}/${formatDate(end)}`;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}&location=${location}`;
  };

  const updateAppointmentStatus = async (id: string, status: 'pending' | 'confirmed' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'appointments', id), { status });
    } catch (error) {
      console.error("Error updating appointment:", error);
    }
  };

  const deleteAppointment = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'appointments', id));
    } catch (error) {
      console.error("Error deleting appointment:", error);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRevError('');
    try {
      const newReview = {
        name: revName,
        rating: revRating,
        comment: revComment,
        date: new Date().toISOString().split('T')[0],
        createdAt: Date.now()
      };
      await addDoc(collection(db, 'reviews'), newReview);
      setRevSuccess(true);
      setRevName('');
      setRevRating(5);
      setRevComment('');
      setTimeout(() => setRevSuccess(false), 3000);
    } catch (error) {
      console.error("Error submitting review:", error);
      setRevError("Hubo un error al enviar tu reseña. Inténtalo de nuevo.");
    }
  };

  const deleteReview = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'reviews', id));
    } catch (error) {
      console.error("Error deleting review:", error);
    }
  };

  const handleAdminLogin = async () => {
    try {
      setAdminError('');
      await loginWithGoogle();
    } catch (error) {
      setAdminError('Error al iniciar sesión. Asegúrate de usar la cuenta autorizada.');
    }
  };

  const handleAdminLogout = async () => {
    await logout();
    setIsAdminOpen(false);
  };

  const updateService = async (id: string, field: string, value: string | number) => {
    try {
      await updateDoc(doc(db, 'services', id), { [field]: value });
    } catch (error) {
      console.error("Error updating service:", error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          await addDoc(collection(db, 'gallery'), {
            url: reader.result as string,
            createdAt: Date.now()
          });
        } catch (error) {
          console.error("Error adding photo:", error);
          setAdminError("La imagen es demasiado grande o hubo un error.");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const addGalleryPhoto = () => {
    fileInputRef.current?.click();
  };

  const removeGalleryPhoto = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'gallery', id));
    } catch (error) {
      console.error("Error deleting photo:", error);
    }
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0a] text-zinc-700 dark:text-zinc-300 font-sans selection:bg-[#D4AF37] selection:text-black overflow-x-hidden transition-colors duration-300">
      
      {/* --- Header --- */}
      <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 dark:bg-black/90 backdrop-blur-md py-4 shadow-lg shadow-zinc-200/50 dark:shadow-black/50' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`text-2xl font-serif font-bold tracking-widest flex items-center gap-2 cursor-pointer ${isScrolled ? 'text-zinc-900 dark:text-white' : 'text-white'}`}
            onClick={() => scrollToSection('inicio')}
          >
            <Scissors className="text-[#D4AF37]" size={28} />
            LEGADO <span className="text-[#D4AF37]">1940</span>
          </motion.div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex gap-8 items-center">
            {['Inicio', 'Servicios', 'Galería', 'Reseñas', 'Contacto'].map((item) => (
              <button 
                key={item} 
                onClick={() => scrollToSection(item.toLowerCase().replace('ñ', 'n'))}
                className={`text-sm uppercase tracking-wider hover:text-[#D4AF37] transition-colors relative group ${isScrolled ? 'text-zinc-900 dark:text-white' : 'text-white'}`}
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-[#D4AF37] transition-all duration-300 group-hover:w-full"></span>
              </button>
            ))}
            <button 
              onClick={toggleTheme} 
              className={`p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors ${isScrolled ? 'text-zinc-900 dark:text-white' : 'text-white'}`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button 
              onClick={() => setIsAdminOpen(true)}
              className={`flex items-center gap-2 text-sm uppercase tracking-wider hover:text-[#D4AF37] transition-colors ${isScrolled ? 'text-zinc-900 dark:text-white' : 'text-white'}`}
            >
              <Lock size={16} /> Admin
            </button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => scrollToSection('reservar')}
              className="bg-[#D4AF37] text-black px-6 py-2 rounded-sm font-semibold uppercase text-sm tracking-wider hover:bg-yellow-500 transition-colors"
            >
              Reservar
            </motion.button>
          </nav>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center gap-4">
            <button 
              onClick={toggleTheme} 
              className={`p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors ${isScrolled ? 'text-zinc-900 dark:text-white' : 'text-white'}`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className={`${isScrolled ? 'text-zinc-900 dark:text-white' : 'text-white'}`} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.nav 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white dark:bg-black border-t border-zinc-200 dark:border-zinc-800 mt-4 flex flex-col"
            >
              {['Inicio', 'Servicios', 'Galería', 'Reseñas', 'Reservar', 'Contacto'].map((item) => (
                <button 
                  key={item} 
                  onClick={() => scrollToSection(item.toLowerCase().replace('ñ', 'n'))}
                  className="p-4 border-b border-zinc-100 dark:border-zinc-900 text-left uppercase tracking-wider hover:text-[#D4AF37] text-zinc-900 dark:text-white"
                >
                  {item}
                </button>
              ))}
              <button 
                onClick={() => { setMobileMenuOpen(false); setIsAdminOpen(true); }}
                className="p-4 border-b border-zinc-100 dark:border-zinc-900 text-left uppercase tracking-wider hover:text-[#D4AF37] text-zinc-900 dark:text-white flex items-center gap-2"
              >
                <Lock size={18} /> Admin
              </button>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      {/* --- Hero --- */}
      <section id="inicio" className="relative h-screen flex items-center justify-center overflow-hidden">
        <motion.div 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 10, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
          className="absolute inset-0 z-0"
        >
          <img 
            src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=1920&h=1080" 
            alt="Barbería Legado 1940" 
            className="w-full h-full object-cover opacity-40 dark:opacity-40"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-zinc-50 dark:to-[#0a0a0a]"></div>
        </motion.div>

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex justify-center mb-6"
          >
            <Star className="text-[#D4AF37] w-6 h-6 mx-1" fill="#D4AF37" />
            <Star className="text-[#D4AF37] w-6 h-6 mx-1" fill="#D4AF37" />
            <Star className="text-[#D4AF37] w-6 h-6 mx-1" fill="#D4AF37" />
            <Star className="text-[#D4AF37] w-6 h-6 mx-1" fill="#D4AF37" />
            <Star className="text-[#D4AF37] w-6 h-6 mx-1" fill="#D4AF37" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 50, rotateX: -30 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 1, delay: 0.4, type: "spring", stiffness: 100 }}
            className="text-5xl md:text-8xl font-serif font-bold text-white mb-6 tracking-tight"
            style={{ transformPerspective: 1000 }}
          >
            LEGADO <span className="text-[#D4AF37]">1940</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-xl md:text-2xl text-zinc-200 mb-10 font-light tracking-wide"
          >
            Estilo, tradición y precisión.
          </motion.p>
          <motion.button 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            whileHover={{ scale: 1.05, boxShadow: "0px 0px 20px rgba(212, 175, 55, 0.4)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => scrollToSection('reservar')}
            className="bg-transparent border-2 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black px-10 py-4 rounded-sm font-bold uppercase tracking-widest transition-all duration-300"
          >
            Reservar Cita
          </motion.button>
        </div>
      </section>

      {/* --- Services --- */}
      <section id="servicios" className="py-24 px-6 bg-zinc-100 dark:bg-[#0f0f0f] transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-zinc-900 dark:text-white mb-4">Nuestros <span className="text-[#D4AF37]">Servicios</span></h2>
            <div className="w-24 h-1 bg-[#D4AF37] mx-auto"></div>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {services.map((service) => (
              <motion.div 
                key={service.id}
                variants={fadeInUp}
                whileHover={{ 
                  scale: 1.05, 
                  rotateX: 10, 
                  rotateY: -10,
                  boxShadow: "0px 20px 30px rgba(0,0,0,0.2)",
                  borderColor: "#D4AF37" 
                }}
                style={{ transformPerspective: 1000 }}
                className="bg-white dark:bg-[#1a1a1a] border border-zinc-200 dark:border-zinc-800 p-8 rounded-sm transition-colors duration-300 group relative overflow-hidden flex flex-col"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-[#D4AF37]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Scissors className="text-[#D4AF37] mb-6" size={32} />
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">{service.name}</h3>
                <p className="text-zinc-600 dark:text-zinc-400 mb-6 text-sm leading-relaxed">{service.description}</p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="text-2xl font-serif text-[#D4AF37]">${service.price}</div>
                  <button 
                    onClick={() => {
                      setResService(service.name);
                      scrollToSection('reservar');
                    }}
                    className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white hover:text-[#D4AF37] dark:hover:text-[#D4AF37] transition-colors flex items-center gap-1"
                  >
                    Reservar <ChevronRight size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* --- Gallery --- */}
      <section id="galería" className="py-24 px-6 bg-zinc-100 dark:bg-[#0f0f0f] transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-zinc-900 dark:text-white mb-4">Nuestra <span className="text-[#D4AF37]">Galería</span></h2>
            <div className="w-24 h-1 bg-[#D4AF37] mx-auto"></div>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {gallery.map((img) => (
              <motion.div 
                key={img.id}
                variants={fadeInUp}
                whileHover={{ scale: 1.05, rotateZ: 2, rotateX: 10, rotateY: 10 }}
                style={{ transformPerspective: 1000 }}
                className="relative overflow-hidden group aspect-[4/3] rounded-sm shadow-lg"
              >
                <img 
                  src={img.url} 
                  alt="Galería" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <Scissors className="text-[#D4AF37] w-10 h-10" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* --- Reservation --- */}
      <section id="reservar" className="py-24 px-6 bg-zinc-100 dark:bg-zinc-950 relative overflow-hidden transition-colors duration-300">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-[#D4AF37]/5 blur-[120px]"></div>
          <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-red-900/5 blur-[120px]"></div>
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 p-8 md:p-12 rounded-sm shadow-2xl transition-colors duration-300"
          >
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-zinc-900 dark:text-white mb-4">Reserva tu <span className="text-[#D4AF37]">Cita</span></h2>
              <p className="text-zinc-600 dark:text-zinc-400">Asegura tu lugar y vive la experiencia Legado 1940.</p>
            </div>

            {resSuccess && confirmedAppt ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-50 dark:bg-green-900/10 border border-green-500/30 text-green-800 dark:text-green-300 p-8 rounded-sm text-left shadow-lg"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-green-500 text-white p-3 rounded-full flex-shrink-0">
                    <Check size={28} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-green-900 dark:text-green-400">¡Reserva Confirmada!</h3>
                    <p className="text-green-700 dark:text-green-500">Hola {confirmedAppt.name}, hemos registrado tu cita exitosamente.</p>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-black/40 p-6 rounded-sm mb-8 space-y-4 border border-green-100 dark:border-green-900/30">
                  <h4 className="font-bold text-zinc-900 dark:text-white uppercase tracking-wider text-sm mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-2">Detalles de tu cita</h4>
                  <p className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300"><Scissors size={20} className="text-[#D4AF37]" /> <strong>Servicio:</strong> {confirmedAppt.service}</p>
                  <p className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300"><Calendar size={20} className="text-[#D4AF37]" /> <strong>Fecha:</strong> {confirmedAppt.date}</p>
                  <p className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300"><Clock size={20} className="text-[#D4AF37]" /> <strong>Hora:</strong> {confirmedAppt.time}</p>
                  <div className="flex items-start gap-3 text-zinc-700 dark:text-zinc-300 pt-2">
                    <MapPin size={20} className="text-[#D4AF37] mt-1 shrink-0" /> 
                    <span>
                      <strong>Dirección:</strong><br/>
                      Bosques de la Reforma 1813, Piso 0, Pabellón Bosques<br/>
                      Lomas de Vista Hermosa, Cuajimalpa de Morelos, 05100<br/>
                      Ciudad de México, CDMX
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <a 
                    href={generateCalendarLink(confirmedAppt)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-[#D4AF37] text-black py-4 px-4 rounded-sm font-bold uppercase tracking-wider hover:bg-yellow-500 transition-colors flex items-center justify-center gap-2 text-sm text-center shadow-md"
                  >
                    <CalendarPlus size={20} /> Añadir al Calendario
                  </a>
                  <button 
                    onClick={() => { setResSuccess(false); setConfirmedAppt(null); }}
                    className="flex-1 bg-transparent border-2 border-green-600 text-green-700 dark:text-green-500 py-4 px-4 rounded-sm font-bold uppercase tracking-wider hover:bg-green-600 hover:text-white transition-colors text-sm"
                  >
                    Hacer otra reserva
                  </button>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleReservation} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">Nombre Completo</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" size={18} />
                      <input 
                        type="text" 
                        required
                        value={resName}
                        onChange={(e) => setResName(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sm py-3 pl-10 pr-4 text-zinc-900 dark:text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                        placeholder="Tu nombre"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">Servicio</label>
                    <div className="relative">
                      <Scissors className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" size={18} />
                      <select 
                        required
                        value={resService}
                        onChange={(e) => setResService(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sm py-3 pl-10 pr-4 text-zinc-900 dark:text-white focus:outline-none focus:border-[#D4AF37] transition-colors appearance-none"
                      >
                        <option value="" disabled>Selecciona un servicio</option>
                        {services.map(s => (
                          <option key={s.id} value={s.name}>{s.name} - ${s.price}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">Fecha</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" size={18} />
                      <input 
                        type="date" 
                        required
                        value={resDate}
                        onChange={(e) => setResDate(e.target.value)}
                        className={`w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sm py-3 pl-10 pr-4 text-zinc-900 dark:text-white focus:outline-none focus:border-[#D4AF37] transition-colors ${theme === 'dark' ? '[color-scheme:dark]' : '[color-scheme:light]'}`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">Horario</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" size={18} />
                      <select 
                        required
                        value={resTime}
                        onChange={(e) => setResTime(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sm py-3 pl-10 pr-4 text-zinc-900 dark:text-white focus:outline-none focus:border-[#D4AF37] transition-colors appearance-none"
                      >
                        <option value="" disabled>Selecciona una hora</option>
                        <option value="10:00">10:00 AM</option>
                        <option value="11:00">11:00 AM</option>
                        <option value="12:00">12:00 PM</option>
                        <option value="13:00">01:00 PM</option>
                        <option value="14:00">02:00 PM</option>
                        <option value="15:00">03:00 PM</option>
                        <option value="16:00">04:00 PM</option>
                        <option value="17:00">05:00 PM</option>
                        <option value="18:00">06:00 PM</option>
                        <option value="19:00">07:00 PM</option>
                      </select>
                    </div>
                  </div>
                </div>
                {resError && <p className="text-red-500 text-sm mt-4 text-center">{resError}</p>}
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full bg-[#D4AF37] text-black py-4 rounded-sm font-bold uppercase tracking-widest hover:bg-yellow-500 transition-colors mt-6 flex items-center justify-center gap-2"
                >
                  Confirmar Reserva <ChevronRight size={20} />
                </motion.button>
              </form>
            )}
          </motion.div>
        </div>
      </section>

      {/* --- Reviews --- */}
      <section id="resenas" className="py-24 px-6 bg-white dark:bg-black transition-colors duration-300">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-zinc-900 dark:text-white mb-4">
                Lo que dicen nuestros clientes
              </h2>
              <div className="w-24 h-1 bg-[#D4AF37] mx-auto"></div>
            </motion.div>

            {/* Grid of reviews */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {reviews.slice(0, 6).map(review => (
                <motion.div key={review.id} variants={fadeInUp} className="bg-zinc-50 dark:bg-[#111] p-6 rounded-sm border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
                  <div>
                    <div className="flex text-[#D4AF37] mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={16} className={i < review.rating ? "fill-current" : "text-zinc-300 dark:text-zinc-700"} />
                      ))}
                    </div>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-6 italic leading-relaxed">"{review.comment}"</p>
                  </div>
                  <div className="flex justify-between items-center text-sm border-t border-zinc-200 dark:border-zinc-800 pt-4 mt-4">
                    <span className="font-bold text-zinc-900 dark:text-white">{review.name}</span>
                    <span className="text-zinc-500">{review.date}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Add Review Form */}
            <motion.div variants={fadeInUp} className="max-w-2xl mx-auto bg-zinc-50 dark:bg-[#111] p-8 rounded-sm border border-zinc-200 dark:border-zinc-800">
              <h3 className="text-2xl font-serif font-bold text-zinc-900 dark:text-white mb-6 text-center">Deja tu reseña</h3>
              {revSuccess ? (
                <div className="text-center text-green-600 dark:text-green-400 py-8">
                  <Check size={48} className="mx-auto mb-4" />
                  <p className="font-bold text-xl">¡Gracias por tu reseña!</p>
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-zinc-900 dark:text-white mb-2 uppercase tracking-wider">Nombre</label>
                    <input required type="text" value={revName} onChange={e => setRevName(e.target.value)} className="w-full bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-sm py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-[#D4AF37] transition-colors" placeholder="Tu nombre" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-zinc-900 dark:text-white mb-2 uppercase tracking-wider">Calificación</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button type="button" key={star} onClick={() => setRevRating(star)} className={`transition-colors ${star <= revRating ? 'text-[#D4AF37]' : 'text-zinc-300 dark:text-zinc-700'}`}>
                          <Star size={32} className={star <= revRating ? "fill-current" : ""} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-zinc-900 dark:text-white mb-2 uppercase tracking-wider">Comentario</label>
                    <textarea required rows={4} value={revComment} onChange={e => setRevComment(e.target.value)} className="w-full bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-sm py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-[#D4AF37] transition-colors resize-none" placeholder="¿Qué te pareció nuestro servicio?"></textarea>
                  </div>
                  {revError && <p className="text-red-500 text-sm mt-2 text-center">{revError}</p>}
                  <button type="submit" className="w-full bg-[#D4AF37] text-black py-4 rounded-sm font-bold uppercase tracking-widest hover:bg-yellow-500 transition-colors mt-6">
                    Enviar Reseña
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* --- Contact --- */}
      <section id="contacto" className="py-24 px-6 bg-zinc-50 dark:bg-[#0a0a0a] transition-colors duration-300">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2 variants={fadeInUp} className="text-3xl md:text-5xl font-serif font-bold text-zinc-900 dark:text-white mb-16">
              Visítanos
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-left">
              <motion.div variants={fadeInUp} className="flex flex-col items-center text-center gap-4">
                <div className="bg-zinc-200 dark:bg-zinc-900 p-4 rounded-full text-[#D4AF37]">
                  <MapPin size={32} />
                </div>
                <div>
                  <h4 className="text-zinc-900 dark:text-white font-bold mb-2 uppercase tracking-wider text-sm">Dirección</h4>
                  <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Bosques de la Reforma 1813,<br/>
                    Lomas de Vista Hermosa,<br/>
                    Cuajimalpa de Morelos, 05100<br/>
                    Ciudad de México, CDMX<br/>
                    <span className="text-[#D4AF37] mt-2 block">Piso 0, Pabellón Bosques</span>
                  </p>
                </div>
              </motion.div>

              <motion.div variants={fadeInUp} className="flex flex-col items-center text-center gap-4">
                <div className="bg-zinc-200 dark:bg-zinc-900 p-4 rounded-full text-[#D4AF37]">
                  <Clock size={32} />
                </div>
                <div>
                  <h4 className="text-zinc-900 dark:text-white font-bold mb-2 uppercase tracking-wider text-sm">Horario</h4>
                  <p className="text-zinc-600 dark:text-zinc-400">Lunes a Sábado:<br/>10:00 - 20:00</p>
                  <p className="text-zinc-600 dark:text-zinc-400 mt-2">Domingo:<br/>10:00 - 16:00</p>
                </div>
              </motion.div>

              <motion.div variants={fadeInUp} className="flex flex-col items-center text-center gap-4">
                <div className="bg-zinc-200 dark:bg-zinc-900 p-4 rounded-full text-[#D4AF37]">
                  <Phone size={32} />
                </div>
                <div>
                  <h4 className="text-zinc-900 dark:text-white font-bold mb-2 uppercase tracking-wider text-sm">Teléfono</h4>
                  <a href="tel:5578786470" className="text-2xl font-serif text-zinc-900 dark:text-white hover:text-[#D4AF37] transition-colors">
                    55 7878 6470
                  </a>
                  <div className="mt-4">
                    <a href="tel:5578786470" className="inline-block bg-zinc-200 dark:bg-zinc-900 hover:bg-[#D4AF37] hover:text-black text-zinc-900 dark:text-white px-6 py-2 rounded-sm text-sm font-bold uppercase tracking-wider transition-colors">
                      Llamar Ahora
                    </a>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="bg-white dark:bg-black py-8 border-t border-zinc-200 dark:border-zinc-900 text-center relative transition-colors duration-300">
        <p className="text-zinc-500 dark:text-zinc-600 text-sm">© 2026 Legado 1940 Barbería. Todos los derechos reservados.</p>
      </footer>

      {/* --- Admin Modal --- */}
      <AnimatePresence>
        {isAdminOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 rounded-md shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden transition-colors duration-300"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-black/50">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-serif font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <Lock className="text-[#D4AF37]" /> Panel de Administración
                  </h2>
                  {isAuthenticated && (
                    <button 
                      onClick={seedDatabase}
                      className="hidden md:flex bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white px-4 py-2 rounded-sm text-sm font-bold uppercase tracking-wider hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors items-center gap-2"
                      title="Inicializar base de datos con datos de prueba"
                    >
                      <Save size={16} /> Inicializar Datos
                    </button>
                  )}
                  {adminMessage && <span className="text-green-600 dark:text-green-400 text-sm font-bold hidden md:block">{adminMessage}</span>}
                </div>
                <div className="flex items-center gap-4">
                  {isAuthenticated && (
                    <button onClick={handleAdminLogout} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors" title="Cerrar sesión">
                      <LogOut size={20} />
                    </button>
                  )}
                  <button onClick={() => setIsAdminOpen(false)} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                    <X size={24} />
                  </button>
                </div>
              </div>

              {/* Mobile Save Button */}
              {isAuthenticated && (
                <div className="md:hidden p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-black/50 flex justify-between items-center">
                  <button 
                    onClick={seedDatabase}
                    className="bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white px-4 py-2 rounded-sm text-sm font-bold uppercase tracking-wider hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2"
                  >
                    <Save size={16} /> Inicializar
                  </button>
                  {adminMessage && <span className="text-green-600 dark:text-green-400 text-sm font-bold">{adminMessage}</span>}
                </div>
              )}

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                {!isAuthenticated ? (
                  <div className="max-w-md mx-auto py-12 text-center">
                    <div className="mb-8">
                      <p className="text-zinc-600 dark:text-zinc-400">Inicia sesión con tu cuenta de Google autorizada para acceder al panel.</p>
                    </div>
                    <button 
                      onClick={handleAdminLogin} 
                      className="w-full bg-[#D4AF37] text-black py-4 rounded-sm font-bold uppercase tracking-widest hover:bg-yellow-500 transition-colors flex items-center justify-center gap-2"
                    >
                      <User size={20} /> Iniciar Sesión con Google
                    </button>
                    {adminError && <p className="text-red-500 text-sm mt-4">{adminError}</p>}
                  </div>
                ) : (
                  <div>
                    {/* Admin Tabs */}
                    <div className="flex gap-4 mb-8 border-b border-zinc-200 dark:border-zinc-800 pb-4 overflow-x-auto">
                      {['citas', 'servicios', 'galeria', 'reseñas'].map(tab => (
                        <button 
                          key={tab}
                          onClick={() => setAdminTab(tab)}
                          className={`px-4 py-2 uppercase tracking-wider text-sm font-bold rounded-sm whitespace-nowrap transition-colors ${adminTab === tab ? 'bg-[#D4AF37] text-black' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
                        >
                          {tab === 'galeria' ? 'Galería' : tab === 'reseñas' ? 'Reseñas' : tab}
                        </button>
                      ))}
                    </div>

                    {/* Tab Content: Citas */}
                    {adminTab === 'citas' && (
                      <div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">Citas Reservadas</h3>
                        {appointments.length === 0 ? (
                          <p className="text-zinc-500 text-center py-12">No hay citas registradas aún.</p>
                        ) : (
                          <div className="space-y-4">
                            {appointments.map(appt => (
                              <div key={appt.id} className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
                                <div>
                                  <div className="flex items-center gap-3 mb-1">
                                    <p className="text-zinc-900 dark:text-white font-bold text-lg">{appt.name}</p>
                                    <span className={`text-[10px] px-2 py-1 rounded-sm font-bold uppercase tracking-wider ${
                                      appt.status === 'confirmed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                      appt.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                    }`}>
                                      {appt.status === 'confirmed' ? 'Confirmada' : appt.status === 'rejected' ? 'Rechazada' : 'Pendiente'}
                                    </span>
                                  </div>
                                  <p className="text-[#D4AF37]">{appt.service}</p>
                                </div>
                                <div className="flex flex-col md:flex-row md:items-center gap-4">
                                  <div className="flex items-center gap-4 text-zinc-500 dark:text-zinc-400 text-sm">
                                    <div className="flex items-center gap-1"><Calendar size={16} /> {appt.date}</div>
                                    <div className="flex items-center gap-1"><Clock size={16} /> {appt.time}</div>
                                  </div>
                                  {(!appt.status || appt.status === 'pending') && (
                                    <div className="flex gap-2 mt-2 md:mt-0">
                                      <button 
                                        onClick={() => updateAppointmentStatus(appt.id, 'confirmed')}
                                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider transition-colors"
                                      >
                                        Confirmar
                                      </button>
                                      <button 
                                        onClick={() => updateAppointmentStatus(appt.id, 'rejected')}
                                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider transition-colors"
                                      >
                                        Rechazar
                                      </button>
                                    </div>
                                  )}
                                  <button 
                                    onClick={() => deleteAppointment(appt.id)}
                                    className="bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-red-600 dark:text-red-400 p-1.5 rounded-sm transition-colors mt-2 md:mt-0"
                                    title="Eliminar reserva"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab Content: Servicios */}
                    {adminTab === 'servicios' && (
                      <div>
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Editar Servicios y Precios</h3>
                          <button 
                            onClick={async () => {
                              try {
                                await addDoc(collection(db, 'services'), {
                                  name: 'Nuevo Servicio',
                                  description: 'Descripción del servicio',
                                  price: 0,
                                  order: services.length
                                });
                              } catch (error) {
                                console.error("Error adding service:", error);
                              }
                            }}
                            className="bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white px-4 py-2 rounded-sm text-sm flex items-center gap-2 transition-colors"
                          >
                            <Plus size={16} /> Agregar Servicio
                          </button>
                        </div>
                        <div className="space-y-6">
                          {services.map(service => (
                            <div key={service.id} className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-sm grid grid-cols-1 md:grid-cols-12 gap-4 relative">
                              <button 
                                onClick={async () => {
                                  if (window.confirm('¿Estás seguro de eliminar este servicio?')) {
                                    try {
                                      await deleteDoc(doc(db, 'services', service.id));
                                    } catch (error) {
                                      console.error("Error deleting service:", error);
                                    }
                                  }
                                }}
                                className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-2"
                                title="Eliminar servicio"
                              >
                                <Trash2 size={16} />
                              </button>
                              <div className="md:col-span-4">
                                <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Nombre</label>
                                <input 
                                  type="text" 
                                  value={service.name}
                                  onChange={(e) => updateService(service.id, 'name', e.target.value)}
                                  className="w-full bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-sm py-2 px-3 text-zinc-900 dark:text-white focus:outline-none focus:border-[#D4AF37]"
                                />
                              </div>
                              <div className="md:col-span-6">
                                <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Descripción</label>
                                <input 
                                  type="text" 
                                  value={service.description}
                                  onChange={(e) => updateService(service.id, 'description', e.target.value)}
                                  className="w-full bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-sm py-2 px-3 text-zinc-900 dark:text-white focus:outline-none focus:border-[#D4AF37]"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Precio ($)</label>
                                <input 
                                  type="number" 
                                  value={service.price}
                                  onChange={(e) => updateService(service.id, 'price', Number(e.target.value))}
                                  className="w-full bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-sm py-2 px-3 text-[#D4AF37] font-bold focus:outline-none focus:border-[#D4AF37]"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tab Content: Galeria */}
                    {adminTab === 'galeria' && (
                      <div>
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Administrar Fotos</h3>
                          <div>
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              ref={fileInputRef} 
                              onChange={handleFileUpload} 
                            />
                            <button 
                              onClick={addGalleryPhoto}
                              className="bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white px-4 py-2 rounded-sm text-sm flex items-center gap-2 transition-colors"
                            >
                              <Plus size={16} /> Agregar Foto
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {gallery.map((img) => (
                            <div key={img.id} className="relative group aspect-square bg-zinc-100 dark:bg-zinc-900 rounded-sm overflow-hidden border border-zinc-200 dark:border-zinc-800">
                              <img src={img.url} alt="Galeria" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button 
                                  onClick={() => removeGalleryPhoto(img.id)}
                                  className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full transition-colors"
                                  title="Eliminar foto"
                                >
                                  <Trash2 size={20} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tab Content: Reseñas */}
                    {adminTab === 'reseñas' && (
                      <div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">Administrar Reseñas</h3>
                        {reviews.length === 0 ? (
                          <p className="text-zinc-500 text-center py-12">No hay reseñas registradas aún.</p>
                        ) : (
                          <div className="space-y-4">
                            {reviews.map(review => (
                              <div key={review.id} className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
                                <div>
                                  <div className="flex items-center gap-3 mb-1">
                                    <p className="text-zinc-900 dark:text-white font-bold text-lg">{review.name}</p>
                                    <div className="flex text-[#D4AF37]">
                                      {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={12} className={i < review.rating ? "fill-current" : "text-zinc-300 dark:text-zinc-700"} />
                                      ))}
                                    </div>
                                  </div>
                                  <p className="text-zinc-600 dark:text-zinc-400 text-sm italic">"{review.comment}"</p>
                                </div>
                                <div className="flex flex-col md:flex-row md:items-center gap-4">
                                  <span className="text-zinc-500 dark:text-zinc-400 text-sm">{review.date}</span>
                                  <button 
                                    onClick={() => deleteReview(review.id)}
                                    className="bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-red-600 dark:text-red-400 p-1.5 rounded-sm transition-colors mt-2 md:mt-0"
                                    title="Eliminar reseña"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global styles for custom scrollbar in admin panel */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d4d4d8; /* zinc-300 */
          border-radius: 4px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3f3f46; /* zinc-700 */
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #D4AF37;
        }
      `}} />
    </div>
  );
}
