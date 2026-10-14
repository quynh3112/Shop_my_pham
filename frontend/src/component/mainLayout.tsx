import { Outlet } from "react-router-dom";
import ChatWidget from "./chatWidget";
import Header from "./header";

export default function MainLayout() {
  return (
    <>
      <Header />
      <Outlet />
      <ChatWidget />
    </>
  );
}
