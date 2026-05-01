import React, { useState } from 'react';
import { Modal, Button, Typography, Empty, Spin, Tag } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { Gift, RefreshCw } from 'lucide-react';
import { Cat, Behavior } from '../types';
import { Language, useI18n } from '../i18n';

const { Text } = Typography;

interface Props {
  currentCat: Cat | null;
  lang: Language;
  iconOnly?: boolean;
}

export default function DailyRandom({ currentCat, lang, iconOnly }: Props) {
  const t = useI18n(lang);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [moment, setMoment] = useState<Behavior | null>(null);

  const fetchRandom = async () => {
    if (!currentCat) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/random-photo/${currentCat.id}`);
      setMoment(await res.json());
    } catch { console.error('Failed to fetch random moment'); }
    finally { setLoading(false); }
  };

  const handleOpen = () => {
    setVisible(true);
    fetchRandom();
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className={`
          flex items-center gap-2 bg-white/60 shadow-clay-card rounded-xl font-display font-bold text-clay-accent cursor-pointer
          transition-all duration-200 hover:shadow-clay-card-hover active:scale-95
          ${iconOnly ? 'w-9 h-9 sm:w-10 sm:h-10 justify-center' : 'h-10 px-4 text-sm'}
        `}
        aria-label={t.randomMoment as string}
      >
        <Gift size={16} />
        {!iconOnly && <span className="hidden sm:inline">{t.randomMoment}</span>}
      </button>

      <Modal
        open={visible}
        onCancel={() => setVisible(false)}
        footer={null}
        width={window.innerWidth < 640 ? '95vw' : 520}
        centered
        destroyOnClose
        className="clay-modal"
      >
        <div className="py-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-black text-xl text-clay-foreground flex items-center gap-2">
              <Gift size={20} className="text-clay-accent" />
              {t.randomMoment}
            </h3>
            <button
              onClick={fetchRandom}
              disabled={loading}
              className="w-9 h-9 rounded-xl bg-[#EFEBF5] flex items-center justify-center text-clay-accent cursor-pointer hover:bg-clay-accent/10 transition-colors disabled:opacity-50"
              aria-label={t.refresh as string}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Spin size="large" />
            </div>
          ) : moment ? (
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-[22px] shadow-clay-card group">
                <img 
                  src={moment.value} 
                  alt="Random moment" 
                  className="w-full transition-transform duration-700 group-hover:scale-105" 
                />
                <div className="absolute top-3 right-3">
                  <Tag className="bg-white/80 backdrop-blur-md text-clay-accent font-bold !rounded-xl shadow-sm">
                    {moment.date}
                  </Tag>
                </div>
              </div>
              {moment.notes && (
                <div className="bg-[#EFEBF5] p-4 rounded-2xl shadow-clay-pressed text-center">
                  <Text className="text-base text-clay-foreground font-medium">{moment.notes}</Text>
                </div>
              )}
            </div>
          ) : (
            <Empty description={t.noData} className="py-8" />
          )}
        </div>
      </Modal>
    </>
  );
}
