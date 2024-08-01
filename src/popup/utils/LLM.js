import { PROMPT } from "./prompt.js"

/**
 * @param {string} apiKey
 * @param {string} user_prompt
 * @param {string} model
 * @returns {string}
 */
export async function modelGenerate(apiKey, user_prompt, model , individual_categories) {
    function insertCategories(prompt, data) {
        let insertionString = "7. Here are other category you need to classify and identify";
        let other_cat = 0;
        data.forEach(item => {
            insertionString += `, ${item.Category_Name} : ${item.Description}`;
            other_cat = 1;
        });

        let insertPosition = prompt.lastIndexOf('</Filter_Rules>');

        if (other_cat==1) {
          prompt = prompt.slice(0, insertPosition) + insertionString + '\n' + prompt.slice(insertPosition);
        }

        return prompt;
    }

    const system_prompt = insertCategories(PROMPT, individual_categories);
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
        return {"result": data['choices'][0]['message']['content']};
    }catch(error) {
        console.error("LLM Error:", error);
        return {"result": false};
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
export function convertXMLToData(xmlStr) {
    const regex = /\[.*?\]/g;
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