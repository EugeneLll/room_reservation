import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  Space,
  message,
  Select,
} from "antd";
import { useEffect, useState } from "react";
import { ReservationService } from "../api/ReservationService";
import { RoomService } from "../api/RoomService";
import { UserService } from "../api/UserService";
import dayjs from "dayjs";

export default function ReservationList() {
  const [reservations, setReservations] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [users, setUsers] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [form] = Form.useForm();
  const [participantForm] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const roles = [
    { id: "attendee", name: "Attendee" },
    { id: "organizer", name: "Organizer" },
  ];
  const { RangePicker } = DatePicker;

  const reservationColumns = [
    {
      title: "Title",
      dataIndex: "title",
    },
    {
      title: "Room",
      dataIndex: "room_name",
      render: (_, record) => record.room.room_name,
    },

    {
      title: "Time Range",
      render: (_, record) => (
        <span>
          {dayjs(record.start).format("MMM D, YYYY HH:mm")} -
          {dayjs(record.end).format("MMM D, YYYY HH:mm")}
        </span>
      ),
    },
    {
      title: "Actions",
      render: (_, record) => (
        <Space>
          <Button onClick={() => handleEditReservation(record)}>Edit</Button>
          <Button onClick={() => handleViewParticipants(record.id)}>
            Participants
          </Button>
          <Button danger onClick={() => handleDeleteReservation(record.id)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  useEffect(() => {
    loadReservations();
    loadRooms();
    loadUsers();
  }, []);

  const loadReservations = async () => {
    try {
      const response = await ReservationService.getReservations();
      setReservations(response.data);
    } catch (error) {
      messageApi.open({
        type: "error",
        content: "Failed to load reservations",
      });
    }
  };

  const loadRooms = async () => {
    try {
      const response = await RoomService.getRooms();
      setRooms(response.data);
    } catch (error) {
      messageApi.open({ type: "error", content: "Failed to load rooms" });
    }
  };

  const loadUsers = async () => {
    try {
      const response = await UserService.getUsers();
      setUsers(response.data);
    } catch (error) {
      messageApi.open({ type: "error", content: "Failed to load users" });
    }
  };

  const handleSubmitReservation = async (values) => {
    try {
      const data = {
        ...values,
        start: values.timeRange[0].toISOString(),
        end: values.timeRange[1].toISOString(),
      };

      if (values.id) {
        await ReservationService.updateReservation(values.id, data);
        messageApi.open({
          type: "success",
          content: "Reservation updated successfully",
        });
      } else {
        await ReservationService.createReservation(data);
        messageApi.open({
          type: "success",
          content: "Reservation created successfully",
        });
      }

      loadReservations();
      setIsModalOpen(false);
      form.resetFields();
    } catch (error) {
      messageApi.open({ type: "error", content: "Operation failed" });
    }
  };

  const handleEditReservation = (reservation) => {
    form.setFieldsValue({
      ...reservation,
      timeRange: [
        dayjs(reservation.start_time).add(1, "hour"),
        dayjs(reservation.end_time).add(2, "hours"),
      ],
    });
    setIsModalOpen(true);
  };

  const handleDeleteReservation = async (reservationId) => {
    try {
      await ReservationService.deleteReservation(reservationId);
      messageApi.open({ type: "success", content: "Reservation deleted" });
      loadReservations();
    } catch (error) {
      messageApi.open({ type: "error", content: "Operation failed" });
    }
  };

  const handleViewParticipants = async (reservationId) => {
    try {
      const response = await ReservationService.getParticipants(reservationId);
      setParticipants(response.data);
      setSelectedReservation(reservationId);
    } catch (error) {
      messageApi.open({
        type: "error",
        content: "Failed to load participants",
      });
    }
  };

  const handleAddParticipant = async (values) => {
    try {
      await ReservationService.addParticipant(selectedReservation, {
        user: values.user,
        reservation: selectedReservation,
        role: values.role,
        attends: "pending",
      });
      messageApi.open({ type: "success", content: "Participant added" });
      handleViewParticipants(selectedReservation);
      participantForm.resetFields();
    } catch (error) {
      messageApi.open({ type: "error", content: "Operation failed" });
    }
  };

  const handleDeleteParticipant = async (participantId) => {
    try {
      await ReservationService.deleteParticipant(
        selectedReservation,
        participantId
      );
      messageApi.open({
        type: "success",
        content: "Participant removed successfully",
      });
      handleViewParticipants(selectedReservation);
    } catch (error) {
      messageApi.open({
        type: "error",
        content: "Failed to remove participant",
      });
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
      >
        Create Reservation
      </Button>

      <Table
        dataSource={reservations}
        columns={reservationColumns}
        rowKey="id"
        style={{ marginTop: 24 }}
      />
      <Modal
        title={
          form.getFieldValue("id") ? "Edit Reservation" : "Create Reservation"
        }
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} onFinish={handleSubmitReservation}>
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="room" label="Room" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={rooms.map((room) => ({
                value: room.id,
                label: room.room_name,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="timeRange"
            label="Time Range"
            rules={[{ required: true }]}
          >
            <RangePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Manage Participants"
        open={!!selectedReservation}
        onCancel={() => setSelectedReservation(null)}
        footer={null}
        width={800}
      >
        <Form
          form={participantForm}
          onFinish={handleAddParticipant}
          layout="inline"
        >
          <Form.Item
            name="user"
            label="Add Participant"
            rules={[{ required: true }]}
          >
            <Select
              showSearch
              style={{ width: 200 }}
              placeholder="Select user"
              optionFilterProp="label"
              options={users.map((user) => ({
                value: user.id,
                label: user.username,
              }))}
            />
          </Form.Item>

          <Form.Item name="role" rules={[{ required: false }]}>
            <Select
              showSearch
              style={{ width: 200 }}
              placeholder="Select role"
              optionFilterProp="label"
              options={roles.map((role) => ({
                value: role.id,
                label: role.name,
              }))}
            />
          </Form.Item>

          <Button type="primary" htmlType="submit">
            Add Participant
          </Button>
        </Form>

        <Table
          dataSource={participants}
          columns={[
            {
              title: "Username",
              dataIndex: ["user", "username"],
            },
            {
              title: "Email",
              dataIndex: ["user", "email"],
            },
            {
              title: "Role",
              dataIndex: ["role"],
            },
            {
              title: "Status",
              dataIndex: ["attends"],
            },
            {
              title: "Actions",
              render: (_, record) => (
                <Button
                  danger
                  onClick={() => handleDeleteParticipant(record.id)}
                >
                  Remove
                </Button>
              ),
            },
          ]}
          style={{ marginTop: 16 }}
          rowKey="id"
        />
      </Modal>
    </div>
  );
}
