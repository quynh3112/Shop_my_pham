import { Outlet } from "react-router-dom";
import ChatWidget from "../component/chatWidget";
import Header from "../component/header";

export default function MainLayout() {
  return (
    <>
      <Header />
      <Outlet />
     
      <ChatWidget />
    </>
  );
}
