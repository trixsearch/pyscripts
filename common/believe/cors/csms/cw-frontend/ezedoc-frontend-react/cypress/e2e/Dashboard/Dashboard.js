import { Given, When, Then, And } from "cypress-cucumber-preprocessor/steps"


Given("User is on Dashboard page", ()=> {
    cy.url().should("include", "dashboard");
    
})

When("User can view the Processes, Tasks, Config and Reports tabs", ()=> {
    cy.get('.RQd2OBJbLFXu2M946dz8').should('exist')
})

Then("Processes, Tasks, Config and Reports tabs should display correctly", ()=> {
    cy.get('.Header_container').should("exist")
    
})

And("Click on dropdown", ()=> {
    cy.url().should("include", "dashboard");
    
})

Then("User can view the Workflows dropdown, Process chart, Ongoing Completed Withdrawn Process cards, My Tasks, My Group Tasks, Start Bulk Button and Start New Button", ()=> {
    cy.get('.main_changable_container > :nth-child(1)').should('exist')
    
})