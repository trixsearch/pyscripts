module.exports ={

    // login data
    userinfo:{
        first: {
            elementType: 'input',
            elementConfig: {
                type: 'text',
                placeholder: ' '
            },
            label: "First Name",
            value: '',
            validation: {
                required: true,
            },
    
            valid: false,
            touched: false
        },
        last: {
            elementType: 'input',
            elementConfig: {
                type: 'text',
                placeholder: ' '
            },
            label: "Last Name",
            value: ' ',
            validation: {
                required: true,
    
            },
            valid: false,
            touched: false
        },
        email: {
            elementType: 'input',
            elementConfig: {
                type: 'email',
                placeholder: ' '
            },
            label: "Company Email ID",
            value: ' ',
            validation: {
                required: true,
                isEmail: true,
            },
    
            valid: false,
            touched: false
        },
        roles: {
            elementType: 'select',
            elementConfig: {
                options: []
            },
            label: "Roles",
            validation: {},
            valid: true
        },
        status: {
            elementType: 'select',
            elementConfig: {
                options: [
                    {value: 'active', displayValue: 'Active'},
                    {value: 'inActive', displayValue: 'InActive'}
                ]
            },
            label: "Status",
            validation: {},
            valid: true
        },
        manager: {
            elementType: 'select',
            elementConfig: {
                options: []
            },
            label: "Manager",
            validation: {},
            valid: true
        },
        department: {
            elementType: 'select',
            elementConfig: {
                options: []
            },
            label: "Department",
            validation: {},
            valid: true
        },
        location: {
            elementType: 'select',
            elementConfig: {
                options: []
            },
            label: "Location",
            validation: {},
            valid: true
        }
    },
    locationInfo:{
        officeLocation: {
            elementType: 'input',
            elementConfig: {
                type: 'text',
                placeholder: ' '
            },
            label: "Office Location",
            value: '',
            validation: {
                required: true,
            },
    
            valid: false,
            touched: false
        },
        locationHead: {
            elementType: 'search',
            elementConfig: {
                type: 'text',
                placeholder: ' ',
                options: [
                   
                ]
            },
            label: "Location Head",
            value: '',
            validation: {},
            valid: true
        },
       
    },
    departmentInfo:{
        departmentName: {
            elementType: 'input',
            elementConfig: {
                type: 'text',
                placeholder: ' '
            },
            label: "Department Name",
            value: '',
            validation: {
                required: true,
            },
    
            valid: false,
            touched: false
        },
        departmentHead: {
            elementType: 'select',
            elementConfig: {
                options: []
            },
            label: "Department Head",
            validation: {},
            valid: true
        },
       
    },
    processType:{
        onGoingProcess:"Ongoing process",
        completedProcess:"Completed process"
    }
,




    // login, signup variables
    email:"email",
    password:"password",
    repeatPassword:"repeatPassword",
    domain:"domain",
    company:"company",
    firstname:"first",
    middlename:"middle",
    lastname:"last",
    
    // base domain
    base_domain:process.env.REACT_APP_HOST_NAME,
    hostname:process.env.REACT_APP_HOST_NAME,     


    emptyLoginSubmit:"Email or Password can't be blank",
    emptyDomainSubmit:"Company Identifier or Company name can't be blank",
    longDomainName:"Company Name's max length is 100",
    DomainNotAvi:'Domain is not available',
    adminMessage:"Please fill in all required fields"
    
}