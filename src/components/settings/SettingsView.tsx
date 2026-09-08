import React, { useState } from 'react';
import { User, DollarSign, Save } from 'lucide-react';
import { TeacherSettings } from '../../types';
import { appwriteService } from '../../services/appwrite';
import { db } from '../../services/db';

interface SettingsViewProps {
  settings: TeacherSettings;
  onUpdateSettings: (settings: TeacherSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onUpdateSettings }) => {
  const [formData, setFormData] = useState<TeacherSettings>(settings);
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
          Configurações
        </h2>
        <p className="text-slate-500 text-sm mt-0.5">
          Gerencie seu perfil de professora de inglês e preferências pedagógicas
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-6">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
          <User size={20} className="text-blue-500" />
          Dados da Professora
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
              Nome Completo
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
              Título / Especialidade
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
              E-mail de Contato
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
              WhatsApp / Celular
            </label>
            <input
              type="text"
              value={formData.whatsapp || ''}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
              Valor Padrão Hora/Aula (R$)
            </label>
            <input
              type="number"
              min="0"
              step="5"
              value={formData.hourlyRateDefault || 120}
              onChange={(e) => setFormData({ ...formData, hourlyRateDefault: Number(e.target.value) })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
              Cidade / Estado
            </label>
            <input
              type="text"
              value={`${formData.city || ''} - ${formData.state || ''}`}
              onChange={(e) => {
                const parts = e.target.value.split('-');
                setFormData({
                  ...formData,
                  city: parts[0]?.trim() || '',
                  state: parts[1]?.trim() || ''
                });
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        <div className="pt-4 flex items-center gap-4">
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors"
          >
            <Save size={18} />
            Salvar Alterações
          </button>
          {saved && (
            <span className="text-emerald-600 text-sm font-semibold animate-fade-in">
              ✓ Configurações salvas com sucesso!
            </span>
          )}
        </div>
      </form>

      {/* Appwrite Database Configuration Card */}
      <AppwriteSettingsCard />
    </div>
  );
};

const AppwriteSettingsCard: React.FC = () => {
  const [config, setConfig] = useState(appwriteService.getConfig());
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);

  const handleSaveAppwriteConfig = (e: React.FormEvent) => {
    e.preventDefault();
    appwriteService.updateConfig(config);
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 3000);
  };

  const handleSyncNow = async () => {
    setIsLoading(true);
    setSyncStatus('Sincronizando com o banco Appwrite...');
    const result = await db.syncWithAppwrite();
    setSyncStatus(result.message);
    setIsLoading(false);
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    setSyncStatus('Testando conexão com Appwrite...');
    const result = await appwriteService.testConnection();
    setSyncStatus(result.message);
    setIsLoading(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              Banco de Dados Appwrite
            </h3>
            <p className="text-xs text-slate-400">
              Persistência na nuvem e sincronização em tempo real com Appwrite Cloud
            </p>
          </div>
        </div>

        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
          appwriteService.isConfigured()
            ? 'bg-emerald-100 text-emerald-800'
            : 'bg-amber-100 text-amber-800'
        }`}>
          {appwriteService.isConfigured() ? '● Appwrite Conectado' : '● Modo Local'}
        </span>
      </div>

      <form onSubmit={handleSaveAppwriteConfig} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
              Appwrite Endpoint
            </label>
            <input
              type="text"
              value={config.endpoint}
              onChange={(e) => setConfig({ ...config, endpoint: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:ring-2 focus:ring-rose-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
              Project ID
            </label>
            <input
              type="text"
              value={config.projectId}
              onChange={(e) => setConfig({ ...config, projectId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:ring-2 focus:ring-rose-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
              Database ID
            </label>
            <input
              type="text"
              value={config.databaseId}
              onChange={(e) => setConfig({ ...config, databaseId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:ring-2 focus:ring-rose-500 focus:bg-white"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="submit"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Salvar Conexão Appwrite
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={handleTestConnection}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            Testar Conexão
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={handleSyncNow}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            {isLoading ? 'Sincronizando...' : 'Sincronizar Agora com Appwrite'}
          </button>

          {configSaved && (
            <span className="text-emerald-600 text-xs font-semibold">
              ✓ Conexão salva!
            </span>
          )}

          {syncStatus && (
            <div className="w-full text-slate-700 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg p-2.5 mt-2">
              {syncStatus}
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
