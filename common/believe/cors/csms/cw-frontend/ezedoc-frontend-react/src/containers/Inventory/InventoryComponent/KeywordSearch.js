import Axios from "axios";
import { email_test } from 'containers/Process/ProcessComponents'

const APP_URL = process.env.REACT_APP_APP_URL;

export const handleAssetLoadOptions = (inputText) => {
    return new Promise((resolve, reject) => {
        if (inputText.length > 1) {
            Axios.get(`/api/inventory/asset?search=${inputText}`, {
                headers: { 'Authorization': `JWT ${localStorage.getItem("token")}` }
            }).then(response => {
                let options = response.data.data.map(asset => ({ value: asset.id, label: asset.name, name: "asset" }))
                return resolve(options);
            }).catch(() => {
                return reject();
            })
        } else {
            reject();
        }
    })
}


export const handleLocationLoadOptions = (orgId, inputText) => {
        return new Promise((resolve, reject) => {
            if (inputText.length > 2) {
                Axios.get(`${APP_URL}/${orgId}/locations?search=${inputText}`).then(response => {
                    let options = response.data.data.map(location => ({ value: location.id, label: location.name, name: "location" }))
                    return resolve(options)
                }).catch(() => {
                    return reject()
                })
            } else{
                reject()
        }
        })
    }

export const handleTransferredToLoadOptions = (inputText) => {
    return new Promise((resolve, reject) => {
        if (inputText.length > 2) {
            Axios.get(`/api/locations?search=${inputText}`, {
                headers: { 'Authorization': `JWT ${localStorage.getItem("token")}` }
            }).then(response => {
                let options = response.data.data.map(location => ({ value: location.id, label: location.name, name: "transferredTo" }))
                return resolve(options)
            }).catch(() => {
                return reject()
            })
        } else{
            reject()
    }
    })
}


export const handleSupplierLoadOptions = (inputText) => {
        return new Promise((resolve, reject) => {
            if (inputText.length > 1) {
            Axios.get(`/api/inventory/supplier?search=${inputText}`, {
                headers: { 'Authorization': `JWT ${localStorage.getItem("token")}` }
            }).then(response => {
                let options = response.data.data.map(supplier => ({ value: supplier.id, label: supplier.name, name: "supplier" }))
                return resolve(options)
            }).catch(() => {
                return reject()
            })
        } else{
            reject()
    }
    })
}

export const handleExtUsersLoadOptions = (orgId, inputText) => {
        return new Promise((resolve, reject) => {
            if (inputText.length > 1) {
                Axios.get(`${APP_URL}/${orgId}/users/external_users?search=${inputText}`).then(response => {
                    let options = response.data.data.map(checker => ({ value: checker.id, label: email_test(checker.email) ? `${checker.first_name} ${checker.last_name}` : checker.email , name: "extUser" }))
                    return resolve(options)
                }).catch(() => {
                    return reject()
                })
        } else{
            reject()
    }
    })
}
