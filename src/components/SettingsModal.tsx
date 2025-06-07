import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  treeMode: 'auto' | 'simple' | 'advanced'
  onTreeModeChange: (mode: 'auto' | 'simple' | 'advanced') => void
}

export default function SettingsModal({
  isOpen,
  onClose,
  treeMode,
  onTreeModeChange
}: SettingsModalProps) {
  const [localSettings, setLocalSettings] = useState({
    theme: 'auto' as 'light' | 'dark' | 'auto',
    fontSize: 'medium' as 'small' | 'medium' | 'large',
    treeViewMode: treeMode,
    debugMode: false,
    aiModel: 'gpt-4o-mini'
  })

  useEffect(() => {
    setLocalSettings(prev => ({ ...prev, treeViewMode: treeMode }))
  }, [treeMode])

  const handleSave = () => {
    onTreeModeChange(localSettings.treeViewMode)
    
    // Apply theme
    if (localSettings.theme !== 'auto') {
      document.documentElement.setAttribute('data-color-scheme', localSettings.theme)
    } else {
      document.documentElement.removeAttribute('data-color-scheme')
    }
    
    // Apply font size
    document.documentElement.setAttribute('data-font-size', localSettings.fontSize)
    
    // Save to localStorage
    localStorage.setItem('chatAppSettings', JSON.stringify(localSettings))
    
    onClose()
  }

  const handleCancel = () => {
    setLocalSettings(prev => ({ ...prev, treeViewMode: treeMode }))
    onClose()
  }

  useEffect(() => {
    // Load settings from localStorage
    const saved = localStorage.getItem('chatAppSettings')
    if (saved) {
      try {
        const settings = JSON.parse(saved)
        setLocalSettings(prev => ({ ...prev, ...settings }))
      } catch (error) {
        console.error('Failed to load settings:', error)
      }
    }
  }, [])

  if (!isOpen) return null

  return (
    <div className="modal">
      <div className="modal-content">
        <div className="modal-header">
          <h3>設定</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">テーマ</label>
            <select
              value={localSettings.theme}
              onChange={(e) => setLocalSettings(prev => ({ 
                ...prev, 
                theme: e.target.value as 'light' | 'dark' | 'auto'
              }))}
              className="form-control"
            >
              <option value="light">ライト</option>
              <option value="dark">ダーク</option>
              <option value="auto">自動</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">フォントサイズ</label>
            <select
              value={localSettings.fontSize}
              onChange={(e) => setLocalSettings(prev => ({ 
                ...prev, 
                fontSize: e.target.value as 'small' | 'medium' | 'large'
              }))}
              className="form-control"
            >
              <option value="small">小</option>
              <option value="medium">中</option>
              <option value="large">大</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">ツリー表示モード</label>
            <select
              value={localSettings.treeViewMode}
              onChange={(e) => setLocalSettings(prev => ({ 
                ...prev, 
                treeViewMode: e.target.value as 'auto' | 'simple' | 'advanced'
              }))}
              className="form-control"
            >
              <option value="auto">自動選択</option>
              <option value="simple">常にシンプル</option>
              <option value="advanced">常に高度表示</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">AIモデル</label>
            <select
              value={localSettings.aiModel}
              onChange={(e) => setLocalSettings(prev => ({ 
                ...prev, 
                aiModel: e.target.value 
              }))}
              className="form-control"
            >
              <option value="gpt-4o-mini">GPT-4o Mini</option>
              <option value="gpt-4o">GPT-4o</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              <input
                type="checkbox"
                checked={localSettings.debugMode}
                onChange={(e) => setLocalSettings(prev => ({ 
                  ...prev, 
                  debugMode: e.target.checked 
                }))}
                style={{ marginRight: '8px' }}
              />
              デバッグモード
            </label>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn--secondary" onClick={handleCancel}>
            キャンセル
          </button>
          <button className="btn btn--primary" onClick={handleSave}>
            保存
          </button>
        </div>
      </div>
    </div>
  )
} 