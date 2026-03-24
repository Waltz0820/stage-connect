// src/components/Actors.tsx
import React, { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Gender, Actor } from "../lib/types";
import ActorCard from "./ActorCard";
import Breadcrumbs from "./Breadcrumbs";
import SeoHead from "./SeoHead";
import { useSiteUrl, useOgImage } from "../lib/hooks/useSiteUrl";

const STORAGE_KEY = "actors-list-state";

const Actors: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allActors, setAllActors] = useState<Actor[]>([]);
  const [genderFilter, setGenderFilter] = useState<"all" | Gender>(() => {
    const param = searchParams.get("gender");
    if (param === "male" || param === "female" || param === "other" || param === "all") {
      return param;
    }
    if (typeof window === "undefined") return "all";
    const saved = window.sessionStorage.getItem(STORAGE_KEY);
    if (!saved) return "all";
    try {
      const parsed = JSON.parse(saved) as { genderFilter?: "all" | Gender };
      return parsed.genderFilter === "male" || parsed.genderFilter === "female" || parsed.genderFilter === "other"
        ? parsed.genderFilter
        : "all";
    } catch {
      return "all";
    }
  });
  const [currentPage, setCurrentPage] = useState(() => {
    const param = Number(searchParams.get("page"));
    if (Number.isFinite(param) && param > 0) return param;
    if (typeof window === "undefined") return 1;
    const saved = window.sessionStorage.getItem(STORAGE_KEY);
    if (!saved) return 1;
    try {
      const parsed = JSON.parse(saved) as { currentPage?: number };
      return parsed.currentPage && parsed.currentPage > 0 ? parsed.currentPage : 1;
    } catch {
      return 1;
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ITEMS_PER_PAGE = 10;

  const siteUrl = useSiteUrl();
  const ogImageBase = useOgImage();

  const canonical = useMemo(() => {
    if (!siteUrl) return "";
    return `${siteUrl}/actors`;
  }, [siteUrl]);

  const title = "キャスト一覧 | Stage Connect";
  const description = "2.5次元舞台・ミュージカルに出演するキャスト（俳優）一覧。名前順で探せます。";

  const ogImage = ogImageBase;

  // ✅ 5×2 のスケルトン（=10枚）を固定で出す
  const skeletonCards = useMemo(() => Array.from({ length: ITEMS_PER_PAGE }, (_, i) => i), [ITEMS_PER_PAGE]);

  // Supabase から俳優一覧を取得
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase.from("actors").select("*").order("name", { ascending: true });

        if (cancelled) return;

        if (error) {
          console.error("fetch actors error", error);
          setError("キャスト一覧の取得に失敗しました。時間をおいて再度お試しください。");
          setAllActors([]);
          return;
        }

        setAllActors((data ?? []) as Actor[]);
      } catch (e) {
        console.error("fetch actors exception", e);
        if (!cancelled) {
          setError("キャスト一覧の取得に失敗しました。時間をおいて再度お試しください。");
          setAllActors([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // 名前順にソート（かな優先）
  const sortedActors = useMemo(() => {
    const arr = [...allActors];
    arr.sort((a, b) => {
      const nameA = a.kana || a.name;
      const nameB = b.kana || b.name;
      return nameA.localeCompare(nameB, "ja");
    });
    return arr;
  }, [allActors]);

  // 性別フィルタリング
  const filteredActors = useMemo(() => {
    return sortedActors.filter((actor) => {
      if (genderFilter === "all") return true;
      return actor.gender === genderFilter;
    });
  }, [sortedActors, genderFilter]);

  // ページネーション処理
  const totalPages = Math.max(1, Math.ceil(filteredActors.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const visibleActors = filteredActors.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // currentPage がはみ出たら戻す（フィルタ変更で起こり得る）
  useEffect(() => {
    if (loading) return;
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages, loading]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ genderFilter, currentPage })
    );
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("page", String(currentPage));
    nextParams.set("gender", genderFilter);
    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [genderFilter, currentPage, searchParams, setSearchParams]);

  useEffect(() => {
    const pageParam = Number(searchParams.get("page"));
    const nextPage = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const genderParam = searchParams.get("gender");
    const nextGender: "all" | Gender =
      genderParam === "male" || genderParam === "female" || genderParam === "other"
        ? genderParam
        : "all";

    if (currentPage !== nextPage) setCurrentPage(nextPage);
    if (genderFilter !== nextGender) setGenderFilter(nextGender);
  }, [searchParams]);

  const handleFilterChange = (filter: "all" | Gender) => {
    setGenderFilter(filter);
    setCurrentPage(1); // フィルタ変更時は1ページ目に戻す
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="container mx-auto px-6 pt-8 pb-16 lg:px-8 max-w-[1400px] animate-fade-in-up">
      {/* ✅ SEO */}
      <SeoHead
        title={title}
        description={description}
        canonical={canonical}
        metas={[
          { property: "og:type", content: "website" },
          { property: "og:site_name", content: "Stage Connect" },
          { property: "og:title", content: title },
          { property: "og:description", content: description },
          ...(canonical ? [{ property: "og:url", content: canonical }] : []),
          ...(ogImage ? [{ property: "og:image", content: ogImage }] : []),
          { name: "twitter:card", content: ogImage ? "summary_large_image" : "summary" },
          { name: "twitter:title", content: title },
          { name: "twitter:description", content: description },
          ...(ogImage ? [{ name: "twitter:image", content: ogImage }] : []),
        ]}
      />

      <Breadcrumbs items={[{ label: "キャスト一覧" }]} />

      <div className="mb-8 border-b border-white/10 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-wide text-white mb-2">キャスト一覧</h2>
          <p className="text-sm text-slate-400 font-light tracking-wider">登録キャスト一覧（五十音順）</p>
        </div>
        <div className="text-xs text-slate-500 font-mono">
          登録数: {filteredActors.length} / Page {currentPage}
        </div>
      </div>

      {/* 性別フィルタタブ */}
      <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => handleFilterChange("all")}
          className={`px-6 py-2 rounded-full text-sm font-bold tracking-wider transition-all duration-300 border whitespace-nowrap ${genderFilter === "all"
            ? "bg-neon-purple/20 border-neon-purple/50 text-white shadow-[0_0_15px_rgba(180,108,255,0.3)]"
            : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/30"
            }`}
        >
          すべて
        </button>
        <button
          onClick={() => handleFilterChange("male")}
          className={`px-6 py-2 rounded-full text-sm font-bold tracking-wider transition-all duration-300 border whitespace-nowrap ${genderFilter === "male"
            ? "bg-neon-cyan/20 border-neon-cyan/50 text-white shadow-[0_0_15px_rgba(0,255,255,0.3)]"
            : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/30"
            }`}
        >
          男性
        </button>
        <button
          onClick={() => handleFilterChange("female")}
          className={`px-6 py-2 rounded-full text-sm font-bold tracking-wider transition-all duration-300 border whitespace-nowrap ${genderFilter === "female"
            ? "bg-neon-pink/20 border-neon-pink/50 text-white shadow-[0_0_15px_rgba(233,68,166,0.3)]"
            : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/30"
            }`}
        >
          女性
        </button>
      </div>

      {/* ✅ LOADING DATABASE...（ネオンパープルで統一） */}
      {loading && (
        <div className="mb-6 text-center text-xs font-mono tracking-widest text-neon-pink animate-pulse">
          LOADING DATABASE...
        </div>
      )}

      {/* ✅ エラー */}
      {error && !loading && (
        <div className="mt-10 rounded-xl border border-red-500/40 bg-red-500/5 px-6 py-8 text-center">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* ✅ ローディング：5×2 のスケルトン（=10枚） */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 min-h-[50vh] animate-pulse">
          {skeletonCards.map((i) => (
            <div key={i} className="bg-theater-surface rounded-xl border border-white/10 p-6 flex flex-col h-full">
              {/* top row */}
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-full bg-white/10 shrink-0" />
                <div className="flex-1">
                  <div className="h-4 w-2/3 bg-white/10 rounded mb-2" />
                  <div className="h-3 w-1/2 bg-white/10 rounded" />
                </div>
              </div>

              {/* body */}
              <div className="flex-1 space-y-3">
                <div className="h-3 w-full bg-white/5 rounded" />
                <div className="h-3 w-11/12 bg-white/5 rounded" />
                <div className="h-3 w-9/12 bg-white/5 rounded" />
              </div>

              {/* footer */}
              <div className="mt-6 pt-4 border-t border-white/10">
                <div className="h-3 w-2/3 bg-white/10 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {filteredActors.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 min-h-[50vh]">
                {visibleActors.map((actor) => (
                  <ActorCard key={actor.slug} actor={actor} />
                ))}
              </div>

              {/* ページネーション */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-16 pt-8 border-t border-white/5">
                  <button
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-6 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-bold text-slate-300 hover:bg-white/10 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    « 前へ
                  </button>

                  <span className="text-sm font-mono text-slate-500">
                    Page <span className="text-white font-bold text-base mx-1">{currentPage}</span> / {totalPages}
                  </span>

                  <button
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-6 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-bold text-slate-300 hover:bg-white/10 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    次へ »
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="py-20 text-center border border-dashed border-white/10 rounded-xl bg-white/5">
              <p className="text-slate-400 mb-2">該当するキャストはいません</p>
              <button onClick={() => handleFilterChange("all")} className="text-neon-purple hover:underline text-sm">
                条件をリセットする
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Actors;
