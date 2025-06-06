import { Table, Button, Space, Spin, message } from "antd";
import { useState, useEffect } from "react";
import { UserService } from "../api/UserService";
import { useAuth } from "../context/AuthContext";
import dayjs from "dayjs";

export default function MyReservations() {
  const [messageApi, contextHolder] = message.useMessage();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const columns = [
    {
      title: "Title",
      dataIndex: "title",
    },
    {
      title: "Room",
      dataIndex: "room",
      render: (room) => room.room_name,
    },
    {
      title: "Time",
      render: (_, record) => (
        <span>
          {dayjs(record.start).format("MMM D, YYYY HH:mm")} -
          {dayjs(record.end).format("MMM D, YYYY HH:mm")}
        </span>
      ),
    },
  ];

  useEffect(() => {
    if (user) {
      loadReservations();
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

  return (
    <div>
      {contextHolder}
      <h1>My Reservations</h1>
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
    </div>
  );
}
