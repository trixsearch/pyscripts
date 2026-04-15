
// Base styles for all components where react-select is used.
export const reactSelectStyles = {
    container: (styles) => ({
        ...styles,
        width: '100%',
        position: 'relative'
    }),
    input: (styles) => ({
        ...styles,
        height: 34,
        color: "var(--main-first-primary-color)",
        padding: "4px 0"
    }),
    menu: (styles) => ({
        ...styles,
        maxHeight: "100",
        overflowY: "auto",
        marginBottom: 0,
        position: 'initial'
    }),
    menuList: (styles) => ({
        ...styles,
        maxHeight: "unset",
    }),
    option: (styles) => ({
        ...styles,
        fontSize: 14
    }),
    placeholder: (styles) => ({
        ...styles,
        fontSize: 14
    }),
    control: (base, state) => ({
        ...base,
        border: state.isFocused ? "1px solid #9b9b9b" : "1px solid #9b9b9b",
        "&:focus": {
            border: state.isFocused ? "1px solid #9b9b9b" : "1px solid #9b9b9b"
        },
        boxShadow: state.isFocused ? "1px solid #9b9b9b" : "",
        "&:hover": {
            border: state.isFocused ? "1px solid #9b9b9b" : ""
        }
    })
}

export const copyUsersStyles = {
    ...reactSelectStyles,
    menu: (styles) => ({
        ...styles,
        maxHeight: "100",
        overflowY: "auto",
        marginBottom: 120,
        position: 'absolute'
    }),
    menuList: (styles) => ({
        ...styles,
        maxHeight: 100,
        overflowY: "auto",
        position: 'relative',
        marginBottom: 0,
        zIndex: 99999
    })
}

// Styles for selcting manager in create/edit user form page.
export const userFormStyles = {
    ...reactSelectStyles,
    menuList: (styles) => ({
        ...styles,
        maxHeight: 90,
        position: 'relative'
    }),
    menu: (styles) => ({
        ...styles,
        ...reactSelectStyles.menu,
        position: 'absolute'
    })
}

// Styles for portal page, 1.associate workflow and 2.associate content, components
// extending baseStyles and overriding them when required. 
export const portalPageStyles = {
    ...reactSelectStyles,
    menuList: (styles) => ({
        ...styles,
        maxHeight: 120
    })
}

// Styles for react-select component in configure workflow (permissions for user/group) 
// and task reassign modal.
export const customStyles = {
    ...reactSelectStyles,
    input: (styles) => ({
        ...styles,
        ...reactSelectStyles.input,
        height: 28,
    }),
    menu: (styles) => ({
        ...styles,
        ...reactSelectStyles.menu,
        maxHeight: 120,
        position: "absolute",
        top: '70%'
    }),
    option: (styles) => ({
        ...styles,
        fontSize: 11
    }),
    menuList: (styles) => ({
        ...styles,
        maxHeight: 120
    })
};


export const customSchedular = {
    container: (styles) => ({
        ...styles,
        width: '100%',
        position: 'relative'
    }),
    input: (styles) => ({
        ...styles,
        height: 34,
        color: "var(--main-first-primary-color)",
        padding: "4px 0"
    }),
    menu: (styles) => ({
        ...styles,
        maxHeight: "100",
        overflowY: "auto",
        marginBottom: 0,
        position: 'initial',
        zIndex: 1
    }),
    menuList: (styles) => ({
        ...styles,
        maxHeight: "unset",
        zIndex: 9999,
        backgroundColor: "#fff",
        border: "1px solid #ccc"
    }),
    option: (styles) => ({
        ...styles,
        fontSize: 14
    }),
    placeholder: (styles) => ({
        ...styles,
        fontSize: 14
    }),
    control: (base, state) => ({
        ...base,
        border: state.isFocused ? "1px solid #9b9b9b" : "1px solid #9b9b9b",
        "&:focus": {
            border: state.isFocused ? "1px solid #9b9b9b" : "1px solid #9b9b9b"
        },
        boxShadow: state.isFocused ? "1px solid #9b9b9b" : "",
        "&:hover": {
            border: state.isFocused ? "1px solid #9b9b9b" : ""
        }
    })
}

export const searchableLocationFilterStyles = {
    ...reactSelectStyles,
    input: styles => ({
        ...styles,
        ...reactSelectStyles.input,
        height: 27,
    }),
    menu: styles => ({
        ...styles,
        ...reactSelectStyles.menu,
        position: 'absolute'
    }),
    control: (base, state) => ({
        ...base,
        borderRadius: 5,
        minHeight: 'unset',
        border: state.isFocused ? '1px solid #9b9b9b' : '1px solid #9b9b9b',
        '&:focus': {
            border: state.isFocused ? '1px solid #9b9b9b' : '1px solid #9b9b9b'
        },
        boxShadow: state.isFocused ? '1px solid #9b9b9b' : '',
        '&:hover': {
            border: state.isFocused ? '1px solid #9b9b9b' : ''
        }
    }),
    singleValue: styles => ({
        ...styles,
        fontSize: 14,
    })
}
