import React, { useState, useEffect } from "react";
import {
  Form,
  DatePicker,
  Button,
  Select,
  Card,
  message,
  Typography,
  Input,
  Tag,
  Upload,
  Image,
  Empty,
} from "antd";
import { WarningOutlined, UploadOutlined, PlusOutlined } from "@ant-design/icons";
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import dayjs from "dayjs";
import { Cat, Abnormality } from "../types";
import { Language, useI18n } from "../i18n";

const { Option } = Select;
const { Text } = Typography;

interface Props {
  currentCat: Cat | null;
  lang: Language;
}

export default function Abnormalities({ currentCat, lang }: Props) {
  const t = useI18n(lang);
  const [loading, setLoading] = useState(false);
  const [abnormalities, setAbnormalities] = useState<Abnormality[]>([]);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [severity, setSeverity] = useState(1);

  useEffect(() => {
    if (currentCat) fetchAbnormalities();
  }, [currentCat]);

  const fetchAbnormalities = async () => {
    if (!currentCat) return;
    try {
      const res = await fetch(`/api/abnormalities/${currentCat.id}`);
      setAbnormalities(await res.json());
    } catch { message.error(t.errorLoad); }
  };

  const onFinish = async (values: any) => {
    if (!currentCat) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("cat_id", currentCat.id);
    formData.append("date", values.date.format("YYYY-MM-DD"));
    formData.append("type", values.type);
    formData.append("severity", String(severity));
    formData.append("notes", values.notes || "");
    fileList.forEach(file => formData.append("photos", file.originFileObj));

    try {
      const res = await fetch("/api/abnormalities", { method: "POST", body: formData });
      if (res.ok) {
        message.success(t.save);
        form.resetFields();
        setFileList([]);
        setSeverity(1);
        setShowForm(false);
        fetchAbnormalities();
      }
    } catch { message.error(t.errorSave); }
    finally { setLoading(false); }
  };

  const getSeverityConfig = (s: number) => {
    if (s <= 2) return { color: 'emerald', label: lang === 'zh' ? '轻微' : 'Mild', bgClass: 'from-emerald-50 to-green-50', textClass: 'text-emerald-600', dotClass: 'bg-emerald-500' };
    if (s <= 3) return { color: 'amber', label: lang === 'zh' ? '中等' : 'Moderate', bgClass: 'from-amber-50 to-orange-50', textClass: 'text-amber-600', dotClass: 'bg-amber-500' };
    return { color: 'rose', label: lang === 'zh' ? '严重' : 'Severe', bgClass: 'from-rose-50 to-pink-50', textClass: 'text-rose-600', dotClass: 'bg-rose-500' };
  };

  return (
    <div className="space-y-6 pb-4">
      {/* Summary cards */}
      {abnormalities.length > 0 && (
        <div className="animate-slide-up-sm">
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            {[
              { label: lang === 'zh' ? '总计' : 'Total', value: abnormalities.length, bg: 'from-purple-50 to-indigo-50', text: 'text-purple-600' },
              { label: lang === 'zh' ? '本月' : 'This month', value: abnormalities.filter(a => dayjs(a.date).isSame(dayjs(), 'month')).length, bg: 'from-blue-50 to-cyan-50', text: 'text-blue-600' },
              { label: lang === 'zh' ? '严重' : 'Severe', value: abnormalities.filter(a => a.severity >= 4).length, bg: 'from-rose-50 to-pink-50', text: 'text-rose-600' },
            ].map(stat => (
              <div key={stat.label} className={`flex-1 min-w-[100px] bg-gradient-to-br ${stat.bg} rounded-[18px] p-3 sm:p-4`}>
                <div className="text-xs font-bold text-clay-muted mb-1">{stat.label}</div>
                <div className={`font-display font-black text-xl sm:text-2xl ${stat.text}`}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add form toggle */}
      <div className="animate-slide-up stagger-1">
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-rose-200 text-rose-500 font-bold text-sm cursor-pointer hover:border-rose-300 hover:bg-rose-50/50 transition-all"
          >
            <PlusOutlined />
            {lang === 'zh' ? '记录异常' : 'Record abnormality'}
          </button>
        ) : (
          <Card 
            className="clay-card border-l-4 !border-l-rose-400 animate-scale-in"
          >
            <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ date: dayjs() }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Form.Item name="date" label={t.date} rules={[{ required: true }]}>
                  <DatePicker className="w-full" />
                </Form.Item>
                <Form.Item name="type" label={t.issueType} rules={[{ required: true }]}>
                  <Select>
                    <Option value="vet">{t.vet}</Option>
                    <Option value="tooth">{t.tooth}</Option>
                    <Option value="soft_stool">{t.soft_stool}</Option>
                    <Option value="vomit">{t.vomit}</Option>
                    <Option value="lethargy">{t.lethargy}</Option>
                    <Option value="appetite_loss">{t.appetite_loss}</Option>
                    <Option value="other">{t.other}</Option>
                  </Select>
                </Form.Item>
              </div>

              {/* Custom severity selector */}
              <Form.Item label={<span className="font-bold text-clay-muted">{t.severity}</span>} required>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(level => {
                    const config = getSeverityConfig(level);
                    const active = severity >= level;
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setSeverity(level)}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer ${
                          active 
                            ? `bg-gradient-to-br ${config.bgClass} ${config.textClass} shadow-sm ring-1 ring-current/10` 
                            : 'bg-[#EFEBF5] text-clay-muted'
                        }`}
                      >
                        {level}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2 text-xs font-medium text-clay-muted text-center">
                  {getSeverityConfig(severity).label}
                </div>
              </Form.Item>

              <Form.Item name="notes" label={t.notes}>
                <Input.TextArea rows={3} />
              </Form.Item>
              <Form.Item label={t.uploadPhotos}>
                <Upload
                  listType="picture-card"
                  fileList={fileList}
                  onChange={({ fileList }) => setFileList(fileList)}
                  beforeUpload={() => false}
                  multiple
                >
                  {fileList.length < 4 && (
                    <div className="flex flex-col items-center gap-1">
                      <UploadOutlined className="text-clay-muted" />
                      <span className="text-xs text-clay-muted">{t.uploadFile}</span>
                    </div>
                  )}
                </Upload>
              </Form.Item>
              <div className="flex gap-3">
                <Button danger type="primary" htmlType="submit" loading={loading} className="h-11 px-6 !rounded-[18px]">
                  {t.save}
                </Button>
                <Button onClick={() => setShowForm(false)} className="clay-button h-11 px-6">
                  {lang === 'zh' ? '取消' : 'Cancel'}
                </Button>
              </div>
            </Form>
          </Card>
        )}
      </div>

      {/* History */}
      <div className="animate-slide-up stagger-2">
        <h3 className="font-display font-black text-lg text-clay-foreground mb-4 px-1">{t.abnormalities}</h3>
        {abnormalities.length > 0 ? (
          <div className="space-y-3">
            {abnormalities.map((item, index) => {
              const config = getSeverityConfig(item.severity);
              return (
                <div
                  key={item.id}
                  className={`p-4 bg-white/60 rounded-[22px] shadow-clay-card transition-all duration-200 animate-slide-up-sm stagger-${Math.min(index % 4 + 1, 4)}`}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br ${config.bgClass} flex items-center justify-center shrink-0 shadow-sm`}>
                      <AlertTriangle size={18} className={config.textClass} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display font-black text-base text-clay-foreground">
                          {t[item.type as keyof typeof t] as string || item.type}
                        </span>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full transition-colors ${i < item.severity ? config.dotClass : 'bg-gray-200'}`}
                            />
                          ))}
                        </div>
                        <Tag className="bg-clay-accent/8 text-clay-accent !text-xs ml-auto">{item.date}</Tag>
                      </div>
                      {item.notes && (
                        <div className="text-sm text-clay-muted mt-2">{item.notes}</div>
                      )}
                      {item.photos && item.photos.length > 0 && (
                        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                          {item.photos.map((photo, idx) => (
                            <Image
                              key={idx}
                              src={photo}
                              width={64}
                              height={64}
                              className="!rounded-xl object-cover shadow-sm"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center">
            <div className="w-16 h-16 rounded-[22px] bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert size={24} className="text-emerald-500" />
            </div>
            <Text className="text-clay-muted font-medium">{lang === 'zh' ? '暂无异常记录，很棒！' : 'No abnormalities, great!'}</Text>
          </div>
        )}
      </div>
    </div>
  );
}
