import axios from "axios";
import { useEffect, useState } from "react";
import { _HOST } from "../urls";
import { UIButton, UIColor } from "./ui";

type SchedulerProps = {};

enum SchedulerState {
    Unknown,
    NotRunning,
    RequestingStart,
    Running,
    RequestingStop,
    Error,
}

export const Scheduler: React.FC<SchedulerProps> = (p) => {

    const [ss, setSS] = useState<SchedulerState>(SchedulerState.Unknown);

    useEffect(() => {
        checkRunning();
    }, []);

    async function checkRunning() {
        try {
            const res = await axios.get(`${_HOST}/info_scheduler`);
            if (res && res.data !== undefined) {
                setSS(res.data ? SchedulerState.Running : SchedulerState.NotRunning);
            }
        }
        catch {
            setSS(SchedulerState.Error);
        }
    }

    async function start() {
        setSS(SchedulerState.RequestingStart);
        try {
            await axios.get(`${_HOST}/stop_scheduler`);
            await sleep(3000);
            await axios.get(`${_HOST}/start_scheduler`);
            checkRunning();
        }
        catch {
            setSS(SchedulerState.Error);
        }
    }

    async function stop() {
        setSS(SchedulerState.RequestingStop);
        try {
            await axios.get(`${_HOST}/stop_scheduler`);
            checkRunning();
        }
        catch {
            setSS(SchedulerState.Error);
        }
    }

    return <div className="px-6 py-4 mt-8 bg-white">
        <div className="mb-2 text-base font-bold">Scheduler</div>
        {ss === SchedulerState.Unknown &&
            <div className="text-sm text-gray-400">
                Loading scheduler...
            </div>
        }
        {ss === SchedulerState.NotRunning &&
            <div className="">
                <div className="mb-3 text-sm">
                    The scheduler runs automatically every night. You do not need to start or stop the scheduler yourself. However, if you want to trigger a special run of the scheduler now, you can do so below. This will run all of the analyses marked as "scheduled", in order. It will not pull new ODK files, it will only run the analyses.
                </div>
                <UIButton
                    label="Start scheduler"
                    onClick={start}
                    color={UIColor.Green}
                />
            </div>
        }
        {ss === SchedulerState.RequestingStart &&
            <div className="text-sm text-gray-400">
                Starting scheduler...
            </div>
        }
        {ss === SchedulerState.Running &&
            <div className="">
                <div className="mb-3 text-sm">
                    The scheduler is running. To monitor progress, go to the "Analyses" tab and click "Refresh analyses" to see when analyses have been run.
                </div>
                <UIButton
                    label="Stop"
                    onClick={stop}
                    color={UIColor.Red}
                />
            </div>
        }
        {ss === SchedulerState.RequestingStop &&
            <div className="text-sm text-gray-400">
                Stopping scheduler...
            </div>
        }
        {ss === SchedulerState.Error &&
            <div className="">
                Something went wrong with the scheduler. Refresh your browser and try again.
            </div>
        }
    </div>;

};


function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}