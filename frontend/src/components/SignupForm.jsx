import { useState } from "react";
import { Button, Form, Input, message } from "antd";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function SignupForm() {
  const { signup } = useAuth();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    const success = await signup({
      username: values.username,
      email: values.email,
      password: values.password,
      firstName: values.firstName,
      lastName: values.lastName,
    });
    setLoading(false);

    if (success) {
      message.success("Account created successfully. Please login.");
    } else {
      message.error("Signup failed. Please try again.");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "0 auto" }}>
      <h2 style={{ textAlign: "center", marginBottom: 24 }}>Sign Up</h2>
      <Form name="signup" onFinish={onFinish} layout="vertical">
        <Form.Item
          label="Username"
          name="username"
          rules={[{ required: true, message: "Please input your username!" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Please input your email!" },
            { type: "email", message: "Please enter a valid email" },
          ]}
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
            Sign Up
          </Button>
        </Form.Item>

        <div style={{ textAlign: "center" }}>
          <Link to="/login">Already have an account? Log in</Link>
        </div>
      </Form>
    </div>
  );
}
