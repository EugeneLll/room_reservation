import {
  Button,
  Form,
  Input,
  DatePicker,
  Space,
  message,
  Select,
  Tag,
  TimePicker,
  Row,
  Col,
  Card,
  Descriptions,
  Spin
} from "antd";
import { Table } from "antd";
import { useEffect, useState } from "react";
import { ReservationService } from "../api/ReservationService";
import { RoomService } from "../api/RoomService";
import { UserService } from "../api/UserService";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
dayjs.extend(isBetween);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
import { useParams, useNavigate } from "react-router-dom";

export default function ReservationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [users, setUsers] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [isEditing, setIsEditing] = useState(id === "new");
  const [form] = Form.useForm();
  const [participantForm] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [timeSelection, setTimeSelection] = useState({
    date: null,
    start: null,
    end: null,
  });
  const [occupiedRooms, setOccupiedRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentRoomId, setCurrentRoomId] = useState(null);

  const roles = [
    { id: "attendee", name: "Attendee" },
    { id: "organizer", name: "Organizer" },
  ];

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
    {
      title: "Actions",
      render: (_, record) => (
        <Button 
          danger 
          onClick={() => handleDeleteParticipant(record.id)}
          disabled={reservation?.is_cancelled ||!reservation.is_organized}
        >
          Remove
        </Button>
      ),
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await loadRooms();
        await loadUsers();
        
        if (id && id !== "new") {
          await loadReservation();
          await loadParticipants();
        } else {
          form.setFieldsValue({
            reservationDate: dayjs().startOf('day'),
            startTime: dayjs().startOf('hour').add(1, 'hour'),
          });
          setTimeSelection({
            date: dayjs().startOf('day'),
            start: dayjs().startOf('hour').add(1, 'hour'),
          });
          setLoading(false);
        }
      } catch (error) {
        messageApi.error("Failed to load data");
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    if (isEditing) {
      loadOccupiedRooms();
    }
  }, [isEditing, currentRoomId]);

  const loadReservation = async () => {
    try {
      const response = await ReservationService.getReservation(id);
      setReservation(response.data);
      
      const start = dayjs(response.data.start);
      const end = dayjs(response.data.end);
      
      form.setFieldsValue({
        ...response.data,
        reservationDate: start,
        startTime: start,
        endTime: end,
      });
      
      setTimeSelection({
        date: start,
        start: start,
        end: end,
      });
      
      setCurrentRoomId(response.data.room);
      setLoading(false);
    } catch (error) {
      messageApi.error("Failed to load reservation details");
      setLoading(false);
    }
  };

  const loadParticipants = async () => {
    try {
      const response = await ReservationService.getParticipants(id);
      setParticipants(response.data);
    } catch (error) {
      messageApi.error("Failed to load participants");
    }
  };

  const loadRooms = async () => {
    try {
      const response = await RoomService.getRooms();
      setRooms(response.data);
    } catch (error) {
      console.error("Failed to load rooms", error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await UserService.getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error("Failed to load users", error);
    }
  };

  const loadOccupiedRooms = async () => {
    try {
      const response = await RoomService.getOccupiedRooms();
      let occupiedData = response.data;
      
      if (id && id !== "new" && reservation && reservation.room) {
        occupiedData = occupiedData.map(room => {
          if (room.room_id === reservation.room) {
            return {
              ...room,
              occupied_time: room.occupied_time.filter(
                slot => slot.reservation_id.toString() !== id
              )
            };
          }
          return room;
        });
      }
      
      setOccupiedRooms(occupiedData);
    } catch (error) {
      console.error("Failed to load occupied rooms", error);
    }
  };

  const getRoomName = (roomId) => {
    const room = rooms.find(r => r.id === roomId);
    return room ? room.room_name : "Unknown Room";
  };

  const getDisabledTime = (type) => {
    const roomId = form.getFieldValue("room") || currentRoomId;
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

      if (dayjs(start).isAfter(dayjs(end))) {
        end.add(1, "day");
      }

      const data = {
        title: values.title,
        room: values.room,
        start: start.toISOString(),
        end: end.toISOString(),
      };

      if (id === "new") {
        const response = await ReservationService.createReservation(data);
        messageApi.success("Reservation created successfully");
        navigate(`/reservations/${response.data.id}`);
      } else {
        await ReservationService.updateReservation(id, data);
        messageApi.success("Reservation updated successfully");
        setIsEditing(false);
        setCurrentRoomId(values.room);
        loadReservation();
      }
    } catch (error) {
      messageApi.error("Operation failed: " + error.message);
    }
  };

  const handleDeleteReservation = async () => {
    try {
      await ReservationService.deleteReservation(id);
      messageApi.success("Reservation canceled");
      navigate("/reservations");
    } catch (error) {
      messageApi.error("Operation failed");
    }
  };

  const handleRestoreReservation = async () => {
    try {
      await ReservationService.recoverReservation(id);
      messageApi.success("Reservation recovered");
      loadReservation();
    } catch (error) {
      messageApi.error("Operation failed");
    }
  };

  const handleAddParticipant = async (values) => {
    try {
      await ReservationService.addParticipant(id, {
        user: values.user,
        role: values.role,
        reservation: id,
        attends: "pending",
      });
      messageApi.success("Participant added");
      loadParticipants();
      participantForm.resetFields();
    } catch (error) {
      messageApi.error("Operation failed: " + error.message);
    }
  };

  const handleDeleteParticipant = async (participantId) => {
    try {
      await ReservationService.deleteParticipant(participantId);
      messageApi.success("Participant removed");
      loadParticipants();
    } catch (error) {
      messageApi.error("Failed to remove participant");
    }
  };

  if (loading) {
    return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: '20%' }} />;
  }

  return (
    <div>
      {contextHolder}
      <Row gutter={16}>
        <Col span={isEditing ? 12 : 24}>
          <Card 
            title={id === "new" ? "Create Reservation" : reservation?.title}
            extra={
              id !== "new" && !isEditing &&reservation?.is_organized&& (
                <Space>
                  {!reservation?.is_cancelled? (
                    <>
                      <Button onClick={() => {
                        setIsEditing(true);
                        loadOccupiedRooms();
                      }}>
                        Edit
                      </Button>
                      <Button danger onClick={handleDeleteReservation}>
                        Cancel Reservation
                      </Button>
                    </>
                  ) : (
                    <Button onClick={handleRestoreReservation}>
                      Restore Reservation
                    </Button>
                  )}
                </Space>
              )
            }
          >
            {isEditing || id === "new" ? (
              <Form
                form={form}
                onFinish={handleSubmitReservation}
                layout="vertical"
              >
                <Form.Item name="id" hidden>
                  <Input />
                </Form.Item>
                <Form.Item 
                  name="title" 
                  label="Title" 
                  rules={[{ required: true, message: 'Please enter a title' }]}
                >
                  <Input />
                </Form.Item>

                <Form.Item 
                  name="room" 
                  label="Room" 
                  rules={[{ required: true, message: 'Please select a room' }]}
                >
                  <Select
                    showSearch
                    optionFilterProp="label"
                    options={rooms.map((room) => ({
                      value: room.id,
                      label: room.room_name,
                      disabled: !isRoomAvailable(room.id),
                    }))}
                    onChange={value => setCurrentRoomId(value)}
                  />
                </Form.Item>

                <Form.Item
                  name="reservationDate"
                  label="Date"
                  rules={[{ required: true, message: 'Please select a date' }]}
                >
                  <DatePicker
                    format="YYYY-MM-DD"
                    disabledDate={(current) => current && current < dayjs().startOf("day")}
                    onChange={(value) => {
                      updateTimeSelection("reservationDate", value);
                      loadOccupiedRooms();
                    }}
                  />
                </Form.Item>

                <Form.Item label="Time Range" required>
                  <Space>
                    <Form.Item
                      name="startTime"
                      rules={[{ required: true, message: 'Start time is required' }]}
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
                      rules={[{ required: true, message: 'End time is required' }]}
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
                
                <Form.Item>
                  <Button type="primary" htmlType="submit">
                    {id === "new" ? "Create" : "Update"}
                  </Button>
                  {id !== "new" && (
                    <Button 
                      style={{ marginLeft: 8 }} 
                      onClick={() => {
                        setIsEditing(false);
                        form.resetFields();
                        loadReservation();
                      }}
                    >
                      Back
                    </Button>
                  )}
                  
                  {id === "new" && (
                    <Button 
                      style={{ marginLeft: 8 }} 
                      onClick={() => navigate("/reservations")}
                    >
                      Cancel
                    </Button>
                  )}
                </Form.Item>
              </Form>
            ) : (
              <Descriptions bordered column={1}>
                <Descriptions.Item label="Title">
                  {reservation?.title}
                </Descriptions.Item>
                <Descriptions.Item label="Room">
                  {getRoomName(reservation?.room)}
                </Descriptions.Item>
                <Descriptions.Item label="Start Time">
                  {dayjs(reservation?.start).format("MMM D, YYYY HH:mm")}
                </Descriptions.Item>
                <Descriptions.Item label="End Time">
                  {dayjs(reservation?.end).format("MMM D, YYYY HH:mm")}
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  {reservation?.is_cancelled ? (
                    <Tag color="red">Cancelled</Tag>
                  ) : dayjs(reservation?.end).isAfter(dayjs()) ? (
                    <Tag color="green">Active</Tag>
                  ) : (
                    <Tag>Completed</Tag>
                  )}
                </Descriptions.Item>
              </Descriptions>
            )}
          </Card>
        </Col>

        {id !== "new" && (
          <Col span={isEditing ? 12 : 24}>
            <Card title="Participants">
              {/* FIXED: Corrected condition for showing participant form */}
              {(!reservation?.is_cancelled &&reservation?.is_organized)&& (
                <Form
                  form={participantForm}
                  onFinish={handleAddParticipant}
                  layout="inline"
                  style={{ marginBottom: 16 }}
                >
                  <Form.Item
                    name="user"
                    rules={[{ required: true, message: 'Please select a user' }]}
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

                  <Form.Item name="role">
                    <Select
                      style={{ width: 120 }}
                      placeholder="Role"
                      options={roles.map((role) => ({
                        value: role.id,
                        label: role.name,
                      }))}
                    />
                  </Form.Item>

                  <Button type="primary" htmlType="submit">
                    Add
                  </Button>
                </Form>
              )}

              <Table
                dataSource={participants}
                columns={participantColumns}
                rowKey="id"
                pagination={{ pageSize: 5 }}
                locale={{
                  emptyText: "No participants found"
                }}
              />
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
}