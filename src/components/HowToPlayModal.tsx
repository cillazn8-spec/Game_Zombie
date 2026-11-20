import React from 'react';
import { Crosshair, Flame, HeartPulse, Keyboard, Skull, Smartphone, Swords, X } from 'lucide-react';
import {
  ZOMBIE_APPEARANCE_INFO,
  ZOMBIE_APPEARANCES,
  ZOMBIE_BOSS_APPEARANCES,
} from '../types/game';

interface HowToPlayModalProps {
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose }) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-[#04060b]/82 pointer-events-auto">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0b101b] border border-white/15 rounded-xl p-6 sm:p-8 text-slate-100">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-wide text-white">
              HOW TO PLAY
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Panduan bermain Solo, Multiplayer Co-op, Senjata, dan Misi
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup panduan"
            className="w-10 h-10 rounded-lg bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-slate-200 cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-5">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-display font-bold text-sm tracking-wider">
              <Keyboard className="w-4 h-4" />
              KONTROL PC / LAPTOP
            </div>
            <ul className="space-y-1.5 text-sm text-slate-300">
              <li className="flex justify-between gap-2 py-1 border-b border-white/5">
                <span>Bergerak</span>
                <span className="font-mono-tabular text-white font-semibold">W A S D</span>
              </li>
              <li className="flex justify-between gap-2 py-1 border-b border-white/5">
                <span>Arahkan Kamera</span>
                <span className="font-mono-tabular text-white font-semibold">Gerak Mouse</span>
              </li>
              <li className="flex justify-between gap-2 py-1 border-b border-white/5">
                <span>Menembak / Bidik Zoom</span>
                <span className="font-mono-tabular text-white font-semibold">Klik Kiri / Kanan (Z)</span>
              </li>
              <li className="flex justify-between gap-2 py-1 border-b border-white/5">
                <span>Kamera 1st / 3rd &amp; Zoom</span>
                <span className="font-mono-tabular text-cyan-400 font-semibold">V / Scroll Mouse</span>
              </li>
              <li className="flex justify-between gap-2 py-1 border-b border-white/5">
                <span>Ganti Senjata</span>
                <span className="font-mono-tabular text-white font-semibold">Tombol 1 - 4</span>
              </li>
              <li className="flex justify-between gap-2 py-1 border-b border-white/5">
                <span>Isi Peluru / Refill Darurat</span>
                <span className="font-mono-tabular text-white font-semibold">R / F</span>
              </li>
              <li className="flex justify-between gap-2 py-1 border-b border-white/5">
                <span>Lari / Lompat / Jongkok</span>
                <span className="font-mono-tabular text-white font-semibold">Shift / Space / C</span>
              </li>
              <li className="flex justify-between gap-2 py-1 border-b border-white/5">
                <span>Ngedash (Menghindar)</span>
                <span className="font-mono-tabular text-cyan-400 font-semibold">Tombol Q</span>
              </li>
              <li className="flex justify-between gap-2 py-1 border-b border-white/5">
                <span>Skill 3D (Kejut / Heal / Overdrive)</span>
                <span className="font-mono-tabular text-amber-400 font-semibold">E / X / T</span>
              </li>
              <li className="flex justify-between gap-2 py-1 border-b border-white/5">
                <span>Menu RPG (Atribut, Toko &amp; Tempa)</span>
                <span className="font-mono-tabular text-amber-400 font-semibold">Tombol B</span>
              </li>
              <li className="flex justify-between gap-2 py-1 border-b border-white/5">
                <span>Ramuan HP Instan</span>
                <span className="font-mono-tabular text-emerald-400 font-semibold">Tombol H</span>
              </li>
              <li className="flex justify-between gap-2 py-1 border-b border-white/5">
                <span>Naik / Turun Kendaraan</span>
                <span className="font-mono-tabular text-amber-400 font-semibold">Tombol G</span>
              </li>
              <li className="flex justify-between gap-2 py-1 border-b border-white/5">
                <span>Peta Dunia (Pindah 10 Map)</span>
                <span className="font-mono-tabular text-cyan-400 font-semibold">Tombol M</span>
              </li>
              <li className="flex justify-between gap-2 py-1">
                <span>Jeda Game</span>
                <span className="font-mono-tabular text-white font-semibold">Esc / P</span>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-cyan-400 font-display font-bold text-sm tracking-wider">
              <Smartphone className="w-4 h-4" />
              KONTROL HP ANDROID
            </div>
            <ul className="space-y-1.5 text-sm text-slate-300">
              <li className="flex justify-between gap-2 py-1 border-b border-white/5">
                <span>Bergerak</span>
                <span className="font-semibold text-white">Joystick Kiri</span>
              </li>
              <li className="flex justify-between gap-2 py-1 border-b border-white/5">
                <span>Arahkan Kamera</span>
                <span className="font-semibold text-white">Geser Layar Kanan</span>
              </li>
              <li className="flex justify-between gap-2 py-1 border-b border-white/5">
                <span>Menembak / Bidik Zoom</span>
                <span className="font-semibold text-amber-400">SHOOT / BIDIK</span>
              </li>
              <li className="flex justify-between gap-2 py-1 border-b border-white/5">
                <span>Ganti Kamera (1st / 3rd)</span>
                <span className="font-semibold text-cyan-400">Tombol 1ST / 3RD CAM</span>
              </li>
              <li className="flex justify-between gap-2 py-1 border-b border-white/5">
                <span>Ganti Senjata</span>
                <span className="font-semibold text-white">Ketuk Slot 1-4</span>
              </li>
              <li className="flex justify-between gap-2 py-1 border-b border-white/5">
                <span>Lari / Lompat / Jongkok</span>
                <span className="font-semibold text-emerald-400">Tombol Bulat</span>
              </li>
              <li className="flex justify-between gap-2 py-1 border-b border-white/5">
                <span>Dash / Reload / Refill Peluru</span>
                <span className="font-semibold text-cyan-400">DASH / RELOAD / REFILL</span>
              </li>
              <li className="flex justify-between gap-2 py-1 border-b border-white/5">
                <span>Naik / Turun Mobil</span>
                <span className="font-semibold text-amber-400">Tombol NAIK / TURUN</span>
              </li>
              <li className="flex justify-between gap-2 py-1">
                <span>Pindah 10 Map di Dalam Game</span>
                <span className="font-semibold text-cyan-400">Tombol PETA (Kanan Atas)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* 4 Jenis Zombie Respawn Acak */}
        <div className="py-4 border-t border-white/10">
          <div className="flex items-center gap-2 text-red-400 font-display font-bold text-sm tracking-wider mb-3">
            <Skull className="w-4 h-4" />
            4 JENIS ZOMBIE (RESPAWN ACAK DI ARENA)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {ZOMBIE_APPEARANCES.map((id) => {
              const info = ZOMBIE_APPEARANCE_INFO[id];
              return (
                <div
                  key={id}
                  className="bg-slate-900/90 border border-white/10 rounded-lg overflow-hidden flex flex-col"
                >
                  <div className="h-28 bg-slate-950 overflow-hidden">
                    <img
                      src={info.imagePath}
                      alt={info.name}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div className="p-2 flex-1">
                    <div className="font-display font-bold text-xs text-white truncate">
                      {info.name}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-snug mt-0.5">
                      {info.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-amber-400 font-display font-bold text-sm tracking-wider mt-4 mb-3">
            <Skull className="w-4 h-4" />
            3 ZOMBIE BOS (HP SUPER TEBAL)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {ZOMBIE_BOSS_APPEARANCES.map((id) => {
              const info = ZOMBIE_APPEARANCE_INFO[id];
              return (
                <div
                  key={id}
                  className="bg-slate-900/95 border border-red-500/30 rounded-lg overflow-hidden flex flex-col"
                >
                  <div className="h-32 bg-slate-950 overflow-hidden">
                    <img
                      src={info.imagePath}
                      alt={info.name}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div className="p-2.5 flex-1">
                    <div className="font-display font-bold text-xs text-red-400 truncate">
                      {info.name}
                    </div>
                    <p className="text-[10px] text-slate-300 leading-snug mt-0.5">
                      {info.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weapon Drops, Characters & Missions */}
        <div className="pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="flex items-start gap-2.5">
            <Swords className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p>
              <strong className="text-white block mb-0.5">Hadiah Bos &amp; Teka-Teki SMP/SMA</strong>
              Setiap mengeliminasi <strong className="text-amber-300">Zombie Bos</strong>, jatuh 2 drop 3D sekaligus membuka <strong className="text-amber-300">Teka-Teki SMP/SMA</strong> wajib. Jawab benar untuk mengklaim Senjata baru, Armor/Relik, Tempa +1 gratis, Ramuan HP/MP, dan Gold!
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <Crosshair className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              <strong className="text-white block mb-0.5">Sistem 3D Action RPG &amp; Grafis HD Ultra</strong>
              Naik level untuk +3 Poin Atribut (STR, VIT, AGI, INT). Tekan <strong className="text-amber-300">B</strong> untuk Menu RPG (Armor, Relik, Ramuan, Tempa <strong className="text-amber-300">+5</strong>). Tampilan <strong className="text-cyan-300">HD Ultra (Bloom)</strong> aktif otomatis di Pengaturan!
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <HeartPulse className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p>
              <strong className="text-white block mb-0.5">3 Skill 3D Aktif &amp; Mana (MP)</strong>
              Gunakan <strong className="text-cyan-300">[E] Gelombang Kejut</strong> untuk damage area, <strong className="text-emerald-300">[X] Aura Penyembuhan</strong> untuk memulihkan HP, dan <strong className="text-amber-300">[T] Mode Overdrive</strong> untuk lonjakan damage &amp; crit!
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <Flame className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p>
              <strong className="text-white block mb-0.5">10 Peta Jelajah, 80 Misi &amp; Teka-Teki SMP/SMA</strong>
              Tekan <strong className="text-cyan-300">M</strong> atau dekati <strong className="text-cyan-300">Gerbang Lintas Peta</strong> biru untuk berpindah ke semua 10 map! Setiap tempat memiliki 8 misi unik dengan soal teka-teki <strong className="text-emerald-300">SMP</strong> (Misi 1–4) dan <strong className="text-violet-300">SMA</strong> (Misi 5–8) berhadiah XP &amp; Gold.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-sm tracking-wider cursor-pointer whitespace-nowrap"
          >
            MENGERTI
          </button>
        </div>
      </div>
    </div>
  );
};

