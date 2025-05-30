import { Table, Button, Modal, Form, Input, message, Space } from "antd";
import { useState, useEffect } from "react";
import { RoomService } from "../api/RoomService";

export default function RoomAmenities({ roomId }) {
  const [amenities, setAmenities] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const columns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Amount", dataIndex: "amount", key: "amount" },
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
    loadAmenities();
  }, [roomId]);

  const loadAmenities = async () => {
    try {
      setLoading(true);
      const response = await RoomService.getRoomAmenities(roomId);
      setAmenities(response.data);
    } catch (error) {
      message.error("Failed to load amenities");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (values.id) {
        await RoomService.updateAmenity(roomId, values.id, {
          room: roomId,
          amount: values.amount,
          name: values.name,
        });
        message.success("Amenity updated successfully");
      } else {
        await RoomService.createAmenity(roomId, {
          room: roomId,
          amount: values.amount,
          name: values.name,
        });
        message.success("Amenity created successfully");
      }
      loadAmenities();
      setIsModalOpen(false);
      form.resetFields();
    } catch (error) {
      message.error("Operation failed");
    }
  };

  const handleEdit = (amenity) => {
    form.setFieldsValue(amenity);
    setIsModalOpen(true);
  };

  const handleDelete = async (amenityId) => {
    try {
      await RoomService.deleteAmenity(roomId, amenityId);
      message.success("Amenity deleted");
      loadAmenities();
    } catch (error) {
      message.error("Delete failed");
    }
  };

  return (
    <div style={{ marginTop: 24 }}>
      <Button
        type="primary"
        onClick={() => {
          form.resetFields();
          setIsModalOpen(true);
        }}
        style={{ marginBottom: 16 }}
      >
        Add Amenity
      </Button>

      <Table
        dataSource={amenities}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
      />

      <Modal
        title={form.getFieldValue("id") ? "Edit Amenity" : "Create Amenity"}
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
            label="Name"
            name="name"
            rules={[{ required: true, message: "Please enter amenity name" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="Amount" name="amount" rules={[{ required: false }]}>
            <Input type="number" min={1} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
