/**
 * 留言物件.
 * @typedef {Object} CommentObj
 * @property {string} id - 留言的作者或唯一識別
 * @property {string} content - 留言內容
*/
export const Youtube = {
    /**
     * youtube留言selector
     */
    selector: '#main.style-scope.ytd-comment-view-model'
    ,
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
export function processComments(selector, callback) {
    const elements = document.querySelectorAll(selector);
    return Array.from(elements)
        .map(comment => callback(comment))
        .filter(comment => comment !== undefined);
}
