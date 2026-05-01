import React, { useState, useEffect, useRef } from 'react';
import { Form, DatePicker, Button, Select, Card, Input, message, Typography, Modal, Tag } from 'antd';
import { 
  CameraOutlined, 
  AudioOutlined, 
  VideoCameraOutlined, 
  DeleteOutlined,
  PlusOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import { ImagePlus } from 'lucide-react';
import dayjs from 'dayjs';
import { Cat, Behavior } from '../types';
import { Language, useI18n } from '../i18n';

const { Option } = Select;
const { Title, Text } = Typography;

interface Props {
  currentCat: Cat | null;
  lang: Language;
}

export default function Moments({ currentCat, lang }: Props) {
  const t = useI18n(lang);
  const [loading, setLoading] = useState(false);
  const [moments, setMoments] = useState<Behavior[]>([]);
  const [form] = Form.useForm();
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [type, setType] = useState<'photo' | 'audio' | 'video' | 'weight'>('photo');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewItem, setPreviewItem] = useState<Behavior | null>(null);
  const [showForm, setShowForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentCat) fetchMoments();
  }, [currentCat]);

  useEffect(() => {
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setFilePreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setFilePreview(null);
  }, [file]);

  const fetchMoments = async () => {
    if (!currentCat) return;
    try {
      const res = await fetch(`/api/behaviors/${currentCat.id}`);
      setMoments(await res.json());
    } catch { message.error(t.errorLoad); }
  };

  const onFinish = async (values: any) => {
    if (!currentCat) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('cat_id', currentCat.id);
    formData.append('date', values.date.format('YYYY-MM-DD'));
    formData.append('type', values.type);
    formData.append('notes', values.notes || '');

    if (values.type === 'weight') {
      formData.append('value', values.value.toString());
    } else if (file) {
      formData.append('file', file);
    } else {
      message.error(t.noData);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/behaviors', { method: 'POST', body: formData });
      if (res.ok) {
        message.success(t.save);
        const currentType = form.getFieldValue('type');
        form.resetFields();
        form.setFieldsValue({ type: currentType, date: dayjs() });
        setType(currentType);
        setFile(null);
        setShowForm(false);
        fetchMoments();
      }
    } catch { message.error(t.noData); }
    finally { setLoading(false); }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const getAccept = () => {
    if (type === 'photo') return 'image/*';
    if (type === 'audio') return 'audio/*';
    if (type === 'video') return 'video/*';
    return undefined;
  };

  const mediaMoments = moments.filter(m => m.type !== 'weight');

  return (
    <div className="space-y-6 pb-4">
      {/* FAB for mobile - Add new moment */}
      <div className="sm:hidden">
        <button
          onClick={() => setShowForm(prev => !prev)}
          className="fixed right-4 bottom-20 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 text-white shadow-clay-float flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
          aria-label={t.recordBehavior as string}
        >
          <PlusOutlined className="text-xl" />
        </button>
      </div>

      {/* Upload form */}
      <div className={`${showForm || !isMobileCheck() ? '' : 'hidden sm:block'}`}>
        <Card 
          title={
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-clay-accent/10 flex items-center justify-center">
                <ImagePlus size={16} className="text-clay-accent" />
              </div>
              <span className="font-display font-black text-lg text-clay-foreground">{t.recordBehavior}</span>
            </div>
          }
          className="clay-card animate-slide-up-sm"
        >
          <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ type: 'photo', date: dayjs() }}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Form.Item name="date" label={t.date} rules={[{ required: true }]}>
                <DatePicker className="w-full" />
              </Form.Item>
              <Form.Item name="type" label={t.momentType} rules={[{ required: true }]}>
                <Select onChange={(v) => { setType(v as any); setFile(null); }}>
                  <Option value="photo">{t.photo}</Option>
                  <Option value="audio">{t.audio}</Option>
                  <Option value="video">{t.video}</Option>
                  <Option value="weight">{t.weight}</Option>
                </Select>
              </Form.Item>
              <Form.Item 
                name={type === 'weight' ? 'value' : undefined} 
                label={type === 'weight' ? t.weight : t.moments} 
                rules={type === 'weight' ? [{ required: true }] : undefined}
              >
                {type === 'weight' ? (
                  <Input type="number" step="0.1" placeholder="e.g. 4.5" />
                ) : (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept={getAccept()}
                      capture={type === 'photo' || type === 'video' ? 'environment' : undefined}
                      onChange={handleFileSelect}
                    />
                    {filePreview ? (
                      <div className="relative rounded-2xl overflow-hidden">
                        <img src={filePreview} alt="Preview" className="w-full h-32 object-cover rounded-2xl" />
                        <button 
                          onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center cursor-pointer hover:bg-black/60 transition-colors"
                        >
                          <DeleteOutlined className="text-xs" />
                        </button>
                      </div>
                    ) : file ? (
                      <div className="flex items-center gap-2 bg-[#EFEBF5] p-3 rounded-xl">
                        <span className="truncate flex-1 text-sm">{file.name}</span>
                        <button onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="text-rose-500 cursor-pointer">
                          <DeleteOutlined />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-32 rounded-2xl border-2 border-dashed border-clay-accent/20 bg-clay-accent/5 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-clay-accent/40 hover:bg-clay-accent/8 transition-all"
                      >
                        {type === 'photo' ? <CameraOutlined className="text-2xl text-clay-accent" /> : 
                         type === 'audio' ? <AudioOutlined className="text-2xl text-clay-accent" /> : 
                         <VideoCameraOutlined className="text-2xl text-clay-accent" />}
                        <span className="text-sm font-bold text-clay-accent">
                          {type === 'photo' ? t.takePhoto : type === 'audio' ? t.recordAudio : t.recordVideo}
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </Form.Item>
            </div>
            <Form.Item name="notes" label={t.notes} className="!mb-4">
              <Input.TextArea rows={2} placeholder={lang === 'zh' ? '记录这一刻的心情...' : 'Capture this moment...'} />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} className="clay-button-primary h-11 px-8 text-base">
              {t.save}
            </Button>
          </Form>
        </Card>
      </div>

      {/* Gallery grid */}
      {mediaMoments.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {mediaMoments.map((item, index) => (
            <div 
              key={item.id} 
              className={`animate-slide-up-sm stagger-${Math.min(index % 4 + 1, 4)}`}
            >
              <div
                onClick={() => { setPreviewItem(item); setPreviewVisible(true); }}
                className="clay-card-interactive overflow-hidden group"
              >
                {item.type === 'photo' ? (
                  <div className="aspect-square overflow-hidden rounded-t-[28px]">
                    <img 
                      src={item.value} 
                      alt="Moment" 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                ) : item.type === 'video' ? (
                  <div className="aspect-square bg-gradient-to-br from-blue-50 to-indigo-100 rounded-t-[28px] flex items-center justify-center relative">
                    <PlayCircleOutlined className="text-4xl text-blue-500" />
                  </div>
                ) : (
                  <div className="aspect-square bg-gradient-to-br from-orange-50 to-amber-100 rounded-t-[28px] flex items-center justify-center">
                    <AudioOutlined className="text-4xl text-orange-500" />
                  </div>
                )}
                <div className="p-3 sm:p-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Tag className="bg-gradient-to-r from-clay-accent to-clay-accent-alt text-white !text-[10px] !px-2 !py-0">{t[item.type as keyof typeof t] as string}</Tag>
                  </div>
                  <div className="text-xs text-clay-muted font-medium">{item.date}</div>
                  {item.notes && <div className="text-xs text-clay-foreground mt-1 line-clamp-2">{item.notes}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <div className="w-16 h-16 rounded-[22px] bg-clay-accent/10 flex items-center justify-center mx-auto mb-4">
            <CameraOutlined className="text-2xl text-clay-accent" />
          </div>
          <Text className="text-clay-muted font-medium">{t.noData}</Text>
        </div>
      )}

      {/* Preview modal */}
      <Modal
        open={previewVisible}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width={isMobileCheck() ? '95vw' : 720}
        centered
        destroyOnClose
      >
        {previewItem && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="bg-gradient-to-r from-clay-accent to-clay-accent-alt text-white">{t[previewItem.type as keyof typeof t] as string}</Tag>
              <span className="text-sm text-clay-muted font-medium">{previewItem.date}</span>
            </div>
            {previewItem.type === 'photo' && (
              <img src={previewItem.value} className="w-full rounded-2xl" alt="Preview" />
            )}
            {previewItem.type === 'audio' && (
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-8 rounded-2xl flex items-center justify-center">
                <audio controls src={previewItem.value} className="w-full" />
              </div>
            )}
            {previewItem.type === 'video' && (
              <video controls src={previewItem.value} className="w-full rounded-2xl" />
            )}
            {previewItem.notes && (
              <div className="bg-[#EFEBF5] p-4 rounded-2xl">
                <Text className="text-clay-foreground">{previewItem.notes}</Text>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function isMobileCheck() {
  return window.innerWidth < 640;
}
