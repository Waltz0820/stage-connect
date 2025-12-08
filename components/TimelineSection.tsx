import React from 'react';
import { Link } from 'react-router-dom';
import { TimelineGroup } from '../lib/utils/groupPlaysByYear';
import PlayCard from './PlayCard';

interface TimelineSectionProps {
  groups: TimelineGroup[];
}

const TimelineSection: React.FC<TimelineSectionProps> = ({ groups }) => {
  return (
    <div className="space-y-12 relative">
      {/* タイムラインの垂直線（背景） */}
      <div className="absolute left-0 top-4 bottom-0 w-px bg-gradient-to-b from-neon-purple/50 via-neon-purple/20 to-transparent md:left-4"></div>

      {groups.map((group, index) => (
        <div 
          key={group.year} 
          className="relative pl-8 md:pl-16 animate-fade-in-up"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {/* 年ごとのドットマーカー */}
          <div className="absolute left-[-4px] md:left-[12px] top-2 w-2 h-2 rounded-full bg-neon-purple shadow-[0_0_10px_#B46CFF]"></div>

          {/* 年見出し */}
          <h3 className="text-3xl font-bold text-white mb-6 flex items-baseline gap-3">
            <span className="text-neon-purple drop-shadow-[0_0_5px_rgba(180,108,255,0.5)]">
              {group.year}
            </span>
            <span className="text-sm font-normal text-slate-500 tracking-widest">
              YEAR
            </span>
          </h3>

          {/* 作品グリッド */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {group.plays.map((play) => (
              <PlayCard key={play.slug} play={play} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TimelineSection;