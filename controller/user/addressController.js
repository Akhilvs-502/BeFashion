import mongoose from "mongoose";
import usermodel from "../../models/userModel.js";
usermodel

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
    catch {

    }
}




export const postAddAddress = async (req, res) => {
    try {
        const user = req.userData
        const { name, phone, pincode, state, locality, city, address, typeofAddress } = req.body
        console.log(name, phone, pincode, state, locality, city, address, typeofAddress);
        const addressData = {
            name, phone, pincode, state, locality, city, address, addressType: typeofAddress
        }

        const data = await usermodel.findOneAndUpdate({ email: req.userData.email }, { $push: { address: addressData } }, { new: true })
        if (data) {
            res.json({ message: "address updated" })
        }

    }
    catch {
        res.status(400).json({ message: "error in adding address" })
    }
}




export const deleteAddress = async (req, res) => {
    try {
        const user = req.userData
        const { addressId } = req.body
        console.log(addressId);

        const data = await usermodel.findOneAndUpdate({ email: req.userData.email }, { $pull: { address: { _id: addressId } } })
        res.json({
            message: "delete Address"

        })
    }

    catch {

    }
}



export const editAddress = async (req, res) => {
    try {

        const addressID = req.params.addressID
        console.log(addressID);
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
        console.log(data);

        res.json({
            messsae: "success"
        })
    }
    catch {

    }

}
