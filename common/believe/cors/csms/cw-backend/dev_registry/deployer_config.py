deployer_config = {
    "Jobs" : {
        "name" : "Job",
        "license" : "basic",
        "artifacts" : [
            {
                "name" : "hire_candidate",
                "type" : "App",
                "file" : "dev_registry/Jobs/HireCandidate.zip"
            },
            {
                "name" : "Jobs Workflow",
                "type" : "Workflow",
                "file" : "dev_registry/Jobs/OrganisationWorkflow.json"
            },
            {
                "name" : "updateJoiningStatusApp",
                "type" : "App",
                "file" : "dev_registry/Jobs/UpdateHiringJobDetails.zip"
            },
            {
                "name" : "Jobs Entity View",
                "type" : "EntityView",
                "file" : "dev_registry/Jobs/OrganisationEntityView.json"
            },
            {
                "name" : "Jobs Entity",
                "type" : "OrganisationEntityMasterModel",
                "file" : "dev_registry/Jobs/OrganisationEntityMasterModel.json"
            },
            {
                "name" : "hiring",
                "type" : "App",
                "file" : "dev_registry/Jobs/Hiring.zip"
            },
            {
                "name" : "update_hiring_request",
                "type" : "App",
                "file" : "dev_registry/Jobs/UpdateHiringRequest.zip"
            },
            {
                "name" : "cloneHiringRequestApp",
                "type" : "App",
                "file" : "dev_registry/Jobs/CloneHiringRequestApp.zip"
            },
            {
                "name" : "create_slot_app",
                "type" : "App",
                "file" : "dev_registry/Jobs/CreateSlot.zip"
            },
            {
                "name" : "book_slot_app",
                "type" : "App",
                "file" : "dev_registry/Jobs/BookSlot.zip"
            },
            {
                "name" : "vendor_approval_request_app",
                "type" : "App",
                "file" : "dev_registry/Jobs/VendorApproval.zip"
            },
            {
                "name" : "Jobs HiringState",
                "type" : "HiringState",
                "file" : "dev_registry/Jobs/HiringState.json"
            },
            {
                "name" : "Jobs Forms",
                "type" : "Forms",
                "file" : "dev_registry/Jobs/OrganisationForm.json"
            },
            {
                "name" : "List",
                "type" : "List",
                "file" : "dev_registry/Jobs/OrganisationLists.json"
            }
        ],
        "artifacts_files" : [
            {
                "name" : "Hire Candidate Bulk Files",
                "key" : "hire_candidate",
                "file" : "dev_registry/Jobs/HireCandidateSample.xlsx"
            }
        ]
    }
}