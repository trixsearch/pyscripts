### `Create file with name '.env' in the same directory as src`

### `Create a file with name 'cypress.env.json' in the same directory as src`

`Your project structure should like this`

├── cypress<br/>
├── public<br/>
├── src<br/>
├── cypress.json<br/>
├── .env<br/>
├── cypress.env.json<br/>
├── package.json<br/>
├── jsconfig.json<br/>
├── README.md<br/>
├── package.json<br/>
├── workbox-config.js<br/>
└── yarn.lock

Add These variables in `.env` file

```
PORT=3000
PUBLIC_URL=/org
WDS_SOCKET_PATH=/sockjs-node/org
REACT_APP_HOST_NAME=codzelocal.com
REACT_APP_CRISP_WEBSITE_ID=a46cc898-13ec-49ec-a40d-0c43db47c451
REACT_APP_BRAND=ezeDox
REACT_APP_ONPREM=false
REACT_APP_APPVERSION=$npm_package_appVersion
REACT_APP_SUPPORT=contact@ezedox.com
REACT_APP_LOG_URL=https://chat.googleapis.com/v1/spaces/AAAA_dR7vZw/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=adyidElA3_rBGKsZh3zSazBh7JVxXEacPZQ5_tENEkc%3D
REACT_APP_RZP_KEY=
REACT_APP_HJID=
REACT_APP_HJSV=
REACT_APP_DIGILOCKER_CLIENT_ID=
REACT_APP_JOB_EVENT_BANNER_TEMPLATE_KEY=
REACT_APP_APP_URL=/api/cw
PUBLIC_PATH=http://localhost:8092/
REACT_APP_IDENTITY_BASE_URL=https://accounts-dev.betterplace.co.in/api/identity
REACT_APP_CLIENT_KEY=26983f00-1469-4721-988f-3baca47fcu74
REACT_APP_GOOGLE_MAP_API=AIzaSyC4BxcYGavNtFyNw67_xibopjpg3mszwr4
REACT_APP_ADMIN_BASE_URL=https://cwadmin-dev.betterplace.co.in
```

Add below JSON in `cypress.env.json` and replace email and password with valid credentials.

```
{
	"email": "ayush.vijayvargiya@go-better.com",
	"password": "@yusH@1234",
	"baseUrl": "https://platform-qa.betterplace.co.in",
	"appUrl": "https://platform-qa.betterplace.co.in/custom-workflow/org/${tenantid}/dashboard",
	"integrationFolder": "cypress/e2e"
}
```

---

`To install all the packages, in your local dev environment`

## `yarn`

## Available Scripts

**To run the Application in development mode**

## `yarn start`

**To run Application in test environment, to instrument test coverage.
( do not use 'yarn start', this is mandatory while running tests in local machine)**

## `yarn start-test`

**To run cypress tests in browser**

## `yarn test-cy`

**To run cypress in headless mode [No Browser], test results and output will be logged to console and videos will be added into cypress/videos directory.**

## `yarn test-cy-cli`

**To run cypress with any custom options**

## `yarn cypress` <followed by options>

Examples:

**Exactly same as 'yarn test-cy'**

1.  ## `yarn cypress open`

**You can specify a path to a JSON file where configuration values are set. This defaults to cypress.json.**

2.  ## `yarn cypress run --config-file <path to custom config>`

Further reading for, configuration.

[https://docs.cypress.io/guides/guides/command-line.html#Installation]

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: https://facebook.github.io/create-react-app/docs/code-splitting

### Analyzing the Bundle Size

This section has moved here: https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size

### Making a Progressive Web App

This section has moved here: https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app

### Advanced Configuration

This section has moved here: https://facebook.github.io/create-react-app/docs/advanced-configuration

### Deployment

This section has moved here: https://facebook.github.io/create-react-app/docs/deployment

### `yarn build` fails to minify

This section has moved here: https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify

# `Happy Hacking!!!`
