const defaultVariables = [
  "entity_name",
  "entity_phone_number",
  "initiator",
  "entity_email",
];

export const filterVariables = (variables = []) => {
  return variables.reduce((acc, variable) => {
    if (defaultVariables.includes(variable.name)) {
      return {
        ...acc,
        [variable.name]: variable.value,
      };
    }
    return acc;
  }, {});
};
