import React, { useState, useEffect, useRef } from 'react';
import { Waves, Heart, Star, Info, Play, RotateCcw, AlertTriangle, Trophy } from 'lucide-react';

const CoralGame = () => {
  const [gameState, setGameState] = useState('menu');
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(100);
  const [level, setLevel] = useState(1);
  const [items, setItems] = useState([]);
  const [particles, setParticles] = useState([]);
  const [showInfo, setShowInfo] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const gameAreaRef = useRef(null);
  const animationRef = useRef(null);

  const POINTS_PER_LEVEL = 50;
  const MAX_LEVEL = 5;

  const itemTypes = {
    trash: { emoji: '🗑️', points: 10, damage: 5, color: 'bg-red-500', size: 'text-4xl', category: 'lixo' },
    bottle: { emoji: '🍾', points: 15, damage: 7, color: 'bg-red-600', size: 'text-4xl', category: 'lixo' },
    bag: { emoji: '🛍️', points: 12, damage: 6, color: 'bg-red-400', size: 'text-4xl', category: 'lixo' },
    can: { emoji: '🥫', points: 10, damage: 5, color: 'bg-gray-500', size: 'text-3xl', category: 'lixo' },
    straw: { emoji: '🥤', points: 8, damage: 4, color: 'bg-red-300', size: 'text-3xl', category: 'lixo' },
    pollution: { emoji: '💧', penalty: 5, damage: 3, color: 'bg-purple-500', size: 'text-3xl', category: 'poluicao' },
    fish1: { emoji: '🐠', penalty: 10, color: 'bg-orange-400', size: 'text-3xl', category: 'vida' },
    fish2: { emoji: '🐟', penalty: 10, color: 'bg-blue-400', size: 'text-3xl', category: 'vida' },
    fish3: { emoji: '🐡', penalty: 15, color: 'bg-yellow-400', size: 'text-4xl', category: 'vida' },
    turtle: { emoji: '🐢', penalty: 20, color: 'bg-green-500', size: 'text-4xl', category: 'vida' }
  };

  const getSpeedMultiplier = (lvl) => {
    const speeds = {
      1: 0.4,
      2: 0.6,
      3: 0.8,
      4: 1.0,
      5: 1.3
    };
    return speeds[lvl] || 0.4;
  };

  useEffect(() => {
    if (gameState === 'playing') {
      const spawnInterval = setInterval(() => {
        spawnNewItem();
      }, Math.max(600, 1400 - level * 150));

      return () => clearInterval(spawnInterval);
    }
  }, [gameState, level]);

  useEffect(() => {
    if (gameState === 'playing') {
      const animate = () => {
        setItems(prev => {
          const updated = prev.map(item => ({
            ...item,
            y: item.y + item.speed
          }));

          const offScreen = updated.filter(item => item.y > 100);
          
          offScreen.forEach(item => {
            const type = itemTypes[item.type];
            if (type.damage) {
              setHealth(h => Math.max(0, h - type.damage));
            }
          });

          return updated.filter(item => item.y <= 100);
        });

        setParticles(prev => 
          prev.map(p => ({
            ...p,
            y: p.y - 1,
            opacity: p.opacity - 0.02
          })).filter(p => p.opacity > 0)
        );

        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [gameState]);

  useEffect(() => {
    if (health <= 0 && gameState === 'playing') {
      setGameState('gameover');
    }
  }, [health, gameState]);

  useEffect(() => {
    const newLevel = Math.floor(score / POINTS_PER_LEVEL) + 1;
    if (newLevel > level && newLevel <= MAX_LEVEL && score > 0) {
      setLevel(newLevel);
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 3000);
    }
    
    if (score >= POINTS_PER_LEVEL * MAX_LEVEL && gameState === 'playing') {
      setGameState('victory');
    }
  }, [score, level, gameState]);

  const spawnNewItem = () => {
    const types = Object.keys(itemTypes);
    
    let randomType;
    const rand = Math.random();
    
    if (rand < 0.65) {
      const trashTypes = types.filter(t => itemTypes[t].category === 'lixo');
      randomType = trashTypes[Math.floor(Math.random() * trashTypes.length)];
    } else if (rand < 0.85) {
      const lifeTypes = types.filter(t => itemTypes[t].category === 'vida');
      randomType = lifeTypes[Math.floor(Math.random() * lifeTypes.length)];
    } else {
      randomType = 'pollution';
    }
    
    const speedMultiplier = getSpeedMultiplier(level);
    
    const newItem = {
      id: Date.now() + Math.random(),
      type: randomType,
      x: 5 + Math.random() * 80,
      y: -10,
      speed: speedMultiplier + Math.random() * 0.3
    };
    
    setItems(prev => [...prev, newItem]);
  };

  const handleClick = (e) => {
    if (gameState !== 'playing') return;

    const rect = gameAreaRef.current.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    setItems(prev => {
      const clicked = prev.find(item => 
        Math.abs(item.x - clickX) < 8 && Math.abs(item.y - clickY) < 8
      );
      
      if (clicked) {
        const type = itemTypes[clicked.type];
        
        if (type.category === 'lixo') {
          setScore(s => s + type.points);
          createParticle(clicked.x, clicked.y, `+${type.points}`, 'text-green-400');
        } else if (type.category === 'vida') {
          setScore(s => Math.max(0, s - type.penalty));
          setHealth(h => Math.max(0, h - 5));
          createParticle(clicked.x, clicked.y, `-${type.penalty}`, 'text-red-500');
        } else if (type.category === 'poluicao') {
          setScore(s => Math.max(0, s - type.penalty));
          setHealth(h => Math.max(0, h - 3));
          createParticle(clicked.x, clicked.y, `-${type.penalty}`, 'text-purple-500');
        }
        
        return prev.filter(item => item.id !== clicked.id);
      }
      
      return prev;
    });
  };

  const createParticle = (x, y, text, color) => {
    const particle = {
      id: Date.now() + Math.random(),
      x,
      y,
      text,
      color,
      opacity: 1
    };
    setParticles(prev => [...prev, particle]);
  };

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setHealth(100);
    setLevel(1);
    setItems([]);
    setParticles([]);
    setShowInfo(false);
  };

  const resetGame = () => {
    setGameState('menu');
    setScore(0);
    setHealth(100);
    setLevel(1);
    setItems([]);
    setParticles([]);
    setShowInfo(false);
  };

  const pointsToNextLevel = level < MAX_LEVEL ? POINTS_PER_LEVEL - (score % POINTS_PER_LEVEL) : 0;

  return (
    <div className="w-full h-screen bg-gradient-to-b from-cyan-400 via-blue-500 to-blue-900 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div className="w-full max-w-4xl h-full flex items-center justify-center">
        {gameState === 'menu' && (
          <div className="w-full bg-gradient-to-br from-blue-600 to-cyan-500 rounded-3xl shadow-2xl p-4 sm:p-8 text-center text-white">
            <div className="mb-4 sm:mb-6">
              <Waves className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 animate-bounce" />
              <h1 className="text-3xl sm:text-5xl font-bold mb-2">Guardiões dos Corais</h1>
              <h2 className="text-xl sm:text-2xl mb-3 sm:mb-4">de Guarapari - ES</h2>
            </div>
            
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">Como Jogar:</h3>
              <div className="text-left space-y-1 sm:space-y-2 max-w-md mx-auto text-sm sm:text-base">
                <p className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl">✅ 🗑️</span> Clique APENAS no lixo para ganhar pontos!
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl">❌ 🐠</span> NÃO clique nos peixes! Você perde pontos e vida!
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl">❌ 💧</span> NÃO clique na água poluída! Perde pontos!
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl">🎯</span> Chegue ao nível 5 para vencer!
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl">⚡</span> Cada nível fica mais rápido!
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl">❤️</span> Não deixe o lixo chegar aos corais!
                </p>
              </div>
            </div>

            <button
              onClick={startGame}
              className="bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-full text-lg sm:text-xl transition-all transform hover:scale-105 shadow-lg flex items-center gap-2 mx-auto"
            >
              <Play className="w-5 h-5 sm:w-6 sm:h-6" />
              Começar Aventura
            </button>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="relative w-full h-full flex flex-col">
            <div className="bg-white/90 backdrop-blur-sm rounded-t-2xl p-3 sm:p-4 flex justify-between items-center flex-wrap gap-2 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-1 sm:gap-2">
                  <Star className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
                  <span className="font-bold text-lg sm:text-xl">{score}</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm sm:text-base">Nível {level}/{MAX_LEVEL}</span>
                  {level < MAX_LEVEL && <span className="text-xs text-gray-600">Faltam {pointsToNextLevel} pts</span>}
                </div>
              </div>
              
              <div className="flex items-center gap-1 sm:gap-2">
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
                <div className="w-24 sm:w-32 h-3 sm:h-4 bg-gray-300 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-red-500 to-green-500 transition-all duration-300"
                    style={{ width: `${health}%` }}
                  />
                </div>
                <span className="font-bold text-sm sm:text-base">{health}%</span>
              </div>

              <button
                onClick={() => setShowInfo(!showInfo)}
                className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full transition-all"
              >
                <Info className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <div 
              ref={gameAreaRef}
              onClick={handleClick}
              className="relative flex-1 bg-gradient-to-b from-blue-300 via-blue-500 to-blue-800 rounded-b-2xl overflow-hidden cursor-crosshair shadow-2xl"
            >
              <div className="absolute bottom-0 left-0 right-0 h-44 sm:h-52 pointer-events-none">
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-stone-800 via-stone-700 to-stone-600">
                  <div className="absolute inset-0 opacity-30" 
                       style={{
                         backgroundImage: 'radial-gradient(circle at 20% 50%, transparent 2px, rgba(0,0,0,0.3) 3px)',
                         backgroundSize: '8px 8px'
                       }}></div>
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 flex justify-around items-end h-full px-1 sm:px-3">
                  
                  <div className="relative" style={{ bottom: '60px', left: '10px' }}>
                    <div className="relative w-20 h-16 rounded-full bg-gradient-to-br from-pink-300 via-pink-500 to-pink-700 shadow-2xl">
                      <svg className="absolute inset-0 w-full h-full opacity-60" viewBox="0 0 100 100">
                        <path d="M20,30 Q30,20 40,30 T60,30 T80,30" stroke="rgba(255,255,255,0.3)" strokeWidth="2" fill="none"/>
                        <path d="M20,45 Q30,35 40,45 T60,45 T80,45" stroke="rgba(255,255,255,0.3)" strokeWidth="2" fill="none"/>
                        <path d="M20,60 Q30,50 40,60 T60,60 T80,60" stroke="rgba(255,255,255,0.3)" strokeWidth="2" fill="none"/>
                        <path d="M25,75 Q35,65 45,75 T65,75" stroke="rgba(255,255,255,0.3)" strokeWidth="2" fill="none"/>
                      </svg>
                      <div className="absolute inset-0 bg-gradient-to-t from-pink-800/40 to-transparent rounded-full"></div>
                    </div>
                  </div>

                  <div className="relative" style={{ bottom: '50px' }}>
                    <div className="relative">
                      <div className="w-4 h-12 bg-gradient-to-t from-amber-700 to-amber-500 mx-auto rounded-sm"></div>
                      <div className="w-16 h-3 bg-gradient-to-br from-amber-400 to-amber-600 rounded-t-lg shadow-lg relative -top-1">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-300/30 to-transparent"></div>
                      </div>
                    </div>
                  </div>

                  <div className="relative" style={{ bottom: '55px' }}>
                    <div className="relative w-14 h-24">
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-20 bg-gradient-to-t from-red-700 via-orange-600 to-yellow-500 rounded-t-lg shadow-lg">
                        <div className="absolute inset-0 opacity-40" 
                             style={{
                               backgroundImage: 'linear-gradient(to top, transparent, rgba(255,255,255,0.2))'
                             }}></div>
                      </div>
                      <div className="absolute bottom-10 left-0 w-4 h-10 bg-gradient-to-t from-red-600 to-orange-500 rounded-t-lg transform -rotate-20 shadow-md"></div>
                      <div className="absolute bottom-12 right-0 w-4 h-8 bg-gradient-to-t from-red-600 to-orange-500 rounded-t-lg transform rotate-25 shadow-md"></div>
                      <div className="absolute bottom-14 left-2 w-3 h-6 bg-gradient-to-t from-orange-600 to-yellow-500 rounded-t-lg transform -rotate-10 shadow-sm"></div>
                    </div>
                  </div>

                  <div className="relative flex gap-1" style={{ bottom: '45px' }}>
                    {[65, 55, 70, 60, 75].map((height, i) => (
                      <div key={`tube-${i}`} className="relative" style={{ height: `${height}px`, width: '10px' }}>
                        <div className="absolute bottom-0 w-full h-full bg-gradient-to-t from-purple-800 via-purple-600 to-purple-400 rounded-t-full shadow-lg"
                             style={{
                               animation: `pulse ${2.5 + i * 0.2}s ease-in-out infinite`,
                               animationDelay: `${i * 0.3}s`
                             }}>
                          <div className="absolute top-0 left-0 right-0 h-2 bg-white/40 rounded-t-full"></div>
                          <div className="absolute inset-0 opacity-20"
                               style={{
                                 backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                                 backgroundSize: '4px 4px'
                               }}></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="relative" style={{ bottom: '52px' }}>
                    <div className="relative w-12 h-12">
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-4 bg-gradient-to-t from-teal-800 to-teal-600 rounded-full"></div>
                      {[...Array(12)].map((_, i) => (
                        <div key={`tentacle-${i}`}
                             className="absolute w-1.5 bg-gradient-to-t from-teal-600 via-cyan-400 to-cyan-200 rounded-t-full"
                             style={{
                               height: `${20 + Math.random() * 10}px`,
                               left: '50%',
                               bottom: '4px',
                               transform: `rotate(${i * 30}deg) translateX(-50%)`,
                               transformOrigin: 'bottom center',
                               animation: `sway ${1.8 + i * 0.1}s ease-in-out infinite`,
                               animationDelay: `${i * 0.08}s`
                             }}>
                          <div className="absolute top-0 left-0 right-0 h-1 bg-white/60 rounded-full"></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="relative" style={{ bottom: '48px' }}>
                    <div className="relative w-12 h-20">
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-16 bg-gradient-to-t from-amber-700 to-amber-400 rounded-t-lg">
                        <div className="absolute top-4 -left-2 w-2 h-10 bg-gradient-to-t from-amber-600 to-amber-300 rounded-t-lg transform -rotate-35"></div>
                        <div className="absolute top-4 -right-2 w-2 h-10 bg-gradient-to-t from-amber-600 to-amber-300 rounded-t-lg transform rotate-35"></div>
                        <div className="absolute top-8 -left-3 w-1.5 h-6 bg-gradient-to-t from-amber-500 to-yellow-300 rounded-t-full transform -rotate-45"></div>
                        <div className="absolute top-8 -right-3 w-1.5 h-6 bg-gradient-to-t from-amber-500 to-yellow-300 rounded-t-full transform rotate-45"></div>
                      </div>
                    </div>
                  </div>

                </div>
                
                <div className="absolute bottom-0 left-0 right-0 flex justify-around items-end">
                  {[...Array(20)].map((_, i) => (
                    <div key={`algae-${i}`}
                         className="rounded-t-full opacity-70"
                         style={{ 
                           width: '3px',
                           height: `${15 + Math.random() * 25}px`,
                           background: `linear-gradient(to top, ${i % 3 === 0 ? '#065f46' : i % 3 === 1 ? '#047857' : '#059669'}, ${i % 3 === 0 ? '#34d399' : i % 3 === 1 ? '#6ee7b7' : '#86efac'})`,
                           animation: `sway ${1.5 + Math.random()}s ease-in-out infinite`,
                           animationDelay: `${i * 0.05}s`
                         }}></div>
                  ))}
                </div>
              </div>

              {items.map(item => {
                const itemData = itemTypes[item.type];
                return (
                  <div
                    key={item.id}
                    className={`absolute text-2xl sm:${itemData.size} cursor-pointer transition-opacity hover:opacity-80`}
                    style={{ 
                      left: `${item.x}%`, 
                      top: `${item.y}%`,
                      transform: 'translate(-50%, -50%)',
                      zIndex: 10
                    }}
                  >
                    <div className={`${itemData.color} rounded-full p-1 sm:p-2 shadow-lg`}>
                      {itemData.emoji}
                    </div>
                  </div>
                );
              })}

              {particles.map(p => (
                <div
                  key={p.id}
                  className={`absolute font-bold text-xl sm:text-2xl ${p.color} transition-all pointer-events-none`}
                  style={{ 
                    left: `${p.x}%`, 
                    top: `${p.y}%`,
                    opacity: p.opacity,
                    transform: 'translate(-50%, -50%)',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                    zIndex: 20
                  }}
                >
                  {p.text}
                </div>
              ))}

              {showLevelUp && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-6 sm:p-8 shadow-2xl z-30 animate-bounce">
                  <h3 className="text-2xl sm:text-4xl font-bold text-white mb-2 text-center">🎉 NÍVEL {level}! 🎉</h3>
                  <p className="text-lg sm:text-xl text-white text-center">
                    {level === 2 && "Ficou mais rápido!"}
                    {level === 3 && "Velocidade aumentando!"}
                    {level === 4 && "Quase lá! Continue!"}
                    {level === 5 && "NÍVEL MÁXIMO! Termine forte!"}
                  </p>
                </div>
              )}

              {showInfo && (
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-2xl p-3 sm:p-4 shadow-xl max-w-xs z-30">
                  <h3 className="font-bold text-base sm:text-lg mb-2 text-blue-900">🌊 Sobre Guarapari</h3>
                  <p className="text-xs sm:text-sm text-gray-700 mb-2">
                    Os recifes de coral de Guarapari são tesouros naturais que abrigam vida marinha rica e protegem nossas praias.
                  </p>
                  <p className="text-xs text-gray-600">
                    Cada ação conta para preservar esse ecossistema único do Espírito Santo!
                  </p>
                </div>
              )}
            </div>

            <style>{`
              @keyframes sway {
                0%, 100% { transform: rotate(-5deg); }
                50% { transform: rotate(5deg); }
              }
              @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-15px); }
              }
            `}</style>
          </div>
        )}

        {gameState === 'victory' && (
          <div className="w-full bg-gradient-to-br from-green-500 to-teal-600 rounded-3xl shadow-2xl p-4 sm:p-8 text-center text-white max-h-screen overflow-y-auto">
            <Trophy className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 text-yellow-300 animate-bounce" />
            <h2 className="text-3xl sm:text-5xl font-bold mb-3 sm:mb-4">🎉 VITÓRIA! 🎉</h2>
            
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
              <p className="text-xl sm:text-2xl mb-3 sm:mb-4">
                Pontuação Final: <span className="font-bold text-yellow-300 text-2xl sm:text-4xl">{score}</span>
              </p>
              <p className="text-lg sm:text-xl">Você completou todos os 5 níveis!</p>
            </div>

            <div className="bg-green-900/40 backdrop-blur-sm rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 text-left">
              <h3 className="text-xl sm:text-2xl font-bold mb-3 flex items-center gap-2">
                <span>🌊</span> Esperança para os Corais de Guarapari!
              </h3>
              
              <div className="space-y-3 text-sm sm:text-base">
                <p className="leading-relaxed">
                  <strong>🎊 Parabéns, Guardião!</strong> Você demonstrou que é possível proteger nossos recifes de coral através de ações conscientes e determinação.
                </p>
                
                <p className="leading-relaxed">
                  <strong>🪸 A Importância dos Corais:</strong> Os recifes de Guarapari são lar de mais de 200 espécies marinhas e protegem nossas praias da erosão. Eles são essenciais para o equilíbrio do ecossistema marinho capixaba.
                </p>
                
                <p className="leading-relaxed">
                  <strong>🌍 Mudanças Reais:</strong> Quando comunidades se unem para proteger o meio ambiente, os resultados são transformadores. Pequenas ações diárias fazem grande diferença!
                </p>
                
                <div className="bg-teal-500/30 border-2 border-teal-300 rounded-lg p-3 mt-4">
                  <p className="font-bold text-teal-100 mb-2">💚 COMO VOCÊ PODE AJUDAR OS CORAIS:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong>Reduza o uso de plástico:</strong> Use sacolas reutilizáveis e evite canudos</li>
                    <li><strong>Protetor solar biodegradável:</strong> Protege você e os corais</li>
                    <li><strong>Não toque nos corais:</strong> Ao mergulhar, admire à distância</li>
                    <li><strong>Participe de limpezas:</strong> Junte-se a grupos de limpeza de praias</li>
                    <li><strong>Denuncie poluição:</strong> Ligue 190 ou contate órgãos ambientais</li>
                    <li><strong>Eduque outros:</strong> Compartilhe o que aprendeu</li>
                    <li><strong>Apoie turismo sustentável:</strong> Escolha operadoras conscientes</li>
                    <li><strong>Economize água:</strong> Menos esgoto = oceanos mais limpos</li>
                  </ul>
                </div>
                
                <p className="leading-relaxed text-center font-bold text-lg text-yellow-200 mt-4">
                  ✨ Juntos podemos garantir que as futuras gerações também possam apreciar a beleza dos corais de Guarapari! ✨
                </p>
              </div>
            </div>

            <div className="flex gap-3 sm:gap-4 justify-center flex-wrap">
              <button
                onClick={startGame}
                className="bg-yellow-400 hover:bg-yellow-500 text-green-900 font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-full transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                Jogar Novamente
              </button>
              <button
                onClick={resetGame}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-full transition-all transform hover:scale-105 shadow-lg"
              >
                Menu Principal
              </button>
            </div>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="w-full bg-gradient-to-br from-red-600 to-orange-700 rounded-3xl shadow-2xl p-4 sm:p-8 text-center text-white max-h-screen overflow-y-auto">
            <AlertTriangle className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 text-yellow-300 animate-pulse" />
            <h2 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4">⚠️ Corais em Perigo!</h2>
            
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
              <p className="text-lg sm:text-xl mb-3 sm:mb-4">
                Pontuação Final: <span className="font-bold text-yellow-300 text-2xl sm:text-3xl">{score}</span>
              </p>
              <p className="text-base sm:text-lg mb-2">Nível Alcançado: {level}/{MAX_LEVEL}</p>
            </div>

            <div className="bg-red-900/40 backdrop-blur-sm rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 text-left">
              <h3 className="text-xl sm:text-2xl font-bold mb-3 flex items-center gap-2">
                <span>🔴</span> A Realidade dos Corais de Guarapari
              </h3>
              
              <div className="space-y-3 text-sm sm:text-base">
                <p className="leading-relaxed">
                  <strong>📍 Situação Crítica:</strong> Os recifes de coral de Guarapari, no Espírito Santo, enfrentam sérios riscos devido à poluição marinha, especialmente plásticos e resíduos urbanos que chegam ao oceano.
                </p>
                
                <p className="leading-relaxed">
                  <strong>🌡️ Aquecimento Global:</strong> O aumento da temperatura da água está causando o branqueamento dos corais, tornando-os mais vulneráveis e ameaçando todo o ecossistema marinho local.
                </p>
                
                <p className="leading-relaxed">
                  <strong>🏖️ Turismo Desordenado:</strong> O pisoteio nos corais, a poluição por protetor solar e o descarte inadequado de lixo nas praias estão destruindo esses organismos que levam décadas para crescer.
                </p>
                
                <p className="leading-relaxed">
                  <strong>🐠 Perda de Biodiversidade:</strong> Com a degradação dos corais, mais de 200 espécies marinhas que dependem deles para abrigo e alimentação estão em risco, incluindo peixes, crustáceos e moluscos.
                </p>
                
                <p className="leading-relaxed">
                  <strong>💧 Qualidade da Água:</strong> Esgoto não tratado e poluentes químicos continuam sendo despejados próximo aos recifes, comprometendo a saúde dos corais e de toda vida marinha.
                </p>
                
                <div className="bg-yellow-400/20 border-2 border-yellow-400 rounded-lg p-3 mt-4">
                  <p className="font-bold text-yellow-200 mb-2">✊ O QUE VOCÊ PODE FAZER:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Nunca jogue lixo na praia ou no mar</li>
                    <li>Use protetores solares biodegradáveis</li>
                    <li>Não toque ou pise nos corais durante mergulhos</li>
                    <li>Participe de ações de limpeza de praias</li>
                    <li>Denuncie poluição e crimes ambientais</li>
                    <li>Eduque outras pessoas sobre a importância dos corais</li>
                    <li>Apoie ONGs de conservação marinha</li>
                    <li>Escolha operadoras de turismo sustentável</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3 sm:gap-4 justify-center flex-wrap">
              <button
                onClick={startGame}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-full transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                Tentar Novamente
              </button>
              <button
                onClick={resetGame}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-full transition-all transform hover:scale-105 shadow-lg"
              >
                Menu Principal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoralGame;