export type LoginReturn = {
    user: User,
};

export type User = {
    name: string,
    email: string,
    isAdmin: boolean,
    canEdit: boolean,
};

export type NewUserRequest = {
    email: string,
    password: string,
    name: string,
    isAdmin: boolean,
    canEdit: boolean,
};

export type DeleteUserRequest = {
    email: string,
};

export type NewAnalysis = {
    name: string,
    language: LanguageType,
    topic: string,
    tags: string[],
    scheduled: boolean,
};

export type AnalysisSummary = {
    id: string,
    metadata: AnalysisMetaData,
    order: number,
};

type AnalysisMetaData = {
    name: string,
    language: LanguageType,
    inputs: InputFile[],
    outputs: OutputFile[],
    topic: string,
    tags: string[],
    createdAt: string,
    createdBy: string,
    lastRunAt: string,
    lastRunBy: string,
    lastModifiedAt: string,
    lastModifiedBy: string,
    scheduled: boolean,
    lastStatus: StageResult,
};

export type InputFile = {
    folderType: FolderType,
    analysisId: string,
    fileName: string,
};

export type OutputFile = {
    fileName: string,
    public: boolean,
};

export type DataFile = {
    fileName: string,
    date: string,
    size: number,
    isODKFile?: boolean,
};

export type Topic = {
    id: string,
    label: string,
};

////////////////////////////////////


export enum Status {
    NotRun = "NotRun",
    Running = "Running",
    Failed = "Failed",
    Success = "Success",
    StoppedByUser = "StoppedByUser",
}

export type AnalysisStatus = {
    analyzing: boolean,
    //
    [Stage.InitializeAnalysis]: StageResult,
    [Stage.ImportInputFiles]: StageResult,
    [Stage.CleanRun]: StageResult,
    [Stage.OutputFiles]: StageResult,
    //
    finalStatus: Status,
};

////////////////////////////////////

export type AnalysisPackage = {
    id: string,
    code: string,
    metadata: AnalysisMetaData,
};

export enum FolderType {
    ANALYSIS = "analysis",
    DATA = "data",
}

export enum LanguageType {
    R = "r",
    Stata = "stata",
}

export type CheckFileResponse = {
    exists: boolean,
    date: string,
    size: number,
    public: boolean,
};

////////////////////////////////////

export type RealTimeMessage = RTMWaiting | RTMLog | RTMHeartbeat | RTMStage | RTMEnd;

export type RTMStage = {
    msgType: MessageType.Stage,
    stage: Stage,
    stageResult: StageResult,
};

export type RTMWaiting = {
    msgType: MessageType.Waiting,
    log: string,
};

export type RTMLog = {
    msgType: MessageType.LogErr | MessageType.LogOut,
    log: string,
};

export type RTMHeartbeat = {
    msgType: MessageType.Heartbeat,
};

export type RTMEnd = {
    msgType: MessageType.EndSuccess | MessageType.EndFailure,
};


export enum MessageType {
    Heartbeat = "Heartbeat",
    Waiting = "Waiting",
    Stage = "Stage",
    LogOut = "LogOut",
    LogErr = "LogErr",
    EndSuccess = "EndSuccess",
    EndFailure = "EndFailure",
}

export enum Stage {
    InitializeAnalysis = "InitializeAnalysis",
    ImportInputFiles = "ImportInputFiles",
    CleanRun = "CleanRun",
    OutputFiles = "OutputFiles",
}

export enum StageResult {
    NA = "NA",
    Pending = "Pending",
    Success = "Success",
    Failure = "Failure",
}

export enum LogCode {
    StatusUpdate,
    Out,
    Err,
    Waiting,
}