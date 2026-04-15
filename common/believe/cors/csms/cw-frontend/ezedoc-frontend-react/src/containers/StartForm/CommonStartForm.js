import React, {
    lazy,
    Suspense,
    useEffect,
    useMemo,
    useState,
} from 'react'

import Spinner from 'components/UI/Spinner/Spinner'
import { isMobile } from '../utils'
import languageIcon from '../../assets/images/svg/language.svg';

import './startForm.css'

const LazyForm = lazy(() => import('../../components/Formio'))

// This is the common jsx used for Process StartForm & Entity StartForm
const CommonStartForm = props => {
    const [language, setLanguage] = useState('en');

    useEffect(() => {
        if(props.languageData) {
            setLanguage(props.languageData.language ?? 'en');
        }
    }, [props.languageData])

    const langugeOptions = Object.keys(props.languageData?.i18n ?? {})
    const options = useMemo(() => {
        return { 
            readOnly: false,
            viewAsHtml: true,
            language,
            i18n: props?.languageData?.i18n
        }
    }, [language, props?.languageData?.i18n])

    return (
        <Suspense fallback={<Spinner />}>
            <div className='process-form-header form_padding'>
                <div className='form-detail'>
                    <p className='form-name'>{props.name}</p>
                    <p className='form-description'>
                        &nbsp;
                        {props.description}
                    </p>
                    <span className='body_nav_button'>
                        {langugeOptions.length ? (
                            <button className='lang_btn dropdown-toggle' data-toggle='dropdown' type='button'>
                                <img src={languageIcon} alt="language"/>
                            </button>
                        ) : null}
                        <div className='dropdown-menu'>
                            {langugeOptions.map((item) => <button className='dropdown-item' type='button' onClick={()=>setLanguage(item)}>{item}</button>)}
                        </div>
                        {/* <button type='button' onClick={() => setIsPreview((current) => !current)} className='fancy_btn'>
                            {isPreview ? 'Edit' : 'Preview'}
                        </button> */}
                        <button type='button' onClick={props.close} className='fancy_btn form_cancel_btn'>
                            Cancel
                        </button>
                    </span>
                </div>
            </div>
            <div
                className='ezedox-form-page'
                style={
                    !isMobile()
                        ? { maxHeight: window.innerHeight - 110 }
                        : { maxHeight: window.innerHeight - 160 }
                }
            >
                <LazyForm
                    form={props.form}
                    onChange={props.onChange}
                    options={options}
                    onSubmit={props.handleSubmit}
                    submission={props.submissionData}
                />
            </div>
        </Suspense>
    ) 
}

export default CommonStartForm
