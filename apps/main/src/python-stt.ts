import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import path from "path";

let pythonProc: ChildProcessWithoutNullStreams | null = null;

export function startPythonSTT() {
  if (pythonProc) {
    console.log("[python] already running");
    return pythonProc;
  }

  const script = path.join(__dirname, "../../stt-server/stt_server.py");
  pythonProc = spawn("python3", [script], {
    cwd: path.join(__dirname, "../../stt-server"),
  });

  pythonProc.stdout.on("data", (d) => console.log("[python]", d.toString()));
  pythonProc.stderr.on("data", (d) => console.error("[python err]", d.toString()));

  pythonProc.on("close", (code) => {
    console.log(`[python] exited with code ${code}`);
    pythonProc = null;
  });

  return pythonProc;
}

export function stopPythonSTT() {
  if (pythonProc) {
    console.log("[python] killing...");
    pythonProc.kill("SIGTERM");
    pythonProc = null;
  }
}
