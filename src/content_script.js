// Control iframe
function open_close_page(){
    const root = document.querySelector("#ai_comments_filter_extension_root");
    if(root){
        root.style.display = root.style.display == "flex" ? "none" : "flex";
    }else{
        createIframe();
    }
}

function createIframe() {
    const root = document.createElement("div");
    root.id = "ai_comments_filter_extension_root";
    root.style.cssText = `
        position: fixed;
        display: flex;
        align-items: flex-start;
        justify-content: flex-end;
        width: 360px;
        height: 280px;
        top:0;
        right:0;
        z-index: 2147483647;
    `;

    const iframe = document.createElement("iframe");
    iframe.id = "iframe-in-root";
    iframe.sandbox = "allow-scripts allow-same-origin allow-forms";
    iframe.setAttribute("allowFullScreen", "");
    iframe.style.cssText = `
        width: 350px;
        height: 275px;
        border: 0;
        margin: 0;
        z-index: 2147483647;
        background-color: #EAEAEA;
        border: 1px solid #EAEAEA;
        filter: none;
        display: block;
    `;
    iframe.src = chrome.runtime.getURL("src/iframe/index.html");
    
    document.body.appendChild(root);
    root.prepend(iframe);
}


/**
 * 留言物件.
 * @typedef {Object} CommentObj
 * @property {string} Comment_ID - 留言ID
 * @property {string} User_ID - 留言的作者
 * @property {string} Comment - 留言內容
 * @property {Number} status - 留言狀態 [ 0:done , 1:mask , 2:pending]
*/
const Status = Object.freeze({
    done: 0,
    mask: 1,
    pending: 2
})

/**
 * @typedef {Object} Platform
 * @property {String} selector - 各平台留言DOM的querySelector
 * @property {String} attr - 自訂的留言DOM ID 用來找尋指定DOM
 * @property {Number} commentCount - 主要留言的計數器
 * @property {String} replySelector - 各平台的回覆區的querySelector
 * @property {String} replyFloorAttr - 自訂的回覆區樓層 Attr 用來確認當前留言的樓層及是否為回覆留言
 * @property {Number} replyFloorCount - 回覆區樓層計數器
 * @property {Map} replyDict - 自訂的回覆留言Map用來計算各樓層的回覆留言順序
 * @property {Function} commentParse - 解析留言DOM
 * @property {Function} createFloor - 為回覆區添加樓層Attr
 * @property {Function} checkFloor - 檢查留言是否為回覆留言並返回樓層
 */

/**
 * @type {Platform}
 */
const Youtube = {
    selector: '#main.style-scope.ytd-comment-view-model',
    attr: "commentID",
    commentCount: 1,
    replySelector: "#replies",
    replyFloorAttr: "replyFloor",
    replyFloorCount: 1,
    replyDict: new Map(),
    /**  
     * youtube留言解析方法
     * @param {HTMLElement} ytComment
     * @returns {CommentObj} 
     */
    commentParse: function (ytComment) {
        const ID = ytComment.getAttribute(this.attr)
        const author = ytComment.querySelector("h3").textContent.trim()
        const content = ytComment.querySelector("#content-text").textContent.trim()

        if (!author || !content)
            return undefined;
        
        return { Comment_ID: ID, User_ID: author, Comment: content, status: Status.pending, Category_Name: '' };
    },
    /**
     * 使用Attr來建立reply的樓層
     */
    createFloor: function () {
        // length 4
        const replyDomArray = Array.from(document.querySelectorAll(this.replySelector))
            .filter(replyDom => !replyDom.hasAttribute("FloorCreate"))
            .map((replyDom, index) => {
                // replyDom #replies每個留言都有
                replyDom.setAttribute("FloorCreate", "true")
                // 確認子元素是否含有#expander-contents
                const expander_contents = replyDom.querySelector('#expander-contents')
                if (expander_contents) {
                    expander_contents.setAttribute(this.replyFloorAttr, this.replyFloorCount + index)
                    this.replyDict.set(parseInt(this.replyFloorCount + index), 1)
                }
            })
        this.replyFloorCount += replyDomArray.length;
    },

    /**
     * 確認是否為reply
     * @param {HTMLElement} ytComment 
     * @returns 回傳樓層 或是 false
     */
    checkFloor: function (ytComment) {
        let replyFloor;
        if (ytComment.parentElement.parentElement.parentElement.parentElement)
            replyFloor = ytComment.parentElement.parentElement.parentElement.parentElement;

        if (replyFloor && replyFloor.hasAttribute(this.replyFloorAttr))
            return replyFloor.getAttribute(this.replyFloorAttr);
        
        return false;
    }
}


