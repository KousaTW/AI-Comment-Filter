const defaultCategory = new Map([
    ['Spoiler', `The act of leaking the content of plot-related works (such as novels, TV series, movies, comics, and games, etc). The content usually involves the core of the story, line or ending. Therefore, it is generally believed that readers who have not watched the original work may be less interested in enjoying the original work after learning about the spoiler content. Example: The character will win the race.`],
    ['NSFW', `Content that is not suitable for viewing during working hours and may offend your boss or colleagues. This usually refers to nudity, violence, pornography or offensive remarks.`],
])

export const Category = {
    checkedList: new Map(),
    dict: new Map(),
    maxCheckNum: 5,
    add: function (categoryName) {
        let _fixed = false;
        if (defaultCategory.has(categoryName))
            _fixed = true;
        const _categoryDiv = new categoryDiv(categoryName, _fixed)
        _categoryDiv.deploy(ForeGround.checkbox_container)
    },
    delete: function (categoryName) {
        this.dict.delete(categoryName);
        this.checkedList.delete(categoryName);
        this.saveCheckedList();
        this.saveDict();
    },
    saveCheckedList: function () {
        let _storedCheckedList = Array.from(this.checkedList.entries());
        chrome.storage.local.set({ 'checkedCategorys': _storedCheckedList }, function () {
            console.log('checkedList has been saved on chrom local strage')
        });
    },
    getCheckedList: function () {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get('checkedCategorys', function (result) {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    let _gettingList = result.checkedCategorys;
                    if (_gettingList && _gettingList.length != 0) {
                        resolve(new Map(_gettingList));
                    } else {
                        console.log('No checkedList found in storage.');
                    }
                }
            });
        });
    },
    setDescription: function (categoryName, description) {
        this.dict.set(categoryName, description);
        this.saveDict();
    },
    saveDict: function () {
        let _storedDict = Array.from(this.dict.entries());
        chrome.storage.local.set({ 'categoryDict': _storedDict }, function () {
            console.log('categoryDict has been saved.');
        });
    },
    getDict: function () {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get('categoryDict', function (result) {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError)
                } else {
                    let _gettingDict = result.categoryDict;
                    if (_gettingDict && _gettingDict.length != 0) {
                        resolve(new Map(_gettingDict))
                    } else {
                        console.log('No map found in storage.');
                    }
                }
                resolve(new Map())
            });
        })
    },
    init: async function () {
        const _storeDict = await this.getDict();
        this.dict = new Map([...defaultCategory, ..._storeDict])

        for (let _categoryName of this.dict.keys()) {
            this.add(_categoryName);
        }

        this.maxCheckNum = 5;
        this.checkedList = await this.getCheckedList();
        const _checkboxes = document.querySelectorAll('input[type="checkbox"]');
        _checkboxes.forEach(_checkbox => {
            if (this.checkedList.has(_checkbox.id)) {
                _checkbox.checked = true;
                this.maxCheckNum -= 1;
            }
        })
    },

    getResult: async function () {
        let _result = await this.getCheckedList()
        return Array.from(_result.values())
    }
}

const ForeGround = {
    checkbox_container: document.getElementById("checkbox-container"),
    cate_name_input: document.getElementById("cate-name-input"),
    createCateBtn: document.getElementById("create-category-button"),
    confirmModifyBtn: document.getElementById("confirm-description"),
    init: function () {
        this.createCateBtn.addEventListener('click', () => {
            const _categoryName = this.cate_name_input.value;
            Category.add(_categoryName);
            Category.setDescription(_categoryName, "")
            this.cate_name_input.value = ''
        })
    }
}

const ModifyPage = {
    currentCategory: '',
    page: document.getElementById("category-modify-container"),
    label: document.getElementById("descriptionLabel"),
    textArea: document.getElementById("description"),
    confirmModifyBtn: document.getElementById("confirm-description"),
    update: function (categoryName, fixed) {
        this.label.innerText = `<${categoryName}>描述:`;
        if (fixed) {
            this.textArea.readOnly = true;
        } else {
            this.textArea.readOnly = false;
        }
        this.textArea.value = Category.dict.get(categoryName);

        this.currentCategory = categoryName;
    },
    init: function () {
        this.confirmModifyBtn.addEventListener('click', () => {
            Category.setDescription(this.currentCategory, this.textArea.value)
            // Hide DOM
            this.page.style.display = 'none';
            this.confirmModifyBtn.style.display = 'none';
            // Show DOM
            ForeGround.checkbox_container.style.display = "grid";
            ForeGround.createCateBtn.style.display = 'block'
            // unFreeze DOM
            ForeGround.cate_name_input.readOnly = false;
        })
    }
}

class categoryDiv extends HTMLDivElement {
    /**     
     * @param {String} name - Category Name
     * @param {boolean} fixed - if fixed you cannot delete/modify category 
     */
    constructor(name, fixed = false) {
        super();

        this.name = name;
        this.fixed = fixed;

        this.createCheckBox();
        this.createLabel();
        this.createModifyButton();

        if (!this.fixed)
            this.createDeleteButton();

        this.elementSetup()
    }

    createCheckBox() {
        this.checkbox = document.createElement('input');
        this.checkbox.type = 'checkbox';
        this.checkbox.name = this.name;
        this.checkbox.id = this.name;
        this.checkbox.classList.add('switch');

        this.checkbox.addEventListener('change', this.categoryCheckHandler)
    }

    categoryCheckHandler(event) {
        let _checkbox = event.target;
        if (!_checkbox.checked) {
            Category.maxCheckNum += 1;
            Category.checkedList.delete(_checkbox.id);
            Category.saveCheckedList();
            return;
        }
        if (Category.maxCheckNum > 0) {
            Category.maxCheckNum -= 1;
            Category.checkedList.set(
                _checkbox.id,
                { 'Category_Name': _checkbox.id, 'Description': Category.dict.get(_checkbox.id) }
            )
            Category.saveCheckedList()
        } else {
            _checkbox.checked = false;
            console.error('You can only check 5 category!!')
        }
    }

    createLabel() {
        this.label = document.createElement('label');
        this.label.innerText = this.name
        this.label.setAttribute('for', this.name)
    }

    createModifyButton() {
        this.modifyButton = document.createElement('button');
        this.modifyButton.innerHTML = '<img src=modify.png>';
        this.modifyButton.addEventListener('click', () => {
            ModifyPage.update(this.name, this.fixed)
            // Hide DOM
            ForeGround.checkbox_container.style.display = 'none';
            ForeGround.createCateBtn.style.display = 'none';
            // Show DOM
            ModifyPage.page.style.display = 'flex';
            ForeGround.confirmModifyBtn.style.display = 'block';
            // Freeze DOM
            ForeGround.cate_name_input.readOnly = true;
        })
    }

    createDeleteButton() {
        this.deleteButton = document.createElement('button');
        this.deleteButton.innerHTML = '<img src=delete.png>';
        this.deleteButton.addEventListener('click', () => {
            Category.delete(this.name)
            this.remove();
        })
    }

    elementSetup() {
        this.appendChild(this.checkbox)
        this.appendChild(this.label)
        this.appendChild(this.modifyButton)
        if (!this.fixed)
            this.appendChild(this.deleteButton)
    }

    /**
     * @param {HTMLElement} parentNode 
     */
    deploy(parentNode) {
        parentNode.appendChild(this);
    }
}

customElements.define('category-div', categoryDiv, { extends: 'div' });

const Init = async () => {
    ForeGround.init();
    ModifyPage.init();
    await Category.init();
}
export default Init;