import StreamingGuide from '../../../../components/StreamingGuide';
import { streamingGuideMetadata } from '../../../../lib/streaming-guide';

export const revalidate = 3600;
export const metadata = streamingGuideMetadata('ja', 'dmm');

export default function Page() {
  return <StreamingGuide locale="ja" service="dmm"/>;
}
