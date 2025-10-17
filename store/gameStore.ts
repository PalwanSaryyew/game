import { create } from 'zustand';

// --- Tür Tanımları ---
type Move = 'ROCK' | 'PAPER' | 'SCISSORS' | null;
type GameStatus = 'WAITING_FOR_PLAYER' | 'SELECTION' | 'ROUND_END' | 'GAME_OVER';
type PlayerSide = 'PLAYER_1' | 'PLAYER_2';

interface GameState {
  // Oda Bilgisi
  roomId: string | null;
  playerSide: PlayerSide | null; // Oyuncunun bu odadaki tarafı (P1 veya P2)

  // Oyun Durumu
  status: GameStatus;
  round: number;
  score: {
    [key in PlayerSide]: number;
  };
  
  // Hareket Bilgisi
  myMove: Move;
  opponentMove: Move; // 'ROUND_END' durumunda açığa çıkar
  opponentMadeMove: boolean; // Rakibin seçim yaptığını gösterir (Gizlilik için)
  
  // Sunucu İletişimi
  isConnecting: boolean;
  error: string | null;
}

interface GameActions {
  // Temel Eylemler
  setRoom: (id: string, side: PlayerSide) => void;
  setGameStatus: (status: GameStatus) => void;
  resetGame: () => void;
  setError: (message: string | null) => void;
  
  // Oyun İçi Eylemler
  makeMove: (move: Move) => void;
  setOpponentMoveStatus: (madeMove: boolean) => void; // Rakibin hareketini gizli olarak güncelle
  
  // Sunucudan Gelen Güncellemeler (Socket veya Realtime)
  updateRoundResults: (
    newScore: { P1: number, P2: number }, 
    opponentMove: Move, 
    nextRound: number
  ) => void;
}

const initialState: GameState = {
  roomId: null,
  playerSide: null,
  status: 'WAITING_FOR_PLAYER',
  round: 1,
  score: {
    PLAYER_1: 0,
    PLAYER_2: 0,
  },
  myMove: null,
  opponentMove: null,
  opponentMadeMove: false,
  isConnecting: false,
  error: null,
};

export const useGameStore = create<GameState & GameActions>((set) => ({
  ...initialState,
  
  // --- Eylemlerin Uygulanması ---

  setRoom: (id, side) => set({ 
    roomId: id, 
    playerSide: side,
    status: 'SELECTION', // Oda bulundu/katılındı
    isConnecting: false,
  }),
  
  setGameStatus: (status) => set({ status }),
  
  resetGame: () => set(initialState),
  
  setError: (message) => set({ error: message }),

  setOpponentMoveStatus: (madeMove) => set({ opponentMadeMove: madeMove }),
  
  makeMove: (move) => set({ 
    myMove: move,
    // Hareket yapıldıktan sonra sunucuya iletilecek.
    // Durum: SELECTION olarak kalır (rakip beklenir)
  }),

  updateRoundResults: (newScore, opponentMove, nextRound) => set((state) => ({
    score: {
      PLAYER_1: newScore.P1,
      PLAYER_2: newScore.P2,
    },
    opponentMove: opponentMove, // Rakibin hamlesi artık görünür
    round: nextRound,
    status: 'ROUND_END', // Sonuçları göster
    // Bir sonraki adıma geçiş için bir gecikme (delay) ile tekrar SELECTION'a dönülecek
  })),

  // Not: Yeni tura hazırlanma (SELECTION'a dönme) eylemi de eklenmelidir.
  prepareNextRound: () => set((state) => ({
    status: 'SELECTION',
    myMove: null, // Oyuncunun seçimini sıfırla
    opponentMove: null,
    opponentMadeMove: false,
  })),
}));