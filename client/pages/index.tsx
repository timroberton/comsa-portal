import Head from "next/head";
import Link from "next/link";
import { NextPage } from "next";
import { UseAnalyses } from "../hooks/use_analyses";
import { Frame1 } from "../components/frame_1";
import { LoginState, UseUser } from "../hooks/use_user";
import { _HOST } from "../urls";
import { ArrowDownIcon, PlusIcon, RefreshIcon } from "@heroicons/react/outline";
import { FilterPropertyAnalyses, UseUI } from "../hooks/use_ui";
import { useEffect, useMemo, useState } from "react";
import { SettingsEditor } from "../components/settings_editor";
import { FilterControlsAnalyses } from "../components/filter_controls_analyses";
import { LanguageType, StageResult, Status, Topic } from "../types";
import { UIColor } from "../components/ui";
import { Frame2 } from "../components/frame_2";
import { UseTopics } from "../hooks/use_topics";
import { TopicEditor } from "../components/topic_editor";

interface IndexProps {
  uu: UseUser;
  ua: UseAnalyses;
  ut: UseTopics;
  uui: UseUI;
}

const Index: NextPage<IndexProps> = (p) => {
  const canEdit = p.uu.loginState === LoginState.LoggedIn && p.uu.user.canEdit;

  const [settingsEditorIsOpen, setSettingsEditorIsOpen] =
    useState<boolean>(false);

  async function finishSettingsEditor(
    newName: string,
    newLanguage: LanguageType,
    newTopic: string,
    newTags: string[],
    newScheduled: boolean
  ) {
    await p.ua.createNewAnalysis(
      newName,
      newLanguage,
      newTopic,
      newTags,
      newScheduled
    );
  }

  // useEffect(() => {
  // 	p.ua.refreshAnalyses();
  // }, []);

  const filteredAnalyses = useMemo(() => {
    return p.ua.analyses
      .filter((a) => {
        return (
          p.uui.searchText.trim() === "" ||
          a.metadata.name
            .toLowerCase()
            .includes(p.uui.searchText.trim().toLowerCase())
        );
      })
      .filter((a) => {
        return (
          p.uui.selectedTopic === "" || a.metadata.topic === p.uui.selectedTopic
        );
      })
      .filter((a) => {
        return (
          p.uui.selectedTags.length === 0 ||
          a.metadata.tags.some((tag) => p.uui.selectedTags.includes(tag))
        );
      });
  }, [
    p.ua.analyses,
    p.uui.selectedTags,
    p.uui.selectedTopic,
    p.uui.searchText,
  ]);

  const sortedAnalyses = useMemo(() => {
    const sa = [...filteredAnalyses];
    switch (p.uui.filterPropertyAnalyses) {
      case FilterPropertyAnalyses.Name:
        sa.sort((a, b) =>
          a.metadata.name.toLowerCase() > b.metadata.name.toLowerCase() ? 1 : -1
        );
        break;
      case FilterPropertyAnalyses.Topic:
        sa.sort((a, b) => {
          const at = p.ut.topicMap[a.metadata.topic];
          const bt = p.ut.topicMap[b.metadata.topic];
          return (at ? at.toLowerCase() : "zzzzzz") >
            (bt ? bt.toLowerCase() : "zzzzzz")
            ? 1
            : -1;
        });
        break;
      case FilterPropertyAnalyses.Tags:
        sa.sort((a, b) => {
          const at = [
            a.metadata.language === LanguageType.R ? "R" : "Stata",
            ...a.metadata.tags,
          ].join(", ");
          const bt = [
            b.metadata.language === LanguageType.R ? "R" : "Stata",
            ...b.metadata.tags,
          ].join(", ");
          return at.toLowerCase() > bt.toLowerCase() ? -1 : 1;
        });
        break;
      case FilterPropertyAnalyses.LastModified:
        sa.sort((a, b) =>
          a.metadata.lastModifiedAt < b.metadata.lastModifiedAt ? 1 : -1
        );
        break;
      case FilterPropertyAnalyses.Scheduled:
        sa.sort(
          (a, b) =>
            (a.order === 0 ? 999999 : a.order) -
            (b.order === 0 ? 999999 : b.order)
        );
        break;
      case FilterPropertyAnalyses.LastRun:
        sa.sort((a, b) =>
          a.metadata.lastRunAt < b.metadata.lastRunAt ? 1 : -1
        );
        break;
      default:
    }
    return sa;
  }, [filteredAnalyses, p.uui.filterPropertyAnalyses, p.ut.topicMap]);

  return (
    <>
      <Head>
        <title>Analysis Portal</title>
        <link rel="stylesheet" type="text/css" href="/roboto.css" />
      </Head>

      <Frame1
        uu={p.uu}
        page="analyses"
        title="Analyses"
        buttons={
          canEdit
            ? [
                {
                  label: "Refresh analyses",
                  onClick: p.ua.refreshAnalyses,
                  icon: RefreshIcon,
                  color: UIColor.LightGray,
                },
                {
                  label: "New analysis",
                  onClick: () => setSettingsEditorIsOpen(true),
                  icon: PlusIcon,
                },
              ]
            : [
                {
                  label: "Refresh analyses",
                  onClick: p.ua.refreshAnalyses,
                  icon: RefreshIcon,
                  color: UIColor.LightGray,
                },
              ]
        }
      >
        {p.ua.loading ? (
          <div className="">Loading...</div>
        ) : (
          <Frame2
            filterControls={
              <FilterControlsAnalyses
                canEdit={canEdit}
                ua={p.ua}
                uui={p.uui}
                ut={p.ut}
                nTotal={p.ua.analyses.length}
                nFiltered={sortedAnalyses.length}
              />
            }
          >
            {sortedAnalyses.length === 0 ? (
              <div className="py-2 text-sm leading-5 text-gray-400">
                No matching analyses
              </div>
            ) : (
              <>
                <li className="grid grid-cols-12 gap-2 py-2 text-sm font-bold leading-5">
                  <div
                    className="col-span-4 truncate cursor-pointer hover:underline"
                    onClick={() =>
                      p.uui.updateFilterPropertyAnalyses(
                        FilterPropertyAnalyses.Name
                      )
                    }
                  >
                    Analysis
                    {p.uui.filterPropertyAnalyses ===
                      FilterPropertyAnalyses.Name && (
                      <ArrowDownIcon className="inline-block w-3 h-3 ml-1" />
                    )}
                  </div>
                  <div
                    className="col-span-2 truncate cursor-pointer hover:underline"
                    onClick={() =>
                      p.uui.updateFilterPropertyAnalyses(
                        FilterPropertyAnalyses.Topic
                      )
                    }
                  >
                    Topic
                    {p.uui.filterPropertyAnalyses ===
                      FilterPropertyAnalyses.Topic && (
                      <ArrowDownIcon className="inline-block w-3 h-3 ml-1" />
                    )}
                  </div>
                  <div
                    className="col-span-1 truncate cursor-pointer hover:underline"
                    onClick={() =>
                      p.uui.updateFilterPropertyAnalyses(
                        FilterPropertyAnalyses.Tags
                      )
                    }
                  >
                    Tags
                    {p.uui.filterPropertyAnalyses ===
                      FilterPropertyAnalyses.Tags && (
                      <ArrowDownIcon className="inline-block w-3 h-3 ml-1" />
                    )}
                  </div>
                  <div
                    className="col-span-2 truncate cursor-pointer hover:underline"
                    onClick={() =>
                      p.uui.updateFilterPropertyAnalyses(
                        FilterPropertyAnalyses.LastModified
                      )
                    }
                  >
                    Last modified
                    {p.uui.filterPropertyAnalyses ===
                      FilterPropertyAnalyses.LastModified && (
                      <ArrowDownIcon className="inline-block w-3 h-3 ml-1" />
                    )}
                  </div>
                  <div
                    className="flex items-center col-span-1 cursor-pointer hover:underline"
                    onClick={() =>
                      p.uui.updateFilterPropertyAnalyses(
                        FilterPropertyAnalyses.Scheduled
                      )
                    }
                  >
                    <span className="flex-shrink inline-block truncate">
                      Scheduled
                    </span>
                    {p.uui.filterPropertyAnalyses ===
                      FilterPropertyAnalyses.Scheduled && (
                      <ArrowDownIcon className="inline-block w-3 h-3 ml-1" />
                    )}
                  </div>
                  <div
                    className="col-span-2 truncate cursor-pointer hover:underline"
                    onClick={() =>
                      p.uui.updateFilterPropertyAnalyses(
                        FilterPropertyAnalyses.LastRun
                      )
                    }
                  >
                    Last run
                    {p.uui.filterPropertyAnalyses ===
                      FilterPropertyAnalyses.LastRun && (
                      <ArrowDownIcon className="inline-block w-3 h-3 ml-1" />
                    )}
                  </div>
                </li>
                {sortedAnalyses.map((a, i) => {
                  return (
                    <li
                      key={a.id}
                      className={
                        "border-t border-gray-200 py-2 grid grid-cols-12 gap-2 text-sm leading-5 select-text"
                      }
                    >
                      <div className="col-span-4 leading-4">
                        <Link key={a.id} href={`/analysis/?id=${a.id}`}>
                          <a className="ui-link">{a.metadata.name}</a>
                        </Link>
                      </div>
                      <div className="col-span-2 text-xs">
                        {p.ut.topicMap[a.metadata.topic] || (
                          <span className="text-gray-400">No topic</span>
                        )}
                      </div>
                      <div className="col-span-1 text-xs">
                        {[
                          a.metadata.language === LanguageType.R
                            ? "R"
                            : "Stata",
                          ...a.metadata.tags,
                        ].join(", ")}
                      </div>
                      <div className="col-span-2 text-xs">
                        <div className="truncate">
                          {new Date(a.metadata.lastModifiedAt).toLocaleString()}
                        </div>
                        <div className="truncate">
                          {a.metadata.lastModifiedBy}
                        </div>
                      </div>
                      <div className="col-span-1 text-xs">
                        {a.metadata.scheduled ? (
                          `Yes (${a.order == 0 ? "!!" : a.order})`
                        ) : (
                          <span className="text-gray-400">No</span>
                        )}
                      </div>
                      <div className="col-span-2 text-xs">
                        <div className="flex w-full gap-x-2">
                          <div className="flex-none">
                            {iconForStageResult(a.metadata.lastStatus)}
                          </div>
                          <div className="flex-1 w-0">
                            <div className="w-full truncate">
                              {new Date(a.metadata.lastRunAt).toLocaleString()}
                            </div>
                            <div className="w-full truncate">
                              {a.metadata.lastRunBy}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </>
            )}
          </Frame2>
        )}

        {settingsEditorIsOpen && (
          <SettingsEditor
            initialName={""}
            initialLanguage={LanguageType.Stata}
            initialTopic={""}
            initialTags={[]}
            initialScheduled={false}
            save={finishSettingsEditor}
            topics={p.ut.topics}
            cancel={() => setSettingsEditorIsOpen(false)}
            isNewAnalysis={true}
          />
        )}
      </Frame1>
    </>
  );
};

export default Index;

function iconForStageResult(sr: StageResult): JSX.Element {
  switch (sr) {
    case StageResult.Pending:
      return (
        <svg
          className="flex-shrink-0 w-5 h-5 text-orange-500"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16z"
            clipRule="evenodd"
          />
        </svg>
      );
    case StageResult.Success:
      return (
        <svg
          className="flex-shrink-0 w-5 h-5 text-green-500"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      );
    case StageResult.Failure:
      return (
        <svg
          className="flex-shrink-0 w-5 h-5 text-red-500"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      );
  }
  return (
    <svg
      className="flex-shrink-0 w-5 h-5 text-gray-300"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16z"
        clipRule="evenodd"
      />
    </svg>
  );
}