const CommentMethod = {
    /**
     * 為找到的留言新增辨識碼
     * @param {HTMLElement} commentDOM - 留言DOM
     * @param {Platform} platform - 瀏覽的平台 Ex:[Youtube] t 
     */
    addAttribute: function (commentDOM, platform) {
        let _floorNumber = platform.checkFloor(commentDOM);
        if (_floorNumber) {
            // Reply Comment
            _floorNumber = parseInt(_floorNumber)
            let _currentFloorNum = platform.replyDict.get(_floorNumber);
            _currentFloorNum = _currentFloorNum;
            commentDOM.setAttribute(platform.attr, `${_floorNumber}-${_currentFloorNum}`);
            // update floor dict
            platform.replyDict.set(_floorNumber, _currentFloorNum + 1);
        } else {
            // Main Comment
            commentDOM.setAttribute(platform.attr, platform.commentCount)
            platform.commentCount += 1;
        }
    },
    /**
     * 使用各平台留言方法處理留言
     * @param {Platform} platform - 瀏覽的平台 Ex:[Youtube] 
     * @returns {Array[CommentObj]} 
     */
    process: function (platform) {
        // 建立樓層
        platform.createFloor();
        // 獲取留言
        let _comments = document.querySelectorAll(platform.selector);
        _comments = Array.from(_comments)
            .filter((_comment) => !_comment.hasAttribute(platform.attr)) // 過濾出還沒設定commentAttribute的留言
            .map((_comment) => {
                this.addAttribute(_comment, platform); // 留言添加Attribute
                return platform.commentParse(_comment); // 留言解析
            })
            .filter(_comment => _comment !== undefined);

        if (_comments.length > 0)
            return _comments
        else
            return []
    }
}

const Global = {
    debug_mode: false,
    timer: null,
    rawComments: [],
    processedComments: [],
    CheckedCategories: new Map()
}

/**
 * 
 * @param {String} selector 
 * @param {Function} callback 
 */
function waitElement(selector, callback) {
    const element = document.querySelector(selector);
    if (element) {
        callback()
    } else {
        setTimeout(() => {
            waitElement(selector, callback);
        }, 100)
    }
}

/**
 * 啟動觀察者
 * @param {MutationObserver} observer 
 */
function launchMutationObserver(observer) {
    // 找到留言區
    const targetNodes = document.querySelectorAll('#sections');
    const index = Array.from(targetNodes).findIndex(target => target.querySelector("#main"));
    const targetNode = targetNodes[index];

    if (!targetNode)
        return;

    if (Global.debug_mode)
        console.log(targetNode);
    observer.observe(targetNode, {
        childList: true,
        subtree: true
    })
}


const getCurrentTime = () => {
    let timeStamp = Date.now()
    let date = new Date(timeStamp)
    return date.toISOString().substr(11, 12)
}

/**
 * 接收處理過的資料並儲存在chrome.storage
 * @param {String} ID chrome.storage儲存的key
 * @param {Platform} platform 
 */
