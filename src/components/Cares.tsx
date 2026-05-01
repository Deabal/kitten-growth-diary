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
  Empty,
  Popconfirm,
} from "antd";
import {
  HeartOutlined,
  MedicineBoxOutlined,
  CoffeeOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { Heart, Pill, Cookie, Sparkles } from 'lucide-react';
import dayjs from "dayjs";
import { Cat, Care } from "../types";
import { Language, useI18n } from "../i18n";

const { Option } = Select;
const { Text } = Typography;

interface Props {
  currentCat: Cat | null;
  lang: Language;
}

const CARE_GROUPS = {
  health: ['brush_teeth', 'ext_deworm', 'int_deworm'],
  nutrition: ['probiotics', 'canned_food', 'treats', 'lactoferrin'],
  other: ['other'],
};

export default function Cares({ currentCat, lang }: Props) {
  const t = useI18n(lang);
  const [loading, setLoading] = useState(false);
  const [cares, setCares] = useState<Care[]>([]);
  const [form] = Form.useForm();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (currentCat) fetchCares();
  }, [currentCat]);

  const fetchCares = async () => {
    if (!currentCat) return;
    try {
      const res = await fetch(`/api/cares/${currentCat.id}`);
      setCares(await res.json());
    } catch { message.error(t.errorLoad); }
  };

  const onFinish = async (values: any) => {
    if (!currentCat) return;
    setLoading(true);
    try {
      const res = await fetch("/api/cares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cat_id: currentCat.id,
          date: values.date.format("YYYY-MM-DD"),
          type: values.type,
          notes: values.notes || "",
        }),
      });
      if (res.ok) {
        message.success(t.save);
        form.resetFields();
        form.setFieldsValue({ date: dayjs() });
        setShowForm(false);
        fetchCares();
      }
    } catch { message.error(t.noData); }
    finally { setLoading(false); }
  };

  const quickAdd = async (careType: string) => {
    if (!currentCat) return;
    try {
      const res = await fetch("/api/cares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cat_id: currentCat.id,
          date: dayjs().format("YYYY-MM-DD"),
          type: careType,
          notes: "",
        }),
      });
      if (res.ok) {
        message.success(t.save);
        fetchCares();
      }
    } catch { message.error(t.noData); }
  };

  const deleteCare = async (id: string) => {
    try {
      const res = await fetch(`/api/cares/${id}`, { method: 'DELETE' });
      if (res.ok) {
        message.success(lang === 'zh' ? '已删除' : 'Deleted');
        fetchCares();
      }
    } catch { message.error(t.errorLoad); }
  };

  const getIcon = (type: string) => {
    if (CARE_GROUPS.health.includes(type)) return <Pill size={18} className="text-blue-500" />;
    if (CARE_GROUPS.nutrition.includes(type)) return <Cookie size={18} className="text-orange-500" />;
    return <Heart size={18} className="text-pink-500" />;
  };

  const getIconBg = (type: string) => {
    if (CARE_GROUPS.health.includes(type)) return 'from-blue-50 to-indigo-50';
    if (CARE_GROUPS.nutrition.includes(type)) return 'from-orange-50 to-amber-50';
    return 'from-pink-50 to-rose-50';
  };

  const todayCares = cares.filter(c => c.date === dayjs().format('YYYY-MM-DD'));

  return (
    <div className="space-y-6 pb-4">
      {/* Quick actions */}
      <div className="animate-slide-up-sm">
        <div className="flex items-center gap-2 mb-3 px-1">
          <Sparkles size={16} className="text-clay-accent" />
          <span className="font-display font-black text-sm text-clay-foreground">{lang === 'zh' ? '快速记录' : 'Quick Add'}</span>
          {todayCares.length > 0 && (
            <span className="ml-auto text-xs text-clay-muted font-medium">
              {lang === 'zh' ? `今日已记录 ${todayCares.length} 条` : `${todayCares.length} today`}
            </span>
          )}
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 sm:gap-3">
          {['brush_teeth', 'ext_deworm', 'int_deworm', 'probiotics', 'canned_food', 'treats', 'lactoferrin', 'other'].map((careType) => {
            const doneToday = todayCares.some(c => c.type === careType);
            return (
              <button
                key={careType}
                onClick={() => quickAdd(careType)}
                className={`flex flex-col items-center gap-1.5 p-3 sm:p-4 rounded-[18px] transition-all duration-200 cursor-pointer ${
                  doneToday 
                    ? 'bg-emerald-50 shadow-sm ring-1 ring-emerald-200' 
                    : 'bg-white/60 shadow-clay-card hover:shadow-clay-card-hover active:scale-95'
                }`}
              >
                {doneToday ? (
                  <CheckCircleOutlined className="text-xl text-emerald-500" />
                ) : (
                  <span className="text-lg">{getIcon(careType)}</span>
                )}
                <span className={`text-[10px] sm:text-xs font-bold leading-tight text-center ${doneToday ? 'text-emerald-600' : 'text-clay-muted'}`}>
                  {t[careType as keyof typeof t] as string}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Toggle full form */}
      <div className="animate-slide-up stagger-1">
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-clay-accent/15 text-clay-accent font-bold text-sm cursor-pointer hover:border-clay-accent/30 hover:bg-clay-accent/5 transition-all"
          >
            <PlusOutlined />
            {lang === 'zh' ? '详细记录' : 'Detailed entry'}
          </button>
        ) : (
          <Card className="clay-card animate-scale-in">
            <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ date: dayjs() }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Form.Item name="date" label={t.date} rules={[{ required: true }]}>
                  <DatePicker className="w-full" />
                </Form.Item>
                <Form.Item name="type" label={t.careType} rules={[{ required: true }]}>
                  <Select>
                    <Option value="brush_teeth">{t.brush_teeth}</Option>
                    <Option value="ext_deworm">{t.ext_deworm}</Option>
                    <Option value="int_deworm">{t.int_deworm}</Option>
                    <Option value="probiotics">{t.probiotics}</Option>
                    <Option value="canned_food">{t.canned_food}</Option>
                    <Option value="treats">{t.treats}</Option>
                    <Option value="lactoferrin">{t.lactoferrin}</Option>
                    <Option value="other">{t.other}</Option>
                  </Select>
                </Form.Item>
              </div>
              <Form.Item name="notes" label={t.notes}>
                <Input.TextArea rows={2} />
              </Form.Item>
              <div className="flex gap-3">
                <Button type="primary" htmlType="submit" loading={loading} className="clay-button-primary h-11 px-6">
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

      {/* Care history */}
      <div className="animate-slide-up stagger-2">
        <h3 className="font-display font-black text-lg text-clay-foreground mb-4 px-1">{t.care}</h3>
        {cares.length > 0 ? (
          <div className="space-y-3">
            {cares.map((item, index) => (
              <div
                key={item.id}
                className={`flex items-center gap-4 p-4 bg-white/60 rounded-[22px] shadow-clay-card transition-all duration-200 hover:shadow-clay-card-hover animate-slide-up-sm stagger-${Math.min(index % 4 + 1, 4)}`}
              >
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br ${getIconBg(item.type)} flex items-center justify-center shrink-0 shadow-sm`}>
                  {getIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display font-black text-base text-clay-foreground">
                      {t[item.type as keyof typeof t] as string || item.type}
                    </span>
                    <Tag className="bg-clay-accent/8 text-clay-accent !text-xs">
                      {item.date}
                    </Tag>
                  </div>
                  {item.notes && (
                    <div className="text-sm text-clay-muted mt-1 truncate">{item.notes}</div>
                  )}
                </div>
                <Popconfirm
                  title={lang === 'zh' ? '确认删除？' : 'Delete this record?'}
                  description={lang === 'zh' ? '删除后不可恢复' : 'This cannot be undone'}
                  onConfirm={() => deleteCare(item.id)}
                  okText={lang === 'zh' ? '删除' : 'Delete'}
                  cancelText={lang === 'zh' ? '取消' : 'Cancel'}
                  okButtonProps={{ danger: true }}
                >
                  <button className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-clay-muted hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer">
                    <DeleteOutlined className="text-sm" />
                  </button>
                </Popconfirm>
              </div>
            ))}
          </div>
        ) : (
          <Empty description={t.noData} className="py-12" />
        )}
      </div>
    </div>
  );
}
