import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { Layout, Menu } from "antd";
import RoomList from "./components/RoomList";
import ReservationList from "./components/ReservationList";
import UserList from "./components/UserList";

const { Header, Content } = Layout;

function App() {
  return (
    <Router>
      <Layout>
        <Header>
          <Menu theme="dark" mode="horizontal">
            <Menu.Item key="1">
              <Link to="/rooms">Rooms</Link>
            </Menu.Item>
            <Menu.Item key="2">
              <Link to="/reservations">Reservations</Link>
            </Menu.Item>
            <Menu.Item key="3">
              <Link to="/users">Users</Link>
            </Menu.Item>
          </Menu>
        </Header>

        <Content style={{ padding: "24px" }}>
          <Routes>
            <Route path="/rooms" element={<RoomList />} />
            <Route path="/reservations" element={<ReservationList />} />
            <Route path="/users" element={<UserList />} />
          </Routes>
        </Content>
      </Layout>
    </Router>
  );
}

export default App;
