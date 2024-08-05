import { PROMPT } from "./prompt.js"

const RequestCounter = (() => {
    let currentRequests = 0;
    const maxRequests = 20;
    return {
        increment: () => {
            if (currentRequests < maxRequests) {
                currentRequests++;
                return true;
            }
            return false;
        },
        decrement: () => {
            if (currentRequests > 0) {
                currentRequests--;
            }
        }
    };
})();



function insertCategories(prompt, data) {
    let insertionString = "";
    let other_cat = 0;
    let cate_id = 3;
    data.forEach(item => {
        insertionString += `${cate_id+1}. ${item.Category_Name}: ${item.Description}\n`;
        other_cat = 1; // to check if there are other categories to insert
    });

    let insertPosition = prompt.lastIndexOf('<Filter_Rules>');
    if (other_cat==1) {
        prompt = prompt.slice(0, insertPosition) + insertionString + '\n' + prompt.slice(insertPosition);
    }
    return prompt;
}

/**
 * @param {string} apiKey
 * @param {string} user_prompt
 * @param {string} model
 * @returns {string}
 */
export async function modelGenerate(apiKey, user_prompt, model, individual_categories) {
    const system_prompt = insertCategories(PROMPT, individual_categories);

    if (!RequestCounter.increment()) {
        console.error("Too many requests.");
        return {"result": false};
    }

    try{
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                messages: [{role: "system", content: system_prompt},{ role: "user", content: user_prompt }],
                model: model
            })
        });

        const data = await response.json();
        console.log(data['choices'][0]['message']['content'])
        return {"result": data['choices'][0]['message']['content']};
    }catch(error) {
        console.error("LLM Error:", error);
        return {"result": false};
    }finally {
        RequestCounter.decrement();
    }
}
// Input:
// user_prompt :
//   <Comments_List>
//       <Comments>
//           <Comment_ID>@user1_1-1</Comment_ID>
//           <Comment>This is a comment that contains explicit pornographic content.</Comment>
//       </Comments>
//   </Comments_List>
// individual_categories : [{'Category_Name': 'NSFW', 'Description': '...', 'Checked': true}, {}]


/**
 * @param {Array<Object>} data
 * @param {string} outerTag
 * @param {string} innerTag
 * @returns {string}
 */
export function convertListToXML(data, outerTag, innerTag) {
    try{
        function dictToXML(dict) {
            let xml = '';
            for (const [key, value] of Object.entries(dict)) {
                xml += `<${key}>${value}</${key}>\n`;
            }
            return xml;
        }
    
        let xml = `<${outerTag}>\n`;
        data.forEach(item => {
            xml += `<${innerTag}>`;
            xml += dictToXML(item);
            xml += `</${innerTag}>\n`;
        });
        xml += `</${outerTag}>`;
        return xml;
    }catch(error) {
        console.error("convertListToXML Error:", error);
        return "";
    }
}
// Input:
// [{"Comment_ID": "@user1_1-1", "Comment": "This is a comment that contains explicit pornographic content."}]
// # Output:
// <Comments_List>
//     <Comments>
//         <Comment_ID>@user1_1-1</Comment_ID>
//         <Comment>This is a comment that contains explicit pornographic content.</Comment>
//     </Comments>
// </Comments_List>



/**
 * @param {string} xmlStr
 * @returns {Array<string>}
 */
export function convertJSONToData(xmlStr) {
    const regex = /\[\s*[\s\S]*?\s*\]/g;
    let match = regex.exec(xmlStr);

    if (match !== null) {
        let result = JSON.parse(match);
        return result;
    }
    else{
        return [];
    }
}

// Input:
// [{"id": "asd123", "category": "a"}, {"id": "asd456", "category": "b"}]
// # Output:
// [ { id: 'asd123', category: 'a' }, { id: 'asd456', category: 'b' } ]