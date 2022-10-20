use super::*;

pub async fn run_stata(
    temp_path: &std::path::PathBuf,
    sender: &Sender<RealTimeMessage>,
) -> Option<()> {
    // Stata commandline info: https://www.stata.com/support/faqs/mac/advanced-topics/#startup

    let log_path = temp_path.join(_FILE_NAME_STATALOG);
    write(&log_path, "".to_string()).ok()?;
    let mut linemux_logfile_tailer = MuxedLines::new().ok()?;
    linemux_logfile_tailer.add_file(&log_path).await.ok()?;

    let program_cmd = if cfg!(debug_assertions) {
        "/Applications/Stata/StataSE.app/Contents/MacOS/stataSE"
    } else {
        "/usr/local/stata16/stata-se"
    };

    let mut child = rocket::tokio::process::Command::new(program_cmd)
        .args(&["-e", "-q", "do", _FILE_NAME_MYSCRIPT])
        .current_dir(&temp_path)
        .kill_on_drop(true)
        .spawn()
        .expect("failed to spawn command");

    let (heatbeat_sender, mut heatbeat_receiver) = tokio::sync::mpsc::channel::<u8>(600);

    let join_handle = rocket::tokio::spawn(async move {
        let exit_status = child
            .wait()
            .await
            .expect("child process encountered an error");

        exit_status
    });

    rocket::tokio::spawn(async move {
        loop {
            match heatbeat_sender.send(1).await {
                Ok(_) => {}
                Err(_) => {
                    return;
                }
            }
            sleep(Duration::from_millis(2000)).await;
        }
    });

    loop {
        tokio::select! {
            msg = linemux_logfile_tailer.next_line() => {
                match msg.unwrap() {
                    Some(line) => {
                        let txt = line.line();
                        match send_log_out(txt.to_string(), sender) {
                            Ok(()) => {}
                            Err(_) =>  join_handle.abort(),
                        };
                        if txt == "end of do-file" {
                            break;
                        }
                    },
                    None => break,
                };
            },
            _ = heatbeat_receiver.recv() => {
                match send_heartbeat(sender) {
                    Ok(()) => {}
                    Err(_) =>  {
                        join_handle.abort();
                        break;
                    }
                };
            }
        }
    }

    let exit_status = join_handle.await.ok()?;

    let log_output_str = read_to_string(log_path).unwrap();
    let index_of_endofdofile = log_output_str.find("end of do-file")?;
    let clean_endofdofile = (log_output_str.len() - index_of_endofdofile) == 15;

    if !exit_status.success() || !clean_endofdofile {
        return None;
    }

    Some(())
}

fn send_log_out(
    log: String,
    sender: &Sender<RealTimeMessage>,
) -> Result<(), tokio::sync::mpsc::error::TrySendError<RealTimeMessage>> {
    let rtm = RealTimeMessage {
        msg_type: MessageType::LogOut,
        stage: None,
        stage_result: None,
        log: Some(log),
    };
    sender.try_send(rtm)
}

fn send_heartbeat(
    sender: &Sender<RealTimeMessage>,
) -> Result<(), tokio::sync::mpsc::error::TrySendError<RealTimeMessage>> {
    let rtm = RealTimeMessage {
        msg_type: MessageType::Heartbeat,
        stage: None,
        stage_result: None,
        log: None,
    };
    sender.try_send(rtm)
}
