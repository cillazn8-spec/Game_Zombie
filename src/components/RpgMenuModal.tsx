import React, { useState } from 'react';
import {
  Coins,
  Flame,
  Hammer,
  Heart,
  Plus,
  Shield,
  Sparkles,
  Swords,
  User,
  X,
  Zap,
} from 'lucide-react';
import {
  ARMOR_ORDER,
  ArmorId,
  CHARACTERS,
  getWeaponForgeCost,
  HudState,
  RELIC_ORDER,
  RelicId,
  RPG_ARMORS,
  RPG_POTION_PRICES,
  RPG_RELICS,
  RPG_SKILL_ORDER,
  RPG_SKILLS,
  RpgStatKey,
  WEAPON_FORGE_MAX,
  WEAPONS,
  WeaponId,
} from '../types/game';

interface RpgMenuModalProps {
  hud: HudState;
  onAllocateStat: (stat: RpgStatKey) => void;
  onBuyOrEquipArmor: (armorId: ArmorId) => void;
  onBuyOrEquipRelic: (relicId: RelicId) => void;
  onUpgradeWeapon: (weaponId: WeaponId) => void;
  onBuyPotion: (kind: 'hp' | 'mp') => void;
  onUsePotion: (kind: 'hp' | 'mp') => void;
  onClose: () => void;
}

type RpgTab = 'stats' | 'gear' | 'skills';

const STAT_META: Array<{
  key: RpgStatKey;
  label: string;
  short: string;
  accent: string;
  effect: string;
}> = [
  {
    key: 'str',
    label: 'Kekuatan',
    short: 'STR',
    accent: 'text-amber-300',
    effect: '+8% Damage Senjata & +8 Damage Gelombang Kejut per poin',
  },
  {
    key: 'vit',
    label: 'Vitalitas',
    short: 'VIT',
    accent: 'text-emerald-300',
    effect: '+18 Max HP & +3 Pertahanan (DEF) per poin',
  },
  {
    key: 'agi',
    label: 'Kelincahan',
    short: 'AGI',
    accent: 'text-cyan-300',
    effect: '+3,5% Peluang Kritis, +3% Kecepatan Gerak & +10% Kecepatan Reload',
  },
  {
    key: 'int',
    label: 'Intelek',
    short: 'INT',
    accent: 'text-violet-300',
    effect: '+15 Max MP, +1,2 MP/dtk Regen & +12 Kekuatan Skill per poin',
  },
];

