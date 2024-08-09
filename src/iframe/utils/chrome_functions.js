export async function executeScript(tabID, func, args) {
   chrome.scripting.executeScript({
      target: { tabId: tabID },
      func: func,
      args: args
   })
}

export async function sendMessageToTabs(task_name, data = "") {
   const [tab] = await chrome.tabs.query({ active: true, currentWindow: true});
   return await chrome.tabs.sendMessage(tab.id, {task: task_name, data: data});
}

export async function sendMessageToBG(task_name, data){
   return await chrome.runtime.sendMessage({ task: task_name, data: data})
}

export const wrapAsyncFunction = (listener) => (request, sender, sendResponse) => {
   // the listener(...) might return a non-promise result (not an async function), so we wrap it with Promise.resolve()
   Promise.resolve(listener(request, sender)).then(sendResponse);
   return true; // return true to indicate you want to send a response asynchronously
};