import { Table, Tag, Spin, message, Button, Space, Tabs } from "antd";
import { useState, useEffect } from "react";
import { UserService } from "../api/UserService";
import { ReservationService } from "../api/ReservationService";
import { useAuth } from "../context/AuthContext";
import dayjs from "dayjs";

export default function MyReservations() {
  const [messageApi, contextHolder] = message.useMessage();
  const [reservations, setReservations] = useState([]);
  const [invites, setInvites] = useState();
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const columns = [
    {
      title: "Title",
      render: (_, record) => record.reservation.title,
    },
    {
      title: "Room",
      render: (_, record) => record.reservation.room.room_name,
    },
    {
      title: "Time",
      render: (_, record) => (
        <span>
          {dayjs(record.reservation.start).format("MMM D, YYYY HH:mm")} -
          {dayjs(record.reservation.end).format("MMM D, YYYY HH:mm")}
        </span>
      ),
    },
    {
      title: "Attendance",
      render: (_, record) => {
        const attendance = record.participant.attends;
        if (attendance === "accepted") {
          return <Tag color="green">Accepted</Tag>;
        } else if (attendance === "declined") {
          return <Tag color="red">Declined</Tag>;
        }
        return (
          <Space>
            <Button
              danger
              onClick={() =>
                handleDecline(record.reservation.id, record.participant.id)
              }
            >
              Decline
            </Button>
            <Button
              primary
              onClick={() =>
                handleAccept(record.reservation.id, record.participant.id)
              }
            >
              Accept
            </Button>
          </Space>
        );
      },
    },
  ];

  useEffect(() => {
    if (user) {
      loadReservations();
      loadInvites();
    }
  }, [user]);

  const loadReservations = async () => {
    try {
      setLoading(true);
      const response = await UserService.getUserReservations();
      setReservations(response.data);
    } catch (error) {
      messageApi.error("Failed to load your reservations");
    } finally {
      setLoading(false);
    }
  };

  const loadInvites = async () => {
    try {
      setLoading(true);
      const response = await UserService.getUserReservations({
        type: "invitation",
      });
      setInvites(response.data);
    } catch (error) {
      messageApi.error("Failed to load your invites");
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async (reservationID, participantID) => {
    try {
      ReservationService.modifyAttendance(reservationID, participantID, {
        status: "declined",
      });
      messageApi.success("Attendance status modified");
      await loadReservations();
      await loadInvites();
    } catch (error) {
      messageApi.error("Modification failed");
    }
  };

  const handleAccept = async (reservationID, participantID) => {
    try {
      ReservationService.modifyAttendance(reservationID, participantID, {
        status: "accepted",
      });
      messageApi.success("Attendance status modified");
      await loadReservations();
      await loadInvites();
    } catch (error) {
      messageApi.error("Modification failed");
    }
  };

  const items = [
    {
      key: "1",
      label: `Invites (${invites?.length || 0})`,
      children: (
        <Spin spinning={loading}>
          <Table
            dataSource={invites}
            columns={columns}
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
                  No reservations for current user
                </div>
              ),
            }}
          />
        </Spin>
      ),
    },
    {
      key: "2",
      label: "My Reservations",
      children: (
        <Spin spinning={loading}>
          <Table
            dataSource={reservations}
            columns={columns}
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
                  No reservations for current user
                </div>
              ),
            }}
          />
        </Spin>
      ),
    },
  ];

  return (
    <div>
      {contextHolder}
      <h1>My Reservations</h1>
      <Tabs defaultActiveKey="1" items={items} />
    </div>
  );
}
