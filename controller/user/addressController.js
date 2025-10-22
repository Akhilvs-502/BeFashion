import mongoose from "mongoose";
import usermodel from "../../models/userModel.js";
import { HttpStatusCode } from "../../shared/constants/HttpStatusCode.js";

export const showAddress = async (req, res) => {
    const user = req.userData
    const dataBase = await usermodel.findOne({ email: req.userData.email })
    res.render('user/address', { user, dataBase })

}


export const addAddress = async (req, res) => {
    try {

        const user = req.userData

        const dataBase = await usermodel.findOne({ email: req.userData.email })

        console.log(req.userData.email);

        res.render('user/addAddress', { user, dataBase })
    }
    catch (err) {

        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: "error getting  address" })

    }
}




export const postAddAddress = async (req, res) => {
    try {
        const user = req.userData

        const { name, phone, pincode, state, locality, city, address, typeofAddress } = req.body

        const addressData = {
            name, phone, pincode, state, locality, city, address, addressType: typeofAddress
        }

        const data = await usermodel.findOneAndUpdate({ email: user.email }, { $push: { address: addressData } }, { new: true })

        if (data) {

            res.status(HttpStatusCode.OK).json({ message: "address updated" })
        }

    }
    catch {

        res.status(HttpStatusCode.BAD_REQUEST).json({ message: "error in adding address" })
    }
}




export const deleteAddress = async (req, res) => {
    try {
        const user = req.userData
        const { addressId } = req.body
        console.log(addressId);

        const data = await usermodel.findOneAndUpdate({ email: user.email }, { $pull: { address: { _id: addressId } } })

        res.status(HttpStatusCode.OK).json({ message: "delete Address" })
    }

    catch {
        res.status(HttpStatusCode.BAD_REQUEST).json({ message: "error in adding address" })

    }
}



export const editAddress = async (req, res) => {
    try {

        const addressID = req.params.addressID

        const user = req.userData

        let dataBase = await usermodel.aggregate([
            { $match: { email: req.userData.email } },
            { $unwind: '$address' },
            { $match: { 'address._id': new mongoose.Types.ObjectId(addressID) } }, { $project: { address: 1 } }
        ]);

        dataBase = dataBase[0]
        
        console.log(dataBase);

        res.render('user/editAddress', { user, dataBase })

    }
    catch {

        res.status(HttpStatusCode.BAD_REQUEST).json({ message: "error edit address" })

    }
}





export const patchAddAddress = async (req, res) => {
    try {

        const { name, phone, pincode, state, locality, city, address, typeofAddress, addressID } = req.body
        const user = req.userData
        const data = await usermodel.findOneAndUpdate({
            email: user.email,
            'address._id': new mongoose.Types.ObjectId(addressID)
        },
            {
                $set: {
                    'address.$.name': name,
                    'address.$.phone': phone,
                    'address.$.pincode': pincode,
                    'address.$.state': state,
                    'address.$.locality': locality,
                    'address.$.city': city,
                    'address.$.addressType': typeofAddress
                },
            },
            { new: true }

        )


        res.json({ messsae: "success" })
    }
    catch {
        res.status(HttpStatusCode.BAD_REQUEST).json({ message: "error in adding address" })

    }

}