export const RpgMenuModal: React.FC<RpgMenuModalProps> = ({
  hud,
  onAllocateStat,
  onBuyOrEquipArmor,
  onBuyOrEquipRelic,
  onUpgradeWeapon,
  onBuyPotion,
  onUsePotion,
  onClose,
}) => {
  const [tab, setTab] = useState<RpgTab>('stats');
  const charSpec = CHARACTERS[hud.selectedCharacter] ?? CHARACTERS.raka;
  const ownedArmorSet = new Set<ArmorId>(hud.ownedArmors);
  const ownedRelicSet = new Set<RelicId>(hud.ownedRelics);

  const shockwaveDamage = Math.round(75 + hud.rpgStats.int * 12 + hud.rpgStats.str * 8);
  const healAmount = Math.round(45 + hud.rpgStats.int * 6);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-3 sm:p-5 bg-[#04060b]/86 pointer-events-auto">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#0b101b] border border-amber-400/35 rounded-xl overflow-hidden text-slate-100 shadow-2xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 sm:px-6 py-4 border-b border-white/10 bg-[#080d17]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
              <Swords className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-lg sm:text-2xl font-bold tracking-wide text-white truncate">
                {charSpec.name} · Kelas {charSpec.rpgClass}
              </h2>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-300 font-mono-tabular">
                <span className="text-cyan-300 font-semibold">Level {hud.level}</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span>XP {hud.xp}/{hud.xpToNext}</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="text-amber-300 font-bold inline-flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5" />
                  {hud.gold.toLocaleString('id-ID')} Gold
                </span>
                {hud.statPoints > 0 && (
                  <>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className="text-emerald-300 font-bold">
                      {hud.statPoints} Poin Atribut Tersedia
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup menu RPG"
            className="w-10 h-10 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-white/10 flex items-center justify-center text-slate-200 cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Interactive Segmented Tab Bar */}
        <div className="flex items-center gap-1.5 px-5 sm:px-6 py-3 border-b border-white/10 bg-[#090e19] overflow-x-auto">
          <button
            type="button"
            onClick={() => setTab('stats')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-display font-bold tracking-wider transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              tab === 'stats'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-900/90 text-slate-300 hover:text-white border border-white/10'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Status &amp; Atribut</span>
            {hud.statPoints > 0 && (
              <span
                className={`font-mono-tabular text-[11px] font-bold ${
                  tab === 'stats' ? 'text-slate-950' : 'text-emerald-300'
                }`}
              >
                (+{hud.statPoints})
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setTab('gear')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-display font-bold tracking-wider transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              tab === 'gear'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-900/90 text-slate-300 hover:text-white border border-white/10'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Perlengkapan &amp; Tempa</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('skills')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-display font-bold tracking-wider transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              tab === 'skills'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-900/90 text-slate-300 hover:text-white border border-white/10'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Skill &amp; Ramuan</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6">
          {tab === 'stats' && (
            <>
              {/* Computed Combat Summary Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pb-5 border-b border-white/10">
                <div>
                  <div className="text-[11px] text-slate-400">HP Maksimal</div>
                  <div className="font-mono-tabular text-lg font-bold text-emerald-300">
                    {hud.hp}/{hud.maxHp}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Mana (MP)</div>
                  <div className="font-mono-tabular text-lg font-bold text-sky-300">
                    {Math.round(hud.mp)}/{hud.maxMp}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Bonus Damage</div>
                  <div className="font-mono-tabular text-lg font-bold text-amber-300">
                    +{hud.damageBonusPct}%
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Pertahanan (DEF)</div>
                  <div className="font-mono-tabular text-lg font-bold text-cyan-300">
                    {hud.defense}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Peluang Kritis</div>
                  <div className="font-mono-tabular text-lg font-bold text-rose-300">
                    {hud.critChancePct}%
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Poin Tersedia</div>
                  <div className="font-mono-tabular text-lg font-bold text-white">
                    {hud.statPoints}
                  </div>
                </div>
              </div>

              {/* 4 Core RPG Attributes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-sm font-bold tracking-wide text-white">
                    Distribusi Poin Atribut
                  </h3>
                  <span className="text-xs text-slate-400">
                    Naik level memberikan +3 Poin Atribut &amp; +50 Gold
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {STAT_META.map((item) => {
                    const val = hud.rpgStats[item.key];
                    return (
                      <div
                        key={item.key}
                        className="flex items-center justify-between gap-4 rounded-xl bg-[#101726] border border-white/10 px-4 py-3.5"
                      >
                        <div className="min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className={`font-display text-sm font-bold ${item.accent}`}>
                              {item.short}
                            </span>
                            <span className="text-sm font-semibold text-white">
                              {item.label}
                            </span>
                            <span className="font-mono-tabular text-lg font-bold text-white ml-1">
                              {val}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 leading-snug">
                            {item.effect}
                          </p>
                        </div>

                        <button
                          type="button"
                          disabled={hud.statPoints <= 0}
                          onClick={() => onAllocateStat(item.key)}
                          className={`inline-flex items-center gap-1 px-3.5 py-2 rounded-lg font-display font-bold text-xs tracking-wider whitespace-nowrap shrink-0 transition-colors ${
                            hud.statPoints > 0
                              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tambah</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {tab === 'gear' && (
            <div className="space-y-6">
              {/* Weapon Forge Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-sm font-bold tracking-wide text-white flex items-center gap-2">
                    <Hammer className="w-4 h-4 text-amber-400" />
                    Tempa Senjata (Weapon Forge)
                  </h3>
                  <span className="text-xs text-slate-400">
                    Setiap level tempa menambah +18% Damage dasar senjata
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {hud.weapons.map((w) => {
                    const spec = WEAPONS[w.id];
                    const tier = hud.weaponForageLevels[w.id] ?? 0;
                    const maxed = tier >= WEAPON_FORGE_MAX;
                    const cost = getWeaponForgeCost(tier);
                    const canAfford = hud.gold >= cost;
                    const forgedDmg = Math.round(spec.damage * (1 + tier * 0.18));

                    return (
                      <div
                        key={w.id}
                        className="flex items-center justify-between gap-3 rounded-xl bg-[#101726] border border-white/10 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-display text-sm font-bold text-white truncate">
                              {spec.name}
                            </span>
                            {tier > 0 && (
                              <span className="font-mono-tabular text-xs font-bold text-amber-300">
                                +{tier}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 font-mono-tabular mt-0.5">
                            {w.unlocked
                              ? `ATK Dasar ${forgedDmg} · Tier ${tier}/${WEAPON_FORGE_MAX}`
                              : `Terkunci (${spec.unlockKills} Kill / Drop)`}
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={!w.unlocked || maxed || !canAfford}
                          onClick={() => onUpgradeWeapon(w.id)}
                          className={`px-3.5 py-2 rounded-lg font-display font-bold text-xs tracking-wider whitespace-nowrap shrink-0 transition-colors ${
                            maxed
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/35 cursor-default'
                              : w.unlocked && canAfford
                                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          {maxed ? 'MAKSIMAL' : !w.unlocked ? 'TERKUNCI' : `TEMPA · ${cost} G`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Armor Shop & Equip */}
              <div className="space-y-3 pt-4 border-t border-white/10">
                <h3 className="font-display text-sm font-bold tracking-wide text-white">
                  Zirah &amp; Pelindung Tubuh (Armor)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ARMOR_ORDER.map((id) => {
                    const armor = RPG_ARMORS[id];
                    const owned = ownedArmorSet.has(id);
                    const equipped = hud.equippedArmor === id;
                    const canBuy = !owned && hud.gold >= armor.price;

                    return (
                      <div
                        key={id}
                        className={`flex flex-col justify-between gap-3 rounded-xl border p-4 ${
                          equipped
                            ? 'bg-emerald-500/10 border-emerald-400/50'
                            : 'bg-[#101726] border-white/10'
                        }`}
                      >
                        <div>
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="font-display text-sm font-bold text-white">
                              {armor.name}
                            </span>
                            <span className="text-[11px] font-mono-tabular text-slate-400">
                              {armor.tier}
                            </span>
                          </div>
                          <div className="text-xs font-mono-tabular text-cyan-300 mt-0.5">
                            +{armor.defense} DEF · +{armor.bonusHp} Max HP
                          </div>
                          <p className="text-xs text-slate-400 mt-1 leading-snug">
                            {armor.description}
                          </p>
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="button"
                            disabled={equipped || (!owned && !canBuy)}
                            onClick={() => onBuyOrEquipArmor(id)}
                            className={`px-3.5 py-2 rounded-lg font-display font-bold text-xs tracking-wider whitespace-nowrap transition-colors ${
                              equipped
                                ? 'bg-emerald-500/20 text-emerald-300 cursor-default'
                                : owned
                                  ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 cursor-pointer'
                                  : canBuy
                                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer'
                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            {equipped
                              ? 'DIPAKAI'
                              : owned
                                ? 'PAKAI'
                                : `BELI · ${armor.price} G`}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Relic Shop & Equip */}
              <div className="space-y-3 pt-4 border-t border-white/10">
                <h3 className="font-display text-sm font-bold tracking-wide text-white">
                  Relik &amp; Jimat Pertempuran
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {RELIC_ORDER.map((id) => {
                    const relic = RPG_RELICS[id];
                    const owned = ownedRelicSet.has(id);
                    const equipped = hud.equippedRelic === id;
                    const canBuy = !owned && hud.gold >= relic.price;

                    return (
                      <div
                        key={id}
                        className={`flex flex-col justify-between gap-3 rounded-xl border p-4 ${
                          equipped
                            ? 'bg-violet-500/12 border-violet-400/55'
                            : 'bg-[#101726] border-white/10'
                        }`}
                      >
                        <div>
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="font-display text-sm font-bold text-white">
                              {relic.name}
                            </span>
                            <span className="text-[11px] font-mono-tabular text-slate-400">
                              {relic.tier}
                            </span>
                          </div>
                          <div className="text-xs font-mono-tabular text-amber-300 mt-0.5">
                            +{relic.bonusCritPct}% Crit · +{relic.bonusDmgPct}% DMG · +{relic.bonusMp} MP
                          </div>
                          <p className="text-xs text-slate-400 mt-1 leading-snug">
                            {relic.description}
                          </p>
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="button"
                            disabled={equipped || (!owned && !canBuy)}
                            onClick={() => onBuyOrEquipRelic(id)}
                            className={`px-3.5 py-2 rounded-lg font-display font-bold text-xs tracking-wider whitespace-nowrap transition-colors ${
                              equipped
                                ? 'bg-violet-500/20 text-violet-200 cursor-default'
                                : owned
                                  ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 cursor-pointer'
                                  : canBuy
                                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer'
                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            {equipped
                              ? 'DIPAKAI'
                              : owned
                                ? 'PAKAI'
                                : `BELI · ${relic.price} G`}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === 'skills' && (
            <div className="space-y-6">
              {/* Active 3D Skills */}
              <div className="space-y-3">
                <h3 className="font-display text-sm font-bold tracking-wide text-white">
                  3 Skill Aktif 3D RPG (Gunakan Langsung Saat Bertempur)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {RPG_SKILL_ORDER.map((id) => {
                    const sk = RPG_SKILLS[id];
                    return (
                      <div
                        key={id}
                        className="rounded-xl bg-[#101726] border border-white/10 p-4 flex flex-col justify-between gap-2.5"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span
                              className="font-display text-sm font-bold"
                              style={{ color: sk.accentColor }}
                            >
                              {sk.name}
                            </span>
                            <span className="font-mono-tabular text-xs font-bold text-white">
                              [{sk.hotkey}]
                            </span>
                          </div>
                          <div className="text-xs font-mono-tabular text-slate-400 mb-2">
                            Biaya {sk.mpCost} MP · Cooldown {sk.cooldown} dtk
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {sk.description}
                          </p>
                        </div>
                        <div className="pt-2 border-t border-white/10 text-xs font-mono-tabular text-emerald-300">
                          {id === 'shockwave' && `Kekuatan Saat Ini: ~${shockwaveDamage} AoE DMG`}
                          {id === 'heal' && `Pemulihan Saat Ini: +${healAmount} HP + Regen`}
                          {id === 'overdrive' && 'Durasi 8 dtk · +60% DMG & +35% Crit'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Potions & Consumables */}
              <div className="space-y-3 pt-4 border-t border-white/10">
                <h3 className="font-display text-sm font-bold tracking-wide text-white">
                  Ramuan &amp; Tas Item (Consumables)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl bg-[#101726] border border-white/10 p-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 font-display text-sm font-bold text-emerald-300">
                        <Heart className="w-4 h-4" />
                        <span>Ramuan HP [H]</span>
                      </div>
                      <div className="text-xs text-slate-300 mt-0.5">
                        Memulihkan +60 HP seketika.
                      </div>
                      <div className="text-xs font-mono-tabular text-slate-400 mt-1">
                        Dimiliki: <strong className="text-white">{hud.hpPotions}</strong> · Harga {RPG_POTION_PRICES.hp} G
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button
                        type="button"
                        disabled={hud.hpPotions <= 0 || hud.hp >= hud.maxHp}
                        onClick={() => onUsePotion('hp')}
                        className={`px-3 py-1.5 rounded-lg font-display font-bold text-xs whitespace-nowrap transition-colors ${
                          hud.hpPotions > 0 && hud.hp < hud.maxHp
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        MINUM
                      </button>
                      <button
                        type="button"
                        disabled={hud.gold < RPG_POTION_PRICES.hp}
                        onClick={() => onBuyPotion('hp')}
                        className={`px-3 py-1.5 rounded-lg font-display font-bold text-xs whitespace-nowrap transition-colors ${
                          hud.gold >= RPG_POTION_PRICES.hp
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        BELI {RPG_POTION_PRICES.hp}G
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl bg-[#101726] border border-white/10 p-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 font-display text-sm font-bold text-sky-300">
                        <Zap className="w-4 h-4" />
                        <span>Ramuan Mana (MP)</span>
                      </div>
                      <div className="text-xs text-slate-300 mt-0.5">
                        Memulihkan +60 MP untuk Skill 3D.
                      </div>
                      <div className="text-xs font-mono-tabular text-slate-400 mt-1">
                        Dimiliki: <strong className="text-white">{hud.mpPotions}</strong> · Harga {RPG_POTION_PRICES.mp} G
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button
                        type="button"
                        disabled={hud.mpPotions <= 0 || hud.mp >= hud.maxMp}
                        onClick={() => onUsePotion('mp')}
                        className={`px-3 py-1.5 rounded-lg font-display font-bold text-xs whitespace-nowrap transition-colors ${
                          hud.mpPotions > 0 && hud.mp < hud.maxMp
                            ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 cursor-pointer'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        MINUM
                      </button>
                      <button
                        type="button"
                        disabled={hud.gold < RPG_POTION_PRICES.mp}
                        onClick={() => onBuyPotion('mp')}
                        className={`px-3 py-1.5 rounded-lg font-display font-bold text-xs whitespace-nowrap transition-colors ${
                          hud.gold >= RPG_POTION_PRICES.mp
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        BELI {RPG_POTION_PRICES.mp}G
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-3 border-t border-white/10 bg-[#080d17] text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            Pertempuran dijeda sementara saat menu RPG terbuka. Tekan <strong className="text-white">B</strong> kapan saja untuk kembali bertempur.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/15 text-slate-100 font-display font-bold text-xs tracking-wider cursor-pointer whitespace-nowrap"
          >
            TUTUP [B / ESC]
          </button>
        </div>
      </div>
    </div>
  );
};
