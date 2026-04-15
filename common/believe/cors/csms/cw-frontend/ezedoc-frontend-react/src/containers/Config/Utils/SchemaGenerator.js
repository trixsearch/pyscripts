import * as Yup from 'yup';

function getValidationSchema(components) {
    const dynamicSchema = components.reduce((acc, component) => {
        if (['string', 'number', 'date'].some(type => type === component.type)) {
            if (component.required) {
                return {
                    ...acc,
                    [component.key]: Yup[component.type]().required(`${component.label} is Required`).nullable()
                }
            }
        } else if (component.type === 'list' && component.required) {
            return {
                ...acc,
                [component.key]: Yup.string().required(`${component.label} is Required`).nullable()
            }
        }
        return acc
    }, {})
    return dynamicSchema;
}

export default getValidationSchema;