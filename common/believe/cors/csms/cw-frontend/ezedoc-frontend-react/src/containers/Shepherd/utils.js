export const defaultTourOptions = {
    defaultStepOptions: {
        cancelIcon: {
            enabled: true // Enabling the close icon at the top right corner on the each step
        },
        canClickTarget: false, // Disabling the click event for the highlighted element on the each step
    },
    useModalOverlay: true, // Enabling the background overlay for the tour
    keyboardNavigation: true, // Enabling the keyboard navigation (say go next, go previous using arrow keys) for the tour
}

const ShowBackButton = (index, steps) => {
    if (index === 0) return false

    let selectedSteps = steps.slice(0, index)
    let show = selectedSteps.some(step => document.querySelector(step.element))
    return show
}

const PrimaryButtonTextSetter = (index, steps) => {
    if (index === steps.length - 1) return 'Done'

    let selectedSteps = steps.slice(index + 1)
    let showNext = selectedSteps.some(step => document.querySelector(step.element))
    return showNext ? 'Next' : 'Done'
}

const StepButtons = (index, steps) => {
    let isShowBackBtn = false;
    let primaryBtnText = '';
    
    isShowBackBtn = ShowBackButton(index, steps)
    primaryBtnText = PrimaryButtonTextSetter(index, steps)

    let backButton = {
        classes: 'shepherd-button-secondary',
        text: 'Back',
        type: 'back'
    }

    let primaryButton = {
        classes: 'shepherd-button-primary',
        text: 'Next',
        type: 'next'
    }

    let buttons = []
    
    if (primaryBtnText) primaryButton.text = primaryBtnText
    if (isShowBackBtn) buttons.push(backButton)
    buttons.push(primaryButton)

    return buttons
}

const StepCreator = (index, step, steps) => {
    let Step;
    if (step.element) {
        Step = {
            id: `step-${index + 1}`,
            attachTo: {
                element: step.element,
                on: `${step.position ? step.position : 'auto'}`
            },
            classes: `custom-class-name-${index + 1} ${step.extraClassName ? step.extraClassName : ''}`,
            highlightClass: `highlight-${index + 1}`,
            title: `${step.title ? step.title : ''}`,
            text: `${step.text ? step.text : ''}`,
            buttons: StepButtons(index, steps),
            showOn: () => document.querySelector(step.element)
        }
    }
    return Step
}

export const StepsCreator = (steps) => {
    let Steps = []
    steps.map((step, index) => {
        let newStep = StepCreator(index, step, steps)
        if (newStep) Steps.push(newStep)
        return null
    })
    return Steps
}
