import React, { useState, useEffect, useCallback } from 'react';
import { ConfigProvider, message, Drawer } from 'antd';
import {
  UserOutlined,
  DashboardOutlined,
  CameraOutlined,
  HeartOutlined,
  WarningOutlined,
  GlobalOutlined,
  PlusCircleOutlined,
  MenuOutlined
} from '@ant-design/icons';
import { Cat as CatIcon } from 'lucide-react';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import CatProfile from './components/CatProfile';
import Dashboard from './components/Dashboard';
import Moments from './components/Moments';
import Cares from './components/Cares';
import Abnormalities from './components/Abnormalities';
import DailyRandom from './components/DailyRandom';
import { Cat } from './types';
import { Language, useI18n } from './i18n';

type TabKey = 'dashboard' | 'moments' | 'care' | 'abnormalities' | 'profile';

const NAV_ITEMS: { key: TabKey; icon: React.ReactNode; labelKey: string }[] = [
  { key: 'dashboard', icon: <DashboardOutlined />, labelKey: 'dashboard' },
  { key: 'moments', icon: <CameraOutlined />, labelKey: 'moments' },
  { key: 'care', icon: <HeartOutlined />, labelKey: 'care' },
  { key: 'abnormalities', icon: <WarningOutlined />, labelKey: 'abnormalities' },
  { key: 'profile', icon: <UserOutlined />, labelKey: 'profile' },
];

