export const saveToLocalStorage = (state,stateName) =>{
    try {
        const serializedState = JSON.stringify(state);
        localStorage.setItem(stateName, serializedState);
      } catch(e) {
        console.log(e);
        return undefined;
      }
}

export const loadFromLocalStorage = (statePersist) => {
    try {
        let stateTree = {}
            for(let index in statePersist){
                let localStorageName = statePersist[index].localStorageName;
                let stateName = statePersist[index].stateName;
                let serializedState = localStorage.getItem(localStorageName);
                Object.assign(stateTree,{
                    [stateName] : JSON.parse(serializedState)
                })
            }
            return stateTree;
    }catch(e) {
        console.log(e)
        return undefined;
    }
}
