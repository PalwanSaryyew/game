"use client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { GiPerspectiveDiceSixFacesRandom } from "react-icons/gi";
import { PiHand, PiHandFistLight, PiHandPeaceLight } from "react-icons/pi";

// Type'ları tanımlıyoruz
type HandChoice = "rock" | "paper" | "scissors";
type PlayerChoice = HandChoice | "random";
// Yeni "startScreen" durumunu ekledik
type GameState =
   | "startScreen"
   | "choosing"
   | "revealing"
   | "result"
   | "roundEnd"
   | "gameOver";

// Oyuncuların el resimlerini yönetmek için bir yardımcı fonksiyon
const getHandImage = (choice: HandChoice | null /* isOpponent: boolean */) => {
   if (choice === null) return "/assets/male_idle.svg";
   switch (choice) {
      case "rock":
         return "/assets/male_rock.svg";
      case "paper":
         return "/assets/male_paper.svg";
      case "scissors":
         return "/assets/male_scissors.svg";
      default:
         return "/assets/male_idle.svg";
   }
};

export default function Home() {
   // === STATE MANAGEMENT ===
   // Oyunu "startScreen" durumuyla başlat
   const [gameState, setGameState] = useState<GameState>("startScreen");
   const [roundMessage, setRoundMessage] = useState("");
   const [totalPoint /* setTotalPoint */] = useState(3);

   const [player1Score, setPlayer1Score] = useState(0);
   const [player2Score, setPlayer2Score] = useState(0);

   const [player1Choice, setPlayer1Choice] = useState<HandChoice | null>(null);
   const [player2Choice, setPlayer2Choice] = useState<HandChoice | null>(null);

   const [timer, setTimer] = useState(10);
   const INITIAL_TIMER_VALUE = 10;

   // === HELPER FUNCTIONS ===
   // Rastgele bir el seçimi döndüren fonksiyon
   const randomChoice = (): HandChoice => {
      const choices: HandChoice[] = ["rock", "paper", "scissors"];
      const randomNumber = Math.floor(Math.random() * 3);
      return choices[randomNumber];
   };

   // === CORE GAME LOGIC ===
   // Oyuncunun seçimini işleyen fonksiyon
   const handleHandChoice = (choice: PlayerChoice) => {
      // Sadece seçim aşamasındayken seçim yapılmasına izin ver
      if (gameState !== "choosing") return;
      setPlayer1Choice(choice === "random" ? randomChoice() : choice);
   };

   // Kazananı belirleyen fonksiyon
   const determineWinner = useCallback((p1: HandChoice, p2: HandChoice) => {
      if (p1 === p2) {
         setRoundMessage("Deňme-deň!"); // Berabere!
         return;
      }

      const player1Wins =
         (p1 === "rock" && p2 === "scissors") ||
         (p1 === "paper" && p2 === "rock") ||
         (p1 === "scissors" && p2 === "paper");

      if (player1Wins) {
         setRoundMessage("Siz ýeňdiňiz!"); // Siz yendiniz!
         setPlayer1Score((prev) => prev + 1);
      } else {
         setRoundMessage("Garşydaş ýeňdi!"); // Karşı taraf yendi!
         setPlayer2Score((prev) => prev + 1);
      }
   }, []);

   // Sıradaki tura geçişi yöneten fonksiyon
   const handleNextRound = () => {
      setGameState("choosing");
      setPlayer1Choice(null);
      setPlayer2Choice(null);
      setRoundMessage("");
      setTimer(INITIAL_TIMER_VALUE);
   };

   // Oyunu başlatan fonksiyon
   const handleStartGame = () => {
      setGameState("choosing");
      setTimer(INITIAL_TIMER_VALUE);
   };

   // Oyunu yeniden başlatan fonksiyon
   const handlePlayAgain = () => {
      setGameState("startScreen"); // "choosing" yerine "startScreen" e dön
      setPlayer1Score(0);
      setPlayer2Score(0);
      setPlayer1Choice(null);
      setPlayer2Choice(null);
      setRoundMessage("");
      setTimer(INITIAL_TIMER_VALUE);
   };

   // === EFFECTS ===
   // Zamanlayıcıyı yöneten useEffect
   useEffect(() => {
      // Sadece "choosing" durumundayken zamanlayıcıyı çalıştır
      if (gameState !== "choosing") {
         return;
      }

      if (timer === 0) {
         // Zaman dolduğunda seçimleri belirle ve açıklama aşamasına geç
         const finalP1Choice = player1Choice ?? randomChoice();
         const finalP2Choice = randomChoice(); // Botun seçimi burada rastgele yapılıyor

         setPlayer1Choice(finalP1Choice);
         setPlayer2Choice(finalP2Choice);
         determineWinner(finalP1Choice, finalP2Choice);
         setGameState("revealing");
         return;
      }

      const interval = setInterval(() => {
         setTimer((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(interval);
   }, [timer, gameState, player1Choice, determineWinner]); // player1Choice'ı bağımlılıklardan çıkardım, gereksiz tetiklemeyi önler

   // Oyun durumları arasındaki geçişi yöneten useEffect
   useEffect(() => {
      if (gameState === "revealing") {
         // 2 saniye sonra sonuçları göster
         const timeout = setTimeout(() => {
            setGameState("result");
         }, 2000); // El resimleri 2 saniye gösterilir
         return () => clearTimeout(timeout);
      }

      if (gameState === "result") {
         // Oyunun bitip bitmediğini kontrol et
         if (player1Score >= totalPoint || player2Score >= totalPoint) {
            setRoundMessage(
               player1Score > player2Score ? "Ýeňdiň!" : "Ýeňildiň!"
            );
            setGameState("gameOver");
            return;
         }

         // 2 saniye sonra "Sıradaki Tur" aşamasına geç
         const timeout = setTimeout(() => {
            setGameState("roundEnd");
         }, 2000); // Sonuç mesajı 2 saniye gösterilir
         return () => clearTimeout(timeout);
      }
   }, [gameState, player1Score, player2Score, totalPoint]);

   return (
      <div className="bg-gradient-to-b from-blue-800 to-red-800 min-h-screen flex flex-col relative">
         {/* Overlay for Messages and Buttons */}
         <div
            className={cn(
               "fixed top-0 bottom-0 right-0 left-0 bg-accent/50 z-10 backdrop-blur-sm items-center justify-center",
               // "startScreen" durumunu da görünür yap
               gameState === "startScreen" ||
                  gameState === "result" ||
                  gameState === "roundEnd" ||
                  gameState === "gameOver"
                  ? "flex flex-col space-y-4"
                  : "hidden"
            )}
         >
            {/* Başlatma Düğmesi */}
            {gameState === "startScreen" && (
               <Button
                  onClick={handleStartGame}
                  className="text-5xl p-10 border-primary-foreground border-2 shadow-2xl shadow-accent active:scale-95 active:border-3 select-none"
               >
                  Oýuna Başla
               </Button>
            )}

            {/* Sonuç Mesajı */}
            {(gameState === "result" || gameState === "gameOver") && (
               <p className="text-5xl font-bold text-white text-center p-4">
                  {roundMessage}
               </p>
            )}

            {/* Sıradaki Tur Düğmesi */}
            {gameState === "roundEnd" && (
               <Button
                  onClick={handleNextRound}
                  className="text-5xl p-10 border-primary-foreground border-2 shadow-2xl shadow-accent active:scale-95 active:border-3 select-none"
               >
                  Indiki Tur
               </Button>
            )}

            {/* Oyun Bittiğinde Yeniden Oyna Düğmesi */}
            {gameState === "gameOver" && (
               <Button
                  onClick={handlePlayAgain}
                  className="text-3xl p-8 border-primary-foreground border-2 shadow-2xl shadow-accent active:scale-95 active:border-3 select-none"
               >
                  Täzeden Oýna
               </Button>
            )}
         </div>

         {/* player 2 area (Opponent) */}
         <div className="flex-1 relative flex items-center justify-center">
            <Image
               src={getHandImage(player2Choice /* true */)}
               alt="Player 2 Hand"
               layout="fill"
               objectFit="contain"
               className={cn(
                  gameState === "revealing" ? "scale-y-125" : "-translate-y-26",
                  "rotate-180 p-4 transition-all duration-500 linear "
               )}
            />
         </div>

         {/* player 1 area (You) */}
         <div className="flex-1 relative flex items-center justify-center">
            <Image
               src={getHandImage(player1Choice /* false */)}
               alt="Player 1 Hand"
               layout="fill"
               objectFit="contain"
               className={cn(
                  gameState === "revealing" ? "scale-y-125" : "translate-y-26",
                  "p-4 transition-all duration-500 linear "
               )}
            />
         </div>

         {/* buttons */}
         <div
            className={cn(
               "absolute bottom-0 flex items-center justify-center w-full pb-4 transition-opacity duration-300",
               // Başlangıç ekranındaysa gizle
               gameState === "startScreen" && "hidden",
               // Seçim aşamasında değilse pasif yap
               gameState !== "choosing" && "opacity-50 pointer-events-none"
            )}
         >
            {/* left box */}
            <div>
               {/* scissors */}
               <div
                  onClick={() => handleHandChoice("scissors")}
                  className="bg-secondary/50 rounded-full p-3 border border-white backdrop-blur-sm hover:shadow-lg hover:ring-2 active:scale-95 active:bg-blue-500/20 transition-all duration-150"
               >
                  <PiHandPeaceLight size={60} />
               </div>
            </div>
            {/* middle box */}
            <div>
               {/* rock */}
               <div
                  onClick={() => handleHandChoice("rock")}
                  className="bg-secondary/50 rounded-full p-3 border border-white backdrop-blur-sm mb-10 hover:shadow-lg hover:ring-2 active:scale-95 active:bg-blue-500/20 transition-all duration-150"
               >
                  <PiHandFistLight size={60} />
               </div>
               {/* Random */}
               <div
                  onClick={() => handleHandChoice("random")}
                  className="bg-secondary/50 rounded-full p-3 border border-white backdrop-blur-sm hover:shadow-lg hover:ring-2 active:scale-95 active:bg-blue-500/20 transition-all duration-150"
               >
                  <GiPerspectiveDiceSixFacesRandom size={60} />
               </div>
            </div>
            {/* right box */}
            <div>
               {/* paper */}
               <div
                  onClick={() => handleHandChoice("paper")}
                  className="bg-secondary/50 rounded-full p-3 border border-white backdrop-blur-sm hover:shadow-lg hover:ring-2 active:scale-95 active:bg-blue-500/20 transition-all duration-150"
               >
                  <PiHand size={60} />
               </div>
            </div>
         </div>

         {/* Timer */}
         <div
            className={cn(
               "fixed left-0 pl-8 flex items-center h-screen",
               // Başlangıç ekranındaysa gizle
               gameState === "startScreen" && "hidden"
            )}
         >
            {/* sticks */}
            <div className="w-3 h-100 bg-primary/20 flex flex-col justify-end rounded-full items-center relative">
               {/* progress */}
               <div
                  className="w-full bg-destructive rounded-full transition-all duration-1000 linear"
                  style={{
                     height: `${(100 / INITIAL_TIMER_VALUE) * timer}%`,
                  }}
               ></div>
               {/* left time */}
               <div className="absolute bottom-0 translate-y-full pt-1">
                  {timer}
               </div>
            </div>
         </div>

         {/* score */}
         <div
            className={cn(
               "fixed right-0 pr-8 flex items-center h-screen",
               // Başlangıç ekranındaysa gizle
               gameState === "startScreen" && "hidden"
            )}
         >
            {/* stick */}
            <div className="w-3 h-100 bg-primary/20 flex flex-col items-center">
               {/* player 2 progress bar*/}
               <div className="w-full h-1/2 items-center flex flex-col">
                  {/* player 2 avatar */}
                  <div className="w-10 h-10 bg-chart-2 scale-110 rounded-full ">
                     <Image
                        src="/assets/cpu_hp_avatar.svg"
                        alt="Player 2 avatar"
                        layout="fill"
                        objectFit="contain"
                        className="p-1"
                     />
                  </div>
                  {/* progress */}
                  <div
                     className={`bg-chart-2 w-full rounded-b-full transition-all duration-500`}
                     style={{
                        height: `${Math.round(
                           (100 / totalPoint) * player2Score
                        )}%`,
                     }}
                  ></div>
               </div>
               {/* score count */}
               <div className="w-full absolute top-1/2 -translate-y-1/2 flex items-center justify-center gap-6">
                  <div>{player2Score}</div>
                  <div>{player1Score}</div>
               </div>
               {/* border */}
               <div className="absolute top-1/2 -translate-y-1/2 rounded-full bg-muted-foreground h-1 w-[40%]" />
               {/* player 1 progress bar*/}
               <div className="w-full h-1/2 flex flex-col justify-end items-center">
                  {/* progress */}
                  <div
                     className="bg-primary w-full rounded-t-full transition-all duration-500"
                     style={{
                        height: `${Math.round(
                           (100 / totalPoint) * player1Score
                        )}%`,
                     }}
                  ></div>
                  {/* player 2 avatar */}
                  <div className="w-10 h-10 bg-primary scale-110 rounded-full">
                     <Image
                        src="/assets/user_hp_avatar.svg"
                        alt="Player 1 avatar"
                        layout="fill"
                        objectFit="contain"
                        className="p-1"
                     />
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}
