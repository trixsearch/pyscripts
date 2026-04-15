export const getCheckedValue = (permission) => {
    if (permission.reassign||permission.withdraw||permission.upload){
        permission.view = true
    }
    return permission;
}

