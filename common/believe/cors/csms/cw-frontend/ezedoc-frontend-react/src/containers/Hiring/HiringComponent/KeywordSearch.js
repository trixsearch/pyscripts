/* eslint-disable import/prefer-default-export */
import Axios from "axios";

const APP_URL = process.env.REACT_APP_APP_URL;

export const handleJobLoadOptions = (orgId, inputText) => {
    return new Promise((resolve, reject) => {
        if (inputText.length > 1) {
            Axios.get(`${APP_URL}/${orgId}/jobs?search=${inputText}`)
            .then(response => {
                let options = response.data.data.map(job => ({
                    value: job.id,
                    label: job.job_id,
                    name: "job",
                    role_name: job.role_name,
                }))
                return resolve(options);
            }).catch(() => {
                return reject();
            })
        } else {
            reject();
        }
    })
}