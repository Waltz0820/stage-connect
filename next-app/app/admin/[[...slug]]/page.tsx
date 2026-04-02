import type { Metadata } from "next";
import AdminAppClient from "../../../components/AdminAppClient";

export const metadata: Metadata = {
  title: "Admin | Stage Connect",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminCatchAllPage() {
  return <AdminAppClient />;
}
