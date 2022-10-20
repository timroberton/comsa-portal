import path from "path";
import { useEffect, useRef, useState } from "react";
import { getAllDataFiles, getODKListFiles, getTopics } from "../actions/crud";
import { _ODK_FILE_LIST_FILENAME } from "../consts";
import { DataFile, Topic } from "../types";
import { LoginState } from "./use_user";

export type UseTopics = {
    topics: Topic[],
    topicMap: Record<string, string>,
    //
    refreshTopics: () => Promise<void>,
    // refreshDataFiles: () => Promise<void>,
};

export function useTopics(loginState: LoginState): UseTopics {

    const [topics, setTopics] = useState<Topic[]>([]);

    async function refreshTopics() {
        const newTopics = await getTopics();
        if (!newTopics) {
            return;
        }
        newTopics.sort((a, b) => a.label.toLowerCase() < b.label.toLowerCase() ? -1 : 1)
        setTopics(newTopics);
    }

    useEffect(() => {
        if (loginState !== LoginState.LoggedIn) {
            return;
        }
        refreshTopics();
    }, [loginState]);

    return {
        topics,
        topicMap: topics.reduce<Record<string, string>>((tm, obj) => {
            tm[obj.id] = obj.label;
            return tm;
        }, {}),
        refreshTopics,
    };

}