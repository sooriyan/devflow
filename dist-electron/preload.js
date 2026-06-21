let electron = require("electron");
//#region electron/preload.ts
electron.contextBridge.exposeInMainWorld("electronAPI", {
	saveWorkflow: (name, data) => electron.ipcRenderer.invoke("save-workflow", name, data),
	loadWorkflow: (name) => electron.ipcRenderer.invoke("load-workflow", name),
	listWorkflows: () => electron.ipcRenderer.invoke("list-workflows"),
	deleteWorkflow: (name) => electron.ipcRenderer.invoke("delete-workflow", name),
	runWorkflow: (workflow) => electron.ipcRenderer.invoke("run-workflow", workflow),
	stopWorkflow: () => electron.ipcRenderer.invoke("stop-workflow"),
	onWorkflowLog: (callback) => {
		const subscription = (_event, log) => callback(log);
		electron.ipcRenderer.on("workflow-log", subscription);
		return () => {
			electron.ipcRenderer.removeListener("workflow-log", subscription);
		};
	},
	onWorkflowStatus: (callback) => {
		const subscription = (_event, status) => callback(status);
		electron.ipcRenderer.on("workflow-status", subscription);
		return () => {
			electron.ipcRenderer.removeListener("workflow-status", subscription);
		};
	},
	saveCredentials: (credentials) => electron.ipcRenderer.invoke("save-credentials", credentials),
	getCredentials: () => electron.ipcRenderer.invoke("get-credentials")
});
//#endregion
