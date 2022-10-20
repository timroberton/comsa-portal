import { useEffect, useState } from "react";
import { createAnalysis, getAllAnalyses } from "../actions/crud";
import { AnalysisSummary, LanguageType, NewAnalysis } from "../types";
import { LoginState } from "./use_user";

export type UseAnalyses = {
    analyses: AnalysisSummary[],
    tags: string[],
    loading: boolean,
    err: string,
    //
    refreshAnalyses: () => Promise<void>,
    createNewAnalysis: (name: string, language: LanguageType, topic: string, tags: string[], scheduled: boolean) => Promise<void>,
};

export function useAnalyses(loginState: LoginState): UseAnalyses {

    const [analyses, setAnalyses] = useState<AnalysisSummary[]>([]);
    const [topics, setTopics] = useState<string[]>([]);
    const [tags, setTags] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [err, setErr] = useState<string>("");

    async function refreshAnalyses() {
        setLoading(true);
        setErr("");
        const analyses = await getAllAnalyses();
        if (!analyses) {
            setErr("Could not reach server");
            setLoading(false);
            return;
        }
        updateAnalyses(analyses);
        setLoading(false);
    }

    async function createNewAnalysis(name: string, language: LanguageType, topic: string, tags: string[], scheduled: boolean) {
        setLoading(true);
        const na: NewAnalysis = { name, language, topic, tags, scheduled };
        const newAnalyses = await createAnalysis(na);
        if (!newAnalyses) {
            alert("Could not create");
            return;
        }
        setLoading(false);
        updateAnalyses(newAnalyses);
    }

    function updateAnalyses(newAnalyses: AnalysisSummary[]): void {
        newAnalyses.sort((a, b) => a.metadata.name.toLowerCase() < b.metadata.name.toLowerCase() ? -1 : 1);
        let newTags: string[] = [];
        let newTopics: string[] = [];
        newAnalyses.forEach(a => {
            a.metadata.tags.forEach(t => {
                if (!newTags.includes(t)) {
                    newTags.push(t);
                }
            });
            if (a.metadata.topic && !newTopics.includes(a.metadata.topic)) {
                newTopics.push(a.metadata.topic);
            }
        });
        newTags.sort((a, b) => a.toLowerCase() < b.toLowerCase() ? -1 : 1);
        newTopics.sort((a, b) => a.toLowerCase() < b.toLowerCase() ? -1 : 1);
        setAnalyses(newAnalyses);
        setTags(newTags);
        setTopics(newTopics);
    }

    useEffect(() => {
        if (loginState !== LoginState.LoggedIn) {
            return;
        }
        refreshAnalyses();
    }, [loginState]);

    return {
        analyses,
        // topics,
        tags,
        loading,
        err,
        //
        refreshAnalyses,
        createNewAnalysis,
    };

}