export default function App() {
  const [lang, setLang] = useState<Language>('zh');
  const t = useI18n(lang);
  const [selectedKey, setSelectedKey] = useState<TabKey>('dashboard');
  const [currentCat, setCurrentCat] = useState<Cat | null>(null);
  const [cats, setCats] = useState<Cat[]>([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => { fetchCats(); }, []);

  const fetchCats = async () => {
    try {
      const res = await fetch('/api/cats');
      const data = await res.json();
      setCats(data);
      if (data.length > 0 && !currentCat) setCurrentCat(data[0]);
    } catch { message.error(t.errorLoad); }
  };

  const handleNav = useCallback((key: TabKey) => {
    setSelectedKey(key);
    setDrawerOpen(false);
  }, []);

  const toggleLang = useCallback(() => {
    setLang(prev => prev === 'zh' ? 'en' : 'zh');
  }, []);

  const renderContent = () => {
    if (!currentCat && selectedKey !== 'profile') {
      return (
        <div className="flex flex-col items-center justify-center py-24 px-6 animate-fade-in">
          <div className="bg-gradient-to-br from-purple-400 to-purple-600 p-6 rounded-[32px] shadow-clay-float mb-8 animate-clay-breathe">
            <CatIcon size={48} className="text-white" />
          </div>
          <h2 className="font-display font-black text-2xl text-clay-foreground mb-3 text-center">{t.addCat}</h2>
          <p className="text-clay-muted mb-8 text-center max-w-xs">开始记录你的小猫咪的成长旅程</p>
          <button
            onClick={() => setSelectedKey('profile')}
            className="clay-button-primary px-8 py-4 text-lg flex items-center gap-2"
          >
            <PlusCircleOutlined />
            {t.addCat}
          </button>
        </div>
      );
    }

    const key = `page-${selectedKey}`;
    return (
      <div key={key} className="page-enter">
        {selectedKey === 'dashboard' && <Dashboard currentCat={currentCat} lang={lang} />}
        {selectedKey === 'moments' && <Moments currentCat={currentCat} lang={lang} />}
        {selectedKey === 'care' && <Cares currentCat={currentCat} lang={lang} />}
        {selectedKey === 'abnormalities' && <Abnormalities currentCat={currentCat} lang={lang} />}
        {selectedKey === 'profile' && <CatProfile currentCat={currentCat} onCatAdded={fetchCats} lang={lang} />}
      </div>
    );
  };

  return (
    <ConfigProvider 
      locale={lang === 'zh' ? zhCN : enUS}
      theme={{
        token: {
          colorPrimary: '#7C3AED',
          borderRadius: 18,
          fontFamily: 'DM Sans, sans-serif',
        },
      }}
    >
      {/* Ambient background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50vmax] h-[50vmax] bg-purple-400/8 rounded-full blur-[100px] animate-clay-float" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45vmax] h-[45vmax] bg-pink-400/8 rounded-full blur-[100px] animate-clay-float-delayed" />
        <div className="absolute top-[30%] right-[5%] w-[30vmax] h-[30vmax] bg-blue-400/5 rounded-full blur-[80px] animate-clay-float" />
      </div>

      <div className="min-h-[100dvh] flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-2xl border-b border-purple-100/50">
          <div className="max-w-7xl mx-auto flex items-center justify-between h-16 sm:h-[72px] px-4 sm:px-6">
            <div className="flex items-center gap-3 min-w-0">
              {isMobile && (
                <button 
                  onClick={() => setDrawerOpen(true)} 
                  className="p-2 -ml-2 rounded-xl text-clay-muted hover:text-clay-accent hover:bg-clay-accent/5 transition-colors lg:hidden"
                  aria-label="Open menu"
                >
                  <MenuOutlined className="text-lg" />
                </button>
              )}
              <div className="bg-gradient-to-br from-purple-400 to-purple-600 p-2 rounded-2xl shadow-md shrink-0 animate-clay-breathe">
                <CatIcon size={20} className="text-white" />
              </div>
              <h1 className="font-display font-black text-lg sm:text-xl text-clay-foreground truncate">{t.appName}</h1>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <DailyRandom currentCat={currentCat} lang={lang} iconOnly={isMobile} />
              <button
                onClick={toggleLang}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/60 shadow-clay-card flex items-center justify-center text-clay-muted hover:text-clay-accent transition-colors cursor-pointer"
                aria-label="Switch language"
              >
                <GlobalOutlined className="text-base" />
              </button>
              {currentCat && (
                <button 
                  onClick={() => setSelectedKey('profile')} 
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  {currentCat.avatar ? (
                    <img 
                      src={currentCat.avatar} 
                      alt={currentCat.name}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover border-2 border-white shadow-md transition-transform group-hover:scale-105" 
                    />
                  ) : (
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center border-2 border-white shadow-md">
                      <UserOutlined className="text-white text-sm" />
                    </div>
                  )}
                  <span className="font-display font-black text-sm text-clay-foreground hidden sm:inline">{currentCat.name}</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Main content area */}
        <div className="flex-1 flex max-w-7xl mx-auto w-full">
          {/* Desktop sidebar */}
          {!isMobile && (
            <aside className="w-56 shrink-0 p-6 pr-0">
              <nav className="sticky top-24 bg-white/60 backdrop-blur-xl rounded-[28px] p-3 shadow-clay-card space-y-1">
                {NAV_ITEMS.map(item => {
                  const active = selectedKey === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => handleNav(item.key)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-[18px] text-left transition-all duration-200 cursor-pointer ${
                        active 
                          ? 'bg-gradient-to-r from-clay-accent/10 to-clay-accent/5 text-clay-accent shadow-sm' 
                          : 'text-clay-muted hover:text-clay-foreground hover:bg-white/50'
                      }`}
                    >
                      <span className={`text-lg ${active ? 'text-clay-accent' : ''}`}>{item.icon}</span>
                      <span className="font-display font-bold text-sm">{t[item.labelKey as keyof typeof t]}</span>
                    </button>
                  );
                })}
              </nav>
            </aside>
          )}

          {/* Content */}
          <main className="flex-1 min-w-0 p-4 sm:p-6 pb-24 lg:pb-6">
            <div className="clay-surface p-4 sm:p-8 min-h-[calc(100dvh-8rem)] overflow-hidden">
              <div className="h-full overflow-y-auto overflow-x-hidden custom-scrollbar">
                {renderContent()}
              </div>
            </div>
          </main>
        </div>

        {/* Mobile bottom tab bar */}
        {isMobile && (
          <nav className="fixed bottom-0 inset-x-0 z-50 px-3 safe-bottom" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)' }}>
            <div className="bg-white/90 backdrop-blur-2xl rounded-[22px] shadow-clay-float border border-white/60 flex items-stretch">
              {NAV_ITEMS.map(item => {
                const active = selectedKey === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => handleNav(item.key)}
                    className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-all duration-200 cursor-pointer rounded-[18px] mx-0.5 ${
                      active 
                        ? 'text-clay-accent bg-clay-accent/8' 
                        : 'text-clay-muted'
                    }`}
                    aria-label={String(t[item.labelKey as keyof typeof t])}
                  >
                    <span className={`text-lg transition-transform duration-200 ${active ? 'scale-110' : ''}`}>{item.icon}</span>
                    <span className={`text-[10px] font-bold leading-none ${active ? 'text-clay-accent' : 'text-clay-muted'}`}>
                      {t[item.labelKey as keyof typeof t]}
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>
        )}

        {/* Mobile Drawer */}
        <Drawer
          title={
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-purple-400 to-purple-600 p-2 rounded-xl shadow-md">
                <CatIcon size={18} className="text-white" />
              </div>
              <span className="font-display font-black text-lg">{t.appName}</span>
            </div>
          }
          placement="left"
          onClose={() => setDrawerOpen(false)}
          open={drawerOpen}
          width={280}
          styles={{ body: { padding: '12px' } }}
        >
          <nav className="space-y-1">
            {NAV_ITEMS.map(item => {
              const active = selectedKey === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => handleNav(item.key)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all duration-200 cursor-pointer ${
                    active 
                      ? 'bg-gradient-to-r from-clay-accent/10 to-clay-accent/5 text-clay-accent' 
                      : 'text-clay-muted hover:text-clay-foreground hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-display font-bold">{t[item.labelKey as keyof typeof t]}</span>
                </button>
              );
            })}
          </nav>
          {currentCat && (
            <div className="mt-6 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl">
              <div className="flex items-center gap-3">
                {currentCat.avatar ? (
                  <img src={currentCat.avatar} alt={currentCat.name} className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-md" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center border-2 border-white shadow-md">
                    <UserOutlined className="text-white" />
                  </div>
                )}
                <div>
                  <div className="font-display font-black text-clay-foreground">{currentCat.name}</div>
                  <div className="text-xs text-clay-muted">{currentCat.birthday}</div>
                </div>
              </div>
            </div>
          )}
        </Drawer>
      </div>
    </ConfigProvider>
  );
}
