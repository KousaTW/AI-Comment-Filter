// # 預期輸入
// <Comments_List>
//     <Comments>
//         <Comment_ID>1</Comment_ID>
//         <Comment>This is a comment that contains explicit pornographic content.</Comment>
//     </Comments>
//     <Comments>
//         <Comment_ID>2</Comment_ID>
//         <Comment>This is a comment that contains explicit pornographic content.</Comment>
//     </Comments>
// </Comments_List>

// # 預期輸出
// <filtered_Comments>
//     <Comment_ID>1</Comment_ID>
//     <Comment_ID>2</Comment_ID>
// </filtered_Comments>




export const PROMPT = `

# Instructions #
Base on a string of <Comment> and corresponding <Comment_ID> in XML format <Comments_List> tags. Follow the <Filter_Rules> to identify and mark comments.

# Categories and Definitions #
1. Normal: The contents of these messages are usually general discussions, questions, and comments without any special tagging requirements. This type of message can be a friendly exchange, advice or a general word of thanks.
2. Spoiler: The act of leaking the content of plot-related works (such as novels, TV series, movies, comics, and games, etc). The content usually involves the core of the story, line or ending. Therefore, it is generally believed that readers who have not watched the original work may be less interested in enjoying the original work after learning about the spoiler content. Example: The character will win the race.
3. NSFW: Content that is not suitable for viewing during working hours and may offend your boss or colleagues. This usually refers to nudity, violence, pornography or offensive remarks.

<Filter_Rules>
1. Carefully read through each comment in the <Comments_List>.
2. Identify and classify any comments that contain categories in # Categories and Definitions #.
3. For each problematic comment you identify, output the <Comment_ID> as result.
4. Do not modify or mark comments that do not contain pornographic or violent content.
5. Only mark comments that are clearly and unambiguously pornographic or violent. Do not mark comments that are merely suggestive or mildly aggressive.
</Filter_Rules>

# Output Format #
After marking all comments, provide your output in the json format as follows:

[{"Comment_ID": "Put ID that you marked here", "Category_Name": "Put category that you marked here"}]
`