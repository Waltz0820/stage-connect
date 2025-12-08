import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { getActorBySlug } from '../lib/utils/getActorBySlug';
import { getPlaysByActorSlug } from '../lib/utils/getPlaysByActorSlug';
import { groupPlaysByYear } from '../lib/utils/groupPlaysByYear';
import { getCoStars } from '../lib/utils/getCoStars';
import TimelineSection from './TimelineSection';
import TagBadge from './TagBadge';
import ActorAvatar from './ActorAvatar';
import FavoriteButton from './FavoriteButton';
import ShareButton from './ShareButton';
import Breadcrumbs from './Breadcrumbs';

const ActorDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const actor = slug ? getActorBySlug(slug) : undefined;

  if (!actor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in-up">
        <h2 className="text-2xl font-bold text-white">俳優が見つかりませんでした</h2>
        <p className="mt-2 text-slate-400">お探しの俳優は見つかりませんでした。</p>
        <Link to="/actors" className="mt-8 px-8 py-3 bg-white/5 border border-white/10 text-white rounded-full text-sm font-bold hover:bg-white/10 hover:border-neon-purple/50 transition-colors">
          一覧に戻る
        </Link>
      </div>
    );
  }

  // 出演作品を取得し、年別にグルーピングする
  const plays = slug ? getPlaysByActorSlug(slug) : [];
  const timelineGroups = groupPlaysByYear(plays);

  // 共演キャストを取得
  const coStars = slug ? getCoStars(slug) : [];

  return (
    <div className="container mx-auto px-6 pt-8 pb-16 lg:px-8 max-w-5xl animate-fade-in-up">
      <Breadcrumbs 
        items={[
          { label: 'キャスト一覧', to: '/actors' },
          { label: actor.name }
        ]} 
      />

      {/* Header Card Section */}
      <div className="mb-12">
        <div className="bg-theater-surface rounded-2xl border border-white/5 p-8 md:p-10 shadow-[0_0_30px_rgba(0,0,0,0.3)] backdrop-blur-sm relative overflow-hidden flex flex-col md:flex-row items-center md:items-center gap-6 md:gap-10 text-center md:text-left">
          
          {/* Background Decor */}
          <div className="absolute top-[-50%] right-[-10%] w-[300px] h-[300px] bg-neon-purple/10 blur-[80px] rounded-full pointer-events-none"></div>

          {/* Avatar */}
          <div className="shrink-0 relative z-10">
             <ActorAvatar imageUrl={actor.imageUrl} alt={actor.name} size="lg" />
          </div>

          {/* Text Content */}
          <div className="flex flex-col gap-3 z-10 flex-1 min-w-0 items-center md:items-start">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight drop-shadow-md mb-2">
                  {actor.name}
                </h1>
                {actor.kana && (
                  <span className="text-sm md:text-base text-neon-purple font-bold tracking-widest uppercase block">
                    {actor.kana}
                  </span>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3 mt-1 mb-2">
              <FavoriteButton slug={actor.slug} type="actor" size="lg" className="shrink-0" />
              <ShareButton title={actor.name} text={`${actor.name}のプロフィール | Stage Connect`} className="shrink-0" />
            </div>

            {actor.tags && actor.tags.length > 0 && (
              <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-1">
                {actor.tags.map((tag) => (
                  <TagBadge key={tag}>{tag}</TagBadge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-16">
          {/* Profile */}
          <section>
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="w-1 h-6 bg-neon-purple rounded-full shadow-[0_0_10px_#B46CFF]"></span>
              プロフィール
            </h2>
            <div className="prose prose-invert prose-lg max-w-none text-slate-300 leading-loose font-light">
              {actor.profile || 'プロフィール情報はまだありません。'}
            </div>
          </section>

          {/* Timeline Section */}
          <section>
             <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
               <span className="w-1 h-6 bg-neon-pink rounded-full shadow-[0_0_10px_#E944A6]"></span>
              出演作品タイムライン
            </h2>

            {plays.length > 0 ? (
              <TimelineSection groups={timelineGroups} />
            ) : (
              <p className="text-slate-500 italic py-4">登録されている出演作品はありません。</p>
            )}
          </section>

          {/* Co-Star Network Section */}
          {coStars.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
                <span className="w-1 h-6 bg-neon-cyan rounded-full shadow-[0_0_10px_#00FFFF]"></span>
                共演ネットワーク
                <span className="text-xs font-normal text-slate-500 ml-2 border border-slate-700 px-2 py-0.5 rounded">共演数の多いキャスト</span>
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {coStars.map(({ actor: coStar, count }) => (
                  <Link 
                    key={coStar.slug}
                    to={`/actors/${coStar.slug}`}
                    className="flex items-center gap-4 bg-theater-surface p-4 rounded-xl border border-white/5 hover:border-neon-cyan/50 hover:bg-white/5 transition-all duration-300 group"
                  >
                    <ActorAvatar imageUrl={coStar.imageUrl} alt={coStar.name} size="sm" />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="font-bold text-white group-hover:text-neon-cyan transition-colors truncate">
                          {coStar.name}
                        </h3>
                        <span className="text-[10px] font-bold bg-neon-cyan/10 text-neon-cyan px-2 py-0.5 rounded-full border border-neon-cyan/20 whitespace-nowrap ml-2">
                          ★ {count}作
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1">
                        {coStar.tags?.[0] || '俳優'}
                      </p>
                    </div>
                    
                    <svg className="w-4 h-4 text-slate-600 group-hover:text-neon-cyan transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-theater-surface/50 backdrop-blur-sm rounded-xl p-8 border border-white/10 sticky top-24">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6">
              公式リンク
            </h3>
            {actor.sns ? (
              <ul className="space-y-4">
                {actor.sns.official && (
                  <li>
                    <a
                      href={actor.sns.official}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-sm font-bold text-slate-300 hover:text-white transition-colors group"
                    >
                      <span className="w-10 h-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center mr-4 group-hover:border-neon-purple/50 group-hover:shadow-[0_0_10px_rgba(180,108,255,0.3)] transition-all">
                         <svg className="w-4 h-4 text-slate-400 group-hover:text-neon-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                         </svg>
                      </span>
                      公式サイト
                    </a>
                  </li>
                )}
                {actor.sns.x && (
                  <li>
                    <a
                      href={actor.sns.x}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-sm font-bold text-slate-300 hover:text-white transition-colors group"
                    >
                      <span className="w-10 h-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center mr-4 group-hover:border-neon-purple/50 group-hover:shadow-[0_0_10px_rgba(180,108,255,0.3)] transition-all">
                        <svg className="w-4 h-4 text-slate-400 group-hover:text-neon-purple" fill="currentColor" viewBox="0 0 24 24">
                           <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      </span>
                      X (Twitter)
                    </a>
                  </li>
                )}
                {actor.sns.instagram && (
                  <li>
                    <a
                      href={actor.sns.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-sm font-bold text-slate-300 hover:text-white transition-colors group"
                    >
                       <span className="w-10 h-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center mr-4 group-hover:border-neon-purple/50 group-hover:shadow-[0_0_10px_rgba(180,108,255,0.3)] transition-all">
                        <svg className="w-4 h-4 text-slate-400 group-hover:text-neon-purple" fill="currentColor" viewBox="0 0 24 24">
                          <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.416 2.52c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.825-.058.975-.045 1.504-.207 1.857-.344.467-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.825-.045-.975-.207-1.504-.344-1.857-.182-.466-.398-.8-.748-1.15-.35-.35-.683-.566-1.15-.748-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                        </svg>
                      </span>
                      Instagram
                    </a>
                  </li>
                )}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">リンク情報はありません</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActorDetail;