import React, {useState , useEffect } from 'react';
import { FormBuilder ,Formio } from "@ezedoxbp/react-formio";
import FileComponent from './Components/File/file'
import TaskOwnerComponent from './Components/TaskOwner/taskOwner'
import ClientInfoComponent from './Components/ClientInfo/clientInfo'
import AadhaarComponent from './Components/Ocr/Aadhaar'
import PanComponent from './Components/Ocr/Pan'
import VideoComponent from './Components/Video/video'
import AadhaarMask from './Components/AadhaarMask/aadhaarMask'
import RazorpayPaymentComponent from './Components/RazorpayPayment/razorpayPayment'
import RAGAnalysis from './Components/RAGAnalysis/RAGAnalysis';
import EducationRecords from './Components/EducationRecords/EducationRecords'
import EmploymentRecords from './Components/EmploymentRecords/EmploymentRecords'
import ProfessionalReferences from './Components/ProfessionalReferences/ProfessionalReferences'

Formio.Components.addComponent('fileComponent',FileComponent)
Formio.Components.addComponent('taskOwnerComponent',TaskOwnerComponent)
Formio.Components.addComponent('clientInfoComponent',ClientInfoComponent)
Formio.Components.addComponent('aadhaarComponent', AadhaarComponent)
Formio.Components.addComponent('panComponent', PanComponent)
Formio.Components.addComponent('videoComponent',VideoComponent)
Formio.Components.addComponent('aadhaarMask',AadhaarMask)
Formio.Components.addComponent('razorpayPaymentComponent', RazorpayPaymentComponent)
Formio.Components.addComponent('ragAnalysis', RAGAnalysis)
Formio.Components.addComponent('educationRecords', EducationRecords)
Formio.Components.addComponent('employmentRecords', EmploymentRecords)
Formio.Components.addComponent('professionalReferences', ProfessionalReferences)

const EzedoxFormBuilder = (props) => {
    const [structure, handleStructure] = useState(props.form);
    useEffect(() => {
        handleStructure(props.form);

        return () => {
            if(window?.videoStream){
                window?.videoStream?.getTracks()?.[0]?.stop();
            }
        }
    }, [props.form])

    return(
        <>  
            <FormBuilder
                form={structure}
                onChange={(data) => handleStructure(data)}
            
            />
            <div className="text_editor_btn_cont">
                <button
                type="button"
                onClick={props.saveAndExit}
                className="fancy_btn active"
                >
                <span>Exit and goto Designer</span>
                </button>
                {props.fixId === props.id ? (
                    <button  
                            type="button" 
                            onClick={() => props.updateVersion(structure)} 
                            className="fancy_btn"
                    >
                        <span>Update current version </span>
                    </button>
                ): (<div/>)}
                
                <button type="button" onClick={() => props.updateNewVersion(structure)} className="fancy_btn ">
                <span>Create as new version </span>
                </button>
            </div>
        </>
    );
}

export default EzedoxFormBuilder;