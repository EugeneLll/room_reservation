import { Table, Button, Space, Modal, Form, Input, message } from "antd";
import { useState, useEffect } from "react";
import { RoomService } from "../api/RoomService";

export default function RoomList() {
  const [rooms, setRooms] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const columns = [
    { title: "Name", dataIndex: "room_name", key: "room_name" },
    { title: "Address", dataIndex: "address", key: "address" },
    { title: "Capacity", dataIndex: "human_capacity", key: "human_capacity" },
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
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const response = await RoomService.getRooms();
      setRooms(response.data);
    } catch (error) {
      messageApi.open({ type: "error", content: "Failed to load rooms" });
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (values.id) {
        await RoomService.updateRoom(values.id, values);
        messageApi.open({
          type: "success",
          content: "Room updated successfully",
        });
      } else {
        await RoomService.createRoom(values);
        messageApi.open({
          type: "success",
          content: "Room created successfully",
        });
      }
      loadRooms();
      setIsModalOpen(false);
      form.resetFields();
    } catch (error) {
      messageApi.open({ type: "error", content: "Operation failed" });
    }
  };

  const handleEdit = (room) => {
    form.setFieldsValue(room);
    setIsModalOpen(true);
  };

  const handleDelete = async (roomId) => {
    try {
      await RoomService.deleteRoom(roomId);
      messageApi.open({ type: "success", content: "Room deleted" });
      loadRooms();
    } catch (error) {
      messageApi.open({ type: "error", content: "Delete failed" });
    }
  };

  return (
    <div>
      {contextHolder}
      <Button type="primary" onClick={() => setIsModalOpen(true)}>
        Add Room
      </Button>

      <Table dataSource={rooms} columns={columns} rowKey="id" />

      <Modal
        title={form.getFieldValue("id") ? "Edit Room" : "Create Room"}
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
          <Form.Item label="Name" name="room_name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item
            label="Address"
            name="address"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Capacity"
            name="human_capacity"
            rules={[{ required: false }]}
          >
            <Input type="number" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
