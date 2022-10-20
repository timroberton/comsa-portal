use super::*;

pub async fn run_r(temp_path: &std::path::PathBuf, sender: &Sender<RealTimeMessage>) -> Option<()> {
    // THE FOLLOWING CODE IS INSPIRED BY THIS... https://docs.rs/tokio/1.11.0/tokio/process/index.html
    let mut child = rocket::tokio::process::Command::new("Rscript")
        .args(&[_FILE_NAME_MYSCRIPT])
        .current_dir(&temp_path)
        .stdout(std::process::Stdio::piped()) // NOTE!!! We use stderr for "within" docker, stdout for "outside" docker
        .stderr(std::process::Stdio::piped()) // NOTE!!! We use stderr for "within" docker, stdout for "outside" docker
        .kill_on_drop(true)
        .spawn()
        .expect("failed to spawn command");

    let stdout = child
        .stdout
        .take()
        .expect("child did not have a handle to stdout");

    let stderr = child
        .stderr
        .take()
        .expect("child did not have a handle to stderr");

    let mut reader_stdout = tokio::io::BufReader::new(stdout).lines();
    let mut reader_stderr = tokio::io::BufReader::new(stderr).lines();

    // Ensure the child process is spawned in the runtime so it can
    // make progress on its own while we await for any output.
    let join_handle = rocket::tokio::spawn(async move {
        let exit_status = child
            .wait()
            .await
            .expect("child process encountered an error");

        exit_status
    });

    let (heatbeat_sender, mut heatbeat_receiver) = tokio::sync::mpsc::channel::<u8>(600);

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
            msg = reader_stdout.next_line() => {
                match msg.unwrap() {
                    Some(line) => {
                        match send_log_out(line, sender) {
                            Ok(()) => {}
                            Err(_) =>  join_handle.abort(),
                        };
                    },
                    None => break,
                };
            },
            msg = reader_stderr.next_line() => {
                match msg.unwrap() {
                    Some(line) => {
                        match send_log_err(line, sender) {
                            Ok(()) => {}
                            Err(_) =>  join_handle.abort(),
                        };
                    },
                    None => break,
                };
            },
            _ = heatbeat_receiver.recv() => {
                match send_heartbeat(sender) {
                    Ok(()) => {}
                    Err(_) =>  join_handle.abort(),
                };
            }
        }
    }

    let exit_status = join_handle.await.ok()?;

    if !exit_status.success() {
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

fn send_log_err(
    log: String,
    sender: &Sender<RealTimeMessage>,
) -> Result<(), tokio::sync::mpsc::error::TrySendError<RealTimeMessage>> {
    let rtm = RealTimeMessage {
        msg_type: MessageType::LogErr,
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
