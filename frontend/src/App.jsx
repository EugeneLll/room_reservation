import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
} from "react-router-dom";
import { Layout, Menu, Button, Dropdown, Space, Avatar } from "antd";
import { LogoutOutlined, UserOutlined } from "@ant-design/icons";
import { useAuth } from "./context/AuthContext";
import {
  LoginForm,
  MyReservations,
  Profile,
  ProtectedRoute,
  ReservationList,
  RoomList,
  SignupForm,
  UserList,
} from "./components/index";

const { Header, Content } = Layout;

export default function App() {
  const { user, logout } = useAuth();

  const userMenu = (
    <Menu>
      <Menu.Item key="profile">
        <Link to="/profile">Profile</Link>
      </Menu.Item>
      <Menu.Item key="logout" onClick={logout} icon={<LogoutOutlined />}>
        Logout
      </Menu.Item>
    </Menu>
  );

  return (
    <Router>
      <Layout style={{ minHeight: "100vh" }}>
        <Header style={{ display: "flex", alignItems: "center" }}>
          <div className="logo" style={{ color: "white", marginRight: 24 }}>
            Room Booking
          </div>

          <Menu theme="dark" mode="horizontal" style={{ flex: 1 }}>
            <Menu.Item key="1">
              <Link to="/users">Users</Link>
            </Menu.Item>
            <Menu.Item key="2">
              <Link to="/rooms">Rooms</Link>
            </Menu.Item>
            <Menu.Item key="3">
              <Link to="/reservations">Reservations</Link>
            </Menu.Item>
          </Menu>

          {user ? (
            <Dropdown overlay={userMenu} trigger={["click"]}>
              <Space style={{ cursor: "pointer" }}>
                <Avatar icon={<UserOutlined />} />
                <span style={{ color: "white" }}>{user.username}</span>
              </Space>
            </Dropdown>
          ) : (
            <div>
              <Link to="/login">
                <Button type="primary" ghost style={{ marginRight: 8 }}>
                  Login
                </Button>
              </Link>
              <Link to="/signup">
                <Button>Sign Up</Button>
              </Link>
            </div>
          )}
        </Header>

        <Content style={{ padding: "24px" }}>
          <Routes>
            <Route path="/login" element={<LoginForm />} />
            <Route path="/signup" element={<SignupForm />} />

            <Route
              path="/rooms"
              element={
                <ProtectedRoute>
                  <RoomList />
                </ProtectedRoute>
              }
            />

            <Route
              path="/reservations"
              element={
                <ProtectedRoute>
                  <ReservationList />
                </ProtectedRoute>
              }
            />

            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <UserList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/my-reservations"
              element={
                <ProtectedRoute>
                  <MyReservations />
                </ProtectedRoute>
              }
            />

            <Route
              path="/"
              element={<Navigate to="/my-reservations" replace />}
            />
          </Routes>
        </Content>
      </Layout>
    </Router>
  );
}
