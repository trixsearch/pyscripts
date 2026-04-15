
// this function will remove all cached task api data on page refresh 
// this function will aslo check if the data is stored 1 hour before or not. if not it won't clear those data.
export const cleanProcessVariableCachedData = () => {
    
    Object.keys(localStorage)?.filter(key => {
        if(key?.startsWith("https")) {
            try {
                const taskData = JSON.parse(localStorage.getItem(key));
                if(taskData?.time <= new Date().getTime() - 60*60*1000){
                    localStorage?.removeItem(key);
                }
            } catch {
                localStorage.removeItem(key)
            }
        }
    });

}