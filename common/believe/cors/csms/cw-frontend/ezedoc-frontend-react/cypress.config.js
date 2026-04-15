const cucumber = require('cypress-cucumber-preprocessor').default
const { defineConfig } = require('cypress');



  module.exports =  defineConfig({
   chromeWebSecurity: false,
     e2e: {

            setupNodeEvents(on, config) {
               on('file:preprocessor', cucumber())
               
           },
    
      specPattern: "cypress/e2e/*.feature",
      supportFile: 'cypress/support/spec.js',
      defaultCommandTimeout: 6000,
      reporter: "cypress-multi-reporters",
      reporterOptions: {
      configFile: "reporter-config.json"
  }
     },
        })

        
