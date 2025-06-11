import { Table, Button, Modal, Form, Input, message, Space } from "antd";
import { useState, useEffect } from "react";
import { RoomService } from "../api/RoomService";
import RoomAmenities from "./RoomAmenities";
import { Link } from "react-router-dom";

export default function RoomList() {
  const [messageApi, contextHolder] = message.useMessage();
  const [rooms, setRooms] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const columns = [
    { title: "Name", dataIndex: "room_name", key: "room_name" },
    { title: "Address", dataIndex: "address", key: "address" },
    { title: "Capacity", dataIndex: "human_capacity", key: "human_capacity" },
    {
      title: "Reservations",
      key: "reservations",
      render: (_, record) => (
        <Link to={`/reservations?room=${record.id}`}>View Reservations</Link>
      ),
    },
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
      setLoading(true);
      const response = await RoomService.getRooms();
      setRooms(response.data);
    } catch (error) {
      messageApi.error("Failed to load rooms");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (values.id) {
        await RoomService.updateRoom(values.id, values);
        messageApi.success("Room updated successfully");
      } else {
        await RoomService.createRoom(values);
        messageApi.success("Room created successfully");
      }
      loadRooms();
      setIsModalOpen(false);
      form.resetFields();
    } catch (error) {
      messageApi.error("Operation failed");
    }
  };

  const handleEdit = (room) => {
    form.setFieldsValue(room);
    setIsModalOpen(true);
  };

  const handleDelete = async (roomId) => {
    try {
      await RoomService.deleteRoom(roomId);
      messageApi.success("Room deleted");
      loadRooms();
    } catch (error) {
      messageApi.error("Delete failed");
    }
  };

  return (
    <div>
      {contextHolder}
      <Button
        type="primary"
        onClick={() => {
          form.resetFields();
          setIsModalOpen(true);
        }}
        style={{ marginBottom: 16 }}
      >
        Add Room
      </Button>

      <Table
        dataSource={rooms}
        columns={columns}
        rowKey="id"
        loading={loading}
        expandable={{
          expandedRowRender: (record) => <RoomAmenities roomId={record.id} />,
          rowExpandable: (record) => record.id !== undefined,
        }}
        locale={{
          emptyText: (
            <div
              style={{
                padding: 40,
                background: "#fafafa",
                textAlign: "center",
              }}
            >
              No rooms
            </div>
          ),
        }}
      />

      <Modal
        title={form.getFieldValue("id") ? "Edit Room" : "Create Room"}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} onFinish={handleSubmit}>
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            label="Name"
            name="room_name"
            rules={[{ required: true, message: "Please enter room name" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Address"
            name="address"
            rules={[{ required: true, message: "Please enter room name" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Capacity"
            name="human_capacity"
            rules={[{ required: true, message: "Please enter room capacity" }]}
          >
            <Input type="number" min={1} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
