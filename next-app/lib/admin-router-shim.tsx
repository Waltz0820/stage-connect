"use client";

import Link, { type LinkProps } from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { createContext, useContext, useMemo } from "react";

type ParamsShape = Record<string, string | undefined>;

type RouteContextValue = {
  pathname: string;
  params: ParamsShape;
};

const AdminRouteContext = createContext<RouteContextValue>({
  pathname: "",
  params: {},
});

export function AdminRouteProvider({
  pathname,
  params,
  children,
}: {
  pathname: string;
  params: ParamsShape;
  children: React.ReactNode;
}) {
  const value = useMemo(() => ({ pathname, params }), [pathname, params]);
  return <AdminRouteContext.Provider value={value}>{children}</AdminRouteContext.Provider>;
}

export function useParams<T extends ParamsShape = ParamsShape>() {
  return useContext(AdminRouteContext).params as T;
}

export function useLocation() {
  const context = useContext(AdminRouteContext);
  const fallbackPathname = usePathname();

  return {
    pathname: context.pathname || fallbackPathname || "",
  };
}

export function useNavigate() {
  const router = useRouter();

  return (to: string, options?: { replace?: boolean }) => {
    if (options?.replace) {
      router.replace(to);
      return;
    }

    router.push(to);
  };
}

export function Navigate({ to, replace = false }: { to: string; replace?: boolean }) {
  const navigate = useNavigate();

  React.useEffect(() => {
    navigate(to, { replace });
  }, [navigate, replace, to]);

  return null;
}

type ShimLinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> &
  Omit<LinkProps, "href"> & {
    to: string;
  };

export function LinkShim({ to, children, ...props }: ShimLinkProps) {
  return (
    <Link href={to} {...props}>
      {children}
    </Link>
  );
}

export { LinkShim as Link };
