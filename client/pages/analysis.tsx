import Head from "next/head";
import { NextPage } from "next";
import { _HOST } from "../urls";
import { LoginState, UseUser } from "../hooks/use_user";
import { useAnalysis } from "../hooks/use_analysis";
import { UserBoundary } from "../components/user_boundary";
import { UseAnalyses } from "../hooks/use_analyses";
import {
  RealTimeMessage,
  MessageType,
  StageResult,
  Status,
  Stage,
  AnalysisStatus,
  LogCode,
  LanguageType,
} from "../types";
import { useEffect, useRef, useState } from "react";
import { freshAnalysisStatus } from "../utils";
import { UseDataFiles } from "../hooks/use_data_files";
import { SettingsEditor } from "../components/settings_editor";
import dynamic from "next/dynamic";
import { AnalysisRunnerBox } from "../components/analysis_runner_box";
import { AnalysisInputs } from "../components/analysis_inputs";
import { AnalysisOutputs } from "../components/analysis_outputs";
import { AnalysisTopMenu } from "../components/analysis_top_menu";
import { AnalysisLog } from "../components/analysis_log";
import { UseTopics } from "../hooks/use_topics";
const AnalysisCodeEditor = dynamic(
  () => import("../components/analysis_code_editor"),
  {
    loading: () => <div className="ui-pad">Loading code editor...</div>,
    ssr: false,
  }
); // Needs to be a default export, and needs to have { ssr: false }

interface IndexProps {
  uu: UseUser;
  ua: UseAnalyses;
  ud: UseDataFiles;
  ut: UseTopics;
}

enum RightTab {
  Inputs,
  Outputs,
  Log,
}

