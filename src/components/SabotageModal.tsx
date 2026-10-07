import React, { useState } from 'react';
import { Player, BoardTile } from '../types/game';
import { SABOTAGE_SKILLS } from '../data/events';
import { formatRupiah } from '../utils/formatters';
import { soundManager } from '../utils/audio';
import { X, Flame, ShieldAlert, Handshake } from 'lucide-react';

interface SabotageModalProps {
  activePlayer: Player;
  otherPlayers: Player[];
  tiles: BoardTile[];
  onClose: () => void;
  onExecuteSabotage: (skillId: string, targetPlayerId: string, targetPropertyId?: number) => void;
  onProposeJointVentue?: (targetPlayerId: string, propertyId: number) => void;
}

export const SabotageModal: React.FC<SabotageModalProps> = ({
  activePlayer,
  otherPlayers,
  tiles,
  onClose,
  onExecuteSabotage,
  onProposeJointVentue
}) => {
  const [activeTab, setActiveTab] = useState<'sabotage' | 'joint_venture'>('sabotage');
  const [selectedSkillId, setSelectedSkillId] = useState<string>(SABOTAGE_SKILLS[0].id);
  const [selectedTargetPlayerId, setSelectedTargetPlayerId] = useState<string>(
    otherPlayers[0]?.id || ''
  );
  const [selectedPropertyId, setSelectedPropertyId] = useState<number>(0);

  const isHacker = activePlayer.characterId === 'programmer_scam';
  const targetPlayer = otherPlayers.find((p) => p.id === selectedTargetPlayerId);
  const isTargetImmune = targetPlayer?.characterId === 'programmer_scam';

  const selectedSkill = SABOTAGE_SKILLS.find((s) => s.id === selectedSkillId);
  const effectiveCost = selectedSkill
    ? isHacker
      ? Math.max(1000000, selectedSkill.cost - 1000000)
      : selectedSkill.cost
    : 0;
  const canAfford = selectedSkill ? activePlayer.money >= effectiveCost : false;

  // Find properties owned by selected target player
  const targetProperties = tiles.filter((t) => t.ownerId === selectedTargetPlayerId);

  const handleSabotage = () => {
    if (!selectedSkill || !selectedTargetPlayerId || !canAfford) return;
    soundManager.playGavel();
    onExecuteSabotage(selectedSkill.id, selectedTargetPlayerId, selectedPropertyId || undefined);
    onClose();
  };

  const handleJointVenture = () => {
    if (!selectedTargetPlayerId || !onProposeJointVentue) return;
    soundManager.playFanfare();
    onProposeJointVentue(selectedTargetPlayerId, selectedPropertyId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-amber-50 rounded-2xl comic-box-lg max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-slate-800 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-white/20 rounded-xl text-2xl">⚡</span>
            <div>
              <p className="text-xs uppercase tracking-widest font-bold text-amber-300">Interaksi Antar Warga</p>
              <h3 className="text-xl font-bold font-comic">Sabotase & Kongsi Bisnis</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b-2 border-slate-300 bg-amber-100/60 p-1.5 gap-2">
          <button
            onClick={() => setActiveTab('sabotage')}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'sabotage'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-700 hover:bg-amber-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            Sabotase & Lapor Warga
          </button>
          <button
            onClick={() => setActiveTab('joint_venture')}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'joint_venture'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-700 hover:bg-amber-200'
            }`}
          >
            <Handshake className="w-3.5 h-3.5" />
            Kongsi Usaha (Bagi Hasil)
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Target Player Picker */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              Pilih Warga Target:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {otherPlayers.map((player) => {
                const isSelected = selectedTargetPlayerId === player.id;
                return (
                  <button
                    key={player.id}
                    onClick={() => {
                      setSelectedTargetPlayerId(player.id);
                      const props = tiles.filter((t) => t.ownerId === player.id);
                      if (props.length > 0) setSelectedPropertyId(props[0].id);
                    }}
                    className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-200 border-indigo-600 ring-2 ring-indigo-400'
                        : 'bg-white border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{player.avatarEmoji}</span>
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-900 truncate">{player.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{formatRupiah(player.money)}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {activeTab === 'sabotage' ? (
            <>
              {/* Sabotage skill list */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Pilih Tindakan Sabotase:
                </label>
                {SABOTAGE_SKILLS.map((skill) => {
                  const isSelected = selectedSkillId === skill.id;
                  const skillCost = isHacker ? Math.max(1000000, skill.cost - 1000000) : skill.cost;
                  const affordable = activePlayer.money >= skillCost;
                  return (
                    <div
                      key={skill.id}
                      onClick={() => setSelectedSkillId(skill.id)}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-amber-100 border-purple-600 shadow-sm'
                          : 'bg-white border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{skill.icon}</span>
                          <div>
                            <p className="text-xs font-bold text-slate-900 font-comic">{skill.name}</p>
                            <p className="text-[11px] text-slate-600">{skill.description}</p>
                            {isHacker && (
                              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.2 rounded mt-0.5 inline-block">
                                Diskon Hacker: -Rp 1.000.000
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-xs font-bold font-mono ${affordable ? 'text-slate-900' : 'text-rose-600'}`}>
                            {formatRupiah(skillCost)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Target immunity warning if applicable */}
              {isTargetImmune && (
                <div className="p-2.5 bg-amber-100 border-2 border-amber-400 rounded-xl text-amber-900 text-xs flex items-center gap-2">
                  <span className="text-lg">🛡️</span>
                  <div>
                    <strong className="block font-bold">Target Kebal Sabotase!</strong>
                    <span>{targetPlayer?.name} (Siti Hacker) memiliki firewall anti-sabotase. Serangan ini tidak akan berdampak pada asetnya.</span>
                  </div>
                </div>
              )}

              {/* If freeze property chosen and target has properties, pick which one */}
              {selectedSkill?.effectType === 'FREEZE_PROPERTY' && targetProperties.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Pilih Properti Lawan yang Ditarget Santet:
                  </label>
                  <select
                    value={selectedPropertyId}
                    onChange={(e) => setSelectedPropertyId(Number(e.target.value))}
                    className="w-full p-2 bg-white rounded-lg border border-slate-300 text-xs font-semibold"
                  >
                    {targetProperties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.icon} {p.name} ({p.city})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                disabled={!canAfford || !selectedTargetPlayerId}
                onClick={handleSabotage}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider comic-box-sm comic-btn-hover flex items-center justify-center gap-2 cursor-pointer ${
                  canAfford && selectedTargetPlayerId
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                Luncurkan Sabotase ({formatRupiah(effectiveCost)})
              </button>
            </>
          ) : (
            /* Joint Venture tab */
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-300 text-xs text-slate-700 space-y-1">
                <p className="font-bold text-emerald-800">Kongsi Bisnis Patungan:</p>
                <p>
                  Ajak warga tetangga bermitra! Bila pemain lain mendarat di properti kongsi, uang sewa akan dibagi rata 50:50 antara Anda dan mitra bisnis Anda.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Pilih Kavling Properti untuk Bermitra:
                </label>
                <select
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(Number(e.target.value))}
                  className="w-full p-2 bg-white rounded-lg border border-slate-300 text-xs font-semibold"
                >
                  {tiles
                    .filter((t) => t.type === 'property' && (t.ownerId === activePlayer.id || t.ownerId === selectedTargetPlayerId))
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.icon} {p.name} ({p.city}) - Milik {p.ownerId === activePlayer.id ? 'Anda' : 'Mitra'}
                      </option>
                    ))}
                </select>
              </div>

              <button
                onClick={handleJointVenture}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider comic-box-sm comic-btn-hover flex items-center justify-center gap-2 cursor-pointer"
              >
                <Handshake className="w-4 h-4" />
                Resmikan Usaha Kongsi Warga
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
