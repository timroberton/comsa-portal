import { Stage, StageResult, Status } from "./types";

export function copy<T>(thing: T): T {
    return JSON.parse(JSON.stringify(thing));
}

export function humanFileSize(bytes: number): string {
    const thresh = 1000;
    const dp = 1;

    if (Math.abs(bytes) < thresh) {
        return bytes + ' B';
    }

    const units = ['KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    let u = -1;
    const r = 10 ** dp;

    do {
        bytes /= thresh;
        ++u;
    } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);

    return bytes.toFixed(dp) + ' ' + units[u];
}

export function freshAnalysisStatus() {
    return {
        analyzing: false,
        //
        [Stage.InitializeAnalysis]: StageResult.NA,
        [Stage.ImportInputFiles]: StageResult.NA,
        [Stage.CleanRun]: StageResult.NA,
        [Stage.OutputFiles]: StageResult.NA,
        //
        finalStatus: Status.NotRun,
    };
}

export function addOrRemove<T>(arr: T[], val: T): void {
    if (!arr.includes(val)) {
        arr.push(val);
        return;
    }
    let index = arr.indexOf(val);
    while (index >= 0) {
        arr.splice(index, 1);
        index = arr.indexOf(val);
    }
}
export function sum(arr: number[]): number {
    return arr.reduce((prev: number, v) => prev + v, 0);
}

export function avg(arr: number[]): number {
    if (arr.length === 0) {
        throw new Error("Array has no items");
    }
    return sum(arr) / arr.length;
}

export function avgOrZero(arr: number[]): number {
    if (arr.length === 0) {
        return 0;
    }
    return sum(arr) / arr.length;
}

export function sumWith<T>(arr: T[], func: (v: T) => number): number {
    return arr.reduce((prev: number, v: T) => prev + func(v), 0);
}


export function selectElementContents(el: HTMLElement) {
    var body = document.body, range;
    if (document.createRange && window.getSelection) {
        range = document.createRange();
        const sel = window.getSelection();
        if (sel) {
            sel.removeAllRanges();
        }
        try {
            range.selectNodeContents(el);
            if (sel) {
                sel.addRange(range);
            }
        } catch (e) {
            range.selectNode(el);
            if (sel) {
                sel.addRange(range);
            }
        }
        document.execCommand("copy");
        if (sel) {
            sel.removeAllRanges();
        }

        //@ts-ignore
    } else if (body.createTextRange) {
        //@ts-ignore
        range = body.createTextRange();
        range.moveToElementText(el);
        range.select();
        range.execCommand("Copy");
    }
    console.log("Copied");
}