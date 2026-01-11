import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AuthProvider } from '@/contexts/AuthContextFirebase';
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
