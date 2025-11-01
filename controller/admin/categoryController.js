



export const category = async (req, res) => {
    try {

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;


        const totalCategories = await categoryModel.countDocuments();


        const categories = await categoryModel.find().skip(skip).limit(limit)

        res.render('admin/category', {
            categories: categories,
            totalPages: Math.ceil(totalCategories / limit),
            currentPage: page,
            limit: limit
        })

    } catch (err) {
        res.status(500).json({ message: "Error fetching categories", error: err });
    }


}




export const addCategory = (req, res) => {
    res.render('admin/addCategory')
}



export const postAddCategory = async (req, res) => {
    try {

        const { categoryName } = req.body
        const category = await categoryModel.findOne({ categoryName: categoryName })
        console.log(category);

        if (!category) {
            console.log(category);
            const newCategory = new categoryModel({
                categoryName: categoryName
            })
            await newCategory.save()
        }


        res.json({ message: 'category added' })
    }
    catch {
        res.status(409).json({ message: "err" })
    }
}



export const blockCategory = async (req, res) => {
    try {

        const { category } = req.body
        console.log(category);
        const sucess = await categoryModel.findOne({ categoryName: category })
        console.log(sucess);

        if (sucess.block) {
            await categoryModel.findOneAndUpdate({ categoryName: category }, { block: false })
            res.json({ message: sucess })
        } else {
            await categoryModel.findOneAndUpdate({ categoryName: category }, { block: true })
            res.json({ message: sucess })

        }
    }
    catch {

    }
}



export const editCategory = (req, res) => {
    const category = req.params.category
    req.session.category = category
    res.render('admin/editCategory', { category })

}


export const postEditCategory = async (req, res) => {
    try {

        const oldCategory = req.session.category
        const { categoryName } = req.body
        console.log(categoryName);
        await categoryModel.findOneAndUpdate({ categoryName: oldCategory }, { categoryName: categoryName })
        console.log(oldCategory);
        res.json({
            message: 'Edited'
        })
    } catch {

    }

}