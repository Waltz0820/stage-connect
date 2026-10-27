import StreamingHub from '../../../components/StreamingHub';
import { streamingGuideMetadata } from '../../../lib/streaming-guide';

export const revalidate = 3600;
export const metadata = streamingGuideMetadata('ja');

export default function Page() {
  return <StreamingHub/>;
}
