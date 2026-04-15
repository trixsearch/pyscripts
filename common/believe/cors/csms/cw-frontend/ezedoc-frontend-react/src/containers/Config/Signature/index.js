import React, { useState, useEffect, useRef } from "react";
import { connect } from "react-redux";

import { Button } from "components/UI/AppButton/AppButton";

import SignaturePad from "signature_pad";
import axios from "axios";
import { SyncOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";

import {
  profileGet,
  signaturephotoUpdate,
  signaturedrawphotoUpdate,
} from "../../../store/actions/index";
import "./signature.css";
import "react-phone-input-2/dist/style.css";

const APP_URL = process.env.REACT_APP_APP_URL;

const Signature = (props) => {
  const can = useRef(null);
  const drawRef = useRef(null);
  const uploadRef = useRef(null);
  const addRef = useRef(null);
  const displayRef = useRef(null);
  const uploadImgRef = useRef(null);
  const signAddRef = useRef(null);
  const changeSignRef = useRef(null);
  const saveSignRef = useRef(null);
  const uploadButton = useRef(null);
  const drawButton = useRef(null);

  let cs = changeSignRef.current;
  let ss = saveSignRef.current;
  let ds = displayRef.current;
  let a = addRef.current;
  let u = uploadRef.current;
  let d = drawRef.current;
  let uploadImg = uploadImgRef.current;
  let uploadRadio = uploadButton.current;
  let drawRadio = drawButton.current;

  const profile = props.profile;
  const userId = props.userId;
  const { uuid: orgId } = useParams();
  const [showDrawSignature, setDrawSignature] = useState(false);
  const [showUploadSignature, setUploadSignature] = useState(false);
  const [file, setFile] = useState({ urll: "" });
  const [signImage, setSignImage] = useState({ urll: "" });
  const [signaturePad2, setSignaturePad2] = useState(null);
  const [displayButton, setDisplayButton] = useState(true);

  const { getProfile } = { ...props };

  useEffect(() => {
    getProfile(orgId, userId);
  }, [getProfile, orgId]);

  const getImage = () => {
    let timestamp = `?${new Date().getTime()}`;

    const url = `${APP_URL}/${orgId}/users/org_users/${userId}/signature${timestamp}`;
    axios({
      method: "get",
      url,
      responseType: "blob",
    })
      .then((response) => {
        if (response.data !== 0) {
          const fileReaderInstance = new FileReader();
          fileReaderInstance.readAsDataURL(response.data);
          fileReaderInstance.onload = () => {
            const base64data = fileReaderInstance.result;
            setSignImage({ urll: base64data });
          };
        }
      })
      .catch(() => {});
  };

  const sign = profile.signaturePhoto;

  useEffect(() => {
    if (sign) {
      getImage();
    }
  }, [sign]);

  useEffect(()=>getImage(),[]);

  const updateSignature = () => {
    cs.style.display = "block";
    ss.style.display = "none";
    ds.style.display = "block";
    a.style.display = "none";
    uploadRadio.checked = false;
    drawRadio.checked = false;
    uploadImg.style.display = "none";
    d.style.display = "none";
    u.style.display = "none";
    setDisplayButton(true);

    if (showDrawSignature) {
      if (signaturePad2.isEmpty() === false) {
        let drawSign = signaturePad2.toDataURL("image/png");

        let data = {
          signaturePhoto: drawSign,
          id: userId,
        };

        props.signaturedrawphotoUpdate(orgId, data);
      }
    }

    if (showUploadSignature) {
      let uploadSign = signImage.urll;
      if (uploadSign !== "null") {
        let data = {
          signaturePhoto: uploadSign,
          id: userId,
        };

        props.signaturephotoUpdate(orgId, data);
      }
    }
  };

  const changeSignature = () => {
    cs.style.display = "none";
    a.style.display = "block";
    ds.style.display = "none";
  };

  const uploadSignature = () => {
    setUploadSignature(true);
    setDrawSignature(false);
    setDisplayButton(true);

    u.style.display = "block";
    d.style.display = "none";
    ss.style.display = "block";
  };

  const drawSignature = () => {
    ss.style.display = "block";
    uploadImg.style.display = "none";

    setDrawSignature(true);
    setUploadSignature(false);
    setDisplayButton(true);
    d.style.display = "block";
    u.style.display = "none";
    const img = new SignaturePad(can.current, {
      penColor: "rgb(0, 0, 0)",
    });
    setSignaturePad2(img);
  };

  useEffect(() => {
    if (signaturePad2 !== null) {
      signaturePad2.addEventListener(
        "afterUpdateStroke",
        () => {
          setDisplayButton(false);
        },
        { once: true }
      );
    }
  }, [signaturePad2]);

  const handleUpload = (e) => {
    uploadImg.style.display = "block";
    setSignImage({ urll: e.target.files[0] });
    setFile({ urll: URL.createObjectURL(e.target.files[0]) });
    setDisplayButton(false);
  };

  const clearSignature = () => {
    signaturePad2.clear();
    setDisplayButton(true);
    signaturePad2.addEventListener(
      "afterUpdateStroke",
      () => {
        setDisplayButton(false);
      },
      { once: true }
    );
  };

  return (
    <>
      <div className="manage_profile_cont">
        <div className="row">
          <div className="col-md-12 p-0">
            <div className="row">
              <div className="col-md-5 p-0">
                <div className="row">
                  <div className="col-md-12">
                    <br />
                    <br />
                  </div>
                  <div className="col-md-6 pl-0">
                    <h5>Signature : </h5>
                    <div
                      className="change-signature"
                      ref={changeSignRef}
                      style={{ display: "block" }}
                    >
                      <Button
                        variant="link"
                        onClick={() => {
                          changeSignature();
                        }}
                      >
                        Change Signature
                      </Button>
                    </div>
                  </div>
                  <div className="col-md-6 ">
                    <img
                      className="signature-image"
                      ref={displayRef}
                      src={signImage.urll ? signImage.urll : ""}
                      alt=""
                      style={{ display: "block" }}
                    />
                  </div>

                  <div
                    className=" col-md-12 signature-add__container p-0"
                    ref={signAddRef}
                    style={{ display: "block" }}
                  >
                    <div
                      className="signature-add__type-selection my-3"
                      ref={addRef}
                      style={{ display: "none" }}
                    >
                      <div className="row">
                      <div className="col-lg-6 col-md-6"> 
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="signatureType"
                          id="newSignatureUpload"
                          ref={uploadButton}
                          value="upload"
                          onClick={() => {
                            uploadSignature();
                          }}
                        />
                        <label
                          className="form-check-label"
                          htmlFor="newSignatureUpload"
                        >
                          Upload Signature
                        </label>

                        <div
                          className="signature-add__upload my-3"
                          ref={uploadRef}
                          style={{ display: "none" }}
                        >
                          <div className="btn btn-sm btn-primary">
                            <label className="signature-upload-label">
                              Choose File
                              <input
                                accept="image/jpeg,image/jpg,image/png,"
                                type="file"
                                style={{ display: "none" }}
                                onChange={handleUpload}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                      </div> 

                      <div className="col-lg-6 col-md-6"> 
                      <div className="form-check form-check-inline">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="signatureType"
                          id="newSignatureDraw"
                          ref={drawButton}
                          value="draw"
                          onClick={() => {
                            drawSignature();
                          }}
                        />
                        <label
                          className="form-check-label"
                          htmlFor="newSignatureDraw"
                        >
                          Draw Signature
                        </label>
                      </div>
                      </div>
                      </div>

                      <div className="row d-flex justify-content-center">
                      <div className="signature-add__img-container col-lg-12 col-md-12">
                        <img
                          className="signature-add__img"
                          id="uploadedSignatureImg"
                          ref={uploadImgRef}
                          src={file.urll ? file.urll : ""}
                          alt=""
                          style={{ display: "none" }}
                        />
                      </div>
                      </div>

                      <div
                        className="signature-add__draw my-3 col-md-12"
                        id="sg"
                        ref={drawRef}
                        style={{ display: "none" }}
                      >
                        <div id="signature-pad" className="signature-pad">
                          <div className="signature-pad--body d-flex">
                            <canvas ref={can} />
                          </div>
                          <div className="signature-pad--footer">
                            <div className="text-center signature-pad--text">
                              Sign above
                            </div>
                            <button
                              type="button"
                              className="btn signature-clear"
                              data-action="clear"
                              title="Clear Signature"
                            >
                              <SyncOutlined
                                style={{ color: "red" }}
                                onClick={() => {
                                  clearSignature();
                                }}
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="profile-details__row d-flex form-group justify-content-center ">
                      <div
                        className="signature-save-btn"
                        ref={saveSignRef}
                        style={{ display: "none" }}
                      >
                        <Button
                          variant="primary"
                          onClick={() => {
                            updateSignature();
                          }}
                          disabled={displayButton}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const mapStateToProps = ({ profile, auth, orgLogo }) => ({
  org: orgLogo,
  profile: profile,
  userId: auth.id,
});

const mapDispatchToProps = (dispatch) => ({
  getProfile: (orgId, userId) => dispatch(profileGet(orgId, userId)),
  signaturephotoUpdate: (orgId, data) => dispatch(signaturephotoUpdate(orgId, data)),
  signaturedrawphotoUpdate: (orgId, data) => dispatch(signaturedrawphotoUpdate(orgId, data)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Signature);
