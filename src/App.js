import logo from './logo.svg';
import './App.css';
import React, { useState, useEffect, useRef} from 'react';

function App() {
  const [activeKeys, setActiveKeys] = useState(new Set()); // Esto se cambió a un Set, para poder tocar múltiples teclas al mismo tiempo 
  const audioContextRef = useRef(null);
  const activeOscillatorsRef = useRef({}); // Para rastrear osciladores activos
  const pressedKeysRef = useRef(new Set()); // Para evitar repetición de teclas

  //Incializar el audio para Web Audio API (AudioContext) o Safari y otros navegadores viejos (webkitAudioContext)
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Frecuencias de las notas Hz
  const noteFrequencies = {
    'do': 261.63,
    'do#': 277.18,
    're': 293.66,
    're#': 311.13,
    'mi': 329.63,
    'fa': 349.23,
    'fa#': 369.99,
    'sol': 392.00,
    'sol#': 415.30,
    'la': 440.00,
    'la#': 466.16,
    'si': 493.88
  };

  //First piano notes
  const whiteKeys = [
    {note: 'do', key: 'a'},
    {note: 're', key: 's'},
    {note: 'mi', key: 'd'},
    {note: 'fa', key: 'f'},
    {note: 'sol', key: 'g'},
    {note: 'la', key: 'h'},
    {note: 'si', key: 'j'},
  ];

  //The sharp notes
  const blackKeys = [
    {note: 'do#', key: 'w'},
    {note: 're#', key: 'e'},
    {note: 'fa#', key: 't'},
    {note: 'sol#', key: 'y'},
    {note: 'la#', key: 'u'},
  ];

  const startNote = (note) => {
    // Si la nota ya está sonando, no hacer nada, asi no hace brrbbrbrbrrb to' feo
    if (activeOscillatorsRef.current[note]) return;

    const audioContext = audioContextRef.current;
    if (!audioContext) return;

    // Crear oscilador para el sonido (generar vibraciones)
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    // Configurar el tipo de onda y frecuencia (Seno para que sea suave como un piano )
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(noteFrequencies[note], audioContext.currentTime);

    // Configurar el volumen con envelope (ataque) 
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);

    // Conectar oscilador -> ganancia -> salida
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Reproducir el sonido
    oscillator.start(audioContext.currentTime);

    // Guardar referencia al oscilador y gainNode
    activeOscillatorsRef.current[note] = { oscillator, gainNode };

    // Actualizar teclas activas visualmente
    setActiveKeys(prev => new Set([...prev, note]));
  };

  const stopNote = (note) => {
    const nodes = activeOscillatorsRef.current[note];
    if (!nodes) return;

    const audioContext = audioContextRef.current;
    if (!audioContext) return;

    // Aplicar decaimiento suave
    nodes.gainNode.gain.cancelScheduledValues(audioContext.currentTime);
    nodes.gainNode.gain.setValueAtTime(nodes.gainNode.gain.value, audioContext.currentTime);
    nodes.gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    // Detener el oscilador después del decaimiento
    nodes.oscillator.stop(audioContext.currentTime + 0.3);

    // Limpiar la referencia
    delete activeOscillatorsRef.current[note];

    // Actualizar teclas activas visualmente
    setActiveKeys(prev => {
      const newSet = new Set(prev);
      newSet.delete(note);
      return newSet;
    });
  };

  const playSound = (note) => {
    startNote(note);
    // Detener automáticamente después de un tiempo para clicks del mouse
    setTimeout(() => stopNote(note), 300);
  };

  // Manejar eventos del teclado
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Evitar repetición cuando se mantiene presionada la tecla
      if (event.repeat) return;

      const key = event.key.toLowerCase();
      
      // Evitar que se active múltiples veces
      if (pressedKeysRef.current.has(key)) return;
      pressedKeysRef.current.add(key);
      
      // Buscar la nota correspondiente a la tecla presionada
      const whiteKey = whiteKeys.find(k => k.key === key);
      const blackKey = blackKeys.find(k => k.key === key);
      
      if (whiteKey) {
        startNote(whiteKey.note);
      } else if (blackKey) {
        startNote(blackKey.note);
      }
    };

    const handleKeyUp = (event) => {
      const key = event.key.toLowerCase();
      
      // Remover de teclas presionadas
      pressedKeysRef.current.delete(key);
      
      // Buscar la nota correspondiente
      const whiteKey = whiteKeys.find(k => k.key === key);
      const blackKey = blackKeys.find(k => k.key === key);
      
      if (whiteKey) {
        stopNote(whiteKey.note);
      } else if (blackKey) {
        stopNote(blackKey.note);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div className="App">
      <h1>🎹 Tremendo Piano</h1>

      <div className="piano">
        <div className="white-keys">
          {whiteKeys.map((key) => (
            <button
            key={key.note}
            className={'white-key ' + (activeKeys.has(key.note) ? 'active' : '')}
            onMouseDown={() => startNote(key.note)}
            onMouseUp={() => stopNote(key.note)}
            onMouseLeave={() => stopNote(key.note)}
            onClick={(e) => e.preventDefault()} // Evitar doble activación
            >
              <span className="note-label">{key.note}</span>
              <span className="key-label">({key.key})</span>
            </button>
          ))}
        </div>
      
        <div className="black-keys">
          {blackKeys.map((key, index) => (
            <button
              key={key.note}
              className={'black-key ' + (activeKeys.has(key.note) ? 'active' : '')}
              onMouseDown={() => startNote(key.note)}
              onMouseUp={() => stopNote(key.note)}
              onMouseLeave={() => stopNote(key.note)}
              onClick={(e) => e.preventDefault()}
              style={{left: `${[1, 2, 4, 5, 6][index] * 14.28 - 2}%`}}
            >
              <span className="key-label">({key.key})</span>
            </button>
          ))}
        </div>
      </div>
      
      <p className="instructions">
        Teclas blancas: A, S, D, F, G, H, J | Teclas negras: W, E, T, Y, U
      </p>
    </div>
  );
}

export default App;