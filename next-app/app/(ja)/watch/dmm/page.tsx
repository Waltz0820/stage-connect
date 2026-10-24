import DmmTvLanding from '../../../../components/DmmTvLanding';
import { streamingGuideMetadata } from '../../../../lib/streaming-guide';

export const revalidate = 3600;
export const metadata = streamingGuideMetadata('ja', 'dmm');

export default function Page() {
  return <DmmTvLanding locale="ja"/>;
}
