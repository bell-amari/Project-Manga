export type TopManga = {
  rank: number;
  title: string;
  author: string;
  genre: string;
  rating: number;
  volumes: number;
  blurb: string;
};

export const TOP_MANGA: TopManga[] = [
  { rank: 1, title: "Berserk", author: "Kentaro Miura", genre: "Dark Fantasy", rating: 4.9, volumes: 42, blurb: "The branded swordsman's endless war against fate." },
  { rank: 2, title: "One Piece", author: "Eiichiro Oda", genre: "Adventure", rating: 4.8, volumes: 108, blurb: "A rubber-bodied pirate king's voyage across the Grand Line." },
  { rank: 3, title: "Vagabond", author: "Takehiko Inoue", genre: "Historical", rating: 4.8, volumes: 37, blurb: "Musashi's brush-stroked path to becoming invincible." },
  { rank: 4, title: "Monster", author: "Naoki Urasawa", genre: "Thriller", rating: 4.8, volumes: 18, blurb: "A surgeon hunts the boy whose life he saved." },
  { rank: 5, title: "Vinland Saga", author: "Makoto Yukimura", genre: "Historical", rating: 4.7, volumes: 28, blurb: "A Viking's revenge gives way to a deeper question." },
  { rank: 6, title: "Chainsaw Man", author: "Tatsuki Fujimoto", genre: "Action", rating: 4.7, volumes: 17, blurb: "Devil hunters, dreams, and a chainsaw heart." },
  { rank: 7, title: "Attack on Titan", author: "Hajime Isayama", genre: "Dark Fantasy", rating: 4.7, volumes: 34, blurb: "Walls fall, truths unravel, freedom costs everything." },
  { rank: 8, title: "Slam Dunk", author: "Takehiko Inoue", genre: "Sports", rating: 4.7, volumes: 31, blurb: "A delinquent finds redemption on the basketball court." },
  { rank: 9, title: "Fullmetal Alchemist", author: "Hiromu Arakawa", genre: "Adventure", rating: 4.7, volumes: 27, blurb: "Two brothers chase the Philosopher's Stone." },
  { rank: 10, title: "Jujutsu Kaisen", author: "Gege Akutami", genre: "Action", rating: 4.6, volumes: 26, blurb: "Cursed energy, sorcerers, and a king of curses." },
];