'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Radio, Facebook, LineChart, Tag, CheckCircle, Circle, Zap, Info } from 'lucide-react';

const ToggleSwitch = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
  <button
    onClick={onToggle}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${
      enabled ? 'bg-primary' : 'bg-muted'
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
        enabled ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

export default function TrackingAdmin() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<any>({});
  const [isModified, setIsModified] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-settings-tracking'],
    queryFn: async () => {
      const { data } = await api.get('/settings');
      return data;
    }
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
      setIsModified(false);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => api.put('/settings', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings-tracking'] });
      queryClient.invalidateQueries({ queryKey: ['global-settings'] });
      toast.success('Tracking settings saved');
      setIsModified(false);
    },
    onError: () => toast.error('Failed to save settings'),
  });

  const handleChange = (key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
    setIsModified(true);
  };

  const handleSave = () => updateMutation.mutate(formData);

  const integrations = [
    {
      icon: Facebook,
      name: 'Facebook Pixel',
      description: 'Track conversions and build custom audiences for Facebook & Instagram ads.',
      idKey: 'fbPixelId',
      enabledKey: 'fbPixelEnabled',
      placeholder: 'e.g. 1234567890123456',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      events: ['PageView', 'AddToCart', 'Purchase', 'ViewContent'],
    },
    {
      icon: LineChart,
      name: 'Google Analytics 4',
      description: 'Measure user engagement, traffic sources, and conversion paths.',
      idKey: 'gaId',
      enabledKey: 'gaEnabled',
      placeholder: 'e.g. G-XXXXXXXXXX',
      color: 'text-orange-400',
      bgColor: 'bg-orange-400/10',
      events: ['page_view', 'add_to_cart', 'purchase', 'view_item'],
    },
    {
      icon: Tag,
      name: 'Google Tag Manager',
      description: 'Deploy and manage all your marketing tags without editing code.',
      idKey: 'gtmId',
      enabledKey: 'gtmEnabled',
      placeholder: 'e.g. GTM-XXXXXXX',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      events: ['All custom events via GTM triggers'],
    },
  ];

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col gap-8 max-w-5xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight mb-2 flex items-center gap-3">
            <Radio className="w-8 h-8 text-primary" /> Marketing & Tracking
          </h1>
          <p className="text-muted-foreground text-sm">
            Connect your analytics and advertising pixels. Scripts are automatically injected — no code editing required.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={!isModified || updateMutation.isPending}
          className={`gap-2 h-10 px-8 rounded-full uppercase tracking-widest text-xs font-bold shrink-0 ${isModified ? 'shadow-[0_0_15px_rgba(196,106,60,0.4)]' : ''}`}
        >
          <Save className="w-4 h-4" />
          {updateMutation.isPending ? 'Saving...' : 'Save All'}
        </Button>
      </div>

      {/* Status Banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-start gap-3">
        <Zap className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-foreground mb-1">Auto-Injection Active</p>
          <p className="text-xs text-muted-foreground">
            Enabled tracking scripts are automatically injected into every page of your storefront. Toggle off to pause without deleting your IDs.
          </p>
        </div>
      </div>

      {/* Integration Cards */}
      <div className="flex flex-col gap-6">
        {integrations.map((integ) => {
          const isEnabled = formData[integ.enabledKey] ?? false;
          const idValue = formData[integ.idKey] ?? '';

          return (
            <div
              key={integ.idKey}
              className={`bg-card border rounded-2xl p-6 transition-all duration-300 ${
                isEnabled ? 'border-primary/40 shadow-lg shadow-primary/5' : 'border-border'
              }`}
            >
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl ${integ.bgColor} flex items-center justify-center`}>
                    <integ.icon className={`w-6 h-6 ${integ.color}`} />
                  </div>
                  <div>
                    <h2 className="text-lg font-serif font-bold">{integ.name}</h2>
                    <p className="text-xs text-muted-foreground max-w-md">{integ.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs font-semibold uppercase tracking-widest ${isEnabled ? 'text-primary' : 'text-muted-foreground'}`}>
                    {isEnabled ? 'Live' : 'Off'}
                  </span>
                  <ToggleSwitch
                    enabled={isEnabled}
                    onToggle={() => handleChange(integ.enabledKey, !isEnabled)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 block">
                    {integ.name} ID
                  </label>
                  <Input
                    value={idValue}
                    onChange={(e) => handleChange(integ.idKey, e.target.value)}
                    placeholder={integ.placeholder}
                    className="bg-background font-mono"
                  />
                </div>

                {/* Events tracked */}
                <div className="mt-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
                    <Info className="w-3 h-3" /> Events Tracked
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {integ.events.map((ev) => (
                      <span
                        key={ev}
                        className={`flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded-full border ${
                          isEnabled
                            ? 'border-primary/30 text-primary bg-primary/5'
                            : 'border-border text-muted-foreground'
                        }`}
                      >
                        {isEnabled ? <CheckCircle className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                        {ev}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {isEnabled && !idValue && (
                <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-xs text-yellow-500 font-medium">⚠ Enabled but no ID entered. Please add your {integ.name} ID above.</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
