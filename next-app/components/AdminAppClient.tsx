"use client";

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import AdminActorEdit from "../../components/admin/AdminActorEdit";
import AdminActors from "../../components/admin/AdminActors";
import AdminCastsEdit from "../../components/admin/AdminCastsEdit";
import AdminGuard from "../../components/admin/AdminGuard";
import AdminGuideEdit from "../../components/admin/AdminGuideEdit";
import AdminGuides from "../../components/admin/AdminGuides";
import AdminHome from "../../components/admin/AdminHome";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminPlayEdit from "../../components/admin/AdminPlayEdit";
import AdminPlays from "../../components/admin/AdminPlays";
import AdminSeries from "../../components/admin/AdminSeries";
import AdminSeriesEdit from "../../components/admin/AdminSeriesEdit";

function Wrapped({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <AdminLayout>{children}</AdminLayout>
    </AdminGuard>
  );
}

export default function AdminAppClient() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<Wrapped><AdminHome /></Wrapped>} />

        <Route path="/admin/series" element={<Wrapped><AdminSeries /></Wrapped>} />
        <Route path="/admin/series/new" element={<Wrapped><AdminSeriesEdit mode="new" /></Wrapped>} />
        <Route path="/admin/series/:slug" element={<Wrapped><AdminSeriesEdit mode="edit" /></Wrapped>} />

        <Route path="/admin/plays" element={<Wrapped><AdminPlays /></Wrapped>} />
        <Route path="/admin/plays/new" element={<Wrapped><AdminPlayEdit mode="new" /></Wrapped>} />
        <Route path="/admin/plays/:slug" element={<Wrapped><AdminPlayEdit mode="edit" /></Wrapped>} />
        <Route path="/admin/plays/:slug/casts" element={<Wrapped><AdminCastsEdit /></Wrapped>} />

        <Route path="/admin/actors" element={<Wrapped><AdminActors /></Wrapped>} />
        <Route path="/admin/actors/new" element={<Wrapped><AdminActorEdit mode="new" /></Wrapped>} />
        <Route path="/admin/actors/:slug" element={<Wrapped><AdminActorEdit mode="edit" /></Wrapped>} />

        <Route path="/admin/guides" element={<Wrapped><AdminGuides /></Wrapped>} />
        <Route path="/admin/guides/new" element={<Wrapped><AdminGuideEdit mode="new" /></Wrapped>} />
        <Route path="/admin/guides/:slug" element={<Wrapped><AdminGuideEdit mode="edit" /></Wrapped>} />

        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
