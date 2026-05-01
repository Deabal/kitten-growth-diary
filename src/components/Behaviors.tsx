import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  DatePicker,
  Button,
  Select,
  Upload,
  Card,
  message,
  Typography,
  InputNumber,
} from "antd";
import {
  UploadOutlined,
  PictureOutlined,
  AudioOutlined,
  LineChartOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Cat, Behavior } from "../types";

const { Option } = Select;
const { Title } = Typography;

interface Props {
  currentCat: Cat | null;
}

export default function Behaviors({ currentCat }: Props) {
  const [loading, setLoading] = useState(false);
  const [behaviors, setBehaviors] = useState<Behavior[]>([]);
  const [form] = Form.useForm();
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState("weight");

  useEffect(() => {
    if (currentCat) {
      fetchBehaviors();
    }
  }, [currentCat]);

  const fetchBehaviors = async () => {
    if (!currentCat) return;
    try {
      const res = await fetch(`/api/behaviors/${currentCat.id}`);
      const data = await res.json();
      setBehaviors(data);
    } catch (error) {
      message.error("Failed to load behaviors");
    }
  };

  const onFinish = async (values: any) => {
    if (!currentCat) {
      message.error("Please select a cat first");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("cat_id", currentCat.id);
    formData.append("date", values.date.format("YYYY-MM-DD"));
    formData.append("type", values.type);
    formData.append("notes", values.notes || "");

    if (values.type === "weight") {
      formData.append("value", values.value.toString());
    } else if (file) {
      formData.append("file", file);
    } else {
      message.error("Please provide a value or file");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/behaviors", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        message.success("Behavior recorded successfully!");
        form.resetFields();
        setFile(null);
        fetchBehaviors();
      } else {
        message.error("Failed to record behavior");
      }
    } catch (error) {
      message.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const weightData = behaviors
    .filter((b) => b.type === "weight")
    .map((b) => ({ date: b.date, weight: parseFloat(b.value) }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-8">
      <Card title="Record Daily Behavior" className="w-full max-w-2xl mx-auto">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ type: "weight", date: dayjs() }}
        >
          <Form.Item name="date" label="Date" rules={[{ required: true }]}>
            <DatePicker className="w-full" />
          </Form.Item>

          <Form.Item name="type" label="Type" rules={[{ required: true }]}>
            <Select onChange={setType}>
              <Option value="weight">Weight</Option>
              <Option value="photo">Photo</Option>
              <Option value="audio">Audio (Purr/Meow)</Option>
            </Select>
          </Form.Item>

          {type === "weight" ? (
            <Form.Item
              name="value"
              label="Weight (kg)"
              rules={[{ required: true }]}
            >
              <InputNumber min={0} step={0.1} className="w-full" />
            </Form.Item>
          ) : (
            <Form.Item label="Upload File">
              <Upload
                beforeUpload={(f) => {
                  setFile(f);
                  return false;
                }}
                maxCount={1}
                listType={type === "photo" ? "picture" : "text"}
                accept={type === "photo" ? "image/*" : "audio/*"}
              >
                <Button icon={<UploadOutlined />}>
                  Select {type === "photo" ? "Image" : "Audio"}
                </Button>
              </Upload>
            </Form.Item>
          )}

          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full"
            >
              Save Record
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {weightData.length > 0 && (
        <Card title="Weight Tracking" className="w-full max-w-4xl mx-auto">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis
                  label={{ value: "kg", angle: -90, position: "insideLeft" }}
                />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <Card title="Photos & Audio" className="w-full max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {behaviors.filter((b) => b.type !== "weight").map((item) => (
            <div key={item.id}>
              <Card
                title={item.date}
                extra={
                  item.type === "photo" ? (
                    <PictureOutlined />
                  ) : (
                    <AudioOutlined />
                  )
                }
                className="overflow-hidden h-full"
              >
                {item.type === "photo" ? (
                  <img
                    src={item.value}
                    alt="Cat"
                    className="w-full h-48 object-cover rounded-md mb-2"
                  />
                ) : (
                  <audio controls src={item.value} className="w-full mb-2" />
                )}
                <p className="text-gray-600 text-sm truncate">{item.notes}</p>
              </Card>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
