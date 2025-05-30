import { Card, Descriptions, Button } from "antd";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function Profile() {
  const { user } = useAuth();

  return (
    <Card title="Your Profile" style={{ maxWidth: 600, margin: "0 auto" }}>
      <Descriptions bordered column={1}>
        <Descriptions.Item label="Username">{user?.username}</Descriptions.Item>
        <Descriptions.Item label="Email">{user?.email}</Descriptions.Item>
      </Descriptions>
      <div style={{ marginTop: 16, textAlign: "center" }}>
        <Link to="/my-reservations">
          <Button type="primary">View My Reservations</Button>
        </Link>
      </div>
    </Card>
  );
}
