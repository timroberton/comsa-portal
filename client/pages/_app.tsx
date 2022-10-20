import { useDataFiles } from "../hooks/use_data_files";
import { useAnalyses } from "../hooks/use_analyses";
import { useUser } from "../hooks/use_user";
import "../styles/tailwind.css";
import { useUI } from "../hooks/use_ui";
import { useTopics } from "../hooks/use_topics";

function MyApp({ Component, pageProps }: { Component: React.FC, pageProps: any }) {

    const uu = useUser();
    const ua = useAnalyses(uu.loginState);
    const ud = useDataFiles(uu.loginState);
    const ut = useTopics(uu.loginState);
    const uui = useUI();

    return <Component {...pageProps} uu={uu} ua={ua} ud={ud} ut={ut} uui={uui} />;

}

export default MyApp;