/**
 * 留言物件.
 * @typedef {Object} CommentObj
 * @property {string} id - 留言的作者或唯一識別
 * @property {string} content - 留言內容
*/
const Youtube = {
    /**
     * youtube留言selector
     */
    selector: '#main.style-scope.ytd-comment-view-model',
    observeTarget: document.querySelector('#below'),
    /**  
     * youtube留言解析方法
     * @param {HTMLElement} ytComment
     * @returns {CommentObj} 
     */
    commentParse: function (ytComment) {
        const id = ytComment.querySelector("h3").textContent.trim()
        const content = ytComment.querySelector("#content-text").textContent.trim()
        if (id && content) {
            return { id: id, content: content };
        }
        return undefined;
    }
}

/**
 * 留言解析方法
 * @callback commentParseCallback
 * @param {HTMLElement} 包含留言的DOM 
 * @returns {CommentObj} 
 */
/**
 * 使用各平台留言解析方法
 * @param {string} selector - 各平台的留言DOM selector
 * @param {commentParseCallback} callback - 留言解析方法
 * @returns {Array<CommentObj>} 
 */
function processComments(selector, callback) {
    const elements = document.querySelectorAll(selector);
    return Array.from(elements)
        .map(comment => callback(comment))
        .filter(comment => comment !== undefined);
}


function waitElement(selector, callback) {
    const element = document.querySelector(selector);
    if (element) {
        callback()
    } else {
        setTimeout(() => {
            waitElement(selector, callback)
        }, 100)
    }
}
/**
 * 啟動觀察者
 * @param {MutationObserver} observer 
 */
function launchMutationObserver(observer){
    // 找到留言區
    const targetNode = document.querySelectorAll('#sections')[1];

    if (targetNode) {
        console.log("獲得留言節點")

        observer.observe(targetNode, {
            childList: true,
            subtree: true
        })
    }
}



window.onload = () => {
    if (document.URL.includes("https://www.youtube.com/watch")) {

        const observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    console.log(processComments(Youtube.selector, Youtube.commentParse))
                }
            }
        });
        // 等待找到第一筆留言後 啟動mutation observer
        waitElement(Youtube.selector, ()=>{
            launchMutationObserver(observer)
        })
    }
}