const Index: NextPage<IndexProps> = (p) => {
  // Clean up when unmounted
  useEffect(() => {
    return () => {
      isAnalysingRef.current = false;
      stop();
    };
  }, []);

  const eventsRef = useRef<EventSource | undefined>(undefined);
  const logAsStaticArrayRef = useRef<{ text: string; code: LogCode }[]>([
    { text: "Not yet run", code: LogCode.StatusUpdate },
  ]);
  const isAnalysingRef = useRef<boolean>(false);

  const [logCount, setLogCount] = useState<number>(1);

  // The function that ticks over the log, when analyzing
  // This works by updating the logCount, which re-renders the log component. The log itself is a static ref (non-reactive)
  function updateLog() {
    window.setTimeout(() => {
      setLogCount(logAsStaticArrayRef.current.length);
      if (isAnalysingRef.current) {
        updateLog();
      }
    }, 500);
  }

  const uap = useAnalysis(p.ua.refreshAnalyses);

  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>(
    freshAnalysisStatus()
  );
  // const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>(() => {
  //     if (!uap.data.ready) {
  //         return freshAnalysisStatus();
  //     }
  //     const finalStatus = uap.data.analysisPackage.metadata.lastStatus === StageResult.Success
  //         ? Status.Success
  //         : (uap.data.analysisPackage.metadata.lastStatus === StageResult.Failure
  //             ? Status.Failed
  //             : Status.NotRun
  //         );

  //     return {
  //         analyzing: false,
  //         //
  //         [Stage.InitializeAnalysis]: StageResult.NA,
  //         [Stage.ImportInputFiles]: StageResult.NA,
  //         [Stage.CleanRun]: StageResult.NA,
  //         [Stage.OutputFiles]: StageResult.NA,
  //         //
  //         finalStatus,
  //     };
  // });
  const [rightTab, setRightTab] = useState<RightTab>(RightTab.Inputs);
  const [settingsEditorIsOpen, setSettingsEditorIsOpen] =
    useState<boolean>(false);

  const canEdit = p.uu.loginState === LoginState.LoggedIn && p.uu.user.canEdit;

  async function finishSettingsEditor(
    newName: string,
    newLanguage: LanguageType,
    newTopic: string,
    newTags: string[],
    newScheduled: boolean
  ) {
    uap.updateTempName(newName);
    uap.updateTempLanguage(newLanguage);
    uap.updateTempTopic(newTopic);
    uap.updateTempTags(newTags);
    uap.updateTempScheduled(newScheduled);
  }

  function analyze() {
    if (!uap.data.ready) {
      return;
    }

    const astatus = freshAnalysisStatus();
    astatus.analyzing = true;
    astatus[Stage.InitializeAnalysis] = StageResult.Pending;
    astatus.finalStatus = Status.Running;
    isAnalysingRef.current = true;
    setAnalysisStatus(astatus);
    logAsStaticArrayRef.current = [
      { text: "*** Queued analysis ***", code: LogCode.StatusUpdate },
    ];
    setLogCount(1);
    setRightTab(RightTab.Log);
    updateLog();

    eventsRef.current = new EventSource(
      `${_HOST}/run/${uap.data.analysisPackage.id}`,
      { withCredentials: true }
    );

    eventsRef.current.onmessage = function (ev) {
      const msgObj: RealTimeMessage = JSON.parse(ev.data);
      // console.log(msgObj);
      switch (msgObj.msgType) {
        case MessageType.Heartbeat:
          return;
        case MessageType.Stage:
          setAnalysisStatus((prev) => {
            const newStatus = { ...prev };
            newStatus[msgObj.stage] = msgObj.stageResult;
            return newStatus;
          });
          // Failures
          if (
            msgObj.stage === Stage.InitializeAnalysis &&
            msgObj.stageResult === StageResult.Failure
          ) {
            logAsStaticArrayRef.current.push({
              text: "*** Could not start analysis ***",
              code: LogCode.StatusUpdate,
            });
          }
          if (
            msgObj.stage === Stage.ImportInputFiles &&
            msgObj.stageResult === StageResult.Failure
          ) {
            logAsStaticArrayRef.current.push({
              text: "*** Could not find all input files ***",
              code: LogCode.StatusUpdate,
            });
          }
          if (
            msgObj.stage === Stage.CleanRun &&
            msgObj.stageResult === StageResult.Failure
          ) {
            logAsStaticArrayRef.current.push({
              text: "*** Could not finish script ***",
              code: LogCode.StatusUpdate,
            });
          }
          if (
            msgObj.stage === Stage.OutputFiles &&
            msgObj.stageResult === StageResult.Failure
          ) {
            logAsStaticArrayRef.current.push({
              text: "*** Could not find all output files ***",
              code: LogCode.StatusUpdate,
            });
          }
          // Successes (only mention script stuff, otherwise overwhelming)
          if (
            msgObj.stage === Stage.ImportInputFiles &&
            msgObj.stageResult === StageResult.Success
          ) {
            logAsStaticArrayRef.current.push({
              text: "*** Started script ***",
              code: LogCode.StatusUpdate,
            });
          }
          if (
            msgObj.stage === Stage.CleanRun &&
            msgObj.stageResult === StageResult.Success
          ) {
            logAsStaticArrayRef.current.push({
              text: "*** Finished script ***",
              code: LogCode.StatusUpdate,
            });
          }
          return;
        case MessageType.Waiting:
          logAsStaticArrayRef.current.push({
            text: msgObj.log,
            code: LogCode.Waiting,
          });
          return;
        case MessageType.LogOut:
          logAsStaticArrayRef.current.push({
            text: msgObj.log,
            code: LogCode.Out,
          });
          return;
        case MessageType.LogErr:
          logAsStaticArrayRef.current.push({
            text: msgObj.log,
            code: LogCode.Err,
          });
          return;
        case MessageType.EndFailure:
          if (
            eventsRef.current &&
            eventsRef.current.readyState !== eventsRef.current.CLOSED
          ) {
            logAsStaticArrayRef.current.push({
              text: "*** Closed analysis: FAILED ***",
              code: LogCode.StatusUpdate,
            });
            isAnalysingRef.current = false;
            setAnalysisStatus((prev) => {
              const newStatus = { ...prev };
              newStatus.finalStatus = Status.Failed;
              newStatus.analyzing = false;
              return newStatus;
            });
            eventsRef.current.close();
            p.ua.refreshAnalyses();
          }
          return;
        case MessageType.EndSuccess:
          if (
            eventsRef.current &&
            eventsRef.current.readyState !== eventsRef.current.CLOSED
          ) {
            logAsStaticArrayRef.current.push({
              text: "*** Closed analysis: SUCCESS ***",
              code: LogCode.StatusUpdate,
            });
            isAnalysingRef.current = false;
            setAnalysisStatus((prev) => {
              const newStatus = { ...prev };
              newStatus.finalStatus = Status.Success;
              newStatus.analyzing = false;
              return newStatus;
            });
            setRightTab(RightTab.Outputs);
            eventsRef.current.close();
            p.ua.refreshAnalyses();
          }
          return;
        default:
      }
    };

    eventsRef.current.onopen = function (ev) {
      // This means that analysis was launched from client
      // console.log("Open", ev);
    };

    eventsRef.current.onerror = function (ev) {
      // This means that analysis ended on server
      console.log("Error", ev);
      if (
        eventsRef.current &&
        eventsRef.current.readyState !== eventsRef.current.CLOSED
      ) {
        logAsStaticArrayRef.current.push({
          text: "*** Closed analysis prematurely because of connection error ***",
          code: LogCode.StatusUpdate,
        });
        isAnalysingRef.current = false;
        setAnalysisStatus((prev) => {
          const newStatus = { ...prev };
          newStatus.analyzing = false;
          return newStatus;
        });
        eventsRef.current.close();
        p.ua.refreshAnalyses();
      }
    };
  }

  function stop() {
    if (
      eventsRef.current &&
      eventsRef.current.readyState !== eventsRef.current.CLOSED
    ) {
      logAsStaticArrayRef.current.push({
        text: "*** Stopped by user ***",
        code: LogCode.StatusUpdate,
      });
      isAnalysingRef.current = false;
      setAnalysisStatus((prev) => {
        const newStatus = { ...prev };
        newStatus.analyzing = false;
        newStatus.finalStatus = Status.StoppedByUser;
        return newStatus;
      });
      eventsRef.current.close();
      p.ua.refreshAnalyses();
    }
  }

  return (
    <>
      <Head>
        <title>Analysis Portal</title>
        <link rel="stylesheet" type="text/css" href="/roboto.css" />
      </Head>

      <UserBoundary uu={p.uu}>
        <div className="flex flex-col w-full h-full">
          <div className="flex-none w-full">
            <AnalysisTopMenu
              uap={uap}
              openSettings={() => setSettingsEditorIsOpen(true)}
              canEdit={canEdit}
            />
          </div>

          {uap.data.loading ? (
            <div className="px-4 py-3 text-gray-400">Loading analysis...</div>
          ) : !uap.data.ready ? (
            <div className="px-4 py-3 text-red-500">{uap.data.err}</div>
          ) : (
            <div className="flex flex-1 w-full h-0">
              <div className="h-full" style={{ width: "60%" }}>
                <AnalysisCodeEditor
                  value={uap.tempCode}
                  onChange={uap.updateTempCode}
                  canEdit={canEdit}
                  isStata={uap.tempLanguage === LanguageType.Stata}
                />
              </div>

              <div className="flex flex-col flex-1 w-0 h-full border-l-2 border-gray-800">
                <div className="flex-none w-full border-b-2 border-gray-800">
                  <AnalysisRunnerBox
                    uap={uap}
                    analysisStatus={analysisStatus}
                    analyze={analyze}
                    stop={stop}
                  />
                </div>

                <div className="flex items-center flex-none w-full h-10 text-white bg-gray-200 select-none font-book">
                  <button
                    className={`flex-none h-full px-4 border-none text-sm leading-none ${
                      rightTab === RightTab.Inputs
                        ? "bg-gray-800"
                        : "ui-btn-blue"
                    }`}
                    onClick={() => setRightTab(RightTab.Inputs)}
                  >
                    Inputs
                  </button>
                  <button
                    className={`flex-none h-full px-4 border-none text-sm leading-none ${
                      rightTab === RightTab.Outputs
                        ? "bg-gray-800"
                        : "ui-btn-blue"
                    }`}
                    onClick={() => setRightTab(RightTab.Outputs)}
                  >
                    Outputs
                  </button>
                  <button
                    className={`flex-none h-full px-4 border-none text-sm leading-none ${
                      rightTab === RightTab.Log ? "bg-gray-800" : "ui-btn-blue"
                    }`}
                    onClick={() => setRightTab(RightTab.Log)}
                  >
                    Log
                  </button>
                </div>

                <div className="flex-1 w-full h-0">
                  {rightTab === RightTab.Inputs && (
                    <AnalysisInputs
                      uap={uap}
                      ua={p.ua}
                      ud={p.ud}
                      analysisId={uap.data.analysisPackage.id}
                      canEdit={canEdit}
                    />
                  )}
                  {rightTab === RightTab.Outputs && (
                    <AnalysisOutputs
                      uap={uap}
                      isAnalyzing={analysisStatus.analyzing}
                      canEdit={canEdit}
                    />
                  )}
                  <AnalysisLog
                    show={rightTab === RightTab.Log}
                    logCount={logCount}
                    logAsStaticArrayRef={logAsStaticArrayRef}
                  />
                </div>
              </div>
            </div>
          )}

          {settingsEditorIsOpen && (
            <SettingsEditor
              initialName={uap.tempName}
              initialLanguage={uap.tempLanguage}
              initialTopic={uap.tempTopic}
              initialTags={uap.tempTags}
              initialScheduled={uap.tempScheduled}
              save={finishSettingsEditor}
              cancel={() => setSettingsEditorIsOpen(false)}
              topics={p.ut.topics}
              isNewAnalysis={false}
              attemptDeleteAnalysis={uap.attemptDeleteAnalysis}
            />
          )}
        </div>
      </UserBoundary>
    </>
  );
};

export default Index;
