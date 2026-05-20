import React from 'react';
import {
  Check,
  Image,
  Monitor,
  Palette,
  Settings as SettingsIcon,
  Sparkles,
} from 'lucide-react';
import { useSystemStore, type AccentColor, type WallpaperId } from '@/features/desktop/store/useSystemStore';

const wallpaperOptions: Array<{
  id: WallpaperId;
  label: string;
  swatch: string;
}> = [
  { id: 'image', label: 'Default', swatch: "bg-[url('/wallpaper.jpg')] bg-cover bg-center" },
  { id: 'aurora', label: 'Aurora', swatch: 'bg-gradient-to-br from-cyan-500 via-blue-500 to-fuchsia-500' },
  { id: 'midnight', label: 'Midnight', swatch: 'bg-gradient-to-br from-zinc-950 via-slate-800 to-cyan-950' },
  { id: 'sunset', label: 'Sunset', swatch: 'bg-gradient-to-br from-rose-500 via-amber-400 to-sky-500' },
];

const accentOptions: Array<{
  id: AccentColor;
  label: string;
  className: string;
}> = [
  { id: 'blue', label: 'Blue', className: 'bg-blue-500' },
  { id: 'emerald', label: 'Emerald', className: 'bg-emerald-500' },
  { id: 'violet', label: 'Violet', className: 'bg-violet-500' },
  { id: 'rose', label: 'Rose', className: 'bg-rose-500' },
];

const sectionClass = 'border-b border-white/10 p-5 last:border-b-0';

const Settings: React.FC = () => {
  const settings = useSystemStore((state) => state.settings);
  const updateSettings = useSystemStore((state) => state.updateSettings);

  return (
    <div className="flex h-full min-h-0 bg-zinc-950/40 text-white">
      <aside className="w-48 shrink-0 border-r border-white/10 bg-black/20 p-3">
        <div className="mb-4 flex items-center gap-2 px-2 py-1.5">
          <SettingsIcon size={18} className="text-white/80" />
          <span className="text-sm font-semibold">Settings</span>
        </div>
        <nav className="space-y-1">
          <button className="flex w-full items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-left text-sm text-white">
            <Monitor size={16} />
            Personalization
          </button>
        </nav>
      </aside>

      <main className="min-w-0 flex-1 overflow-auto">
        <div className={sectionClass}>
          <div className="mb-4 flex items-center gap-3">
            <Image size={18} className="text-white/75" />
            <div>
              <h2 className="text-base font-semibold">Wallpaper</h2>
              <p className="text-xs text-white/55">Change the desktop background.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {wallpaperOptions.map((option) => {
              const selected = settings.wallpaper === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => updateSettings({ wallpaper: option.id })}
                  className={`group overflow-hidden rounded-lg border text-left transition-colors ${
                    selected ? 'border-white/70 bg-white/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/10'
                  }`}
                >
                  <div className={`h-20 ${option.swatch}`} />
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-sm">{option.label}</span>
                    {selected && <Check size={16} className="text-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className={sectionClass}>
          <div className="mb-4 flex items-center gap-3">
            <Palette size={18} className="text-white/75" />
            <div>
              <h2 className="text-base font-semibold">Accent Color</h2>
              <p className="text-xs text-white/55">Used by the launcher and system controls.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {accentOptions.map((option) => {
              const selected = settings.accentColor === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => updateSettings({ accentColor: option.id })}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    selected ? 'border-white/70 bg-white/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/10'
                  }`}
                >
                  <span className={`h-4 w-4 rounded-full ${option.className}`} />
                  {option.label}
                  {selected && <Check size={14} />}
                </button>
              );
            })}
          </div>
        </div>

        <div className={sectionClass}>
          <div className="mb-4 flex items-center gap-3">
            <Sparkles size={18} className="text-white/75" />
            <div>
              <h2 className="text-base font-semibold">System</h2>
              <p className="text-xs text-white/55">Adjust how the shell renders common controls.</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
              <span>
                <span className="block text-sm font-medium">Reduce transparency</span>
                <span className="block text-xs text-white/50">Use stronger backgrounds behind the taskbar and launcher.</span>
              </span>
              <input
                type="checkbox"
                checked={settings.reduceTransparency}
                onChange={(event) => updateSettings({ reduceTransparency: event.target.checked })}
                className="h-4 w-4 shrink-0 accent-white"
              />
            </label>

            <label className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
              <span>
                <span className="block text-sm font-medium">Show seconds in clock</span>
                <span className="block text-xs text-white/50">Display a more precise taskbar clock.</span>
              </span>
              <input
                type="checkbox"
                checked={settings.showSeconds}
                onChange={(event) => updateSettings({ showSeconds: event.target.checked })}
                className="h-4 w-4 shrink-0 accent-white"
              />
            </label>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
