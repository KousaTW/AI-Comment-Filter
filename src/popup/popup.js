// fore-ground
const expose_filter = document.querySelector('#expose');
const violence_filter = document.querySelector('#violence');
const nsfw_filter = document.querySelector('#nsfw');
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
})
api_key_input.addEventListener("input", (e) => {
    const { value } = e.currentTarget;
    chrome.storage.sync.set({ api_key: value });
})
model_name_input.addEventListener("input", (e) => {
    const { value } = e.currentTarget;
    chrome.storage.sync.set({ model_name: value });
})


async function init() {
    let { api_key, model_name } = await chrome.storage.sync.get(["api_key", "model_name"]);
    api_key_input.value = api_key || "";
    model_name_input.value = model_name || "llama3-70b-8192";
}
window.onload = async () => {
    init();
}