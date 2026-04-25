"use client";

import { usePathname } from "next/navigation";
import AdminActorEdit from "../../components/admin/AdminActorEdit";
import AdminActors from "../../components/admin/AdminActors";
import AdminCastsEdit from "../../components/admin/AdminCastsEdit";
import AdminExternalKiraHai from "../../components/admin/AdminExternalKiraHai";
import AdminGuard from "../../components/admin/AdminGuard";
import AdminGuideEdit from "../../components/admin/AdminGuideEdit";
import AdminGuides from "../../components/admin/AdminGuides";
import AdminHome from "../../components/admin/AdminHome";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminPlayEdit from "../../components/admin/AdminPlayEdit";
import AdminPlays from "../../components/admin/AdminPlays";
import AdminSeries from "../../components/admin/AdminSeries";
import AdminSeriesEdit from "../../components/admin/AdminSeriesEdit";
import { AdminRouteProvider, Navigate } from "../lib/admin-router-shim";

type RouteMatch = {
  element: React.ReactNode;
  params: Record<string, string | undefined>;
};

function Wrapped({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <AdminLayout>{children}</AdminLayout>
    </AdminGuard>
  );
}

function matchPattern(pattern: string, pathname: string) {
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = pathname.split("/").filter(Boolean);

  if (patternParts.length !== pathParts.length) {
    return null;
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i += 1) {
    const patternPart = patternParts[i];
    const pathPart = pathParts[i];

    if (patternPart.startsWith(":")) {
      params[patternPart.slice(1)] = decodeURIComponent(pathPart);
      continue;
    }

    if (patternPart !== pathPart) {
      return null;
    }
  }

  return params;
}

function resolveRoute(pathname: string): RouteMatch | null {
  const routes: Array<{ pattern: string; element: React.ReactNode }> = [
    { pattern: "/admin", element: <Wrapped><AdminHome /></Wrapped> },
    { pattern: "/admin/series", element: <Wrapped><AdminSeries /></Wrapped> },
    { pattern: "/admin/series/new", element: <Wrapped><AdminSeriesEdit mode="new" /></Wrapped> },
    { pattern: "/admin/series/:slug", element: <Wrapped><AdminSeriesEdit mode="edit" /></Wrapped> },
    { pattern: "/admin/plays", element: <Wrapped><AdminPlays /></Wrapped> },
    { pattern: "/admin/plays/new", element: <Wrapped><AdminPlayEdit mode="new" /></Wrapped> },
    { pattern: "/admin/plays/:slug/casts", element: <Wrapped><AdminCastsEdit /></Wrapped> },
    { pattern: "/admin/plays/:slug", element: <Wrapped><AdminPlayEdit mode="edit" /></Wrapped> },
    { pattern: "/admin/actors", element: <Wrapped><AdminActors /></Wrapped> },
    { pattern: "/admin/actors/new", element: <Wrapped><AdminActorEdit mode="new" /></Wrapped> },
    { pattern: "/admin/actors/:slug", element: <Wrapped><AdminActorEdit mode="edit" /></Wrapped> },
    { pattern: "/admin/external/kira-hai", element: <Wrapped><AdminExternalKiraHai /></Wrapped> },
    { pattern: "/admin/guides", element: <Wrapped><AdminGuides /></Wrapped> },
    { pattern: "/admin/guides/new", element: <Wrapped><AdminGuideEdit mode="new" /></Wrapped> },
    { pattern: "/admin/guides/:slug", element: <Wrapped><AdminGuideEdit mode="edit" /></Wrapped> },
  ];

  for (const route of routes) {
    const params = matchPattern(route.pattern, pathname);
    if (params) {
      return { element: route.element, params };
    }
  }

  return null;
}

export default function AdminAppClient() {
  const pathname = usePathname() || "/admin";
  const match = resolveRoute(pathname);

  if (!match) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <AdminRouteProvider pathname={pathname} params={match.params}>
      {match.element}
    </AdminRouteProvider>
  );
}
