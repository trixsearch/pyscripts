Feature: Dashboard Test Cases 

    User should be able login as valid session

     Scenario: As a User, can able to see Processes, Tasks, Config and Reports tabs on the Dashboard.
       Given User is on Dashboard page
       When  User can view the Processes, Tasks, Config and Reports tabs
       Then  Processes, Tasks, Config and Reports tabs should display correctly

     Scenario: As a User, I should be able to see Workflows dropdown, Process chart, Ongoing Completed Withdrawn Process cards, My Tasks, My Group Tasks, Start Bulk Button and Start New Button on Dashboard.
       Given User is on Dashboard page
       And Click on dropdown
       Then User can view the Workflows dropdown, Process chart, Ongoing Completed Withdrawn Process cards, My Tasks, My Group Tasks, Start Bulk Button and Start New Button

