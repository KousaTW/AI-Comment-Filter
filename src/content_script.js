async function sendMessageToPopup(task_name, data){
    return await chrome.runtime.sendMessage({ task: task_name, data: data});
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

const parsedData = {
    maskType: ["NSFW"],
    comments: [],
}

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
 * @property {Function} commentParse - 解析留言DOM
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


        if (author && content) {
            // console.log(`ID ${ID} , Author: ${author} , content:${content}`)
            return { Comment_ID: ID, User_ID: author, Comment: content, status: Status.pending, Category_Name: '' };
        }
        return undefined;
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
                    // console.log(`建立樓層:${this.replyFloorCount + index}F`)
                    expander_contents.setAttribute(this.replyFloorAttr, this.replyFloorCount + index)
                    this.replyDict.set(this.replyFloorCount + index, 1)
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

        if (replyFloor && replyFloor.hasAttribute(this.replyFloorAttr)) {
            return replyFloor.getAttribute(this.replyFloorAttr);
        }
        return false;
    }
}

/**
 * 為找到的留言新增辨識碼
 * @param {HTMLElement} commentDOM - 留言DOM
 * @param {Platform} platform - 瀏覽的平台 Ex:[Youtube] t 
 */
const addAttr2Comment = (commentDOM, platform) => {
    //檢查是否為回覆留言
    const floorNumber = platform.checkFloor(commentDOM)
    if (floorNumber) {
        const currentFloorSerial = platform.replyDict.get(parseInt(floorNumber));
        commentDOM.setAttribute(platform.attr, `${floorNumber}-${currentFloorSerial}`);
        platform.replyDict.set(parseInt(floorNumber), currentFloorSerial + 1);
    } else {
        commentDOM.setAttribute(platform.attr, platform.commentCount)
        platform.commentCount += 1;
    }


}

/**
 * 留言解析方法
 * @callback commentParseCallback
 * @param {HTMLElement} 包含留言的DOM 
 * @returns {CommentObj} 
 */
/**
 * 使用各平台留言方法處理留言
 * @param {Platform} platform - 瀏覽的平台 Ex:[Youtube] 
 * @returns {Array[CommentObj]} 
 */

function processComments(platform) {
    // 建立樓層    
    platform.createFloor();
    // 獲取留言
    let comments = document.querySelectorAll(platform.selector);
    comments = Array.from(comments)
        .filter((comment) => !comment.hasAttribute(platform.attr)) // 過濾出還沒設定commentAttribute的留言
        .map((comment) => {
            addAttr2Comment(comment, platform); // 留言添加Attribute
            return platform.commentParse(comment); // 留言解析
        })
        .filter(comment => comment !== undefined);

    if (comments.length > 0) {
        return comments
    }
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

    if (targetNode) {
        console.log(targetNode);
        observer.observe(targetNode, {
            childList: true,
            subtree: true
        })
    }
}

let timer;
let currentMaskComment = []
let currentCheckedCategorys = new Map()
/**
 * 在限定時間內沒有重複執行則觸發
 * @param {String} videoID 
 * @param {Platform} platform 
 * @param {number} time - 限定時間ms
 */
function sendMessageTimer(videoID, platform, time) {
    if (timer) {
        clearTimeout(timer)
    }
    timer = setTimeout(retrievedComment(videoID, platform), time)
}
/**
 * 接收處理過的資料並儲存在chrome.storage
 * @param {String} videoID chrome.storage儲存的key
 * @param {Platform} platform 
 */
async function retrievedComment(ID, platform) {

    currentMaskComment = await getComments(videoID);
    // const receiveData = [{ 'Comment_ID': '1-1', 'Category_Name': 'NSFW' }]
    const receiveData = sendMessageToPopup()

    currentMaskComment.concat(receiveData)

    chrome.storage.local.set({ [ID]: currentMaskComment }, () => {
        console.log('Comments saved for ID:', ID)
    })

    maskOriginData(ID, platform)
}
/**
 * 送出資料給Popup獲得回傳的資料
 * @returns 
 */
async function sendMessageToPopup() {
    let sendData = []
    parsedData.comments.forEach(commentObj => {
        if (commentObj.status == Status.pending) {
            commentObj.status = Status.done
            const { Comment_ID, Comment } = commentObj
            sendData.push({ "Comment_ID": Comment_ID, 'Comment': Comment })
        }

    })
    return await chrome.runtime.sendMessage({ task: "generate_comment", data: sendData })
}
/**
 * 遮住留言
 * @param {String} videoID 
 * @param {Platform} platform 
 */
async function maskOriginData(videoID, platform) {
    //更新最新設定
    await getComments(videoID);
    await getCheckedCategory();

    currentMaskComment.forEach(comment => {
        if (currentCheckedCategorys.has(comment.Category_Name)) {
            const commentDom = document.querySelector(`[${platform.attr}=${comment.Comment_ID}]`)
            commentDom.classList.add('filterMask')
        }
    })
}

const getComments = (videoID) => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get([videoID], function (result) {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                let gettingComments = result.videoID;

                if (gettingList.length != 0) {
                    currentMaskComment = gettingComments;
                } else {
                    console.log('No Comments found in storage.');
                }
                resolve();
            }
        });
    });
};

const getCheckedCategory = () => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get('checkedCategorys', function (result) {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                let gettingList = result.checkedCategorys;

                if (gettingList.length != 0) {
                    currentCheckedCategorys = new Map(gettingList);
                } else {
                    console.log('No checkedList found in storage.');
                }
                resolve();
            }
        });
    });
};


window.onload = () => {
    if (document.URL.includes("https://www.youtube.com/watch")) {

        const queryParameters = document.URL.split("?")[1];
        const urlParameters = new URLSearchParams(queryParameters);
        const observer = new MutationObserver(async (mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type !== 'childList') {
                    console.log("skip")
                    continue;
                }
                const parsedComments = processComments(Youtube)
                if (parsedComments) {
                    parsedData.comments = [...parsedData.comments, ...parsedComments]

                    const videoID = urlParameters.get('v');

                    sendMessageTimer(videoID, Youtube, 500);
                };
            }
        });
        // 等待找到第一筆留言後 啟動mutation observer
        waitElement(Youtube.selector, () => {
            launchMutationObserver(observer);
        })
    }
}
