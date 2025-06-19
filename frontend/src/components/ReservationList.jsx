import {
  Table,
  Button,
  Tag
} from "antd";
import { useEffect, useState } from "react";
import { ReservationService } from "../api/ReservationService";
import { RoomService } from "../api/RoomService";
import ReservationFilters from "./ReservationFilters";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
dayjs.extend(isBetween);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
import { useSearchParams } from "react-router-dom";
import {useNavigate} from "react-router-dom";


export default function ReservationList() {
  const [reservations, setReservations] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [searchParams] = useSearchParams({ room: "", status: "upcoming" });
  const navigate = useNavigate();

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
      render: (_, record) => {
        let title = record.title;
        if (record.recovery_date !== null && !record.is_cancelled) {
          const recovered = dayjs(record.recovery_date).format(
            "MMM D, YYYY HH:mm"
          );
          title += " (Recovered on " + recovered + ")";
        }
        return title;
      },
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
  ];

  useEffect(() => {
    loadReservations();
    loadRooms();
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
      console.error("Failed to load reservations", error);
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

  const handleRowClick = (record) => {
    navigate(`/reservations/${record.id}`);
  };

  return (
    <div>
      <ReservationFilters
        rooms={rooms}
        searchParams={searchParams}
        onFilterChange={loadReservations}
      />

      <Button
        type="primary"
        onClick={() => navigate("/reservations/new")}
        style={{ marginBottom: 16 }}
      >
        Create Reservation
      </Button>

      <Table
        dataSource={reservations}
        columns={reservationColumns}
        rowKey="id"
        style={{ marginTop: 24 }}
        onRow={(record) => ({
          onClick: () => handleRowClick(record),
          style: { cursor: "pointer" }
        })}
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
    </div>
  );
}