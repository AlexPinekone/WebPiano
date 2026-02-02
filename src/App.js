import logo from './logo.svg';
import './App.css';
import React, { useState, useEffect, useRef} from 'react';

function App() {
  const [activeKey, setActiveKey] = useState(null);
  const audioContextRef = useRef(null);

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
    {note: 'do#', key: 'w', position: 1},
    {note: 're#', key: 'e', position: 2},
    {note: 'fa#', key: 't', position: 4},
    {note: 'sol#', key: 'y', position: 5},
    {note: 'la#', key: 'u', position: 6},
  ];

  const playSound = (note) => {
    setActiveKey(note);
    console.log(`Note: ${note}`);

    const audioContext = audioContextRef.current;
    if (!audioContext) return;

    // Crear oscilador para el sonido (crear sonido)
    const oscillator = audioContext.createOscillator();
    // Crear nodo de ganancia para controlar el volumen
    const gainNode = audioContext.createGain();

    // Configurar el tipo de onda y frecuencia (Seno para que sea suave como un piano )
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(noteFrequencies[note], audioContext.currentTime);

     // Configurar el volumen con envelope (ataque y decaimiento) <- Para que suene y luego caiga
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01); // Ataque
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.5); // Decaimiento

    // Conectar oscilador -> ganancia -> salida
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Reproducir el sonido
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 1.5);

    // Quitar efecto visual
    setTimeout(() => setActiveKey(null), 200);
  };

  // Manejar eventos del teclado
  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();
      
      // Buscar la nota correspondiente a la tecla presionada
      const whiteKey = whiteKeys.find(k => k.key === key);
      const blackKey = blackKeys.find(k => k.key === key);
      
      if (whiteKey) {
        playSound(whiteKey.note);
      } else if (blackKey) {
        playSound(blackKey.note);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="App">
      <h1>Super Piano</h1>

      <div className="piano">
        <div class="white-keys">
          {whiteKeys.map((key) => (
            <button
            key={key.note}
            className={'white-key ' + (key.note === activeKey ? 'active' : '')}
            onClick={() => playSound(key.note)}
            >
              <span className="note-label">{key.note}</span>
              <span className="key-label">({key.key})</span>
            </button>
          ))}
        </div>
      

      <div className="black-keys">
        {blackKeys.map((key) => (
          <button
            key={key.note}
            className={'black-key ' + (key.note === activeKey ? ' active' : '')}
            onClick={() => playSound(key.note)}
            style = {{left: `${key.position * 14.28 - 2}%`}}
          >
            <span className="note-label">{key.note}</span>
            <span className="key-label">({key.key})</span>
          </button>
        ))}
      </div>
      </div>
      <p className="instructions">
        Haz clic en las teclas o usa el teclado (a, s, d, f, g, h, j para blancas / w, e, t, y, u para negras)
      </p>

    </div>
  );
}

export default App;
