import React, { useState } from "react";
import {
  Form,
  Button,
  Upload,
  Card,
  message,
  Typography,
  Spin,
  Alert,
} from "antd";
import { UploadOutlined, RobotOutlined } from "@ant-design/icons";
import ReactMarkdown from "react-markdown";

const { Title } = Typography;

export default function ImageAnalysis() {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!file) {
      message.error("Please select an image first");
      return;
    }

    setLoading(true);
    setAnalysis(null);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("/api/analyze-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setAnalysis(data.text);
        message.success("Image analyzed successfully!");
      } else {
        message.error(data.error || "Failed to analyze image");
      }
    } catch (error) {
      message.error("An error occurred during analysis");
    } finally {
      setLoading(false);
    }
  };

  const beforeUpload = (f: File) => {
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
    return false;
  };

  return (
    <div className="space-y-8">
      <Card title="AI Image Analysis" className="w-full max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/2 space-y-4">
            <Alert
              title="Upload a photo of your cat"
              description="Our AI will analyze the image to detect the cat's mood, behavior, and any potential health signs visible in the photo."
              type="info"
              showIcon
            />

            <Upload
              beforeUpload={beforeUpload}
              maxCount={1}
              listType="picture-card"
              accept="image/*"
              showUploadList={false}
              className="w-full h-64 flex items-center justify-center border-dashed border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
            >
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="text-center">
                  <UploadOutlined className="text-3xl text-gray-400 mb-2" />
                  <div className="text-gray-500">
                    Click or drag image to upload
                  </div>
                </div>
              )}
            </Upload>

            <Button
              type="primary"
              icon={<RobotOutlined />}
              onClick={handleUpload}
              loading={loading}
              disabled={!file}
              className="w-full h-12 text-lg"
            >
              Analyze Image
            </Button>
          </div>

          <div className="w-full md:w-1/2">
            <Card
              title="Analysis Result"
              className="h-full min-h-[300px] bg-gray-50 border-gray-200"
            >
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4 text-gray-500">
                  <Spin size="large" />
                  <p>AI is analyzing your image...</p>
                </div>
              ) : analysis ? (
                <div className="markdown-body text-gray-800">
                  <ReactMarkdown>{analysis}</ReactMarkdown>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 italic text-center">
                  Upload an image and click analyze to see the results here.
                </div>
              )}
            </Card>
          </div>
        </div>
      </Card>
    </div>
  );
}
