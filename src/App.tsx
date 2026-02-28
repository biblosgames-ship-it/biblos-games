/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  RotateCcw, 
  ChevronLeft, 
  Eye, 
  EyeOff, 
  Sparkles,
  Info,
  CheckCircle2,
  XCircle,
  Volume2,
  VolumeX
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Period, Question, PERIOD_COLORS, PERIOD_ICONS, Difficulty } from './types';
import questionsData from './data/questions.json';
import { supabase } from './supabaseClient';

const ALL_QUESTIONS = questionsData as Question[];

export default function App() {
  const [currentPeriod, setCurrentPeriod] = useState<Period | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [gameLevel, setGameLevel] = useState<'PRINCIPIANTE' | 'INTERMEDIO' | 'AVANZADO' | null>(null);
  const [isProjectionMode, setIsProjectionMode] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [usedQuestionIds, setUsedQuestionIds] = useState<Set<string>>(new Set());
  const [showWelcome, setShowWelcome] = useState(true);

  const [isSoundOn, setIsSoundOn] = useState(true);
  const [showFinalSummary, setShowFinalSummary] = useState(false);
  const [gameStats, setGameStats] = useState<Record<string, { total: number; correct: number }>>({});
  const [startTime, setStartTime] = useState<number | null>(null);
  const [user, setUser] = useState(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [globalAverage, setGlobalAverage] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showAuth, setShowAuth] = useState(false);
useEffect(() => {
  supabase.auth.getUser().then(({ data }) => {
    setUser(data.user);
  });

  const { data: listener } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      setUser(session?.user ?? null);
    }
  );

  return () => {
    listener.subscription.unsubscribe();
  };
}, []);
useEffect(() => {
  const initialStats: Record<string, { total: number; correct: number }> = {};

  Object.values(Period).forEach(period => {
    initialStats[period] = { total: 0, correct: 0 };
  });

  setGameStats(initialStats);
}, []);
  // 🔊 Precargar sonidos una sola vez
const sounds = {
  select: new Audio("/sounds/select.mp3"),
  correct: new Audio("/sounds/correct.mp3"),
  wrong: new Audio("/sounds/wrong.mp3"),
  projection: new Audio("/sounds/projection.mp3"),
};

// Ajustar volumen
Object.values(sounds).forEach((sound) => {
  sound.volume = 0.6;
});

const playSound = (type: keyof typeof sounds) => {
  if (!isSoundOn) return; // 🔇 si está silenciado, no suena

  const sound = sounds[type];
  sound.currentTime = 0;
  sound.play();
};
const getTotalStats = () => {
  let total = 0;
  let correct = 0;

  Object.values(gameStats).forEach(stat => {
    total += stat.total;
    correct += stat.correct;
  });

  return { total, correct };
};

const getAccuracy = () => {
  const { total, correct } = getTotalStats();
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
};

const getDuration = () => {
  if (!startTime || !endTime) return 0;
  return Math.floor((endTime - startTime) / 1000);
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};
const signUp = async () => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    alert(error.message);
    return;
  }

  if (data.user) {
    const { error: profileError } = await supabase
      .from("profiles")
      .insert([
        {
          id: data.user.id,
          name: name,
        },
      ]);

    if (profileError) {
      console.error("Error creando perfil:", profileError);
    }
  }

  alert("Cuenta creada correctamente 🎉");
  setShowAuth(false);
};

const signIn = async () => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  console.log("LOGIN RESPONSE:", data);
  console.log("SESSION DESPUÉS DEL LOGIN:", await supabase.auth.getSession());
  if (error) {
    alert(error.message);
    return;
  }

  if (data?.user) {
    alert("Sesión iniciada 🔥");
    setShowAuth(false);
    setUser(data.user); // 🔥 MUY IMPORTANTE
  } else {
    alert("No se pudo obtener el usuario");
  }
};

