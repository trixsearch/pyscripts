import React from 'react';
import '../../../containers/Auth.css';

export default ({
    className, type, name, errors, touched, values, handleChange, handleBlur, label, labelId, ...props
}) => {
    return (
        <div className={`floating-label displayBlock ${className || ''}`}>
            <input
                id={name}
                placeholder=" "
                type={type || "text"}
                name={name}
                className={errors[name] && touched[name] ? 'floating-input Invalid' : 'floating-input'}
                value={values[name] || ''}
                onChange={handleChange}
                onBlur={handleBlur}
                {...props}
            />
            <label htmlFor={name} style={{opacity: 1}} >{label}</label>
            {errors[name] && touched[name]
                ? <span className="errorStyle">{errors[name]}</span>
                : <span className="errorStyle">&nbsp;</span>
            }
        </div>
    )
}