import React, { PureComponent } from 'react';
import moment from 'moment';
import ReactTooltip from 'react-tooltip';

import { isMobile } from 'containers/utils';
import pdf from "../../../../assets/images/pdf.svg";
import img from "../../../../assets/images/image2.svg";
import {PROCESS_DATETIME_FORMAT, UPLOADED_DOC, GENERATED_DOC} from "../../../../Data/constants";

const DocumentsTab = ({
  activeDocumentType,
  documentType,
  selectedDocuments
}) => {
  return (
    <li
      role="presentation"
      onClick={() => selectedDocuments(documentType)}
      className={
        activeDocumentType === documentType ? "nav-item active" : "nav-item"
      }
    >
      <a
        role="tab"
        data-toggle="tab"
        aria-selected="true"
        className="nav-link"
        href={`#${documentType}`}
      >
        {documentType}
      </a>
    </li>
  );
};

const DocPreviewerCard = ({
  docURL,
  docName,
  docDate,
  docLabel,
  docAuthor,
  docExtension,
  ...props
}) => (
  <div
    role="presentation"
    className="doc_card"
    onClick={() => window.open(`/api${docURL}`)}
  >
    <div className="upper_part">
      <div className="left_side_part">
        <img
          src={docExtension === "pdf" ? pdf : img}
          alt={docExtension === "pdf" ? "pdf" : "image"}
        />
      </div>
      <div className="right_side_part">
        <p className="doc_name" data-tip data-for={`${props.id}`}>
          {docLabel ? docLabel.toLowerCase() : ""}
        </p>
        {!isMobile() ? (
            <ReactTooltip id={`${props.id}`} place='bottom' delayShow={500} aria-haspopup='true' className="doc_name app_btn_bg_color">
                <p style={{fontWeight: 'normal'}}>{docLabel ? docLabel.toLowerCase() : ""}</p>
            </ReactTooltip>
        ) : null}
        <p className="doc_author">
          <span>{docAuthor ? "By " : ""}</span>
          {docAuthor}
        </p>
        <p className="doc_date">{docDate}</p>
      </div>
    </div>
    <div className="lower_part">
      <p className="doc_fileName" data-tip data-for={`${props.id}_file_name`}>
        <span>{docName}</span>
        {docExtension ? `.${docExtension}` : ""}
      </p>
      {!isMobile() ? (
        <ReactTooltip id={`${props.id}_file_name`} place='bottom' delayShow={500} aria-haspopup='true' className="doc_name app_btn_bg_color">
            <p className="doc_fileName">
              <span>{docName}</span>
              {docExtension ? `.${docExtension}` : ""}
            </p>
        </ReactTooltip>
      ) : null}
    </div>
  </div>
);

const NoDocuments = () => <div className="NoDocs">No records found</div>;

class DocumentDetails extends PureComponent {
  state = {
    activeDocumentType: UPLOADED_DOC
  };

  componentDidMount() {
    if (this.props.fileTags.length > 0) {
      this.setState({
        activeDocumentType: this.props.fileTags[0] === UPLOADED_DOC ? UPLOADED_DOC : GENERATED_DOC
      })
    }
  }

  selectedDocuments = activeDocumentType => {
    this.setState({
      activeDocumentType
    });
  };

  documentNameFormatter = documentName => {
    if (documentName) {
      let docNameArray = documentName.split(".");
      let docName = docNameArray.slice(0, docNameArray.length - 1).join(".");
      let docExtension = docNameArray
        .slice(docNameArray.length - 1, docNameArray.length)
        .join("");
      return [docName, docExtension];
    }
    return ["", ""];
  };

  render() {
    const {
     fileTags,
     doc_data
    } = this.props;
    const { activeDocumentType } = this.state;

    let data = null;
    let docData = null;

    data = doc_data[activeDocumentType];

    if (data) {
      if (data.length > 0) {
        docData = data.map(doc => {
          let docNameData = this.documentNameFormatter(doc.name);

          let docAuthorData = null;
          if (doc.user) {
            if (doc.user.first_name && doc.user.last_name)
              docAuthorData = `${doc.user.first_name} ${doc.user.last_name}`;
            else docAuthorData = doc.user.email ? doc.user.email : null;
          }
          return (
            <DocPreviewerCard
              id={doc.id}
              key={doc.id}
              docURL={doc.file_url}
              docName={docNameData[0]}
              docAuthor={docAuthorData}
              docLabel={doc.file_label}
              docExtension={docNameData[1]}
              docDate={doc.uploaded_at ? moment(doc.uploaded_at).format(PROCESS_DATETIME_FORMAT) : ''}
            />
          );
        });
      } else docData = <NoDocuments />;
    } else {
      docData = <NoDocuments />;
    }

    return (
      <div className="documents_details">
        <ul
          className="nav nav-tabs process_tab_ongoing_comp_ul document_details_tabs"
          role="tablist"
        >
          {fileTags.map((fileTag, idx) => {
            return (
              <DocumentsTab
                // eslint-disable-next-line react/no-array-index-key
                key={idx}
                documentType={fileTag}
                activeDocumentType={activeDocumentType}
                selectedDocuments={this.selectedDocuments}
              />
            )
          })}
        </ul>
        <div className="tab-content document_cards_container">{docData}</div>
      </div>
    );
  }
}

export default DocumentDetails;
