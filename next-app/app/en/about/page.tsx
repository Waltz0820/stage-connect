import { AboutPage, aboutMetadata } from "../../../components/AboutPage";
export const revalidate = 3600;
export const metadata = aboutMetadata("en");
export default function Page() { return <AboutPage locale="en" />; }
