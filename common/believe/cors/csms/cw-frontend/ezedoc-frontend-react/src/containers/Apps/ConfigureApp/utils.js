export const GetCheckedValue = (permission) => {
    if (permission.BulkEmail||permission.Reassign||permission.Withdraw||permission.UploadDocument){
        permission.View = true
    }
    if(permission.DownloadReport){
        permission.ViewReport = true
    }
    return permission;
}