const signOut = async () => {
  await supabase.auth.signOut();
};
const getColor = (accuracy: number) => {
  if (accuracy >= 80) return "text-green-600";
  if (accuracy >= 60) return "text-yellow-500";
  return "text-red-600";
};
  const getRandomQuestion = (period: Period | 'SURPRISE', levelOverride?: typeof gameLevel) => {
    const activeLevel = levelOverride || gameLevel;
    
    let available = ALL_QUESTIONS.filter(q => !usedQuestionIds.has(q.id));
    
    // Filter by game level
    if (activeLevel === 'PRINCIPIANTE') {
      available = available.filter(q => q.difficulty === Difficulty.BASIC);
    } else if (activeLevel === 'INTERMEDIO') {
      available = available.filter(q => q.difficulty === Difficulty.BASIC || q.difficulty === Difficulty.INTERMEDIATE);
    } else if (activeLevel === 'AVANZADO') {
      available = available.filter(q => q.difficulty === Difficulty.INTERMEDIATE || q.difficulty === Difficulty.ADVANCED);
    }

    if (period !== 'SURPRISE') {
      available = available.filter(q => q.period === period);
    }

    // If no questions left in this filtered set, reset for this period/level
    if (available.length === 0) {
      let resetSet = ALL_QUESTIONS.filter(q => period === 'SURPRISE' ? true : q.period === period);
      
      if (activeLevel === 'PRINCIPIANTE') {
        resetSet = resetSet.filter(q => q.difficulty === Difficulty.BASIC);
      } else if (activeLevel === 'INTERMEDIO') {
        resetSet = resetSet.filter(q => q.difficulty === Difficulty.BASIC || q.difficulty === Difficulty.INTERMEDIATE);
      } else if (activeLevel === 'AVANZADO') {
        resetSet = resetSet.filter(q => q.difficulty === Difficulty.INTERMEDIATE || q.difficulty === Difficulty.ADVANCED);
      }

      const newUsed = new Set(usedQuestionIds);
      resetSet.forEach(q => newUsed.delete(q.id));
      setUsedQuestionIds(newUsed);
      available = resetSet;
    }

    if (available.length === 0) return;

    const randomIndex = Math.floor(Math.random() * available.length);
    const selected = available[randomIndex];
    
    setCurrentQuestion(selected);
    setUsedQuestionIds(prev => {
      const next = new Set(prev);
      if (next.size > 1000) next.clear(); // Safety reset
      next.add(selected.id);
      return next;
    });
    setShowAnswer(false);
  };

  const handleSelectPeriod = (period: Period) => {
    setCurrentPeriod(period);
    getRandomQuestion(period);
  };

  const handleSurprise = () => {
    setCurrentPeriod(null);
    getRandomQuestion('SURPRISE');
  };

  const resetGame = () => {
    setUsedQuestionIds(new Set());
    setCurrentPeriod(null);
    setCurrentQuestion(null);
    setGameLevel(null);
    setShowAnswer(false);
  };

  const toggleProjection = () => {
    setIsProjectionMode(!isProjectionMode);
  };

const handleAnswerClick = (index: number) => {
  if (showAnswer || !currentQuestion) return;

  if (!startTime) setStartTime(Date.now());

  const isCorrect = index === currentQuestion.correctAnswer;

  setGameStats(prev => ({
    ...prev,
    [currentQuestion.period]: {
      total: prev[currentQuestion.period].total + 1,
      correct: prev[currentQuestion.period].correct + (isCorrect ? 1 : 0)
    }
  }));

  if (isCorrect) {
    playSound("correct");
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  } else {
    playSound("wrong");
  }

  setShowAnswer(true);
};

const saveGameResult = async () => {
  const { total, correct } = getTotalStats();
  const accuracy = getAccuracy();

  if (total === 0) {
    alert("No hay datos para guardar");
    return;
  }

  if (!user) {
  alert("Debes iniciar sesión para guardar tu partida");
  return;
  }

  // 🔥 Calculamos duración en tiempo real
  const now = Date.now();
  const duration = startTime
    ? Math.floor((now - startTime) / 1000)
    : 0;

  const { error } = await supabase
    .from("games")
    .insert([
      {
        mode: "solo",
        team_name: null,
        difficulty: gameLevel || "No definido",
        total_questions: total,
        correct_answers: correct,
        accuracy: accuracy,
        duration_seconds: duration,
        level_breakdown: gameStats,
      },
    ]);

  if (error) {
    console.error("SUPABASE ERROR:", error);
    alert("Error al guardar partida");
  } else {
    alert("Partida guardada correctamente 🎉");
  }
};

