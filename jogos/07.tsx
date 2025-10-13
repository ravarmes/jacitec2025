import React, { useState, useEffect, useCallback } from 'react';
import { Trees, Droplets, Clock, Trophy, Map, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

const MissaoMariana = () => {
  const [gameState, setGameState] = useState('menu');
  const [currentLevel, setCurrentLevel] = useState(1);
  const [playerPos, setPlayerPos] = useState({ x: 1, y: 1 });
  const [timeLeft, setTimeLeft] = useState(60);
  const [dirtCollected, setDirtCollected] = useState(0);
  const [seedsPlanted, setSeedsPlanted] = useState(0);
  const [score, setScore] = useState(0);
  const [maze, setMaze] = useState([]);
  const [collectedItems, setCollectedItems] = useState(new Set());

  const levels = {
    1: {
      size: 9,
      time: 40,
      message: "O desastre de Mariana ocorreu em 2015, quando a barragem de Fundão se rompeu, liberando milhões de metros cúbicos de lama. A contaminação afetou rios, casas e comunidades. Limpar e restaurar o ambiente é essencial para proteger a vida e a biodiversidade da região.",
      image: "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=600&h=400&fit=crop",
      dirtCount: 5,
      seedCount: 3
    },
    2: {
      size: 11,
      time: 40,
      message: "A lama liberada pela barragem atingiu o Rio Doce, afetando água, peixes e a economia local. A recuperação ambiental depende da retirada de resíduos e do replantio de vegetação nativa, para restaurar o equilíbrio ecológico.",
      image: "https://images.unsplash.com/photo-1621451537084-482c73073a0f?w=600&h=400&fit=crop",
      dirtCount: 8,
      seedCount: 5
    },
    3: {
      size: 13,
      time: 40,
      message: "A poluição da lama tem efeitos duradouros: solos contaminados, mortes de animais e impacto na saúde das pessoas. Cada ação de limpeza ajuda a reduzir os danos e permite que a natureza se recupere com mais rapidez.",
      image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&h=400&fit=crop",
      dirtCount: 12,
      seedCount: 7
    },
    4: {
      size: 15,
      time: 50,
      message: "Recuperar o Rio Doce e seus arredores exige esforço contínuo. A conscientização sobre o impacto ambiental e a participação em ações de limpeza e reflorestamento são fundamentais para prevenir novos desastres e proteger o futuro do planeta.",
      image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&h=400&fit=crop",
      dirtCount: 15,
      seedCount: 10
    }
  };

  const generateMaze = useCallback((size, dirtCount, seedCount) => {
    const newMaze = Array(size).fill(null).map(() => Array(size).fill(0));
    
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (i === 0 || i === size - 1 || j === 0 || j === size - 1) {
          newMaze[i][j] = 1;
        }
      }
    }

    const wallDensity = 0.35 + (size / 100);
    for (let i = 2; i < size - 2; i++) {
      for (let j = 2; j < size - 2; j++) {
        if (Math.random() < wallDensity) {
          newMaze[i][j] = 1;
        }
      }
    }

    const visited = new Set();
    const queue = [[1, 1]];
    visited.add('1,1');
    
    while (queue.length > 0) {
      const [y, x] = queue.shift();
      const neighbors = [
        [y - 1, x], [y + 1, x], [y, x - 1], [y, x + 1]
      ];
      
      for (const [ny, nx] of neighbors) {
        if (ny > 0 && ny < size - 1 && nx > 0 && nx < size - 1) {
          const key = `${ny},${nx}`;
          if (!visited.has(key)) {
            visited.add(key);
            if (newMaze[ny][nx] === 1 && Math.random() < 0.3) {
              newMaze[ny][nx] = 0;
            }
            if (newMaze[ny][nx] !== 1) {
              queue.push([ny, nx]);
            }
          }
        }
      }
    }

    newMaze[1][1] = 0;
    newMaze[1][2] = 0;
    newMaze[2][1] = 0;
    newMaze[size - 2][size - 2] = 5;
    newMaze[size - 2][size - 3] = 0;
    newMaze[size - 3][size - 2] = 0;

    let placed = 0;
    const attempts = dirtCount * 10;
    for (let i = 0; i < attempts && placed < dirtCount; i++) {
      const x = Math.floor(Math.random() * (size - 4)) + 2;
      const y = Math.floor(Math.random() * (size - 4)) + 2;
      if (newMaze[y][x] === 0 && visited.has(`${y},${x}`)) {
        newMaze[y][x] = 2;
        placed++;
      }
    }

    placed = 0;
    for (let i = 0; i < attempts && placed < seedCount; i++) {
      const x = Math.floor(Math.random() * (size - 4)) + 2;
      const y = Math.floor(Math.random() * (size - 4)) + 2;
      if (newMaze[y][x] === 0 && visited.has(`${y},${x}`)) {
        newMaze[y][x] = 3;
        placed++;
      }
    }

    const mudCount = Math.floor(size * 0.4);
    for (let i = 0; i < mudCount; i++) {
      const x = Math.floor(Math.random() * (size - 4)) + 2;
      const y = Math.floor(Math.random() * (size - 4)) + 2;
      if (newMaze[y][x] === 0 && visited.has(`${y},${x}`)) {
        newMaze[y][x] = 4;
      }
    }

    return newMaze;
  }, []);

  const startLevel = useCallback((level) => {
    const levelData = levels[level];
    setMaze(generateMaze(levelData.size, levelData.dirtCount, levelData.seedCount));
    setPlayerPos({ x: 1, y: 1 });
    setTimeLeft(levelData.time);
    setDirtCollected(0);
    setSeedsPlanted(0);
    setCollectedItems(new Set());
    setGameState('playing');
  }, [generateMaze]);

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && gameState === 'playing') {
      setGameState('gameover');
    }
  }, [gameState, timeLeft]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (gameState !== 'playing') return;
      
      let newX = playerPos.x;
      let newY = playerPos.y;

      switch(e.key) {
        case 'ArrowUp': newY--; break;
        case 'ArrowDown': newY++; break;
        case 'ArrowLeft': newX--; break;
        case 'ArrowRight': newX++; break;
        default: return;
      }

      if (maze[newY] && maze[newY][newX] !== 1) {
        const cell = maze[newY][newX];
        const itemKey = `${newY}-${newX}`;
        
        if (cell === 2 && !collectedItems.has(itemKey)) {
          setDirtCollected(prev => prev + 1);
          setScore(prev => prev + 10);
          setCollectedItems(prev => new Set([...prev, itemKey]));
        } else if (cell === 3 && !collectedItems.has(itemKey)) {
          setSeedsPlanted(prev => prev + 1);
          setScore(prev => prev + 15);
          setCollectedItems(prev => new Set([...prev, itemKey]));
        } else if (cell === 5) {
          const bonus = Math.floor(timeLeft * 2);
          setScore(prev => prev + bonus);
          setGameState('levelComplete');
        }
        
        setPlayerPos({ x: newX, y: newY });
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState, playerPos, maze, collectedItems, timeLeft]);

  const getCellStyle = (cell, y, x) => {
    const itemKey = `${y}-${x}`;
    const isCollected = collectedItems.has(itemKey);
    
    if (playerPos.y === y && playerPos.x === x) {
      return 'bg-blue-500 border-2 border-blue-700';
    }
    
    switch(cell) {
      case 1: return 'bg-gray-800';
      case 2: return isCollected ? 'bg-green-200' : 'bg-amber-900';
      case 3: return isCollected ? 'bg-green-400' : 'bg-lime-600';
      case 4: return 'bg-yellow-900';
      case 5: return 'bg-cyan-400';
      default: return isCollected ? 'bg-green-100' : 'bg-amber-800';
    }
  };

  const getCellIcon = (cell, y, x) => {
    const itemKey = `${y}-${x}`;
    const isCollected = collectedItems.has(itemKey);
    
    if (playerPos.y === y && playerPos.x === x) {
      return '🚶';
    }
    
    if (isCollected && (cell === 2 || cell === 3)) {
      return '🌱';
    }
    
    switch(cell) {
      case 2: return '💩';
      case 3: return '🌿';
      case 5: return '🚪';
      default: return '';
    }
  };

  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-900 to-green-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl text-center">
          <h1 className="text-4xl font-bold text-green-800 mb-4">🌳 Missão Mariana 🌳</h1>
          <h2 className="text-2xl text-amber-700 mb-6">Limpeza e Reflorestamento</h2>
          <div className="bg-amber-50 p-6 rounded-lg mb-6 text-left">
            <p className="text-gray-700 mb-4">
              Navegue pelos labirintos devastados, coletando sujeira e plantando mudas para restaurar o ambiente após o desastre de Mariana.
            </p>
            <div className="space-y-2">
              <p className="flex items-center gap-2">
                <span className="text-2xl">💩</span> Colete sujeira (+10 pontos)
              </p>
              <p className="flex items-center gap-2">
                <span className="text-2xl">🌿</span> Plante mudas (+15 pontos)
              </p>
              <p className="flex items-center gap-2">
                <span className="text-2xl">🚪</span> Encontre a saída
              </p>
              <p className="flex items-center gap-2">
                <span className="text-2xl">⌨️</span> Use as setas do teclado
              </p>
            </div>
          </div>
          <button
            onClick={() => startLevel(1)}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-xl transition"
          >
            Iniciar Missão
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'playing') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-900 to-green-900 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
            <div className="grid grid-cols-5 gap-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <Map className="text-blue-600" />
                <span className="font-bold">Fase {currentLevel}</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Clock className="text-red-600" />
                <span className="font-bold">{timeLeft}s</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Droplets className="text-amber-600" />
                <span className="font-bold">{dirtCollected} sujeira</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Trees className="text-green-600" />
                <span className="font-bold">{seedsPlanted} mudas</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Trophy className="text-yellow-600" />
                <span className="font-bold">{score} pts</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
            <div className="flex justify-center">
              <div className="inline-block">
                {maze.map((row, y) => (
                  <div key={y} className="flex">
                    {row.map((cell, x) => (
                      <div
                        key={`${y}-${x}`}
                        className={`w-8 h-8 flex items-center justify-center text-xs ${getCellStyle(cell, y, x)}`}
                      >
                        {getCellIcon(cell, y, x)}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-4 text-center">
            <p className="text-gray-600 mb-2">Use as setas do teclado para mover</p>
            <div className="flex justify-center gap-2">
              <div className="flex flex-col items-center gap-1">
                <button className="bg-gray-200 p-2 rounded"><ArrowUp size={20} /></button>
                <div className="flex gap-1">
                  <button className="bg-gray-200 p-2 rounded"><ArrowLeft size={20} /></button>
                  <button className="bg-gray-200 p-2 rounded"><ArrowDown size={20} /></button>
                  <button className="bg-gray-200 p-2 rounded"><ArrowRight size={20} /></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'levelComplete') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-700 to-green-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-3xl w-full">
          <h2 className="text-3xl font-bold text-green-700 mb-4 text-center">
            ✅ Fase {currentLevel} Completa!
          </h2>
          <div className="bg-green-50 p-6 rounded-lg mb-6">
            <div className="grid grid-cols-3 gap-4 text-center mb-4">
              <div>
                <p className="text-gray-600">Sujeira</p>
                <p className="text-2xl font-bold text-amber-700">{dirtCollected}</p>
              </div>
              <div>
                <p className="text-gray-600">Mudas</p>
                <p className="text-2xl font-bold text-green-700">{seedsPlanted}</p>
              </div>
              <div>
                <p className="text-gray-600">Pontuação</p>
                <p className="text-2xl font-bold text-blue-700">{score}</p>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <img 
              src={levels[currentLevel].image} 
              alt="Imagem relacionada ao desastre de Mariana"
              className="w-full h-64 object-cover rounded-lg shadow-lg"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>

          <div className="bg-blue-50 p-6 rounded-lg mb-6">
            <h3 className="font-bold text-lg mb-2 text-blue-900">Você sabia?</h3>
            <p className="text-gray-700 leading-relaxed">
              {levels[currentLevel].message}
            </p>
          </div>
          <div className="flex gap-4 justify-center">
            {currentLevel < 4 ? (
              <button
                onClick={() => {
                  setCurrentLevel(prev => prev + 1);
                  startLevel(currentLevel + 1);
                }}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition"
              >
                Próxima Fase →
              </button>
            ) : (
              <button
                onClick={() => {
                  setGameState('victory');
                }}
                className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-8 rounded-lg transition"
              >
                Ver Resultado Final
              </button>
            )}
            <button
              onClick={() => {
                setGameState('menu');
                setCurrentLevel(1);
                setScore(0);
              }}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-lg transition"
            >
              Menu Principal
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'gameover') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-900 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md text-center">
          <h2 className="text-3xl font-bold text-red-700 mb-4">⏰ Tempo Esgotado</h2>
          <p className="text-gray-700 mb-6">
            Você coletou {dirtCollected} sujeira e plantou {seedsPlanted} mudas.
          </p>
          <p className="text-2xl font-bold text-blue-700 mb-6">Pontuação: {score}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => startLevel(currentLevel)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition"
            >
              Tentar Novamente
            </button>
            <button
              onClick={() => {
                setGameState('menu');
                setCurrentLevel(1);
                setScore(0);
              }}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition"
            >
              Menu Principal
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'victory') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-600 to-green-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl text-center">
          <h2 className="text-4xl font-bold text-green-700 mb-4">🏆 Missão Cumprida! 🏆</h2>
          <p className="text-xl text-gray-700 mb-6">
            Você completou todas as fases da Missão Mariana!
          </p>
          <div className="bg-green-50 p-6 rounded-lg mb-6">
            <p className="text-3xl font-bold text-green-700 mb-2">Pontuação Final</p>
            <p className="text-5xl font-bold text-blue-700">{score}</p>
          </div>
          <div className="bg-blue-50 p-6 rounded-lg mb-6 text-left">
            <p className="text-gray-700 leading-relaxed">
              Parabéns por completar esta jornada de conscientização ambiental! 
              A recuperação do meio ambiente após desastres como o de Mariana é um trabalho contínuo 
              que exige dedicação, conhecimento e participação de todos. Continue aprendendo e 
              contribuindo para a preservação do nosso planeta! 🌍
            </p>
          </div>
          <button
            onClick={() => {
              setGameState('menu');
              setCurrentLevel(1);
              setScore(0);
            }}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition"
          >
            Jogar Novamente
          </button>
        </div>
      </div>
    );
  }
};

export default MissaoMariana;