import React, { useState, useEffect } from 'react';
import { Card, Calendar, Badge, Typography, Checkbox, Empty, Popover, List, Image } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, Scale } from 'lucide-react';
import dayjs, { Dayjs } from 'dayjs';
import { Cat, Care, Abnormality, Behavior } from '../types';
import { Language, useI18n } from '../i18n';

const { Title, Text } = Typography;

interface Props {
  currentCat: Cat | null;
  lang: Language;
}

export default function Dashboard({ currentCat, lang }: Props) {
  const t = useI18n(lang);
  const [cares, setCares] = useState<Care[]>([]);
  const [abnormalities, setAbnormalities] = useState<Abnormality[]>([]);
  const [behaviors, setBehaviors] = useState<Behavior[]>([]);
  const [filters, setFilters] = useState<string[]>(['care', 'abnormality']);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (currentCat) fetchData();
  }, [currentCat]);

  const fetchData = async () => {
    if (!currentCat) return;
    try {
      const [caresRes, abRes, behRes] = await Promise.all([
        fetch(`/api/cares/${currentCat.id}`),
        fetch(`/api/abnormalities/${currentCat.id}`),
        fetch(`/api/behaviors/${currentCat.id}`)
      ]);
      setCares(await caresRes.json());
      setAbnormalities(await abRes.json());
      setBehaviors(await behRes.json());
    } catch {
      console.error('Failed to fetch dashboard data');
    }
  };

  const weightData = behaviors
    .filter(b => b.type === 'weight')
    .map(b => ({ date: b.date, weight: parseFloat(b.value) }))
    .sort((a, b) => dayjs(a.date).unix() - dayjs(b.date).unix());

  const latestWeight = weightData.length > 0 ? weightData[weightData.length - 1] : null;
  const prevWeight = weightData.length > 1 ? weightData[weightData.length - 2] : null;
  const weightDiff = latestWeight && prevWeight ? (latestWeight.weight - prevWeight.weight).toFixed(2) : null;

  const getListData = (value: Dayjs) => {
    const dateStr = value.format('YYYY-MM-DD');
    const items: { type: string; content: string; color: string }[] = [];

    if (filters.includes('care')) {
      cares.filter(c => c.date === dateStr).forEach(c => {
        items.push({ type: 'success', content: t[c.type as keyof typeof t] as string || c.type, color: 'green' });
      });
    }
    if (filters.includes('abnormality')) {
      abnormalities.filter(a => a.date === dateStr).forEach(a => {
        items.push({ type: 'error', content: t[a.type as keyof typeof t] as string || a.type, color: 'red' });
      });
    }
    return items;
  };

  const dateCellRender = (value: Dayjs) => {
    const listData = getListData(value);
    const dateStr = value.format('YYYY-MM-DD');
    const dayAbnormalities = abnormalities.filter(a => a.date === dateStr);

    const popoverContent = dayAbnormalities.length > 0 ? (
      <div className="max-w-xs">
        <Title level={5} className="!mb-2">{t.abnormalityDetails}</Title>
        <List
          size="small"
          dataSource={dayAbnormalities}
          renderItem={item => (
            <List.Item className="!px-0 flex-col !items-start">
              <div className="flex items-center justify-between w-full">
                <Text strong>{t[item.type as keyof typeof t] as string || item.type}</Text>
                <Badge count={item.severity} color="red" size="small" />
              </div>
              <Text type="secondary" className="text-xs mt-1">{item.notes}</Text>
              {item.photos && item.photos.length > 0 && (
                <div className="flex gap-1 mt-2 overflow-x-auto pb-1">
                  {item.photos.map((p, i) => (
                    <Image key={i} src={p} width={36} height={36} className="rounded-md object-cover" />
                  ))}
                </div>
              )}
            </List.Item>
          )}
        />
      </div>
    ) : null;

    if (isMobile) {
      return (
        <Popover content={popoverContent} trigger="click" placement="bottom">
          <div className="flex justify-center gap-0.5 mt-0.5">
            {listData.slice(0, 3).map((item, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full ${item.color === 'green' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            ))}
          </div>
        </Popover>
      );
    }

    return (
      <Popover content={popoverContent} trigger="hover">
        <ul className="list-none p-0 m-0 space-y-0.5">
          {listData.map((item, i) => (
            <li key={i}><Badge status={item.type as any} text={<span className="text-xs">{item.content}</span>} /></li>
          ))}
        </ul>
      </Popover>
    );
  };

  return (
    <div className="space-y-5 sm:space-y-8 pb-4">
      {/* Weight summary strip */}
      {latestWeight && (
        <div className="animate-slide-up-sm">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[140px] bg-gradient-to-br from-purple-50 to-white rounded-[22px] p-4 sm:p-5 shadow-clay-card">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-clay-accent/10 flex items-center justify-center">
                  <Scale size={16} className="text-clay-accent" />
                </div>
                <span className="text-xs font-bold text-clay-muted">{t.weight}</span>
              </div>
              <div className="font-display font-black text-2xl sm:text-3xl text-clay-foreground">{latestWeight.weight} <span className="text-base font-bold text-clay-muted">kg</span></div>
              <div className="text-xs text-clay-muted mt-1">{latestWeight.date}</div>
            </div>
            {weightDiff && (
              <div className="flex-1 min-w-[140px] bg-gradient-to-br from-emerald-50 to-white rounded-[22px] p-4 sm:p-5 shadow-clay-card">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <TrendingUp size={16} className="text-emerald-600" />
                  </div>
                  <span className="text-xs font-bold text-clay-muted">{lang === 'zh' ? '变化' : 'Change'}</span>
                </div>
                <div className={`font-display font-black text-2xl sm:text-3xl ${parseFloat(weightDiff) >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {parseFloat(weightDiff) >= 0 ? '+' : ''}{weightDiff} <span className="text-base font-bold text-clay-muted">kg</span>
                </div>
                <div className="text-xs text-clay-muted mt-1">{lang === 'zh' ? '较上次' : 'vs previous'}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Weight chart */}
      <div className="animate-slide-up stagger-1">
        <Card 
          title={
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-clay-accent/10 flex items-center justify-center">
                <Scale size={16} className="text-clay-accent" />
              </div>
              <span className="font-display font-black text-lg sm:text-xl text-clay-foreground">{t.weightStats}</span>
            </div>
          }
          className="clay-card"
        >
          {weightData.length > 0 ? (
            <div className="h-56 sm:h-72 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weightData}>
                  <defs>
                    <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFEBF5" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#635F69', fontSize: isMobile ? 10 : 12, fontWeight: 600 }}
                    tickFormatter={(v) => isMobile ? dayjs(v).format('MM/DD') : v}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#635F69', fontSize: 12, fontWeight: 600 }}
                    width={40}
                    label={!isMobile ? { value: 'kg', angle: -90, position: 'insideLeft', fill: '#635F69', fontWeight: 700 } : undefined}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '18px', 
                      border: 'none', 
                      boxShadow: '8px 8px 24px rgba(160, 150, 180, 0.2)',
                      background: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(10px)',
                      padding: '12px 16px',
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="weight" 
                    name={t.weight as string}
                    stroke="#7C3AED" 
                    strokeWidth={3}
                    fill="url(#weightGradient)"
                    dot={{ r: 4, fill: '#7C3AED', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#DB2777' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <Empty description={t.noData} className="py-8" />
          )}
        </Card>
      </div>

      {/* Calendar */}
      <div className="animate-slide-up stagger-2">
        <Card 
          title={
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <span className="font-display font-black text-lg sm:text-xl text-clay-foreground">{t.calendar}</span>
              <Checkbox.Group 
                options={[
                  { label: <span className="text-sm font-bold">{t.care}</span>, value: 'care' },
                  { label: <span className="text-sm font-bold">{t.abnormalities}</span>, value: 'abnormality' }
                ]} 
                value={filters} 
                onChange={(v) => setFilters(v as string[])} 
                className="flex gap-3"
              />
            </div>
          }
          className="clay-card overflow-hidden"
        >
          <div className="w-full -mx-2 sm:mx-0">
            <Calendar 
              cellRender={dateCellRender} 
              fullscreen={!isMobile}
              className="w-full"
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
