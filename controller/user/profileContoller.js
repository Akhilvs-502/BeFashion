import usermodel from "../../models/userModel.js"


export const profile = async (req, res) => {
    const user = req.userData
    const dataBase = await usermodel.findOne({ email: user.email })
    res.render('user/profile', { user: dataBase, dataBase })
}



export const editProfile = async (req, res) => {
    try {

        const user = req.userData
        const dataBase = await usermodel.findOne({ email: req.userData.email })
        console.log(req.userData.email);

        res.render('user/editProfile', { user, dataBase })
    }
    catch {
        const user = req.userData
        res.render('user/editProfile', { user, dataBase: null })

    }
}



export const patchEditProfile = async (req, res) => {
    try {

        let { name, email, phone, dob, altPhone, gender } = req.body
        console.log(gender + "s");

        console.log(name, email, phone, dob, altPhone, gender);
        await usermodel.updateOne({ email: email }, { name: name })
        if (phone) {
            console.log("phone");

            await usermodel.updateOne({ email: email }, { phone })
        }
        if (dob) {
            await usermodel.updateOne({ email: email }, { dob })
        }
        if (altPhone) {

            await usermodel.updateOne({ email: email }, { alternativePhone: altPhone })
        }
        if (gender) {
            console.log("working");
            console.log(gender);
            const user = await usermodel.updateOne({ email: email }, { gender })
        }
        res.json({ message: 'successfully updated profile' })
    }
    catch {
        res.status.json({ message: "error in update profile" })
    }
}
