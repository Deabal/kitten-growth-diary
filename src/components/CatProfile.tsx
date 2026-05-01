import React, { useState } from "react";
import {
  Form,
  Input,
  DatePicker,
  Button,
  Upload,
  Card,
  message,
  Typography,
} from "antd";
import { UploadOutlined, UserOutlined, CameraOutlined } from "@ant-design/icons";
import { Sparkles, Cake, PenLine } from "lucide-react";
import dayjs from "dayjs";
import { Cat } from "../types";
import { Language, useI18n } from "../i18n";

const { Text } = Typography;

interface Props {
  currentCat: Cat | null;
  onCatAdded: () => void;
  lang: Language;
}

export default function CatProfile({ currentCat, onCatAdded, lang }: Props) {
  const t = useI18n(lang);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  React.useEffect(() => {
    if (currentCat) {
      form.setFieldsValue({
        name: currentCat.name,
        birthday: dayjs(currentCat.birthday),
        characteristics: currentCat.characteristics,
      });
    } else {
      form.resetFields();
    }
    setAvatarFile(null);
    setAvatarPreview(null);
  }, [currentCat, form]);

  const getDaysToBirthday = (birthday: string) => {
    const birth = dayjs(birthday);
    const today = dayjs();
    let nextBirthday = birth.year(today.year());
    if (nextBirthday.isBefore(today, "day")) nextBirthday = nextBirthday.add(1, "year");
    return nextBirthday.diff(today, "day");
  };

  const getAge = (birthday: string) => {
    const birth = dayjs(birthday);
    const today = dayjs();
    const years = today.diff(birth, 'year');
    const months = today.diff(birth, 'month') % 12;
    if (years > 0) return lang === 'zh' ? `${years}岁${months}个月` : `${years}y ${months}m`;
    return lang === 'zh' ? `${months}个月` : `${months} months`;
  };

  const handleAvatarSelect = (file: File) => {
    setAvatarFile(file);
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("birthday", values.birthday.format("YYYY-MM-DD"));
    formData.append("characteristics", values.characteristics);
    if (avatarFile) {
      formData.append("avatar", avatarFile);
    } else if (currentCat?.avatar) {
      formData.append("avatar", currentCat.avatar);
    }

    try {
      const url = currentCat ? `/api/cats/${currentCat.id}` : "/api/cats";
      const method = currentCat ? "PUT" : "POST";
      const res = await fetch(url, { method, body: formData });
      if (res.ok) {
        message.success(t.save);
        if (!currentCat) { form.resetFields(); setAvatarFile(null); setAvatarPreview(null); }
        onCatAdded();
      }
    } catch { message.error(t.errorSave); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 pb-4 max-w-2xl mx-auto">
      {/* Profile hero card */}
      {currentCat && (
        <div className="animate-slide-up">
          <div className="bg-gradient-to-br from-purple-50 via-white to-pink-50 rounded-[28px] shadow-clay-card overflow-hidden">
            <div className="h-24 sm:h-32 bg-gradient-to-r from-purple-400/20 via-pink-300/15 to-blue-400/15 relative">
              <div className="absolute inset-0 backdrop-blur-sm" />
            </div>
            <div className="px-5 sm:px-8 pb-6 sm:pb-8 -mt-10 sm:-mt-12 relative z-10">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6">
                {/* Avatar */}
                <div className="relative shrink-0">
                  {currentCat.avatar ? (
                    <img 
                      src={currentCat.avatar} 
                      alt={currentCat.name}
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-[22px] object-cover border-4 border-white shadow-clay-float" 
                    />
                  ) : (
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[22px] bg-gradient-to-br from-purple-400 to-purple-600 border-4 border-white shadow-clay-float flex items-center justify-center">
                      <UserOutlined className="text-3xl text-white" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 text-center sm:text-left pb-1">
                  <h2 className="font-display font-black text-3xl sm:text-4xl text-clay-foreground">{currentCat.name}</h2>
                  <div className="flex items-center justify-center sm:justify-start gap-3 mt-2 flex-wrap">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-clay-muted">
                      <Cake size={14} className="text-clay-accent" />
                      <span>{getAge(currentCat.birthday)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-bold text-clay-accent-alt">
                      <Sparkles size={14} />
                      <span>{t.daysToBirthday} {getDaysToBirthday(currentCat.birthday)} {t.days}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Characteristics quote */}
              {currentCat.characteristics && (
                <div className="mt-5 bg-white/50 py-3 px-5 rounded-2xl backdrop-blur-sm border border-white/60">
                  <Text className="text-base italic text-clay-foreground leading-relaxed">"{currentCat.characteristics}"</Text>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit / Add form */}
      <div className="animate-slide-up stagger-1">
        <Card 
          title={
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-clay-accent/10 flex items-center justify-center">
                <PenLine size={16} className="text-clay-accent" />
              </div>
              <span className="font-display font-black text-lg text-clay-foreground">
                {currentCat ? t.editCat : t.addCat}
              </span>
            </div>
          }
          className="clay-card"
        >
          <Form form={form} layout="vertical" onFinish={onFinish}>
            {/* Avatar upload - visual */}
            <Form.Item label={<span className="font-bold text-clay-muted">{t.uploadAvatar}</span>}>
              <div className="flex items-center gap-4">
                <div className="relative group">
                  {(avatarPreview || currentCat?.avatar) ? (
                    <img 
                      src={avatarPreview || currentCat?.avatar || ''} 
                      alt="Avatar" 
                      className="w-20 h-20 rounded-2xl object-cover shadow-clay-card" 
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-[#EFEBF5] shadow-clay-pressed flex items-center justify-center">
                      <UserOutlined className="text-2xl text-clay-muted" />
                    </div>
                  )}
                  <Upload
                    beforeUpload={(file) => { handleAvatarSelect(file); return false; }}
                    maxCount={1}
                    showUploadList={false}
                    accept="image/*"
                  >
                    <button 
                      type="button"
                      className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-clay-accent text-white flex items-center justify-center shadow-md cursor-pointer hover:scale-110 transition-transform"
                    >
                      <CameraOutlined className="text-xs" />
                    </button>
                  </Upload>
                </div>
                <div className="text-sm text-clay-muted">
                  {lang === 'zh' ? '点击相机图标更换头像' : 'Click the camera icon to change avatar'}
                </div>
              </div>
            </Form.Item>

            <Form.Item name="name" label={<span className="font-bold text-clay-muted">{t.name}</span>} rules={[{ required: true }]}>
              <Input placeholder={lang === 'zh' ? '例如：小橘' : 'e.g. Luna'} className="clay-input h-12 text-lg" />
            </Form.Item>

            <Form.Item name="birthday" label={<span className="font-bold text-clay-muted">{t.birthday}</span>} rules={[{ required: true }]}>
              <DatePicker className="w-full h-12" />
            </Form.Item>

            <Form.Item name="characteristics" label={<span className="font-bold text-clay-muted">{t.characteristics}</span>} rules={[{ required: true }]}>
              <Input.TextArea 
                rows={3} 
                placeholder={lang === 'zh' ? '描述你的小猫咪的特征和个性...' : 'Describe your kitten\'s traits and personality...'}
                className="clay-input !h-auto"
              />
            </Form.Item>

            <Form.Item className="!mb-0 mt-6">
              <Button type="primary" htmlType="submit" loading={loading} className="clay-button-primary w-full h-12 text-lg">
                {t.save}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
}
