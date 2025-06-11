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
  Tag,
  TimePicker,
} from "antd";
import { useEffect, useState, useMemo } from "react";
import { ReservationService } from "../api/ReservationService";
import { RoomService } from "../api/RoomService";
import { UserService } from "../api/UserService";
import ReservationFilters from "./ReservationFilters";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
dayjs.extend(isBetween);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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
  const [searchParams] = useSearchParams({ room: "", status: "upcoming" });
  const { organizedReservations, setOrganizedReservations } = useAuth();
  const [occupiedRooms, setOccupiedRooms] = useState([]);
  const [timeSelection, setTimeSelection] = useState({
    date: null,
    start: null,
    end: null,
  });

  const reservationColumns = [
    {
      title: "Status",
      render: (_, record) => {
        const start = dayjs(record.start);
        const end = dayjs(record.end);
        const now = dayjs();

        if (record.is_cancelled) {
          return <Tag color="red">Cancelled</Tag>;
        } else if (start.isAfter(now)) {
          return <Tag color="green">Upcoming</Tag>;
        } else if (end.isAfter(now)) {
          return <Tag color="yellow">Ongoing</Tag>;
        }
        return <Tag>Completed</Tag>;
      },
    },
    {
      title: "Title",
      dataIndex: "title",
    },
    {
      title: "Room",
      render: (_, record) => record.room?.room_name,
    },
    {
      title: "Time Range",
      render: (_, record) => (
        <span>
          {dayjs(record.start).format("MMM D, YYYY HH:mm")} -{" "}
          {dayjs(record.end).format("MMM D, YYYY HH:mm")}
        </span>
      ),
    },
    {
      title: "Actions",
      render: (_, record) => {
        if (!organizedReservations.includes(record.id)) {
          return (
            <Space>
              <Button onClick={() => handleViewParticipants(record.id)}>
                Participants
              </Button>
            </Space>
          );
        } else {
          return (
            <Space>
              <Button onClick={() => handleEditReservation(record)}>
                Edit
              </Button>
              <Button onClick={() => handleViewParticipants(record.id)}>
                Participants
              </Button>
              <Button danger onClick={() => handleDeleteReservation(record.id)}>
                Cancel
              </Button>
            </Space>
          );
        }
      },
    },
  ];

  const loadOccupiedRooms = async () => {
    try {
      const response = await RoomService.getOccupiedRooms();
      setOccupiedRooms(response.data);
    } catch (error) {
      messageApi.open({
        type: "error",
        content: "Failed to load occupied rooms data",
      });
      return [];
    }
  };

  const getDisabledTime = useMemo(() => {
    return (type) => {
      const roomId = form.getFieldValue("room");
      const { date, start, end } = timeSelection;

      if (!roomId || !date) {
        return { disabledHours: () => [], disabledMinutes: () => [] };
      }

      const now = dayjs();
      const isToday = date.isSame(now, "day");
      const room = occupiedRooms.find((r) => r.room_id === roomId);

      if (!room) {
        return { disabledHours: () => [], disabledMinutes: () => [] };
      }
      const slots = room.occupied_time
        .map((slot) => ({
          start: dayjs(slot.start),
          end: dayjs(slot.end),
        }))
        .filter(
          (slot) =>
            slot.start.isValid() &&
            slot.end.isValid() &&
            slot.start.isSame(date, "day")
        );

      const isTimeDisabled = (time) => {
        if (isToday && time.isBefore(now)) {
          return true;
        }

        return slots.some(
          (slot) => time.isSameOrAfter(slot.start) && time.isBefore(slot.end)
        );
      };

      const isTimeValid = (time) => {
        if (type === "start") {
          return !end || time.isBefore(end);
        } else {
          return start && time.isAfter(start);
        }
      };

      const disabledMinutes = (selectedHour) => {
        const minutes = [];
        for (let m = 0; m < 60; m += 15) {
          const time = date.hour(selectedHour).minute(m).second(0);

          if (isTimeDisabled(time) || !isTimeValid(time)) {
            minutes.push(m);
          }
        }
        return minutes;
      };

      const disabledHours = () => {
        const hours = [];
        for (let h = 0; h < 24; h++) {
          let hourDisabled = true;

          for (let m = 0; m < 60; m += 15) {
            const time = date.hour(h).minute(m).second(0);

            if (!isTimeDisabled(time) && isTimeValid(time)) {
              hourDisabled = false;
              break;
            }
          }

          if (hourDisabled) {
            hours.push(h);
          }
        }
        return hours;
      };

      if (type === "end") {
        const startTime = form.getFieldValue("startTime");

        return {
          disabledHours: () => {
            if (!startTime) return Array.from({ length: 24 }, (_, i) => i);

            const hours = [];
            for (let h = 0; h < 24; h++) {
              if (h < startTime.hour()) {
                hours.push(h);
              }
            }
            return hours;
          },
          disabledMinutes: (selectedHour) => {
            if (!startTime) return Array.from({ length: 60 }, (_, i) => i);

            const minutes = [];
            for (let m = 0; m < 60; m += 15) {
              const time = date.hour(selectedHour).minute(m).second(0);

              if (
                selectedHour === startTime.hour() &&
                m <= startTime.minute()
              ) {
                minutes.push(m);
              }

              if (isTimeDisabled(time)) {
                minutes.push(m);
              }
            }
            return minutes;
          },
        };
      }

      return {
        disabledHours,
        disabledMinutes,
      };
    };
  }, [timeSelection, occupiedRooms]);

  const updateTimeSelection = (field, value) => {
    const newSelection = { ...timeSelection };

    if (field === "reservationDate") {
      newSelection.date = value;

      newSelection.start = null;
      newSelection.end = null;
      form.setFieldsValue({ startTime: null, endTime: null });
    } else if (field === "startTime") {
      newSelection.start = value;

      newSelection.end = null;
      form.setFieldsValue({ endTime: null });
    } else if (field === "endTime") {
      newSelection.end = value;
    }

    setTimeSelection(newSelection);
  };

  const isRoomAvailable = (roomId) => {
    const { date, start, end } = timeSelection;

    if (!date || !start || !end) return true;

    const now = dayjs();
    const endTime = date.hour(end.hour()).minute(end.minute());
    if (endTime.isBefore(now)) return false;

    const room = occupiedRooms.find((r) => r.room_id === roomId);
    if (!room) return true;

    const selectedStart = date.hour(start.hour()).minute(start.minute());
    const selectedEnd = date.hour(end.hour()).minute(end.minute());

    return !room.occupied_time.some((slot) => {
      const slotStart = dayjs(slot.start);
      const slotEnd = dayjs(slot.end);

      return (
        selectedStart.isBetween(slotStart, slotEnd, null, "[)") ||
        selectedEnd.isBetween(slotStart, slotEnd, null, "[)") ||
        slotStart.isBetween(selectedStart, selectedEnd, null, "[)")
      );
    });
  };

  useEffect(() => {
    loadReservations();
    loadRooms();
    loadUsers();
    loadOccupiedRooms();
  }, []);

  const loadReservations = async () => {
    try {
      const room = searchParams.get("room");
      const status = searchParams.get("status") || "upcoming";
      const params = { status: status };
      if (room !== "") {
        params.room = room;
      }
      const response = await ReservationService.getReservations(params);
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
      const startDate = values.reservationDate;
      const startTime = values.startTime;
      const endTime = values.endTime;

      const start = startDate
        .hour(startTime.hour())
        .minute(startTime.minute())
        .second(0);

      const end = startDate
        .hour(endTime.hour())
        .minute(endTime.minute())
        .second(0);

      const data = {
        title: values.title,
        room: values.room,
        start: start.toISOString(),
        end: end.toISOString(),
      };

      if (values.id) {
        await ReservationService.updateReservation(values.id, data);
        messageApi.open({
          type: "success",
          content: "Reservation updated successfully",
        });
      } else {
        const response = await ReservationService.createReservation(data);
        messageApi.open({
          type: "success",
          content: "Reservation created successfully",
        });
        setOrganizedReservations((prev) => [...prev, response.data.id]);
      }

      loadReservations();
      setIsModalOpen(false);
      form.resetFields();
    } catch (error) {
      messageApi.open({ type: "error", content: "Operation failed" });
    }
  };

  const handleEditReservation = (reservation) => {
    const start = dayjs(reservation.start);
    const end = dayjs(reservation.end);

    form.setFieldsValue({
      ...reservation,
      reservationDate: start.startOf("day"),
      startTime: start,
      endTime: end,
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

  const ParticipantsModal = () => {
    const isOrganizer = organizedReservations.includes(selectedReservation);

    const participantColumns = [
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
        dataIndex: "role",
      },
      {
        title: "Status",
        dataIndex: "attends",
      },
    ];

    if (isOrganizer) {
      participantColumns.push({
        title: "Actions",
        render: (_, record) => (
          <Button danger onClick={() => handleDeleteParticipant(record.id)}>
            Remove
          </Button>
        ),
      });
    }

    return (
      <Modal
        title={isOrganizer ? "Manage Participants" : "Participants List"}
        open={!!selectedReservation}
        onCancel={() => setSelectedReservation(null)}
        footer={null}
        width={800}
      >
        {isOrganizer && (
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
        )}

        <Table
          dataSource={participants}
          columns={participantColumns}
          style={{ marginTop: 16 }}
          rowKey="id"
          locale={{
            emptyText: (
              <div
                style={{
                  padding: 40,
                  background: "#fafafa",
                  textAlign: "center",
                }}
              >
                No participants for this reservation
              </div>
            ),
          }}
        />
      </Modal>
    );
  };

  return (
    <div>
      {contextHolder}
      <ReservationFilters
        rooms={rooms}
        searchParams={searchParams}
        onFilterChange={loadReservations}
      />

      <Button
        type="primary"
        onClick={() => {
          form.resetFields();
          setIsModalOpen(true);
        }}
        style={{ marginBottom: 16 }}
      >
        Create Reservation
      </Button>

      <Table
        dataSource={reservations}
        columns={reservationColumns}
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
              No reservations
            </div>
          ),
        }}
      />
      <Modal
        title={
          form.getFieldValue("id") ? "Edit Reservation" : "Create Reservation"
        }
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
          setTimeSelection({ date: null, start: null, end: null });
        }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          onFinish={handleSubmitReservation}
          initialValues={timeSelection}
        >
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
                disabled: !isRoomAvailable(room.id),
              }))}
            />
          </Form.Item>

          <Form.Item
            name="reservationDate"
            label="Date"
            rules={[{ required: true, message: "Please select date" }]}
          >
            <DatePicker
              format="YYYY-MM-DD"
              disabledDate={(current) => current < dayjs().startOf("day")}
              onChange={(value) =>
                updateTimeSelection("reservationDate", value)
              }
            />
          </Form.Item>

          <Form.Item label="Time Range" required>
            <Space>
              <Form.Item
                name="startTime"
                rules={[{ required: true, message: "Start time required" }]}
                noStyle
              >
                <TimePicker
                  minuteStep={15}
                  format="HH:mm"
                  placeholder="Start Time"
                  disabled={!form.getFieldValue("reservationDate")}
                  onChange={(value) => updateTimeSelection("startTime", value)}
                  disabledTime={() => getDisabledTime("start")}
                />
              </Form.Item>
              <span>to</span>
              <Form.Item
                name="endTime"
                rules={[{ required: true, message: "End time required" }]}
                noStyle
              >
                <TimePicker
                  minuteStep={15}
                  format="HH:mm"
                  placeholder="End Time"
                  disabled={!form.getFieldValue("startTime")}
                  onChange={(value) => updateTimeSelection("endTime", value)}
                  disabledTime={() => getDisabledTime("end")}
                />
              </Form.Item>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <ParticipantsModal />
    </div>
  );
}
