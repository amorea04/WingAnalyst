
import React, { useState } from 'react';
import { PilotProfile } from '../types';

interface ProfileFormProps {
  onComplete: (profile: PilotProfile) => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ onComplete }) => {
  const [profile, setProfile] = useState<PilotProfile>({
    experience: '',
    currentWing: '',
    ptv: 80,
    flightTypes: [],
    ambitions: '',
  });

  const handleToggleFlightType = (type: string) => {
    setProfile(prev => ({
      ...prev,
      flightTypes: prev.flightTypes.includes(type)
        ? prev.flightTypes.filter(t => t !== type)
        : [...prev.flightTypes, type]
    }));
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 max-w-2xl mx-auto animate-in">
      <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
        <i className="fas fa-user-pilot text-orange-600"></i>
        Profil du Pilote
      </h2>
      
      <div className="space-y-8">
        <div>
          <label className="block text-sm font-black text-slate-700 mb-3 uppercase tracking-wider">Expérience & Niveau technique</label>
          <textarea 
            className="w-full p-4 border-2 border-slate-50 rounded-2xl focus:border-orange-500 focus:ring-0 outline-none transition-all placeholder-slate-300 bg-slate-50/50"
            rows={2}
            value={profile.experience}
            onChange={e => setProfile({...profile, experience: e.target.value})}
            placeholder="Ex: 150h de vol, 3 saisons, SIV réalisé en 2023..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-black text-slate-700 mb-3 uppercase tracking-wider">Voile Actuelle</label>
            <input 
              type="text"
              className="w-full p-4 border-2 border-slate-50 rounded-2xl focus:border-orange-500 focus:ring-0 outline-none bg-slate-50/50"
              value={profile.currentWing}
              onChange={e => setProfile({...profile, currentWing: e.target.value})}
              placeholder="Ex: Ozone Buzz Z6"
            />
          </div>
          <div>
            <label className="block text-sm font-black text-slate-700 mb-3 uppercase tracking-wider">PTV (kg)</label>
            <input 
              type="number"
              className="w-full p-4 border-2 border-slate-50 rounded-2xl focus:border-orange-500 focus:ring-0 outline-none bg-slate-50/50"
              value={profile.ptv}
              onChange={e => setProfile({...profile, ptv: parseInt(e.target.value) || 0})}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-black text-slate-700 mb-4 uppercase tracking-wider">Pratique ciblée</label>
          <div className="flex flex-wrap gap-2">
            {['Montagne', , 'Plaine (Treuil)', 'XC (Cross)', 'Hike & Fly', 'Soaring', 'Freestyle'].map(type => (
              <button
                key={type}
                onClick={() => handleToggleFlightType(type)}
                className={`px-5 py-2.5 rounded-full border-2 font-bold text-sm transition-all ${
                  profile.flightTypes.includes(type) 
                  ? 'bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-200' 
                  : 'bg-white border-slate-100 text-slate-500 hover:border-orange-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-black text-slate-700 mb-3 uppercase tracking-wider">Objectifs & Envies</label>
          <textarea 
            className="w-full p-4 border-2 border-slate-50 rounded-2xl focus:border-orange-500 focus:ring-0 outline-none bg-slate-50/50 placeholder-slate-300"
            rows={3}
            value={profile.ambitions}
            onChange={e => setProfile({...profile, ambitions: e.target.value})}
            placeholder="Ex: Passer en catégorie B+ pour boucler mes premiers 50km de cross..."
          />
        </div>

        <button 
          onClick={() => onComplete(profile)}
          className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-5 rounded-3xl transition-all shadow-xl hover:shadow-orange-200 flex items-center justify-center gap-4 group"
        >
          CHOIX DES VOILES A ANALYSER
          <i className="fas fa-arrow-right group-hover:translate-x-2 transition-transform"></i>
        </button>

        <div className="mt-8 p-6 bg-orange-50 rounded-3xl border border-orange-100 flex gap-4 text-orange-900 shadow-sm">
          <i className="fas fa-shield-halved mt-1 text-orange-500 text-xl"></i>
          <div className="text-[10px] leading-relaxed italic opacity-80">
            <strong>Avertissement :</strong> Cette IA expertise les données techniques constructeurs et les retours d'essais réels. Elle ne remplace en aucun cas un moniteur diplômé ou un essai physique sous portique et en vol. Votre sécurité est votre responsabilité.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileForm;