async function retrievedComment(ID, platform) {
    // 獲得儲存的處理過資料
    Global.processedComments = await getComments(ID);
    // 接收新處理的資料
    if (Global.debug_mode)
        console.log(`%cRetrieved - ${getCurrentTime()}`, 'font-size: 20px; color: blue; background-color: pink;');
    
    const _receiveData = await sendMessageToPopup()
    if (Global.debug_mode)
        console.log('_receiveData', _receiveData)
    
    // 結合資料
    if (_receiveData && _receiveData.length > 0){
        Global.processedComments = [...Global.processedComments, ..._receiveData]
        // 儲存資料
        setComments(ID, Global.processedComments)
    }
    // 根據資料遮住留言
    await maskOriginData(platform)
}
/**
 * 送出資料給Popup獲得回傳的資料
 * @returns 
 */
async function sendMessageToPopup() {
    let _sendData = []
    Global.rawComments.forEach(_commentObj => {
        if (_commentObj.status == Status.pending) {
            // 修改狀態
            _commentObj.status = Status.done;
            // 擷取資訊
            const { Comment_ID, Comment } = _commentObj;
            _sendData.push({ "Comment_ID": Comment_ID, 'Comment': Comment });
        }
    })

    if (_sendData.length == 0)
        return [];

    if (Global.debug_mode)
        console.log('_sendData :', _sendData)

    const _result = await chrome.runtime.sendMessage({ task: "generate_comment", data: _sendData });
    
    if (Global.debug_mode)
        console.log('_result :', _result)
    return _result
}
/**
 * 遮住留言
 * @param {String} videoID 
 * @param {Platform} platform 
 */
async function maskOriginData(platform) {
    //更新最新設定
    Global.CheckedCategories = await getCheckedCategory();

    if (Global.debug_mode)
        console.log('Global.processedComments', Global.processedComments)

    Global.processedComments.forEach(_comment => {
        const  _category = _comment.Category || _comment.Category_Name;
        if (!Global.CheckedCategories.has(_category))
            return;

        const _commentDom = document.querySelector(`[${platform.attr}="${_comment.Comment_ID}"]`)
        _commentDom.classList.add('filterMask')
        if (Global.debug_mode)
            console.log(`mask on [${platform.attr}="${_comment.Comment_ID}"]`)
    })
}

const setComments = (ID, commentData) => {
    chrome.storage.local.set({ [ID]: commentData }, () => {
        if (Global.debug_mode)
            console.log('Comments saved for ID:', ID)
    })
}

const getComments = (videoID) => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get([videoID], function (result) {
            if (chrome.runtime.lastError)
                resolve([])
            
            const _gettingComments = result.videoID;
            if (!_gettingComments || gettingList.length == 0)
                resolve([]);

            resolve(_gettingComments);
        });
    });
};

const getCheckedCategory = () => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get('checkedCategories', function (result) {
            if (chrome.runtime.lastError) 
                resolve(new Map([]));
            
            const gettingList = result.checkedCategories;
            if (!gettingList || gettingList.length == 0)
                resolve(new Map([])); 
            
            resolve(new Map(gettingList));
        });
    });
};

document.body.addEventListener("keydown", (e)=>{
    if(e.key == "x")
        open_close_page();
}, false)

window.onload = () => {
    open_close_page();
    
    const queryParameters = document.URL.split("?")[1];
    const urlParameters = new URLSearchParams(queryParameters);
    const observer = new MutationObserver(async (mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type !== 'childList')
                continue;
            
            const _videoID = urlParameters.get('v')
            clearTimeout(Global.timer)
            if (Global.debug_mode)
                console.log('clear Timeout', getCurrentTime())

            Global.timer = setTimeout(function () {
                retrievedComment(_videoID, Youtube)
            }, 500)

            const _parsedComments = CommentMethod.process(Youtube)
            if (_parsedComments)
                Global.rawComments = [...Global.rawComments, ..._parsedComments]
        }
    });
    // 等待找到第一筆留言後 啟動mutation observer
    waitElement(Youtube.selector, async () => {
        launchMutationObserver(observer);
    })
}
