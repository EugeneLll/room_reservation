import { Button, Select } from "antd";

const ReservationFilters = ({ rooms, searchParams, onFilterChange }) => {
  const handleRoomChange = (value) => {
    searchParams.set("room", value || "");

    onFilterChange();
  };

  const handleStatusChange = (value) => {
    searchParams.set("status", value);
    onFilterChange();
  };

  const clearFilters = () => {
    searchParams.set("room", "");
    searchParams.set("status", "upcoming");
    onFilterChange();
  };
  return (
    <div
      style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}
    >
      <Select
        placeholder="Filter by room"
        style={{ width: 200 }}
        onChange={handleRoomChange}
        value={searchParams.get("room") || undefined}
        allowClear
      >
        {rooms.map((room) => (
          <Select.Option key={room.id} value={room.id}>
            {room.room_name}
          </Select.Option>
        ))}
      </Select>

      <Select
        placeholder="Filter by status"
        style={{ width: 150 }}
        onChange={handleStatusChange}
        value={searchParams.get("status")}
      >
        <Select.Option value="all">All</Select.Option>
        <Select.Option value="upcoming">Upcoming</Select.Option>
        <Select.Option value="cancelled">Cancelled</Select.Option>
        <Select.Option value="past">Past</Select.Option>
      </Select>

      <Button onClick={clearFilters}>Clear Filters</Button>
    </div>
  );
};

export default ReservationFilters;
