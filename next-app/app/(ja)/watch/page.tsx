import StreamingHub from '../../../components/StreamingHub';
import { streamingGuideMetadata } from '../../../lib/streaming-guide';

export const revalidate = 3600;
export const metadata = {
  ...streamingGuideMetadata('ja'),
  title: '2.5次元舞台の配信サービス一覧｜VOD・サブスクの選び方 | Stage Connect',
  description: '2.5次元舞台・ミュージカルの主な動画配信サービス（VOD）を一覧で紹介。DMM TV・U-NEXT・dアニメストアなどの選び方、見放題・レンタル・ライブ配信の違いを整理し、作品別の配信リンクへ案内します。',
};

export default function Page() {
  return <StreamingHub/>;
}