if (showFinalSummary) {
  const { total, correct } = getTotalStats();
  const accuracy = getAccuracy();
  const duration = getDuration();

  if (total === 0) {
    setShowFinalSummary(false);
    return null;
  }

  return (
    <div className="min-h-screen bg-[#1B1A17] text-[#D6D0C4] p-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-serif font-bold">Resumen Final</h1>

        <p className="text-2xl font-bold">
          Precisión General: {accuracy}%
        </p>

        <p>
          📊 {correct} correctas de {total}
        </p>

        <p>
          ⏱ Tiempo de partida: {formatTime(duration)}
        </p>

        {globalAverage !== null && (
          <p>📈 Promedio histórico global: {globalAverage}%</p>
        )}
      </div>

      <div className="space-y-4">
        {Object.entries(gameStats).map(([period, stat]) => {
          if (stat.total === 0) return null;

          const periodAccuracy = Math.round(
            (stat.correct / stat.total) * 100
          );

          return (
            <div
              key={period}
              className="flex justify-between border-b border-stone-700 pb-2"
            >
              <span>{period}</span>
              <span className={getColor(periodAccuracy)}>
                {periodAccuracy}%
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-4 pt-6">
        <button
          onClick={saveGameResult}
          className="py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl"
        >
          Guardar Partida
        </button>

        <button
          onClick={() => {
            setShowFinalSummary(false);
            setStartTime(null);
            setEndTime(null);
          }}
          className="py-4 bg-stone-700 hover:bg-stone-800 text-white font-bold rounded-xl"
        >
          Nueva Partida
        </button>
      </div>
    </div>
  );
}
  // Projection View Component
  if (isProjectionMode && currentQuestion) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-8 transition-all duration-500">
        <button 
          onClick={toggleProjection}
          className="absolute top-8 left-8 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <ChevronLeft size={32} />
        </button>

        <div className="absolute bottom-8 right-8 flex flex-col items-end opacity-30">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-red-600 font-serif">β</span>
            <span className="text-lg font-bold tracking-tight">Biblos Games</span>
          </div>
          <p className="text-xs font-serif italic">El Juego de la Biblia</p>
        </div>

        <div className="max-w-6xl w-full space-y-12 text-center">
          <div className="space-y-4">
            <span className="text-bible-gold font-serif italic text-2xl tracking-widest uppercase">
              {currentQuestion.period}
            </span>
            <h1 className="text-6xl md:text-8xl font-serif font-bold leading-tight">
              {currentQuestion.question}
            </h1>
          </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  {currentQuestion.options.map((option, idx) => {
                    const isCorrect = idx === currentQuestion.correctAnswer;
                    return (
                      <button 
                        key={idx}
                        disabled={showAnswer}
                        onClick={() => handleAnswerClick(idx)}
                        className={`
                          p-8 rounded-2xl border-2 text-3xl font-medium transition-all duration-500 text-left
                          ${showAnswer 
                            ? isCorrect 
                              ? 'bg-emerald-600 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.4)] scale-105' 
                              : 'bg-white/5 border-white/10 opacity-40'
                            : 'bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/40 active:scale-95'
                          }
                        `}
                      >
                        <span className="mr-4 opacity-50">{String.fromCharCode(65 + idx)})</span>
                        {option}
                      </button>
                    );
                  })}
                </div>

          <div className="pt-8 flex flex-col items-center gap-6">
            {!showAnswer ? (
              <button 
                onClick={() => setShowAnswer(true)}
                className="group relative px-12 py-4 bg-bible-gold text-white rounded-full text-2xl font-bold overflow-hidden transition-all hover:scale-105 active:scale-95"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                REVELAR RESPUESTA
              </button>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <p className="text-bible-gold text-3xl font-serif italic">
                  Referencia: {currentQuestion.reference}
                </p>
                <button 
                  onClick={() => getRandomQuestion(currentPeriod || 'SURPRISE')}
                  className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-full text-xl transition-colors"
                >
                  Siguiente Pregunta
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    );
  }
if (showWelcome) {
  return (
    <div className="fixed inset-0 w-full h-full">
      <img
        src="/fondo-biblos.jpg"
        alt="Biblos Background"
        className="absolute inset-0 w-full h-full object-cover"
      />

      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-end pb-20 text-center px-6">

        <img
          src="/logo-biblos.png"
          alt="Biblos Games"
          className="w-72 md:w-[500px] drop-shadow-2xl"
        />

        <button
          onClick={() => {
            playSound("select");
            setShowWelcome(false);
          }}
          className="mt-10 px-8 py-3 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl shadow-lg transition-all duration-300"
        >
          Comenzar
        </button>

      </div>
    </div>
  );
}
  return (
  <div
    className={`min-h-screen flex flex-col transition-all duration-500 ${
      isProjectionMode
        ? "bg-black text-white"
        : "bg-[#1B1A17]"
    }`}
  >

    {/* HEADER */}
      {showAuth && (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "rgba(0,0,0,0.7)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 2000,
    }}
  >
    <div
      style={{
        background: "white",
        padding: "30px",
        borderRadius: "10px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        width: "300px",
      }}
    >
      <h3>Registro / Login</h3>

      <input
        type="text"
        placeholder="Nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={signUp}>Registrarse</button>
      <button onClick={signIn}>Iniciar sesión</button>
      <button onClick={() => setShowAuth(false)}>Cancelar</button>
    </div>
  </div>
)}
      {/* Header */}
      <header className="relative bg-[#2A2621]/90 backdrop-blur-md border-b border-[#3A342C] px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-lg">
        {/* Left: Logo & Title */}
        <div className="flex items-center">
          <img
            src="/logo-header.png"
            alt="Biblos Games"
            className="h-14 md:h-16 w-auto object-contain drop-shadow-lg"
          />
        </div>
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
          <p className="text-white text-[10px] tracking-[0.3em] uppercase font-light">
            El Juego de la Biblia
          </p>
        </div>
        {/* Right: Actions */}
        <div className="flex items-center justify-end gap-1 sm:gap-2">

          <button 
            onClick={() => {
              setShowInstructions(true);
              setShowAbout(false);
            }}
            className="p-2 rounded-lg hover:bg-stone-100 text-amber-200 transition-colors"
            title="Instrucciones"
          >
            <BookOpen size={22} strokeWidth={2.5} />
          </button>

          <button 
            onClick={() => {
              setShowAbout(true);
              setShowInstructions(false);
            }}
            className="p-2 rounded-lg hover:bg-white/10 text-amber-200 hover:text-amber-400 transition-colors"
            title="Acerca de"
          >
            <Info size={20} />
          </button>

          {/* 🔊 NUEVA BOCINA */}
          <button
            onClick={() => setIsSoundOn(!isSoundOn)}
            className="p-2 rounded-lg hover:bg-white/10 text-amber-200 hover:text-amber-400 transition-colors"
            title="Activar / Desactivar sonido"
          >
            {isSoundOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>

          <div className="w-px h-6 bg-stone-200 mx-1 hidden sm:block" />

          <button 
            onClick={resetGame}
            className="p-2 rounded-lg hover:bg-white/10 text-amber-200 hover:text-amber-400 transition-colors"
            title="Reiniciar"
          >
            <RotateCcw size={20} />
          </button>

          </div>
      </header>

      {/* Instructions Modal */}
      <AnimatePresence>
        {showInstructions && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowInstructions(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto parchment-shadow border border-stone-200"
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white/90 backdrop-blur-md p-6 border-b border-stone-100 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <BookOpen className="text-bible-gold" size={24} />
                  <h2 className="text-2xl font-serif font-bold">Instrucciones del Juego</h2>
                </div>
                <button 
                  onClick={() => setShowInstructions(false)}
                  className="p-2 hover:bg-stone-100 rounded-full transition-colors"
                >
                  <XCircle size={24} className="text-stone-400" />
                </button>
              </div>
              <div className="p-8 space-y-8 font-serif text-stone-700 leading-relaxed">
                <section className="space-y-4">
                  <h3 className="text-2xl font-bold text-slate-900 border-b border-stone-100 pb-2">Introducción</h3>
                  <p>
                    Bienvenido/a a la aventura más fascinante y trascendente de toda la humanidad. En este recorrido por las seis etapas de la historia bíblica, avanzarás destacando los momentos más importantes del trato de Dios con su pueblo.
                  </p>
                  <p>
                    Tu objetivo es llegar a la <strong>META</strong> más rápido que tus compañeros, respondiendo preguntas de la Biblos App y utilizando las capacidades especiales de los personajes contenidos en las <strong>Biblos Card</strong>.
                  </p>
                </section>

                <section className="space-y-4">
                  <h3 className="text-2xl font-bold text-slate-900 border-b border-stone-100 pb-2">Preparación y Comienzo</h3>
                  <ol className="list-decimal pl-5 space-y-3">
                    <li>Coloca el tablero sobre una superficie plana y las fichas en la salida.</li>
                    <li>Reparte <strong>seis (6) Biblos Card</strong> a cada jugador. Deben mantenerse en secreto.</li>
                    <li>Escoge el modo de juego en la App: Principiante (kids), Intermedio o Avanzado.</li>
                    <li>Se tira un dado para determinar quién inicia (la cantidad más alta). El juego continúa en dirección a las agujas del reloj.</li>
                  </ol>
                </section>

                <section className="space-y-4">
                  <h3 className="text-2xl font-bold text-slate-900 border-b border-stone-100 pb-2">Mecánica de Juego</h3>
                  <p>Al caer en una casilla, el jugador debe realizar la acción indicada:</p>
                  <div className="space-y-4 pl-2">
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-500 shrink-0 mt-1" />
                      <div>
                        <strong>Puntos Azules:</strong> Se debe responder una pregunta de la Biblos App del período correspondiente. Si aciertas, avanzas los pasos indicados; si fallas, retrocedes la misma cantidad.
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-red-500 shrink-0 mt-1 flex items-center justify-center text-[10px] text-white font-bold">!</div>
                      <div>
                        <strong>Un turno sin jugar:</strong> El jugador pierde su siguiente turno, a menos que use una Biblos Card que evite el castigo.
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-500 shrink-0 mt-1 flex items-center justify-center text-[10px] text-white font-bold">↔</div>
                      <div>
                        <strong>Adelanta o Retrocede:</strong> El jugador debe mover su ficha los pasos que la casilla indique.
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-slate-800 shrink-0 mt-1 flex items-center justify-center text-[10px] text-white font-bold">🎲</div>
                      <div>
                        <strong>Lanza de nuevo:</strong> El jugador tira el dado otra vez y avanza, con el riesgo de caer en una nueva casilla de acción o pregunta.
                      </div>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-2xl font-bold text-slate-900 border-b border-stone-100 pb-2">Uso de las Biblos Card</h3>
                  <ul className="list-disc pl-5 space-y-3">
                    <li>Se pueden usar para aplicar castigos (⚔), defenderse (🛡), aplicar misericordia (❤) o ganar beneficios propios.</li>
                    <li>Solo se puede usar <strong>una (1) carta por ronda</strong> durante tu turno, excepto para defenderte de un ataque.</li>
                    <li>Al pasar de un período bíblico a otro, recibes una nueva carta del mazo (solo la primera vez, máximo 5 adicionales en el juego).</li>
                    <li>Al usar una carta, esta se pierde y se coloca boca arriba al lado del mazo.</li>
                    <li>Algunas cartas están limitadas a una época específica (identificadas con un punto del color de la carta al lado del nombre).</li>
                  </ul>
                </section>

                <section className="space-y-4">
                  <h3 className="text-2xl font-bold text-slate-900 border-b border-stone-100 pb-2">Reglas de la Meta</h3>
                  <ul className="list-disc pl-5 space-y-3">
                    <li>Al estar a <strong>5 pasos de la meta</strong>, sacar un 6 equivale a doble y se debe volver a tirar.</li>
                    <li>Si sacas tres dobles seguidos (<strong>666</strong>), debes volver al Principio del Nuevo Testamento (Casilla 50).</li>
                    <li>El primer jugador en llegar a la META gana. Los demás pueden seguir jugando por el segundo y tercer lugar.</li>
                    <li>El ganador debe entregar sus cartas sobrantes al jugador más cercano a la meta.</li>
                  </ul>
                </section>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* About Modal */}
      <AnimatePresence>
        {showAbout && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowAbout(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl max-w-xl w-full parchment-shadow border border-stone-200 overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="bg-bible-gold p-8 text-white text-center space-y-4 relative">
                <button 
                  onClick={() => setShowAbout(false)}
                  className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <XCircle size={24} />
                </button>
                <div className="w-20 h-20 bg-white rounded-3xl mx-auto flex items-center justify-center shadow-xl">
                  <span className="text-5xl font-bold text-red-600 font-serif">β</span>
                </div>
                <div>
                  <h2 className="text-3xl font-bold font-['Helvetica_Neue'] uppercase tracking-tight">Biblos Games</h2>
                  <p className="text-sm font-serif italic opacity-90">El Juego de la Biblia</p>
                </div>
              </div>
              <div className="p-8 space-y-6 text-center">
                <p className="font-serif text-stone-600 leading-relaxed italic">
                  "Una herramienta educativa ideal para divertir, aprender y compartir de una manera dinámica mientras se utiliza la Palabra de Dios."
                </p>
                
                <div className="space-y-4 pt-4 border-t border-stone-100">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-left">
                      <p className="text-stone-400 uppercase tracking-widest text-[10px] font-bold">Diseño</p>
                      <p className="text-stone-700 font-medium">Alexander Palacio E.</p>
                    </div>
                    <div className="text-left">
                      <p className="text-stone-400 uppercase tracking-widest text-[10px] font-bold">Versión</p>
                      <p className="text-stone-700 font-medium">Beta 2026</p>
                    </div>
                  </div>
                  
                  <div className="text-left pt-2">
                    <p className="text-stone-400 uppercase tracking-widest text-[10px] font-bold">Producción</p>
                    <p className="text-stone-700 font-medium">Biblos Papelería y Librería Cristiana SRL</p>
                    <p className="text-stone-500 text-xs">Higüey, República Dominicana</p>
                  </div>
                </div>

                <p className="text-[10px] text-stone-400 pt-4">Todos los derechos reservados © 2026</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 max-w-4xl mx-auto w-full p-6 space-y-8 bg-[#1B1A17] text-[#D6D0C4]">
        {!gameLevel ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 py-2"
          >
            <div className="text-center space-y-6">

              <div className="inline-block px-8 py-4 
                              bg-gradient-to-b from-amber-400 to-amber-600 
                              text-white 
                              rounded-2xl 
                              shadow-[0_8px_0_rgb(120,53,15)] 
                              border-2 border-amber-300
                              transform transition-all
                              hover:translate-y-1 hover:shadow-[0_4px_0_rgb(120,53,15)]">
                <h2 className="text-3xl md:text-4xl font-serif font-bold tracking-wide">
                  Modo de Juego
                </h2>
            </div>

  <p className="text-stone-300 italic">
    Selecciona el Nivel de Complejidad
  </p>

</div>

            <div className="grid grid-cols-1 gap-4 max-w-md mx-auto">
              <button
                onClick={() => {
                  playSound("select");
                  setGameLevel('PRINCIPIANTE');
                }}
                className="group p-6 bg-[#2A2621] rounded-2xl border-2 border-[#3A342C] hover:border-[#C2B280] hover:bg-[#332E27] transition-all text-left shadow-lg"
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-bold text-amber-200">Principiante</h3>
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase rounded-md">Fácil</span>
                </div>
                <p className="text-sm text-stone-400">Preguntas sencillas y directas. Ideal para niños o quienes recién comienzan.</p>
              </button>

              <button
                onClick={() => {
                  playSound("select");
                  setGameLevel('INTERMEDIO');
                }}
                className="group p-6 bg-[#2A2621] rounded-2xl border-2 border-[#3A342C] hover:border-[#C2B280] hover:bg-[#332E27] transition-all text-left shadow-lg"
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-bold text-amber-200">Intermedio</h3>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase rounded-md">Medio</span>
                </div>
                <p className="text-sm text-stone-400">Mezcla de preguntas fáciles y de complejidad media para un desafío equilibrado.</p>
              </button>

              <button
                onClick={() => {
                  playSound("select");
                  setGameLevel('AVANZADO');
                }}
                className="group p-6 bg-[#2A2621] rounded-2xl border-2 border-[#3A342C] hover:border-[#C2B280] hover:bg-[#332E27] transition-all text-left shadow-lg"
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-bold text-amber-200">Avanzado</h3>
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-[10px] font-bold uppercase rounded-md">Difícil</span>
                </div>
                <p className="text-sm text-stone-400">Preguntas de complejidad media y difíciles. Para expertos en la Palabra.</p>
              </button>
            </div>
          </motion.div>
        ) : !currentQuestion ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setGameLevel(null)}
                className="flex items-center gap-2 text-stone-400 hover:text-stone-800 transition-colors font-medium text-sm"
              >
                <ChevronLeft size={16} />
                Cambiar Nivel
              </button>
              <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                gameLevel === 'PRINCIPIANTE' ? 'bg-emerald-100 text-emerald-700' :
                gameLevel === 'INTERMEDIO' ? 'bg-blue-100 text-blue-700' :
                'bg-purple-100 text-purple-700'
              }`}>
                Modo {gameLevel}
              </div>
            </div>

            <div className="text-center space-y-0 mb-1">
              <h2 className="text-base font-serif font-semibold tracking-wide">
                SELECCIONAR UN PERIODO
              </h2>
              <p className="text-stone-400 text-xs">
                Toca para generar preguntas
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {Object.values(Period).map((period) => (
                <button
                  key={period}
                  onClick={() => {
                    playSound("select");
                    handleSelectPeriod(period);
                  }}
                  className={`
                    relative overflow-hidden min-h-[85px] rounded-2xl py-3 px-6 text-left transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-xl border border-white/10
                    ${PERIOD_COLORS[period]} text-white group
                  `}
                >
                  <div className="absolute -right-4 -bottom-4 text-8xl opacity-10 group-hover:scale-110 transition-transform duration-500">
                    {PERIOD_ICONS[period]}
                  </div>
                  <div className="relative z-10 flex flex-col justify-between">
                    <span className="text-4xl">{PERIOD_ICONS[period]}</span>
                    <div className="space-y-1">
                      <h3 className="font-serif font-bold text-lg leading-tight">{period}</h3>
                      <p className="text-[10px] opacity-70 font-medium uppercase tracking-wider">
                        Toca para jugar
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-4">
              <button
                onClick={handleSurprise}
                className="w-full py-6 rounded-2xl border-2 border-dashed border-stone-300 hover:border-bible-gold hover:bg-bible-gold/5 transition-all flex flex-col items-center justify-center gap-2 group"
              >
                <Sparkles className="text-stone-400 group-hover:text-bible-gold transition-colors" size={32} />
                <span className="font-serif font-bold text-xl text-stone-600 group-hover:text-bible-gold">Pregunta Sorpresa</span>
                <span className="text-xs text-stone-400 uppercase tracking-widest">Cualquier período</span>
              </button>
            </div>
            <div className="mt-6 flex justify-center">
              <button
                onClick={saveGameResult}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg transition-all"
              >
                Guardar partida (TEST)
              </button>
            </div>

          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setCurrentQuestion(null)}
                className="flex items-center gap-2 text-stone-500 hover:text-stone-800 transition-colors font-medium"
              >
                <ChevronLeft size={20} />
                Volver al Tablero
              </button>
              <div className="px-3 py-1 bg-stone-100 rounded-full text-[10px] font-bold text-stone-500 uppercase tracking-[0.2em]">
                {currentQuestion.difficulty}
              </div>
            </div>

            <div className="bg-[#F1E6CF] text-[#2B2B2B] rounded-[2rem] overflow-hidden border border-[#C2B280] shadow-2xl">
              <div className={`p-6 text-white flex justify-between items-center ${PERIOD_COLORS[currentQuestion.period]}`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{PERIOD_ICONS[currentQuestion.period]}</span>
                  <span className="font-serif font-bold tracking-tight">{currentQuestion.period}</span>
                </div>
                <div className="text-xs font-mono opacity-80 font-bold">ITEM #{currentQuestion.id.toUpperCase()}</div>
              </div>
              
              <div className="px-8 pt-4 pb-8 md:px-12 md:pt-6 md:pb-10 space-y-4">
                <h2 className="text-2xl md:text-3xl font-serif font-bold leading-tight text-slate-900 text-balance">
                  {currentQuestion.question}
                </h2>

                <div className="grid grid-cols-1 gap-2">
                  {currentQuestion.options.map((option, idx) => {
                    const isCorrect = idx === currentQuestion.correctAnswer;
                    return (
                      <button
                        key={idx}
                        disabled={showAnswer}
                        onClick={() => handleAnswerClick(idx)}
                        className={`
                          w-full py-3 px-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between group
                          ${showAnswer 
                            ? isCorrect 
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-900' 
                              : 'bg-stone-50 border-stone-100 text-stone-300'
                            : 'bg-white border-stone-200 hover:border-bible-gold hover:bg-stone-50 active:scale-[0.98]'
                          }
                        `}
                      >
                        <div className="flex items-center gap-5">
                          <span className={`
                            w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2
                            ${showAnswer 
                              ? isCorrect ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-stone-100 border-stone-200 text-stone-300'
                              : 'bg-stone-50 border-stone-200 text-stone-400 group-hover:border-bible-gold group-hover:text-bible-gold'
                            }
                          `}>
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="text-base font-medium">{option}</span>
                        </div>
                        {showAnswer && isCorrect && <CheckCircle2 className="text-emerald-500" size={28} />}
                        {showAnswer && !isCorrect && <XCircle className="text-stone-200" size={28} />}
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {showAnswer && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="pt-8 border-t border-stone-100 space-y-6"
                    >
                      <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-bible-gold/10 flex items-center justify-center shrink-0">
                          <BookOpen className="text-bible-gold" size={24} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Referencia Bíblica</p>
                          <p className="text-2xl font-serif italic text-stone-800">{currentQuestion.reference}</p>
                          <p className="text-xs text-stone-400 mt-1">Reina Valera 1960</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-4">
                        <button 
                          onClick={() => getRandomQuestion(currentPeriod || 'SURPRISE')}
                          className="flex-1 py-5 bg-stone-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-lg hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                          Siguiente Pregunta
                          <Sparkles size={20} />
                        </button>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setCurrentQuestion(null)}
                            className="flex-1 sm:flex-none px-8 py-5 bg-stone-100 text-stone-600 rounded-2xl font-bold hover:bg-stone-200 transition-colors flex items-center justify-center"
                            title="Cerrar"
                          >
                            <RotateCcw size={24} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!showAnswer && (
                  <button 
                    onClick={() => setShowAnswer(true)}
                    className="w-full py-6 bg-bible-gold text-white rounded-2xl font-bold hover:bg-amber-600 transition-all shadow-lg hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-3"
                  >
                    <Eye size={24} />
                    <span className="text-xl">Revelar Respuesta</span>
                  </button>
                )}
                {Object.values(gameStats).some(stat => stat.total > 0) && (
                  <button
                    onClick={() => {
                    setEndTime(Date.now());
                    setShowFinalSummary(true);
                  }}
                  className="w-full mt-6 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl"
                >
                  Finalizar Partida
                </button>
              )}
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer / Stats (Subtle) */}
      <footer className="p-6 text-center text-stone-400 text-xs uppercase tracking-[0.2em] font-medium">
        Total de Preguntas: {ALL_QUESTIONS.length}
      </footer>
    </div>
  );
}
