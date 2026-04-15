
export const parseDate = (inputDate = "") => {
    try {
        let date = new Date(inputDate);

        return date.toLocaleDateString();
    } catch (error) {
        return inputDate;
    }
};


export const formatDate = (date) => {
    try {
        let d = new Date(date);
        let month = `${(d.getMonth() + 1)}`;
        let day = `${d.getDate()}`;
        let year = d.getFullYear();

        if (month.length < 2) month = `0${month}`;
        if (day.length < 2) day = `0${day}`;

        return [year, month, day].join("-");
    } catch (error) {
        return date
    }
};

export const formatDateTime = (datetime) => {
    try {
        let date = new Date(datetime);
        return `${formatDate(datetime)} ${date.toLocaleTimeString()}`
    } catch (error) {
        return datetime
    }
}