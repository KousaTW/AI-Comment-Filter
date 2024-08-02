import { modelGenerate, convertListToXML } from "./utils/LLM.js"

// fore-ground
const checkbox_container = document.getElementById("checkbox-container")
const modify_container = document.getElementById("category-modify-container")
const description_label = document.getElementById("descriptionLabel")
const description_textArea = document.getElementById("description")

// back-ground
const openSettingBtn = document.getElementById("open-setting-button");
const setting = document.getElementById("setting");
const api_key_input = document.getElementById("api-key-input");
const model_name_input = document.getElementById("model-name-input");
// footer
const cate_name_input = document.getElementById("cate-name-input")
const createCateBtn = document.getElementById("create-category-button")
const confirmDefiniBtn = document.getElementById("confirm-description")

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


chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.task === "generate_comment") {
        console.log("get task")
        const data = [{"Comment_ID": "1", "Comment": "殺了他"}, {"Comment_ID": "2", "Comment": "我的天啊"}, {"Comment_ID": "3", "Comment": "大奶主播"}, {"Comment_ID": "4", "Comment": "主角會死"}]
        // const data = request.data;
        const input_prompt = convertListToXML(data, "Comments_List", "Comments");
        const _api_key = api_key_input.value;
        const _model_name = model_name_input.value;
        const _categories = await processData()

        if (data === "" || input_prompt === "" || _api_key === "" || _model_name === ""){
            sendResponse({"result": false});
            return;
        }
        print(_categories)
        const response = await modelGenerate(_api_key, input_prompt, _model_name, _categories);
        console.log('response:',  response)
        // {result: 'Here is the output in JSON format:\n\n[{"Comment_ID"…\n{"Comment_ID": "4", "Category_Name": "spoiler"}]'}
        sendResponse(response);
    }

    sendResponse({"result": "Something Error"});
    return true;
});


// modifyData
let currentCategoryDict = new Map()
let currentModifyCategory = ''
// checkboxData
let maxCategory = 5
let currentCheckedCategorys = new Map()

const checkboxInit = async () => {
    await getCheckedList();
    maxCategory = 5

    const categoryCheckboxs = document.querySelectorAll('input[type="checkbox"]');
    categoryCheckboxs.forEach(checkbox => {

        checkbox.removeEventListener('change', categoryCheckHandler);

        // 記憶勾選
        if (currentCheckedCategorys.has(checkbox.id)) {
            checkbox.checked = currentCheckedCategorys.has(checkbox.id);
            maxCategory -= 1;
        }
        // 添加event
        checkbox.addEventListener('change', categoryCheckHandler);
    });
};

const categoryCheckHandler = (event) => {
    // 沒勾選
    let checkbox = event.target
    if (!checkbox.checked) {
        maxCategory += 1;
        currentCheckedCategorys.delete(checkbox.id)
        saveCheckedList()
        return;
    }
    if (maxCategory > 0) {
        maxCategory -= 1;
        currentCheckedCategorys.set(
            checkbox.id,
            { 'Category_Name': checkbox.id, 'Description': currentCategoryDict.get(checkbox.id) }
        )
        saveCheckedList()
    } else {
        checkbox.checked = false;
        console.log('space not enough')
    }
}

const saveCheckedList = () => {
    let storedCheckedList = Array.from(currentCheckedCategorys.entries());

    chrome.storage.local.set({ 'checkedCategorys': storedCheckedList }, function () {
        console.log('storedCheckedList has been saved.');
    });
}

const getCheckedList = () => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get('checkedCategorys', function (result) {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                let gettingList = result.checkedCategorys;
                if (gettingList && gettingList.length != 0) {
                    currentCheckedCategorys = new Map(gettingList);
                    // console.log(currentCheckedCategorys);
                } else {
                    console.log('No checkedList found in storage.');
                }
                resolve();
            }
        });
    });
};

createCateBtn.addEventListener("click", () => {
    const categoryName = cate_name_input.value;
    addCategory(categoryName);
    setDescription(categoryName, "")
    cate_name_input.value = ''
})
// 確認修改定義
confirmDefiniBtn.addEventListener("click", () => {
    // modifyData
    setDescription(currentModifyCategory, description_textArea.value)
    // not show
    modify_container.style.display = 'none';
    confirmDefiniBtn.style.display = 'none';
    // show
    checkbox_container.style.display = "grid";
    createCateBtn.style.display = 'block'
    cate_name_input.readOnly = false;

})

const categoryInit = async () => {
    await getCategory();
    for (let categoryName of currentCategoryDict.keys()) {
        addCategory(categoryName);
    }
}

// 獲取storage資料
const getCategory = () => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get('categoryDict', function (result) {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError)
            } else {
                let gettingDict = result.categoryDict;
                if (gettingDict && gettingDict.length != 0) {
                    currentCategoryDict = new Map(gettingDict);
                } else {
                    console.log('No map found in storage.');
                }
            }
            resolve()
        });
    })

}
// 更新顯示內容
const updateModifyContainer = (categoryName) => {
    description_label.innerText = `<${categoryName}>定義:`
    description_textArea.value = currentCategoryDict.get(categoryName)
}
// 設定類別定義並同步
const setDescription = (categoryName, categoryDefinition) => {

    currentCategoryDict.set(categoryName, categoryDefinition);
    let storedDict = Array.from(currentCategoryDict.entries());

    chrome.storage.local.set({ 'categoryDict': storedDict }, function () {
        console.log('categoryDict has been saved.');
    });
}

const deleteCategory = (categoryName) => {
    currentCategoryDict.delete(categoryName);
    currentCheckedCategorys.delete(categoryName);
    saveCheckedList()
    checkboxInit()
    let storedDict = Array.from(currentCategoryDict.entries());

    chrome.storage.local.set({ 'categoryDict': storedDict }, function () {
        console.log('categoryDict has been saved.');
    });
}
// 添加類別div
const addCategory = (categoryName) => {
    const cateDiv = document.createElement("div")

    cateDiv.innerHTML = `
    <input type="checkbox" name="${categoryName}" id="${categoryName}" class="switch" > 
    <label for="${categoryName}">${categoryName}</label>    
    `
    const optionDiv = document.createElement("div")
    optionDiv.classList.add("optionsContainer")

    const modifyBtn = document.createElement("button")
    modifyBtn.innerHTML = `<img src=modify.png>`;
    modifyBtn.addEventListener("click", () => {
        // modifyData
        currentModifyCategory = categoryName;
        updateModifyContainer(currentModifyCategory);

        // not show
        checkbox_container.style.display = "none";
        createCateBtn.style.display = 'none';

        // show
        modify_container.style.display = 'flex';
        confirmDefiniBtn.style.display = 'block';
        cate_name_input.readOnly = true;
    })

    const deleteBtn = document.createElement("button")
    deleteBtn.innerHTML = `<img src=delete.png>`;
    deleteBtn.addEventListener("click", () => {
        deleteCategory(categoryName)
        cateDiv.remove();
        optionDiv.remove()
    })
    optionDiv.appendChild(modifyBtn)
    optionDiv.appendChild(deleteBtn)

    checkbox_container.appendChild(cateDiv)
    checkbox_container.appendChild(optionDiv)

    checkboxInit()
}

const processData = async() => {
    await getCategory()
    return Array.from(currentCheckedCategorys.values())
}


async function init() {
    let { api_key, model_name } = await chrome.storage.sync.get(["api_key", "model_name"]);
    api_key_input.value = api_key || "";
    model_name_input.value = model_name || "llama3-70b-8192";

    categoryInit();
    checkboxInit();

    console.log( await processData());
}
window.onload = async () => {
    init();
}