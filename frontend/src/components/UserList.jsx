import { Button, Form, Input, Modal, Space, Table, message } from "antd";
import { useEffect, useState } from "react";
import { UserService } from "../api/UserService";

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const columns = [
    { title: "Username", dataIndex: "username", key: "username" },
    { title: "Email", dataIndex: "email", key: "email" },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button onClick={() => handleEdit(record)}>Edit</Button>
          <Button danger onClick={() => handleDelete(record.id)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await UserService.getUsers();
      setUsers(response.data);
    } catch (error) {
      messageApi.open({ type: "error", content: "Failed to load users" });
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (values.id) {
        await UserService.updateUser(values.id, values);
        messageApi.open({
          type: "success",
          content: "User updated successfully",
        });
      } else {
        await UserService.createUser(values);
        messageApi.open({
          type: "error",
          content: "User created successfully",
        });
      }
      loadUsers();
      setIsModalOpen(false);
      form.resetFields();
    } catch (error) {
      messageApi.open({ type: "error", content: "Operation failed" });
    }
  };

  const handleEdit = (user) => {
    form.setFieldsValue(user);
    setIsModalOpen(true);
  };

  const handleDelete = async (userId) => {
    try {
      await UserService.deleteUser(userId);
      messageApi.open({ type: "success", content: "User deleted" });
      loadUsers();
    } catch (error) {
      messageApi.open({ type: "error", content: "Delete failed" });
    }
  };

  return (
    <div>
      {contextHolder}
      <Button type="primary" onClick={() => setIsModalOpen(true)}>
        Add User
      </Button>

      <Table
        dataSource={users}
        columns={columns}
        rowKey="id"
        style={{ marginTop: 24 }}
        locale={{
          emptyText: (
            <div
              style={{
                padding: 40,
                background: "#fafafa",
                textAlign: "center",
              }}
            >
              No users
            </div>
          ),
        }}
      />

      <Modal
        title={form.getFieldValue("id") ? "Edit User" : "Create User"}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
      >
        <Form form={form} onFinish={handleSubmit}>
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true },
              { type: "email", message: "Invalid email format" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true }]}
          >
            <Input type="password" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
