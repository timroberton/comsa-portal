import { useState } from "react";
import { addOrRemove } from "../utils";

export type UseUI = {
    selectedTags: string[],
    selectedTopic: string,
    toggleTag: (id: string) => void,
    toggleTopic: (id: string) => void,
    clearAllTags: () => void,
    //
    searchText: string,
    updateSearchText: (v: string) => void,
    clearSearchText: () => void,
    //
    searchTextData: string,
    updateSearchTextData: (v: string) => void,
    clearSearchTextData: () => void,
    selectedFileType: string,
    toggleFileType: (v: string) => void,
    //
    filterPropertyAnalyses: FilterPropertyAnalyses,
    updateFilterPropertyAnalyses: (v: FilterPropertyAnalyses) => void,
    filterPropertyData: FilterPropertyData,
    updateFilterPropertyData: (v: FilterPropertyData) => void,
}

export enum FilterPropertyAnalyses {
    Name,
    Topic,
    Tags,
    LastModified,
    Scheduled,
    LastRun,
}

export enum FilterPropertyData {
    Name,
    FileType,
    LastModified,
    Size,
}

export function useUI() {

    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>("");
    const [searchText, setSearchText] = useState<string>("");
    const [searchTextData, setSearchTextData] = useState<string>("");
    const [selectedFileType, setSelectedFileType] = useState<string>("");
    const [filterPropertyAnalyses, setFilterPropertyAnalyses] = useState<FilterPropertyAnalyses>(FilterPropertyAnalyses.Name);
    const [filterPropertyData, setFilterPropertyData] = useState<FilterPropertyData>(FilterPropertyData.Name);

    function toggleTag(tag: string): void {
        setSelectedTags(prev => {
            const n = [...prev];
            addOrRemove(n, tag);
            return n;
        });
    }

    function toggleTopic(topic: string): void {
        setSelectedTopic(prev => {
            if (prev === topic) {
                return "";
            }
            return topic;
        });
    }

    function clearAllTags() {
        setSelectedTags([]);
    }

    function updateSearchText(v: string): void {
        setSearchText(v);
    }

    function clearSearchText() {
        setSearchText("");
    }

    function updateSearchTextData(v: string): void {
        setSearchTextData(v);
    }

    function clearSearchTextData() {
        setSearchTextData("");
    }

    function toggleFileType(fileType: string): void {
        setSelectedFileType(prev => {
            if (prev === fileType) {
                return "";
            }
            return fileType;
        });
    }

    function updateFilterPropertyAnalyses(v: FilterPropertyAnalyses): void {
        setFilterPropertyAnalyses(v);
    }

    function updateFilterPropertyData(v: FilterPropertyData): void {
        setFilterPropertyData(v);
    }

    return {
        selectedTags,
        selectedTopic,
        toggleTag,
        toggleTopic,
        clearAllTags,
        //
        searchText,
        updateSearchText,
        clearSearchText,
        //
        // DATA
        //
        searchTextData,
        updateSearchTextData,
        clearSearchTextData,
        selectedFileType,
        toggleFileType,
        //
        filterPropertyAnalyses,
        updateFilterPropertyAnalyses,
        filterPropertyData,
        updateFilterPropertyData,
    };

}