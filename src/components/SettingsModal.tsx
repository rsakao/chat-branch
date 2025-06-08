import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import LanguageSelector from './LanguageSelector';
import { useLocale } from '../hooks/useLocale';
import { Locale } from '../i18n/config';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  treeMode: 'auto' | 'simple' | 'advanced';
  onTreeModeChange: (mode: 'auto' | 'simple' | 'advanced') => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  treeMode,
  onTreeModeChange,
}: SettingsModalProps) {
  const t = useTranslations('settings');
  const { locale, setLocale } = useLocale();
  const [localSettings, setLocalSettings] = useState({
    language: locale,
    theme: 'auto' as 'light' | 'dark' | 'auto',
    fontSize: 'medium' as 'small' | 'medium' | 'large',
    treeViewMode: treeMode,
    debugMode: false,
    sendBehavior: 'enter' as 'enter' | 'shift-enter',
  });

  // Load saved settings from localStorage
  const loadSavedSettings = () => {
    const saved = localStorage.getItem('chatAppSettings');
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        return {
          language: locale,
          theme: settings.theme || 'auto',
          fontSize: settings.fontSize || 'medium',
          treeViewMode: treeMode,
          debugMode: settings.debugMode || false,
          sendBehavior: settings.sendBehavior || 'enter',
        };
      } catch (error) {
        console.error('Failed to load settings:', error);
        return {
          language: locale,
          theme: 'auto' as 'light' | 'dark' | 'auto',
          fontSize: 'medium' as 'small' | 'medium' | 'large',
          treeViewMode: treeMode,
          debugMode: false,
          sendBehavior: 'enter' as 'enter' | 'shift-enter',
        };
      }
    }
    return {
      language: locale,
      theme: 'auto' as 'light' | 'dark' | 'auto',
      fontSize: 'medium' as 'small' | 'medium' | 'large',
      treeViewMode: treeMode,
      debugMode: false,
      sendBehavior: 'enter' as 'enter' | 'shift-enter',
    };
  };

  // Reset to saved settings when modal opens
  useEffect(() => {
    if (isOpen) {
      const savedSettings = loadSavedSettings();
      setLocalSettings(savedSettings);
    }
  }, [isOpen, locale, treeMode]);

  const handleSave = () => {
    onTreeModeChange(localSettings.treeViewMode);

    // Apply language change
    if (localSettings.language !== locale) {
      setLocale(localSettings.language);
    }

    // Apply theme
    if (localSettings.theme !== 'auto') {
      document.documentElement.setAttribute(
        'data-color-scheme',
        localSettings.theme
      );
    } else {
      document.documentElement.removeAttribute('data-color-scheme');
    }

    // Apply font size
    document.documentElement.setAttribute(
      'data-font-size',
      localSettings.fontSize
    );

    // Save to localStorage
    localStorage.setItem('chatAppSettings', JSON.stringify(localSettings));

    // Dispatch custom event to notify other components of settings change
    window.dispatchEvent(new CustomEvent('settingsUpdated'));

    onClose();
  };

  const handleCancel = () => {
    // Reset to saved settings
    const savedSettings = loadSavedSettings();
    setLocalSettings(savedSettings);
    onClose();
  };

  const handleClose = () => {
    // Reset to saved settings when closing with X button
    const savedSettings = loadSavedSettings();
    setLocalSettings(savedSettings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{t('title')}</h3>
          <button className="modal-close" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <LanguageSelector 
            value={localSettings.language}
            onChange={(language: Locale) =>
              setLocalSettings((prev) => ({ ...prev, language }))
            }
          />

          <div className="form-group">
            <label className="form-label">{t('theme')}</label>
            <select
              value={localSettings.theme}
              onChange={(e) =>
                setLocalSettings((prev) => ({
                  ...prev,
                  theme: e.target.value as 'light' | 'dark' | 'auto',
                }))
              }
              className="form-control"
            >
              <option value="light">{t('themeOptions.light')}</option>
              <option value="dark">{t('themeOptions.dark')}</option>
              <option value="auto">{t('themeOptions.auto')}</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">{t('fontSize')}</label>
            <select
              value={localSettings.fontSize}
              onChange={(e) =>
                setLocalSettings((prev) => ({
                  ...prev,
                  fontSize: e.target.value as 'small' | 'medium' | 'large',
                }))
              }
              className="form-control"
            >
              <option value="small">{t('fontSizeOptions.small')}</option>
              <option value="medium">{t('fontSizeOptions.medium')}</option>
              <option value="large">{t('fontSizeOptions.large')}</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">{t('treeMode')}</label>
            <select
              value={localSettings.treeViewMode}
              onChange={(e) =>
                setLocalSettings((prev) => ({
                  ...prev,
                  treeViewMode: e.target.value as
                    | 'auto'
                    | 'simple'
                    | 'advanced',
                }))
              }
              className="form-control"
            >
              <option value="auto">{t('treeModeOptions.auto')}</option>
              <option value="simple">{t('treeModeOptions.simple')}</option>
              <option value="advanced">{t('treeModeOptions.advanced')}</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">{t('sendBehavior')}</label>
            <select
              value={localSettings.sendBehavior}
              onChange={(e) =>
                setLocalSettings((prev) => ({
                  ...prev,
                  sendBehavior: e.target.value as 'enter' | 'shift-enter',
                }))
              }
              className="form-control"
            >
              <option value="enter">{t('sendBehaviorOptions.enter')}</option>
              <option value="shift-enter">{t('sendBehaviorOptions.shiftEnter')}</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              <input
                type="checkbox"
                checked={localSettings.debugMode}
                onChange={(e) =>
                  setLocalSettings((prev) => ({
                    ...prev,
                    debugMode: e.target.checked,
                  }))
                }
                style={{ marginRight: '8px' }}
              />
              {t('debugMode')}
            </label>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn--secondary" onClick={handleCancel}>
            {t('cancel')}
          </button>
          <button className="btn btn--primary" onClick={handleSave}>
            {t('save')}
          </button>
        </div>
      </div>
    </div>
  );
}
