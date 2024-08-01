export function get_categories(categories){
    const data_format_list = []
    categories.forEach(category_dom => {
        if (category_dom.checked)
            data_format_list.push({"Category_Name": category_dom.name, "Description": category_dom.getAttribute("description")})
    });
    return data_format_list
}