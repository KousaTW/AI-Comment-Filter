import { modelGenerate, convertListToXML, convertJSONToData } from "./utils/LLM.js"
import { wrapAsyncFunction } from "./utils/chrome_functions.js"

// fore-ground
import GUI_init from './utils/GUI.js'
import { Category } from './utils/GUI.js'

// back-ground
const openSettingBtn = document.getElementById("open-setting-button");
const setting = document.getElementById("setting");
const api_key_input = document.getElementById("api-key-input");
const model_name_input = document.getElementById("model-name-input");


// setting
let isSettingOpen = false;
openSettingBtn.addEventListener("click", () => {
    let display = isSettingOpen ? "none" : "flex";
    isSettingOpen = !isSettingOpen;
    setting.style.display = display;
    openSettingBtn.classList.toggle("open");
})
api_key_input.addEventListener("input", (e) => {
    const { value } = e.currentTarget;
    chrome.storage.sync.set({ api_key: value });
})
model_name_input.addEventListener("input", (e) => {
    const { value } = e.currentTarget;
    chrome.storage.sync.set({ model_name: value });
})


chrome.runtime.onMessage.addListener(
    wrapAsyncFunction(async (request, sender) => {
        if (request.task === "generate_comment") {
            // const data = [{"Comment_ID": "1", "Comment": "殺了他"}, {"Comment_ID": "2", "Comment": "我的天啊"}, {"Comment_ID": "3", "Comment": "大奶主播"}, {"Comment_ID": "4", "Comment": "主角會死"}]
            const data = request.data;
            const input_prompt = convertListToXML(data, "Comments_List", "Comments");
            const _api_key = api_key_input.value;
            const _model_name = model_name_input.value;
            const _categories = await Category.getResult();
            if (data === "" || data.length === 0 || _categories.length == 0 || input_prompt === "" || _api_key === "" || _model_name === "")
                return { "result": false };

            const response = await modelGenerate(_api_key, input_prompt, _model_name, _categories);
            // {result: 'Here is the output in JSON format:\n\n[{"Comment_ID"…\n{"Comment_ID": "4", "Category_Name": "spoiler"}]'}
            if (!response.result)
                return { "result": false };

            const result = convertJSONToData(response.result);
            if (result.length == 0)
                return { "result": false };
            console.log('popup result', result)
            return result;
        }
    })
);

async function init() {
    let { api_key, model_name } = await chrome.storage.sync.get(["api_key", "model_name"]);
    api_key_input.value = api_key || "";
    model_name_input.value = model_name || "llama3-groq-70b-8192-tool-use-preview";

    GUI_init();
}
window.onload = async () => {
    init();
}