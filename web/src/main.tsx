import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App as AntdApp, ConfigProvider } from "antd";
import "antd/dist/reset.css";
import "./index.css";
import "./styles/theme.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#d4a843",
          colorBgContainer: "#1a1714",
          colorBgElevated: "#221f1b",
          colorText: "#ede6dc",
          colorTextSecondary: "#b8aea0",
          colorBorder: "#3d3730",
          borderRadius: 6,
        },
      }}
    >
      <AntdApp>
        <App />
      </AntdApp>
    </ConfigProvider>
  </StrictMode>,
);
