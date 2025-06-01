import { useState } from "react";
import { Button, Form, Input, message } from "antd";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export default function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const onFinish = async (values) => {
    setLoading(true);
    const success = await login({
      username: values.username,
      password: values.password,
    });
    setLoading(false);
    navigate("/my-reservations");
    if (success) {
      messageApi.success("Logged in successfully");
    } else {
      messageApi.error("Login failed. Please check your credentials.");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "0 auto" }}>
      {contextHolder}
      <h2 style={{ textAlign: "center", marginBottom: 24 }}>Login</h2>
      <Form
        name="login"
        initialValues={{ remember: true }}
        onFinish={onFinish}
        layout="vertical"
      >
        <Form.Item
          label="Username"
          name="username"
          rules={[{ required: true, message: "Please input your username!" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: "Please input your password!" }]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Log in
          </Button>
        </Form.Item>

        <div style={{ textAlign: "center" }}>
          <Link to="/signup">Create an account</Link>
        </div>
      </Form>
    </div>
  );
}
