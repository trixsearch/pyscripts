import React, { useState } from 'react';
import TagEditor from "react-tageditor";
import Modal from '../../components/Modal';
import './TagEditor.css';

const ArrayEditModal = ({
    show, title, handleClose, handleSubmit, editData, editable
}) => {

    const [tags, setTags] = useState([...editData]);

    const handleChange = (tagsChanged, allTags, action) => {
        setTags(allTags)
    }

    return (
        <Modal
            show={show}
            title={title}
            onClose={handleClose}
            primaryBtn={{ className: editable ? "fancy_btn active" : "hidden", text: "Submit", onClick: () => { handleSubmit(tags.filter(value => (value))) } }}
            secondaryBtn={{ text: editable ? "Cancel" : "Close", className: "fancy_btn", onClick: handleClose }}
        >
            <div style={{ marginTop: -16 }}>
                <div className="form_up_box array-edit-modal" style={{ paddingTop: 8 }}>
                    {editable
                        ? (
                            <TagEditor
                                tags={[...tags]}
                                delimiters={[13, ',']}
                                placeholder="Start typing here ..."
                                onChange={handleChange}
                            />
                        ) : (
                            Array.isArray(tags) && tags.map((tag, index) => (
                                <div
                                    className="tag"
                                    key={`${tag}__${index+1}`}
                                    style={{marginBottom: 12}}
                                >
                                    <span className="tag-view-only" style={{padding: '4px 8px'}}>
                                        {tag}
                                    </span>
                                </div>
                            ))
                        )}
                </div>
            </div>
        </Modal >
    )
}

export default ArrayEditModal;